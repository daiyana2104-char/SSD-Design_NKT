import { useState } from 'react';
import { Plus, Edit2, Trash2, X, UtensilsCrossed } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore, exportCSV } from '@/lib/adminStore';

interface MealPackage {
  id: string; name: string; code: string; deity: string; gstClass: string; price: number;
  description: string; status: string; items: { category: string; item: string; qty: number; cost: number }[];
}

const seedMealPackages: MealPackage[] = [
  { id: 'mp1', name: 'Annadhanam Package', code: 'MEAL001', deity: 'Lord Shiva', gstClass: 'Exempted', price: 10, description: 'Free meal for devotees', status: 'Active', items: [{ category: 'Prasadam', item: 'Rice', qty: 2, cost: 5 }] },
  { id: 'mp2', name: 'Special Meal Set', code: 'MEAL002', deity: 'Goddess Durga', gstClass: 'Applicable', price: 15, description: 'Special meal for events', status: 'Active', items: [{ category: 'Prasadam', item: 'Rice', qty: 1, cost: 5 }, { category: 'Prasadam', item: 'Curry', qty: 1, cost: 8 }] },
];

export function MealPackageManagement() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [data, setData] = useState<MealPackage[]>(seedMealPackages);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MealPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MealPackage | null>(null);
  const [form, setForm] = useState<Omit<MealPackage, 'id'>>({ name: '', code: '', deity: 'Lord Shiva', gstClass: 'Exempted', price: 0, description: '', status: 'Active', items: [] });

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and Code are required.'); return; }
    if (editItem) { setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d)); addAudit('Updated Meal Package', 'Meal Management', `Package "${form.name}" updated`); toast.success('Package updated'); }
    else { setData([...data, { id: 'mp' + Math.random().toString(36).slice(2), ...form }]); addAudit('Created Meal Package', 'Meal Management', `Package "${form.name}" created`); toast.success('Package created'); }
    setModalOpen(false);
  };

  const columns: Column<MealPackage>[] = [
    { key: 'name', header: 'Package Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'code', header: 'Code' },
    { key: 'deity', header: 'Deity' },
    { key: 'price', header: 'Price', align: 'right', render: (d) => `S$${d.price.toFixed(2)}` },
    { key: 'gstClass', header: 'GST' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => { setEditItem(d); setForm({ ...d }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Meal Packages" description="Manage meal packages for hall bookings"
        actions={<><button className="btn-outline" onClick={() => exportCSV('meal-packages.csv', ['Name', 'Code', 'Deity', 'Price', 'GST', 'Status'], filtered.map((d) => [d.name, d.code, d.deity, d.price, d.gstClass, d.status]))}>Export CSV</button>
        <button className="btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', code: '', deity: 'Lord Shiva', gstClass: 'Exempted', price: 0, description: '', status: 'Active', items: [] }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Package</button></>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Meal Package' : 'Add Meal Package'} size="xl"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Package Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label="Package Code" required><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
            <FormField label="Deity"><Dropdown value={form.deity} onChange={(v) => setForm({ ...form, deity: v })} options={['Lord Shiva', 'Goddess Durga', 'Lord Ganesha', 'Lord Murugan'].map((d) => ({ label: d, value: d }))} /></FormField>
            <FormField label="GST Classification"><Dropdown value={form.gstClass} onChange={(v) => setForm({ ...form, gstClass: v })} options={[{ label: 'Applicable', value: 'Applicable' }, { label: 'Exempted', value: 'Exempted' }, { label: 'Out of Scope', value: 'Out of Scope' }]} /></FormField>
            <FormField label="Price"><TextInput type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></FormField>
            <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
          </div>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Items</label>
              <button onClick={() => setForm({ ...form, items: [...form.items, { category: 'Prasadam', item: '', qty: 1, cost: 0 }] })} className="btn-outline px-3 py-1 text-xs"><Plus className="h-3 w-3" /> Add Item</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <TextInput value={it.item} onChange={(e) => setForm({ ...form, items: form.items.map((x, idx) => idx === i ? { ...x, item: e.target.value } : x) })} placeholder="Item name" />
                <div className="w-24"><TextInput type="number" value={it.qty} onChange={(e) => setForm({ ...form, items: form.items.map((x, idx) => idx === i ? { ...x, qty: Number(e.target.value) } : x) })} placeholder="Qty" /></div>
                <div className="w-24"><TextInput type="number" value={it.cost} onChange={(e) => setForm({ ...form, items: form.items.map((x, idx) => idx === i ? { ...x, cost: Number(e.target.value) } : x) })} placeholder="Cost" /></div>
                <button onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })} className="rounded p-2 text-red-400 hover:bg-red-50"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { setData(data.filter((d) => d.id !== deleteTarget.id)); toast.success('Package deleted'); } setDeleteTarget(null); }}
        title="Delete Package" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
