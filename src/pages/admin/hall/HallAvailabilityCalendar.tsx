import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { halls as initialHalls, holidays } from '@/lib/mockData';
import { hallBookings as bookings } from '@/lib/hallData';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function HallAvailabilityCalendar() {
  const [current, setCurrent] = useState(new Date());
  const [hallId, setHallId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(monthStart);
    const end = new Date(monthEnd);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
  }, [monthStart, monthEnd]);

  const filteredBookings = useMemo(() => bookings.filter(b => b.bookingStatus === 'Confirmed' && (!hallId || b.hallIds.includes(hallId))), [hallId]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, typeof bookings> = {};
    for (const b of filteredBookings) {
      map[b.eventDate] = map[b.eventDate] || [];
      map[b.eventDate].push(b);
    }
    return map;
  }, [filteredBookings]);

  const prev = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div>
      <PageHeader title="Availability Calendar" description="Month view of bookings" />

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={prev}>Prev</button>
            <h3 className="font-medium text-brown-800">{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
            <button className="btn-outline" onClick={next}>Next</button>
          </div>
          <div>
            <select value={hallId} onChange={(e) => setHallId(e.target.value)} className="input">
              <option value="">All Halls</option>
              {initialHalls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-xs font-semibold text-brown-500">{d}</div>)}
          {monthDays.map((day) => {
            const key = day.toISOString().slice(0,10);
            const list = bookingsByDate[key] ?? [];
            const holiday = holidays.some((item) => item.status === 'Active' && new Date(`${key}T23:59`) >= new Date(item.start) && new Date(`${key}T00:00`) <= new Date(item.end));
            return (
              <button type="button" key={key} onClick={() => setSelectedDate(key)} className={`min-h-[80px] rounded border p-2 text-left ${selectedDate === key ? 'border-maroon-500' : 'border-brown-100'} ${holiday ? 'bg-saffron-50' : 'bg-white'}`}>
                <div className="text-sm font-medium text-brown-700">{day.getDate()}</div>
                <div className="mt-1 text-xs text-brown-500">
                  {holiday && <div className="mb-1 rounded bg-saffron-100 px-1 py-0.5 text-saffron-700">Holiday / Blocked</div>}
                  {list.length === 0 ? <span className="text-brown-300">No bookings</span> : list.slice(0,3).map(b => <div key={b.id} className="rounded bg-maroon-50 px-1 py-0.5 text-maroon-700 mb-1 text-xs">{b.hallName}<br />{formatTime(b.startTime)} - {formatTime(b.endTime)}<br />{b.bookingStatus}</div>)}
                  {list.length > 3 && <div className="text-xs text-brown-400">+{list.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 border-t border-brown-100 pt-4">
          <h3 className="font-medium text-brown-800">Availability for {selectedDate}</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{initialHalls.filter((hall) => hall.status === 'Active' && (!hallId || hall.id === hallId)).map((hall) => { const booking = bookings.find((item) => item.bookingStatus === 'Confirmed' && item.eventDate === selectedDate && item.hallIds.includes(hall.id)); return <div key={hall.id} className="rounded border border-brown-100 p-2 text-sm"><div className="font-medium text-brown-800">{hall.name}</div><div className={booking ? 'text-maroon-700' : 'text-green-700'}>{booking ? `Booked: ${booking.startTime}-${booking.endTime} (${booking.bookingRef})` : 'Available'}</div></div>; })}</div>
        </div>
      </div>
    </div>
  );
}

export default HallAvailabilityCalendar;
