import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Dropdown, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { deities as initial, printingGroups, type Deity } from '@/lib/mockData';

export function DeityManagement() {
  const toast = useToast();
  const [data, setData] = useState<Deity[]>(initial);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deity | null>(null);
  const [form, setForm] = useState<Partial<Deity>>({});
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())), [data, search]);

  const openCreate = () => { setEditing(null); setForm({}); setStatus('Active'); setModalOpen(true); };
  const openEdit = (d: Deity) => { setEditing(d); setForm(d); setStatus(d.status); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name?.trim()) { toast.error('Required', 'Deity name is required.'); return; }
    if (!form.printingGroup) { toast.error('Required', 'Printing group is required.'); return; }
    if (editing) {
      setData((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...form, status } : d)));
      toast.success('Deity updated');
    } else {
      setData((prev) => [{ id: 'd' + Math.random().toString(36).slice(2), status, ...form } as Deity, ...prev]);
      toast.success('Deity created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Deity deleted'); setDeleteTarget(null); }
  };

  const columns: Column<Deity>[] = [
    { key: 'name', header: 'Deity Name' },
    { key: 'tamilName', header: 'Tamil Name' },
    { key: 'printingGroup', header: 'Printing Group' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Deity Management" description="Manage deities worshipped at the temple"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Deity</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Deity' : 'Add Deity'}
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4">
          <FormField label="Deity Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Tamil Name"><TextInput value={form.tamilName ?? ''} onChange={(e) => setForm({ ...form, tamilName: e.target.value })} /></FormField>
          <FormField label="Printing Group" required><Dropdown value={form.printingGroup ?? ''} onChange={(v) => setForm({ ...form, printingGroup: v })} options={printingGroups.map((p) => ({ label: p.name, value: p.name }))} placeholder="Select Printing Group" /></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Deity" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
