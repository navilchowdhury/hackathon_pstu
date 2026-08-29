import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { walletApi, transactionApi } from '../api';
import { extractError } from '../api/client';
import { Button, Card, Input, PageHeader } from '../components/ui';
import TwoFactorSetup from '../components/TwoFactorSetup';
import { formatBDT } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function SendMoney() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [form, setForm] = useState({
    recipient: '',
    amount: '',
    description: '',
    password: '',
    twoFactorToken: '',
  });
  const [askCode, setAskCode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    walletApi.get().then((res) => setWallet(res.data.data));
  }, [isAdmin]);

  const amount = Number(form.amount) || 0;
  const remaining = wallet?.dailyRemaining ?? 0;
  const detailsReady =
    amount > 0 &&
    form.recipient.trim() &&
    form.password.trim() &&
    amount <= remaining &&
    amount <= (wallet?.balance || 0);
  const canSend = detailsReady && form.twoFactorToken.trim().length === 6;

  const summary = useMemo(
    () => [
      { label: 'Recipient', value: form.recipient || '—' },
      { label: 'Amount', value: amount ? formatBDT(amount) : '—' },
      { label: 'Note', value: form.description || 'None' },
    ],
    [form.recipient, form.description, amount]
  );

  if (isAdmin) {
    return <Navigate to="/app/admin" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!detailsReady) return;

    if (!askCode) {
      setAskCode(true);
      return;
    }

    if (!canSend) return;
    setLoading(true);
    try {
      const res = await transactionApi.send({
        recipient: form.recipient.trim(),
        amount,
        description: form.description,
        password: form.password,
        twoFactorToken: form.twoFactorToken.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      const txn = res.data.data.transaction;
      toast.success(`Sent ${formatBDT(amount)}`);
      setForm((prev) => ({ ...prev, password: '', twoFactorToken: '' }));
      setAskCode(false);
      navigate(`/app/transactions/${txn.transactionId}`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Send money"
        subtitle="Confirm with your password and a Google Authenticator code."
        actions={<TwoFactorSetup />}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Receiver email or wallet ID"
              placeholder="karim@securepay.com or SP-XXXXXXXXXX"
              required
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            />
            <Input
              label="Amount (BDT)"
              type="number"
              min="1"
              step="1"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              label="Transaction note"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label="Confirm with your password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {askCode && (
              <Input
                label="6-Digit Security Code (Google Authenticator)"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="000000"
                value={form.twoFactorToken}
                onChange={(e) =>
                  setForm({ ...form, twoFactorToken: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
              />
            )}
            {amount > remaining && (
              <p className="text-sm text-rose-600">
                This amount exceeds your remaining daily limit of {formatBDT(remaining)}.
              </p>
            )}
            <Button className="w-full" disabled={loading || !detailsReady || (askCode && !canSend)}>
              {loading ? 'Processing…' : askCode ? 'Send now' : 'Send money'}
            </Button>
          </form>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-navy-800">Transfer summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {summary.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="text-right font-medium">{row.value}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="text-slate-500">Wallet balance</dt>
              <dd className="font-semibold">{formatBDT(wallet?.balance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Daily remaining</dt>
              <dd className="font-semibold">{formatBDT(remaining)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
