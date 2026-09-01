import { useMemo, useState } from 'react';
import { halls as allHalls, type HallException } from '@/lib/mockData';
import type { HallBookingRecord } from '@/lib/hallData';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function HallBookingCalendar({
  bookings,
  exceptions,
}: {
  bookings: HallBookingRecord[];
  exceptions: HallException[];
}) {
  const [current, setCurrent] = useState(new Date());
  const [hallId, setHallId] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(monthStart);
    const end = new Date(monthEnd);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
  }, [monthStart, monthEnd]);

  const activeHalls = useMemo(() => allHalls.filter((h) => h.status === 'Active'), []);

  const visibleBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.bookingStatus === 'Confirmed' &&
          (!hallId || b.hallIds.includes(hallId)),
      ),
    [bookings, hallId],
  );

  const bookingsByDate = useMemo(() => {
    const map: Record<string, HallBookingRecord[]> = {};
    for (const b of visibleBookings) {
      map[b.eventDate] = map[b.eventDate] || [];
      map[b.eventDate].push(b);
    }
    return map;
  }, [visibleBookings]);

  const exceptionsByDate = useMemo(() => {
    const map: Record<string, HallException[]> = {};
    for (const ex of exceptions) {
      if (ex.status !== 'Active') continue;
      if (hallId && ex.hallId !== hallId) continue;
      map[ex.exceptionDate] = map[ex.exceptionDate] || [];
      map[ex.exceptionDate].push(ex);
    }
    return map;
  }, [exceptions, hallId]);

  const prev = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const dayBookings = bookingsByDate[selectedDate] ?? [];
  const dayExceptions = exceptionsByDate[selectedDate] ?? [];

  return (
    <div className="card mt-4 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium text-brown-800">Booking Calendar</h3>
          <p className="text-sm text-brown-500">View bookings and hall exceptions by date</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-outline" onClick={prev}>Prev</button>
          <span className="font-medium text-brown-800">
            {current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button type="button" className="btn-outline" onClick={next}>Next</button>
          <select value={hallId} onChange={(e) => setHallId(e.target.value)} className="input">
            <option value="">All Halls</option>
            {activeHalls.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-semibold text-brown-500">{d}</div>
        ))}
        {monthDays.map((day) => {
          const key = toDateKey(day);
          const list = bookingsByDate[key] ?? [];
          const dayEx = exceptionsByDate[key] ?? [];
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`min-h-[80px] rounded border p-2 text-left ${
                selectedDate === key ? 'border-maroon-500' : 'border-brown-100'
              } ${dayEx.length > 0 ? 'bg-saffron-50' : 'bg-white'}`}
            >
              <div className="text-sm font-medium text-brown-700">{day.getDate()}</div>
              <div className="mt-1 text-xs text-brown-500">
                {dayEx.length > 0 && (
                  <div className="mb-1 rounded bg-saffron-100 px-1 py-0.5 text-saffron-700">
                    {dayEx.length} exception{dayEx.length !== 1 ? 's' : ''}
                  </div>
                )}
                {list.length === 0 ? (
                  <span className="text-brown-300">No bookings</span>
                ) : (
                  list.slice(0, 3).map((b) => (
                    <div key={b.id} className="mb-1 rounded bg-maroon-50 px-1 py-0.5 text-maroon-700 text-xs">
                      {b.hallName}
                      <br />
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                      <br />
                      {b.bookingStatus}
                    </div>
                  ))
                )}
                {list.length > 3 && (
                  <div className="text-xs text-brown-400">+{list.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-brown-100 pt-4">
        <h4 className="font-medium text-brown-800">Details for {selectedDate}</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {activeHalls
            .filter((hall) => !hallId || hall.id === hallId)
            .map((hall) => {
              const hallBookings = dayBookings.filter((b) => b.hallIds.includes(hall.id));
              const hallExceptions = dayExceptions.filter((ex) => ex.hallId === hall.id);
              const hasBlock = hallBookings.length > 0 || hallExceptions.length > 0;
              return (
                <div key={hall.id} className="rounded border border-brown-100 p-2 text-sm">
                  <div className="font-medium text-brown-800">{hall.name}</div>
                  {hallExceptions.map((ex) => (
                    <div key={ex.id} className="text-saffron-700">
                      Blocked: {formatTime(ex.startTime)}–{formatTime(ex.endTime)}
                      {ex.reason ? ` (${ex.reason})` : ''}
                    </div>
                  ))}
                  {hallBookings.map((b) => (
                    <div key={b.id} className="text-maroon-700">
                      Booked: {formatTime(b.startTime)}–{formatTime(b.endTime)} ({b.bookingRef})
                    </div>
                  ))}
                  {!hasBlock && <div className="text-green-700">Available</div>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
