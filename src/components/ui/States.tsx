import { type ReactNode } from 'react';
import { Inbox, Loader2, AlertCircle } from 'lucide-react';

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-brown-300">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-brown-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-brown-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-maroon-500" />
      <p className="mt-3 text-sm text-brown-500">{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-brown-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-brown-500">{description}</p>}
      {onRetry && <button className="btn-outline mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function AuditInfo({ created, updated, createdBy, updatedBy }: { created: string; updated: string; createdBy: string; updatedBy: string }) {
  return (
    <div className="rounded-lg border border-brown-100 bg-cream-50 px-4 py-3 text-xs text-brown-500">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>Created: <span className="font-medium text-brown-700">{created}</span> by {createdBy}</span>
        <span>Updated: <span className="font-medium text-brown-700">{updated}</span> by {updatedBy}</span>
      </div>
    </div>
  );
}
