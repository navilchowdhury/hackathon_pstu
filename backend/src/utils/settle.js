/**
 * Equal-split balances and greedy (min-transfer) settlement.
 * Example: A 100, B 30, C 80 → B pays A 30 and C 10.
 */

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function idKey(id) {
  return String(id);
}

function computeExpenseNets(memberIds, expenses) {
  const paid = {};
  memberIds.forEach((id) => {
    paid[idKey(id)] = 0;
  });

  let total = 0;
  for (const expense of expenses) {
    const key = idKey(expense.paidBy._id || expense.paidBy);
    if (paid[key] === undefined) continue;
    paid[key] += Number(expense.amount);
    total += Number(expense.amount);
  }

  total = round2(total);
  const count = memberIds.length;
  const share = count ? round2(total / count) : 0;

  const nets = memberIds.map((id) => {
    const key = idKey(id);
    return {
      id: key,
      paid: round2(paid[key] || 0),
      share,
      net: round2((paid[key] || 0) - share),
    };
  });

  return { total, share, nets };
}

function applyPaidSettlements(nets, paidSettlements) {
  const copy = nets.map((row) => ({ ...row }));
  const byId = Object.fromEntries(copy.map((row) => [row.id, row]));

  for (const settlement of paidSettlements) {
    const creditor = byId[idKey(settlement.from._id || settlement.from)];
    const debtor = byId[idKey(settlement.to._id || settlement.to)];
    if (!creditor || !debtor) continue;
    creditor.net = round2(creditor.net - settlement.amount);
    debtor.net = round2(debtor.net + settlement.amount);
  }

  return copy;
}

function greedySettlements(nets) {
  const creditors = nets
    .filter((row) => row.net > 0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => b.net - a.net);
  const debtors = nets
    .filter((row) => row.net < -0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => a.net - b.net);

  const requests = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(-debtors[i].net, creditors[j].net));
    if (pay <= 0) break;

    requests.push({
      from: creditors[j].id,
      to: debtors[i].id,
      amount: pay,
    });

    debtors[i].net = round2(debtors[i].net + pay);
    creditors[j].net = round2(creditors[j].net - pay);

    if (Math.abs(debtors[i].net) < 0.01) i += 1;
    if (Math.abs(creditors[j].net) < 0.01) j += 1;
  }

  return requests;
}

module.exports = {
  round2,
  computeExpenseNets,
  applyPaidSettlements,
  greedySettlements,
};
