import { type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption { label: string; value: string; }

export function SearchFilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  filters?: { label: string; value: string; options: FilterOption[]; onChange: (v: string) => void }[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-9"
          />
        </div>
        {filters?.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <label className="hidden text-sm text-brown-500 sm:block">{f.label}:</label>
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="input min-w-[140px] py-2"
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
