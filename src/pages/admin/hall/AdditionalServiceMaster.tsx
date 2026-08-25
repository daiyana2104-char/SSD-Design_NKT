import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { additionalServices as initial, glRecords, type AdditionalService } from '@/lib/mockData';

const PAGE_SIZE = 10;

export function AdditionalServiceMaster() {
  const toast = useToast();
  const [data, setData] = useState<AdditionalService[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalService | null>(null);
  const [form, setForm] = useState<Partial<AdditionalService>>({ pricingType: 'Fixed', status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState<AdditionalService | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(s => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', pricingType: 'Fixed', rate: 0, glCode: '', status: 'Active' }); setModalOpen(true); };
  const openEdit = (r: AdditionalService) => { setEditing(r); setForm(r); setModalOpen(true); };

  const handleSave = () => {
    const code = form.code?.trim() ?? '';
    const name = form.name?.trim() ?? '';
    if (!code) return toast.error('Validation Error', 'Service code is required.');
    if (!name) return toast.error('Validation Error', 'Service name is required.');
    if (data.some(d => d.code.toLowerCase() === code.toLowerCase() && d.id !== editing?.id)) return toast.error('Duplicate Code', 'Service code already exists.');
    if (!Number.isFinite(Number(form.rate)) || Number(form.rate) < 0) return toast.error('Validation Error', 'Rate must be numeric.');

    const pricingType = form.pricingType ?? 'Fixed';
    const status = form.status ?? 'Active';

    if (editing) {
      const updated: AdditionalService = { ...editing, code, name, pricingType, rate: Number(form.rate ?? editing.rate ?? 0), glCode: form.glCode || undefined, status };
      setData(prev => prev.map(p => p.id === editing.id ? updated : p));
      toast.success('Service updated');
    } else {
      const newRec: AdditionalService = { id: 'as-' + Math.random().toString(36).slice(2), code, name, pricingType, rate: Number(form.rate ?? 0), glCode: form.glCode || undefined, status };
      setData(prev => [...prev, newRec]);
      toast.success('Service created');
    }

    setModalOpen(false); setEditing(null); setForm({ pricingType: 'Fixed', status: 'Active' });
  };

  const handleDelete = () => { if (!deleteTarget) return; setData(prev => prev.filter(p => p.id !== deleteTarget.id)); toast.success('Service deleted'); setDeleteTarget(null); };

  const columns: Column<AdditionalService>[] = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-medium text-brown-800">{r.code}</span> },
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'type', header: 'Pricing Type', render: (r) => r.pricingType },
    { key: 'rate', header: 'Rate', align: 'right', render: (r) => r.rate },
    { key: 'gl', header: 'GL', render: (r) => glRecords.find(gl => gl.glCode === r.glCode)?.glCode ?? '—' },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button><button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button></div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Additional Service Master" description="Manage extra services available for halls" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Service</button>} />

      <div className="card p-4"><SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search services..." filters={[]} /></div>

      <div className="card mt-4"><DataTable columns={columns} data={paged} /><Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'} size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></> }>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Code" required><TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Pricing Type"><Dropdown value={form.pricingType ?? 'Fixed'} onChange={(v) => setForm({ ...form, pricingType: v as any })} options={[{ label: 'Fixed', value: 'Fixed' }, { label: 'Per Hour', value: 'Per Hour' }, { label: 'Per Person', value: 'Per Person' }, { label: 'Per Unit', value: 'Per Unit' }]} /></FormField>
          <FormField label="Rate"><TextInput type="number" min={0} value={String(form.rate ?? '')} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} /></FormField>
          <FormField label="GL"><Dropdown value={form.glCode ?? ''} onChange={(value) => setForm({ ...form, glCode: value })} options={glRecords.filter(gl => gl.status === 'Active').map(gl => ({ label: `${gl.glCode} - ${gl.glName}`, value: gl.glCode }))} placeholder="Select GL" /></FormField>
          <FormField label="Status"><Toggle checked={form.status === 'Active'} onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" /></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Service" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default AdditionalServiceMaster;
