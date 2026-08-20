import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, LogOut } from 'lucide-react';
import { Breadcrumb, type Crumb } from '@/components/ui/Breadcrumb';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAdminStore } from '@/lib/adminStore';

export function AdminHeader({ onToggleSidebar, crumbs }: { onToggleSidebar: () => void; crumbs: Crumb[] }) {
  const navigate = useNavigate();
  const { user, logout } = useAdminStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-brown-100 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button onClick={onToggleSidebar} className="rounded-lg p-2 text-brown-600 hover:bg-cream-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <Breadcrumb items={crumbs} className="hidden sm:flex" />

      <div className="ml-auto flex items-center gap-3">
        <GlobalNav className="hidden lg:flex" />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search..."
            className="w-56 rounded-lg border border-brown-200 bg-cream-50 py-2 pl-9 pr-3 text-sm focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 lg:w-72"
          />
          {searchOpen && search && (
            <div className="absolute mt-1 w-full rounded-lg border border-brown-100 bg-white py-2 shadow-card-hover">
              <p className="px-4 py-1 text-xs text-brown-400">Search for "{search}" in transactions, customers, items...</p>
              <button onClick={() => { navigate('/admin/customers'); setSearchOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-brown-600 hover:bg-cream-50">Search Customers</button>
              <button onClick={() => { navigate('/admin/pos-transactions'); setSearchOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-brown-600 hover:bg-cream-50">Search Transactions</button>
              <button onClick={() => { navigate('/admin/items'); setSearchOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-brown-600 hover:bg-cream-50">Search Items</button>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-cream-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">{user.name.charAt(0)}</div>
            <span className="hidden text-sm font-medium text-brown-700 sm:block">{user.name}</span>
            <ChevronDown className="hidden h-4 w-4 text-brown-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-brown-100 bg-white shadow-card-hover">
              <div className="border-b border-brown-100 px-4 py-3">
                <p className="text-sm font-semibold text-brown-800">{user.name}</p>
                <p className="text-xs text-brown-400">{user.email}</p>
                <p className="text-xs text-brown-400">{user.role}</p>
              </div>
              <div className="py-1">
                <button onClick={() => { setProfileOpen(false); setLogoutOpen(true); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={() => { logout(); navigate('/admin/login'); }}
        title="Logout" message="Are you sure you want to log out?" confirmLabel="Logout" variant="danger" />
    </header>
  );
}
