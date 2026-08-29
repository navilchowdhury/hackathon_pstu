import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Receipt,
  Bell,
  UserRound,
  Shield,
  LogOut,
  ChartNoAxesCombined,
  Users,
  HandCoins,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api';
import Logo from './Logo';

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/send', label: 'Send money', icon: Send },
  { to: '/app/request', label: 'Request money', icon: HandCoins },
  { to: '/app/groups', label: 'Groups', icon: Users },
  { to: '/app/transactions', label: 'Transactions', icon: Receipt },
  { to: '/app/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

const adminOnlyNav = [
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

const adminNav = [
  { to: '/app/admin', label: 'Admin overview', icon: Shield, end: true },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/transactions', label: 'All transfers', icon: Receipt },
];

function Item({ to, label, icon: Icon, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-navy-900">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AppLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    notificationApi
      .list()
      .then((res) => setUnread(res.data.data.unread || 0))
      .catch(() => {});
  }, [location.pathname]);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-navy-900 text-white">
      <div className="px-5 py-6">
        <Logo light to={isAdmin ? '/app/admin' : '/app'} />
        <p className="mt-1 text-xs text-slate-400">Digital wallet</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {(isAdmin ? adminOnlyNav : nav).map((item) => (
          <Item
            key={item.to}
            {...item}
            badge={item.to === '/app/notifications' ? unread : 0}
          />
        ))}
        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>
            {adminNav.map((item) => (
              <Item key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 px-3 py-2">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setOpen(false)} />
          <div className="relative z-50 h-full">{sidebar}</div>
        </div>
      )}

      <div className="min-h-screen flex-1 lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="hidden text-sm text-slate-500 lg:block">
            {isAdmin ? 'Operator console' : (
              <>
                Wallet ID <span className="font-semibold text-navy-800">{user?.walletId}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-3 text-sm">
            {!isAdmin && (
              <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
                {Number(user?.walletBalance || 0).toLocaleString()} BDT
              </span>
            )}
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
