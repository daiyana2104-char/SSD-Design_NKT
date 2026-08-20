import { useState } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AdminSidebar, navGroups } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminStore } from '@/lib/adminStore';
import type { Crumb } from '@/components/ui/Breadcrumb';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAdminStore();

  if (!user) return <Navigate to="/admin/login" replace />;

  const crumbs: Crumb[] = (() => {
    const result: Crumb[] = [];
    for (const group of navGroups) {
      for (const item of group.items) {
        if (location.pathname === item.to) {
          result.push({ label: group.label });
          result.push({ label: item.label, to: item.to });
          return result;
        }
      }
    }
    return [{ label: 'Dashboard', to: '/admin' }];
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onToggleSidebar={() => setCollapsed(!collapsed)} crumbs={crumbs} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
