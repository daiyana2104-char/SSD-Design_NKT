import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, Calendar, Package, Check, X } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore, exportCSV } from '@/lib/adminStore';

// ---- Hall Category ----
interface HallCategory { id: string; name: string; code: string; status: string; }
const seedHallCats: HallCategory[] = [
  { id: 'hc1', name: 'Main Hall', code: 'MH', status: 'Active' },
  { id: 'hc2', name: 'Prayer Hall', code: 'PH', status: 'Active' },
  { id: 'hc3', name: 'Community Hall', code: 'CH', status: 'Active' },
];

export function HallCategoryManagement() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [data, setData] = useState<HallCategory[]>(seedHallCats);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<HallCategory | null>(null);
  const [form, setForm] = useState({ name: '', code: '', status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState<HallCategory | null>(null);

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('All fields are required.'); return; }
    if (editItem) {
      setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d));
      addAudit('Updated Hall Category', 'Hall Management', `Category "${form.name}" updated`);
      toast.success('Category updated');
    } else {
      setData([...data, { id: 'hc' + Math.random().toString(36).slice(2), ...form }]);
      addAudit('Created Hall Category', 'Hall Management', `Category "${form.name}" created`);
      toast.success('Category created');
    }
    setModalOpen(false);
  };

  const columns: Column<HallCategory>[] = [
    { key: 'name', header: 'Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'code', header: 'Code' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => { setEditItem(d); setForm({ name: d.name, code: d.code, status: d.status }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Hall Categories" description="Manage hall categories" actions={<button className="btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', code: '', status: 'Active' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Category</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Category' : 'Add Category'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Code" required><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { setData(data.filter((d) => d.id !== deleteTarget.id)); toast.success('Category deleted'); } setDeleteTarget(null); }} title="Delete" message="Delete this category?" confirmLabel="Delete" variant="danger" />
    </div>
  );
}

// ---- Hall ----
interface Hall { id: string; category: string; name: string; code: string; capacity: number; status: string; }
const seedHalls: Hall[] = [
  { id: 'h1', category: 'Main Hall', name: 'Siva Hall', code: 'SH1', capacity: 200, status: 'Active' },
  { id: 'h2', category: 'Prayer Hall', name: 'Durga Hall', code: 'DH1', capacity: 100, status: 'Active' },
  { id: 'h3', category: 'Community Hall', name: 'Vinayagar Hall', code: 'VH1', capacity: 150, status: 'Active' },
];

export function HallManagement() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [data, setData] = useState<Hall[]>(seedHalls);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Hall | null>(null);
  const [form, setForm] = useState({ category: 'Main Hall', name: '', code: '', capacity: 100, status: 'Active' });

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and Code are required.'); return; }
    if (editItem) { setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d)); toast.success('Hall updated'); }
    else { setData([...data, { id: 'h' + Math.random().toString(36).slice(2), ...form }]); addAudit('Created Hall', 'Hall Management', `Hall "${form.name}" created`); toast.success('Hall created'); }
    setModalOpen(false);
  };

  const columns: Column<Hall>[] = [
    { key: 'name', header: 'Hall Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'code', header: 'Code' },
    { key: 'category', header: 'Category' },
    { key: 'capacity', header: 'Capacity', align: 'center' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => { setEditItem(d); setForm({ category: d.category, name: d.name, code: d.code, capacity: d.capacity, status: d.status }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => { setData(data.filter((x) => x.id !== d.id)); toast.success('Hall deleted'); }} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Halls" description="Manage temple halls" actions={<button className="btn-primary" onClick={() => { setEditItem(null); setForm({ category: 'Main Hall', name: '', code: '', capacity: 100, status: 'Active' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Hall</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Hall' : 'Add Hall'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Hall Category" required><Dropdown value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={seedHallCats.map((c) => ({ label: c.name, value: c.name }))} /></FormField>
          <FormField label="Hall Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Hall Code" required><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Capacity" required><TextInput type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></FormField>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}

// ---- Hall Purpose ----
interface HallPurpose { id: string; name: string; description: string; status: string; }
const seedPurposes: HallPurpose[] = [
  { id: 'hp1', name: 'Wedding', description: 'Wedding ceremonies', status: 'Active' },
  { id: 'hp2', name: 'Religious Event', description: 'Religious gatherings', status: 'Active' },
  { id: 'hp3', name: 'Community Event', description: 'Community functions', status: 'Active' },
];

export function HallPurposeManagement() {
  const toast = useToast();
  const [data, setData] = useState<HallPurpose[]>(seedPurposes);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<HallPurpose | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    if (editItem) { setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d)); toast.success('Purpose updated'); }
    else { setData([...data, { id: 'hp' + Math.random().toString(36).slice(2), ...form }]); toast.success('Purpose created'); }
    setModalOpen(false);
  };

  const columns: Column<HallPurpose>[] = [
    { key: 'name', header: 'Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => { setEditItem(d); setForm({ name: d.name, description: d.description, status: d.status }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => { setData(data.filter((x) => x.id !== d.id)); toast.success('Deleted'); }} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Hall Purposes" description="Manage hall booking purposes" actions={<button className="btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', description: '', status: 'Active' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Purpose</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Purpose' : 'Add Purpose'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}

// ---- Holiday ----
interface Holiday { id: string; name: string; start: string; end: string; status: string; }
const seedHolidays: Holiday[] = [
  { id: 'hd1', name: 'Maha Shivaratri', start: '2026-02-15T00:00', end: '2026-02-15T23:59', status: 'Active' },
  { id: 'hd2', name: 'Navratri', start: '2026-09-26T00:00', end: '2026-10-04T23:59', status: 'Active' },
];

export function HolidayManagement() {
  const toast = useToast();
  const [data, setData] = useState<Holiday[]>(seedHolidays);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ name: '', start: '', end: '', status: 'Active' });

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim() || !form.start || !form.end) { toast.error('All fields are required.'); return; }
    if (new Date(form.end) < new Date(form.start)) { toast.error('End date must be after start date.'); return; }
    if (editItem) { setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d)); toast.success('Holiday updated'); }
    else { setData([...data, { id: 'hd' + Math.random().toString(36).slice(2), ...form }]); toast.success('Holiday created'); }
    setModalOpen(false);
  };

  const columns: Column<Holiday>[] = [
    { key: 'name', header: 'Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'start', header: 'Start Date & Time', render: (d) => new Date(d.start).toLocaleString() },
    { key: 'end', header: 'End Date & Time', render: (d) => new Date(d.end).toLocaleString() },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => { setEditItem(d); setForm({ name: d.name, start: d.start, end: d.end, status: d.status }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
        <button onClick={() => { setData(data.filter((x) => x.id !== d.id)); toast.success('Deleted'); }} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Holidays" description="Manage temple holidays" actions={<button className="btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', start: '', end: '', status: 'Active' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Holiday</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Holiday' : 'Add Holiday'} size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Start Date & Time" required><TextInput type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></FormField>
          <FormField label="End Date & Time" required><TextInput type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></FormField>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}

// ---- Hall Package ----
interface HallPackage { id: string; name: string; code: string; purpose: string; weekdayPrice: number; weekendPrice: number; holidayPrice: number; deposit: number; gstClass: string; publicAvail: boolean; status: string; halls: { hall: string }[]; }
const seedPackages: HallPackage[] = [
  { id: 'pkg1', name: 'Wedding Package', code: 'WPKG', purpose: 'Wedding', weekdayPrice: 500, weekendPrice: 800, holidayPrice: 1200, deposit: 200, gstClass: 'Applicable', publicAvail: true, status: 'Active', halls: [{ hall: 'Siva Hall' }] },
  { id: 'pkg2', name: 'Community Event Package', code: 'CPKG', purpose: 'Community Event', weekdayPrice: 300, weekendPrice: 500, holidayPrice: 700, deposit: 100, gstClass: 'Applicable', publicAvail: true, status: 'Active', halls: [{ hall: 'Vinayagar Hall' }] },
];

export function HallPackageManagement() {
  const toast = useToast();
  const [data, setData] = useState<HallPackage[]>(seedPackages);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<HallPackage | null>(null);
  const [form, setForm] = useState<Omit<HallPackage, 'id'>>({ name: '', code: '', purpose: 'Wedding', weekdayPrice: 0, weekendPrice: 0, holidayPrice: 0, deposit: 0, gstClass: 'Applicable', publicAvail: true, status: 'Active', halls: [{ hall: 'Siva Hall' }] });

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and Code are required.'); return; }
    if (form.halls.length === 0) { toast.error('At least one hall is required.'); return; }
    if (editItem) { setData(data.map((d) => d.id === editItem.id ? { ...d, ...form } : d)); toast.success('Package updated'); }
    else { setData([...data, { id: 'pkg' + Math.random().toString(36).slice(2), ...form }]); toast.success('Package created'); }
    setModalOpen(false);
  };

  const columns: Column<HallPackage>[] = [
    { key: 'name', header: 'Package Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'code', header: 'Code' },
    { key: 'purpose', header: 'Purpose' },
    { key: 'weekdayPrice', header: 'Weekday', align: 'right', render: (d) => `S$${d.weekdayPrice.toFixed(2)}` },
    { key: 'weekendPrice', header: 'Weekend', align: 'right', render: (d) => `S$${d.weekendPrice.toFixed(2)}` },
    { key: 'holidayPrice', header: 'Holiday', align: 'right', render: (d) => `S$${d.holidayPrice.toFixed(2)}` },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <button onClick={() => { setEditItem(d); setForm({ ...d }); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100"><Edit2 className="h-4 w-4" /></button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Hall Packages" description="Manage hall booking packages" actions={<button className="btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', code: '', purpose: 'Wedding', weekdayPrice: 0, weekendPrice: 0, holidayPrice: 0, deposit: 0, gstClass: 'Applicable', publicAvail: true, status: 'Active', halls: [] }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Package</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Package' : 'Add Package'} size="xl"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Package Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label="Package Code" required><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
            <FormField label="Hall Purpose" required><Dropdown value={form.purpose} onChange={(v) => setForm({ ...form, purpose: v })} options={seedPurposes.map((p) => ({ label: p.name, value: p.name }))} /></FormField>
            <FormField label="GST Classification"><Dropdown value={form.gstClass} onChange={(v) => setForm({ ...form, gstClass: v })} options={[{ label: 'Applicable', value: 'Applicable' }, { label: 'Exempted', value: 'Exempted' }, { label: 'Out of Scope', value: 'Out of Scope' }]} /></FormField>
            <FormField label="Weekday Price"><TextInput type="number" value={form.weekdayPrice} onChange={(e) => setForm({ ...form, weekdayPrice: Number(e.target.value) })} /></FormField>
            <FormField label="Weekend Price"><TextInput type="number" value={form.weekendPrice} onChange={(e) => setForm({ ...form, weekendPrice: Number(e.target.value) })} /></FormField>
            <FormField label="Holiday Price"><TextInput type="number" value={form.holidayPrice} onChange={(e) => setForm({ ...form, holidayPrice: Number(e.target.value) })} /></FormField>
            <FormField label="Deposit Amount"><TextInput type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })} /></FormField>
          </div>
          <FormField label="Public Availability"><Toggle checked={form.publicAvail} onChange={(v) => setForm({ ...form, publicAvail: v })} /></FormField>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Halls</label>
              <button onClick={() => setForm({ ...form, halls: [...form.halls, { hall: 'Siva Hall' }] })} className="btn-outline px-3 py-1 text-xs"><Plus className="h-3 w-3" /> Add Hall</button>
            </div>
            {form.halls.map((h, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <div className="flex-1"><Dropdown value={h.hall} onChange={(v) => setForm({ ...form, halls: form.halls.map((x, idx) => idx === i ? { hall: v } : x) })} options={seedHalls.map((s) => ({ label: s.name, value: s.name }))} /></div>
                <button onClick={() => setForm({ ...form, halls: form.halls.filter((_, idx) => idx !== i) })} className="rounded p-2 text-red-400 hover:bg-red-50"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <FormField label="Status"><Dropdown value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}

// ---- Hall Booking ----
interface HallBooking { id: string; ref: string; customer: string; package: string; eventDate: string; status: string; amount: number; paid: number; }
const seedBookings: HallBooking[] = [
  { id: 'hb1', ref: 'HALL2026080001', customer: 'Rajendran Mohan', package: 'Wedding Package', eventDate: '15/08/2026', status: 'Confirmed', amount: 800, paid: 200 },
  { id: 'hb2', ref: 'HALL2026080002', customer: 'Saraswathi Iyer', package: 'Community Event Package', eventDate: '20/08/2026', status: 'Pending', amount: 500, paid: 0 },
  { id: 'hb3', ref: 'HALL2026080003', customer: 'Murugan Chettiar', package: 'Wedding Package', eventDate: '25/08/2026', status: 'Draft', amount: 800, paid: 0 },
];

export function HallBookingManagement() {
  const toast = useToast();
  const [data, setData] = useState<HallBooking[]>(seedBookings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bookingModal, setBookingModal] = useState(false);
  const [step, setStep] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<HallBooking | null>(null);

  const filtered = data.filter((d) => {
    const m = !search || d.ref.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase());
    const s = !statusFilter || d.status === statusFilter;
    return m && s;
  });

  const handleCancel = () => {
    if (!cancelTarget) return;
    setData(data.map((d) => d.id === cancelTarget.id ? { ...d, status: 'Cancelled' } : d));
    toast.success('Booking cancelled', `${cancelTarget.ref} has been cancelled.`);
    setCancelTarget(null);
  };

  const columns: Column<HallBooking>[] = [
    { key: 'ref', header: 'Booking Ref', render: (d) => <span className="font-medium text-maroon-700">{d.ref}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'package', header: 'Package' },
    { key: 'eventDate', header: 'Event Date' },
    { key: 'amount', header: 'Amount', align: 'right', render: (d) => `S$${d.amount.toFixed(2)}` },
    { key: 'paid', header: 'Paid', align: 'right', render: (d) => `S$${d.paid.toFixed(2)}` },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        {d.status !== 'Cancelled' && <button onClick={() => setCancelTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50" title="Cancel"><X className="h-4 w-4" /></button>}
        {d.status === 'Pending' && <button onClick={() => { setData(data.map((x) => x.id === d.id ? { ...x, status: 'Confirmed' } : x)); toast.success('Booking confirmed'); }} className="rounded p-1.5 text-green-500 hover:bg-green-50" title="Confirm"><Check className="h-4 w-4" /></button>}
      </div>
    ) },
  ];

  const steps = ['Customer', 'Package', 'Availability', 'Booking Details', 'Pricing', 'Payment', 'Confirmation'];

  return (
    <div>
      <PageHeader title="Hall Bookings" description="Manage hall bookings" actions={<button className="btn-primary" onClick={() => { setStep(1); setBookingModal(true); }}><Plus className="h-4 w-4" /> Create Booking</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} filters={[{ label: 'Status', value: statusFilter, options: [{ label: 'All', value: '' }, { label: 'Draft', value: 'Draft' }, { label: 'Pending', value: 'Pending' }, { label: 'Confirmed', value: 'Confirmed' }, { label: 'Cancelled', value: 'Cancelled' }], onChange: setStatusFilter }]} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={bookingModal} onClose={() => setBookingModal(false)} title="Create Hall Booking" size="xl"
        footer={<>
          {step > 1 && <button className="btn-outline" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 7 && <button className="btn-primary" onClick={() => setStep(step + 1)}>Next</button>}
          {step === 7 && <button className="btn-primary" onClick={() => { setData([{ id: 'hb' + Math.random().toString(36).slice(2), ref: 'HALL' + Date.now(), customer: 'New Customer', package: 'Wedding Package', eventDate: '01/09/2026', status: 'Pending', amount: 800, paid: 0 }, ...data]); toast.success('Booking created'); setBookingModal(false); }}>Complete</button>}
        </>}>
        <div>
          <div className="mb-6 flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${step >= i + 1 ? 'bg-maroon-700 text-white' : 'bg-brown-100 text-brown-400'}`}>{i + 1}</div>
                {i < steps.length - 1 && <div className={`h-0.5 w-12 ${step > i + 1 ? 'bg-maroon-600' : 'bg-brown-100'}`} />}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-brown-700">Step {step}: {steps[step - 1]}</p>
          <div className="mt-4 rounded-lg bg-cream-50 p-4 text-sm text-brown-600">
            {step === 1 && <p>Search and select a customer for the booking.</p>}
            {step === 2 && <p>Select a hall package and event date.</p>}
            {step === 3 && <p>Review hall availability for the selected date.</p>}
            {step === 4 && <p>Enter booking details — guests, meal requirements, additional services.</p>}
            {step === 5 && <p>Review pricing — package price, adjustments, deposit, GST, total.</p>}
            {step === 6 && <p>Select payment mode and enter payment details.</p>}
            {step === 7 && <p>Review and confirm the booking.</p>}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancel Booking" message={`Cancel booking "${cancelTarget?.ref}"? This will release blocked halls.`} confirmLabel="Confirm Cancellation" variant="danger" />
    </div>
  );
}
