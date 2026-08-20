import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput } from '@/components/ui/Form';
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
  const [form, setForm] = useState<Partial<HallCategory>>({});
  const [deleteTarget, setDeleteTarget] = useState<HallCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '' });
    setModalOpen(true);
  };

  const openEdit = (record: HallCategory) => {
    setEditing(record);
    setForm(record);
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = form.code?.trim().toUpperCase() ?? '';
    const name = form.name?.trim() ?? '';

    if (!code) return toast.error('Validation Error', 'Category Code is required.');
    if (!name) return toast.error('Validation Error', 'Category Name is required.');

    const dupCode = data.some((r) => r.code.toLowerCase() === code.toLowerCase() && r.id !== editing?.id);
    if (dupCode) return toast.error('Duplicate Code', 'Category code already exists.');

    if (editing) {
      const updated: HallCategory = { ...editing, code, name, description: form.description ?? editing.description };
      setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      toast.success('Category updated');
    } else {
      const newRec: HallCategory = { id: 'hc-' + Math.random().toString(36).slice(2), code, name, description: form.description ?? '', status: 'Active' };
      setData((prev) => [...prev, newRec]);
      toast.success('Category created');
    }

    setModalOpen(false);
    setEditing(null);
    setForm({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success('Category deleted');
    setDeleteTarget(null);
  };

  const columns: Column<HallCategory>[] = [
    { key: 'code', header: 'Category Code', render: (r) => <span className="font-medium text-brown-800">{r.code}</span> },
    { key: 'name', header: 'Category Name', render: (r) => <span className="text-brown-800">{r.name}</span> },
    { key: 'status', header: 'Status', render: (r) => <span className="text-brown-700">{r.status}</span> },
    {
      key: 'actions', header: 'Actions', align: 'center', render: (r) => (
        <div className="flex justify-center gap-1">
          <button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Hall Category Master" description="Manage hall categories" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Category</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search category code or name..." filters={[]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="md" footer={ <><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></> }>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category Code" required>
            <TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WEDDING" />
          </FormField>

          <FormField label="Category Name" required>
            <TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wedding Halls" />
          </FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}
export default HallCategoryMaster;
