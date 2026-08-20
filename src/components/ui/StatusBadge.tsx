import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';
const variants: Record<Variant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-saffron-100 text-saffron-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-brown-100 text-brown-700',
  gold: 'bg-gold-100 text-gold-800',
};

export function StatusBadge({ status, variant = 'neutral', className }: { status: string; variant?: Variant; className?: string }) {
  const v = variantFor(status) ?? variant;
  return <span className={cn('badge', variants[v], className)}>{status}</span>;
}

function variantFor(status: string): Variant | null {
  const s = status.toLowerCase();
  if (['active', 'approved', 'processed', 'responded', 'closed', 'enabled', 'completed', 'in stock'].includes(s)) return 'success';
  if (['pending', 'requested', 'in progress', 'low stock', 'warning'].includes(s)) return 'warning';
  if (['inactive', 'rejected', 'cancelled', 'failed', 'disabled', 'out of stock', 'error'].includes(s)) return 'error';
  if (['new', 'open', 'info'].includes(s)) return 'info';
  if (['not applicable', 'draft'].includes(s)) return 'neutral';
  return null;
}

export function Dot({ variant = 'neutral' }: { variant?: Variant }) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', {
    success: 'bg-green-500', warning: 'bg-saffron-500', error: 'bg-red-500',
    info: 'bg-blue-500', neutral: 'bg-brown-400', gold: 'bg-gold-500',
  }[variant])} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brown-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-brown-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
