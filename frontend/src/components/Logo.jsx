import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11 text-lg' : 'h-9 w-9 text-base';

  return (
    <Link to={to} className="inline-flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-xl bg-brand-500 font-extrabold text-navy-900 shadow-sm ${box}`}
      >
        S
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-800'}`}>
        SecurePay
      </span>
    </Link>
  );
}
