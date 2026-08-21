import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { holidays as initial, type Holiday } from '@/lib/mockData';

const PAGE_SIZE = 12;

export function HallHolidayMaster() {
  const toast = useToast();
  const [data, setData] = useState<Holiday[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<Partial<Holiday>>({ status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(h => !q || h.name.toLowerCase().includes(q) || h.start.includes(q) || h.end.includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm({ name: '', start: '', end: '', status: 'Active' }); setModalOpen(true); };
  const openEdit = (h: Holiday) => { setEditing(h); setForm({ ...h, start: h.start, end: h.end, status: h.status ?? 'Active' }); setModalOpen(true); };

  const handleSave = () => {
    const name = form.name?.trim() ?? '';
    const start = form.start ?? '';
    const end = form.end ?? '';
    if (!name) return toast.error('Validation Error', 'Holiday name is required.');
    if (!start || !end) return toast.error('Validation Error', 'From Date/Time and To Date/Time are required.');
    if (new Date(start).getTime() > new Date(end).getTime()) return toast.error('Validation Error', 'From Date/Time cannot be after To Date/Time.');

    const status = form.status ?? 'Active';

    if (editing) {
      const updated: Holiday = { ...editing, name, start, end, status };
      setData(prev => prev.map(p => p.id === editing.id ? updated : p));
      toast.success('Holiday updated');
    } else {
      const newRec: Holiday = { id: 'hol-' + Math.random().toString(36).slice(2), name, start, end, status };
      setData(prev => [...prev, newRec]);
      toast.success('Holiday created');
    }

    setModalOpen(false); setEditing(null); setForm({ status: 'Active' });
  };

  const handleDelete = () => { if (!deleteTarget) return; setData(prev => prev.filter(p => p.id !== deleteTarget.id)); toast.success('Holiday deleted'); setDeleteTarget(null); };

  const columns: Column<Holiday>[] = [
    { key: 'name', header: 'Holiday Name', render: (r) => <span className="font-medium text-brown-800">{r.name}</span> },
    { key: 'start', header: 'From', render: (r) => new Date(r.start).toLocaleString() },
    { key: 'end', header: 'To', render: (r) => new Date(r.end).toLocaleString() },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4"/></button><button type="button" onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button></div>
    ) }
  ];

  return (
    <div>
      <PageHeader title="Holiday Master" description="Manage holidays that affect hall availability" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4"/>Add Holiday</button>} />

      <div className="card p-4"><SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search holidays..." filters={[]} /></div>

      <div className="card mt-4"><DataTable columns={columns} data={paged} /><Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'} size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></> }>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Holiday Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Status"><Toggle checked={form.status === 'Active'} onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" /></FormField>
          <FormField label="From Date/Time" required className="sm:col-span-2"><TextInput type="datetime-local" value={form.start ?? ''} onChange={(e) => setForm({ ...form, start: e.target.value })} /></FormField>
          <FormField label="To Date/Time" required className="sm:col-span-2"><TextInput type="datetime-local" value={form.end ?? ''} onChange={(e) => setForm({ ...form, end: e.target.value })} /></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Holiday" message={`Delete "${deleteTarget?.name ?? ''}"?`} confirmLabel="Delete" cancelLabel="Cancel" variant="danger" />
    </div>
  );
}

export default HallHolidayMaster;
