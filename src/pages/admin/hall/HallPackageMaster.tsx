import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, MultiSelect } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallPackages as initial, hallPurposes as purposes, halls as hallsList, glRecords, type HallPackage } from '@/lib/mockData';

const PAGE_SIZE = 6;

export function HallPackageMaster() {
  const toast = useToast();
  const [data, setData] = useState<HallPackage[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallPackage | null>(null);
  const [form, setForm] = useState<Partial<HallPackage>>({});
  const [deleteTarget, setDeleteTarget] = useState<HallPackage | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(d => !q || d.name.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm({ name: '', purpose: purposes.find(p => p.status === 'Active')?.id ?? '', halls: [], status: 'Active', glCode: '', description: '' }); setModalOpen(true); };
  const openEdit = (p: HallPackage) => { setEditing(p); setForm({ ...p, purpose: p.purpose ?? '', halls: p.halls ?? [], status: p.status ?? 'Active', glCode: p.glCode ?? '', description: p.description ?? '' }); setModalOpen(true); };

  const handleSave = () => {
    const name = form.name?.trim() ?? '';
    const purpose = form.purpose ?? '';
    const halls = form.halls ?? [];
    if (!name) return toast.error('Validation Error', 'Package name is required.');
    if (!purpose) return toast.error('Validation Error', 'Hall purpose is required.');
    if (!halls.length) return toast.error('Validation Error', 'At least one hall is required.');
    const activePurposeExists = purposes.some(p => p.id === purpose && p.status === 'Active');
    if (!activePurposeExists) return toast.error('Validation Error', 'Selected hall purpose is inactive.');
    const activeHallIds = halls.filter(id => hallsList.some(h => h.id === id && h.status === 'Active'));
    if (activeHallIds.length !== halls.length) return toast.error('Validation Error', 'Only active halls can be selected.');

    const safePrice = Number(form.price ?? 0);
    const safeSession = Number(form.sessionDurationHours ?? 0);
    if (!Number.isFinite(safePrice) || safePrice < 0) return toast.error('Validation Error', 'Package price must be numeric.');
    if (!Number.isFinite(safeSession) || safeSession <= 0) return toast.error('Validation Error', 'Standard Session Duration must be greater than 0.');

    const status = form.status ?? 'Active';

    if (editing) {
      const updated: HallPackage = { ...editing, name, purpose, sessionDurationHours: safeSession, price: safePrice, advanceAmount: Number(form.advanceAmount ?? editing.advanceAmount ?? 0), depositAmount: Number(form.depositAmount ?? editing.depositAmount ?? 0), additionalHourRate: Number(form.additionalHourRate ?? editing.additionalHourRate ?? 0), glCode: form.glCode || undefined, description: form.description ?? editing.description ?? '', halls, status };
      setData(prev => prev.map(d => d.id === editing.id ? updated : d));
      toast.success('Package updated');
    } else {
      const newRec: HallPackage = { id: 'pkg-' + Math.random().toString(36).slice(2), name, purpose, sessionDurationHours: safeSession, price: safePrice, advanceAmount: Number(form.advanceAmount ?? 0), depositAmount: Number(form.depositAmount ?? 0), additionalHourRate: Number(form.additionalHourRate ?? 0), glCode: form.glCode || undefined, description: form.description ?? '', halls, status };
      setData(prev => [...prev, newRec]);
      toast.success('Package created');
    }

    setModalOpen(false); setEditing(null); setForm({ status: 'Active' });
  };

  const handleDelete = () => { if (!deleteTarget) return; setData(prev => prev.filter(p => p.id !== deleteTarget.id)); toast.success('Package deleted'); setDeleteTarget(null); };

  const columns: Column<HallPackage>[] = [
    { key: 'name', header: 'Package', render: (p) => <span className="font-medium text-brown-800">{p.name}</span> },
    { key: 'purpose', header: 'Purpose', render: (p) => purposes.find(x => x.id === p.purpose)?.name ?? p.purpose ?? '—' },
    { key: 'halls', header: 'Halls', render: (p) => (p.halls && p.halls.length ? p.halls.map(id => hallsList.find(h => h.id === id)?.name).filter(Boolean).join(', ') : '—') },
    { key: 'price', header: 'Price', align: 'right', render: (p) => p.price },
    { key: 'status', header: 'Status', render: (p) => p.status },
    { key: 'actions', header: 'Actions', align: 'center', render: (p) => (
      <div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(p)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button><button type="button" onClick={() => setDeleteTarget(p)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button></div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Hall Package Master" description="Create and manage hall packages" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Package</button>} />

      <div className="card p-4"><SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search packages..." filters={[]} /></div>

      <div className="card mt-4"><DataTable columns={columns} data={paged} /><Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Package' : 'Add Package'} size="lg" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Package Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>

          <FormField label="Hall Purpose"><select value={form.purpose ?? ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="input"><option value="">Select purpose</option>{purposes.filter(p => p.status === 'Active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>

          <FormField label="Standard Session Duration"><TextInput type="number" min={1} value={String(form.sessionDurationHours ?? '')} onChange={(e) => setForm({ ...form, sessionDurationHours: Number(e.target.value) })} /></FormField>

          <FormField label="Package Price"><TextInput type="number" min={0} value={String(form.price ?? '')} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></FormField>

          <FormField label="Advance Amount"><TextInput type="number" min={0} value={String(form.advanceAmount ?? '')} onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })} /></FormField>

          <FormField label="Deposit Amount"><TextInput type="number" min={0} value={String(form.depositAmount ?? '')} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} /></FormField>

          <FormField label="Additional Hour Rate"><TextInput type="number" min={0} value={String(form.additionalHourRate ?? '')} onChange={(e) => setForm({ ...form, additionalHourRate: Number(e.target.value) })} /></FormField>

          <FormField label="Halls - Multiple Selection" className="sm:col-span-2">
            <MultiSelect
              values={form.halls ?? []}
              onChange={(vals) => setForm({ ...form, halls: vals })}
              options={hallsList.filter(h => h.status === 'Active').map(h => ({ label: `${h.name} (${h.code})`, value: h.id }))}
              placeholder="Select halls"
            />
          </FormField>

          <FormField label="Description" className="sm:col-span-2"><TextInput value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>

          <FormField label="GL"><Dropdown value={form.glCode ?? ''} onChange={(value) => setForm({ ...form, glCode: value })} options={glRecords.filter(gl => gl.status === 'Active').map(gl => ({ label: `${gl.glCode} - ${gl.glName}`, value: gl.glCode }))} placeholder="Select GL" /></FormField>

          <FormField label="Status"><Toggle checked={form.status === 'Active'} onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" /></FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Package" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallPackageMaster;
