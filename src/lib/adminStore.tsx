import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as mock from '@/lib/mockData';
import type { AuditLog } from '@/lib/mockData';

// Admin mock users for login
export interface AdminUser {
  email: string; password: string; name: string; role: string;
  designation: string; mobile: string;
  accessUpto: string; status: string; permissions: string[];
}

const adminUsers: AdminUser[] = [
  { email: 'admin@ssdtemple.sg', password: 'Temple@123', name: 'Suresh Krishnan', role: 'Super Admin', designation: 'Temple Administrator', mobile: '+65 9123 4567', accessUpto: '31/12/2026', status: 'Active', permissions: ['*'] },
  { email: 'finance@ssdtemple.sg', password: 'Temple@123', name: 'Ravi Subramaniam', role: 'Admin Panel User', designation: 'Finance Manager', mobile: '+65 9345 6789', accessUpto: '31/12/2026', status: 'Active', permissions: ['dashboard', 'users', 'masters', 'transactions', 'inventory', 'reports', 'settings'] },
  { email: 'pos1@ssdtemple.sg', password: 'Temple@123', name: 'Lakshmi Devi', role: 'POS User', designation: 'Counter Executive', mobile: '+65 8234 5678', accessUpto: '30/06/2026', status: 'Active', permissions: ['dashboard', 'transactions', 'inventory'] },
  { email: 'accounts@ssdtemple.sg', password: 'Temple@123', name: 'Meena Krishnan', role: 'Accounts', designation: 'Accountant', mobile: '+65 9456 1234', accessUpto: '31/12/2026', status: 'Active', permissions: ['dashboard', 'transactions', 'reports'] },
  { email: 'content@ssdtemple.sg', password: 'Temple@123', name: 'Anand Pillai', role: 'Content Manager', designation: 'Content Editor', mobile: '+65 9567 8901', accessUpto: '31/12/2026', status: 'Active', permissions: ['dashboard', 'cms'] },
];

const SESSION_KEY = 'admin_session';
const PREFIX = 'admin_data_';

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function save<T>(key: string, val: T) { try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch { /* ignore */ } }

export interface AdminNotification {
  id: string; type: string; title: string; message: string; time: string; read: boolean; link?: string;
}

interface AdminStore {
  user: AdminUser | null;
  login: (u: string, p: string) => { ok: boolean; error?: string };
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  // persisted data
  data: typeof mock;
  addAudit: (action: string, module: string, details: string) => void;
  auditLogs: AuditLog[];
  notifications: AdminNotification[];
  markNotifRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotif: (id: string) => void;
  addNotification: (n: Omit<AdminNotification, 'id' | 'time' | 'read'>) => void;
}

const Ctx = createContext<AdminStore | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try { const v = localStorage.getItem(SESSION_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  });

  // Persisted state — each dataset loaded from localStorage or seeded from mock
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => load('auditLogs', mock.auditLogs));
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => load('notifications', [
    { id: 'n1', type: 'Low Stock', title: 'Low stock: Flower Garland', message: 'Stock is below threshold (8/30)', time: new Date(Date.now() - 3600000).toISOString(), read: false, link: '/admin/low-stock' },
    { id: 'n2', type: 'Cancellation Request', title: 'New cancellation request', message: 'BKG20260729005 requested cancellation', time: new Date(Date.now() - 300000).toISOString(), read: false, link: '/admin/cancellations' },
    { id: 'n3', type: 'New Enquiry', title: 'New portal booking received', message: 'BKG20260730002 pending confirmation', time: new Date(Date.now() - 7200000).toISOString(), read: false, link: '/admin/portal-bookings' },
    { id: 'n4', type: 'Refund Pending', title: 'Refund pending approval', message: 'RFND001 requires processing', time: new Date(Date.now() - 86400000).toISOString(), read: true, link: '/admin/refunds' },
  ]));

  useEffect(() => { save('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { save('notifications', notifications); }, [notifications]);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const found = adminUsers.find((u) => u.email === email);
    if (!found || found.password !== password) return { ok: false, error: 'Invalid email or password.' };
    if (found.status !== 'Active') return { ok: false, error: 'Your account is inactive. Contact the administrator.' };
    const [d, m, y] = found.accessUpto.split('/').map(Number);
    if (new Date(y, m - 1, d) < new Date()) return { ok: false, error: 'Your access validity has expired. Contact the administrator.' };
    if (!found.permissions.includes('*') && !found.permissions.includes('dashboard')) return { ok: false, error: 'You do not have Admin Panel access. Contact the administrator.' };
    setUser(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasPermission = useCallback((perm: string) => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(perm);
  }, [user]);

  const addAudit = useCallback((action: string, module: string, details: string) => {
    const entry: AuditLog = {
      id: 'al' + Math.random().toString(36).slice(2),
      user: user?.email ?? 'system',
      action, module, details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  }, [user]);

  const markNotifRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotif = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<AdminNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((prev) => [{ ...n, id: 'n' + Math.random().toString(36).slice(2), time: new Date().toISOString(), read: false }, ...prev]);
  }, []);

  return (
    <Ctx.Provider value={{
      user, login, logout, hasPermission,
      data: mock, addAudit, auditLogs,
      notifications, markNotifRead, markAllRead, dismissNotif, addNotification,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminStore must be used within AdminProvider');
  return ctx;
}

// CSV export utility
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
