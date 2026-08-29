import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Send, Receipt, ShieldAlert, HandCoins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { walletApi } from '../api';
import { Badge, Card, PageHeader, EmptyState } from '../components/ui';
import TwoFactorSetup from '../components/TwoFactorSetup';
import { formatBDT, formatDate, statusTone } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([walletApi.get(), walletApi.history({ limit: 6 })])
      .then(([w, h]) => {
        setWallet(w.data.data);
        setRecent(h.data.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const usedPct = wallet ? Math.min(100, (wallet.dailyUsed / wallet.dailyLimit) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Overview of your SecurePay wallet"
        actions={<TwoFactorSetup />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white lg:col-span-2">
          <p className="text-sm text-slate-300">Available balance</p>
          <p className="mt-2 text-4xl font-extrabold">{formatBDT(wallet?.balance ?? user?.walletBalance)}</p>
          <p className="mt-4 text-sm text-slate-400">Wallet ID · {wallet?.walletId || user?.walletId}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-slate-300">Total sent</p>
              <p className="mt-1 font-bold">{formatBDT(wallet?.totalSent)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-slate-300">Total received</p>
              <p className="mt-1 font-bold">{formatBDT(wallet?.totalReceived)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-500">Daily transfer limit</p>
          <p className="mt-2 text-2xl font-bold text-navy-800">{formatBDT(wallet?.dailyRemaining)}</p>
          <p className="text-sm text-slate-500">remaining of {formatBDT(wallet?.dailyLimit)}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{formatBDT(wallet?.dailyUsed)} used today</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/app/send" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-brand-200">
          <Send className="text-brand-600" size={20} />
          <p className="mt-3 font-semibold">Send money</p>
          <p className="text-sm text-slate-500">Transfer to email or wallet ID</p>
        </Link>
        <Link to="/app/request" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-brand-200">
          <HandCoins className="text-brand-600" size={20} />
          <p className="mt-3 font-semibold">Request money</p>
          <p className="text-sm text-slate-500">Ask another user to pay you</p>
        </Link>
        <Link to="/app/transactions" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-brand-200">
          <Receipt className="text-brand-600" size={20} />
          <p className="mt-3 font-semibold">Transaction history</p>
          <p className="text-sm text-slate-500">Search, filter, and inspect</p>
        </Link>
        <Link to="/app/analytics" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-brand-200">
          <ShieldAlert className="text-brand-600" size={20} />
          <p className="mt-3 font-semibold">Analytics</p>
          <p className="text-sm text-slate-500">Sent vs received over time</p>
        </Link>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-navy-800">Recent activity</h2>
          <Link to="/app/transactions" className="text-sm font-semibold text-brand-700">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">Loading activity…</p>
        ) : recent.length === 0 ? (
          <EmptyState title="No transactions yet" subtitle="Send money to see activity here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((txn) => {
              const outgoing = txn.sender?._id === user?.id || txn.sender === user?.id;
              return (
                <li key={txn._id}>
                  <Link to={`/app/transactions/${txn.transactionId}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                    <div className={`rounded-full p-2 ${outgoing ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {outgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {outgoing ? `To ${txn.receiver?.name}` : `From ${txn.sender?.name}`}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(txn.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${outgoing ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {outgoing ? '−' : '+'}
                        {formatBDT(txn.amount)}
                      </p>
                      <Badge tone={statusTone(txn.status)}>{txn.status}</Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
