import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { transactionApi } from '../api';
import { Badge, Card, PageHeader } from '../components/ui';
import { formatBDT, formatDate, statusTone, riskTone } from '../utils/format';

export default function TransactionDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    transactionApi.get(id).then((res) => setData(res.data.data));
  }, [id]);

  if (!data) {
    return <p className="text-slate-500">Loading transaction…</p>;
  }

  const { transaction: txn, logs } = data;

  return (
    <div>
      <PageHeader
        title={txn.transactionId}
        subtitle="Full ledger record, parties, and security verification"
        actions={<Badge tone={statusTone(txn.status)}>{txn.status}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <Info label="Amount" value={formatBDT(txn.amount)} />
            <Info label="Transfer time" value={formatDate(txn.createdAt)} />
            <Info label="Description" value={txn.description || '—'} />
            <Info label="Failure reason" value={txn.failureReason || '—'} />
          </dl>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Party title="Sender" user={txn.sender} />
            <Party title="Receiver" user={txn.receiver} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-navy-800">Security verification</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Risk level</span>
              <Badge tone={riskTone(txn.riskLevel)}>{txn.riskLevel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Risk score</span>
              <span className="font-semibold">{txn.riskScore}/100</span>
            </div>
            <ul className="space-y-1 text-slate-600">
              {(txn.riskFactors || []).length === 0 && <li>No elevated risk factors.</li>}
              {(txn.riskFactors || []).map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-slate-500">
              Checks: recipient exists, not self-transfer, sufficient balance, daily limit, atomic settlement.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <h2 className="font-semibold text-navy-800">Transaction log</h2>
        <ol className="mt-4 space-y-3">
          {logs.map((log) => (
            <li key={log._id} className="flex gap-3 text-sm">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-slate-500">{log.details || '—'}</p>
                <p className="text-xs text-slate-400">{formatDate(log.timestamp)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-navy-800">{value}</dd>
    </div>
  );
}

function Party({ title, user }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 font-semibold">{user?.name}</p>
      <p className="text-slate-500">{user?.email}</p>
      <p className="font-mono text-xs text-slate-500">{user?.walletId}</p>
    </div>
  );
}
