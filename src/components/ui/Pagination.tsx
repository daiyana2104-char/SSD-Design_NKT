import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  totalPages,
  onPage,
  totalItems,
  pageSize,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  totalItems: number;
  pageSize: number;
  className?: string;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 border-t border-brown-100 px-4 py-3 sm:flex-row', className)}>
      <p className="text-xs text-brown-500">
        Showing <span className="font-medium text-brown-700">{from}-{to}</span> of <span className="font-medium text-brown-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="btn-outline px-2.5 py-1.5"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, i, arr) => (
            <span key={p} className="flex items-center">
              {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-brown-300">…</span>}
              <button
                onClick={() => onPage(p)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  p === page ? 'bg-maroon-700 text-white' : 'text-brown-600 hover:bg-cream-200',
                )}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="btn-outline px-2.5 py-1.5"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
