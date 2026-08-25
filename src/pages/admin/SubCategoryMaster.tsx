import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { subCategories as initial, categories, type SubCategory } from '@/lib/mockData';

const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

export function SubCategoryMaster() {
  const toast = useToast();
  const [data, setData] = useState<SubCategory[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCategory | null>(null);
  const [form, setForm] = useState<Partial<SubCategory>>({});
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((sc) =>
    (!search || sc.name.toLowerCase().includes(search.toLowerCase()) || sc.code.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || sc.status === statusFilter)
  ), [data, search, statusFilter]);

  const openCreate = () => { setEditing(null); setForm({ colour: '#942237', displayOrder: 1 }); setStatus('Active'); setModalOpen(true); };
  const openEdit = (sc: SubCategory) => { setEditing(sc); setForm(sc); setStatus(sc.status); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name?.trim()) { toast.error('Required', 'Sub Category name is required.'); return; }
    if (!form.code?.trim()) { toast.error('Required', 'Sub Category code is required.'); return; }
    if (!form.category) { toast.error('Required', 'Category is required.'); return; }
    if (editing) {
      setData((prev) => prev.map((sc) => (sc.id === editing.id ? { ...sc, ...form, status } : sc)));
      toast.success('Sub Category updated');
    } else {
      setData((prev) => [{ id: 'sc' + Math.random().toString(36).slice(2), status, ...form } as SubCategory, ...prev]);
      toast.success('Sub Category created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((sc) => sc.id !== deleteTarget.id)); toast.success('Sub Category deleted'); setDeleteTarget(null); } };

  const columns: Column<SubCategory>[] = [
    { key: 'code', header: 'Code', render: (sc) => <span className="font-medium text-maroon-700">{sc.code}</span> },
    { key: 'name', header: 'Sub Category Name' },
    { key: 'tamilName', header: 'Tamil Name' },
    { key: 'category', header: 'Category' },
    { key: 'displayOrder', header: 'Display Order', align: 'center' },
    { key: 'colour', header: 'Colour', align: 'center', render: (sc) => <div className="mx-auto h-6 w-6 rounded-full border border-brown-200" style={{ backgroundColor: sc.colour }} /> },
    { key: 'status', header: 'Status', render: (sc) => <StatusBadge status={sc.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (sc) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(sc)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(sc)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Sub Category Master" description="Manage sub-categories for items and services"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Sub Category</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={setSearch}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: setStatusFilter }]} />
      </div>

      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Sub Category' : 'Add Sub Category'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Sub Category Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Tamil Name"><TextInput value={form.tamilName ?? ''} onChange={(e) => setForm({ ...form, tamilName: e.target.value })} /></FormField>
          <FormField label="Sub Category Code" required><TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Category" required><Dropdown value={form.category ?? ''} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ label: c.name, value: c.name }))} placeholder="Select Category" /></FormField>
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
          <FormField label="Status" className="sm:col-span-2"><div className="pt-2"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Sub Category" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
