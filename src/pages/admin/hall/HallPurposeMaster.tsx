import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallPurposes as initial, type HallPurpose } from '@/lib/mockData';

const PAGE_SIZE = 8;

export function HallPurposeMaster() {
  const toast = useToast();
  const [data, setData] = useState<HallPurpose[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallPurpose | null>(null);
  const [form, setForm] = useState<Partial<HallPurpose>>({ status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState<HallPurpose | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(r => !q || r.name.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', status: 'Active' }); setModalOpen(true); };
  const openEdit = (r: HallPurpose) => { setEditing(r); setForm(r); setModalOpen(true); };

  const handleSave = () => {
    const name = form.name?.trim() ?? '';
    if (!name) return toast.error('Validation Error', 'Purpose name is required.');
    if (data.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== editing?.id)) return toast.error('Duplicate', 'Purpose already exists.');

    const status = form.status ?? 'Active';

    if (editing) {
      const updated: HallPurpose = { ...editing, name, description: form.description ?? editing.description, status };
      setData(prev => prev.map(p => p.id === editing.id ? updated : p));
      toast.success('Purpose updated');
    } else {
      const newRec: HallPurpose = { id: 'hp-' + Math.random().toString(36).slice(2), name, description: form.description ?? '', status };
      setData(prev => [...prev, newRec]);
      toast.success('Purpose created');
    }

    setModalOpen(false); setEditing(null); setForm({ status: 'Active' });
  };

  const handleDelete = () => { if (!deleteTarget) return; setData(prev => prev.map(p => p.id === deleteTarget.id ? { ...p, status: 'Inactive' } : p)); toast.success('Purpose deactivated'); setDeleteTarget(null); };

  const columns: Column<HallPurpose>[] = [
    { key: 'name', header: 'Purpose Name', render: (r) => <span className="text-brown-800">{r.name}</span> },
    { key: 'desc', header: 'Description', render: (r) => <span className="text-brown-700">{r.description}</span> },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button><button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button></div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Hall Purpose Master" description="Manage purposes for hall bookings" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Purpose</button>} />

      <div className="card p-4"><SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search purpose..." filters={[]} /></div>

      <div className="card mt-4"><DataTable columns={columns} data={paged} /><Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Purpose' : 'Add Purpose'} size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Purpose Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Status"><Toggle checked={form.status === 'Active'} onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" /></FormField>
          <FormField label="Description" className="sm:col-span-2"><TextInput value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Purpose" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallPurposeMaster;
