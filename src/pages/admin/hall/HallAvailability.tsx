import { useMemo, useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import {
  halls as allHalls,
  hallPackages as allPackages,
  holidays,
} from '@/lib/mockData';
import { hallBookings as seedBookings } from '@/lib/hallData';

// ─── types ─────────────────────────────────────────────────────────────────

type SearchMode = 'hall' | 'package';

interface ConflictDetail {
  bookingRef: string;
  customerName: string;
  startTime: string;
  endTime: string;
  bookingStatus: string;
}

interface AvailabilityRow {
  id: string;
  hallId?: string;
  hallName: string;
  packageId?: string;
  packageName?: string;
  status: 'Available' | 'Unavailable' | 'Blocked';
  reason?: string;
  conflicts: ConflictDetail[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string): string {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Standard interval overlap: does [s1,e1) overlap [s2,e2)? */
function timesOverlap(
  s1: string, e1: string,
  s2: string, e2: string,
): boolean {
  return !(e1 <= s2 || s1 >= e2);
}

/** Check a single hall's availability for a given date + time window. */
function checkHall(
  hallId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): { available: boolean; blockedByHoliday: string | null; conflicts: ConflictDetail[] } {
  // Holiday / blocked period check
  const reqStart = new Date(`${date}T${startTime}`);
  const reqEnd   = new Date(`${date}T${endTime}`);

  const holiday = holidays.find(
    (h) =>
      h.status === 'Active' &&
      reqEnd   > new Date(h.start) &&
      reqStart < new Date(h.end),
  );
  if (holiday) {
    return { available: false, blockedByHoliday: holiday.name, conflicts: [] };
  }

  // Booking overlap
  const conflicts: ConflictDetail[] = seedBookings
    .filter(
      (b) =>
        b.id !== excludeBookingId &&
        b.hallIds.includes(hallId) &&
        b.eventDate === date &&
        b.bookingStatus !== 'Cancelled' &&
        timesOverlap(startTime, endTime, b.startTime, b.endTime),
    )
    .map((b) => ({
      bookingRef:    b.bookingRef,
      customerName:  b.customerName,
      startTime:     b.startTime,
      endTime:       b.endTime,
      bookingStatus: b.bookingStatus,
    }));

  return { available: conflicts.length === 0, blockedByHoliday: null, conflicts };
}

/**
 * Public utility: Check availability for a set of hall IDs.
 * Used by HallBooking to validate before saving.
 */
export function checkHallsAvailability(
  hallIds: string[],
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): { available: boolean; message: string } {
  if (!date || !startTime || !endTime || startTime >= endTime || !hallIds.length) {
    return { available: false, message: 'Date, Start Time and End Time are required.' };
  }
  for (const hid of hallIds) {
    const hall = allHalls.find((h) => h.id === hid);
    if (!hall) continue;
    if (hall.status !== 'Active') {
      return { available: false, message: `Hall "${hall.name}" is inactive.` };
    }
    const result = checkHall(hid, date, startTime, endTime, excludeBookingId);
    if (result.blockedByHoliday) {
      return {
        available: false,
        message: `The selected period is blocked by the holiday "${result.blockedByHoliday}".`,
      };
    }
    if (!result.available) {
      const c = result.conflicts[0];
      return {
        available: false,
        message:
          `Hall "${hall.name}" is already booked from ${fmt(c.startTime)} to ${fmt(c.endTime)} ` +
          `(Ref: ${c.bookingRef}).`,
      };
    }
  }
  return { available: true, message: '' };
}

// ─── component ─────────────────────────────────────────────────────────────

export function HallAvailability() {
  // ── search inputs ──────────────────────────────────────────────
  const [mode, setMode]           = useState<SearchMode>('hall');
  const [hallId, setHallId]       = useState('');
  const [packageId, setPackageId] = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime]     = useState('');
  const [checked, setChecked]     = useState(false);

  // ── active master data ─────────────────────────────────────────
  const activeHalls    = useMemo(() => allHalls.filter((h) => h.status === 'Active'),    []);
  const activePackages = useMemo(() => allPackages.filter((p) => p.status === 'Active'), []);

  // ── input validation ───────────────────────────────────────────
  const inputErrors = useMemo(() => {
    const errs: string[] = [];
    if (!date)                         errs.push('Event Date is required.');
    if (!startTime)                    errs.push('Start Time is required.');
    if (!endTime)                      errs.push('End Time is required.');
    if (startTime && endTime && startTime >= endTime)
                                       errs.push('Start Time must be before End Time.');
    if (mode === 'hall'    && !hallId)    errs.push('Please select a Hall.');
    if (mode === 'package' && !packageId) errs.push('Please select a Hall Package.');
    return errs;
  }, [date, startTime, endTime, mode, hallId, packageId]);

  // ── availability rows ──────────────────────────────────────────
  const rows = useMemo((): AvailabilityRow[] => {
    if (!checked || inputErrors.length > 0) return [];

    if (mode === 'hall') {
      const hall = allHalls.find((h) => h.id === hallId);
      if (!hall) return [];

      const result = checkHall(hall.id, date, startTime, endTime);
      let status: AvailabilityRow['status'] = 'Available';
      let reason: string | undefined;

      if (result.blockedByHoliday) {
        status = 'Blocked';
        reason = `Blocked by holiday: ${result.blockedByHoliday}`;
      } else if (!result.available) {
        status = 'Unavailable';
      }

      return [{
        id:       hall.id,
        hallId:   hall.id,
        hallName: hall.name,
        status,
        reason,
        conflicts: result.conflicts,
      }];
    }

    // Package mode — check every hall in the package
    const pkg = allPackages.find((p) => p.id === packageId);
    if (!pkg) return [];

    const hallRows: AvailabilityRow[] = (pkg.halls ?? []).map((hid) => {
      const hall = allHalls.find((h) => h.id === hid);
      if (!hall) {
        return {
          id:          hid,
          hallId:      hid,
          hallName:    `Hall ${hid} (not found)`,
          packageId:   pkg.id,
          packageName: pkg.name,
          status:      'Unavailable' as const,
          reason:      'Hall not found or inactive',
          conflicts:   [],
        };
      }

      if (hall.status !== 'Active') {
        return {
          id:          hall.id,
          hallId:      hall.id,
          hallName:    hall.name,
          packageId:   pkg.id,
          packageName: pkg.name,
          status:      'Unavailable' as const,
          reason:      'Hall is inactive',
          conflicts:   [],
        };
      }

      const result = checkHall(hall.id, date, startTime, endTime);
      let status: AvailabilityRow['status'] = 'Available';
      let reason: string | undefined;

      if (result.blockedByHoliday) {
        status = 'Blocked';
        reason = `Blocked by holiday: ${result.blockedByHoliday}`;
      } else if (!result.available) {
        status = 'Unavailable';
      }

      return {
        id:          hall.id,
        hallId:      hall.id,
        hallName:    hall.name,
        packageId:   pkg.id,
        packageName: pkg.name,
        status,
        reason,
        conflicts:   result.conflicts,
      };
    });

    return hallRows;
  }, [checked, inputErrors, mode, hallId, packageId, date, startTime, endTime]);

  // ── package-level summary ──────────────────────────────────────
  const packageOverallAvailable =
    mode === 'package' &&
    checked &&
    rows.length > 0 &&
    rows.every((r) => r.status === 'Available');

  const packageOverallUnavailable =
    mode === 'package' &&
    checked &&
    rows.some((r) => r.status !== 'Available');

  // ── check handler ──────────────────────────────────────────────
  const handleCheck = () => {
    if (inputErrors.length > 0) return;
    setChecked(true);
  };

  const handleReset = () => {
    setChecked(false);
    setHallId('');
    setPackageId('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div>
      <PageHeader
        title="Hall Availability"
        description="Check hall or package availability for a requested date and time"
      />

      {/* ── Search Panel ── */}
      <div className="card p-5">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setMode('hall'); setChecked(false); setPackageId(''); }}
            className={
              mode === 'hall'
                ? 'rounded-lg bg-maroon-600 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-lg border border-brown-200 bg-white px-4 py-2 text-sm font-medium text-brown-700 hover:bg-cream-50'
            }
          >
            By Hall
          </button>
          <button
            type="button"
            onClick={() => { setMode('package'); setChecked(false); setHallId(''); }}
            className={
              mode === 'package'
                ? 'rounded-lg bg-maroon-600 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-lg border border-brown-200 bg-white px-4 py-2 text-sm font-medium text-brown-700 hover:bg-cream-50'
            }
          >
            By Hall Package
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Hall or Package selector */}
          {mode === 'hall' ? (
            <div>
              <label className="label text-xs font-semibold text-brown-500">
                Hall <span className="text-maroon-600">*</span>
              </label>
              <select
                value={hallId}
                onChange={(e) => { setHallId(e.target.value); setChecked(false); }}
                className="input mt-1"
              >
                <option value="">Select a hall…</option>
                {activeHalls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (Cap: {h.seatingCapacity ?? '—'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label text-xs font-semibold text-brown-500">
                Hall Package <span className="text-maroon-600">*</span>
              </label>
              <select
                value={packageId}
                onChange={(e) => { setPackageId(e.target.value); setChecked(false); }}
                className="input mt-1"
              >
                <option value="">Select a package…</option>
                {activePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({(p.halls ?? []).length} hall{(p.halls ?? []).length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event Date */}
          <div>
            <label className="label text-xs font-semibold text-brown-500">
              Event Date <span className="text-maroon-600">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setChecked(false); }}
              className="input mt-1"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="label text-xs font-semibold text-brown-500">
              Start Time <span className="text-maroon-600">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setChecked(false); }}
              className="input mt-1"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="label text-xs font-semibold text-brown-500">
              End Time <span className="text-maroon-600">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setChecked(false); }}
              className="input mt-1"
            />
          </div>

        </div>

        {/* Input errors */}
        {inputErrors.length > 0 && (
          <ul className="mt-3 space-y-1">
            {inputErrors.map((e, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={inputErrors.length > 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Check Availability
          </button>
          {checked && (
            <button type="button" onClick={handleReset} className="btn-outline">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {checked && rows.length > 0 && (
        <div className="mt-4 space-y-3">

          {/* Package-level summary banner */}
          {mode === 'package' && (
            <div
              className={
                packageOverallAvailable
                  ? 'flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4'
                  : 'flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4'
              }
            >
              {packageOverallAvailable ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${packageOverallAvailable ? 'text-green-800' : 'text-red-800'}`}>
                  {packageOverallAvailable
                    ? `Package "${allPackages.find((p) => p.id === packageId)?.name}" is available for ${date} · ${fmt(startTime)} – ${fmt(endTime)}`
                    : `Package "${allPackages.find((p) => p.id === packageId)?.name}" is NOT available — one or more halls have a conflict`}
                </p>
                {packageOverallUnavailable && (
                  <p className="mt-0.5 text-sm text-red-600">
                    All halls in the package must be free for the package to be bookable.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Per-hall result cards */}
          {rows.map((row) => (
            <div
              key={row.id}
              className={
                row.status === 'Available'
                  ? 'card border-l-4 border-l-green-500 p-4'
                  : row.status === 'Blocked'
                  ? 'card border-l-4 border-l-saffron-500 p-4'
                  : 'card border-l-4 border-l-red-500 p-4'
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                {/* Left — hall info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brown-900">{row.hallName}</span>
                    {row.packageName && (
                      <span className="rounded bg-cream-100 px-2 py-0.5 text-xs text-brown-600">
                        {row.packageName}
                      </span>
                    )}
                    {/* Status badge */}
                    {row.status === 'Available' && (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" /> Available
                      </span>
                    )}
                    {row.status === 'Blocked' && (
                      <span className="flex items-center gap-1 rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-medium text-saffron-700">
                        <AlertCircle className="h-3.5 w-3.5" /> Blocked
                      </span>
                    )}
                    {row.status === 'Unavailable' && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <XCircle className="h-3.5 w-3.5" /> Unavailable
                      </span>
                    )}
                  </div>

                  {/* Requested window */}
                  <p className="mt-1 text-sm text-brown-500">
                    {date} &nbsp;·&nbsp; {fmt(startTime)} – {fmt(endTime)}
                  </p>

                  {/* Blocked reason */}
                  {row.reason && (
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-saffron-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {row.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Conflict details */}
              {row.conflicts.length > 0 && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                    <Info className="h-3.5 w-3.5" />
                    Conflicting Booking{row.conflicts.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {row.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-2 gap-x-4 gap-y-0.5 rounded border border-red-200 bg-white p-2 text-sm sm:grid-cols-4"
                      >
                        <div>
                          <p className="text-xs text-brown-400">Booking Ref</p>
                          <p className="font-medium text-brown-800">{c.bookingRef}</p>
                        </div>
                        <div>
                          <p className="text-xs text-brown-400">Customer</p>
                          <p className="text-brown-700">{c.customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-brown-400">Time</p>
                          <p className="text-brown-700">{fmt(c.startTime)} – {fmt(c.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-brown-400">Status</p>
                          <p className="text-brown-700">{c.bookingStatus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All-clear message */}
              {row.status === 'Available' && (
                <p className="mt-2 text-sm text-green-700">
                  No bookings or blocked periods found for this time window.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state before check */}
      {!checked && (
        <div className="card mt-4 flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-3 h-10 w-10 text-brown-200" />
          <p className="font-medium text-brown-500">Select a Hall or Package, date and time, then click Check Availability.</p>
          <p className="mt-1 text-sm text-brown-400">No fixed time slots — availability is calculated dynamically based on your requested window.</p>
        </div>
      )}
    </div>
  );
}

export default HallAvailability;
