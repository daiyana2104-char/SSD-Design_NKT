import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Edit, Eye, Plus, Power, CreditCard, Check, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Dropdown, FormField, TextArea, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { customers, glRecords } from '@/lib/mockData';

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

interface MealItem {
  id: string;
  code: string;
  name: string;
  tamilName: string;
  mealType: MealType;
  categoryId: string;
  glCode?: string;
  description: string;
  status: 'Active' | 'Inactive';
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

interface MealBooking {
  id: string;
  reference: string;
  customerId: string;
  eventDate: string;
  categoryId: string;
  mealType: MealType;
  serviceTime: string;
  packageId: string;
  adultPax: number;
  childPax: number;
  totalPax: number;
  packageAmount: number;
  gst: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
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

const initialMealItems: MealItem[] = [
  { id: 'meal-i1', code: 'FOOD001', name: 'Idly', tamilName: 'இட்லி', mealType: 'Breakfast', categoryId: 'mc1', glCode: 'GL-2002', description: 'Steamed rice cakes', status: 'Active' },
  { id: 'meal-i2', code: 'FOOD002', name: 'Vada', tamilName: 'வடை', mealType: 'Breakfast', categoryId: 'mc1', glCode: 'GL-2002', description: 'Crispy lentil doughnut', status: 'Active' },
  { id: 'meal-i3', code: 'FOOD003', name: 'Pongal', tamilName: 'பொங்கல்', mealType: 'Breakfast', categoryId: 'mc1', glCode: 'GL-2002', description: 'Ghee ven pongal', status: 'Active' },
  { id: 'meal-i4', code: 'FOOD004', name: 'Rice', tamilName: 'சாதம்', mealType: 'Lunch', categoryId: 'mc2', glCode: 'GL-2002', description: 'Steamed white rice', status: 'Active' },
  { id: 'meal-i5', code: 'FOOD005', name: 'Sambar', tamilName: 'சாம்பார்', mealType: 'Lunch', categoryId: 'mc2', glCode: 'GL-2002', description: 'Traditional South Indian sambar', status: 'Active' },
  { id: 'meal-i6', code: 'FOOD006', name: 'Rasam', tamilName: 'ரசம்', mealType: 'Lunch', categoryId: 'mc2', glCode: 'GL-2002', description: 'Pepper rasam', status: 'Active' },
  { id: 'meal-i7', code: 'FOOD007', name: 'Payasam', tamilName: 'பாயாசம்', mealType: 'Lunch', categoryId: 'mc2', glCode: 'GL-2002', description: 'Sweet dessert payasam', status: 'Active' },
  { id: 'meal-i8', code: 'FOOD008', name: 'Briyani', tamilName: 'பிரியாணி', mealType: 'Lunch', categoryId: 'mc2', glCode: 'GL-2002', description: 'Vegetable Dum Briyani', status: 'Active' },
  { id: 'meal-i9', code: 'FOOD009', name: 'Coffee', tamilName: 'காபி', mealType: 'Snacks', categoryId: 'mc4', glCode: 'GL-2002', description: 'Filter coffee', status: 'Active' },
  { id: 'meal-i10', code: 'FOOD010', name: 'Tea', tamilName: 'தேநீர்', mealType: 'Snacks', categoryId: 'mc4', glCode: 'GL-2002', description: 'Masala tea', status: 'Active' },
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

function loadMealItems() { return readStorage<MealItem[]>(mealItemsKey, initialMealItems); }
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
        <SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} placeholder="Search category code or name..." filters={[]} />
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
  const [data, setData] = useState<MealItem[]>(loadMealItems);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealItem | null>(null);
  const [viewing, setViewing] = useState<MealItem | null>(null);
  const [form, setForm] = useState<MealItem>({
    id: '',
    code: '',
    name: '',
    tamilName: '',
    mealType: 'Breakfast',
    categoryId: 'mc1',
    glCode: 'GL-2002',
    description: '',
    status: 'Active',
  });

  const updateData = (next: MealItem[]) => { setData(next); writeStorage(mealItemsKey, next); };
  const activeGlRecords = glRecords.filter((record) => record.status === 'Active');
  const mealCategories = loadMealCategoriesForModule();
  const activeCategories = mealCategories.filter((c) => c.status === 'Active');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => !q || [item.code, item.name, item.tamilName].some((value) => value.toLowerCase().includes(q)));
  }, [data, search]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({
      id: '',
      code: `MI-${String(data.length + 1).padStart(3, '0')}`,
      name: '',
      tamilName: '',
      mealType: 'Breakfast',
      categoryId: activeCategories[0]?.id ?? 'mc1',
      glCode: activeGlRecords[0]?.glCode ?? '',
      description: '',
      status: 'Active',
    });
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
    const code = editing?.code ?? form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code) return toast.error('Validation Error', 'Item code is required.');
    if (!name) return toast.error('Validation Error', 'Item name is required.');
    if (!form.mealType) return toast.error('Validation Error', 'Meal type is required.');
    if (!form.categoryId || !mealCategories.some((category) => category.id === form.categoryId && category.status === 'Active')) {
      return toast.error('Validation Error', 'Select an active meal category.');
    }
    if (data.some((item) => item.code.toLowerCase() === code.toLowerCase() && item.id !== editing?.id)) {
      return toast.error('Duplicate Code', 'Item code already exists.');
    }

    const record: MealItem = {
      ...form,
      code,
      name,
      id: editing?.id ?? `meal-i-${Math.random().toString(36).slice(2)}`,
    };
    updateData(editing ? data.map((item) => item.id === editing.id ? record : item) : [...data, record]);
    toast.success(editing ? 'Meal item updated' : 'Meal item created');
    setModalOpen(false);
  };

  const toggleStatus = (item: MealItem) => {
    const next = item.status === 'Active' ? 'Inactive' : 'Active';
    updateData(data.map((value) => value.id === item.id ? { ...value, status: next } : value));
    toast.success(`Meal item ${next === 'Active' ? 'activated' : 'deactivated'}`);
  };

  const columns: Column<MealItem>[] = [
    { key: 'code', header: 'Item Code', render: (item) => <span className="font-medium text-brown-800">{item.code}</span> },
    { key: 'name', header: 'Item Name', render: (item) => <span className="text-brown-800">{item.name}</span> },
    { key: 'tamilName', header: 'Tamil Name', render: (item) => item.tamilName || '-' },
    { key: 'category', header: 'Category', render: (item) => mealCategories.find((category) => category.id === item.categoryId)?.name ?? '-' },
    { key: 'mealType', header: 'Meal Type' },
    { key: 'gl', header: 'GL', render: (item) => item.glCode ? (glRecords.find(g => g.glCode === item.glCode)?.glCode ?? item.glCode) : '—' },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'center', render: (item) => (
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
      <PageHeader title="Meal Item Master" description="Manage individual meal food items" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Item</button>} />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Search item code or name..." filters={[]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={pageSize} />
      </div>
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setViewing(null); }}
        title={viewing ? 'View Meal Item' : editing ? 'Edit Meal Item' : 'Add Meal Item'}
        size="lg"
        footer={
          viewing ? (
            <button type="button" className="btn-outline" onClick={() => { setModalOpen(false); setViewing(null); }}>Close</button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={save}>Save</button>
            </>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Item Code" required>
            <TextInput disabled={!!viewing} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. FOOD001" />
          </FormField>
          <FormField label="Item Name" required>
            <TextInput disabled={!!viewing} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Idly" />
          </FormField>
          <FormField label="Tamil Name">
            <TextInput disabled={!!viewing} value={form.tamilName} onChange={(e) => setForm({ ...form, tamilName: e.target.value })} placeholder="e.g. இட்லி" />
          </FormField>
          <FormField label="Meal Category" required>
            <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
              <Dropdown
                value={form.categoryId}
                onChange={(value) => setForm({ ...form, categoryId: value })}
                options={activeCategories.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
                placeholder="Select category"
              />
            </div>
          </FormField>
          <FormField label="Meal Type" required>
            <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
              <Dropdown
                value={form.mealType}
                onChange={(value) => setForm({ ...form, mealType: value as MealType })}
                options={mealTypeOptions}
              />
            </div>
          </FormField>
          <FormField label="GL">
            <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
              <Dropdown
                value={form.glCode ?? ''}
                onChange={(value) => setForm({ ...form, glCode: value })}
                options={activeGlRecords.map((record) => ({ label: `${record.glCode} - ${record.glName}`, value: record.glCode }))}
                placeholder="Select GL"
              />
            </div>
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <TextArea disabled={!!viewing} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Item details and ingredients" />
          </FormField>
          <FormField label="Status" className={viewing ? 'pointer-events-none opacity-60' : undefined}>
            <Toggle checked={form.status === 'Active'} onChange={(value) => setForm({ ...form, status: value ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

function MealBookingManagementScreen() {
  const toast = useToast();
  const [data, setData] = useState<MealBooking[]>(() => readStorage(mealBookingsKey, []));
  const packages = loadMealPackages();
  const categories = loadMealCategoriesForModule();
  const activeCategories = categories.filter((category) => category.status === 'Active');
  const activePackages = packages.filter((item) => item.status === 'Active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<MealBooking | null>(null);
  const [editing, setEditing] = useState<MealBooking | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<MealBooking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [form, setForm] = useState<MealBooking>({
    id: '', reference: '', customerId: '', eventDate: '', categoryId: '', mealType: 'Breakfast',
    serviceTime: '', packageId: '', adultPax: 0, childPax: 0, totalPax: 0, packageAmount: 0,
    gst: 0, totalAmount: 0, amountPaid: 0, paymentStatus: 'Pending', bookingStatus: 'Draft',
  });

  const persist = (next: MealBooking[]) => { setData(next); writeStorage(mealBookingsKey, next); };
  const matchingPackages = activePackages.filter((item) => !form.categoryId || item.categoryId === form.categoryId);
  const customer = customers.find((item) => item.id === form.customerId);

  const calculate = (next: Partial<MealBooking>) => {
    const adult = Number(next.adultPax ?? form.adultPax) || 0;
    const child = Number(next.childPax ?? form.childPax) || 0;
    const pkg = activePackages.find((item) => item.id === (next.packageId ?? form.packageId));
    const gl = glRecords.find((record) => record.glCode === pkg?.glCode && record.status === 'Active');
    const gstRate = gl?.gstRate ?? 0;
    const totalPax = adult + child;
    const packageAmount = pkg ? pkg.pricePerPax * totalPax : 0;
    const gst = packageAmount * (gstRate / 100);
    return { ...form, ...next, totalPax, packageAmount, gst, totalAmount: packageAmount + gst };
  };

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({
      id: '',
      reference: `MB${new Date().getFullYear()}${String(data.length + 1).padStart(4, '0')}`,
      customerId: '',
      eventDate: '',
      categoryId: activeCategories[0]?.id ?? '',
      mealType: 'Breakfast',
      serviceTime: '08:00',
      packageId: '',
      adultPax: 0,
      childPax: 0,
      totalPax: 0,
      packageAmount: 0,
      gst: 0,
      totalAmount: 0,
      amountPaid: 0,
      paymentStatus: 'Pending',
      bookingStatus: 'Draft',
    });
    setModalOpen(true);
  };

  const openView = (booking: MealBooking) => { setViewing(booking); setEditing(null); setForm(booking); setModalOpen(true); };
  const openEdit = (booking: MealBooking) => { setViewing(null); setEditing(booking); setForm(booking); setModalOpen(true); };

  const save = () => {
    const next = calculate(form);
    const pkg = activePackages.find((item) => item.id === next.packageId);
    const totalPax = next.totalPax;
    if (!next.reference.trim() || !next.customerId || !next.eventDate || !next.serviceTime || !next.categoryId || !next.packageId) {
      return toast.error('Validation Error', 'Complete all booking details.');
    }
    if (totalPax <= 0) return toast.error('Validation Error', 'Total pax must be greater than zero.');
    if (pkg && (totalPax < pkg.minimumPax || (pkg.maximumPax !== undefined && totalPax > pkg.maximumPax))) {
      return toast.error('Validation Error', `Pax must be between ${pkg.minimumPax} and ${pkg.maximumPax ?? 'the package maximum'}.`);
    }
    if (next.bookingStatus === 'Confirmed') {
      const availability = readStorage<MealAvailability[]>(mealAvailabilityKey, []).find((item) => item.date === next.eventDate && item.packageId === next.packageId);
      const booked = data.filter((item) => item.eventDate === next.eventDate && item.packageId === next.packageId && item.bookingStatus === 'Confirmed' && item.id !== editing?.id).reduce((sum, item) => sum + item.totalPax, 0);
      if (!availability) return toast.error('Availability Required', 'Configure availability for this package and date before confirming.');
      if ((availability.status ?? '').toLowerCase().includes('closed') || booked + totalPax > availability.capacity) {
        return toast.error('Capacity Exceeded', `Only ${Math.max(0, availability.capacity - booked)} pax are available for this meal package on the selected date.`);
      }
    }
    const record = { ...next, id: editing?.id ?? `mb-${Math.random().toString(36).slice(2)}` };
    persist(editing ? data.map((item) => item.id === editing.id ? record : item) : [...data, record]);
    toast.success(editing ? 'Meal booking updated' : 'Meal booking created');
    setModalOpen(false);
  };

  const changeStatus = (booking: MealBooking, bookingStatus: BookingStatus) => {
    if (bookingStatus === 'Confirmed') {
      setEditing(booking);
      setViewing(null);
      setForm({ ...booking, bookingStatus });
      setModalOpen(true);
      return;
    }
    persist(data.map((item) => item.id === booking.id ? { ...item, bookingStatus } : item));
    toast.success(`Booking ${bookingStatus.toLowerCase()}`);
  };

  const addPayment = () => {
    if (!paymentBooking) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > paymentBooking.totalAmount - paymentBooking.amountPaid) {
      return toast.error('Validation Error', 'Enter an amount within the outstanding balance.');
    }
    const paid = paymentBooking.amountPaid + amount;
    const status: PaymentStatus = paid >= paymentBooking.totalAmount ? 'Paid' : 'Partially Paid';
    persist(data.map((item) => item.id === paymentBooking.id ? { ...item, amountPaid: paid, paymentStatus: status } : item));
    toast.success('Payment recorded');
    setPaymentBooking(null);
    setPaymentAmount('');
  };

  const filtered = data.filter((item) => !search.trim() || item.reference.toLowerCase().includes(search.toLowerCase()) || customers.find((customerItem) => customerItem.id === item.customerId)?.name.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const customerName = (id: string) => customers.find((item) => item.id === id)?.name ?? 'Unknown';
  const packageName = (id: string) => packages.find((item) => item.id === id)?.name ?? 'Unknown';

  const columns: Column<MealBooking>[] = [
    { key: 'reference', header: 'Booking Ref', render: (item) => <span className="font-medium text-brown-800">{item.reference}</span> },
    { key: 'customer', header: 'Customer', render: (item) => customerName(item.customerId) },
    { key: 'eventDate', header: 'Event Date' },
    { key: 'package', header: 'Meal Package', render: (item) => packageName(item.packageId) },
    { key: 'mealType', header: 'Meal Type' },
    { key: 'adultPax', header: 'Adult', align: 'right' },
    { key: 'childPax', header: 'Child', align: 'right' },
    { key: 'totalPax', header: 'Total Pax', align: 'right' },
    { key: 'totalAmount', header: 'Total Amount', align: 'right', render: (item) => `S$${item.totalAmount.toFixed(2)}` },
    { key: 'paymentStatus', header: 'Payment', render: (item) => <StatusBadge status={item.paymentStatus} /> },
    { key: 'bookingStatus', header: 'Status', render: (item) => <StatusBadge status={item.bookingStatus} /> },
    {
      key: 'actions', header: 'Actions', align: 'center', render: (item) => (
        <div className="flex justify-center gap-1">
          <button type="button" onClick={() => openView(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
          <button type="button" onClick={() => openEdit(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Edit"><Edit className="h-4 w-4" /></button>
          <button type="button" onClick={() => setPaymentBooking(item)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Payment"><CreditCard className="h-4 w-4" /></button>
          {item.bookingStatus === 'Confirmed' && <button type="button" onClick={() => changeStatus(item, 'Cancelled')} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Cancel"><X className="h-4 w-4" /></button>}
          {item.bookingStatus === 'Confirmed' && <button type="button" onClick={() => changeStatus(item, 'Completed')} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Complete"><Check className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Meal Booking Management" description="Create and manage meal bookings" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Booking</button>} />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Search booking reference or customer..." filters={[]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={pageSize} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={viewing ? 'View Meal Booking' : editing ? 'Edit Meal Booking' : 'Add Meal Booking'} size="xl" footer={<><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Close</button>{!viewing && <button type="button" className="btn-primary" onClick={save}>Save</button>}</>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Booking Reference" required><TextInput disabled={!!viewing} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></FormField>
          <FormField label="Event Date" required><TextInput disabled={!!viewing} type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></FormField>
          <FormField label="Customer" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.customerId} onChange={(value) => setForm({ ...form, customerId: value })} options={customers.filter((item) => item.status === 'Active').map((item) => ({ label: `${item.name} (${item.mobile})`, value: item.id }))} placeholder="Select customer" /></div></FormField>
          {customer && <div className="rounded-lg bg-cream-50 p-3 text-sm text-brown-600"><p className="font-medium text-brown-800">{customer.name}</p><p>{customer.mobile}</p><p>{customer.email}</p></div>}
          <FormField label="Meal Category" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value, packageId: '' })} options={activeCategories.map((item) => ({ label: item.name, value: item.id }))} placeholder="Select category" /></div></FormField>
          <FormField label="Meal Type" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.mealType} onChange={(value) => setForm({ ...form, mealType: value as MealType, packageId: '' })} options={mealTypeOptions} /></div></FormField>
          <FormField label="Meal Package" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.packageId} onChange={(value) => setForm(calculate({ packageId: value }))} options={(viewing ? packages.filter((item) => item.id === form.packageId) : matchingPackages).map((item) => ({ label: `${item.name} (S$${item.pricePerPax.toFixed(2)}/pax)`, value: item.id }))} placeholder="Select package" /></div></FormField>
          <FormField label="Adult Pax" required><TextInput disabled={!!viewing} type="number" min="0" value={String(form.adultPax)} onChange={(e) => setForm(calculate({ adultPax: Number(e.target.value) }))} /></FormField>
          <FormField label="Child Pax" required><TextInput disabled={!!viewing} type="number" min="0" value={String(form.childPax)} onChange={(e) => setForm(calculate({ childPax: Number(e.target.value) }))} /></FormField>
          <div className="sm:col-span-2 rounded-lg bg-cream-50 p-4 text-sm text-brown-700">
            <div className="flex justify-between"><span>Total Pax</span><strong>{form.totalPax}</strong></div>
            <div className="flex justify-between"><span>Package Amount</span><strong>S${form.packageAmount.toFixed(2)}</strong></div>
            <div className="flex justify-between"><span>GST</span><strong>S${form.gst.toFixed(2)}</strong></div>
            <div className="mt-2 flex justify-between border-t border-brown-100 pt-2 text-base text-brown-900"><span>Grand Total</span><strong>S${form.totalAmount.toFixed(2)}</strong></div>
          </div>
          <FormField label="Booking Status"><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.bookingStatus} onChange={(value) => setForm({ ...form, bookingStatus: value as BookingStatus })} options={bookingStatusOptions} /></div></FormField>
          <FormField label="Payment Status"><StatusBadge status={form.paymentStatus} /></FormField>
        </div>
      </Modal>
      <Modal open={!!paymentBooking} onClose={() => setPaymentBooking(null)} title="Add Meal Payment" size="sm" footer={<><button type="button" className="btn-outline" onClick={() => setPaymentBooking(null)}>Cancel</button><button type="button" className="btn-primary" onClick={addPayment}>Save Payment</button></>}>
        <FormField label="Outstanding Balance"><p className="text-sm text-brown-700">S${((paymentBooking?.totalAmount ?? 0) - (paymentBooking?.amountPaid ?? 0)).toFixed(2)}</p></FormField>
        <FormField label="Payment Amount" required><TextInput type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></FormField>
      </Modal>
    </div>
  );
}

function MealAvailabilityManagementScreen() {
  const toast = useToast();
  const [data, setData] = useState<MealAvailability[]>(() => readStorage(mealAvailabilityKey, []));
  const packages = loadMealPackages();
  const categories = loadMealCategoriesForModule();
  const bookings = readStorage<MealBooking[]>(mealBookingsKey, []);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MealAvailability>({ id: '', date: '', packageId: '', capacity: 0 });

  const persist = (next: MealAvailability[]) => { setData(next); writeStorage(mealAvailabilityKey, next); };
  const getPackage = (id: string) => packages.find((item) => item.id === id);
  const bookedPax = (record: MealAvailability) => bookings.filter((item) => item.eventDate === record.date && item.packageId === record.packageId && item.bookingStatus === 'Confirmed').reduce((sum, item) => sum + item.totalPax, 0);
  const statusFor = (record: MealAvailability) => {
    const remaining = record.capacity - bookedPax(record);
    return record.status === 'Closed/Blocked' ? 'Closed/Blocked' : remaining <= 0 ? 'Fully Booked' : remaining < record.capacity ? 'Partially Available' : 'Available';
  };
  const rows = data.filter((record) => {
    const pkg = getPackage(record.packageId);
    const category = categories.find((item) => item.id === pkg?.categoryId);
    return (!dateFilter || record.date === dateFilter) && (!categoryFilter || pkg?.categoryId === categoryFilter) && (!typeFilter || category?.name === typeFilter) && (!packageFilter || record.packageId === packageFilter);
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
    { key: 'mealType', header: 'Meal Type', render: (item) => categories.find((category) => category.id === getPackage(item.packageId)?.categoryId)?.name ?? '-' },
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Meal Types</option>
            {mealTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
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
export function MealBookingManagement() { return <MealBookingManagementScreen />; }
export function MealAvailabilityManagement() { return <MealAvailabilityManagementScreen />; }
export function MealReports() { return <MealManagementPage module="reports" />; }

export function MealModuleRedirect() {
  const location = useLocation();
  const module = location.pathname.includes('meal-categories') ? 'category' : location.pathname.includes('meal-items') ? 'item' : location.pathname.includes('meal-bookings') ? 'booking' : location.pathname.includes('meal-availability') ? 'availability' : 'reports';
  return <MealManagementPage module={module} />;
}
