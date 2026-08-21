import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { halls as initialHalls, hallBookings as initialBookings, hallCategories as categories } from '@/lib/mockData';

const PAGE_SIZE = 12;

export function HallAvailability() {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [hallId, setHallId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const bookings = initialBookings;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(b => (!date || b.eventDate === date) && (!hallId || b.hallIds.includes(hallId)) && (!q || b.bookingRef.toLowerCase().includes(q)));
  }, [bookings, date, hallId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<any>[] = [
    { key: 'ref', header: 'Booking Ref', render: (b) => b.bookingRef },
    { key: 'halls', header: 'Halls', render: (b) => (b.hallIds && b.hallIds.length ? b.hallIds.map(id => initialHalls.find(h => h.id === id)?.name).filter(Boolean).join(', ') : '—') },
    { key: 'time', header: 'Time', render: (b) => `${b.startTime}-${b.endTime}` },
    { key: 'status', header: 'Status', render: (b) => b.status },
  ];

  return (
    <div>
      <PageHeader title="Hall Availability" description="View hall availability and booked slots" />

      <div className="card p-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-brown-500">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-brown-500">Hall</label>
            <select className="input mt-1" value={hallId} onChange={(e) => setHallId(e.target.value)}>
              <option value="">All Halls</option>
              {initialHalls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-brown-500">Category</label>
            <select className="input mt-1" onChange={(e) => { const cat = e.target.value; setHallId(cat ? initialHalls.filter(h => h.status === 'Active').find(h => h.categoryId === cat)?.id ?? '' : ''); }}>
              <option value="">All Categories</option>
              {categories.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search booking ref..." filters={[]} />
        </div>
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}

export default HallAvailability;
