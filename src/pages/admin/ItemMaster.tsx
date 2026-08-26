import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, MultiSelect, Toggle, RadioGroup } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { items as initial, categories, subCategories, deities, printingGroups, glRecords, unitRecords, type Item } from '@/lib/mockData';
import { formatSGD } from '@/lib/utils';

const PAGE_SIZE = 5;
const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];
const yesNoOptions = [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }];

interface CatRow { category: string; subCategory: string; salePrice: number; displayOrder: number; mapping: string; }

export function ItemMaster() {
  const toast = useToast();
  const [data, setData] = useState<Item[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [form, setForm] = useState<Partial<Item>>({});
  const [status, setStatus] = useState('Active');
  const [catRows, setCatRows] = useState<CatRow[]>([]);

  const filtered = useMemo(() => data.filter((i) =>
    (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || i.status === statusFilter)
  ), [data, search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ inventoryApplicable: true, posAvailability: true, portalAvailability: true, deities: [], deityMappingRequired: false, familyMembersRequired: false, minQty: 1, maxQty: 0, glCode: '' });
    setStatus('Active'); setCatRows([]); setModalOpen(true);
  };
  const openEdit = (i: Item) => {
    setEditing(i); setForm(i); setStatus(i.status);
    setCatRows((i.categories ?? []).map((c: { category: string; subCategory?: string; salePrice?: number; displayOrder: number; mapping: string }) => ({ category: c.category, subCategory: c.subCategory ?? '', salePrice: c.salePrice ?? 0, displayOrder: c.displayOrder, mapping: c.mapping })));
    setModalOpen(true);
  };

  const uomOptions = unitRecords
  .filter(
    (unit) =>
      unit.status === 'Active',
  )
  .sort(
    (a, b) =>
      a.displayOrder -
      b.displayOrder,
  )
  .map((unit) => ({
    label: `${unit.name} (${unit.symbol})`,
    value: unit.symbol,
  }));

  const handleSave = () => {
    const saved = { ...form, status, categories: catRows };
    if (editing) {
      setData((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...saved } : i)));
      toast.success('Item updated');
    } else {
      setData((prev) => [{ id: 'i' + Math.random().toString(36).slice(2), stock: 0, ...saved } as Item, ...prev]);
      toast.success('Item created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteTarget) { setData((prev) => prev.filter((i) => i.id !== deleteTarget.id)); toast.success('Item deleted'); setDeleteTarget(null); } };

  const addCatRow = () => setCatRows((prev) => [...prev, { category: '', subCategory: '', salePrice: 0, displayOrder: prev.length + 1, mapping: '' }]);
  const removeCatRow = (i: number) => setCatRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateCatRow = (i: number, field: keyof CatRow, val: string | number) => setCatRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const columns: Column<Item>[] = [
    { key: 'code', header: 'Code', render: (i) => <span className="font-medium text-maroon-700">{i.code}</span> },
    { key: 'name', header: 'Item Name' },
    { key: 'tamilName', header: 'Tamil Name' },
    { key: 'salePrice', header: 'Sale Price', align: 'right', render: (i) => formatSGD(i.salePrice) },
    { key: 'glCode', header: 'GL Account', render: (i) => { const gl = glRecords.find((g) => g.glCode === i.glCode); return gl ? `${gl.glCode} - ${gl.glName}` : '—'; } },
    { key: 'stock', header: 'Stock', align: 'center', render: (i) => i.inventoryApplicable ? (i.stock && i.stock < i.threshold ? <StatusBadge status="Low Stock" variant="warning" /> : <span>{i.stock} {i.uom}</span>) : '-' },
    { key: 'posAvailability', header: 'POS', align: 'center', render: (i) => i.posAvailability ? <StatusBadge status="Yes" variant="success" /> : <StatusBadge status="No" variant="neutral" /> },
    { key: 'portalAvailability', header: 'Portal', align: 'center', render: (i) => i.portalAvailability ? <StatusBadge status="Yes" variant="success" /> : <StatusBadge status="No" variant="neutral" /> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (i) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(i)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(i)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Item Master" description="Manage temple items and offerings"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Item</button>} />

      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'} size="xl"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Item Code" required><TextInput value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Item Name" required><TextInput value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Tamil Name"><TextInput value={form.tamilName ?? ''} onChange={(e) => setForm({ ...form, tamilName: e.target.value })} /></FormField>
          <FormField label="General Ledger (GL)" required hint="GST is derived from the selected GL account"><Dropdown value={form.glCode ?? ''} onChange={(v) => setForm({ ...form, glCode: v })} options={glRecords.filter((g) => g.status === 'Active').map((g) => ({ label: `${g.glCode} - ${g.glName}`, value: g.glCode }))} placeholder="Select GL Account" /></FormField>
          <FormField label="Sale Price" required>
  <TextInput
    type="number"
    step="0.01"
    value={form.salePrice ?? ''}
    onChange={(e) =>
      setForm({
        ...form,
        salePrice: Number(e.target.value),
      })
    }
    placeholder="Enter sale price"
  />
</FormField>
          <FormField label="Description" className="sm:col-span-2 lg:col-span-3"><TextArea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>

          <FormField label="Deity Mapping Required" required>
            <RadioGroup value={form.deityMappingRequired ? 'Yes' : 'No'} onChange={(v) => setForm({ ...form, deityMappingRequired: v === 'Yes', deities: v === 'No' ? [] : form.deities })} options={yesNoOptions} />
          </FormField>

          {form.deityMappingRequired ? (
            <FormField label="Deity Mapping" required className="sm:col-span-2">
              <MultiSelect values={form.deities ?? []} onChange={(v) => setForm({ ...form, deities: v })} options={deities.map((d) => ({ label: `${d.name} (${d.tamilName})`, value: d.name }))} placeholder="Select deities" />
            </FormField>
          ) : (
            <FormField label="Printing Group" required>
              <Dropdown value={form.printingGroup ?? ''} onChange={(v) => setForm({ ...form, printingGroup: v })} options={printingGroups.map((p) => ({ label: p.name, value: p.name }))} placeholder="Select Printing Group" />
            </FormField>
          )}

          {/* Category Details - child table */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Category Details</label>
              <button type="button" onClick={addCatRow} className="btn-outline px-3 py-1 text-xs"><Plus className="h-3 w-3" /> Add Row</button>
            </div>
            {catRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-brown-200 p-4 text-center text-sm text-brown-400">No category rows added. Click "Add Row" to add categories.</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 px-3 text-xs font-medium text-brown-500 sm:grid-cols-5">
                  <span>Category</span>
                  <span>Sub Category</span>
                  <span>Display Order</span>
                  <span></span>
                </div>
                {catRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-brown-100 p-3 sm:grid-cols-4">
                    <Dropdown value={row.category} onChange={(v) => updateCatRow(i, 'category', v)} options={categories.map((c) => ({ label: c.name, value: c.name }))} placeholder="Category" />
                    <Dropdown value={row.subCategory} onChange={(v) => updateCatRow(i, 'subCategory', v)} options={subCategories.filter((sc) => sc.category === row.category).map((sc) => ({ label: sc.name, value: sc.name }))} placeholder="Sub Category" />
                    <TextInput type="number" value={row.displayOrder} onChange={(e) => updateCatRow(i, 'displayOrder', Number(e.target.value))} placeholder="Display Order" />
                    <button type="button" onClick={() => removeCatRow(i)} className="flex items-center justify-center rounded p-2 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FormField label="Inventory Applicable"><RadioGroup value={form.inventoryApplicable ? 'Yes' : 'No'} onChange={(v) => setForm({ ...form, inventoryApplicable: v === 'Yes' })} options={yesNoOptions} /></FormField>

          {form.inventoryApplicable && (
            <>
              <FormField label="Unit of Measure"><Dropdown value={form.uom ?? ''} onChange={(v) => setForm({ ...form, uom: v })} options={uomOptions} /></FormField>
              <FormField label="Threshold" required hint="Note: 0 - unlimited"><TextInput type="number" value={form.threshold ?? 0} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} /></FormField>
              <FormField label="Min Quantity" required><TextInput type="number" value={form.minQty ?? 1} onChange={(e) => setForm({ ...form, minQty: Number(e.target.value) })} /></FormField>
              <FormField label="Max Quantity" required hint="Note: 0 - unlimited"><TextInput type="number" value={form.maxQty ?? 0} onChange={(e) => setForm({ ...form, maxQty: Number(e.target.value) })} /></FormField>
              <FormField label="Quantity Reduction" required><TextInput type="number" step="0.01" value={form.reductionFactor ?? 1} onChange={(e) => setForm({ ...form, reductionFactor: Number(e.target.value) })} /></FormField>
            </>
          )}

          <FormField label="Future Booking CutOff Date"><TextInput type="date" value={form.bookingUpTo ?? ''} onChange={(e) => setForm({ ...form, bookingUpTo: e.target.value })} /></FormField>

          <FormField label="Family Members Required"><RadioGroup value={form.familyMembersRequired ? 'Yes' : 'No'} onChange={(v) => setForm({ ...form, familyMembersRequired: v === 'Yes' })} options={yesNoOptions} /></FormField>
          {form.familyMembersRequired && <FormField label="Maximum Family Members"><TextInput type="number" value={form.maxFamilyMembers ?? 2} onChange={(e) => setForm({ ...form, maxFamilyMembers: Number(e.target.value) })} /></FormField>}

          <FormField label="POS Availability"><RadioGroup value={form.posAvailability ? 'Yes' : 'No'} onChange={(v) => setForm({ ...form, posAvailability: v === 'Yes' })} options={yesNoOptions} /></FormField>
          <FormField label="Customer Portal Availability"><RadioGroup value={form.portalAvailability ? 'Yes' : 'No'} onChange={(v) => setForm({ ...form, portalAvailability: v === 'Yes' })} options={yesNoOptions} /></FormField>
          <FormField label="Status"><div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div></FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Item" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
