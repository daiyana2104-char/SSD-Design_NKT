import { useMemo, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { users, paymentModes, type HallPayment } from '@/lib/mockData';
import { hallPayments as initialPayments, hallBookings as bookings } from '@/lib/hallData';

const PAGE_SIZE = 8;

// Payment modes that require a reference number
const REFERENCE_REQUIRED = ['Online', 'UPI', 'Card', 'Bank Transfer', 'PayNow', 'DBS', 'NETS'];

export function HallPayments() {
  const toast = useToast();
  const [data, setData] = useState<HallPayment[]>(initialPayments);
  const [allBookings, setAllBookings] = useState(bookings);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<HallPayment | null>(null);
  const [form, setForm] = useState<Partial<HallPayment>>({
    paymentMode: 'Cash',
    paymentType: 'Advance Payment',
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  // ── active masters ─────────────────────────────────────────────
  const activePaymentModes = paymentModes.filter((m) => m.status === 'Active');
  const activeUsers = users.filter((u) => u.status === 'Active');

  // ── selected booking auto-fill ─────────────────────────────────
  const selectedBooking = useMemo(
    () => allBookings.find((b) => b.id === form.bookingId),
    [allBookings, form.bookingId],
  );

  // Sum of all existing payments for the selected booking
  const existingPaymentsTotal = useMemo(() => {
    if (!form.bookingId) return 0;
    return data
      .filter((p) => p.bookingId === form.bookingId)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [data, form.bookingId]);

  const totalBookingAmount = selectedBooking?.grandTotal ?? selectedBooking?.totalAmount ?? 0;
  const alreadyPaid = existingPaymentsTotal;
  const balance = Math.max(0, totalBookingAmount - alreadyPaid);

  // ── filter & paginate ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(
      (p) =>
        !q ||
        p.reference?.toLowerCase().includes(q) ||
        p.paymentMode.toLowerCase().includes(q) ||
        allBookings.find((b) => b.id === p.bookingId)?.bookingRef.toLowerCase().includes(q),
    );
  }, [data, search, allBookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── open helpers ───────────────────────────────────────────────
  const openCreate = () => {
    setViewing(null);
    setForm({
      paymentMode: 'Cash',
      paymentType: 'Advance Payment',
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openView = (p: HallPayment) => {
    setViewing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewing(null);
    setForm({
      paymentMode: 'Cash',
      paymentType: 'Advance Payment',
      paymentDate: new Date().toISOString().slice(0, 10),
    });
  };

  // ── save ───────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.bookingId) return toast.error('Validation Error', 'Booking is required.');
    if (!form.paymentType) return toast.error('Validation Error', 'Payment Type is required.');
    if (!form.paymentMode) return toast.error('Validation Error', 'Payment Mode is required.');

    const amount = Number(form.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0)
      return toast.error('Validation Error', 'Payment Amount must be greater than 0.');
    if (amount > balance)
      return toast.error(
        'Validation Error',
        `Payment Amount (S$${amount.toFixed(2)}) cannot exceed the outstanding balance (S$${balance.toFixed(2)}).`,
      );

    // Reference required for certain modes
    if (
      REFERENCE_REQUIRED.includes(form.paymentMode ?? '') &&
      !form.reference?.trim()
    ) {
      return toast.error(
        'Validation Error',
        `Payment Reference is required for ${form.paymentMode} payments.`,
      );
    }

    if (!form.paymentDate) return toast.error('Validation Error', 'Payment Date is required.');

    const newP: HallPayment = {
      id: 'hp-' + Math.random().toString(36).slice(2),
      bookingId: form.bookingId,
      amount,
      paymentMode: form.paymentMode ?? 'Cash',
      paymentDate: form.paymentDate ?? new Date().toISOString().slice(0, 10),
      reference: form.reference ?? '',
      collectedBy: form.collectedBy ?? '',
      paymentType: form.paymentType as HallPayment['paymentType'],
      remarks: form.remarks ?? '',
    };

    setData((prev) => [newP, ...prev]);

    // Update the booking's paidAmount and payment/booking status
    const newTotal = alreadyPaid + amount;
    setAllBookings((prev) =>
      prev.map((b) => {
        if (b.id !== form.bookingId) return b;
        let paymentStatus: typeof b.paymentStatus = 'Pending';
        if (newTotal >= totalBookingAmount) paymentStatus = 'Paid';
        else if (newTotal > 0) paymentStatus = 'Partially Paid';
        return {
          ...b,
          paidAmount: newTotal,
          paymentStatus,
          status: newTotal >= totalBookingAmount ? 'Paid' : newTotal > 0 ? 'Partially Paid' : 'Booked',
        };
      }),
    );

    toast.success('Payment recorded');
    closeModal();
  };

  // ── table columns ──────────────────────────────────────────────
  const columns: Column<HallPayment>[] = [
    {
      key: 'booking',
      header: 'Booking',
      render: (p) => {
        const b = allBookings.find((x) => x.id === p.bookingId);
        return (
          <div>
            <p className="font-medium text-brown-800">{b?.bookingRef ?? p.bookingId}</p>
            <p className="text-xs text-brown-400">{b?.customerName ?? ''}</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Payment Type',
      render: (p) => <span className="text-brown-700">{p.paymentType ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (p) => <span className="font-medium text-brown-800">S${p.amount.toFixed(2)}</span>,
    },
    { key: 'mode', header: 'Payment Mode', render: (p) => p.paymentMode },
    { key: 'date', header: 'Payment Date', render: (p) => p.paymentDate },
    {
      key: 'ref',
      header: 'Payment Reference',
      render: (p) => p.reference || <span className="text-brown-300">—</span>,
    },
    { key: 'collectedBy', header: 'Collected By', render: (p) => p.collectedBy || <span className="text-brown-300">—</span> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (p) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openView(p)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const isView = !!viewing;

  return (
    <div>
      <PageHeader
        title="Hall Payments"
        description="Manage payments for hall bookings"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Payment
          </button>
        }
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by booking ref, reference or mode..."
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={isView ? 'View Payment' : 'Add Payment'}
        size="md"
        footer={
          isView ? (
            <button type="button" className="btn-outline" onClick={closeModal}>Close</button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSave}>Save</button>
            </>
          )
        }
      >
        <div className="space-y-4">

          {/* Booking selection */}
          <FormField label="Booking" required>
            {isView ? (
              <TextInput
                value={allBookings.find((b) => b.id === form.bookingId)?.bookingRef ?? form.bookingId ?? ''}
                readOnly
              />
            ) : (
              <select
                value={form.bookingId ?? ''}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                className="input"
              >
                <option value="">Select booking</option>
                {allBookings
                  .filter((b) => b.bookingStatus !== 'Cancelled')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingRef} — {b.customerName} ({b.eventDate})
                    </option>
                  ))}
              </select>
            )}
          </FormField>

          {/* Auto-filled booking info — read-only */}
          {selectedBooking && (
            <div className="rounded-lg border border-brown-100 bg-cream-50 p-3 text-sm">
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-brown-500">Customer</span>
                <span className="font-medium text-brown-800">{selectedBooking.customerName}</span>
                <span className="text-brown-500">Total Booking Amount</span>
                <span className="font-medium text-brown-800">S${totalBookingAmount.toFixed(2)}</span>
                <span className="text-brown-500">Amount Already Paid</span>
                <span className="font-medium text-brown-800">S${alreadyPaid.toFixed(2)}</span>
                <span className="text-brown-500">Balance Amount</span>
                <span className="font-bold text-maroon-700">S${balance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment Type */}
          <FormField label="Payment Type" required>
            {isView ? (
              <TextInput value={form.paymentType ?? '—'} readOnly />
            ) : (
              <select
                value={form.paymentType ?? ''}
                onChange={(e) =>
                  setForm({ ...form, paymentType: e.target.value as HallPayment['paymentType'] })
                }
                className="input"
              >
                <option value="">Select type</option>
                <option value="Advance Payment">Advance Payment</option>
                <option value="Partial Payment">Partial Payment</option>
                <option value="Balance Payment">Balance Payment</option>
              </select>
            )}
          </FormField>

          {/* Amount */}
          <FormField
            label="Payment Amount"
            required
            hint={!isView && selectedBooking ? `Outstanding balance: S$${balance.toFixed(2)}` : undefined}
          >
            <TextInput
              type="number"
              min={0.01}
              step="0.01"
              value={form.amount !== undefined ? String(form.amount) : ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              placeholder="0.00"
              disabled={isView}
            />
          </FormField>

          {/* Payment Mode */}
          <FormField label="Payment Mode" required>
            {isView ? (
              <TextInput value={form.paymentMode ?? '—'} readOnly />
            ) : (
              <select
                value={form.paymentMode ?? 'Cash'}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="input"
              >
                <option value="">Select mode</option>
                {activePaymentModes.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            )}
          </FormField>

          {/* Payment Date */}
          <FormField label="Payment Date" required>
            <TextInput
              type="date"
              value={form.paymentDate ?? ''}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              disabled={isView}
            />
          </FormField>

          {/* Payment Reference */}
          <FormField
            label="Payment Reference"
            required={REFERENCE_REQUIRED.includes(form.paymentMode ?? '')}
            hint={
              !isView && REFERENCE_REQUIRED.includes(form.paymentMode ?? '')
                ? 'Required for this payment mode.'
                : !isView
                ? 'Optional for Cash.'
                : undefined
            }
          >
            <TextInput
              value={form.reference ?? ''}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Transaction / reference number"
              disabled={isView}
            />
          </FormField>

          {/* Collected By */}
          <FormField label="Collected By">
            {isView ? (
              <TextInput value={form.collectedBy ?? '—'} readOnly />
            ) : (
              <select
                value={form.collectedBy ?? ''}
                onChange={(e) => setForm({ ...form, collectedBy: e.target.value })}
                className="input"
              >
                <option value="">Select user</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.name}>{u.name} — {u.designation}</option>
                ))}
              </select>
            )}
          </FormField>

          {/* Remarks */}
          <FormField label="Remarks">
            <TextArea
              value={form.remarks ?? ''}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional remarks..."
              disabled={isView}
            />
          </FormField>

        </div>
      </Modal>
    </div>
  );
}

export default HallPayments;
