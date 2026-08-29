import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import AuthShell from '../components/AuthShell';
import Logo from '../components/Logo';
import { extractError } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Wallet created with 100,000 BDT');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Open a wallet in seconds."
      copy="We hash your password, issue a unique wallet ID, and fund the account so you can start transferring immediately."
    >
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-navy-800">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Password: 8+ characters, mixed case, and a number.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button className="w-full" disabled={loading}>
            {loading ? 'Creating wallet…' : 'Create wallet'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
