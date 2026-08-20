import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallBookings as initialBookings, hallPayments, hallAudits, type HallBooking } from '@/lib/mockData';

export function HallCancellation() {
  const toast = useToast();
  const [bookings, setBookings] = useState<HallBooking[]>(initialBookings);
  const [deleteTarget, setDeleteTarget] = useState<HallBooking | null>(null);
  const [deduction, setDeduction] = useState(0);

  const handleConfirm = () => {
    if (!deleteTarget) return;
    const paid = deleteTarget.paidAmount ?? 0;
    const refundable = Math.max(0, (deleteTarget.totalAmount ?? 0) - deduction);

    // mark booking cancelled
    setBookings(prev => prev.map(b => b.id === deleteTarget.id ? { ...b, status: 'Cancelled' } : b));

    // record audit
    hallAudits.push({ id: 'ha-' + Math.random().toString(36).slice(2), action: 'Cancel Booking', module: 'Hall', refId: deleteTarget.id, previous: { status: deleteTarget.status }, next: { status: 'Cancelled' }, by: 'system', at: new Date().toISOString() });

    // if refund is to be processed, add a refund payment record (negative amount) and create audit
    if (refundable > 0) {
      hallPayments.push({ id: 'hp-' + Math.random().toString(36).slice(2), bookingId: deleteTarget.id, amount: -refundable, paymentMode: 'Refund', paymentDate: new Date().toISOString(), reference: '' });
      hallAudits.push({ id: 'ha-' + Math.random().toString(36).slice(2), action: 'Refund Processed', module: 'Hall', refId: deleteTarget.id, previous: {}, next: { refundAmount: refundable }, by: 'system', at: new Date().toISOString() });
    }

    toast.success('Booking cancelled');
    setDeleteTarget(null);
    setDeduction(0);
  };

  const columns: Column<HallBooking>[] = [
    { key: 'ref', header: 'Booking Ref', render: (b) => b.bookingRef },
    { key: 'date', header: 'Event Date', render: (b) => `${b.eventDate} ${b.startTime}-${b.endTime}` },
    { key: 'amount', header: 'Amount', align: 'right', render: (b) => b.totalAmount },
    { key: 'status', header: 'Status', render: (b) => b.status },
    { key: 'actions', header: 'Actions', align: 'center', render: (b) => (
      <div className="flex justify-center gap-1">
        <button type="button" onClick={() => setDeleteTarget(b)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Cancel"><Trash2 className="h-4 w-4"/></button>
      </div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Cancellation / Refund" description="Cancel bookings and process refunds" />

      <div className="card p-4 mt-4">
        <DataTable columns={columns} data={bookings} />
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirm} title="Cancel Booking" message={`Cancel booking ${deleteTarget?.bookingRef ?? ''}?`} confirmLabel="Cancel Booking" cancelLabel="Keep" variant="danger">
        <div className="grid gap-4">
          <FormField label="Deduction Amount">
            <TextInput type="number" value={String(deduction)} onChange={(e) => setDeduction(Number(e.target.value))} />
          </FormField>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default HallCancellation;
