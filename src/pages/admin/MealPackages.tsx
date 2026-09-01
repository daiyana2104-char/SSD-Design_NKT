import { useMemo, useState } from 'react';
import { Edit, Eye, Plus, Power, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextArea, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';

interface MealPackage {
  id: string;
  code: string;
  name: string;
  pricePerPax: number;
  minimumPax: number;
  gstApplicable: boolean;
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
  categoryId?: string;
  pricingBasis?: string;
  cost?: number;
  status: 'Active' | 'Inactive';
}

const STORAGE_KEY = 'meal_packages';
const PAGE_SIZE = 8;
const mealCategoriesKey = 'meal_categories';
const mealItemsKey = 'meal_items';

const initialMealCategories: MealCategory[] = [
  { id: 'mc1', code: 'BRK', name: 'Breakfast', status: 'Active' },
  { id: 'mc2', code: 'LUN', name: 'Lunch', status: 'Active' },
  { id: 'mc3', code: 'DIN', name: 'Dinner', status: 'Active' },
  { id: 'mc4', code: 'SNK', name: 'Snacks', status: 'Active' },
];

const initialMealItems: MealFoodItem[] = [
  { id: 'meal-i1', code: 'FOOD001', name: 'Idly', categoryId: 'mc1', pricingBasis: 'Per Pax', cost: 2.5, status: 'Active' },
  { id: 'meal-i2', code: 'FOOD002', name: 'Vada', categoryId: 'mc1', pricingBasis: 'Per Pax', cost: 2.0, status: 'Active' },
  { id: 'meal-i3', code: 'FOOD003', name: 'Pongal', categoryId: 'mc1', pricingBasis: 'Per Pax', cost: 3.0, status: 'Active' },
  { id: 'meal-i4', code: 'FOOD004', name: 'Rice', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 1.5, status: 'Active' },
  { id: 'meal-i5', code: 'FOOD005', name: 'Sambar', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 2.0, status: 'Active' },
  { id: 'meal-i6', code: 'FOOD006', name: 'Rasam', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 1.8, status: 'Active' },
  { id: 'meal-i7', code: 'FOOD007', name: 'Sweet', categoryId: 'mc2', pricingBasis: 'Per Pack / Quantity', cost: 2.5, status: 'Active' },
  { id: 'meal-i8', code: 'FOOD008', name: 'Payasam', categoryId: 'mc2', pricingBasis: 'Per Pack / Quantity', cost: 3.5, status: 'Active' },
  { id: 'meal-i9', code: 'FOOD009', name: 'Briyani', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 5.0, status: 'Active' },
  { id: 'meal-i10', code: 'FOOD010', name: 'Dalcha', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 2.2, status: 'Active' },
  { id: 'meal-i11', code: 'FOOD011', name: 'Raitha', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 1.5, status: 'Active' },
  { id: 'meal-i12', code: 'FOOD012', name: 'Papadam', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 0.8, status: 'Active' },
  { id: 'meal-i13', code: 'FOOD013', name: 'Coffee', categoryId: 'mc4', pricingBasis: 'Per Unit', cost: 1.0, status: 'Active' },
  { id: 'meal-i14', code: 'FOOD014', name: 'Tea', categoryId: 'mc4', pricingBasis: 'Per Unit', cost: 0.8, status: 'Active' },
  { id: 'meal-i15', code: 'FOOD015', name: 'Lemon Rice', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 2.8, status: 'Active' },
  { id: 'meal-i16', code: 'FOOD016', name: 'Thayir Rice', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 2.5, status: 'Active' },
];

const initialPackages: MealPackage[] = [
  {
    id: 'mp1',
    code: 'MEAL001',
    name: 'Annadhanam Package',
    pricePerPax: 10,
    minimumPax: 1,
    gstApplicable: true,
    description: 'Meal package for devotees.',
    status: 'Active',
    itemIds: ['meal-i1'],
  },
  {
    id: 'mp2',
    code: 'MEAL002',
    name: 'Special Meal Set',
    pricePerPax: 15,
    minimumPax: 10,
    gstApplicable: true,
    description: 'Special meal package for events.',
    status: 'Active',
    itemIds: ['meal-i4', 'meal-i5'],
  },
];

function loadStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function loadPackages(): MealPackage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) as Partial<MealPackage>[] : [];
    const packages = parsed.length ? parsed : initialPackages;
    const legacyItemIds: Record<string, string> = { i1: 'meal-i1', i4: 'meal-i4', i5: 'meal-i5' };
    return packages.map((record) => ({
      id: record.id ?? `mp-${Math.random().toString(36).slice(2)}`,
      code: record.code ?? '',
      name: record.name ?? '',
      pricePerPax: Number(record.pricePerPax ?? 0),
      minimumPax: Number(record.minimumPax ?? 1),
      gstApplicable: record.gstApplicable ?? true,
      description: record.description ?? '',
      status: record.status ?? 'Active',
      itemIds: (record.itemIds ?? []).map((itemId) => legacyItemIds[itemId] ?? itemId),
    }));
  } catch {
    return initialPackages;
  }
}

function savePackages(value: MealPackage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore storage failures */
  }
}

function generatePackageCode(existing: MealPackage[]): string {
  const nums = existing
    .map((p) => {
      const match = p.code.match(/^MEAL(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `MEAL${String(next).padStart(3, '0')}`;
}

const blankForm = (): Omit<MealPackage, 'id' | 'code'> => ({
  name: '',
  pricePerPax: 0,
  minimumPax: 1,
  gstApplicable: true,
  description: '',
  status: 'Active',
  itemIds: [],
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
  const [form, setForm] = useState<Omit<MealPackage, 'id'>>({
    ...blankForm(),
    code: generatePackageCode(data),
  });
  const [itemSearch, setItemSearch] = useState('');

  const updateData = (next: MealPackage[]) => {
    setData(next);
    savePackages(next);
  };

  const mealCategories = loadStored<MealCategory[]>(mealCategoriesKey, initialMealCategories);
  const allMealItems = loadStored<MealFoodItem[]>(mealItemsKey, initialMealItems).map((item) => {
    const fallback = initialMealItems.find((i) => i.id === item.id);
    return {
      ...fallback,
      ...item,
      pricingBasis: item.pricingBasis ?? fallback?.pricingBasis ?? 'Per Pax',
      cost: item.cost ?? fallback?.cost ?? 0,
    };
  });
  const activeItems = allMealItems.filter((item) => item.status === 'Active');
  const selectedItems = allMealItems.filter((item) => form.itemIds.includes(item.id));

  const itemCategoryLabel = (item: MealFoodItem) =>
    mealCategories.find((c) => c.id === item.categoryId)?.name ?? '—';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((record) => {
      const matchesSearch =
        !query || [record.code, record.name].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (!statusFilter || record.status === statusFilter);
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({ ...blankForm(), code: generatePackageCode(data) });
    setItemSearch('');
    setModalOpen(true);
  };

  const openEdit = (record: MealPackage) => {
    setEditing(record);
    setViewing(null);
    setForm({ ...record });
    setItemSearch('');
    setModalOpen(true);
  };

  const openView = (record: MealPackage) => {
    setViewing(record);
    setEditing(null);
    setForm({ ...record });
    setItemSearch('');
    setModalOpen(true);
  };

  const handleSave = () => {
    const code = editing?.code ?? form.code;
    const name = form.name.trim();
    const price = Number(form.pricePerPax);
    const minimumPax = Number(form.minimumPax);

    if (!name) return toast.error('Validation Error', 'Package name is required.');
    if (data.some((record) => record.name.toLowerCase() === name.toLowerCase() && record.id !== editing?.id)) {
      return toast.error('Validation Error', 'Package name must be unique.');
    }
    if (!Number.isFinite(price) || price < 0) {
      return toast.error('Validation Error', 'Price per pax must be a valid non-negative amount.');
    }
    if (!Number.isInteger(minimumPax) || minimumPax <= 0) {
      return toast.error('Validation Error', 'Minimum booking count must be a positive whole number.');
    }
    if (form.itemIds.length === 0) {
      return toast.error('Validation Error', 'Select at least one active menu item.');
    }
    if (form.itemIds.some((id) => !activeItems.some((item) => item.id === id))) {
      return toast.error('Validation Error', 'All included menu items must be active.');
    }

    const record: MealPackage = {
      ...form,
      id: editing?.id ?? `mp-${Math.random().toString(36).slice(2)}`,
      code,
      name,
      pricePerPax: price,
      minimumPax,
      gstApplicable: form.gstApplicable,
      description: form.description ?? '',
      status: form.status,
      itemIds: [...form.itemIds],
    };

    updateData(editing ? data.map((item) => (item.id === editing.id ? record : item)) : [...data, record]);
    toast.success(editing ? 'Meal package updated' : 'Meal package created');
    setModalOpen(false);
  };

  const toggleStatus = (record: MealPackage) => {
    updateData(
      data.map((item) =>
        item.id === record.id
          ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' }
          : item,
      ),
    );
    toast.success(record.status === 'Active' ? 'Meal package deactivated' : 'Meal package activated');
  };

  const availableItems = activeItems.filter(
    (item) =>
      !form.itemIds.includes(item.id) &&
      `${item.code} ${item.name}`.toLowerCase().includes(itemSearch.toLowerCase()),
  );

  const columns: Column<MealPackage>[] = [
    { key: 'code', header: 'Package Code' },
    {
      key: 'name',
      header: 'Package Name',
      render: (record) => <span className="font-medium text-brown-800">{record.name}</span>,
    },
    {
      key: 'price',
      header: 'Price / Pax',
      align: 'right',
      render: (record) => `S$${record.pricePerPax.toFixed(2)}`,
    },
    {
      key: 'minimumPax',
      header: 'Min. Booking Count',
      align: 'right',
      render: (record) => record.minimumPax,
    },
    {
      key: 'gst',
      header: 'GST Applicable',
      render: (record) => (record.gstApplicable ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (record) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openView(record)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(record)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleStatus(record)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title={record.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Meal Package Master"
        description="Create and manage meal packages"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Package
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
          searchPlaceholder="Search package code or name..."
          filters={[
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ],
              onChange: (value) => {
                setStatusFilter(value);
                setPage(1);
              },
            },
          ]}
        />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={viewing ? 'View Meal Package' : editing ? 'Edit Meal Package' : 'Add Meal Package'}
        size="xl"
        footer={
          viewing ? (
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSave}>
                Save
              </button>
            </>
          )
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Package Code" required hint="Auto-generated">
              <TextInput readOnly value={form.code} className="bg-cream-50" />
            </FormField>
            <FormField label="Package Name" required>
              <TextInput
                disabled={!!viewing}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </FormField>
            <FormField label="Price Per Pax" required hint="Food package selling price per pax">
              <TextInput
                disabled={!!viewing}
                type="number"
                min="0"
                step="0.01"
                value={String(form.pricePerPax)}
                onChange={(event) => setForm({ ...form, pricePerPax: Number(event.target.value) })}
              />
            </FormField>
            <FormField label="Minimum Booking Count" required>
              <TextInput
                disabled={!!viewing}
                type="number"
                min="1"
                step="1"
                value={String(form.minimumPax)}
                onChange={(event) => setForm({ ...form, minimumPax: Number(event.target.value) })}
              />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <TextArea
                disabled={!!viewing}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </FormField>
            <FormField label="GST Applicable">
              <div className={viewing ? 'pointer-events-none opacity-60' : undefined}>
                <Toggle
                  checked={form.gstApplicable}
                  onChange={(value) => setForm({ ...form, gstApplicable: value })}
                  trueLabel="Yes"
                  falseLabel="No"
                />
              </div>
            </FormField>
            <FormField label="Status" className={viewing ? 'pointer-events-none opacity-60' : undefined}>
              <Toggle
                checked={form.status === 'Active'}
                onChange={(value) => setForm({ ...form, status: value ? 'Active' : 'Inactive' })}
                trueLabel="Active"
                falseLabel="Inactive"
              />
            </FormField>

            <FormField label="Included Menu Items" required className="sm:col-span-2">
              {!viewing && (
                <TextInput
                  value={itemSearch}
                  onChange={(event) => setItemSearch(event.target.value)}
                  placeholder="Search active menu items..."
                />
              )}

              {!viewing && availableItems.length > 0 && (
                <div className="mt-2 rounded border border-brown-100 p-2">
                  <p className="mb-2 text-xs font-semibold text-brown-500">Available Menu Items</p>
                  <div className="flex flex-wrap gap-2">
                    {availableItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setForm({ ...form, itemIds: [...form.itemIds, item.id] })}
                        className="rounded border border-brown-200 px-2 py-1 text-sm text-brown-700 hover:bg-cream-100"
                      >
                        {item.name} ({item.code})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.length === 0 ? (
                <p className="mt-2 text-sm text-brown-400">No menu items selected.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded border border-brown-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-cream-50 text-xs font-semibold uppercase text-brown-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Menu Item</th>
                        <th className="px-3 py-2 text-left">Item Category</th>
                        <th className="px-3 py-2 text-left">Pricing Basis</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                        <th className="px-3 py-2 text-center">Included in Package</th>
                        {!viewing && <th className="px-3 py-2 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item) => (
                        <tr key={item.id} className="border-t border-brown-50">
                          <td className="px-3 py-2 text-brown-800">{item.name}</td>
                          <td className="px-3 py-2 text-brown-600">{itemCategoryLabel(item)}</td>
                          <td className="px-3 py-2 text-brown-600">{item.pricingBasis ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-brown-800">
                            S${(item.cost ?? 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center text-green-700">Yes</td>
                          {!viewing && (
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    itemIds: form.itemIds.filter((id) => id !== item.id),
                                  })
                                }
                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MealPackageManagement;
