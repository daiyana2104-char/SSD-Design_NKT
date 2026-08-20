import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb { label: string; to?: string; }

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm text-brown-500', className)} aria-label="Breadcrumb">
      <Link to="/admin" className="flex items-center hover:text-maroon-600">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-brown-300" />
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="hover:text-maroon-600">{item.label}</Link>
          ) : (
            <span className={cn(i === items.length - 1 && 'font-medium text-brown-800')}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
