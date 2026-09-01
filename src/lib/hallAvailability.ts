import { halls } from '@/lib/mockData';
import type { HallException } from '@/lib/mockData';
import type { HallBookingRecord } from '@/lib/hallData';

/** Standard interval overlap: does [s1,e1) overlap [s2,e2)? */
export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return !(e1 <= s2 || s1 >= e2);
}

function fmtTime(value: string): string {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function bookingOverlaps(
  bookings: HallBookingRecord[],
  hallId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): HallBookingRecord | null {
  return (
    bookings.find(
      (b) =>
        b.id !== excludeBookingId &&
        b.hallIds.includes(hallId) &&
        b.eventDate === date &&
        b.bookingStatus !== 'Cancelled' &&
        timesOverlap(startTime, endTime, b.startTime, b.endTime),
    ) ?? null
  );
}

export function exceptionOverlaps(
  exceptions: HallException[],
  hallId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeExceptionId?: string,
): HallException | null {
  return (
    exceptions.find(
      (ex) =>
        ex.id !== excludeExceptionId &&
        ex.status === 'Active' &&
        ex.hallId === hallId &&
        ex.exceptionDate === date &&
        timesOverlap(startTime, endTime, ex.startTime, ex.endTime),
    ) ?? null
  );
}

export function checkHallsAvailability(
  hallIds: string[],
  date: string,
  startTime: string,
  endTime: string,
  bookings: HallBookingRecord[],
  exceptions: HallException[],
  excludeBookingId?: string,
): { available: boolean; message: string } {
  if (!date || !startTime || !endTime || startTime >= endTime || !hallIds.length) {
    return { available: false, message: 'Date, Start Time and End Time are required.' };
  }

  for (const hid of hallIds) {
    const hall = halls.find((h) => h.id === hid);
    if (!hall) continue;
    if (hall.status !== 'Active') {
      return { available: false, message: `Hall "${hall.name}" is inactive.` };
    }

    const exceptionHit = exceptionOverlaps(exceptions, hid, date, startTime, endTime);
    if (exceptionHit) {
      const reason = exceptionHit.reason?.trim();
      return {
        available: false,
        message: reason
          ? `Hall "${hall.name}" is blocked for this period (${reason}).`
          : `Hall "${hall.name}" is blocked for this period.`,
      };
    }

    const bookingHit = bookingOverlaps(bookings, hid, date, startTime, endTime, excludeBookingId);
    if (bookingHit) {
      return {
        available: false,
        message:
          `Hall "${hall.name}" is already booked from ${fmtTime(bookingHit.startTime)} to ${fmtTime(bookingHit.endTime)} ` +
          `(Ref: ${bookingHit.bookingRef}).`,
      };
    }
  }

  return { available: true, message: '' };
}
