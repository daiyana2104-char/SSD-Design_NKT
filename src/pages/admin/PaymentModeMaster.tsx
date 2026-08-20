import { useState } from 'react';
import { Edit, Eye, Wallet } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';

interface PaymentMode {
  id: string; name: string; description: string; publicAvailability: string; status: string;
}

const seedPaymentModes: PaymentMode[] = [
  { id: 'pm1', name: 'Cash', description: 'Cash payment at counter', publicAvailability: 'Yes', status: 'Active' },
  { id: 'pm2', name: 'PayNow', description: 'PayNow transfer', publicAvailability: 'Yes', status: 'Active' },
  { id: 'pm3', name: 'DBS', description: 'DBS bank transfer', publicAvailability: 'No', status: 'Active' },
  { id: 'pm4', name: 'NETS', description: 'NETS payment', publicAvailability: 'Yes', status: 'Active' },
];

export function PaymentModeMaster() {
  const toast = useToast();
  const [data, setData] = useState<PaymentMode[]>(seedPaymentModes);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<PaymentMode | null>(null);
  const [editItem, setEditItem] = useState<PaymentMode | null>(null);
  const [form, setForm] = useState({ name: '', description: '', publicAvailability: 'Yes', status: 'Active' });

  const filtered = data.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (d: PaymentMode) => { setEditItem(d); setForm({ name: d.name, description: d.description, publicAvailability: d.publicAvailability, status: d.status }); };
  const openView = (d: PaymentMode) => setViewItem(d);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Payment Mode is required.'); return; }
    setData((prev) => prev.map((d) => d.id === editItem!.id ? { ...d, ...form } : d));
    toast.success('Payment mode updated', `${form.name} has been updated.`);
    setEditItem(null);
  };

  const columns: Column<PaymentMode>[] = [
    { key: 'name', header: 'Payment Mode', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'publicAvailability', header: 'Public Availability', align: 'center', render: (d) => <StatusBadge status={d.publicAvailability} variant={d.publicAvailability === 'Yes' ? 'success' : 'neutral'} /> },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openView(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => openEdit(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Payment Mode Master" description="Manage payment modes (view and edit only)" />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search payment modes..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="View Payment Mode" size="sm"
        footer={<button className="btn-outline" onClick={() => setViewItem(null)}>Close</button>}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-brown-400">Payment Mode</p><p className="font-medium">{viewItem.name}</p></div>
            <div><p className="text-xs text-brown-400">Description</p><p className="font-medium">{viewItem.description}</p></div>
            <div><p className="text-xs text-brown-400">Public Availability</p><StatusBadge status={viewItem.publicAvailability} variant={viewItem.publicAvailability === 'Yes' ? 'success' : 'neutral'} /></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewItem.status} /></div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Payment Mode" size="sm"
        footer={<><button className="btn-outline" onClick={() => setEditItem(null)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Payment Mode" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Public Availability"><Dropdown value={form.publicAvailability} onChange={(v) => setForm({ ...form, publicAvailability: v })} options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} /></FormField>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}
