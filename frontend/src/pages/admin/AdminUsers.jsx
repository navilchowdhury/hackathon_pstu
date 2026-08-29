import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Card, EmptyState, Input, PageHeader } from '../../components/ui';
import { formatBDT, formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [], total: 0 });

  useEffect(() => {
    adminApi.users({ search }).then((res) => setData(res.data.data));
  }, [search]);

  return (
    <div>
      <PageHeader title="Users" subtitle={`${data.total} registered wallets`} />
      <Card className="mb-4 p-4">
        <Input placeholder="Search name, email, or wallet ID" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>
      <Card>
        {data.items.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Wallet ID</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.walletId}</td>
                    <td className="px-4 py-3">{formatBDT(u.walletBalance)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
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
