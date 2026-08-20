import { useState } from 'react';
import { Plus, Eye, Printer, RefreshCw, Ban, Heart, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore, exportCSV } from '@/lib/adminStore';
import { formatSGD, formatDate, formatDateTime } from '@/lib/utils';

interface Donation {
  id: string; number: string; customer: string; mobile: string; email: string;
  type: string; purpose: string; amount: number; gstClass: string; paymentMode: string;
  paymentRef: string; date: string; remarks: string; status: string;
}

const seedDonations: Donation[] = [
  { id: 'dn1', number: 'DON001', customer: 'Rajendran Mohan', mobile: '+65 9111 2222', email: 'rajendran@email.com', type: 'General Donation', purpose: 'Temple Maintenance', amount: 100, gstClass: 'Exempted', paymentMode: 'Cash', paymentRef: '-', date: '2026-07-30T10:00:00', remarks: '', status: 'Completed' },
  { id: 'dn2', number: 'DON002', customer: 'Saraswathi Iyer', mobile: '+65 9222 3333', email: 'saraswathi@email.com', type: 'Annadhanam', purpose: 'Annadhanam Fund', amount: 50, gstClass: 'Exempted', paymentMode: 'PayNow', paymentRef: 'PAYNOW111', date: '2026-07-29T14:00:00', remarks: '', status: 'Completed' },
  { id: 'dn3', number: 'DON003', customer: 'Anonymous', mobile: '-', email: '-', type: 'Building Fund', purpose: 'Building Fund', amount: 500, gstClass: 'Exempted', paymentMode: 'NETS', paymentRef: 'NETS222', date: '2026-07-28T11:00:00', remarks: 'Anonymous donation', status: 'Completed' },
  { id: 'dn4', number: 'DON004', customer: 'Murugan Chettiar', mobile: '+65 9333 4444', email: 'murugan@email.com', type: 'Religious Event', purpose: 'Shivaratri', amount: 200, gstClass: 'Exempted', paymentMode: 'Cash', paymentRef: '-', date: '2026-07-27T09:00:00', remarks: '', status: 'Cancelled' },
];

const PAGE_SIZE = 8;

export function DonationManagement() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [data, setData] = useState<Donation[]>(seedDonations);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Donation | null>(null);
  const [reprintTarget, setReprintTarget] = useState<Donation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Donation | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [form, setForm] = useState<Omit<Donation, 'id'>>({ number: '', customer: '', mobile: '', email: '', type: 'General Donation', purpose: '', amount: 0, gstClass: 'Exempted', paymentMode: 'Cash', paymentRef: '-', date: new Date().toISOString(), remarks: '', status: 'Completed' });

  const filtered = data.filter((d) => {
    const m = !search || d.number.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase());
    const t = !typeFilter || d.type === typeFilter;
    const s = !statusFilter || d.status === statusFilter;
    return m && t && s;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSave = () => {
    if (!form.customer.trim()) { toast.error('Customer name is required.'); return; }
    if (form.amount <= 0) { toast.error('Amount must be greater than zero.'); return; }
    const newDon: Donation = { ...form, id: 'dn' + Math.random().toString(36).slice(2), number: 'DON' + String(Math.floor(Math.random() * 9000) + 1000), date: new Date().toISOString() };
    setData([newDon, ...data]);
    addAudit('Created Donation', 'Donations', `Donation ${newDon.number} - ${formatSGD(newDon.amount)}`);
    toast.success('Donation recorded', `${newDon.number} created.`);
    setModalOpen(false);
  };

  const handleReprint = () => {
    if (!reprintReason.trim()) { toast.error('Reprint reason is required.'); return; }
    addAudit('Reprinted Donation Receipt', 'Donations', `Reprint of ${reprintTarget?.number}: ${reprintReason}`);
    toast.success('Reprint generated', `Receipt for ${reprintTarget?.number} reprinted.`);
    setReprintTarget(null);
    setReprintReason('');
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    setData(data.map((d) => d.id === cancelTarget.id ? { ...d, status: 'Cancelled' } : d));
    addAudit('Cancelled Donation', 'Donations', `Donation ${cancelTarget.number} cancelled`);
    toast.success('Donation cancelled', `${cancelTarget.number} is now Cancelled.`);
    setCancelTarget(null);
  };

  const columns: Column<Donation>[] = [
    { key: 'number', header: 'Donation No', render: (d) => <span className="font-medium text-maroon-700">{d.number}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', align: 'right', render: (d) => formatSGD(d.amount) },
    { key: 'paymentMode', header: 'Payment' },
    { key: 'date', header: 'Date', render: (d) => formatDate(d.date) },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewItem(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => toast.success('Sent to printer', `${d.number} receipt printed.`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Print"><Printer className="h-4 w-4" /></button>
        {d.status === 'Completed' && <>
          <button onClick={() => setReprintTarget(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Reprint"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setCancelTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50" title="Cancel"><Ban className="h-4 w-4" /></button>
        </>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Donations" description="Record and manage temple donations"
        actions={<><button className="btn-outline" onClick={() => exportCSV('donations.csv', ['Number', 'Customer', 'Type', 'Amount', 'Payment', 'Date', 'Status'], filtered.map((d) => [d.number, d.customer, d.type, d.amount, d.paymentMode, formatDate(d.date), d.status]))}>Export CSV</button>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Record Donation</button></>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        filters={[
          { label: 'Type', value: typeFilter, options: [{ label: 'All', value: '' }, ...['General Donation', 'Annadhanam', 'Temple Maintenance', 'Building Fund', 'Religious Event', 'Other'].map((t) => ({ label: t, value: t }))], onChange: (v) => { setTypeFilter(v); setPage(1); } },
          { label: 'Status', value: statusFilter, options: [{ label: 'All', value: '' }, { label: 'Completed', value: 'Completed' }, { label: 'Cancelled', value: 'Cancelled' }], onChange: (v) => { setStatusFilter(v); setPage(1); } },
        ]} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Donation" size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Customer Name" required><TextInput value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></FormField>
            <FormField label="Mobile Number"><TextInput value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></FormField>
            <FormField label="Email"><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Donation Type" required><Dropdown value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={['General Donation', 'Annadhanam', 'Temple Maintenance', 'Building Fund', 'Religious Event', 'Other'].map((t) => ({ label: t, value: t }))} /></FormField>
            <FormField label="Donation Purpose"><TextInput value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></FormField>
            <FormField label="Amount" required><TextInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></FormField>
            <FormField label="GST Classification"><Dropdown value={form.gstClass} onChange={(v) => setForm({ ...form, gstClass: v })} options={[{ label: 'Exempted', value: 'Exempted' }, { label: 'Out of Scope', value: 'Out of Scope' }]} /></FormField>
            <FormField label="Payment Mode"><Dropdown value={form.paymentMode} onChange={(v) => setForm({ ...form, paymentMode: v })} options={[{ label: 'Cash', value: 'Cash' }, { label: 'NETS', value: 'NETS' }, { label: 'PayNow', value: 'PayNow' }]} /></FormField>
          </div>
          <FormField label="Remarks"><TextArea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Donation ${viewItem?.number ?? ''}`} size="md"
        footer={<><button className="btn-outline" onClick={() => setViewItem(null)}>Close</button><button className="btn-primary" onClick={() => { toast.success('Sent to printer'); }}><Printer className="h-4 w-4" /> Print Receipt</button></>}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-brown-400">Customer</p><p className="font-medium">{viewItem.customer}</p></div>
              <div><p className="text-xs text-brown-400">Type</p><p className="font-medium">{viewItem.type}</p></div>
              <div><p className="text-xs text-brown-400">Amount</p><p className="font-medium">{formatSGD(viewItem.amount)}</p></div>
              <div><p className="text-xs text-brown-400">Payment</p><p className="font-medium">{viewItem.paymentMode} ({viewItem.paymentRef})</p></div>
              <div><p className="text-xs text-brown-400">Date</p><p className="font-medium">{formatDateTime(viewItem.date)}</p></div>
              <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewItem.status} /></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!reprintTarget} onClose={() => setReprintTarget(null)} title="Reprint Donation Receipt" size="sm"
        footer={<><button className="btn-outline" onClick={() => setReprintTarget(null)}>Cancel</button><button className="btn-saffron" onClick={handleReprint}>Confirm Reprint</button></>}>
        <FormField label="Reprint Reason" required><TextArea value={reprintReason} onChange={(e) => setReprintReason(e.target.value)} placeholder="Enter reason for reprint..." /></FormField>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancel Donation" message={`Cancel donation "${cancelTarget?.number}"? This action cannot be undone.`} confirmLabel="Confirm Cancellation" variant="danger" />
    </div>
  );
}

export function DonationReceipts() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [data] = useState<Donation[]>(seedDonations.filter((d) => d.status === 'Completed'));
  const [viewItem, setViewItem] = useState<Donation | null>(null);

  const filtered = data.filter((d) => d.number.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Donation>[] = [
    { key: 'number', header: 'Receipt No', render: (d) => <span className="font-medium text-maroon-700">{d.number}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', align: 'right', render: (d) => formatSGD(d.amount) },
    { key: 'date', header: 'Date', render: (d) => formatDate(d.date) },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewItem(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Eye className="h-4 w-4" /></button>
        <button onClick={() => toast.success('Sent to printer')} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Printer className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Donation Receipts" description="View and print donation receipts" />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Receipt ${viewItem?.number ?? ''}`} size="sm"
        footer={<button className="btn-outline" onClick={() => setViewItem(null)}>Close</button>}>
        {viewItem && <div className="text-center text-sm"><Heart className="mx-auto mb-2 h-8 w-8 text-maroon-500" /><p className="font-serif font-bold">Sri Siva Durga Temple</p><p className="mt-2">Donation Receipt</p><p className="mt-2 font-medium">{formatSGD(viewItem.amount)}</p><p>{viewItem.type}</p><p>{viewItem.customer}</p><p className="mt-2 text-xs text-brown-400">{formatDate(viewItem.date)}</p></div>}
      </Modal>
    </div>
  );
}
