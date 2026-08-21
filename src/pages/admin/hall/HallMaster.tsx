import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle } from '@/components/ui/Form';
import { FileUpload } from '@/components/ui/FileUpload';
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
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [form, setForm] = useState<Partial<Hall>>({ depositApplicable: false, status: 'Active'});
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', categoryId: categories.find(c => c.status === 'Active')?.id ?? '', seatingCapacity: 0, minBookingHours: 1, hourlyRate: 0, depositApplicable: false, depositAmount: 0, additionalHourRate: 0, images: [], floorPlan: '', status: 'Active' });
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (record: Hall) => {
    setEditing(record);
    setForm(record);
    setStatus(record.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = form.code?.trim() ?? '';
    const name = form.name?.trim() ?? '';
    const categoryId = form.categoryId ?? '';

    if (!code) return toast.error('Validation Error', 'Hall Code is required.');
    if (!name) return toast.error('Validation Error', 'Hall Name is required.');
    if (!categoryId) return toast.error('Validation Error', 'Hall Category is required.');
    if (!Number.isFinite(Number(form.seatingCapacity)) || Number(form.seatingCapacity) <= 0) return toast.error('Validation Error', 'Seating Capacity must be greater than 0.');
    if (!Number.isFinite(Number(form.minBookingHours)) || Number(form.minBookingHours) <= 0) return toast.error('Validation Error', 'Minimum Booking Hours must be greater than 0.');
    if (!Number.isFinite(Number(form.hourlyRate))) return toast.error('Validation Error', 'Standard Hourly Rate must be numeric.');
    if (!Number.isFinite(Number(form.additionalHourRate))) return toast.error('Validation Error', 'Additional Hour Rate must be numeric.');
    if (form.depositApplicable && (!Number.isFinite(Number(form.depositAmount)) || Number(form.depositAmount) < 0)) return toast.error('Validation Error', 'Deposit Amount is required when Deposit Applicable is Yes.');

    const dup = data.some((r) => r.code.toLowerCase() === code.toLowerCase() && r.id !== editing?.id);
    if (dup) return toast.error('Duplicate Code', 'Hall code already exists.');

    const normalizedStatus = status ?? 'Active';

    if (editing) {
      const updated: Hall = { ...editing, code, name, categoryId, level: form.level ?? editing.level ?? '', seatingCapacity: Number(form.seatingCapacity ?? editing.seatingCapacity ?? 0), minBookingHours: Number(form.minBookingHours ?? editing.minBookingHours ?? 1), hourlyRate: Number(form.hourlyRate ?? editing.hourlyRate ?? 0), depositApplicable: !!form.depositApplicable, depositAmount: form.depositApplicable ? Number(form.depositAmount ?? editing.depositAmount ?? 0) : 0, additionalHourRate: Number(form.additionalHourRate ?? editing.additionalHourRate ?? 0), images: form.images ?? editing.images ?? [], floorPlan: form.floorPlan ?? editing.floorPlan ?? '', status: normalizedStatus };
      setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      toast.success('Hall updated');
    } else {
      const newRec: Hall = { id: 'h-' + Math.random().toString(36).slice(2), code, name, categoryId, level: form.level ?? '', seatingCapacity: Number(form.seatingCapacity ?? 0), minBookingHours: Number(form.minBookingHours ?? 1), hourlyRate: Number(form.hourlyRate ?? 0), depositApplicable: !!form.depositApplicable, depositAmount: form.depositApplicable ? Number(form.depositAmount ?? 0) : 0, additionalHourRate: Number(form.additionalHourRate ?? 0), images: form.images ?? [], floorPlan: form.floorPlan ?? '', status: normalizedStatus };
      setData((prev) => [...prev, newRec]);
      toast.success('Hall created');
    }

    setModalOpen(false);
    setEditing(null);
    setForm({ depositApplicable: false, status: 'Active' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.map((r) => r.id === deleteTarget.id ? { ...r, status: 'Inactive' } : r));
    toast.success('Hall deactivated');
    setDeleteTarget(null);
  };

  const columns: Column<Hall>[] = [
    { key: 'code', header: 'Hall Code', render: (r) => <span className="font-medium text-brown-800">{r.code}</span> },
    { key: 'name', header: 'Hall Name', render: (r) => <span className="text-brown-800">{r.name}</span> },
    { key: 'category', header: 'Hall Category', render: (r) => <span className="text-brown-700">{categories.find(c => c.id === r.categoryId)?.name ?? '—'}</span> },
    { key: 'capacity', header: 'Capacity', align: 'center', render: (r) => r.seatingCapacity },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
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
              {categories.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Level / Location">
            <TextInput value={form.level ?? ''} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. Level 3" />
          </FormField>

          <FormField label="Seating Capacity">
            <TextInput type="number" value={String(form.seatingCapacity ?? '')} onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })} />
          </FormField>

          <FormField label="Description" className="sm:col-span-2">
            <TextArea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>

          <FormField label="Hall Images" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(form.images ?? []).map((img, idx) => (
                <div key={idx} className="relative h-24 w-36 overflow-hidden rounded border">
                  <img src={img} alt={`img-${idx}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, images: (form.images ?? []).filter((_, i) => i !== idx) })} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <div className="w-36">
                <FileUpload accept="image/*" onFile={(f) => { const url = URL.createObjectURL(f); setForm({ ...form, images: [...(form.images ?? []), url] }); }} />
              </div>
            </div>
          </FormField>

          <FormField label="Floor Plan" className="sm:col-span-2">
            <FileUpload accept="image/*,application/pdf" preview={form.floorPlan ?? ''} onFile={(f) => { const url = URL.createObjectURL(f); setForm({ ...form, floorPlan: url }); }} />
          </FormField>

          <FormField label="Status">
            <div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => { setStatus(v ? 'Active' : 'Inactive'); setForm({ ...form, status: v ? 'Active' : 'Inactive' }); }} trueLabel="Active" falseLabel="Inactive" /></div>
          </FormField>

          <FormField label="Minimum Booking Hours">
            <TextInput type="number" min={1} value={String(form.minBookingHours ?? '')} onChange={(e) => setForm({ ...form, minBookingHours: Number(e.target.value) })} />
          </FormField>

          <FormField label="Standard Hourly Rate">
            <TextInput type="number" min={0} value={String(form.hourlyRate ?? '')} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
          </FormField>

          <FormField label="Deposit Applicable">
            <Toggle checked={!!form.depositApplicable} onChange={(v) => setForm({ ...form, depositApplicable: v, depositAmount: v ? (form.depositAmount ?? 0) : 0 })} trueLabel="Yes" falseLabel="No" />
          </FormField>

          <FormField label="Deposit Amount">
            <TextInput type="number" min={0} value={String(form.depositAmount ?? '')} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} disabled={!form.depositApplicable} />
          </FormField>

          <FormField label="Additional Hour Rate">
            <TextInput type="number" min={0} value={String(form.additionalHourRate ?? '')} onChange={(e) => setForm({ ...form, additionalHourRate: Number(e.target.value) })} />
          </FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Hall" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallMaster;
