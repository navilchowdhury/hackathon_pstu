import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { groupApi } from '../api';
import { extractError } from '../api/client';
import { Button, Card, EmptyState, Input, PageHeader } from '../components/ui';

export default function Groups() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', members: '' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    groupApi.list().then((res) => setItems(res.data.data.items));
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const members = form.members
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await groupApi.create({ name: form.name.trim(), members });
      toast.success('Group created');
      navigate(`/app/groups/${res.data.data.group._id}`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Group expenses"
        subtitle="Split trip or household costs and settle from your wallet."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-navy-800">New group</h2>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <Input
              label="Group name"
              placeholder="Trip to Cox's Bazar"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Members (email or wallet ID)</span>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                rows={4}
                placeholder="karim@securepay.com"
                value={form.members}
                onChange={(e) => setForm({ ...form, members: e.target.value })}
              />
              <span className="text-xs text-slate-500">You are added automatically. One member per line.</span>
            </label>
            <Button className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create group'}
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-3">
          {items.length === 0 ? (
            <EmptyState title="No groups yet" subtitle="Create a group and invite other SecurePay users." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((g) => (
                <li key={g._id}>
                  <Link to={`/app/groups/${g._id}`} className="block px-5 py-4 hover:bg-slate-50">
                    <p className="font-semibold text-navy-800">{g.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {g.members?.length} members · created by {g.createdBy?.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
