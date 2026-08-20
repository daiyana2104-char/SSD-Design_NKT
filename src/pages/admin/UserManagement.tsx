import { useState, useMemo } from 'react';
import { Plus, Edit, Eye, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Dropdown, Toggle } from '@/components/ui/Form';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { users as initialUsers, roles, type User } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 5;

const roleOptions: FilterOption[] = [
  { label: 'All Roles', value: '' },
  ...roles.map((r) => ({ label: r.name, value: r.name })),
];
const statusOptions: FilterOption[] = [
  { label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' },
];


export function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const m = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const r = !roleFilter || u.role === roleFilter;
      const s = !statusFilter || u.status === statusFilter;
      return m && r && s;
    });
  }, [users, search, roleFilter, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setModalOpen(true); };

  const handleSave = (data: Partial<User>) => {
    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...data } : u)));
      toast.success('User updated', `${data.name} has been updated.`);
    } else {
      const newUser: User = {
        id: 'u' + Math.random().toString(36).slice(2), name: data.name || '',
        email: data.email || '', mobile: data.mobile || '',
        role: data.role || '', accessUpto: data.accessUpto || '', status: data.status || 'Active',
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success('User created', `${newUser.name} has been added.`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success('User deleted', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
    }
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'role', header: 'Role' },
    { key: 'accessUpto', header: 'Access Upto', render: (u) => formatDate(u.accessUpto) },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'center',
      render: (u) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(u)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(u)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage system users and their access"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add User</button>}
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by name or email..."
          filters={[
            { label: 'Role', value: roleFilter, options: roleOptions, onChange: (v) => { setRoleFilter(v); setPage(1); } },
            { label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } },
          ]}
        />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} onSave={handleSave} />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function UserFormModal({ open, onClose, editing, onSave }: { open: boolean; onClose: () => void; editing: User | null; onSave: (data: Partial<User>) => void }) {
  const [form, setForm] = useState<Partial<User>>(editing ?? {});
  const [status, setStatus] = useState(editing?.status ?? 'Active');

  // Reset form when modal opens
  useMemo(() => {
    if (open) {
      setForm(editing ?? {});
      setStatus(editing?.status ?? 'Active');
    }
  }, [open, editing]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit User' : 'Add User'}
      description={editing ? `Editing ${editing.name}` : 'Create a new system user'}
      size="lg"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, status })}>Save</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" required>
          <TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
        </FormField>
        <FormField label="Email Address" required>
          <TextInput type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
        </FormField>
        <FormField label="Mobile Number" required>
          <TextInput value={form.mobile ?? ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+65 9XXX XXXX" />
        </FormField>
        <FormField label="Role" required>
          <Dropdown value={form.role ?? ''} onChange={(v) => setForm({ ...form, role: v })} options={roles.map((r) => ({ label: r.name, value: r.name }))} placeholder="Select role" />
        </FormField>
        <FormField label="Access Upto" required>
          <TextInput type="date" value={form.accessUpto ? form.accessUpto.split('/').reverse().join('-') : ''} onChange={(e) => setForm({ ...form, accessUpto: e.target.value.split('-').reverse().join('/') })} />
        </FormField>
        <FormField label="Status">
          <div className="pt-2"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status === 'Active' ? 'Active' : 'Inactive'} /></div>
        </FormField>
      </div>
    </Modal>
  );
}
