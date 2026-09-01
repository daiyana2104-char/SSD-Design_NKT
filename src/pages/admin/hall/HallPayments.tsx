import { useMemo, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore } from '@/lib/adminStore';
import { paymentModes, type HallPayment } from '@/lib/mockData';
import { hallPayments as initialPayments, hallBookings as bookings } from '@/lib/hallData';

const PAGE_SIZE = 8;

const REFERENCE_REQUIRED = ['Online', 'UPI', 'Card', 'Bank Transfer', 'PayNow', 'DBS', 'NETS'];

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function derivePaymentStatus(paid: number, total: number): 'Pending' | 'Partially Paid' | 'Paid' {
  if (paid <= 0) return 'Pending';
  if (paid >= total) return 'Paid';
  return 'Partially Paid';
}

function applicablePaymentTypes(
  alreadyPaid: number,
  outstanding: number,
): HallPayment['paymentType'][] {
  const types: HallPayment['paymentType'][] = [];
  if (alreadyPaid <= 0) types.push('Advance Payment');
  if (alreadyPaid > 0 && outstanding > 0) types.push('Balance Payment');
  if (outstanding > 0) types.push('Full Payment');
  return types;
}

function suggestPaymentType(
  alreadyPaid: number,
  outstanding: number,
  amount: number,
): HallPayment['paymentType'] {
  if (amount > 0 && amount >= outstanding) return 'Full Payment';
  if (alreadyPaid <= 0) return 'Advance Payment';
  return 'Balance Payment';
}

export function HallPayments() {
  const toast = useToast();
  const { user } = useAdminStore();
  const [data, setData] = useState<HallPayment[]>(initialPayments);
  const [allBookings, setAllBookings] = useState(bookings);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<HallPayment | null>(null);
  const [form, setForm] = useState<Partial<HallPayment>>({});

  const activePaymentModes = paymentModes.filter((m) => m.status === 'Active');

  const selectedBooking = useMemo(
    () => allBookings.find((b) => b.id === form.bookingId),
    [allBookings, form.bookingId],
  );

  const existingPaymentsTotal = useMemo(() => {
    if (!form.bookingId) return 0;
    return data
      .filter((p) => p.bookingId === form.bookingId)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [data, form.bookingId]);

  const bookingTotal = selectedBooking?.grandTotal ?? selectedBooking?.totalAmount ?? 0;
  const alreadyPaid = existingPaymentsTotal;
  const outstanding = Math.max(0, bookingTotal - alreadyPaid);
  const currentPayment = Number(form.amount ?? 0);
  const balanceAfterPayment = Math.max(0, outstanding - (Number.isFinite(currentPayment) ? currentPayment : 0));

  const paymentTypeOptions = useMemo(
    () => applicablePaymentTypes(alreadyPaid, outstanding),
    [alreadyPaid, outstanding],
  );

  const computedPaymentStatus = derivePaymentStatus(
    alreadyPaid + (Number.isFinite(currentPayment) && currentPayment > 0 ? currentPayment : 0),
    bookingTotal,
  );

  const payableBookings = useMemo(
    () =>
      allBookings.filter((b) => {
        if (b.bookingStatus === 'Cancelled') return false;
        const total = b.grandTotal ?? b.totalAmount ?? 0;
        const paid = data.filter((p) => p.bookingId === b.id).reduce((sum, p) => sum + p.amount, 0);
        return total - paid > 0;
      }),
    [allBookings, data],
  );

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

  const defaultForm = (): Partial<HallPayment> => ({
    paymentMode: activePaymentModes[0]?.name ?? 'Cash',
    paymentType: 'Advance Payment',
    paymentDate: todayLocalDate(),
    collectedBy: user?.name ?? '',
  });

  const openCreate = () => {
    setViewing(null);
    setForm(defaultForm());
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
    setForm({});
  };

  const handleBookingChange = (bookingId: string) => {
    if (!bookingId) {
      setForm((prev) => ({ ...prev, bookingId: undefined, paymentType: 'Advance Payment' }));
      return;
    }
    const booking = allBookings.find((b) => b.id === bookingId);
    const total = booking?.grandTotal ?? booking?.totalAmount ?? 0;
    const paid = data.filter((p) => p.bookingId === bookingId).reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, total - paid);
    const types = applicablePaymentTypes(paid, remaining);
    setForm((prev) => ({
      ...prev,
      bookingId,
      paymentType: types[0] ?? 'Advance Payment',
      amount: undefined,
    }));
  };

  const handleAmountChange = (raw: string) => {
    const amount = raw === '' ? undefined : Number(raw);
    const numericAmount = amount ?? 0;
    setForm((prev) => ({
      ...prev,
      amount,
      paymentType: suggestPaymentType(alreadyPaid, outstanding, numericAmount),
    }));
  };

  const handleSave = () => {
    if (!form.bookingId) return toast.error('Validation Error', 'Booking is required.');

    if (outstanding <= 0) {
      return toast.error(
        'No Outstanding Amount',
        'This booking is already fully paid. No further payment can be recorded.',
      );
    }

    if (!form.paymentType) return toast.error('Validation Error', 'Payment Type is required.');
    if (!form.paymentMode) return toast.error('Validation Error', 'Payment Mode is required.');

    const amount = Number(form.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return toast.error('Validation Error', 'Payment Amount must be greater than 0.');
    }
    if (amount > outstanding) {
      return toast.error(
        'Validation Error',
        `Payment Amount (S$${amount.toFixed(2)}) cannot exceed the outstanding amount (S$${outstanding.toFixed(2)}). Maximum new payment: S$${outstanding.toFixed(2)}.`,
      );
    }

    if (REFERENCE_REQUIRED.includes(form.paymentMode ?? '') && !form.reference?.trim()) {
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
      paymentDate: form.paymentDate ?? todayLocalDate(),
      reference: form.reference?.trim() || undefined,
      collectedBy: user?.name ?? form.collectedBy ?? '',
      paymentType: form.paymentType as HallPayment['paymentType'],
    };

    setData((prev) => [newP, ...prev]);

    const newTotalPaid = alreadyPaid + amount;
    const paymentStatus = derivePaymentStatus(newTotalPaid, bookingTotal);

    setAllBookings((prev) =>
      prev.map((b) => {
        if (b.id !== form.bookingId) return b;
        return {
          ...b,
          paidAmount: newTotalPaid,
          advanceAmount: newTotalPaid,
          paymentStatus,
          status:
            paymentStatus === 'Paid'
              ? 'Paid'
              : paymentStatus === 'Partially Paid'
              ? 'Partially Paid'
              : 'Booked',
        };
      }),
    );

    toast.success('Payment recorded');
    closeModal();
  };

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
    {
      key: 'collectedBy',
      header: 'Collected By',
      render: (p) => p.collectedBy || <span className="text-brown-300">—</span>,
    },
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
  const amountExceedsOutstanding = currentPayment > outstanding && outstanding > 0;

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
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
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
            <button type="button" className="btn-outline" onClick={closeModal}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={!!selectedBooking && outstanding <= 0}
              >
                Save
              </button>
            </>
          )
        }
      >
        <div className="space-y-6">
          {/* Booking Details */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">
              Booking Details
            </h3>
            <FormField label="Booking" required>
              {isView ? (
                <TextInput
                  value={allBookings.find((b) => b.id === form.bookingId)?.bookingRef ?? form.bookingId ?? ''}
                  readOnly
                />
              ) : (
                <select
                  value={form.bookingId ?? ''}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="input"
                >
                  <option value="">Select booking</option>
                  {payableBookings.map((b) => {
                    const total = b.grandTotal ?? b.totalAmount ?? 0;
                    const paid = data.filter((p) => p.bookingId === b.id).reduce((sum, p) => sum + p.amount, 0);
                    const due = total - paid;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.bookingRef} — {b.customerName} ({b.eventDate}) · Outstanding S${due.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              )}
            </FormField>

            {selectedBooking && (
              <div className="mt-3 rounded-lg border border-brown-100 bg-cream-50 p-3 text-sm">
                <div className="grid grid-cols-2 gap-y-1.5">
                  <span className="text-brown-500">Customer</span>
                  <span className="font-medium text-brown-800">{selectedBooking.customerName}</span>
                  <span className="text-brown-500">Booking Total</span>
                  <span className="font-medium text-brown-800">S${bookingTotal.toFixed(2)}</span>
                  <span className="text-brown-500">Already Paid</span>
                  <span className="font-medium text-brown-800">S${alreadyPaid.toFixed(2)}</span>
                  <span className="text-brown-500">Outstanding Amount</span>
                  <span className="font-bold text-maroon-700">S${outstanding.toFixed(2)}</span>
                </div>
                {!isView && outstanding <= 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    This booking is already fully paid. No further payment can be recorded.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Payment Details */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">
              Payment Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    disabled={!form.bookingId || outstanding <= 0}
                  >
                    <option value="">Select type</option>
                    {paymentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField
                label="Payment Amount"
                required
                hint={
                  !isView && selectedBooking && outstanding > 0
                    ? `Maximum new payment: S$${outstanding.toFixed(2)}`
                    : undefined
                }
              >
                <TextInput
                  type="number"
                  min={0.01}
                  max={outstanding > 0 ? outstanding : undefined}
                  step="0.01"
                  value={form.amount !== undefined ? String(form.amount) : ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={isView || !form.bookingId || outstanding <= 0}
                />
                {amountExceedsOutstanding && (
                  <p className="mt-1 text-xs text-red-600">
                    Payment Amount cannot exceed the outstanding amount (S${outstanding.toFixed(2)}).
                  </p>
                )}
              </FormField>

              <FormField label="Payment Mode" required>
                {isView ? (
                  <TextInput value={form.paymentMode ?? '—'} readOnly />
                ) : (
                  <select
                    value={form.paymentMode ?? ''}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="input"
                    disabled={!form.bookingId || outstanding <= 0}
                  >
                    <option value="">Select mode</option>
                    {activePaymentModes.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField label="Payment Date" required>
                <TextInput
                  type="date"
                  value={form.paymentDate ?? ''}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  disabled={isView || !form.bookingId || outstanding <= 0}
                />
              </FormField>

              <FormField
                label="Payment Reference"
                required={REFERENCE_REQUIRED.includes(form.paymentMode ?? '')}
                hint={
                  !isView && form.paymentMode === 'Cash'
                    ? 'Optional for Cash.'
                    : !isView && REFERENCE_REQUIRED.includes(form.paymentMode ?? '')
                    ? 'Required for this payment mode.'
                    : undefined
                }
                className="sm:col-span-2"
              >
                <TextInput
                  value={form.reference ?? ''}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Transaction / reference number"
                  disabled={isView || !form.bookingId || outstanding <= 0}
                />
              </FormField>

              <FormField label="Collected By" hint="Logged-in user">
                <TextInput
                  value={isView ? form.collectedBy ?? '—' : user?.name ?? form.collectedBy ?? ''}
                  readOnly
                  className="bg-cream-50"
                />
              </FormField>
            </div>
          </section>

          {/* Payment Summary */}
          {selectedBooking && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">
                Payment Summary
              </h3>
              <div className="rounded-lg border border-brown-100 bg-cream-50 p-4 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-brown-600">Booking Total</span>
                  <span className="text-right font-medium text-brown-800">S${bookingTotal.toFixed(2)}</span>
                  <span className="text-brown-600">Already Paid</span>
                  <span className="text-right font-medium text-brown-800">S${alreadyPaid.toFixed(2)}</span>
                  <span className="text-brown-600">Outstanding Amount</span>
                  <span className="text-right font-medium text-maroon-700">S${outstanding.toFixed(2)}</span>
                  {!isView && currentPayment > 0 && (
                    <>
                      <span className="text-brown-600">Current Payment</span>
                      <span className="text-right font-medium text-brown-800">
                        − S${currentPayment.toFixed(2)}
                      </span>
                      <span className="border-t border-brown-100 pt-2 font-semibold text-brown-900">
                        Balance Amount
                      </span>
                      <span className="border-t border-brown-100 pt-2 text-right font-bold text-maroon-700">
                        S${balanceAfterPayment.toFixed(2)}
                      </span>
                    </>
                  )}
                  <span className="border-t border-brown-100 pt-2 text-brown-600">Payment Status</span>
                  <span className="border-t border-brown-100 pt-2 text-right font-medium text-brown-800">
                    {isView
                      ? derivePaymentStatus(
                          data
                            .filter((p) => p.bookingId === form.bookingId)
                            .reduce((sum, p) => sum + p.amount, 0),
                          bookingTotal,
                        )
                      : computedPaymentStatus}
                  </span>
                </div>
                {!isView && (
                  <p className="mt-2 text-xs text-brown-400">
                    Payment Status is calculated automatically and cannot be changed manually.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default HallPayments;
