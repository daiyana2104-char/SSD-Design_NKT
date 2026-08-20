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
  glGroupL1Records as l1Init, glGroupL2Records as l2Init, glGroupL3Records as l3Init,
  type GLGroupL1, type GLGroupL2, type GLGroupL3,
} from '@/lib/mockData';

const PAGE_SIZE = 5;
const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

type Tab = 'l1' | 'l2' | 'l3';

export function GLGroupMasterPage() {
  const [tab, setTab] = useState<Tab>('l1');
  return (
    <div>
      <PageHeader title="GL Group Master" description="Manage GL Group hierarchy (Level 1, 2, 3)" />
      <div className="card mb-4 p-1">
        <div className="flex gap-1">
          {([['l1', 'Level 1'], ['l2', 'Level 2'], ['l3', 'Level 3']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === key ? 'bg-maroon-600 text-white' : 'text-brown-600 hover:bg-cream-100'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'l1' && <Level1Tab />}
      {tab === 'l2' && <Level2Tab />}
      {tab === 'l3' && <Level3Tab />}
    </div>
  );
}

function Level1Tab() {
  const toast = useToast();
  const [data, setData] = useState<GLGroupL1[]>(l1Init);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GLGroupL1 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GLGroupL1 | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setStatus('Active'); setModalOpen(true); };
  const openEdit = (g: GLGroupL1) => { setEditing(g); setForm({ name: g.name, description: g.description }); setStatus(g.status); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (editing) {
      setData((prev) => prev.map((d) => d.id === editing.id ? { ...d, name: form.name.trim(), description: form.description.trim(), status } : d));
      toast.success('Level 1 updated');
    } else {
      setData((prev) => [{ id: 'l1-' + Math.random().toString(36).slice(2), name: form.name.trim(), description: form.description.trim(), status }, ...prev]);
      toast.success('Level 1 created');
    }
    setModalOpen(false);
  };
  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Level 1 deleted'); setDeleteTarget(null); } };

  const columns: Column<GLGroupL1>[] = [
    { key: 'name', header: 'Name', render: (g) => <span className="font-medium text-maroon-700">{g.name}</span> },
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
    <>
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]}
          actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Level 1</button>} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Level 1' : 'Add Level 1'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4">
          <FormField label="Level 1 Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Income" /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Level 1" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </>
  );
}

function Level2Tab() {
  const toast = useToast();
  const [l1Data] = useState<GLGroupL1[]>(l1Init);
  const [data, setData] = useState<GLGroupL2[]>(l2Init);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GLGroupL2 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GLGroupL2 | null>(null);
  const [form, setForm] = useState({ l1Id: '', name: '', description: '' });
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const l1Name = (id: string) => l1Data.find((l) => l.id === id)?.name ?? '—';

  const openCreate = () => { setEditing(null); setForm({ l1Id: '', name: '', description: '' }); setStatus('Active'); setModalOpen(true); };
  const openEdit = (g: GLGroupL2) => { setEditing(g); setForm({ l1Id: g.l1Id, name: g.name, description: g.description }); setStatus(g.status); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (!form.l1Id) { toast.error('Level 1 is required'); return; }
    if (editing) {
      setData((prev) => prev.map((d) => d.id === editing.id ? { ...d, ...form, name: form.name.trim(), description: form.description.trim(), status } : d));
      toast.success('Level 2 updated');
    } else {
      setData((prev) => [{ id: 'l2-' + Math.random().toString(36).slice(2), ...form, name: form.name.trim(), description: form.description.trim(), status }, ...prev]);
      toast.success('Level 2 created');
    }
    setModalOpen(false);
  };
  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Level 2 deleted'); setDeleteTarget(null); } };

  const columns: Column<GLGroupL2>[] = [
    { key: 'l1Id', header: 'Level 1', render: (g) => l1Name(g.l1Id) },
    { key: 'name', header: 'Name', render: (g) => <span className="font-medium text-maroon-700">{g.name}</span> },
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
    <>
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]}
          actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Level 2</button>} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Level 2' : 'Add Level 2'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4">
          <FormField label="Level 1" required>
            <Dropdown value={form.l1Id} onChange={(v) => setForm({ ...form, l1Id: v })} options={l1Data.filter((l) => l.status === 'Active').map((l) => ({ label: l.name, value: l.id }))} placeholder="Select Level 1" />
          </FormField>
          <FormField label="Level 2 Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pooja Income" /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Level 2" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </>
  );
}

function Level3Tab() {
  const toast = useToast();
  const [l1Data] = useState<GLGroupL1[]>(l1Init);
  const [l2Data, setL2Data] = useState<GLGroupL2[]>(l2Init);
  const [data, setData] = useState<GLGroupL3[]>(l3Init);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GLGroupL3 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GLGroupL3 | null>(null);
  const [form, setForm] = useState({ l1Id: '', l2Id: '', name: '', description: '' });
  const [status, setStatus] = useState('Active');

  const filtered = useMemo(() => data.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const l1Name = (id: string) => l1Data.find((l) => l.id === id)?.name ?? '—';
  const l2Name = (id: string) => l2Data.find((l) => l.id === id)?.name ?? '—';
  const filteredL2 = l2Data.filter((l) => l.l1Id === form.l1Id && l.status === 'Active');

  const openCreate = () => { setEditing(null); setForm({ l1Id: '', l2Id: '', name: '', description: '' }); setStatus('Active'); setModalOpen(true); };
  const openEdit = (g: GLGroupL3) => { setEditing(g); const l2 = l2Data.find((l) => l.id === g.l2Id); setForm({ l1Id: l2?.l1Id ?? '', l2Id: g.l2Id, name: g.name, description: g.description }); setStatus(g.status); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (!form.l2Id) { toast.error('Level 2 is required'); return; }
    if (editing) {
      setData((prev) => prev.map((d) => d.id === editing.id ? { ...d, l2Id: form.l2Id, name: form.name.trim(), description: form.description.trim(), status } : d));
      toast.success('Level 3 updated');
    } else {
      setData((prev) => [{ id: 'l3-' + Math.random().toString(36).slice(2), l2Id: form.l2Id, name: form.name.trim(), description: form.description.trim(), status }, ...prev]);
      toast.success('Level 3 created');
    }
    setModalOpen(false);
  };
  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Level 3 deleted'); setDeleteTarget(null); } };

  const columns: Column<GLGroupL3>[] = [
    { key: 'l1Id', header: 'Level 1', render: (g) => { const l2 = l2Data.find((l) => l.id === g.l2Id); return l2 ? l1Name(l2.l1Id) : '—'; } },
    { key: 'l2Id', header: 'Level 2', render: (g) => l2Name(g.l2Id) },
    { key: 'name', header: 'Name', render: (g) => <span className="font-medium text-maroon-700">{g.name}</span> },
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
    <>
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]}
          actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Level 3</button>} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Level 3' : 'Add Level 3'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4">
          <FormField label="Level 1" required>
            <Dropdown value={form.l1Id} onChange={(v) => setForm({ ...form, l1Id: v, l2Id: '' })} options={l1Data.filter((l) => l.status === 'Active').map((l) => ({ label: l.name, value: l.id }))} placeholder="Select Level 1" />
          </FormField>
          <FormField label="Level 2" required>
            <Dropdown value={form.l2Id} onChange={(v) => setForm({ ...form, l2Id: v })} options={filteredL2.map((l) => ({ label: l.name, value: l.id }))} placeholder={form.l1Id ? 'Select Level 2' : 'Select Level 1 first'} />
          </FormField>
          <FormField label="Level 3 Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Archana Income" /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Level 3" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </>
  );
}
