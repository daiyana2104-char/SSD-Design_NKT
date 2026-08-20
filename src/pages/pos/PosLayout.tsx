import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Plus, History, RefreshCw, User, LogOut, ChevronDown } from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { usePosStore } from '@/lib/posStore';
import { formatDateTime } from '@/lib/utils';

export function PosLayout() {
  const { user, logout } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [now, setNow] = useState(new Date());
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [newTxnOpen, setNewTxnOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) return <Navigate to="/pos/login" replace />;

  const navItems = [
    { label: 'New Transaction', icon: Plus, to: '/pos/billing', action: () => handleNewTxn() },
    { label: 'Transaction History', icon: History, to: '/pos/transactions' },
    { label: 'Reprint', icon: RefreshCw, to: '/pos/reprint' },
  ];

  function handleNewTxn() {
    // Check if there's a cart in localStorage
    const cart = localStorage.getItem('pos_cart');
    if (cart && JSON.parse(cart).length > 0) {
      setNewTxnOpen(true);
    } else {
      navigate('/pos/billing');
    }
  }

  function handleNavClick(item: { to: string; action?: () => void }) {
    if (item.action) item.action();
    else navigate(item.to);
  }

  return (
    <div className="flex h-screen flex-col bg-cream-100">
      <header className="z-30 flex h-16 items-center justify-between border-b border-brown-100 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-maroon-700 text-white">
            <Temple className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-brown-900">Sri Siva Durga Temple</p>
            <p className="text-[11px] text-brown-400">POS Counter · {formatDateTime(now)}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-maroon-50 text-maroon-700' : 'text-brown-600 hover:bg-cream-100'}`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <GlobalNav className="hidden lg:flex" />
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-cream-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
                {user.name.charAt(0)}
              </div>
              <span className="hidden text-sm font-medium text-brown-700 sm:block">{user.name}</span>
              <ChevronDown className="hidden h-4 w-4 text-brown-400 sm:block" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-48 overflow-hidden rounded-lg border border-brown-100 bg-white shadow-card-hover">
                  <div className="border-b border-brown-100 px-4 py-3">
                    <p className="text-sm font-semibold text-brown-800">{user.name}</p>
                    <p className="text-xs text-brown-400">{user.role}</p>
                  </div>
                  <button onClick={() => { setProfileOpen(false); navigate('/pos/profile'); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-brown-600 hover:bg-cream-50">
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); setLogoutOpen(true); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-brown-100 bg-white px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <button key={item.label} onClick={() => handleNavClick(item)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${location.pathname === item.to ? 'bg-maroon-50 text-maroon-700' : 'text-brown-600'}`}>
            <item.icon className="h-3.5 w-3.5" /> {item.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => { logout(); navigate('/pos/login'); toast.info('Logged out', 'Session ended.'); }}
        title="Logout" message="Are you sure you want to log out?" confirmLabel="Logout" variant="danger"
      />
      <ConfirmModal
        open={newTxnOpen}
        onClose={() => setNewTxnOpen(false)}
        onConfirm={() => { localStorage.removeItem('pos_cart'); localStorage.removeItem('pos_selected_customer'); localStorage.removeItem('pos_temp_names'); setNewTxnOpen(false); navigate('/pos/billing'); toast.info('Cart cleared', 'New transaction started.'); }}
        title="Start New Transaction?" message="The current cart and unsaved customer details will be cleared." confirmLabel="Clear and Start New" cancelLabel="Keep Current Transaction" variant="saffron"
      />
    </div>
  );
}
