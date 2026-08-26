import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { halls as initialHalls, hallCategories as categories, holidays } from '@/lib/mockData';
import { hallBookings as initialBookings, type HallBookingRecord } from '@/lib/hallData';

const PAGE_SIZE = 12;

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function HallAvailability() {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [hallId, setHallId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('18:00');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const bookings = initialBookings;

  const rows = useMemo(() => initialHalls.filter((hall) => hall.status === 'Active').map((hall) => {
    const booking = bookings.find((item) => item.hallIds.includes(hall.id) && item.eventDate === date && item.bookingStatus === 'Confirmed' && !(toTime <= item.startTime || fromTime >= item.endTime));
    const blocked = holidays.some((holiday) => holiday.status === 'Active' && new Date(`${date}T${toTime}`) > new Date(holiday.start) && new Date(`${date}T${fromTime}`) < new Date(holiday.end));
    return { id: hall.id, bookingRef: booking?.bookingRef ?? '—', hallName: hall.name, startTime: booking?.startTime ?? fromTime, endTime: booking?.endTime ?? toTime, status: blocked ? 'Blocked/Holiday' : booking ? 'Booked' : 'Available' };
  }), [bookings, date, fromTime, toTime]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(b => (!hallId || b.id === hallId) && (!categoryId || initialHalls.find(h => h.id === b.id)?.categoryId === categoryId) && (!q || b.bookingRef.toLowerCase().includes(q)));
  }, [rows, hallId, categoryId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'ref', header: 'Booking Ref', render: (b) => b.bookingRef },
    { key: 'hall', header: 'Hall', render: (b) => b.hallName },
    { key: 'time', header: 'Time', render: (b) => `${formatTime(b.startTime)} - ${formatTime(b.endTime)}` },
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
              {initialHalls.filter(h => h.status === 'Active').map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-brown-500">Category</label>
            <select className="input mt-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All Categories</option>
              {categories.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold text-brown-500">From Time</label><input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="input mt-1" /></div>
          <div><label className="text-xs font-semibold text-brown-500">To Time</label><input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className="input mt-1" /></div>
        </div>

        <div className="mt-4">
          <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search booking ref..." filters={[]} />
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
