import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Edit, Eye, Plus, Power, CreditCard, Check, X, RefreshCw } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Dropdown, FormField, TextArea, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore } from '@/lib/adminStore';
import { customers, glRecords } from '@/lib/mockData';
import { hallBookings } from '@/lib/hallData';
import { loadMealBookings } from '@/lib/mealFoodUtils';
import { MealBookingManagement } from './MealBookingManagement';

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

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Other';
type BookingStatus = 'Draft' | 'Confirmed' | 'Cancelled' | 'Completed';
type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Refunded';

type PricingBasis = 'Per Pax' | 'Per Unit' | 'Per Pack / Quantity' | 'Per Tub';

interface MealItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description?: string;
  pricingBasis: PricingBasis;
  cost: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  createdBy?: string;
}

interface MealPackageRef {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  itemIds?: string[];
}

interface StoredMealPackage {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  packageType: 'Vegetarian' | 'Non-Vegetarian' | 'Mixed';
  paxType: 'Adult' | 'Child' | 'Both';
  pricePerPax: number;
  minimumPax: number;
  maximumPax?: number;
  glCode?: string;
  description: string;
  status: 'Active' | 'Inactive';
  itemIds: string[];
}

interface MealAvailability {
  id: string;
  date: string;
  packageId: string;
  capacity: number;
  status?: string;
}

const mealItemsKey = 'meal_items';
const mealPackagesKey = 'meal_packages';
const mealBookingsKey = 'meal_bookings';
const mealAvailabilityKey = 'meal_availability';
const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'].map((value) => ({ label: value, value }));
const bookingStatusOptions = ['Draft', 'Confirmed', 'Cancelled', 'Completed'].map((value) => ({ label: value, value }));

const PRICING_BASIS_OPTIONS: PricingBasis[] = ['Per Pax', 'Per Unit', 'Per Pack / Quantity', 'Per Tub'];

const initialMealItems: MealItem[] = [
  { id: 'meal-i1', code: 'FOOD001', name: 'Idly', categoryId: 'mc1', description: 'Steamed rice cakes', pricingBasis: 'Per Pax', cost: 2.5, status: 'Active', createdAt: '2026-01-10T09:00:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i2', code: 'FOOD002', name: 'Vada', categoryId: 'mc1', description: 'Crispy lentil doughnut', pricingBasis: 'Per Pax', cost: 2.0, status: 'Active', createdAt: '2026-01-10T09:05:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i3', code: 'FOOD003', name: 'Pongal', categoryId: 'mc1', description: 'Ghee ven pongal', pricingBasis: 'Per Pax', cost: 3.0, status: 'Active', createdAt: '2026-01-10T09:10:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i4', code: 'FOOD004', name: 'Rice', categoryId: 'mc2', description: 'Steamed white rice', pricingBasis: 'Per Pax', cost: 1.5, status: 'Active', createdAt: '2026-01-10T09:15:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i5', code: 'FOOD005', name: 'Sambar', categoryId: 'mc2', description: 'Traditional South Indian sambar', pricingBasis: 'Per Pax', cost: 2.0, status: 'Active', createdAt: '2026-01-10T09:20:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i6', code: 'FOOD006', name: 'Rasam', categoryId: 'mc2', description: 'Pepper rasam', pricingBasis: 'Per Pax', cost: 1.8, status: 'Active', createdAt: '2026-01-10T09:25:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i7', code: 'FOOD007', name: 'Payasam', categoryId: 'mc2', description: 'Sweet dessert payasam', pricingBasis: 'Per Pack / Quantity', cost: 3.5, status: 'Active', createdAt: '2026-01-10T09:30:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i8', code: 'FOOD008', name: 'Briyani', categoryId: 'mc2', description: 'Vegetable Dum Briyani', pricingBasis: 'Per Pax', cost: 5.0, status: 'Active', createdAt: '2026-01-10T09:35:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i9', code: 'FOOD009', name: 'Coffee', categoryId: 'mc4', description: 'Filter coffee', pricingBasis: 'Per Unit', cost: 1.0, status: 'Active', createdAt: '2026-01-10T09:40:00.000Z', createdBy: 'Suresh Krishnan' },
  { id: 'meal-i10', code: 'FOOD010', name: 'Tea', categoryId: 'mc4', description: 'Masala tea', pricingBasis: 'Per Unit', cost: 0.8, status: 'Active', createdAt: '2026-01-10T09:45:00.000Z', createdBy: 'Suresh Krishnan' },
];

const initialMealPackages: StoredMealPackage[] = [
  { id: 'mp1', code: 'MEAL001', name: 'Annadhanam Package', categoryId: 'mc2', packageType: 'Vegetarian', paxType: 'Both', pricePerPax: 10, minimumPax: 1, glCode: 'GL-2002', description: 'Meal package for devotees.', status: 'Active', itemIds: ['meal-i1'] },
  { id: 'mp2', code: 'MEAL002', name: 'Special Meal Set', categoryId: 'mc3', packageType: 'Mixed', paxType: 'Both', pricePerPax: 15, minimumPax: 10, maximumPax: 500, glCode: 'GL-2002', description: 'Special meal package for events.', status: 'Active', itemIds: ['meal-i4', 'meal-i5'] },
];

function readStorage<T>(key: string, fallback: T): T {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; } catch { return fallback; }
}

function writeStorage<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore storage failures */ }
}

function normalizePricingBasis(value?: string): PricingBasis {
  if (value === 'Per Unit' || value === 'Per Cup') return 'Per Unit';
  if (value === 'Per Pack / Quantity' || value === 'Per Portion') return 'Per Pack / Quantity';
  if (value === 'Per Tub') return 'Per Tub';
  return 'Per Pax';
}

function normalizeMealItem(raw: Partial<MealItem> & Record<string, unknown>, fallback?: MealItem): MealItem {
  return {
    id: raw.id ?? fallback?.id ?? `meal-i-${Math.random().toString(36).slice(2)}`,
    code: raw.code ?? fallback?.code ?? '',
    name: raw.name ?? fallback?.name ?? '',
    categoryId: raw.categoryId ?? fallback?.categoryId ?? 'mc1',
    description: raw.description ?? fallback?.description ?? '',
    pricingBasis: normalizePricingBasis(String(raw.pricingBasis ?? fallback?.pricingBasis ?? 'Per Pax')),
    cost: Number(raw.cost ?? fallback?.cost ?? 0),
    status: raw.status ?? fallback?.status ?? 'Active',
    createdAt: raw.createdAt ?? fallback?.createdAt ?? new Date().toISOString(),
    createdBy: raw.createdBy ?? fallback?.createdBy ?? 'System',
  };
}

function loadMealItems() {
  const saved = readStorage<(Partial<MealItem> & Record<string, unknown>)[]>(mealItemsKey, []);
  const source = saved.length ? saved : initialMealItems;
  return source.map((item) => normalizeMealItem(item, initialMealItems.find((i) => i.id === item.id)));
}

function generateItemCode(existing: MealItem[]): string {
  const nums = existing
    .map((item) => {
      const match = item.code.match(/^FOOD(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `FOOD${String(next).padStart(3, '0')}`;
}

function loadMealPackagesForDeps(): MealPackageRef[] {
  const saved = readStorage<MealPackageRef[]>(mealPackagesKey, []);
  if (saved.length) return saved;
  return initialMealPackages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    status: pkg.status,
    itemIds: pkg.itemIds,
  }));
}

function getItemDeactivationBlock(itemId: string): string | null {
  const packages = loadMealPackagesForDeps();
  const activePackages = packages.filter(
    (pkg) => pkg.status === 'Active' && (pkg.itemIds ?? []).includes(itemId),
  );
  if (activePackages.length) {
    return `This menu item is included in active food package(s): ${activePackages.map((p) => p.name).join(', ')}.`;
  }

  const packageIds = packages.filter((pkg) => (pkg.itemIds ?? []).includes(itemId)).map((pkg) => pkg.id);
  const confirmedBookings = hallBookings.filter(
    (booking) =>
      booking.bookingStatus === 'Confirmed' &&
      booking.mealsRequired &&
      booking.mealPackageId &&
      packageIds.includes(booking.mealPackageId),
  );
  if (confirmedBookings.length) {
    return `This menu item is linked to confirmed booking(s): ${confirmedBookings.map((b) => b.bookingRef).join(', ')}.`;
  }

  return null;
}
function loadMealPackages() {
  const saved = readStorage<StoredMealPackage[]>(mealPackagesKey, []);
  return saved.length ? saved : initialMealPackages;
}
function loadMealCategoriesForModule() { return readStorage<MealCategory[]>(MEAL_CATEGORIES_KEY, initialMealCategories); }

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
  const [form, setForm] = useState<Partial<MealCategory>>({});
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealCategory | null>(null);
  const [viewing, setViewing] = useState<MealCategory | null>(null);

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
  const nextCode = `MC-${String(data.length + 1).padStart(3, '0')}`;

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({ code: nextCode, name: '', description: '', displayOrder: data.length + 1 });
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
    const code = editing?.code ?? form.code?.trim().toUpperCase() ?? '';
    const name = form.name?.trim() ?? '';
    const description = form.description?.trim() ?? '';
    const displayOrder = form.displayOrder === undefined || form.displayOrder === 0 ? data.length + 1 : Number(form.displayOrder);

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
    setViewing(null);
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
        <SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Search category code or name..." filters={[]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setViewing(null); }} title={viewing ? 'View Category' : (editing ? 'Edit Category' : 'Add Category')} size="md" footer={viewing ? <button type="button" className="btn-outline" onClick={() => { setModalOpen(false); setViewing(null); }}>Close</button> : <><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category Code" required><TextInput value={form.code ?? ''} placeholder="Auto-generated" disabled /></FormField>
          <FormField label="Category Name" required><TextInput value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Breakfast" disabled={!!viewing} /></FormField>
          <FormField label="Description" className="sm:col-span-2"><TextArea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe this meal category" disabled={!!viewing} /></FormField>
          <FormField label="Display Order"><TextInput type="number" min="1" step="1" value={form.displayOrder ?? ''} onChange={(event) => setForm({ ...form, displayOrder: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="e.g. 1" disabled={!!viewing} /></FormField>
          <FormField label="Status"><div className="pt-2">{viewing ? <StatusBadge status={status} /> : <Toggle checked={status === 'Active'} onChange={(value) => setStatus(value ? 'Active' : 'Inactive')} trueLabel="Active" falseLabel="Inactive" />}</div></FormField>
        </div>
      </Modal>
    </div>
  );
}

function MealItemMasterScreen() {
  const toast = useToast();
  const { user } = useAdminStore();
  const [data, setData] = useState<MealItem[]>(loadMealItems);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPricingBasis, setFilterPricingBasis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState<{ field: 'name' | 'cost' | 'createdAt'; dir: 'asc' | 'desc' }>({
    field: 'name',
    dir: 'asc',
  });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealItem | null>(null);
  const [viewing, setViewing] = useState<MealItem | null>(null);
  const [form, setForm] = useState<MealItem>({
    id: '',
    code: '',
    name: '',
    categoryId: 'mc1',
    description: '',
    pricingBasis: 'Per Pax',
    cost: 0,
    status: 'Active',
  });

  const updateData = (next: MealItem[]) => {
    setData(next);
    writeStorage(mealItemsKey, next);
  };

  const mealCategories = loadMealCategoriesForModule();
  const activeCategories = mealCategories.filter((c) => c.status === 'Active');
  const pageSize = 8;

  const categoryName = (categoryId: string) =>
    mealCategories.find((category) => category.id === categoryId)?.name ?? '—';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      const matchesCategory = !filterCategory || item.categoryId === filterCategory;
      const matchesPricing = !filterPricingBasis || item.pricingBasis === filterPricingBasis;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesPricing && matchesStatus;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'name') cmp = a.name.localeCompare(b.name);
      else if (sort.field === 'cost') cmp = a.cost - b.cost;
      else cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [data, search, filterCategory, filterPricingBasis, filterStatus, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = !!search || !!filterCategory || !!filterPricingBasis || !!filterStatus;

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterPricingBasis('');
    setFilterStatus('');
    setPage(1);
  };

  const handleRefresh = () => {
    setData(loadMealItems());
    clearFilters();
    setSort({ field: 'name', dir: 'asc' });
    toast.success('Refreshed', 'Menu item list has been refreshed.');
  };

  const blankForm = (): MealItem => ({
    id: '',
    code: generateItemCode(data),
    name: '',
    categoryId: activeCategories[0]?.id ?? 'mc1',
    description: '',
    pricingBasis: 'Per Pax',
    cost: 0,
    status: 'Active',
  });

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm(blankForm());
    setModalOpen(true);
  };

  const openEdit = (item: MealItem) => {
    setEditing(item);
    setViewing(null);
    setForm({ ...item });
    setModalOpen(true);
  };

  const openView = (item: MealItem) => {
    setViewing(item);
    setEditing(null);
    setForm({ ...item });
    setModalOpen(true);
  };

  const save = () => {
    const code = editing?.code ?? form.code;
    const name = form.name.trim();
    const cost = Number(form.cost);

    if (!name) return toast.error('Validation Error', 'Item name is required.');
    if (!form.categoryId || !activeCategories.some((category) => category.id === form.categoryId)) {
      return toast.error('Validation Error', 'Select an active item category.');
    }
    if (!form.pricingBasis) return toast.error('Validation Error', 'Pricing basis is required.');
    if (!Number.isFinite(cost) || cost < 0) {
      return toast.error('Validation Error', 'Cost must be a valid non-negative amount.');
    }
    if (
      data.some(
        (item) =>
          item.id !== editing?.id &&
          item.status === 'Active' &&
          item.categoryId === form.categoryId &&
          item.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      return toast.error(
        'Duplicate Name',
        'An active item with this name already exists in the selected category.',
      );
    }

    if (form.status === 'Inactive' && editing) {
      const block = getItemDeactivationBlock(editing.id);
      if (block) return toast.error('Cannot Deactivate', block);
    }

    const record: MealItem = {
      ...form,
      code,
      name,
      description: form.description?.trim() ?? '',
      pricingBasis: form.pricingBasis,
      cost,
      id: editing?.id ?? `meal-i-${Math.random().toString(36).slice(2)}`,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      createdBy: editing?.createdBy ?? user?.name ?? 'System',
    };

    updateData(editing ? data.map((item) => (item.id === editing.id ? record : item)) : [...data, record]);
    toast.success(editing ? 'Menu item updated' : 'Menu item created');
    setModalOpen(false);
  };

  const toggleStatus = (item: MealItem) => {
    const next = item.status === 'Active' ? 'Inactive' : 'Active';
    if (next === 'Inactive') {
      const block = getItemDeactivationBlock(item.id);
      if (block) return toast.error('Cannot Deactivate', block);
    }
    updateData(data.map((value) => (value.id === item.id ? { ...value, status: next } : value)));
    toast.success(`Menu item ${next === 'Active' ? 'activated' : 'deactivated'}`);
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  const columns: Column<MealItem>[] = [
    { key: 'code', header: 'Item Code', render: (item) => <span className="font-medium text-brown-800">{item.code}</span> },
    { key: 'name', header: 'Item Name', render: (item) => <span className="text-brown-800">{item.name}</span> },
    { key: 'category', header: 'Item Category', render: (item) => categoryName(item.categoryId) },
    { key: 'pricingBasis', header: 'Pricing Basis' },
    { key: 'cost', header: 'Cost', align: 'right', render: (item) => `S$${item.cost.toFixed(2)}` },
    { key: 'createdBy', header: 'Created By', render: (item) => item.createdBy ?? '—' },
    { key: 'createdAt', header: 'Created Date', render: (item) => formatDate(item.createdAt) },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (item) => (
        <div className="flex justify-center gap-1">
          <button type="button" onClick={() => openView(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
          <button type="button" onClick={() => openEdit(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Edit"><Edit className="h-4 w-4" /></button>
          <button type="button" onClick={() => toggleStatus(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Activate / Deactivate"><Power className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Meal Item Master"
        description="Manage menu items for food packages and hall bookings"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        }
      />
      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search menu item name..."
          filters={[
            {
              label: 'Category',
              value: filterCategory,
              onChange: (value) => {
                setFilterCategory(value);
                setPage(1);
              },
              options: [
                { label: 'All Categories', value: '' },
                ...mealCategories.map((c) => ({ label: c.name, value: c.id })),
              ],
            },
            {
              label: 'Pricing Basis',
              value: filterPricingBasis,
              onChange: (value) => {
                setFilterPricingBasis(value);
                setPage(1);
              },
              options: [
                { label: 'All Pricing Basis', value: '' },
                ...PRICING_BASIS_OPTIONS.map((value) => ({ label: value, value })),
              ],
            },
            {
              label: 'Status',
              value: filterStatus,
              onChange: (value) => {
                setFilterStatus(value);
                setPage(1);
              },
              options: [
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ],
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="hidden text-sm text-brown-500 sm:inline">Sort:</span>
                <select
                  value={`${sort.field}-${sort.dir}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-') as [
                      'name' | 'cost' | 'createdAt',
                      'asc' | 'desc',
                    ];
                    setSort({ field, dir });
                    setPage(1);
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                  <option value="cost-asc">Cost (Low–High)</option>
                  <option value="cost-desc">Cost (High–Low)</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="btn-outline flex items-center gap-1.5 text-sm">
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}
              <button type="button" onClick={handleRefresh} className="btn-outline flex items-center gap-1.5 text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          }
        />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={pageSize} />
      </div>
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setViewing(null);
        }}
        title={viewing ? 'View Menu Item' : editing ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
        footer={
          viewing ? (
            <button type="button" className="btn-outline" onClick={() => { setModalOpen(false); setViewing(null); }}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={save}>Save</button>
            </>
          )
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Item Code" required hint="Auto-generated">
              <TextInput readOnly value={form.code} className="bg-cream-50" />
            </FormField>
            <FormField label="Item Name" required>
              <TextInput
                disabled={!!viewing}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Idly"
              />
            </FormField>
            <FormField label="Item Category" required>
              <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
                <Dropdown
                  value={form.categoryId}
                  onChange={(value) => setForm({ ...form, categoryId: value })}
                  options={activeCategories.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
                  placeholder="Select category"
                />
              </div>
            </FormField>
            <FormField label="Pricing Basis" required>
              <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
                <Dropdown
                  value={form.pricingBasis}
                  onChange={(value) => setForm({ ...form, pricingBasis: value as PricingBasis })}
                  options={PRICING_BASIS_OPTIONS.map((value) => ({ label: value, value }))}
                />
              </div>
            </FormField>
            <FormField label="Cost" required hint="Standard menu item cost">
              <TextInput
                disabled={!!viewing}
                type="number"
                min="0"
                step="0.01"
                value={String(form.cost)}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <TextArea
                disabled={!!viewing}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional item details"
              />
            </FormField>
            <FormField label="Status" className={viewing ? 'pointer-events-none opacity-60' : undefined}>
              <Toggle
                checked={form.status === 'Active'}
                onChange={(value) => {
                  if (!value && editing) {
                    const block = getItemDeactivationBlock(editing.id);
                    if (block) return toast.error('Cannot Deactivate', block);
                  }
                  setForm({ ...form, status: value ? 'Active' : 'Inactive' });
                }}
                trueLabel="Active"
                falseLabel="Inactive"
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MealAvailabilityManagementScreen() {
  const toast = useToast();
  const [data, setData] = useState<MealAvailability[]>(() => readStorage(mealAvailabilityKey, []));
  const packages = loadMealPackages();
  const categories = loadMealCategoriesForModule();
  const bookings = loadMealBookings();
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MealAvailability>({ id: '', date: '', packageId: '', capacity: 0 });

  const persist = (next: MealAvailability[]) => { setData(next); writeStorage(mealAvailabilityKey, next); };
  const getPackage = (id: string) => packages.find((item) => item.id === id);
  const bookedPax = (record: MealAvailability) =>
    bookings
      .filter((item) => item.eventDate === record.date && item.packageId === record.packageId && item.bookingStatus === 'Confirmed')
      .reduce((sum, item) => sum + (item.paxCount ?? 0), 0);
  const statusFor = (record: MealAvailability) => {
    const remaining = record.capacity - bookedPax(record);
    return record.status === 'Closed/Blocked' ? 'Closed/Blocked' : remaining <= 0 ? 'Fully Booked' : remaining < record.capacity ? 'Partially Available' : 'Available';
  };
  const rows = data.filter((record) => {
    const pkg = getPackage(record.packageId);
    return (!dateFilter || record.date === dateFilter) && (!categoryFilter || pkg?.categoryId === categoryFilter) && (!packageFilter || record.packageId === packageFilter);
  });

  const save = () => {
    const capacity = Number(form.capacity);
    const booked = form.id ? bookedPax(form) : 0;
    if (!form.date || !form.packageId) return toast.error('Validation Error', 'Date and meal package are required.');
    if (!Number.isInteger(capacity) || capacity <= 0) return toast.error('Validation Error', 'Capacity must be a positive number.');
    if (capacity < booked) return toast.error('Validation Error', 'Capacity cannot be less than booked pax.');
    const duplicate = data.some((item) => item.date === form.date && item.packageId === form.packageId && item.id !== form.id);
    if (duplicate) return toast.error('Duplicate Availability', 'Availability already exists for this date and package.');
    persist(form.id ? data.map((item) => item.id === form.id ? { ...form, capacity } : item) : [...data, { ...form, capacity, id: `ma-${Math.random().toString(36).slice(2)}` }]);
    toast.success(form.id ? 'Availability updated' : 'Availability created');
    setModalOpen(false);
  };

  const columns: Column<MealAvailability>[] = [
    { key: 'date', header: 'Date' },
    { key: 'package', header: 'Meal Package', render: (item) => getPackage(item.packageId)?.name ?? 'Unknown' },
    { key: 'capacity', header: 'Capacity', align: 'right' },
    { key: 'booked', header: 'Booked Pax', align: 'right', render: (item) => bookedPax(item) },
    { key: 'remaining', header: 'Remaining Pax', align: 'right', render: (item) => Math.max(0, item.capacity - bookedPax(item)) },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={statusFor(item)} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (item) => <button type="button" onClick={() => { setForm(item); setModalOpen(true); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Edit"><Edit className="h-4 w-4" /></button> },
  ];

  return (
    <div>
      <PageHeader title="Meal Availability Management" description="Manage date-wise meal package capacity" actions={<button type="button" className="btn-primary" onClick={() => { setForm({ id: '', date: '', packageId: '', capacity: 0 }); setModalOpen(true); }}><Plus className="h-4 w-4" />Add Availability</button>} />
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextInput type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input" value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
            <option value="">All Packages</option>
            {packages.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={rows} emptyMessage="No availability configured" />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Availability' : 'Add Availability'} size="md" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date" required><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField>
          <FormField label="Capacity" required><TextInput type="number" min="1" value={String(form.capacity || '')} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></FormField>
          <FormField label="Meal Package" required className="sm:col-span-2">
            <Dropdown
              value={form.packageId}
              onChange={(value) => setForm({ ...form, packageId: value })}
              options={packages.filter((item) => item.status === 'Active').map((item) => ({ label: `${item.name} (${item.code})`, value: item.id }))}
              placeholder="Select meal package"
            />
          </FormField>
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
export function MealItemMaster() { return <MealItemMasterScreen />; }
export { MealBookingManagement };
export function MealAvailabilityManagement() { return <MealAvailabilityManagementScreen />; }
export function MealReports() { return <MealManagementPage module="reports" />; }

export function MealModuleRedirect() {
  const location = useLocation();
  const module = location.pathname.includes('meal-categories') ? 'category' : location.pathname.includes('meal-items') ? 'item' : location.pathname.includes('meal-bookings') ? 'booking' : location.pathname.includes('meal-availability') ? 'availability' : 'reports';
  return <MealManagementPage module={module} />;
}
