import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, X, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { customers as initial, posTransactions, portalBookings, auditLogs, type Customer } from '@/lib/mockData';
import { formatSGD, formatDate, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 5;
const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

export function CustomerMaster() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<Customer[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [status, setStatus] = useState('Active');
  const [familyRows, setFamilyRows] = useState<{ name: string; nakshatra: string }[]>([]);

  const filtered = useMemo(() => data.filter((c) =>
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search)) &&
    (!statusFilter || c.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => {
    const nextNum = data.length + 1;
    const nextCode = `SSD-C${String(nextNum).padStart(4, '0')}`;
    setEditing(null); setForm({ code: nextCode }); setStatus('Active'); setFamilyRows([]); setModalOpen(true);
  };
  const openEdit = (c: Customer) => { setEditing(c); setForm(c); setStatus(c.status); setFamilyRows(c.familyMembers); setModalOpen(true); };

  const handleSave = () => {
    const saved = { ...form, status, familyMembers: familyRows };
    if (editing) { setData((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...saved } : c))); toast.success('Customer updated'); }
    else {
      const nextNum = data.length + 1;
      const autoCode = `SSD-C${String(nextNum).padStart(4, '0')}`;
      setData((prev) => [{ id: 'cu' + Math.random().toString(36).slice(2), code: autoCode, ...saved } as Customer, ...prev]); toast.success('Customer created');
    }
    setModalOpen(false);
  };
  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((c) => c.id !== deleteTarget.id)); toast.success('Customer deleted'); setDeleteTarget(null); } };

  const columns: Column<Customer>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-medium text-maroon-700">{c.code}</span> },
    { key: 'name', header: 'Customer Name' },
    { key: 'mobile', header: 'Mobile Number' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (c) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => navigate(`/admin/customers/${c.id}`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => openEdit(c)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(c)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Customer Master" description="Manage registered temple customers"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Customer</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Customer Code" required hint="Auto-generated"><TextInput value={form.code ?? ''} disabled /></FormField>
          <FormField label="Customer Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Mobile Number" required><TextInput value={form.mobile ?? ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></FormField>
          <FormField label="Email Address" required><TextInput type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Date of Birth"><TextInput type="date" value={form.dob ?? ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></FormField>
          <FormField label="Gender"><Dropdown value={form.gender ?? ''} onChange={(v) => setForm({ ...form, gender: v })} options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }]} placeholder="Select Gender" /></FormField>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Family Member Details</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-brown-500">Max:</label>
                <TextInput type="number" value={form.maxFamilyMembers ?? 5} onChange={(e) => setForm({ ...form, maxFamilyMembers: Number(e.target.value) })} className="w-20" />
              </div>
              <button type="button" onClick={() => setFamilyRows((prev) => [...prev, { name: '', nakshatra: '' }])} className="btn-outline px-3 py-1 text-xs"><Plus className="h-3 w-3" /> Add Row</button>
            </div>
          </div>
          {familyRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-brown-200 p-4 text-center text-sm text-brown-400">No family members added.</div>
          ) : (
            <div className="space-y-2">
              {familyRows.map((row, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <TextInput value={row.name} onChange={(e) => setFamilyRows((prev) => prev.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))} placeholder="Family Member Name" />
                  <div className="flex gap-2">
                    <TextInput value={row.nakshatra} onChange={(e) => setFamilyRows((prev) => prev.map((r, idx) => idx === i ? { ...r, nakshatra: e.target.value } : r))} placeholder="Nakshatra" />
                    <button type="button" onClick={() => setFamilyRows((prev) => prev.filter((_, idx) => idx !== i))} className="rounded p-2 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Customer" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}

export function CustomerDetail() {
  const navigate = useNavigate();
  const id = window.location.pathname.split('/').pop()!;
  const customer = initial.find((c) => c.id === id);
  const [tab, setTab] = useState<'profile' | 'family' | 'transactions' | 'bookings' | 'audit'>('profile');
  const [txnLimit, setTxnLimit] = useState(3);

  if (!customer) {
    return <div className="py-16 text-center text-brown-500">Customer not found. <button className="text-maroon-600 underline" onClick={() => navigate('/admin/customers')}>Back to list</button></div>;
  }

  const customerTxns = posTransactions.filter((t) => t.customer === customer.name);
  const customerBookings = portalBookings.filter((b) => b.customer === customer.name);
  const customerAudit = auditLogs.filter((a) => a.details.includes(customer.name));

  const tabs = [
    { key: 'profile', label: 'Profile' }, { key: 'family', label: 'Family Members' },
    { key: 'transactions', label: 'Transaction History' }, { key: 'bookings', label: 'Portal Bookings' },
    { key: 'audit', label: 'Audit History' },
  ] as const;

  return (
    <div>
      <PageHeader title={customer.name} description={`${customer.code} · ${customer.mobile}`}
        actions={<button className="btn-outline" onClick={() => navigate('/admin/customers')}>Back</button>} />

      <div className="card mb-4 overflow-hidden">
        <div className="flex gap-1 border-b border-brown-100 px-2 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'border-maroon-600 text-maroon-700' : 'border-transparent text-brown-500 hover:text-brown-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'profile' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-brown-400">Customer Code</p><p className="text-sm font-medium text-brown-800">{customer.code}</p></div>
              <div><p className="text-xs text-brown-400">Name</p><p className="text-sm font-medium text-brown-800">{customer.name}</p></div>
              <div><p className="text-xs text-brown-400">Mobile</p><p className="text-sm font-medium text-brown-800">{customer.mobile}</p></div>
              <div><p className="text-xs text-brown-400">Email</p><p className="text-sm font-medium text-brown-800">{customer.email}</p></div>
              <div><p className="text-xs text-brown-400">Date of Birth</p><p className="text-sm font-medium text-brown-800">{customer.dob ? formatDate(customer.dob) : '—'}</p></div>
              <div><p className="text-xs text-brown-400">Gender</p><p className="text-sm font-medium text-brown-800">{customer.gender ?? '—'}</p></div>
              <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={customer.status} /></div>
            </div>
          )}
          {tab === 'family' && (
            customer.familyMembers.length === 0 ? <p className="py-8 text-center text-sm text-brown-400">No family members registered.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-brown-100 text-left text-xs uppercase text-brown-500"><th className="py-2">Name</th><th className="py-2">Nakshatra</th></tr></thead>
                <tbody>{customer.familyMembers.map((f, i) => (<tr key={i} className="border-b border-brown-50"><td className="py-2.5 text-brown-800">{f.name}</td><td className="py-2.5 text-brown-600">{f.nakshatra}</td></tr>))}</tbody>
              </table></div>
            )
          )}
          {tab === 'transactions' && (
            <div>
              <div className="space-y-2">
                {customerTxns.slice(0, txnLimit).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-brown-50 p-3">
                    <div><p className="text-sm font-medium text-brown-800">{t.txnNo}</p><p className="text-xs text-brown-400">{formatDateTime(t.datetime)} · {t.paymentMode}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold text-brown-900">{formatSGD(t.gross)}</p><StatusBadge status={t.status} /></div>
                  </div>
                ))}
                {customerTxns.length === 0 && <p className="py-8 text-center text-sm text-brown-400">No transactions found.</p>}
              </div>
              {customerTxns.length > txnLimit && <button className="btn-outline mt-4 w-full" onClick={() => setTxnLimit(customerTxns.length)}>Load More ({customerTxns.length - txnLimit} remaining)</button>}
            </div>
          )}
          {tab === 'bookings' && (
            customerBookings.length === 0 ? <p className="py-8 text-center text-sm text-brown-400">No portal bookings found.</p> : (
              <div className="space-y-2">{customerBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-brown-50 p-3">
                  <div><p className="text-sm font-medium text-brown-800">{b.bookingNo}</p><p className="text-xs text-brown-400">{b.service} · {formatDate(b.date)}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-brown-900">{formatSGD(b.amount)}</p><StatusBadge status={b.status} /></div>
                </div>
              ))}</div>
            )
          )}
          {tab === 'audit' && (
            customerAudit.length === 0 ? <p className="py-8 text-center text-sm text-brown-400">No audit history found.</p> : (
              <div className="space-y-2">{customerAudit.map((a) => (
                <div key={a.id} className="rounded-lg border border-brown-50 p-3">
                  <div className="flex justify-between"><p className="text-sm font-medium text-brown-800">{a.action}</p><p className="text-xs text-brown-400">{formatDateTime(a.timestamp)}</p></div>
                  <p className="text-xs text-brown-500">{a.details}</p>
                </div>
              ))}</div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
