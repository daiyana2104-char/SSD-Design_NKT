import { useState } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallAudits, type HallBooking } from '@/lib/mockData';
import { hallBookings as initialBookings, hallPayments } from '@/lib/hallData';

export function HallCancellation() {
  const toast = useToast();
  const [bookings, setBookings] = useState(initialBookings);
  const [cancelTarget, setCancelTarget] = useState<HallBooking | null>(null);
  const [refund, setRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const handleConfirm = () => {
    if (!cancelTarget) return;
    const paid = cancelTarget.paidAmount ?? 0;
    if (refundAmount < 0 || refundAmount > paid) return toast.error('Validation Error', 'Refund amount cannot exceed amount paid.');

    // mark booking cancelled
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'Cancelled', bookingStatus: 'Cancelled', paymentStatus: refund && refundAmount === paid ? 'Refunded' : refund && refundAmount > 0 ? 'Partially Refunded' : b.paymentStatus } : b));

    // record audit
    hallAudits.push({ id: 'ha-' + Math.random().toString(36).slice(2), action: 'Cancel Booking', module: 'Hall', refId: cancelTarget.id, previous: { status: cancelTarget.status }, next: { status: 'Cancelled' }, by: 'system', at: new Date().toISOString() });

    // if refund is to be processed, add a refund payment record (negative amount) and create audit
    if (refundAmount > 0) {
      hallPayments.push({ id: 'hp-' + Math.random().toString(36).slice(2), bookingId: cancelTarget.id, amount: -refundAmount, paymentMode: 'Refund', paymentDate: new Date().toISOString(), reference: '' });
      hallAudits.push({ id: 'ha-' + Math.random().toString(36).slice(2), action: 'Refund Processed', module: 'Hall', refId: cancelTarget.id, previous: {}, next: { refundAmount }, by: 'system', at: new Date().toISOString() });
    }

    toast.success('Booking cancelled');
    setCancelTarget(null); setRefund(false); setRefundAmount(0);
  };

  const columns: Column<HallBooking>[] = [
    { key: 'ref', header: 'Booking Ref', render: (b) => b.bookingRef },
    { key: 'customer', header: 'Customer', render: (b) => b.customerName },
    { key: 'date', header: 'Event Date', render: (b) => `${b.eventDate} ${b.startTime}-${b.endTime}` },
    { key: 'hall', header: 'Hall', render: (b) => b.hallName },
    { key: 'amount', header: 'Booking Amount', align: 'right', render: (b) => b.totalAmount },
    { key: 'paid', header: 'Paid Amount', align: 'right', render: (b) => b.paidAmount },
    { key: 'status', header: 'Status', render: (b) => b.bookingStatus },
    { key: 'payment', header: 'Payment Status', render: (b) => b.paymentStatus },
    { key: 'actions', header: 'Actions', align: 'center', render: (b) => (
      <div className="flex justify-center gap-1">
        <button type="button" onClick={() => { setCancelTarget(b); setRefund(false); setRefundAmount(0); }} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Cancel"><XCircle className="h-4 w-4"/></button>
      </div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Cancellation / Refund" description="Cancel bookings and process refunds" />

      <div className="card p-4 mt-4">
        <DataTable columns={columns} data={bookings} />
      </div>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Booking / Refund" size="md" footer={<><button type="button" className="btn-outline" onClick={() => setCancelTarget(null)}>Keep</button><button type="button" className="btn-primary" onClick={handleConfirm}>Cancel Booking</button></>}>
        {cancelTarget && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Booking Reference"><TextInput value={cancelTarget.bookingRef} readOnly /></FormField><FormField label="Customer"><TextInput value={cancelTarget.customerName} readOnly /></FormField><FormField label="Event Date"><TextInput value={`${cancelTarget.eventDate} ${cancelTarget.startTime}-${cancelTarget.endTime}`} readOnly /></FormField><FormField label="Hall"><TextInput value={cancelTarget.hallName} readOnly /></FormField><FormField label="Booking Amount"><TextInput value={`S$${cancelTarget.totalAmount}`} readOnly /></FormField><FormField label="Amount Paid"><TextInput value={`S$${cancelTarget.paidAmount}`} readOnly /></FormField><FormField label="Cancellation Reason" required><TextInput placeholder="Reason" /></FormField><FormField label="Refund Applicable"><Toggle checked={refund} onChange={setRefund} trueLabel="Yes" falseLabel="No" /></FormField>{refund && <FormField label="Refund Amount" required><TextInput type="number" min="0" max={cancelTarget.paidAmount} value={String(refundAmount)} onChange={(e) => setRefundAmount(Number(e.target.value))} /></FormField>}</div>}
      </Modal>
    </div>
  );
}

export default HallCancellation;
