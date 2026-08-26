import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallCategories as initial, type HallCategory } from '@/lib/mockData';

const PAGE_SIZE = 5;

export function HallCategoryMaster() {
  const toast = useToast();

  const [data, setData] = useState<HallCategory[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallCategory | null>(null);
  const [viewing, setViewing] = useState<HallCategory | null>(null);
  const [form, setForm] = useState<Partial<HallCategory>>({});
  const [deleteTarget, setDeleteTarget] = useState<HallCategory | null>(null);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const nextCode = () => `HC-${String(data.length + 1).padStart(3, '0')}`;
  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({ code: nextCode(), name: '' });
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (record: HallCategory) => {
    setEditing(record);
    setViewing(null);
    setForm(record);
    setStatus(record.status ?? 'Active');
    setModalOpen(true);
  };

  const openView = (record: HallCategory) => {
    setViewing(record);
    setForm(record);
    setStatus(record.status ?? 'Active');
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = editing?.code ?? form.code?.trim().toUpperCase() ?? '';
    const name = form.name?.trim() ?? '';

    if (!code) return toast.error('Validation Error', 'Category Code is required.');
    if (!name) return toast.error('Validation Error', 'Category Name is required.');

    const dupCode = data.some((r) => r.code.toLowerCase() === code.toLowerCase() && r.id !== editing?.id);
    if (dupCode) return toast.error('Duplicate Code', 'Category code already exists.');

    if (editing) {
      const updated: HallCategory = { ...editing, code, name, status };
      setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      toast.success('Category updated');
    } else {
      const newRec: HallCategory = { id: 'hc-' + Math.random().toString(36).slice(2), code, name, status };
      setData((prev) => [...prev, newRec]);
      toast.success('Category created');
    }

    setModalOpen(false);
    setEditing(null);
    setForm({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.map((r) => r.id === deleteTarget.id ? { ...r, status: 'Inactive' } : r));
    toast.success('Category deactivated');
    setDeleteTarget(null);
  };

  const toggleStatus = (rec: HallCategory) => {
    const newStatus = rec.status === 'Active' ? 'Inactive' : 'Active';
    setData((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: newStatus } : r)));
    toast.success(`Category ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
  };

  const columns: Column<HallCategory>[] = [
    { key: 'code', header: 'Category Code', render: (r) => <span className="font-medium text-brown-800">{r.code}</span> },
    { key: 'name', header: 'Category Name', render: (r) => <span className="text-brown-800">{r.name}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'center', render: (r) => (
        <div className="flex justify-center gap-1">
          <button type="button" onClick={() => openView(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4"/></button>
          <button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Deactivate"><Trash2 className="h-4 w-4"/></button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Hall Category Master" description="Manage hall categories" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Category</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search category code or name..." filters={[]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={viewing ? 'View Category' : (editing ? 'Edit Category' : 'Add Category')} size="md" footer={viewing ? undefined : <><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></> }>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category Code" required>
            <TextInput value={form.code ?? ''} placeholder="Auto-generated" disabled />
          </FormField>

          <FormField label="Category Name" required>
            <TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wedding Halls" disabled={!!viewing} />
          </FormField>

          <FormField label="Status"><div className="pt-2"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} trueLabel="Active" falseLabel="Inactive" /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}
export default HallCategoryMaster;
