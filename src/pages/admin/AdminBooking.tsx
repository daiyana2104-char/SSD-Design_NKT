import { PosProvider } from '@/lib/posStore';
import { AdminBookingForm } from '@/pages/admin/booking/AdminBookingForm';
import { posUsers } from '@/lib/posData';

export function AdminBooking() {
  return (
    <PosProvider>
      <AdminBookingInner />
    </PosProvider>
  );
}

function AdminBookingInner() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-3">
        <h1 className="font-serif text-xl font-bold text-brown-900">Admin Booking</h1>
        <p className="text-sm text-brown-500">Create bookings using the same POS cart flow — add items and services, select devotees, and complete payment.</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-brown-100 bg-white">
        <AdminBookingForm />
      </div>
    </div>
  );
}
