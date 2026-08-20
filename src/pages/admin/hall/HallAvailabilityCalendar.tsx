import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { halls as initialHalls, hallBookings as bookings } from '@/lib/mockData';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export function HallAvailabilityCalendar() {
  const [current, setCurrent] = useState(new Date());
  const [hallId, setHallId] = useState('');

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(monthStart);
    const end = new Date(monthEnd);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
  }, [monthStart, monthEnd]);

  const filteredBookings = useMemo(() => bookings.filter(b => (!hallId || b.hallIds.includes(hallId))), [hallId]);

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
            return (
              <div key={key} className="min-h-[80px] rounded border border-brown-100 p-2 bg-white">
                <div className="text-sm font-medium text-brown-700">{day.getDate()}</div>
                <div className="mt-1 text-xs text-brown-500">
                  {list.length === 0 ? <span className="text-brown-300">No bookings</span> : list.slice(0,3).map(b => <div key={b.id} className="rounded bg-maroon-50 px-1 py-0.5 text-maroon-700 mb-1 text-xs">{b.bookingRef} ({b.startTime}-{b.endTime})</div>)}
                  {list.length > 3 && <div className="text-xs text-brown-400">+{list.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HallAvailabilityCalendar;
