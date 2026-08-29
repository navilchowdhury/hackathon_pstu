import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { requestApi } from '../api';
import { extractError } from '../api/client';
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui';
import { formatBDT, formatDate, statusTone } from '../utils/format';
import { useAuth } from '../context/AuthContext';

function requestTone(status) {
  if (status === 'PAID') return 'success';
  if (status === 'DECLINED' || status === 'CANCELLED') return 'danger';
  return statusTone(status);
}

export default function RequestMoney() {
  const { isAdmin, refresh } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [form, setForm] = useState({ recipient: '', amount: '', description: '' });
  const [payId, setPayId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    requestApi.list().then((res) => {
      setIncoming(res.data.data.incoming);
      setOutgoing(res.data.data.outgoing);
    });
  };

  useEffect(() => {
    if (!isAdmin) load();
  }, [isAdmin]);

  if (isAdmin) return <Navigate to="/app/admin" replace />;

  const create = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestApi.create({
        recipient: form.recipient.trim(),
        amount: Number(form.amount),
        description: form.description,
      });
      toast.success('Request sent');
      setForm({ recipient: '', amount: '', description: '' });
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    try {
      await requestApi.pay(payId, { password });
      setPayId('');
      setPassword('');
      await refresh();
      load();
      toast.success('Paid from your wallet');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const decline = async (id) => {
    try {
      await requestApi.decline(id);
      load();
      toast.success('Request declined');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const cancel = async (id) => {
    try {
      await requestApi.cancel(id);
      load();
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Request money"
        subtitle="Ask another SecurePay user to pay you. They confirm with their password."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-navy-800">New request</h2>
          <form className="mt-4 space-y-4" onSubmit={create}>
            <Input
              label="From (email or wallet ID)"
              placeholder="karim@securepay.com"
              required
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            />
            <Input
              label="Amount (BDT)"
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              label="Note"
              placeholder="Optional reason"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send request'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-800">Requests to you</h2>
            {incoming.length === 0 ? (
              <EmptyState title="No incoming requests" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {incoming.map((r) => (
                  <li key={r._id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {r.requester?.name} asked for {formatBDT(r.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.description || 'No note'} · {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <Badge tone={requestTone(r.status)}>{r.status}</Badge>
                    </div>
                    {r.status === 'PENDING' && payId !== r._id && (
                      <div className="mt-3 flex gap-2">
                        <Button type="button" className="text-xs" onClick={() => setPayId(r._id)}>
                          Pay from wallet
                        </Button>
                        <Button type="button" variant="secondary" className="text-xs" onClick={() => decline(r._id)}>
                          Decline
                        </Button>
                      </div>
                    )}
                    {payId === r._id && (
                      <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={pay}>
                        <div className="min-w-[12rem] flex-1">
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
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-800">Your requests</h2>
            {outgoing.length === 0 ? (
              <EmptyState title="You have not requested money yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {outgoing.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium">
                        {formatBDT(r.amount)} from {r.payer?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.description || 'No note'} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={requestTone(r.status)}>{r.status}</Badge>
                      {r.status === 'PENDING' && (
                        <Button type="button" variant="secondary" className="text-xs" onClick={() => cancel(r._id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
