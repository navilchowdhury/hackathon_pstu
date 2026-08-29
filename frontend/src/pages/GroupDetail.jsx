import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { groupApi } from '../api';
import { extractError } from '../api/client';
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui';
import { formatBDT, formatDate, statusTone } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [expense, setExpense] = useState({ amount: '', description: '', paidBy: '' });
  const [payId, setPayId] = useState('');
  const [password, setPassword] = useState('');

  const apply = (payload) => setData(payload);

  const load = () => {
    groupApi.get(id).then((res) => apply(res.data.data));
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <p className="text-slate-500">Loading group…</p>;

  const { group, expenses, settlements, summary, balances } = data;
  const isCreator = group.createdBy?._id === user?.id || group.createdBy === user?.id;

  const addMember = async (e) => {
    e.preventDefault();
    try {
      const res = await groupApi.addMember(id, { identifier: memberId.trim() });
      apply(res.data.data);
      setMemberId('');
      toast.success('Member added');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await groupApi.addExpense(id, {
        amount: Number(expense.amount),
        description: expense.description,
        paidBy: expense.paidBy || undefined,
      });
      apply(res.data.data);
      setExpense({ amount: '', description: '', paidBy: '' });
      toast.success('Expense added');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    try {
      const res = await groupApi.pay(id, payId, { password });
      apply(res.data.data);
      setPayId('');
      setPassword('');
      await refresh();
      toast.success('Paid from your wallet');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const deleteGroup = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try {
      await groupApi.remove(id);
      toast.success('Group deleted');
      navigate('/app/groups');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={group.name}
        subtitle={`${summary.memberCount} members · total ${formatBDT(summary.total)} · equal share ${formatBDT(summary.share)}`}
        actions={
          data.canDelete ? (
            <Button type="button" variant="danger" onClick={deleteGroup}>
              Delete group
            </Button>
          ) : null
        }
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {balances.map((row) => {
          const outstanding = Number(row.remaining) || 0;
          const settled = Math.abs(outstanding) < 0.01;
          return (
            <Card key={row.user._id} className="p-4">
              <p className="font-semibold text-navy-800">{row.user.name}</p>
              <p className="text-xs text-slate-500">{row.user.email}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Paid for expenses</dt>
                  <dd>{formatBDT(row.paid)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Fair share</dt>
                  <dd>{formatBDT(row.share)}</dd>
                </div>
                {row.settledPaid > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Paid to members</dt>
                    <dd className="text-rose-600">{formatBDT(row.settledPaid)}</dd>
                  </div>
                )}
                {row.settledReceived > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Received from members</dt>
                    <dd className="text-emerald-600">{formatBDT(row.settledReceived)}</dd>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <dt>{settled ? 'Status' : outstanding > 0 ? 'Still to receive' : 'Still owes'}</dt>
                  <dd className={settled ? 'text-emerald-600' : outstanding > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {settled ? 'Settled' : formatBDT(Math.abs(outstanding))}
                  </dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-navy-800">Add expense</h2>
          <form className="mt-4 space-y-3" onSubmit={addExpense}>
            <Input
              label="Amount (BDT)"
              type="number"
              min="1"
              required
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
            />
            <Input
              label="Note"
              placeholder="Hotel, lunch, tickets…"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Paid by</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                value={expense.paidBy}
                onChange={(e) => setExpense({ ...expense, paidBy: e.target.value })}
              >
                <option value="">Me</option>
                {group.members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <Button>Add expense</Button>
          </form>
        </Card>

        {isCreator && (
          <Card className="p-6">
            <h2 className="font-semibold text-navy-800">Add member</h2>
            <p className="mt-1 text-xs text-slate-500">Only before the first expense is logged.</p>
            <form className="mt-4 flex gap-3" onSubmit={addMember}>
              <div className="flex-1">
                <Input
                  placeholder="email or wallet ID"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>
              <Button>Add</Button>
            </form>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-800">Settlement requests</h2>
          {settlements.length === 0 ? (
            <EmptyState title="No settlements yet" subtitle="Add expenses to generate who-owes-whom requests." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {settlements.map((s) => {
                const owes = s.to?._id === user?.id;
                return (
                  <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium">
                        {s.to?.name} pays {s.from?.name} {formatBDT(s.amount)}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(s.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={statusTone(s.status === 'PAID' ? 'SUCCESS' : s.status)}>{s.status}</Badge>
                      {s.status === 'PENDING' && owes && payId !== s._id && (
                        <Button type="button" className="text-xs" onClick={() => setPayId(s._id)}>
                          Pay from wallet
                        </Button>
                      )}
                    </div>
                    {payId === s._id && (
                      <form className="flex w-full items-end gap-3" onSubmit={pay}>
                        <div className="max-w-xs flex-1">
                          <Input
                            label="Confirm password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <Button>Confirm pay</Button>
                        <Button type="button" variant="secondary" onClick={() => setPayId('')}>
                          Cancel
                        </Button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-800">Expenses</h2>
          {expenses.length === 0 ? (
            <EmptyState title="No expenses" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <li key={e._id} className="flex justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{e.description || 'Expense'}</p>
                    <p className="text-xs text-slate-500">
                      {e.paidBy?.name} paid · {formatDate(e.createdAt)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatBDT(e.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
