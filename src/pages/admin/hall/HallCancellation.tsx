import { useMemo, useState } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { users, paymentModes, hallAudits, type HallCancellationRecord } from '@/lib/mockData';
import { hallBookings as initialBookings, hallPayments as initialPayments, type HallBookingRecord } from '@/lib/hallData';

const PAGE_SIZE = 8;

interface CancellationHistoryEntry extends HallCancellationRecord {
  bookingRef: string;
  customerName: string;
  eventDate: string;
  hallName: string;
  cancelledAt: string;
}

export function HallCancellation() {
  const toast = useToast();

  const [bookings, setBookings] = useState<HallBookingRecord[]>(initialBookings);
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ── modal state ────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<HallBookingRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<HallBookingRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── cancellation form ──────────────────────────────────────────
  const [cancelForm, setCancelForm] = useState<{
    cancellationDate: string;
    cancellationReason: string;
    cancellationRemarks: string;
    cancelledBy: string;
    refundApplicable: boolean;
    refundAmount: number;
    refundMode: string;
    refundReference: string;
    refundDate: string;
    refundRemarks: string;
  }>({
    cancellationDate: new Date().toISOString().slice(0, 10),
    cancellationReason: '',
    cancellationRemarks: '',
    cancelledBy: '',
    refundApplicable: false,
    refundAmount: 0,
    refundMode: 'Cash',
    refundReference: '',
    refundDate: new Date().toISOString().slice(0, 10),
    refundRemarks: '',
  });

  // ── history ────────────────────────────────────────────────────
  const [history, setHistory] = useState<CancellationHistoryEntry[]>([]);

  // ── active masters ─────────────────────────────────────────────
  const activeUsers = users.filter((u) => u.status === 'Active');
  const activePaymentModes = paymentModes.filter((m) => m.status === 'Active');

  // ── paid amount for a booking (sum of all positive payments) ──
  const getPaidAmount = (bookingId: string) =>
    payments.filter((p) => p.bookingId === bookingId && p.amount > 0).reduce((s, p) => s + p.amount, 0);

  // ── filter / paginate ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        !q ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.hallName.toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── open cancel modal ─────────────────────────────────────────
  const openCancel = (b: HallBookingRecord) => {
    setCancelTarget(b);
    setCancelForm({
      cancellationDate: new Date().toISOString().slice(0, 10),
      cancellationReason: '',
      cancellationRemarks: '',
      cancelledBy: '',
      refundApplicable: false,
      refundAmount: 0,
      refundMode: activePaymentModes[0]?.name ?? 'Cash',
      refundReference: '',
      refundDate: new Date().toISOString().slice(0, 10),
      refundRemarks: '',
    });
  };

  const closeCancel = () => setCancelTarget(null);

  // ── confirm cancellation ──────────────────────────────────────
  const handleConfirm = () => {
    if (!cancelTarget) return;

    const { cancellationReason, cancellationDate, cancelledBy, refundApplicable, refundAmount, refundMode, refundReference, refundDate } = cancelForm;

    if (!cancellationReason.trim())
      return toast.error('Validation Error', 'Cancellation Reason is required.');
    if (!cancelledBy)
      return toast.error('Validation Error', 'Cancelled By is required.');

    const paid = getPaidAmount(cancelTarget.id);

    if (refundApplicable) {
      if (!Number.isFinite(refundAmount) || refundAmount < 0)
        return toast.error('Validation Error', 'Refund Amount must be a non-negative number.');
      if (refundAmount > paid)
        return toast.error(
          'Validation Error',
          `Refund Amount (S$${refundAmount.toFixed(2)}) cannot exceed Amount Paid (S$${paid.toFixed(2)}).`,
        );
      if (!refundDate)
        return toast.error('Validation Error', 'Refund Date is required.');
    }

    // Build cancellation record
    const cancellationDetails: HallCancellationRecord = {
      cancellationDate,
      cancellationReason: cancellationReason.trim(),
      cancellationRemarks: cancelForm.cancellationRemarks.trim() || undefined,
      cancelledBy,
      refundApplicable,
      refundAmount: refundApplicable ? refundAmount : undefined,
      refundMode: refundApplicable ? refundMode : undefined,
      refundReference: refundApplicable ? cancelForm.refundReference.trim() || undefined : undefined,
      refundDate: refundApplicable ? refundDate : undefined,
      refundRemarks: refundApplicable ? cancelForm.refundRemarks.trim() || undefined : undefined,
    };

    // Derive payment status after cancellation
    let newPaymentStatus: HallBookingRecord['paymentStatus'] = cancelTarget.paymentStatus;
    if (refundApplicable && refundAmount > 0) {
      newPaymentStatus = refundAmount >= paid ? 'Refunded' : 'Partially Refunded';
    }

    // Update booking record — never delete, just mark cancelled
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id
          ? {
              ...b,
              bookingStatus: 'Cancelled',
              status: 'Cancelled',
              paymentStatus: newPaymentStatus,
              cancellationDetails,
            }
          : b,
      ),
    );

    // If refund applicable, add a negative payment record
    if (refundApplicable && refundAmount > 0) {
      const refundPayment = {
        id: 'ref-' + Math.random().toString(36).slice(2),
        bookingId: cancelTarget.id,
        amount: -refundAmount,
        paymentMode: refundMode,
        paymentDate: refundDate,
        reference: cancelForm.refundReference.trim() || '',
        collectedBy: cancelledBy,
        paymentType: 'Balance Payment' as const,
        remarks: `Refund: ${cancelForm.refundRemarks.trim() || cancellationReason.trim()}`,
      };
      setPayments((prev) => [refundPayment, ...prev]);
    }

    // Audit entry
    hallAudits.push({
      id: 'ha-' + Math.random().toString(36).slice(2),
      action: 'Cancel Booking',
      module: 'Hall',
      refId: cancelTarget.id,
      previous: { bookingStatus: cancelTarget.bookingStatus, paymentStatus: cancelTarget.paymentStatus },
      next: { bookingStatus: 'Cancelled', paymentStatus: newPaymentStatus, cancellationDetails },
      by: cancelledBy,
      at: new Date().toISOString(),
    });

    // Save to history
    setHistory((prev) => [
      {
        ...cancellationDetails,
        bookingRef: cancelTarget.bookingRef,
        customerName: cancelTarget.customerName,
        eventDate: cancelTarget.eventDate,
        hallName: cancelTarget.hallName,
        cancelledAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    toast.success('Booking cancelled', `${cancelTarget.bookingRef} has been cancelled.`);
    closeCancel();
  };

  // ── table columns ──────────────────────────────────────────────
  const columns: Column<HallBookingRecord>[] = [
    {
      key: 'ref',
      header: 'Booking Ref',
      render: (b) => <span className="font-medium text-brown-800">{b.bookingRef}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => (
        <div>
          <p className="text-brown-800">{b.customerName}</p>
          <p className="text-xs text-brown-400">{b.mobileNumber}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Event Date', render: (b) => b.eventDate },
    { key: 'hall', header: 'Hall', render: (b) => b.hallName },
    {
      key: 'amount',
      header: 'Booking Amount',
      align: 'right',
      render: (b) => `S$${(b.grandTotal ?? b.totalAmount ?? 0).toFixed(2)}`,
    },
    {
      key: 'paid',
      header: 'Paid Amount',
      align: 'right',
      render: (b) => `S$${getPaidAmount(b.id).toFixed(2)}`,
    },
    {
      key: 'bookingStatus',
      header: 'Status',
      render: (b) => <StatusBadge status={b.bookingStatus} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (b) => <StatusBadge status={b.paymentStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (b) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => setViewTarget(b)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {b.bookingStatus !== 'Cancelled' && (
            <button
              type="button"
              onClick={() => openCancel(b)}
              className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
              title="Cancel"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── view target paid amount ────────────────────────────────────
  const viewPaid = viewTarget ? getPaidAmount(viewTarget.id) : 0;
  const viewOutstanding = viewTarget
    ? Math.max(0, (viewTarget.grandTotal ?? viewTarget.totalAmount ?? 0) - viewPaid)
    : 0;

  // ── cancel target paid amount ──────────────────────────────────
  const cancelPaid = cancelTarget ? getPaidAmount(cancelTarget.id) : 0;
  const cancelOutstanding = cancelTarget
    ? Math.max(0, (cancelTarget.grandTotal ?? cancelTarget.totalAmount ?? 0) - cancelPaid)
    : 0;

  return (
    <div>
      <PageHeader
        title="Cancellation / Refund"
        description="Cancel bookings and process refunds"
        actions={
          history.length > 0 ? (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setHistoryOpen(true)}
            >
              View History ({history.length})
            </button>
          ) : undefined
        }
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search booking ref, customer or hall..."
          filters={[]}
        />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </div>

      {/* ── View Booking Details Modal ── */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Booking Details"
        size="lg"
        footer={<button type="button" className="btn-outline" onClick={() => setViewTarget(null)}>Close</button>}
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Booking Reference">
                <TextInput value={viewTarget.bookingRef} readOnly />
              </FormField>
              <FormField label="Customer">
                <TextInput value={`${viewTarget.customerName} · ${viewTarget.mobileNumber}`} readOnly />
              </FormField>
              <FormField label="Event Date">
                <TextInput value={`${viewTarget.eventDate} · ${viewTarget.startTime}–${viewTarget.endTime}`} readOnly />
              </FormField>
              <FormField label="Hall">
                <TextInput value={viewTarget.hallName} readOnly />
              </FormField>
              <FormField label="Booking Amount">
                <TextInput value={`S$${(viewTarget.grandTotal ?? viewTarget.totalAmount ?? 0).toFixed(2)}`} readOnly />
              </FormField>
              <FormField label="Amount Paid">
                <TextInput value={`S$${viewPaid.toFixed(2)}`} readOnly />
              </FormField>
              <FormField label="Outstanding Amount">
                <TextInput value={`S$${viewOutstanding.toFixed(2)}`} readOnly />
              </FormField>
              <FormField label="Booking Status">
                <TextInput value={viewTarget.bookingStatus} readOnly />
              </FormField>
              <FormField label="Payment Status">
                <TextInput value={viewTarget.paymentStatus} readOnly />
              </FormField>
            </div>

            {viewTarget.cancellationDetails && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-red-700">Cancellation Details</h4>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-brown-400">Cancellation Date</p>
                    <p className="font-medium">{viewTarget.cancellationDetails.cancellationDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Cancelled By</p>
                    <p className="font-medium">{viewTarget.cancellationDetails.cancelledBy}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-brown-400">Reason</p>
                    <p className="font-medium">{viewTarget.cancellationDetails.cancellationReason}</p>
                  </div>
                  {viewTarget.cancellationDetails.cancellationRemarks && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-brown-400">Remarks</p>
                      <p className="font-medium">{viewTarget.cancellationDetails.cancellationRemarks}</p>
                    </div>
                  )}
                  {viewTarget.cancellationDetails.refundApplicable && (
                    <>
                      <div>
                        <p className="text-xs text-brown-400">Refund Amount</p>
                        <p className="font-semibold text-maroon-700">
                          S${(viewTarget.cancellationDetails.refundAmount ?? 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-400">Refund Mode</p>
                        <p className="font-medium">{viewTarget.cancellationDetails.refundMode}</p>
                      </div>
                      {viewTarget.cancellationDetails.refundReference && (
                        <div>
                          <p className="text-xs text-brown-400">Refund Reference</p>
                          <p className="font-medium">{viewTarget.cancellationDetails.refundReference}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-brown-400">Refund Date</p>
                        <p className="font-medium">{viewTarget.cancellationDetails.refundDate}</p>
                      </div>
                      {viewTarget.cancellationDetails.refundRemarks && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-brown-400">Refund Remarks</p>
                          <p className="font-medium">{viewTarget.cancellationDetails.refundRemarks}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Cancel Booking / Refund Modal ── */}
      <Modal
        open={!!cancelTarget}
        onClose={closeCancel}
        title="Cancel Booking / Refund"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={closeCancel}>Keep Booking</button>
            <button type="button" className="btn-primary" style={{ background: 'var(--color-red-600, #dc2626)' }} onClick={handleConfirm}>
              Confirm Cancellation
            </button>
          </>
        }
      >
        {cancelTarget && (
          <div className="space-y-5">

            {/* ── Read-only booking summary ── */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Booking Details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Booking Reference">
                  <TextInput value={cancelTarget.bookingRef} readOnly />
                </FormField>
                <FormField label="Customer">
                  <TextInput value={`${cancelTarget.customerName} · ${cancelTarget.mobileNumber}`} readOnly />
                </FormField>
                <FormField label="Event Date">
                  <TextInput value={`${cancelTarget.eventDate} · ${cancelTarget.startTime}–${cancelTarget.endTime}`} readOnly />
                </FormField>
                <FormField label="Hall">
                  <TextInput value={cancelTarget.hallName} readOnly />
                </FormField>
                <FormField label="Booking Amount">
                  <TextInput value={`S$${(cancelTarget.grandTotal ?? cancelTarget.totalAmount ?? 0).toFixed(2)}`} readOnly />
                </FormField>
                <FormField label="Amount Paid">
                  <TextInput value={`S$${cancelPaid.toFixed(2)}`} readOnly />
                </FormField>
                <FormField label="Outstanding Amount">
                  <TextInput value={`S$${cancelOutstanding.toFixed(2)}`} readOnly />
                </FormField>
              </div>
            </div>

            {/* ── Cancellation Details ── */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Cancellation Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Cancellation Date" required>
                  <input
                    type="date"
                    value={cancelForm.cancellationDate}
                    onChange={(e) => setCancelForm({ ...cancelForm, cancellationDate: e.target.value })}
                    className="input"
                  />
                </FormField>

                <FormField label="Cancelled By" required>
                  <select
                    value={cancelForm.cancelledBy}
                    onChange={(e) => setCancelForm({ ...cancelForm, cancelledBy: e.target.value })}
                    className="input"
                  >
                    <option value="">Select user</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.name}>{u.name} — {u.designation}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Cancellation Reason" required className="sm:col-span-2">
                  <TextInput
                    value={cancelForm.cancellationReason}
                    onChange={(e) => setCancelForm({ ...cancelForm, cancellationReason: e.target.value })}
                    placeholder="State the reason for cancellation"
                  />
                </FormField>

                <FormField label="Cancellation Remarks" className="sm:col-span-2">
                  <TextArea
                    value={cancelForm.cancellationRemarks}
                    onChange={(e) => setCancelForm({ ...cancelForm, cancellationRemarks: e.target.value })}
                    placeholder="Additional remarks (optional)"
                  />
                </FormField>
              </div>
            </div>

            {/* ── Refund Details ── */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Refund Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Refund Applicable" className="sm:col-span-2">
                  <Toggle
                    checked={cancelForm.refundApplicable}
                    onChange={(v) => setCancelForm({ ...cancelForm, refundApplicable: v, refundAmount: 0 })}
                    trueLabel="Yes"
                    falseLabel="No"
                  />
                  {cancelPaid === 0 && (
                    <p className="mt-1 text-xs text-brown-400">No payment has been made — cancellation without refund.</p>
                  )}
                </FormField>

                {cancelForm.refundApplicable && (
                  <>
                    <FormField
                      label="Refund Amount"
                      required
                      hint={`Maximum refundable: S$${cancelPaid.toFixed(2)}`}
                    >
                      <TextInput
                        type="number"
                        min={0}
                        max={cancelPaid}
                        step="0.01"
                        value={String(cancelForm.refundAmount)}
                        onChange={(e) =>
                          setCancelForm({ ...cancelForm, refundAmount: Number(e.target.value) })
                        }
                      />
                      {cancelForm.refundAmount > cancelPaid && (
                        <p className="mt-1 text-xs text-red-600">
                          Refund amount cannot exceed amount paid (S${cancelPaid.toFixed(2)}).
                        </p>
                      )}
                    </FormField>

                    <FormField label="Refund Mode" required>
                      <select
                        value={cancelForm.refundMode}
                        onChange={(e) => setCancelForm({ ...cancelForm, refundMode: e.target.value })}
                        className="input"
                      >
                        <option value="">Select mode</option>
                        {activePaymentModes.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Refund Reference">
                      <TextInput
                        value={cancelForm.refundReference}
                        onChange={(e) =>
                          setCancelForm({ ...cancelForm, refundReference: e.target.value })
                        }
                        placeholder="Transaction reference (optional)"
                      />
                    </FormField>

                    <FormField label="Refund Date" required>
                      <input
                        type="date"
                        value={cancelForm.refundDate}
                        onChange={(e) => setCancelForm({ ...cancelForm, refundDate: e.target.value })}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Refund Remarks" className="sm:col-span-2">
                      <TextArea
                        value={cancelForm.refundRemarks}
                        onChange={(e) =>
                          setCancelForm({ ...cancelForm, refundRemarks: e.target.value })
                        }
                        placeholder="Refund remarks (optional)"
                      />
                    </FormField>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* ── Cancellation History Modal ── */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Cancellation / Refund History"
        size="xl"
        footer={<button type="button" className="btn-outline" onClick={() => setHistoryOpen(false)}>Close</button>}
      >
        {history.length === 0 ? (
          <p className="text-sm text-brown-400">No cancellation history yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry, i) => (
              <div key={i} className="rounded-lg border border-brown-100 bg-cream-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-brown-800">{entry.bookingRef}</span>
                  <span className="text-xs text-brown-400">{new Date(entry.cancelledAt).toLocaleString()}</span>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-brown-400">Customer</p>
                    <p>{entry.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Event Date</p>
                    <p>{entry.eventDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Hall</p>
                    <p>{entry.hallName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Cancellation Date</p>
                    <p>{entry.cancellationDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Cancelled By</p>
                    <p>{entry.cancelledBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brown-400">Reason</p>
                    <p>{entry.cancellationReason}</p>
                  </div>
                  {entry.refundApplicable && (
                    <>
                      <div>
                        <p className="text-xs text-brown-400">Refund Amount</p>
                        <p className="font-semibold text-maroon-700">S${(entry.refundAmount ?? 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-400">Refund Mode</p>
                        <p>{entry.refundMode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-400">Refund Date</p>
                        <p>{entry.refundDate}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HallCancellation;
