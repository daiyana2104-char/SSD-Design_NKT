import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import {
  glRecords as initial, glGroupL1Records as l1Init, glGroupL2Records as l2Init, glGroupL3Records as l3Init,
gstRecords as gstInit,  
  type GLMaster,
} from '@/lib/mockData';

const PAGE_SIZE = 5;
const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

export function GLMasterPage() {
  const toast = useToast();
  const [l1Data] = useState(l1Init);
  const [l2Data] = useState(l2Init);
  const [l3Data] = useState(l3Init);
  const [gstData] = useState(gstInit);
  const [data, setData] = useState<GLMaster[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GLMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GLMaster | null>(null);
  const [form, setForm] = useState({ glCode: '', glName: '', gstType: '', groupL1Id: '', groupL2Id: '', groupL3Id: '', description: '' });
  const [status, setStatus] = useState('Active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const l1Name = (id: string) => l1Data.find((l) => l.id === id)?.name ?? '—';
  const l2Name = (id: string) => l2Data.find((l) => l.id === id)?.name ?? '—';
  const l3Name = (id: string) => l3Data.find((l) => l.id === id)?.name ?? '—';

  const filtered = useMemo(() => data.filter((g) =>
    (!search || g.glCode.toLowerCase().includes(search.toLowerCase()) || g.glName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || g.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const filteredL2 = l2Data.filter((l) => l.l1Id === form.groupL1Id && l.status === 'Active');
  const filteredL3 = l3Data.filter((l) => l.l2Id === form.groupL2Id && l.status === 'Active');

  const openCreate = () => {
    setEditing(null);
    setForm({ glCode: '', glName: '', gstType: '', groupL1Id: '', groupL2Id: '', groupL3Id: '', description: '' });
    setStatus('Active'); setErrors({}); setModalOpen(true);
  };
  const openEdit = (g: GLMaster) => {
    setEditing(g);
    setForm({ glCode: g.glCode, glName: g.glName, gstType: g.gstType, groupL1Id: g.groupL1Id, groupL2Id: g.groupL2Id, groupL3Id: g.groupL3Id, description: g.description });
    setStatus(g.status); setErrors({}); setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.glCode.trim()) e.glCode = 'GL Code is required.';
    else if (!editing && data.some((g) => g.glCode.toLowerCase() === form.glCode.trim().toLowerCase())) e.glCode = 'GL Code must be unique.';
    if (!form.glName.trim()) e.glName = 'GL Name is required.';
    if (!form.gstType.trim()) e.gstType = 'GST Type is required.';
    if (!form.groupL1Id) e.groupL1Id = 'Group Level 1 is required.';
    if (!form.groupL2Id) e.groupL2Id = 'Group Level 2 is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = { ...form, glCode: form.glCode.trim(), glName: form.glName.trim(), gstType: form.gstType.trim(), description: form.description.trim(), status };
    if (editing) {
      setData((prev) => prev.map((g) => (g.id === editing.id ? { ...g, ...payload } : g)));
      toast.success('GL record updated');
    } else {
      setData((prev) => [{ id: 'gl' + Math.random().toString(36).slice(2), ...payload }, ...prev]);
      toast.success('GL record created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((g) => g.id !== deleteTarget.id)); toast.success('GL record deleted'); setDeleteTarget(null); } };

  const columns: Column<GLMaster>[] = [
    { key: 'glCode', header: 'GL Code', render: (g) => <span className="font-medium text-maroon-700">{g.glCode}</span> },
    { key: 'glName', header: 'GL Name' },
    { key: 'gstType', header: 'GST Type' },
    { key: 'groupL1Id', header: 'Group L1', render: (g) => l1Name(g.groupL1Id) },
    { key: 'groupL2Id', header: 'Group L2', render: (g) => l2Name(g.groupL2Id) },
    { key: 'groupL3Id', header: 'Group L3', render: (g) => g.groupL3Id ? l3Name(g.groupL3Id) : '—' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (g) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(g)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(g)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="General Ledger (GL) Master" description="Manage General Ledger codes for accounting"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add GL</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit GL Record' : 'Add GL Record'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="GL Code" required error={errors.glCode} hint="Unique identifier for this ledger account">
            <TextInput value={form.glCode} onChange={(e) => setForm({ ...form, glCode: e.target.value })} placeholder="GL-1001" />
          </FormField>
          <FormField label="GL Name" required error={errors.glName}>
            <TextInput value={form.glName} onChange={(e) => setForm({ ...form, glName: e.target.value })} placeholder="Pooja Income" />
          </FormField>
          <FormField label="GST Type" required error={errors.gstType} hint="GST is derived from this GL account">
  <Dropdown
    value={form.gstType}
    onChange={(v) => setForm({ ...form, gstType: v })}
    options={
      gstData
        .filter((gst) => gst.status === 'Active')
        .map((gst) => ({
          label: `${gst.gstType} (${gst.percentage}%)`,
          value: gst.id,
        }))
    }
    placeholder="Select GST Type"
  />
</FormField>
          <FormField label="Group Level 1" required error={errors.groupL1Id}>
            <Dropdown value={form.groupL1Id} onChange={(v) => setForm({ ...form, groupL1Id: v, groupL2Id: '', groupL3Id: '' })} options={l1Data.filter((l) => l.status === 'Active').map((l) => ({ label: l.name, value: l.id }))} placeholder="Select Level 1" />
          </FormField>
          <FormField label="Group Level 2">
            <Dropdown value={form.groupL2Id} onChange={(v) => setForm({ ...form, groupL2Id: v, groupL3Id: '' })} options={filteredL2.map((l) => ({ label: l.name, value: l.id }))} placeholder={form.groupL1Id ? 'Select Level 2' : 'Select Level 1 first'} />
          </FormField>
          <FormField label="Group Level 3">
            <Dropdown value={form.groupL3Id} onChange={(v) => setForm({ ...form, groupL3Id: v })} options={filteredL3.map((l) => ({ label: l.name, value: l.id }))} placeholder={form.groupL2Id ? 'Select Level 3' : 'Select Level 2 first'} />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Income from pooja services" />
          </FormField>
          <FormField label="Status">
            <div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div>
          </FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete GL Record" message={`Delete "${deleteTarget?.glName}" (${deleteTarget?.glCode})?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
