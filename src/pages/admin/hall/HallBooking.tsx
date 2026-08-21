import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, MultiSelect } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { customers, halls as initialHalls, hallPackages as packages, type HallBooking, type Hall } from '@/lib/mockData';
import { hallBookings as initialBookings, type HallBookingRecord } from '@/lib/hallData';

const PAGE_SIZE = 8;

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function HallBooking() {
  const toast = useToast();
  const [bookings, setBookings] = useState<HallBookingRecord[]>(initialBookings);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HallBooking>>({});
  const [editing, setEditing] = useState<HallBooking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HallBooking | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(b => !q || b.bookingRef.toLowerCase().includes(q));
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ bookingRef: 'BKG-' + Date.now().toString().slice(-6), eventDate: '', startTime: '', endTime: '', guests: 0, mealsRequired: false });
    setModalOpen(true);
  };

  const overlaps = (hallId: string, date: string, start: string, end: string) => {
    const s = new Date(date + 'T' + start).getTime();
    const e = new Date(date + 'T' + end).getTime();
    return bookings.some(b => b.hallIds.includes(hallId) && b.eventDate === date && !(e <= new Date(b.eventDate + 'T' + b.startTime).getTime() || s >= new Date(b.eventDate + 'T' + b.endTime).getTime()) && b.status !== 'Cancelled');
  };

  const handleSave = () => {
    if (!form.bookingRef || !form.eventDate || !form.startTime || !form.endTime || !form.customerId) return toast.error('Validation Error', 'Please fill required fields.');

    const selectedHallIds = form.hallIds ?? [];
    if (selectedHallIds.length === 0) return toast.error('Validation Error', 'Select at least one hall or package.');

    // availability check
    for (const hid of selectedHallIds) {
      if (overlaps(hid, form.eventDate, form.startTime, form.endTime)) return toast.error('Availability', 'Selected hall is not available for the selected time.');
    }

    // compute duration hours
    const s = new Date(form.eventDate + 'T' + form.startTime).getTime();
    const e = new Date(form.eventDate + 'T' + form.endTime).getTime();
    const hours = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60)));

    // compute amount: if packageId set, use package price, else sum hourlyRate * hours
    let total = 0;
    if (form.packageId) {
      const pkg = packages.find(p => p.id === form.packageId);
      if (pkg) total = pkg.price ?? 0;
    } else {
      for (const hid of selectedHallIds) {
        const h = initialHalls.find(x => x.id === hid) as Hall | undefined;
        if (h) total += (h.hourlyRate ?? 0) * hours;
      }
    }

    const deposit = form.depositAmount ?? 0;
    const newBooking: HallBookingRecord = {
      id: 'hb-' + Math.random().toString(36).slice(2),
      bookingRef: form.bookingRef as string,
      customerId: form.customerId as string,
      hallIds: selectedHallIds,
      packageId: form.packageId,
      purpose: form.purpose,
      eventDate: form.eventDate as string,
      startTime: form.startTime as string,
      endTime: form.endTime as string,
      guests: form.guests ?? 0,
      mealsRequired: !!form.mealsRequired,
      status: 'Booked',
      totalAmount: total,
      paidAmount: 0,
      depositAmount: deposit,
      createdAt: new Date().toISOString(),
      customerName: customers.find(c => c.id === form.customerId)?.name ?? '',
      mobileNumber: customers.find(c => c.id === form.customerId)?.mobile ?? '',
      eventName: '',
      hallName: initialHalls.filter(h => selectedHallIds.includes(h.id)).map(h => h.name).join(', '),
      hallPackage: packages.find(p => p.id === form.packageId)?.name ?? '',
      hallPurpose: '',
      amount: total,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending',
    };

    setBookings(prev => [...prev, newBooking]);
    toast.success('Booking created');
    setModalOpen(false);
    setForm({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setBookings(prev => prev.filter(b => b.id !== deleteTarget.id));
    toast.success('Booking removed');
    setDeleteTarget(null);
  };

  const columns: Column<HallBooking>[] = [
    { key: 'ref', header: 'Booking Ref', render: (b) => <span className="font-medium text-brown-800">{b.bookingRef}</span> },
    { key: 'customer', header: 'Customer', render: (b) => customers.find(c => c.id === b.customerId)?.name ?? '' },
    { key: 'event', header: 'Event Date', render: (b) => `${b.eventDate} ${formatTime(b.startTime)}-${formatTime(b.endTime)}` },
    { key: 'hall', header: 'Hall', render: (b) => b.hallName },
    { key: 'amount', header: 'Amount', align: 'right', render: (b) => b.amount },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.bookingStatus} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (b) => (
      <div className="flex justify-center gap-1">
        <button type="button" onClick={() => { setEditing(b); setForm(b); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button>
        <button type="button" onClick={() => setDeleteTarget(b)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button>
        <button type="button" onClick={() => { /* open payments modal or navigate */ }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Payments"><CreditCard className="h-4 w-4"/></button>
      </div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Hall Booking" description="Create and manage hall bookings" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Booking</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search booking ref..." filters={[]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Booking' : 'Add Booking'} size="lg" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Booking Ref" required>
            <TextInput value={form.bookingRef ?? ''} onChange={(e) => setForm({ ...form, bookingRef: e.target.value })} />
          </FormField>

          <FormField label="Customer" required>
            <select value={form.customerId ?? ''} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="input">
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.mobile}</option>)}
            </select>
          </FormField>

          <FormField label="Event Date" required>
            <input type="date" value={form.eventDate ?? ''} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="input" />
          </FormField>

          <FormField label="Start Time" required>
            <input type="time" value={form.startTime ?? ''} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" />
          </FormField>

          <FormField label="End Time" required>
            <input type="time" value={form.endTime ?? ''} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" />
          </FormField>

          <FormField label="Package">
            <select value={form.packageId ?? ''} onChange={(e) => {
              const pkgId = e.target.value;
              const pkg = packages.find(p => p.id === pkgId);
              setForm({ ...form, packageId: pkgId, hallIds: pkg ? pkg.halls : [] });
            }} className="input">
              <option value="">Select package</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>

          <FormField label="Or Select Halls">
            <MultiSelect
              values={form.hallIds ?? []}
              onChange={(vals) => setForm({ ...form, hallIds: vals })}
              options={initialHalls.filter(h => h.status === 'Active').map(h => ({ label: `${h.name} (${h.code})`, value: h.id }))}
              placeholder="Select halls"
              className=""
            />
          </FormField>

          <FormField label="Guests">
            <TextInput type="number" value={String(form.guests ?? '')} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
          </FormField>

          <FormField label="Meals Required">
            <Toggle checked={!!form.mealsRequired} onChange={(v) => setForm({ ...form, mealsRequired: v })} label={form.mealsRequired ? 'Yes' : 'No'} />
          </FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Booking" message={`Delete "${deleteTarget?.bookingRef ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallBooking;
