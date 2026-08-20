import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = 'No records found',
  className,
}: {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brown-100 bg-cream-50 text-left text-xs font-semibold uppercase tracking-wider text-brown-500">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-3 whitespace-nowrap',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-brown-400">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-brown-50 transition-colors hover:bg-cream-50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3 align-middle whitespace-nowrap',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
