import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, Toggle } from '@/components/ui/Form';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { categories as initial, type Category } from '@/lib/mockData';

const statusOptions: FilterOption[] = [
  { label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' },
];

export function CategoryManagement() {
  const toast = useToast();
  const [data, setData] = useState<Category[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>({});
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((c) =>
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || c.status === statusFilter)
  ), [data, search, statusFilter]);

  const openCreate = () => { setEditing(null); setForm({}); setStatus('Active'); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm(c); setStatus(c.status); setModalOpen(true); };

  const handleSave = () => {
    if (editing) {
      setData((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form, status } : c)));
      toast.success('Category updated');
    } else {
      setData((prev) => [{ id: 'c' + Math.random().toString(36).slice(2), status, ...form } as Category, ...prev]);
      toast.success('Category created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setData((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success('Category deleted');
      setDeleteTarget(null);
    }
  };

  const columns: Column<Category>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-medium text-maroon-700">{c.code}</span> },
    { key: 'name', header: 'Category Name' },
    { key: 'tamilName', header: 'Tamil Name' },
    { key: 'displayOrder', header: 'Display Order', align: 'center' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'center',
      render: (c) => (
        <div className="flex justify-center gap-1">
          <button onClick={() => openEdit(c)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(c)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Category Management" description="Manage service and item categories"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Category</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={setSearch}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: setStatusFilter }]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={filtered} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Tamil Name"><TextInput value={form.tamilName ?? ''} onChange={(e) => setForm({ ...form, tamilName: e.target.value })} /></FormField>
          <FormField label="Category Code" required><TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Display Order"><TextInput type="number" value={form.displayOrder ?? ''} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></FormField>
          <FormField label="Category Colour" required>
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-brown-200">
                <input type="color" value={form.colour ?? '#942237'} onChange={(e) => setForm({ ...form, colour: e.target.value })}
                  className="absolute -left-1 -top-1 h-14 w-14 cursor-pointer border-0 bg-transparent p-0" />
              </div>
              <TextInput value={(form.colour ?? '').toUpperCase()} onChange={(e) => setForm({ ...form, colour: e.target.value })} placeholder="#942237" className="flex-1" />
            </div>
          </FormField>
          <FormField label="Description" className="sm:col-span-2"><TextArea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Category Image" className="sm:col-span-2"><FileUpload /></FormField>
          <FormField label="Status" className="sm:col-span-2"><div className="pt-2"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Category" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
