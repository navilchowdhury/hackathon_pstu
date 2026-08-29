import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRightLeft,
  BellRing,
  ChartNoAxesCombined,
  Lock,
  Wallet,
  Users,
  Fingerprint,
  Timer,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  {
    icon: Wallet,
    title: 'Personal digital wallet',
    text: 'Every user account ships with a unique wallet ID and 100,000 BDT so you can move money immediately.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Atomic transfers',
    text: 'Debit, credit, and ledger writes happen together. Balances cannot drift if a step fails.',
  },
  {
    icon: ShieldCheck,
    title: 'Fraud scoring',
    text: 'Each payment is scored for amount, new recipients, and unusual velocity before it settles.',
  },
  {
    icon: Lock,
    title: 'Daily transfer limits',
    text: 'A 50,000 BDT daily cap protects wallets from runaway or compromised sessions.',
  },
  {
    icon: BellRing,
    title: 'In-app notifications',
    text: 'Senders and receivers get alerts for success, failure, reversal, and high-risk activity.',
  },
  {
    icon: Users,
    title: 'Group expense splitting',
    text: 'Create a trip or household group, log who paid, and settle optimized requests from your wallet.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Analytics & admin console',
    text: 'Users see sent vs received. Operators inspect volume, flag risk, and reverse settled payments.',
  },
  {
    icon: Fingerprint,
    title: 'Password-confirmed sends',
    text: 'Every transfer requires the sender’s account password so a stolen session cannot empty a wallet.',
  },
];

const steps = [
  { n: '01', title: 'Open a wallet', text: 'Register with name, email, and a strong password. We hash it, issue a wallet ID, and fund 100,000 BDT.' },
  { n: '02', title: 'Send with checks', text: 'Pay by email or wallet ID. The engine verifies the recipient, balance, daily cap, and fraud score.' },
  { n: '03', title: 'Settle atomically', text: 'Sender debit and receiver credit commit together. Failed attempts are stored as FAILED — no silent money loss.' },
  { n: '04', title: 'Audit everything', text: 'Search history, open a full ledger record, and review risk factors plus an append-only transaction log.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo light />
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">
              Product
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#security" className="hover:text-white">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-brand-400"
            >
              Create wallet
            </Link>
          </div>
        </div>
      </header>

      <section className="grid-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-100">
              <Timer size={14} /> Settles in milliseconds · Audited like a ledger
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
              Move money with the same discipline as a real payments product.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-slate-300">
              SecurePay is a digital wallet for storing virtual BDT, sending to other users, and tracking every transfer
              with risk scoring, daily limits, and atomic settlement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-navy-900 hover:bg-brand-400"
              >
                Open an account <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              {['100,000 BDT opening balance', '50,000 BDT daily send cap', 'JWT + bcrypt security', 'Admin reversal with logs'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-brand-400" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-sm text-slate-400">Available balance</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">100,000 BDT</p>
            <p className="mt-1 font-mono text-xs text-slate-400">Wallet ID · SP-A1B2C3D4E5</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-navy-800 p-4">
                <p className="text-slate-400">Daily remaining</p>
                <p className="mt-1 font-bold">50,000 BDT</p>
              </div>
              <div className="rounded-2xl bg-navy-800 p-4">
                <p className="text-slate-400">Risk engine</p>
                <p className="mt-1 font-bold">Low / Med / High</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-brand-600/20 p-4 ring-1 ring-brand-500/30">
                <p className="text-xs text-brand-100">Last transfer</p>
                <p className="mt-1 font-semibold">TXN-20260829-A1B2C3D4 · Success</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-navy-800/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
          {[
            { k: '100k BDT', v: 'Opening balance for every user' },
            { k: 'Atomic', v: 'Debit and credit in one unit of work' },
            { k: 'Admin', v: 'Reverse settled transfers with a full log' },
          ].map((s) => (
            <div key={s.k}>
              <p className="text-2xl font-extrabold text-brand-400">{s.k}</p>
              <p className="mt-1 text-sm text-slate-400">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-slate-50 py-20 text-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy-800">Four steps from signup to a complete ledger</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="text-xs font-bold text-brand-600">{s.n}</p>
                <h3 className="mt-3 font-bold text-navy-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20 text-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Product</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy-800">Built like a payments product, not a CRUD demo</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <f.icon className="text-brand-600" size={22} />
                <h3 className="mt-4 font-bold text-navy-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="bg-navy-800 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">Security</p>
          <h2 className="mt-2 text-3xl font-extrabold">What happens on every send</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Controllers never touch balances. Money movement lives in services so the same pipeline can be reasoned about,
            logged, and reversed.
          </p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              'Resolve recipient by email or wallet ID; reject missing or inactive accounts.',
              'Reject self-transfer and admin wallets. Confirm the sender’s password.',
              'Score risk (amount, new recipient, velocity). Enforce the 50,000 BDT daily cap.',
              'Debit only if walletBalance ≥ amount, credit the receiver, write the ledger, logs, and notifications together.',
            ].map((item, i) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-navy-900">
                  {i + 1}
                </span>
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <Logo light />
          <p className="text-sm text-slate-500">Digital wallet platform</p>
        </div>
      </footer>
    </div>
  );
}
