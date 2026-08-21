import { useMemo, useState } from 'react';
import { Edit, Eye, Plus, Power } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextArea, TextInput, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { gstRecords } from '@/lib/mockData';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Other';

interface MealPackage {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  mealType: MealType;
  pricePerPax: number;
  minimumPax: number;
  maximumPax?: number;
  gstApplicable: boolean;
  gstRate?: number;
  gstRecordId?: string;
  description: string;
  status: 'Active' | 'Inactive';
  itemIds: string[];
}

interface MealCategory {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
}

interface MealFoodItem {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
}

const STORAGE_KEY = 'meal_packages';
const PAGE_SIZE = 8;
const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'].map((value) => ({ label: value, value }));
const mealCategoriesKey = 'meal_categories';
const mealItemsKey = 'meal_items';
const initialMealCategories: MealCategory[] = [
  { id: 'mc1', code: 'BRK', name: 'Breakfast', status: 'Active' },
  { id: 'mc2', code: 'LUN', name: 'Lunch', status: 'Active' },
  { id: 'mc3', code: 'DIN', name: 'Dinner', status: 'Active' },
  { id: 'mc4', code: 'SNK', name: 'Snacks', status: 'Active' },
];
const initialMealItems: MealFoodItem[] = [
  { id: 'meal-i1', code: 'FOOD001', name: 'Idly', status: 'Active' },
  { id: 'meal-i2', code: 'FOOD002', name: 'Vada', status: 'Active' },
  { id: 'meal-i3', code: 'FOOD003', name: 'Pongal', status: 'Active' },
  { id: 'meal-i4', code: 'FOOD004', name: 'Rice', status: 'Active' },
  { id: 'meal-i5', code: 'FOOD005', name: 'Sambar', status: 'Active' },
  { id: 'meal-i6', code: 'FOOD006', name: 'Rasam', status: 'Active' },
  { id: 'meal-i7', code: 'FOOD007', name: 'Sweet', status: 'Active' },
  { id: 'meal-i8', code: 'FOOD008', name: 'Payasam', status: 'Active' },
  { id: 'meal-i9', code: 'FOOD009', name: 'Briyani', status: 'Active' },
  { id: 'meal-i10', code: 'FOOD010', name: 'Dalcha', status: 'Active' },
  { id: 'meal-i11', code: 'FOOD011', name: 'Raitha', status: 'Active' },
  { id: 'meal-i12', code: 'FOOD012', name: 'Papadam', status: 'Active' },
  { id: 'meal-i13', code: 'FOOD013', name: 'Coffee', status: 'Active' },
  { id: 'meal-i14', code: 'FOOD014', name: 'Tea', status: 'Active' },
  { id: 'meal-i15', code: 'FOOD015', name: 'Lemon Rice', status: 'Active' },
  { id: 'meal-i16', code: 'FOOD016', name: 'Thayir Rice', status: 'Active' },
];
const initialPackages: MealPackage[] = [
  { id: 'mp1', code: 'MEAL001', name: 'Annadhanam Package', categoryId: 'mc2', mealType: 'Lunch', pricePerPax: 10, minimumPax: 1, gstApplicable: false, description: 'Meal package for devotees.', status: 'Active', itemIds: ['meal-i1'] },
  { id: 'mp2', code: 'MEAL002', name: 'Special Meal Set', categoryId: 'mc3', mealType: 'Dinner', pricePerPax: 15, minimumPax: 10, maximumPax: 500, gstApplicable: true, gstRate: 9, gstRecordId: 'g1', description: 'Special meal package for events.', status: 'Active', itemIds: ['meal-i4', 'meal-i5'] },
];

function loadPackages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const packages = saved ? JSON.parse(saved) as Partial<MealPackage>[] : initialPackages;
    const legacyItemIds: Record<string, string> = { i1: 'meal-i1', i4: 'meal-i4', i5: 'meal-i5' };
    const categoryIds: Record<string, string> = { Breakfast: 'mc1', Lunch: 'mc2', Dinner: 'mc3', Snacks: 'mc4' };
    return packages.map((record) => ({
      ...record,
      categoryId: record.categoryId ?? categoryIds[record.mealType ?? ''] ?? '',
      itemIds: (record.itemIds ?? []).map((itemId) => legacyItemIds[itemId] ?? itemId),
    })) as MealPackage[];
  } catch {
    return initialPackages;
  }
}

function loadStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function savePackages(value: MealPackage[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* ignore storage failures */ }
}

const blankForm = (): Omit<MealPackage, 'id'> => ({
  code: '', name: '', categoryId: '', mealType: 'Breakfast', pricePerPax: 0, minimumPax: 0,
  maximumPax: undefined, gstApplicable: false, gstRate: undefined, gstRecordId: undefined,
  description: '', status: 'Active', itemIds: [],
});

export function MealPackageManagement() {
  const toast = useToast();
  const [data, setData] = useState<MealPackage[]>(loadPackages);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealPackage | null>(null);
  const [viewing, setViewing] = useState<MealPackage | null>(null);
  const [form, setForm] = useState<Omit<MealPackage, 'id'>>(blankForm());
  const [itemSearch, setItemSearch] = useState('');

  const updateData = (next: MealPackage[]) => { setData(next); savePackages(next); };
  const activeGstRecords = gstRecords.filter((record) => record.status === 'Active');
  const mealCategories = loadStored<MealCategory[]>(mealCategoriesKey, initialMealCategories);
  const allMealItems = loadStored<MealFoodItem[]>(mealItemsKey, initialMealItems);
  const activeCategories = mealCategories.filter((category) => category.status === 'Active');
  const selectedItems = allMealItems.filter((item) => form.itemIds.includes(item.id));
  const activeItems = allMealItems.filter((item) => item.status === 'Active');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((record) => {
      const matchesSearch = !query || [record.code, record.name, record.mealType].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (!statusFilter || record.status === statusFilter);
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const openCreate = () => { setEditing(null); setViewing(null); setForm(blankForm()); setItemSearch(''); setModalOpen(true); };
  const openEdit = (record: MealPackage) => { setEditing(record); setViewing(null); setForm({ ...record }); setItemSearch(''); setModalOpen(true); };
  const openView = (record: MealPackage) => { setViewing(record); setEditing(null); setForm({ ...record }); setItemSearch(''); setModalOpen(true); };

  const handleSave = () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const price = Number(form.pricePerPax);
    const minimumPax = Number(form.minimumPax);
    const maximumPax = form.maximumPax === undefined || form.maximumPax === null || String(form.maximumPax) === '' ? undefined : Number(form.maximumPax);
    if (!code) return toast.error('Validation Error', 'Package code is required.');
    if (!name) return toast.error('Validation Error', 'Package name is required.');
    if (!form.categoryId || !mealCategories.some((category) => category.id === form.categoryId && category.status === 'Active')) return toast.error('Validation Error', 'Select an active meal category.');
    if (!form.mealType) return toast.error('Validation Error', 'Meal type is required.');
    if (!Number.isFinite(price) || price <= 0) return toast.error('Validation Error', 'Price per pax must be greater than 0.');
    if (!Number.isFinite(minimumPax) || minimumPax < 0) return toast.error('Validation Error', 'Minimum pax cannot be negative.');
    if (maximumPax !== undefined && (!Number.isFinite(maximumPax) || maximumPax < 0 || maximumPax < minimumPax)) return toast.error('Validation Error', 'Maximum pax must be greater than or equal to minimum pax.');
    if (data.some((record) => record.code.toLowerCase() === code.toLowerCase() && record.id !== editing?.id)) return toast.error('Validation Error', 'Package code must be unique.');
    if (form.gstApplicable && !form.gstRecordId) return toast.error('Validation Error', 'Select an applicable GST rate.');
    if (form.itemIds.length === 0) return toast.error('Validation Error', 'Select at least one active food item.');

    const gst = activeGstRecords.find((record) => record.id === form.gstRecordId);
    const record: MealPackage = { ...form, id: editing?.id ?? `mp-${Math.random().toString(36).slice(2)}`, code, name, pricePerPax: price, minimumPax, maximumPax, gstRate: form.gstApplicable ? gst?.percentage : undefined, gstRecordId: form.gstApplicable ? form.gstRecordId : undefined };
    updateData(editing ? data.map((item) => item.id === editing.id ? record : item) : [...data, record]);
    toast.success(editing ? 'Meal package updated' : 'Meal package created');
    setModalOpen(false);
  };

  const toggleStatus = (record: MealPackage) => {
    updateData(data.map((item) => item.id === record.id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item));
    toast.success(record.status === 'Active' ? 'Meal package deactivated' : 'Meal package activated');
  };

  const availableItems = activeItems.filter((item) => !form.itemIds.includes(item.id) && `${item.code} ${item.name}`.toLowerCase().includes(itemSearch.toLowerCase()));
  const itemLabel = (item: MealFoodItem) => `${item.name} (${item.code})`;
  const categoryLabel = (categoryId: string) => mealCategories.find((category) => category.id === categoryId)?.name ?? 'Unknown category';
  const columns: Column<MealPackage>[] = [
    { key: 'code', header: 'Package Code' },
    { key: 'name', header: 'Package Name', render: (record) => <span className="font-medium text-brown-800">{record.name}</span> },
    { key: 'category', header: 'Meal Category', render: (record) => categoryLabel(record.categoryId) },
    { key: 'mealType', header: 'Meal Type' },
    { key: 'price', header: 'Price / Pax', align: 'right', render: (record) => `S$${record.pricePerPax.toFixed(2)}` },
    { key: 'minimumPax', header: 'Minimum Pax', align: 'right' },
    { key: 'gst', header: 'GST', render: (record) => record.gstApplicable ? `${record.gstRate ?? 0}%` : 'No' },
    { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (record) => <div className="flex justify-center gap-1"><button type="button" onClick={() => openView(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEdit(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => toggleStatus(record)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title={record.status === 'Active' ? 'Deactivate' : 'Activate'}><Power className="h-4 w-4" /></button></div> },
  ];

  return <div>
    <PageHeader title="Meal Package Master" description="Create and manage meal packages" actions={<button type="button" className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Package</button>} />
    <div className="card p-4"><SearchFilterBar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Search package code, name or meal type..." filters={[{ label: 'Status', value: statusFilter, options: [{ label: 'All Statuses', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }], onChange: (value) => { setStatusFilter(value); setPage(1); } }]} /></div>
    <div className="card mt-4"><DataTable columns={columns} data={paged} /><Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} /></div>

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={viewing ? 'View Meal Package' : editing ? 'Edit Meal Package' : 'Add Meal Package'} size="xl" footer={viewing ? <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Close</button> : <><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="btn-primary" onClick={handleSave}>Save</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Package Code" required><TextInput disabled={!!viewing} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></FormField>
        <FormField label="Package Name" required><TextInput disabled={!!viewing} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        <FormField label="Meal Category" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} options={activeCategories.concat(viewing && form.categoryId && !activeCategories.some((category) => category.id === form.categoryId) ? mealCategories.filter((category) => category.id === form.categoryId) : []).map((category) => ({ label: `${category.name} (${category.code})`, value: category.id }))} placeholder="Select meal category" /></div></FormField>
        <FormField label="Meal Type" required><div className={viewing ? 'pointer-events-none opacity-60' : undefined}><Dropdown value={form.mealType} onChange={(value) => setForm({ ...form, mealType: value as MealType })} options={mealTypeOptions} /></div></FormField>
        <FormField label="Price Per Pax" required><TextInput disabled={!!viewing} type="number" min="0" value={String(form.pricePerPax)} onChange={(event) => setForm({ ...form, pricePerPax: Number(event.target.value) })} /></FormField>
        <FormField label="Minimum Pax"><TextInput disabled={!!viewing} type="number" min="0" value={String(form.minimumPax)} onChange={(event) => setForm({ ...form, minimumPax: Number(event.target.value) })} /></FormField>
        <FormField label="Maximum Pax"><TextInput disabled={!!viewing} type="number" min="0" value={form.maximumPax === undefined ? '' : String(form.maximumPax)} onChange={(event) => setForm({ ...form, maximumPax: event.target.value === '' ? undefined : Number(event.target.value) })} /></FormField>
        <FormField label="GST Applicable" className={viewing ? 'pointer-events-none opacity-60' : undefined}><Toggle checked={form.gstApplicable} onChange={(value) => setForm({ ...form, gstApplicable: value })} trueLabel="Yes" falseLabel="No" /></FormField>
        <FormField label="GST Rate" className={!form.gstApplicable || !!viewing ? 'pointer-events-none opacity-50' : undefined}><Dropdown value={form.gstRecordId ?? ''} onChange={(value) => setForm({ ...form, gstRecordId: value })} options={activeGstRecords.map((record) => ({ label: `${record.gstCode} (${record.percentage}%)`, value: record.id }))} placeholder="Select GST rate" /></FormField>
        <FormField label="Status" className={viewing ? 'pointer-events-none opacity-60' : undefined}><Toggle checked={form.status === 'Active'} onChange={(value) => setForm({ ...form, status: value ? 'Active' : 'Inactive' })} trueLabel="Active" falseLabel="Inactive" /></FormField>
        <FormField label="Description" className="sm:col-span-2"><TextArea disabled={!!viewing} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
        <FormField label="Included Item Master Items" className="sm:col-span-2">
          {!viewing && <TextInput value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search active meal items..." />}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-brown-100 p-2"><p className="mb-2 text-xs font-semibold text-brown-500">Available Food Items</p>{availableItems.map((item) => <button type="button" key={item.id} disabled={!!viewing} onClick={() => setForm({ ...form, itemIds: [...form.itemIds, item.id] })} className="mb-1 block w-full rounded px-2 py-1 text-left text-sm text-brown-700 hover:bg-cream-100 disabled:cursor-default disabled:hover:bg-transparent">{itemLabel(item)}</button>)}</div>
            <div className="rounded border border-brown-100 p-2"><p className="mb-2 text-xs font-semibold text-brown-500">Selected Food Items</p>{selectedItems.map((item) => <div key={item.id} className="mb-1 flex items-center justify-between rounded bg-cream-50 px-2 py-1 text-sm text-brown-700"><span>{itemLabel(item)}{item.status !== 'Active' && <span className="ml-1 text-xs text-brown-400">(Inactive)</span>}</span>{!viewing && <button type="button" onClick={() => setForm({ ...form, itemIds: form.itemIds.filter((id) => id !== item.id) })} className="text-maroon-600">Remove</button>}</div>)}</div>
          </div>
        </FormField>
      </div>
    </Modal>
  </div>;
}

export default MealPackageManagement;
