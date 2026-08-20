import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, MultiSelect } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { hallPackages as initial, hallPurposes as purposes, halls as hallsList, type HallPackage } from '@/lib/mockData';

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

  const openCreate = () => { setEditing(null); setForm({ name: '', halls: [] }); setModalOpen(true); };
  const openEdit = (p: HallPackage) => { setEditing(p); setForm(p); setModalOpen(true); };

  const handleSave = () => {
    const name = form.name?.trim() ?? '';
    if (!name) return toast.error('Validation Error', 'Package name required');

    if (editing) {
      const updated: HallPackage = { ...editing, name, purpose: form.purpose, sessionDurationHours: form.sessionDurationHours, price: form.price, advanceAmount: form.advanceAmount, depositAmount: form.depositAmount, additionalHourRate: form.additionalHourRate, gstApplicable: form.gstApplicable ?? false, description: form.description ?? '', inclusions: form.inclusions ?? [], halls: form.halls ?? [], status: form.status ?? editing.status };
      setData(prev => prev.map(d => d.id === editing.id ? updated : d));
      toast.success('Package updated');
    } else {
      const newRec: HallPackage = { id: 'pkg-' + Math.random().toString(36).slice(2), name, purpose: form.purpose ?? '', sessionDurationHours: form.sessionDurationHours ?? 0, price: form.price ?? 0, advanceAmount: form.advanceAmount ?? 0, depositAmount: form.depositAmount ?? 0, additionalHourRate: form.additionalHourRate ?? 0, gstApplicable: form.gstApplicable ?? false, description: form.description ?? '', inclusions: form.inclusions ?? [], halls: form.halls ?? [], status: 'Active' };
      setData(prev => [...prev, newRec]);
      toast.success('Package created');
    }

    setModalOpen(false); setEditing(null); setForm({});
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

          <FormField label="Hall Purpose"><select value={form.purpose ?? ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="input"><option value="">Select purpose</option>{purposes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>

          <FormField label="Session Duration (hrs)"><TextInput type="number" value={String(form.sessionDurationHours ?? '')} onChange={(e) => setForm({ ...form, sessionDurationHours: Number(e.target.value) })} /></FormField>

          <FormField label="Price"><TextInput type="number" value={String(form.price ?? '')} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></FormField>

          <FormField label="Advance Amount"><TextInput type="number" value={String(form.advanceAmount ?? '')} onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })} /></FormField>

          <FormField label="Deposit Amount"><TextInput type="number" value={String(form.depositAmount ?? '')} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} /></FormField>

          <FormField label="Additional Hour Rate"><TextInput type="number" value={String(form.additionalHourRate ?? '')} onChange={(e) => setForm({ ...form, additionalHourRate: Number(e.target.value) })} /></FormField>

          <FormField label="GST Applicable"><Toggle checked={!!form.gstApplicable} onChange={(v) => setForm({ ...form, gstApplicable: v })} label={form.gstApplicable ? 'Yes' : 'No'} /></FormField>

          <FormField label="Halls (select multiple)" className="sm:col-span-2">
            <MultiSelect
              values={form.halls ?? []}
              onChange={(vals) => setForm({ ...form, halls: vals })}
              options={hallsList.map(h => ({ label: `${h.name} (${h.code})`, value: h.id }))}
              placeholder="Select halls"
            />
          </FormField>

          <FormField label="Inclusions (comma separated)" className="sm:col-span-2"><TextInput value={(form.inclusions ?? []).join(', ')} onChange={(e) => setForm({ ...form, inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></FormField>

          <FormField label="Description" className="sm:col-span-2"><TextInput value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>

        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Package" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallPackageMaster;
