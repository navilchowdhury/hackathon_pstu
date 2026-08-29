import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transactionApi } from '../api';
import { Badge, Card, EmptyState, Input, PageHeader } from '../components/ui';
import { formatBDT, formatDate, statusTone, riskTone } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    direction: '',
    from: '',
    to: '',
    page: 1,
  });
  const [data, setData] = useState({ items: [], total: 0, limit: 20 });

  useEffect(() => {
    transactionApi.list(filters).then((res) => setData(res.data.data));
  }, [filters]);

  const set = (key, value) => setFilters((prev) => ({ ...prev, page: 1, [key]: value }));
  const pages = Math.max(1, Math.ceil(data.total / (data.limit || 20)));

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Search and filter every payment involving your wallet." />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-5">
        <Input placeholder="Search TXN ID" value={filters.search} onChange={(e) => set('search', e.target.value)} />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {['SUCCESS', 'FAILED', 'PENDING', 'REVERSED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={filters.direction}
          onChange={(e) => set('direction', e.target.value)}
        >
          <option value="">Sent & received</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
        </select>
        <Input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} />
        <Input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} />
      </Card>

      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No matching transactions" subtitle="Adjust filters or send your first transfer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Counterparty</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((txn) => {
                  const outgoing = txn.sender?._id === user?.id;
                  const other = outgoing ? txn.receiver : txn.sender;
                  return (
                    <tr key={txn._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link className="font-semibold text-brand-700" to={`/app/transactions/${txn.transactionId}`}>
                          {txn.transactionId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{other?.name}</p>
                        <p className="text-xs text-slate-500">{outgoing ? 'Sent' : 'Received'}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatBDT(txn.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(txn.status)}>{txn.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={riskTone(txn.riskLevel)}>{txn.riskLevel}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(txn.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
          <span className="text-slate-500">{data.total} results</span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border px-3 py-1 disabled:opacity-40"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </button>
            <button
              className="rounded-lg border px-3 py-1 disabled:opacity-40"
              disabled={filters.page >= pages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
