import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import AuthShell from '../components/AuthShell';
import Logo from '../components/Logo';
import { extractError } from '../api/client';

const demos = [
  { label: 'Rahim', email: 'rahim@securepay.com', password: 'User@12345' },
  { label: 'Karim', email: 'karim@securepay.com', password: 'User@12345' },
  { label: 'Admin', email: 'admin@securepay.com', password: 'Admin@12345' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}`);
      const dest = user.role === 'admin' ? '/app/admin' : location.state?.from?.pathname || '/app';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Your wallet. Your ledger. Your control."
      copy="Sign in to send money, review risk-scored transfers, and manage a production-style digital wallet."
    >
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-navy-800">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Access your SecurePay wallet</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {demos.map((d) => (
            <button
              key={d.email}
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700"
              onClick={() => setForm({ email: d.email, password: d.password })}
            >
              {d.label}
            </button>
          ))}
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
