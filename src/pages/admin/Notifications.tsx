import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, CheckCheck } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '@/components/ui/StatusBadge';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { useAdminStore, exportCSV } from '@/lib/adminStore';
import { cn } from '@/lib/utils';

export function Notifications() {
  const navigate = useNavigate();
  const { notifications, markNotifRead, markAllRead, dismissNotif } = useAdminStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const types = ['Low Stock', 'Payment Failure', 'Cancellation Request', 'Refund Pending', 'Hall Booking Approval', 'New Enquiry', 'New Feedback', 'Expired User Access', 'Print Failure'];
  const typeOptions: FilterOption[] = [{ label: 'All Types', value: '' }, ...types.map((t) => ({ label: t, value: t }))];

  const filtered = notifications.filter((n) => {
    const m = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
    const t = !typeFilter || n.type === typeFilter;
    return m && t;
  });

  return (
    <div>
      <PageHeader title="Notifications" description="View and manage system notifications"
        actions={<>
          <button className="btn-outline" onClick={() => exportCSV('notifications.csv', ['Type', 'Title', 'Message', 'Time', 'Read'], filtered.map((n) => [n.type, n.title, n.message, new Date(n.time).toLocaleString(), n.read ? 'Yes' : 'No']))}>Export CSV</button>
          <button className="btn-primary" onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Mark All Read</button>
        </>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} filters={[{ label: 'Type', value: typeFilter, options: typeOptions, onChange: setTypeFilter }]} /></div>
      <div className="card mt-4 divide-y divide-brown-50">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-brown-400"><Bell className="mx-auto mb-2 h-8 w-8 text-brown-200" />No notifications</div>
        ) : filtered.map((n) => (
          <div key={n.id} className={cn('flex items-start gap-3 p-4 hover:bg-cream-50', !n.read && 'bg-cream-50')}>
            <div className={cn('mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-brown-100 text-brown-400' : 'bg-saffron-100 text-saffron-600')}>
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-brown-800">{n.title}</p>
                <span className="badge bg-cream-100 text-brown-500 text-[10px]">{n.type}</span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-saffron-500" />}
              </div>
              <p className="mt-0.5 text-sm text-brown-500">{n.message}</p>
              <p className="mt-0.5 text-xs text-brown-400">{new Date(n.time).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!n.read && <button onClick={() => markNotifRead(n.id)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Mark Read"><Check className="h-4 w-4" /></button>}
              {n.link && <button onClick={() => navigate(n.link!)} className="rounded px-2 py-1 text-xs text-maroon-600 hover:bg-cream-100">Open</button>}
              <button onClick={() => dismissNotif(n.id)} className="rounded p-1.5 text-brown-400 hover:bg-cream-100" title="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
