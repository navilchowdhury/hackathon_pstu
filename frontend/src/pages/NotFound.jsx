import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold text-navy-800">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        That URL is not part of SecurePay. Return home or sign in to your wallet.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          Home
        </Link>
        <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
}
