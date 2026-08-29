import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../../api';
import { Card, PageHeader } from '../../components/ui';
import { formatBDT, monthLabel } from '../../utils/format';

const COLORS = ['#0d9488', '#f59e0b', '#e11d48'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.statistics().then((res) => setStats(res.data.data));
  }, []);

  const monthly = (stats?.monthly || []).map((row) => ({
    name: monthLabel(row._id.year, row._id.month),
    volume: row.volume,
    count: row.count,
  }));

  const risk = (stats?.riskBreakdown || []).map((row) => ({
    name: row._id,
    value: row.count,
  }));

  return (
    <div>
      <PageHeader title="Admin overview" subtitle="Platform-wide money movement and risk." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Users" value={stats?.totalUsers ?? 0} />
        <Stat label="Transactions" value={stats?.totalTransactions ?? 0} />
        <Stat label="Money movement" value={formatBDT(stats?.totalMoneyMovement)} />
        <Stat label="High-risk transfers" value={stats?.suspiciousCount ?? 0} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Transaction volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatBDT(v)} />
                <Bar dataKey="volume" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Risk statistics</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={risk} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {risk.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy-800">{value}</p>
    </Card>
  );
}
