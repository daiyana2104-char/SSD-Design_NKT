import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  posUsers, posCustomers, createSeedTransactions,
  type PosUser, type PosCustomer, type PosTransaction, type PosAuditEntry,
} from '@/lib/posData';

interface PosStore {
  // Auth
  user: PosUser | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: { mobile?: string }) => void;
  // Customers
  customers: PosCustomer[];
  addCustomer: (c: PosCustomer) => void;
  updateCustomer: (c: PosCustomer) => void;
  // Transactions
  transactions: PosTransaction[];
  addTransaction: (t: PosTransaction) => void;
  updateTransaction: (t: PosTransaction) => void;
  // Audit
  addAudit: (entry: Omit<PosAuditEntry, 'datetime'>) => void;
}

const Ctx = createContext<PosStore | null>(null);
const SESSION_KEY = 'pos_session';
const TXN_KEY = 'pos_transactions';
const CUST_KEY = 'pos_customers';

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) as T : fallback;
  } catch { return fallback; }
}

function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PosUser | null>(() => load<PosUser | null>(SESSION_KEY, null));
  const [customers, setCustomers] = useState<PosCustomer[]>(() => load(CUST_KEY, posCustomers));
  const [transactions, setTransactions] = useState<PosTransaction[]>(() => load(TXN_KEY, createSeedTransactions()));

  useEffect(() => { save(CUST_KEY, customers); }, [customers]);
  useEffect(() => { save(TXN_KEY, transactions); }, [transactions]);

  const login = useCallback((username: string, password: string): { ok: boolean; error?: string } => {
    const found = posUsers.find((u) => u.username === username);
    if (!found || found.password !== password) return { ok: false, error: 'Invalid username or password.' };
    if (found.status !== 'Active') return { ok: false, error: 'Your account is inactive. Contact the administrator.' };
    const today = new Date();
    const [d, m, y] = found.accessValidUntil.split('/').map(Number);
    if (new Date(y, m - 1, d) < today) return { ok: false, error: 'Your access validity has expired. Contact the administrator.' };
    setUser(found);
    save(SESSION_KEY, found);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback((data: { mobile?: string }) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, mobile: data.mobile ?? prev.mobile };
      save(SESSION_KEY, updated);
      return updated;
    });
  }, []);

  const addCustomer = useCallback((c: PosCustomer) => {
    setCustomers((prev) => { const next = [...prev, c]; save(CUST_KEY, next); return next; });
  }, []);

  const updateCustomer = useCallback((c: PosCustomer) => {
    setCustomers((prev) => { const next = prev.map((x) => x.id === c.id ? c : x); save(CUST_KEY, next); return next; });
  }, []);

  const addTransaction = useCallback((t: PosTransaction) => {
    setTransactions((prev) => { const next = [t, ...prev]; save(TXN_KEY, next); return next; });
  }, []);

  const updateTransaction = useCallback((t: PosTransaction) => {
    setTransactions((prev) => { const next = prev.map((x) => x.id === t.id ? t : x); save(TXN_KEY, next); return next; });
  }, []);

  const addAudit = useCallback((entry: Omit<PosAuditEntry, 'datetime'>) => {
    // Audit is stored within transactions; this is a no-op helper for standalone audit
    void entry;
  }, []);

  return (
    <Ctx.Provider value={{
      user, login, logout, updateProfile,
      customers, addCustomer, updateCustomer,
      transactions, addTransaction, updateTransaction,
      addAudit,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePosStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePosStore must be used within PosProvider');
  return ctx;
}
