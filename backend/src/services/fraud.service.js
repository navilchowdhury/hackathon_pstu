const Transaction = require('../models/Transaction');
const { RISK_LEVEL, TRANSACTION_STATUS, HIGH_AMOUNT_THRESHOLD } = require('../config/constants');

const MEDIUM_AMOUNT_THRESHOLD = 20000;
const VELOCITY_WINDOW_MS = 60 * 60 * 1000;
const VELOCITY_COUNT_LIMIT = 5;

/**
 * Scores a proposed transfer before it is committed.
 * Higher scores mean more unusual behaviour relative to typical wallet usage.
 */
async function assessRisk({ senderId, receiverId, amount }) {
  const factors = [];
  let score = 0;

  if (amount > HIGH_AMOUNT_THRESHOLD) {
    score += 40;
    factors.push('High transfer amount');
  } else if (amount > MEDIUM_AMOUNT_THRESHOLD) {
    score += 20;
    factors.push('Above-average transfer amount');
  }

  const priorWithReceiver = await Transaction.countDocuments({
    sender: senderId,
    receiver: receiverId,
    status: TRANSACTION_STATUS.SUCCESS,
  });

  if (priorWithReceiver === 0) {
    score += 30;
    factors.push('First transfer to this recipient');
  }

  const since = new Date(Date.now() - VELOCITY_WINDOW_MS);
  const recentCount = await Transaction.countDocuments({
    sender: senderId,
    status: { $in: [TRANSACTION_STATUS.SUCCESS, TRANSACTION_STATUS.PENDING] },
    createdAt: { $gte: since },
  });

  if (recentCount >= VELOCITY_COUNT_LIMIT) {
    score += 25;
    factors.push('Unusual transfer velocity in the last hour');
  }

  const avgResult = await Transaction.aggregate([
    {
      $match: {
        sender: senderId,
        status: TRANSACTION_STATUS.SUCCESS,
      },
    },
    { $group: { _id: null, avg: { $avg: '$amount' }, count: { $sum: 1 } } },
  ]);

  const history = avgResult[0];
  if (history && history.count >= 3 && amount > history.avg * 3) {
    score += 15;
    factors.push('Amount far above personal average');
  }

  score = Math.min(100, score);

  let level = RISK_LEVEL.LOW;
  if (score >= 60) level = RISK_LEVEL.HIGH;
  else if (score >= 30) level = RISK_LEVEL.MEDIUM;

  return { score, level, factors };
}

module.exports = { assessRisk };
