import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { items, services, type Service } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';

interface InventoryAdjustment {
  id: string; date: string; type: 'Item' | 'Service'; refName: string; refCode: string;
  action: 'Stock In' | 'Stock Out'; quantity: number; availableAfter: number; remarks: string;
}

const seedAdjustments: InventoryAdjustment[] = [
  { id: 'ia1', date: '2026-07-30T10:00:00', type: 'Item', refName: 'Flower Garland', refCode: 'ITM001', action: 'Stock In', quantity: 50, availableAfter: 80, remarks: 'New stock arrival' },
  { id: 'ia2', date: '2026-07-29T14:00:00', type: 'Item', refName: 'Camphor', refCode: 'ITM002', action: 'Stock Out', quantity: 10, availableAfter: 20, remarks: 'Daily usage' },
  { id: 'ia3', date: '2026-07-28T09:00:00', type: 'Service', refName: 'Archana', refCode: 'SVC001', action: 'Stock In', quantity: 100, availableAfter: 100, remarks: 'Weekly allocation' },
];

export function InventoryAdjustment() {
  const toast = useToast();
  const [data, setData] = useState<InventoryAdjustment[]>(seedAdjustments);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryAdjustment | null>(null);
  const [form, setForm] = useState<{ type: 'Item' | 'Service'; refId: string; action: 'Stock In' | 'Stock Out'; quantity: number; remarks: string }>({
    type: 'Item', refId: '', action: 'Stock In', quantity: 0, remarks: '',
  });

  const refOptions = useMemo(() => {
    if (form.type === 'Item') return items.map((i) => ({ label: `${i.name} (${i.code})`, value: i.id }));
    return services.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }));
  }, [form.type]);

  const selectedRef = useMemo(() => {
    if (form.type === 'Item') return items.find((i) => i.id === form.refId);
    return services.find((s) => s.id === form.refId);
  }, [form.type, form.refId]);

  const currentStock = (selectedRef as any)?.stock ?? 0;
  const availableAfter = form.action === 'Stock In' ? currentStock + form.quantity : currentStock - form.quantity;

  const filtered = data.filter((d) => !search || d.refName.toLowerCase().includes(search.toLowerCase()) || d.refCode.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.refId) { toast.error('Please select an item or service.'); return; }
    if (form.quantity <= 0) { toast.error('Quantity must be greater than zero.'); return; }
    if (form.action === 'Stock Out' && form.quantity > currentStock) { toast.error('Insufficient stock available.'); return; }
    const ref = form.type === 'Item' ? items.find((i) => i.id === form.refId) : services.find((s) => s.id === form.refId);
    const newEntry: InventoryAdjustment = {
      id: 'ia' + Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      type: form.type,
      refName: ref?.name ?? '',
      refCode: ref?.code ?? '',
      action: form.action,
      quantity: form.quantity,
      availableAfter,
      remarks: form.remarks,
    };
    setData((prev) => [newEntry, ...prev]);
    toast.success('Inventory adjusted', `${form.action}: ${form.quantity} units of ${ref?.name}. Current stock: ${availableAfter}.`);
    setModalOpen(false);
    setForm({ type: 'Item', refId: '', action: 'Stock In', quantity: 0, remarks: '' });
  };

  const handleDelete = () => {
    if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Adjustment deleted'); setDeleteTarget(null); }
  };

  const columns: Column<InventoryAdjustment>[] = [
    { key: 'date', header: 'Date & Time', render: (d) => formatDateTime(d.date) },
    { key: 'type', header: 'Type', render: (d) => <StatusBadge status={d.type} variant="neutral" /> },
    { key: 'refName', header: 'Name', render: (d) => <span className="font-medium text-brown-800">{d.refName}</span> },
    { key: 'refCode', header: 'Code' },
    { key: 'action', header: 'Inventory Type', render: (d) => <StatusBadge status={d.action} variant={d.action === 'Stock In' ? 'success' : 'warning'} /> },
    { key: 'quantity', header: 'Quantity', align: 'center' },
    { key: 'availableAfter', header: 'Available Quantity', align: 'center', render: (d) => <span className="font-medium">{d.availableAfter}</span> },
    { key: 'remarks', header: 'Remarks' },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Inventory Adjustment" description="Adjust stock for items and services"
        actions={<button className="btn-primary" onClick={() => { setForm({ type: 'Item', refId: '', action: 'Stock In', quantity: 0, remarks: '' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Adjustment</button>} />

      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search by name or code..." /></div>

      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Inventory Adjustment" size="md"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Select Type" required>
            <Dropdown value={form.type} onChange={(v) => setForm({ ...form, type: v as 'Item' | 'Service', refId: '' })} options={[{ label: 'Item', value: 'Item' }, { label: 'Service', value: 'Service' }]} />
          </FormField>
          <FormField label={`Select ${form.type}`} required>
            <Dropdown value={form.refId} onChange={(v) => setForm({ ...form, refId: v })} options={refOptions} placeholder={`Select a ${form.type.toLowerCase()}...`} />
          </FormField>
          {selectedRef && (
            <div className="rounded-lg bg-cream-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-brown-400">Current Stock:</span><span className="font-medium">{currentStock}</span></div>
            </div>
          )}
          <FormField label="Inventory Type" required>
            <Dropdown value={form.action} onChange={(v) => setForm({ ...form, action: v as 'Stock In' | 'Stock Out' })} options={[{ label: 'Stock In', value: 'Stock In' }, { label: 'Stock Out', value: 'Stock Out' }]} />
          </FormField>
          <FormField label={form.action === 'Stock In' ? 'Stock In Quantity' : 'Stock Out Quantity'} required>
            <TextInput type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="Enter quantity" />
          </FormField>
          {form.quantity > 0 && selectedRef && (
            <div className="rounded-lg bg-maroon-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-maroon-600">Stock after adjustment:</span><span className="font-bold text-maroon-700">{availableAfter}</span></div>
            </div>
          )}
          <FormField label="Remarks"><TextArea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Adjustment" message="Delete this inventory adjustment record?" confirmLabel="Delete" variant="danger" />
    </div>
  );
}

// ---- Available Stock ----

interface AvailableStockRow {
  id: string;
  type: 'Item' | 'Service';
  name: string;
  code: string;
  availableQuantity: number;
}

export function AvailableStock() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const stockData = useMemo<AvailableStockRow[]>(() => {
    const itemStock: AvailableStockRow[] = items
      .filter(
        (item) =>
          item.status === 'Active' &&
          item.inventoryApplicable,
      )
      .map((item) => ({
        id: `item-${item.id}`,
        type: 'Item',
        name: item.name,
        code: item.code,
        availableQuantity: item.stock ?? 0,
      }));

    const serviceStock: AvailableStockRow[] = services
      .filter(
        (service) =>
          service.status === 'Active' &&
          service.inventoryApplicable,
      )
      .map((service) => ({
        id: `service-${service.id}`,
        type: 'Service',
        name: service.name,
        code: service.code,

        /*
         * Service stock is currently not maintained
         * in the existing mock data.
         * Until service stock is added, it defaults to 0.
         */
        availableQuantity:
          (service as Service & { stock?: number }).stock ?? 0,
      }));

    return [
      ...itemStock,
      ...serviceStock,
    ];
  }, []);

  const filtered = useMemo(
    () =>
      stockData.filter((record) => {
        const matchesSearch =
          !search ||
          record.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          record.code
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesType =
          !typeFilter ||
          record.type === typeFilter;

        return matchesSearch && matchesType;
      }),
    [
      stockData,
      search,
      typeFilter,
    ],
  );

  const columns: Column<AvailableStockRow>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (record) => (
        <StatusBadge
          status={record.type}
          variant="neutral"
        />
      ),
    },

    {
      key: 'name',
      header: 'Name',
      render: (record) => (
        <span className="font-medium text-brown-800">
          {record.name}
        </span>
      ),
    },

    {
      key: 'code',
      header: 'Code',
      render: (record) => (
        <span className="font-medium text-maroon-700">
          {record.code}
        </span>
      ),
    },

    {
      key: 'availableQuantity',
      header: 'Available Quantity',
      align: 'center',
      render: (record) => (
        <span className="font-semibold text-brown-900">
          {record.availableQuantity}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Available Stock"
        description="View current available stock for inventory applicable items and services"
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name or code..."
          filters={[
            {
              label: 'Type',
              value: typeFilter,
              options: [
                {
                  label: 'All Types',
                  value: '',
                },
                {
                  label: 'Item',
                  value: 'Item',
                },
                {
                  label: 'Service',
                  value: 'Service',
                },
              ],
              onChange: setTypeFilter,
            },
          ]}
        />
      </div>

      <div className="card mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No inventory applicable items or services found"
        />
      </div>
    </div>
  );
}

// ---- Inventory History ----
interface HistoryRecord {
  id: string; date: string; itemName: string; itemCode: string; action: string; quantity: number; balance: number; user: string;
}

const seedHistory: HistoryRecord[] = [
  { id: 'ih1', date: '2026-07-30T10:00:00', itemName: 'Flower Garland', itemCode: 'ITM001', action: 'Stock In', quantity: 50, balance: 80, user: 'admin.siva' },
  { id: 'ih2', date: '2026-07-29T14:00:00', itemName: 'Camphor', itemCode: 'ITM002', action: 'Stock Out', quantity: 10, balance: 20, user: 'pos.counter1' },
  { id: 'ih3', date: '2026-07-28T09:00:00', itemName: 'Archana', itemCode: 'SVC001', action: 'Stock In', quantity: 100, balance: 100, user: 'admin.siva' },
  { id: 'ih4', date: '2026-07-27T11:00:00', itemName: 'Flower Garland', itemCode: 'ITM001', action: 'Stock Out', quantity: 5, balance: 30, user: 'pos.counter2' },
];



export function InventoryHistory() {
  const [search, setSearch] = useState('');
  const filtered = seedHistory.filter((h) => !search || h.itemName.toLowerCase().includes(search.toLowerCase()) || h.itemCode.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<HistoryRecord>[] = [
    { key: 'date', header: 'Date & Time', render: (h) => formatDateTime(h.date) },
    { key: 'itemName', header: 'Name', render: (h) => <span className="font-medium text-brown-800">{h.itemName}</span> },
    { key: 'itemCode', header: 'Code' },
    { key: 'action', header: 'Action', render: (h) => <StatusBadge status={h.action} variant={h.action === 'Stock In' ? 'success' : 'warning'} /> },
    { key: 'quantity', header: 'Quantity', align: 'center', render: (h) => h.quantity },
    { key: 'balance', header: 'Balance', align: 'center', render: (h) => <span className="font-medium">{h.balance}</span> },
    { key: 'user', header: 'User' },
  ];

  return (
    <div>
      <PageHeader title="Inventory History" description="View all inventory movements" />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search by name or code..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>
    </div>
  );
}

// ---- Low Stock Report ----
export function LowStockReport() {
  const [search, setSearch] = useState('');
  const lowStockItems = items.filter((i) => i.inventoryApplicable && (i.stock ?? 0) < i.threshold);
  const filtered = lowStockItems.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<typeof items[0]>[] = [
    { key: 'code', header: 'Code', render: (i) => <span className="font-medium text-maroon-700">{i.code}</span> },
    { key: 'name', header: 'Item Name' },
    { key: 'stock', header: 'Current Stock', align: 'center', render: (i) => <span className="font-medium text-red-600">{i.stock ?? 0}</span> },
    { key: 'threshold', header: 'Threshold', align: 'center' },
    { key: 'uom', header: 'UOM' },
  ];

  return (
    <div>
      <PageHeader title="Low Stock Report" description="Items below their threshold limit" />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search by name or code..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} emptyMessage="All items are above threshold" /></div>
    </div>
  );
}
