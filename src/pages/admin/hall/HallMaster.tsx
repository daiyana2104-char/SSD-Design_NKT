import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { halls as initial, hallCategories as categories, type Hall } from '@/lib/mockData';

const PAGE_SIZE = 5;

export function HallMaster() {
  const toast = useToast();
  const [data, setData] = useState<Hall[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [form, setForm] = useState<Partial<Hall>>({});
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', categoryId: categories[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (record: Hall) => {
    setEditing(record);
    setForm(record);
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = form.code?.trim() ?? '';
    const name = form.name?.trim() ?? '';
    const categoryId = form.categoryId ?? '';

    if (!code) return toast.error('Validation Error', 'Hall Code is required.');
    if (!name) return toast.error('Validation Error', 'Hall Name is required.');
    if (!categoryId) return toast.error('Validation Error', 'Hall Category is required.');

    const dup = data.some((r) => r.code.toLowerCase() === code.toLowerCase() && r.id !== editing?.id);
    if (dup) return toast.error('Duplicate Code', 'Hall code already exists.');

    if (editing) {
      const updated: Hall = { ...editing, code, name, categoryId, level: form.level, seatingCapacity: form.seatingCapacity, minBookingHours: form.minBookingHours, hourlyRate: form.hourlyRate, depositApplicable: form.depositApplicable ?? false, depositAmount: form.depositAmount ?? 0, additionalHourRate: form.additionalHourRate ?? 0, status: form.status ?? editing.status };
      setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      toast.success('Hall updated');
    } else {
      const newRec: Hall = { id: 'h-' + Math.random().toString(36).slice(2), code, name, categoryId, level: form.level ?? '', seatingCapacity: form.seatingCapacity ?? 0, minBookingHours: form.minBookingHours ?? 1, hourlyRate: form.hourlyRate ?? 0, depositApplicable: form.depositApplicable ?? false, depositAmount: form.depositAmount ?? 0, additionalHourRate: form.additionalHourRate ?? 0, images: [], floorPlan: '', status: 'Active' };
      setData((prev) => [...prev, newRec]);
      toast.success('Hall created');
    }

    setModalOpen(false);
    setEditing(null);
    setForm({});
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success('Hall deleted');
    setDeleteTarget(null);
  };

  const columns: Column<Hall>[] = [
    { key: 'code', header: 'Hall Code', render: (r) => <span className="font-medium text-brown-800">{r.code}</span> },
    { key: 'name', header: 'Hall Name', render: (r) => <span className="text-brown-800">{r.name}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-brown-700">{categories.find(c => c.id === r.categoryId)?.name ?? '—'}</span> },
    { key: 'level', header: 'Level', render: (r) => r.level },
    { key: 'capacity', header: 'Seating', align: 'center', render: (r) => r.seatingCapacity },
    { key: 'hourly', header: 'Hourly Rate', align: 'right', render: (r) => r.hourlyRate },
    { key: 'status', header: 'Status', render: (r) => <span className="text-brown-700">{r.status}</span> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex justify-center gap-1">
        <button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button>
        <button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button>
      </div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Hall Master" description="Manage halls and their rates" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Hall</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search hall code or name..." filters={[]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Hall' : 'Add Hall'} size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></> }>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Hall Code" required>
            <TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. H-WED-03" />
          </FormField>

          <FormField label="Hall Name" required>
            <TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wedding Hall - Level 3" />
          </FormField>

          <FormField label="Category" required>
            <select value={form.categoryId ?? ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Level / Location">
            <TextInput value={form.level ?? ''} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. Level 3" />
          </FormField>

          <FormField label="Seating Capacity">
            <TextInput type="number" value={String(form.seatingCapacity ?? '')} onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })} />
          </FormField>

          <FormField label="Minimum Booking Hours">
            <TextInput type="number" value={String(form.minBookingHours ?? '')} onChange={(e) => setForm({ ...form, minBookingHours: Number(e.target.value) })} />
          </FormField>

          <FormField label="Standard Hourly Rate">
            <TextInput type="number" value={String(form.hourlyRate ?? '')} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
          </FormField>

          <FormField label="Deposit Applicable">
            <Toggle checked={!!form.depositApplicable} onChange={(v) => setForm({ ...form, depositApplicable: v })} label={form.depositApplicable ? 'Yes' : 'No'} />
          </FormField>

          <FormField label="Deposit Amount">
            <TextInput type="number" value={String(form.depositAmount ?? '')} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} />
          </FormField>

          <FormField label="Additional Hour Rate">
            <TextInput type="number" value={String(form.additionalHourRate ?? '')} onChange={(e) => setForm({ ...form, additionalHourRate: Number(e.target.value) })} />
          </FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Hall" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallMaster;
