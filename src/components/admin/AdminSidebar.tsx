import { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Boxes, Package, ShoppingCart, Receipt,
  Undo2, History, AlertTriangle, Image, Megaphone,
  Menu as MenuIcon, FileText, Phone, Sparkles, MessageSquare, Star, BarChart3,
  Settings, User, LogOut, ChevronDown, Building2, UtensilsCrossed, Heart, Bell,
  Wallet, Layers, Calendar, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Temple } from '@/components/ui/TempleIcon';
import { useAdminStore } from '@/lib/adminStore';

interface NavItem { label: string; to: string; icon: React.ElementType; perm: string; }
interface NavGroup { label: string; icon: React.ElementType; perm: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  { label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard', items: [
    { label: 'Dashboard Overview', to: '/admin', icon: LayoutDashboard, perm: 'dashboard' },
  ]},
  { label: 'Administration', icon: Shield, perm: 'users', items: [
    { label: 'Role Management', to: '/admin/roles', icon: Shield, perm: 'users' },
    { label: 'Role Permissions', to: '/admin/role-permissions', icon: Shield, perm: 'users' },
    { label: 'User Management', to: '/admin/users', icon: Users, perm: 'users' },
  ]},
  { label: 'Masters', icon: Boxes, perm: 'masters', items: [
    { label: 'Printing Group Master', to: '/admin/printing-groups', icon: Layers, perm: 'masters' },
    { label: 'Deity Management', to: '/admin/deities', icon: Temple, perm: 'masters' },
    { label: 'GST Management', to: '/admin/gst', icon: Receipt, perm: 'masters' },
    { label: 'General Ledger (GL) Master', to: '/admin/gl-master', icon: BookOpen, perm: 'masters' },
    { label: 'GL Group Master', to: '/admin/gl-groups', icon: Layers, perm: 'masters' },
    { label: 'Category Management', to: '/admin/categories', icon: Boxes, perm: 'masters' },
    { label: 'Sub Category Master', to: '/admin/sub-categories', icon: Boxes, perm: 'masters' },
    { label: 'Item Master', to: '/admin/items', icon: Package, perm: 'masters' },
    { label: 'Service Master', to: '/admin/services', icon: Sparkles, perm: 'masters' },
    { label: 'Event Master', to: '/admin/events', icon: Calendar, perm: 'masters' },
    { label: 'Nakshathira Master', to: '/admin/nakshathira', icon: Star, perm: 'masters' },
    { label: 'Customer Master', to: '/admin/customers', icon: Users, perm: 'masters' },
    { label: 'Payment Mode Master', to: '/admin/payment-modes', icon: Wallet, perm: 'masters' },
    { label: 'Unit Master', to: '/admin/units', icon: Layers, perm: 'masters' },
  ]},
  { label: 'Hall Management', icon: Building2, perm: 'halls', items: [
    { label: 'Hall Category Master', to: '/admin/hall-categories', icon: Boxes, perm: 'halls' },
    { label: 'Hall Master', to: '/admin/halls', icon: Building2, perm: 'halls' },
    { label: 'Hall Purpose Master', to: '/admin/hall-purposes', icon: Star, perm: 'halls' },
    { label: 'Hall Package Master', to: '/admin/hall-packages', icon: Package, perm: 'halls' },
    { label: 'Additional Service Master', to: '/admin/hall-services', icon: Megaphone, perm: 'halls' },
    { label: 'Hall Exception', to: '/admin/hall-exceptions', icon: Calendar, perm: 'halls' },
    { label: 'Hall Booking', to: '/admin/hall-bookings', icon: ShoppingCart, perm: 'halls' },
    { label: 'Hall Payments', to: '/admin/hall-payments', icon: Wallet, perm: 'halls' },
    { label: 'Cancellation / Refund', to: '/admin/hall-cancellations', icon: Undo2, perm: 'halls' },
    { label: 'Hall Reports', to: '/admin/hall-reports', icon: BarChart3, perm: 'halls' },
  ]},
  { label: 'Meal Management', icon: UtensilsCrossed, perm: 'halls', items: [
    { label: 'Meal Category Master', to: '/admin/meal-categories', icon: Boxes, perm: 'halls' },
    { label: 'Meal Package Master', to: '/admin/meal-packages', icon: Package, perm: 'halls' },
    { label: 'Meal Item Master', to: '/admin/meal-items', icon: UtensilsCrossed, perm: 'halls' },
    { label: 'Meal Booking Management', to: '/admin/meal-bookings', icon: ShoppingCart, perm: 'halls' },
    { label: 'Meal Availability', to: '/admin/meal-availability', icon: Calendar, perm: 'halls' },
    { label: 'Meal Reports', to: '/admin/meal-reports', icon: BarChart3, perm: 'halls' },
  ]},
  { label: 'Transactions', icon: ShoppingCart, perm: 'transactions', items: [
    { label: 'Admin Booking', to: '/admin/bookings', icon: ShoppingCart, perm: 'transactions' },
    { label: 'POS Transactions', to: '/admin/pos-transactions', icon: ShoppingCart, perm: 'transactions' },
    { label: 'Customer Portal Bookings', to: '/admin/portal-bookings', icon: ShoppingCart, perm: 'transactions' },
    { label: 'Reprints', to: '/admin/reprints', icon: Receipt, perm: 'transactions' },
  ]},
  { label: 'Inventory', icon: Package, perm: 'inventory', items: [
    { label: 'Inventory Adjustment', to: '/admin/inventory-adjustment', icon: Package, perm: 'inventory' },
    { label: 'Available Stock', to: '/admin/available-stock', icon: Boxes, perm: 'inventory' },
    { label: 'Inventory History', to: '/admin/inventory-history', icon: History, perm: 'inventory' },
    { label: 'Low Stock Report', to: '/admin/low-stock', icon: AlertTriangle, perm: 'inventory' },
  ]},
  { label: 'Content Management', icon: FileText, perm: 'cms', items: [
    { label: 'Menu List', to: '/admin/menus', icon: MenuIcon, perm: 'cms' },
    { label: 'CMS Pages', to: '/admin/cms-pages', icon: FileText, perm: 'cms' },
  ]},
  { label: 'Reports', icon: BarChart3, perm: 'reports', items: [
    { label: 'POS Sales', to: '/admin/reports/pos-sales', icon: BarChart3, perm: 'reports' },
    { label: 'Item Sales', to: '/admin/reports/item-sales', icon: BarChart3, perm: 'reports' },
    { label: 'Service Sales', to: '/admin/reports/service-sales', icon: BarChart3, perm: 'reports' },
    { label: 'GST', to: '/admin/reports/gst', icon: BarChart3, perm: 'reports' },
    { label: 'Payments', to: '/admin/reports/payments', icon: BarChart3, perm: 'reports' },
  ]},
];

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Dashboard: true, Masters: true });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAdminStore();

  const activeGroup = useMemo(() => {
    for (const g of navGroups) {
      if (g.items.some((i) => location.pathname === i.to)) return g.label;
    }
    return '';
  }, [location.pathname]);

  const visibleGroups = navGroups.filter((g) => hasPermission(g.perm) || user?.permissions.includes('*'));

  return (
    <aside className={cn('flex h-screen flex-col bg-maroon-900 text-white transition-all duration-300', collapsed ? 'w-[68px]' : 'w-64')}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-400 text-maroon-900">
          <Temple className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-serif text-sm font-semibold leading-tight">Sri Siva Durga</p>
            <p className="text-[11px] text-gold-300/80">Temple Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visibleGroups.map((group) => {
          const isExpanded = collapsed || expanded[group.label] || activeGroup === group.label;
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <button onClick={() => setExpanded((p) => ({ ...p, [group.label]: !p[group.label] }))}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gold-300/70 hover:text-gold-300">
                  <group.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
                </button>
              )}
              {collapsed && <div className="flex justify-center px-2 py-2"><group.icon className="h-5 w-5 text-gold-300/70" /></div>}
              {(isExpanded || collapsed) && (
                <div className={cn(collapsed && 'flex flex-col items-center')}>
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === '/admin'} title={collapsed ? item.label : undefined}
                      className={({ isActive }) => cn('sidebar-link', isActive && 'sidebar-link-active', collapsed && 'justify-center px-2')}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button onClick={() => navigate('/admin/login')} className={cn('sidebar-link w-full', collapsed && 'justify-center px-2')}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export { navGroups };
