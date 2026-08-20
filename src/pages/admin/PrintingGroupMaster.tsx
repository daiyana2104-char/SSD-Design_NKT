import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { printingGroups as initial, type PrintingGroup } from '@/lib/mockData';

export function PrintingGroupMaster() {
  const toast = useToast();
  const [data, setData] = useState<PrintingGroup[]>(initial);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PrintingGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrintingGroup | null>(null);
  const [form, setForm] = useState<Partial<PrintingGroup>>({});
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())), [data, search]);

  const openCreate = () => { setEditing(null); setForm({}); setStatus('Active'); setModalOpen(true); };
  const openEdit = (p: PrintingGroup) => { setEditing(p); setForm(p); setStatus(p.status); setModalOpen(true); };

  const handleSave = () => {
    if (editing) { setData((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form, status } : p))); toast.success('Printing group updated'); }
    else { setData((prev) => [{ id: 'pg' + Math.random().toString(36).slice(2), mappedItems: 0, mappedServices: 0, status, ...form } as PrintingGroup, ...prev]); toast.success('Printing group created'); }
    setModalOpen(false);
  };
  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((p) => p.id !== deleteTarget.id)); toast.success('Printing group deleted'); setDeleteTarget(null); } };

  const columns: Column<PrintingGroup>[] = [
    { key: 'name', header: 'Printing Group Name', render: (p) => <span className="font-medium text-maroon-700">{p.name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'mappedItems', header: 'Mapped Items', align: 'center' },
    { key: 'mappedServices', header: 'Mapped Services', align: 'center' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (p) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(p)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(p)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Printing Group Master" description="Logical ticket-grouping configuration for receipts"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Printing Group</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Printing Group' : 'Add Printing Group'}
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4">
          <FormField label="Printing Group Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Description"><TextArea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Printing Group" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
