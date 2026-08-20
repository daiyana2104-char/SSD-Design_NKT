import { Link, useLocation } from 'react-router-dom';
import { Shield, ShoppingCart, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const apps = [
  { label: 'Admin Panel', to: '/admin/login', icon: Shield, match: '/admin' },
  { label: 'POS Counter', to: '/pos/login', icon: ShoppingCart, match: '/pos' },
  { label: 'Customer Portal', to: '/portal', icon: Globe, match: '/portal' },
];

export function GlobalNav({ className, variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const location = useLocation();
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {apps.map((app) => {
        const active = location.pathname.startsWith(app.match);
        return (
          <Link
            key={app.to}
            to={app.to}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? variant === 'dark' ? 'bg-gold-400 text-maroon-900' : 'bg-maroon-700 text-white'
                : variant === 'dark' ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-brown-600 hover:bg-cream-100 hover:text-maroon-700',
            )}
          >
            <app.icon className="h-3.5 w-3.5" />
            {app.label}
          </Link>
        );
      })}
    </div>
  );
}
