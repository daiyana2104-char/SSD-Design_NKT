import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Edit, Eye, Plus, Power } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextArea, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';

type MealModule = 'category' | 'item' | 'booking' | 'availability' | 'reports';

interface MealCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

const MEAL_CATEGORIES_KEY = 'meal_categories';
const PAGE_SIZE = 5;
const initialMealCategories: MealCategory[] = [
  { id: 'mc1', code: 'BRK', name: 'Breakfast', description: 'Morning meal packages', displayOrder: 1, status: 'Active' },
  { id: 'mc2', code: 'LUN', name: 'Lunch', description: 'Midday meal packages', displayOrder: 2, status: 'Active' },
  { id: 'mc3', code: 'DIN', name: 'Dinner', description: 'Evening meal packages', displayOrder: 3, status: 'Active' },
  { id: 'mc4', code: 'SNK', name: 'Snacks', description: 'Snack meal packages', displayOrder: 4, status: 'Active' },
];

function loadMealCategories() {
  try {
    const saved = localStorage.getItem(MEAL_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) as MealCategory[] : initialMealCategories;
  } catch {
    return initialMealCategories;
  }
}

function MealCategoryMasterScreen() {
  const toast = useToast();
  const [data, setData] = useState<MealCategory[]>(loadMealCategories);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealCategory | null>(null);
  const [viewing, setViewing] = useState<MealCategory | null>(null);
  const [form, setForm] = useState<Partial<MealCategory>>({});
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const persist = (next: MealCategory[]) => {
    setData(next);
    localStorage.setItem(MEAL_CATEGORIES_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data
      .filter((record) => !query || record.code.toLowerCase().includes(query) || record.name.toLowerCase().includes(query))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({ code: '', name: '', description: '', displayOrder: undefined });
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (record: MealCategory) => {
    setEditing(record);
    setViewing(null);
    setForm(record);
    setStatus(record.status);
    setModalOpen(true);
  };

  const openView = (record: MealCategory) => {
    setViewing(record);
    setEditing(null);
    setForm(record);
    setStatus(record.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = form.code?.trim().toUpperCase() ?? '';
    const name = form.name?.trim() ?? '';
    const description = form.description?.trim() ?? '';
    const displayOrder = form.displayOrder === undefined || form.displayOrder === '' ? 0 : Number(form.displayOrder);

    if (!code) return toast.error('Validation Error', 'Category Code is required.');
    if (!name) return toast.error('Validation Error', 'Category Name is required.');
    if (data.some((record) => record.code.toLowerCase() === code.toLowerCase() && record.id !== editing?.id)) {
      return toast.error('Duplicate Code', 'Category code already exists.');
    }
    if (data.some((record) => record.name.toLowerCase() === name.toLowerCase() && record.id !== editing?.id)) {
      return toast.error('Duplicate Name', 'Category name already exists.');
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      return toast.error('Validation Error', 'Display Order must be a valid positive number.');
    }

    const nextRecord: MealCategory = {
      id: editing?.id ?? `mc-${Math.random().toString(36).slice(2)}`,
      code,
      name,
      description,
      displayOrder,
      status,
    };
    persist(editing ? data.map((record) => record.id === editing.id ? nextRecord : record) : [...data, nextRecord]);
    toast.success(editing ? 'Category updated' : 'Category created');
    setModalOpen(false);
    setEditing(null);
    setForm({});
  };

  const toggleStatus = (record: MealCategory) => {
    const nextStatus = record.status === 'Active' ? 'Inactive' : 'Active';
    persist(data.map((item) => item.id === record.id ? { ...item, status: nextStatus } : item));
    toast.success(`Category ${nextStatus === 'Active' ? 'activated' : 'deactivated'}`);
  };

  const columns: Column<MealCategory>[] = [
    { key: 'code', header: 'Category Code', render: (record) => <span className="font-medium text-brown-800">{record.code}</span> },
    { key: 'name', header: 'Category Name', render: (record) => <span className="text-brown-800">{record.name}</span> },
    { key: 'description', header: 'Description', render: (record) => <span className="text-brown-600">{record.description || '-'}</span> },
    { key: 'displayOrder', header: 'Display Order', align: 'center' },
    { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'center', render: (record) => (
        <div className="flex justify-center gap-1">
          <button type="button" onClick={() => openView(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
          <button type="button" onClick={() => openEdit(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4" /></button>
          <button type="button" onClick={() => toggleStatus(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title={record.status === 'Active' ? 'Deactivate' : 'Activate'}><Power className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Meal Category Master" description="Manage categories for meal packages" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Category</button>} />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} placeholder="Search category code or name..." filters={[]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={viewing ? 'View Category' : (editing ? 'Edit Category' : 'Add Category')} size="md" footer={viewing ? undefined : <><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category Code" required><TextInput value={form.code ?? ''} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. BRK" disabled={!!viewing} /></FormField>
          <FormField label="Category Name" required><TextInput value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Breakfast" disabled={!!viewing} /></FormField>
          <FormField label="Description" className="sm:col-span-2"><TextArea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe this meal category" disabled={!!viewing} /></FormField>
          <FormField label="Display Order"><TextInput type="number" min="0" value={form.displayOrder ?? ''} onChange={(event) => setForm({ ...form, displayOrder: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="e.g. 1" disabled={!!viewing} /></FormField>
          <FormField label="Status"><div className="pt-2">{viewing ? <StatusBadge status={status} /> : <Toggle checked={status === 'Active'} onChange={(value) => setStatus(value ? 'Active' : 'Inactive')} trueLabel="Active" falseLabel="Inactive" />}</div></FormField>
        </div>
      </Modal>
    </div>
  );
}

const moduleDetails: Record<MealModule, { title: string; description: string; columns: Column<{ id: string; name: string; status: string }>[]; rows: { id: string; name: string; status: string }[] }> = {
  category: {
    title: 'Meal Category Master', description: 'Manage categories for meal packages',
    columns: [{ key: 'name', header: 'Category Name' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mc1', name: 'Breakfast', status: 'Active' }, { id: 'mc2', name: 'Lunch', status: 'Active' }],
  },
  item: {
    title: 'Meal Item Master', description: 'Manage individual meal items',
    columns: [{ key: 'name', header: 'Item Name' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mi1', name: 'Idly', status: 'Active' }, { id: 'mi2', name: 'Rice', status: 'Active' }],
  },
  booking: {
    title: 'Meal Booking Management', description: 'Create and manage meal bookings',
    columns: [{ key: 'name', header: 'Booking Reference' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mb1', name: 'MB202608001', status: 'Confirmed' }],
  },
  availability: {
    title: 'Meal Availability Management', description: 'View meal capacity and availability',
    columns: [{ key: 'name', header: 'Meal Package' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'ma1', name: 'Special Meal Set', status: 'Available' }],
  },
  reports: {
    title: 'Meal Reports', description: 'View meal booking, sales and availability reports',
    columns: [{ key: 'name', header: 'Report' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mr1', name: 'Meal Booking Report', status: 'Available' }, { id: 'mr2', name: 'Meal Sales Report', status: 'Available' }, { id: 'mr3', name: 'Meal Availability Report', status: 'Available' }],
  },
};

export function MealManagementPage({ module }: { module: MealModule }) {
  const detail = moduleDetails[module];
  return <div><PageHeader title={detail.title} description={detail.description} /><div className="card"><DataTable columns={detail.columns} data={detail.rows} /></div></div>;
}

export function MealCategoryMaster() { return <MealCategoryMasterScreen />; }
export function MealItemMaster() { return <MealManagementPage module="item" />; }
export function MealBookingManagement() { return <MealManagementPage module="booking" />; }
export function MealAvailabilityManagement() { return <MealManagementPage module="availability" />; }
export function MealReports() { return <MealManagementPage module="reports" />; }

export function MealModuleRedirect() {
  const location = useLocation();
  const module = location.pathname.includes('meal-categories') ? 'category' : location.pathname.includes('meal-items') ? 'item' : location.pathname.includes('meal-bookings') ? 'booking' : location.pathname.includes('meal-availability') ? 'availability' : 'reports';
  return <MealManagementPage module={module} />;
}
