import Logo from './Logo';

export default function AuthShell({ headline, copy, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 grid-hero opacity-60" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Digital wallet</p>
          <h2 className="text-4xl font-extrabold leading-tight">{headline}</h2>
          <p className="mt-4 text-slate-300">{copy}</p>
        </div>
        <p className="relative text-sm text-slate-500">Encrypted passwords · JWT sessions · Atomic settlement</p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6">{children}</div>
    </div>
  );
}
