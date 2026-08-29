import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { walletApi } from '../api';
import { Card, PageHeader } from '../components/ui';
import { formatBDT, monthLabel } from '../utils/format';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    walletApi.analytics().then((res) => setData(res.data.data));
  }, []);

  const chart = (data?.monthly || []).map((row) => ({
    name: monthLabel(row._id.year, row._id.month),
    sent: row.sent,
    received: row.received,
  }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="How money moved through your wallet." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Stat label="Balance" value={formatBDT(data?.wallet?.balance)} />
        <Stat label="Total sent" value={formatBDT(data?.wallet?.totalSent)} />
        <Stat label="Total received" value={formatBDT(data?.wallet?.totalReceived)} />
      </div>
      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-navy-800">Monthly activity</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => formatBDT(v)} />
              <Area type="monotone" dataKey="sent" stroke="#e11d48" fill="#ffe4e6" />
              <Area type="monotone" dataKey="received" stroke="#0d9488" fill="#ccfbf1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
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
