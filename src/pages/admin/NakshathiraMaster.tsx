import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { nakshathiraRecords as initial, type Nakshathira } from '@/lib/mockData';

const PAGE_SIZE = 5;
const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

export function NakshathiraMaster() {
  const toast = useToast();
  const [data, setData] = useState<Nakshathira[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nakshathira | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Nakshathira | null>(null);
  const [form, setForm] = useState({ code: '', mainFlag: false, displayOrder: 1, nakshathiram: '', tamil: '', rasi: '', tamilRasi: '' });
  const [status, setStatus] = useState('Active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => data.filter((n) =>
    (!search || n.nakshathiram.toLowerCase().includes(search.toLowerCase()) || n.code.toLowerCase().includes(search.toLowerCase()) || n.rasi.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || n.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', mainFlag: false, displayOrder: data.length + 1, nakshathiram: '', tamil: '', rasi: '', tamilRasi: '' });
    setStatus('Active');
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (n: Nakshathira) => {
    setEditing(n);
    setForm({ code: n.code, mainFlag: n.mainFlag, displayOrder: n.displayOrder, nakshathiram: n.nakshathiram, tamil: n.tamil, rasi: n.rasi, tamilRasi: n.tamilRasi });
    setStatus(n.status);
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Code is required.';
    else if (!editing && data.some((n) => n.code.toLowerCase() === form.code.trim().toLowerCase())) e.code = 'Code must be unique.';
    if (!form.nakshathiram.trim()) e.nakshathiram = 'Nakshathiram is required.';
    if (!form.rasi.trim()) e.rasi = 'Rasi is required.';
    if (!form.tamil.trim()) e.tamil = 'Tamil name is required.';
    if (!form.tamilRasi.trim()) e.tamilRasi = 'Tamil Rasi is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editing) {
      setData((prev) => prev.map((n) => (n.id === editing.id ? { ...n, ...form, code: form.code.trim(), nakshathiram: form.nakshathiram.trim(), tamil: form.tamil.trim(), rasi: form.rasi.trim(), tamilRasi: form.tamilRasi.trim(), status } : n)));
      toast.success('Nakshathira updated');
    } else {
      setData((prev) => [{ id: 'n' + Math.random().toString(36).slice(2), ...form, code: form.code.trim(), nakshathiram: form.nakshathiram.trim(), tamil: form.tamil.trim(), rasi: form.rasi.trim(), tamilRasi: form.tamilRasi.trim(), status }, ...prev]);
      toast.success('Nakshathira created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((n) => n.id !== deleteTarget.id)); toast.success('Nakshathira deleted'); setDeleteTarget(null); } };

  const columns: Column<Nakshathira>[] = [
    { key: 'code', header: 'Code', render: (n) => <span className="font-medium text-maroon-700">{n.code}</span> },
    { key: 'mainFlag', header: 'Main Flag', align: 'center', render: (n) => n.mainFlag ? <StatusBadge status="Yes" variant="info" /> : <StatusBadge status="No" variant="neutral" /> },
    { key: 'displayOrder', header: 'Display Order', align: 'center' },
    { key: 'nakshathiram', header: 'Nakshathiram' },
    { key: 'tamil', header: 'Tamil' },
    { key: 'rasi', header: 'Rasi' },
    { key: 'tamilRasi', header: 'Tamil Rasi' },
    { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (n) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(n)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(n)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Nakshathira Master" description="Manage birth star (Nakshathiram) records"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Nakshathiram</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Nakshathiram' : 'Add Nakshathiram'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Code" required error={errors.code}><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="NS01" /></FormField>
          <FormField label="Display Order" required><TextInput type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></FormField>
          <FormField label="Nakshathiram" required error={errors.nakshathiram}><TextInput value={form.nakshathiram} onChange={(e) => setForm({ ...form, nakshathiram: e.target.value })} placeholder="Ashwini" /></FormField>
          <FormField label="Tamil" required error={errors.tamil}><TextInput value={form.tamil} onChange={(e) => setForm({ ...form, tamil: e.target.value })} placeholder="அஸ்வினி" /></FormField>
          <FormField label="Rasi" required error={errors.rasi}><TextInput value={form.rasi} onChange={(e) => setForm({ ...form, rasi: e.target.value })} placeholder="Mesha" /></FormField>
          <FormField label="Tamil Rasi" required error={errors.tamilRasi}><TextInput value={form.tamilRasi} onChange={(e) => setForm({ ...form, tamilRasi: e.target.value })} placeholder="மேஷம்" /></FormField>
          <FormField label="Main Flag"><div className="pt-1"><Toggle checked={form.mainFlag} onChange={(v) => setForm({ ...form, mainFlag: v })} label={form.mainFlag ? 'Yes' : 'No'} /></div></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Nakshathiram" message={`Delete "${deleteTarget?.nakshathiram}" (${deleteTarget?.code})?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
