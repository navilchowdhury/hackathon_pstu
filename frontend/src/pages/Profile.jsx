import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { extractError } from '../api/client';
import { Button, Card, Input, PageHeader } from '../components/ui';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const saveName = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.updateProfile({ name });
      setUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Account and wallet identity" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-navy-800">Account information</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email" value={user?.email} />
            <Row label="Wallet ID" value={user?.walletId} />
            <Row label="Role" value={user?.role} />
            <Row label="Member since" value={formatDate(user?.createdAt)} />
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-navy-800">Update name</h2>
          <form className="mt-4 space-y-4" onSubmit={saveName}>
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button>Save name</Button>
          </form>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-navy-800">Change password</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={savePassword}>
            <Input
              label="Current password"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
            <Input
              label="New password"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
            <Button className="md:col-span-2 w-fit">Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
