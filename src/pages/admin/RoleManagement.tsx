import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Shield } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { roles as seedRoles, type Role } from '@/lib/mockData';
import { useAdminStore, exportCSV } from '@/lib/adminStore';

export function RoleManagement() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>(seedRoles);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = roles.filter((r) => {
    const m = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const s = !statusFilter || r.status === statusFilter;
    return m && s;
  });

  const openCreate = () => {
    setEditRole(null);
    setForm({ name: '', description: '', status: 'Active' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditRole(r);
    setForm({ name: r.name, description: '', status: r.status });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Role Name is required.';
    else if (roles.some((r) => r.name === form.name && r.id !== editRole?.id)) e.name = 'Role name already exists.';
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editRole) {
      setRoles(roles.map((r) => r.id === editRole.id ? { ...r, ...form } : r));
      addAudit('Updated Role', 'Role Management', `Role "${form.name}" updated`);
      toast.success('Role updated', `${form.name} has been updated.`);
    } else {
      const newRole: Role = { id: 'r' + Math.random().toString(36).slice(2), ...form, users: 0 };
      setRoles([...roles, newRole]);
      addAudit('Created Role', 'Role Management', `Role "${form.name}" created`);
      toast.success('Role created', `${form.name} has been created.`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.users > 0) {
      toast.error('Cannot delete', `Role "${deleteTarget.name}" is assigned to ${deleteTarget.users} user(s). Deactivate instead.`);
      setDeleteTarget(null);
      return;
    }
    setRoles(roles.filter((r) => r.id !== deleteTarget.id));
    addAudit('Deleted Role', 'Role Management', `Role "${deleteTarget.name}" deleted`);
    toast.success('Role deleted', `${deleteTarget.name} has been deleted.`);
    setDeleteTarget(null);
  };

  const toggleStatus = (r: Role) => {
    setRoles(roles.map((x) => x.id === r.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x));
    addAudit('Updated Role Status', 'Role Management', `Role "${r.name}" set to ${r.status === 'Active' ? 'Inactive' : 'Active'}`);
    toast.info('Status updated', `${r.name} is now ${r.status === 'Active' ? 'Inactive' : 'Active'}.`);
  };

  const handleExport = () => {
    exportCSV('roles.csv', ['Name', 'Users', 'Status'], filtered.map((r) => [r.name, r.users, r.status]));
    toast.success('Exported', 'roles.csv downloaded.');
  };

  const columns: Column<Role>[] = [
    { key: 'name', header: 'Role Name', render: (r) => <span className="font-medium text-brown-800">{r.name}</span> },
    { key: 'users', header: 'Assigned Users', align: 'center' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => toggleStatus(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Shield className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Role Management" description="Manage user roles and access levels"
        actions={<><button className="btn-outline" onClick={handleExport}>Export CSV</button><button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Role</button></>} />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={setSearch}
          filters={[{ label: 'Status', value: statusFilter, options: [{ label: 'All', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }], onChange: setStatusFilter }]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={filtered} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRole ? 'Edit Role' : 'Add Role'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Role Name" required error={errors.name}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status" required>
            <Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })}
              options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Role" message={`Delete role "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
