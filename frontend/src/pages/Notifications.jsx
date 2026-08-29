import { useEffect, useState } from 'react';
import { notificationApi } from '../api';
import { Button, Card, EmptyState, PageHeader } from '../components/ui';
import { formatDate } from '../utils/format';

export default function Notifications() {
  const [items, setItems] = useState([]);

  const load = () => {
    notificationApi.list().then((res) => setItems(res.data.data.items));
  };

  useEffect(() => {
    load();
  }, []);

  const mark = async (id) => {
    await notificationApi.markRead(id);
    load();
  };

  const markAll = async () => {
    await notificationApi.markAll();
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Transfers, reversals, and security warnings"
        actions={
          <Button variant="secondary" onClick={markAll}>
            Mark all read
          </Button>
        }
      />
      <Card>
        {items.length === 0 ? (
          <EmptyState title="No notifications" subtitle="Activity on your wallet will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n._id} className={`flex items-start justify-between gap-4 px-5 py-4 ${n.read ? '' : 'bg-brand-50/40'}`}>
                <div>
                  <p className="font-medium text-navy-800">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.type} · {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <button className="text-sm font-semibold text-brand-700" onClick={() => mark(n._id)}>
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
