import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { users, type HallPayment } from '@/lib/mockData';
import { hallPayments as initialPayments, hallBookings as bookings } from '@/lib/hallData';

const PAGE_SIZE = 8;

export function HallPayments() {
  const toast = useToast();
  const [data, setData] = useState<HallPayment[]>(initialPayments);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HallPayment>>({ paymentMode: 'Cash', paymentType: 'Advance Payment', paymentDate: new Date().toISOString().slice(0, 10) });
  const selectedBooking = bookings.find((booking) => booking.id === form.bookingId);
  const alreadyPaid = selectedBooking?.paidAmount ?? 0;
  const balance = Math.max(0, (selectedBooking?.totalAmount ?? 0) - alreadyPaid);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(p => !q || p.reference?.toLowerCase().includes(q) || p.paymentMode.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setForm({ paymentDate: new Date().toISOString().slice(0,10) }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.bookingId || !form.amount || !form.paymentType) return toast.error('Validation Error', 'Please fill required fields.');
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) return toast.error('Validation Error', 'Amount must be greater than 0.');
    if (Number(form.amount) > balance) return toast.error('Validation Error', 'Payment cannot exceed the outstanding balance.');
    if (form.paymentMode !== 'Cash' && !form.reference?.trim()) return toast.error('Validation Error', 'Payment reference is required for this payment mode.');
    const newP: HallPayment = { id: 'hp-' + Math.random().toString(36).slice(2), bookingId: form.bookingId as string, amount: Number(form.amount), paymentMode: form.paymentMode ?? 'Cash', paymentDate: form.paymentDate ?? new Date().toISOString().slice(0, 10), reference: form.reference ?? '', collectedBy: form.collectedBy ?? '', paymentType: form.paymentType, remarks: form.remarks };
    setData(prev => [...prev, newP]);
    toast.success('Payment recorded');
    setModalOpen(false);
    setForm({ paymentMode: 'Cash', paymentType: 'Advance Payment', paymentDate: new Date().toISOString().slice(0, 10) });
  };

  const columns: Column<HallPayment>[] = [
    { key: 'booking', header: 'Booking', render: (p) => p.bookingId },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => p.amount },
    { key: 'mode', header: 'Mode', render: (p) => p.paymentMode },
    { key: 'date', header: 'Date', render: (p) => p.paymentDate },
    { key: 'ref', header: 'Reference', render: (p) => p.reference },
  ];

  return (
    <div>
      <PageHeader title="Hall Payments" description="Manage payments for hall bookings" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Payment</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search payments..." filters={[]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Payment" size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Booking" required>
            <select value={form.bookingId ?? ''} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} className="input">
              <option value="">Select booking</option>
              {bookings.map(b => <option key={b.id} value={b.id}>{b.bookingRef} - {b.eventDate}</option>)}
            </select>
          </FormField>

          {selectedBooking && <div className="rounded bg-cream-50 p-3 text-sm text-brown-700"><p>Customer: {selectedBooking.customerName}</p><p>Total: S${selectedBooking.totalAmount.toFixed(2)}</p><p>Paid: S${alreadyPaid.toFixed(2)}</p><p>Balance: S${balance.toFixed(2)}</p></div>}

          <FormField label="Payment Type" required><select value={form.paymentType ?? ''} onChange={(e) => setForm({ ...form, paymentType: e.target.value as HallPayment['paymentType'] })} className="input"><option value="Advance Payment">Advance Payment</option><option value="Partial Payment">Partial Payment</option><option value="Balance Payment">Balance Payment</option></select></FormField>
          <FormField label="Amount" required>
            <TextInput type="number" value={String(form.amount ?? '')} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </FormField>

          <FormField label="Payment Mode">
            <select value={form.paymentMode ?? 'Cash'} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="input">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>
          </FormField>

          <FormField label="Payment Date">
            <TextInput type="date" value={form.paymentDate ?? ''} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
          </FormField>

          <FormField label="Payment Reference">
            <TextInput value={form.reference ?? ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </FormField>

          <FormField label="Collected By">
            <select value={form.collectedBy ?? ''} onChange={(e) => setForm({ ...form, collectedBy: e.target.value })} className="input"><option value="">Select user</option>{users.filter(user => user.status === 'Active').map(user => <option key={user.id} value={user.name}>{user.name}</option>)}</select>
          </FormField>

          <FormField label="Remarks"><TextInput value={form.remarks ?? ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>

        </div>
      </Modal>
    </div>
  );
}

export default HallPayments;
