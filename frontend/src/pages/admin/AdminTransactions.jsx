import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi, transactionApi } from '../../api';
import { extractError } from '../../api/client';
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../../components/ui';
import { formatBDT, formatDate, riskTone, statusTone } from '../../utils/format';

export default function AdminTransactions() {
  const [filters, setFilters] = useState({ search: '', status: '', riskLevel: '' });
  const [data, setData] = useState({ items: [] });

  const load = () => adminApi.transactions(filters).then((res) => setData(res.data.data));

  useEffect(() => {
    load();
  }, [filters]);

  const reverse = async (id) => {
    if (!window.confirm('Reverse this completed transfer? Funds will be returned to the sender.')) return;
    try {
      await transactionApi.reverse(id);
      toast.success('Transaction reversed');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <PageHeader title="All transfers" subtitle="Monitor volume and reverse settled payments when required." />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-3">
        <Input placeholder="Search TXN ID" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {['SUCCESS', 'FAILED', 'REVERSED', 'PENDING'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={filters.riskLevel}
          onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
        >
          <option value="">All risk levels</option>
          {['LOW', 'MEDIUM', 'HIGH'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Card>
      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No transactions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">From → To</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((txn) => (
                  <tr key={txn._id}>
                    <td className="px-4 py-3">
                      <Link className="font-semibold text-brand-700" to={`/app/transactions/${txn.transactionId}`}>
                        {txn.transactionId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {txn.sender?.name} → {txn.receiver?.name}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatBDT(txn.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(txn.status)}>{txn.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={riskTone(txn.riskLevel)}>{txn.riskLevel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(txn.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {txn.status === 'SUCCESS' && (
                        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => reverse(txn.transactionId)}>
                          Reverse
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
