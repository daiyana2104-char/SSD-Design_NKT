import { useState } from 'react';
import { Edit, Eye, Plus, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown, RadioGroup } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { exportCSV } from '@/lib/adminStore';

// ---- Menu List ----
interface MenuItem { id: string; name: string; orderNumber: number; isPageRequired: string; status: string; }

const seedMenus: MenuItem[] = [
  { id: 'm1', name: 'Home', orderNumber: 1, isPageRequired: 'No', status: 'Active' },
  { id: 'm2', name: 'About Us', orderNumber: 2, isPageRequired: 'Yes', status: 'Active' },
  { id: 'm3', name: 'Services', orderNumber: 3, isPageRequired: 'Yes', status: 'Active' },
  { id: 'm4', name: 'Bookings', orderNumber: 4, isPageRequired: 'No', status: 'Active' },
  { id: 'm5', name: 'Donations', orderNumber: 5, isPageRequired: 'No', status: 'Active' },
  { id: 'm6', name: 'Gallery', orderNumber: 6, isPageRequired: 'Yes', status: 'Active' },
  { id: 'm7', name: 'Contact', orderNumber: 7, isPageRequired: 'Yes', status: 'Active' },
  { id: 'm8', name: 'Events', orderNumber: 8, isPageRequired: 'Yes', status: 'Inactive' },
];

export function MenuManagement() {
  const toast = useToast();
  const [data, setData] = useState<MenuItem[]>(seedMenus);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', orderNumber: 0, isPageRequired: 'Yes', status: 'Active' });

  const filtered = data.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (d: MenuItem) => { setEditItem(d); setForm({ name: d.name, orderNumber: d.orderNumber, isPageRequired: d.isPageRequired, status: d.status }); };
  const openView = (d: MenuItem) => setViewItem(d);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Menu name is required.'); return; }
    setData((prev) => prev.map((d) => d.id === editItem!.id ? { ...d, ...form } : d));
    toast.success('Menu updated', `${form.name} has been updated.`);
    setEditItem(null);
  };

  const columns: Column<MenuItem>[] = [
    { key: 'name', header: 'Menu Name', render: (d) => <span className="font-medium text-brown-800">{d.name}</span> },
    { key: 'orderNumber', header: 'Order Number', align: 'center' },
    { key: 'isPageRequired', header: 'Is Page Required', align: 'center', render: (d) => <StatusBadge status={d.isPageRequired} variant={d.isPageRequired === 'Yes' ? 'success' : 'neutral'} /> },
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
      <PageHeader title="Menu List" description="Website menus (comes from script, view or edit only)"
        actions={<button className="btn-outline" onClick={() => exportCSV('menus.csv', ['Name', 'Order', 'Page Required', 'Status'], filtered.map((d) => [d.name, d.orderNumber, d.isPageRequired, d.status]))}>Export CSV</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search menus..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="View Menu" size="sm"
        footer={<button className="btn-outline" onClick={() => setViewItem(null)}>Close</button>}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-brown-400">Menu Name</p><p className="font-medium">{viewItem.name}</p></div>
            <div><p className="text-xs text-brown-400">Order Number</p><p className="font-medium">{viewItem.orderNumber}</p></div>
            <div><p className="text-xs text-brown-400">Is Page Required</p><StatusBadge status={viewItem.isPageRequired} /></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewItem.status} /></div>
          </div>
        )}
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Menu" size="sm"
        footer={<><button className="btn-outline" onClick={() => setEditItem(null)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="space-y-4">
          <FormField label="Menu Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Order Number"><TextInput type="number" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: Number(e.target.value) })} /></FormField>
          <FormField label="Is Page Required"><RadioGroup value={form.isPageRequired} onChange={(v) => setForm({ ...form, isPageRequired: v })} options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} /></FormField>
          <FormField label="Status"><RadioGroup value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
        </div>
      </Modal>
    </div>
  );
}

// ---- CMS Pages ----
interface CmsPage {
  id: string; template: string; menu: string; pageName: string; title: string; displayOrder: number;
  description: string; status: string; metaTitle: string; metaDescription: string; metaKeywords: string;
}

const seedCmsPages: CmsPage[] = [
  { id: 'cp1', template: 'Default', menu: 'About Us', pageName: 'about-us', title: 'About Sri Siva Durga Temple', displayOrder: 1, description: 'Learn about our temple history and mission.', status: 'Active', metaTitle: 'About Us - Sri Siva Durga Temple', metaDescription: 'History and mission of Sri Siva Durga Temple', metaKeywords: 'temple, about, history' },
  { id: 'cp2', template: 'Default', menu: 'Services', pageName: 'services', title: 'Temple Services', displayOrder: 2, description: 'Explore our temple services and sevas.', status: 'Active', metaTitle: 'Services - Sri Siva Durga Temple', metaDescription: 'Temple services and sevas', metaKeywords: 'services, seva, temple' },
];

const templates = [{ label: 'Default', value: 'Default' }, { label: 'Full Width', value: 'Full Width' }, { label: 'Sidebar', value: 'Sidebar' }];

export function CmsPages() {
  const toast = useToast();
  const [data, setData] = useState<CmsPage[]>(seedCmsPages);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CmsPage | null>(null);
  const [viewItem, setViewItem] = useState<CmsPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);
  const [form, setForm] = useState<Omit<CmsPage, 'id'>>({ template: 'Default', menu: '', pageName: '', title: '', displayOrder: 0, description: '', status: 'Active', metaTitle: '', metaDescription: '', metaKeywords: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = data.filter((d) => !search || d.pageName.toLowerCase().includes(search.toLowerCase()) || d.title.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditItem(null);
    setForm({ template: 'Default', menu: '', pageName: '', title: '', displayOrder: 0, description: '', status: 'Active', metaTitle: '', metaDescription: '', metaKeywords: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (d: CmsPage) => {
    setEditItem(d);
    setForm({ template: d.template, menu: d.menu, pageName: d.pageName, title: d.title, displayOrder: d.displayOrder, description: d.description, status: d.status, metaTitle: d.metaTitle, metaDescription: d.metaDescription, metaKeywords: d.metaKeywords });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!form.template) e.template = 'Template is required.';
    if (!form.menu) e.menu = 'Menu is required.';
    if (!form.pageName.trim()) e.pageName = 'Page Name is required.';
    else if (data.some((d) => d.pageName === form.pageName && d.id !== editItem?.id)) e.pageName = 'Page Name must be unique.';
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (form.metaTitle.length > 60) e.metaTitle = 'Maximum 60 characters.';
    if (form.metaDescription.length > 160) e.metaDescription = 'Maximum 160 characters.';
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editItem) {
      setData((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...form } : d));
      toast.success('CMS Page updated', `${form.pageName} has been updated.`);
    } else {
      setData((prev) => [{ id: 'cp' + Math.random().toString(36).slice(2), ...form }, ...prev]);
      toast.success('CMS Page created', `${form.pageName} has been created.`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Page deleted'); setDeleteTarget(null); }
  };

  const columns: Column<CmsPage>[] = [
    { key: 'pageName', header: 'Page Name', render: (d) => <span className="font-medium text-maroon-700">{d.pageName}</span> },
    { key: 'title', header: 'Title' },
    { key: 'menu', header: 'Menu' },
    { key: 'template', header: 'Template' },
    { key: 'displayOrder', header: 'Display Order', align: 'center' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewItem(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => openEdit(d)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Edit"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteTarget(d)} className="rounded p-1.5 text-red-400 hover:bg-red-50" title="Delete"><X className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  const activeMenus = seedMenus.filter((m) => m.status === 'Active' && m.isPageRequired === 'Yes').map((m) => ({ label: m.name, value: m.name }));

  return (
    <div>
      <PageHeader title="CMS Pages" description="Manage website content pages"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add CMS Page</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search by page name or title..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`View Page: ${viewItem?.pageName ?? ''}`} size="lg"
        footer={<button className="btn-outline" onClick={() => setViewItem(null)}>Close</button>}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-brown-400">Template</p><p className="font-medium">{viewItem.template}</p></div>
              <div><p className="text-xs text-brown-400">Menu</p><p className="font-medium">{viewItem.menu}</p></div>
              <div><p className="text-xs text-brown-400">Page Name</p><p className="font-medium">{viewItem.pageName}</p></div>
              <div><p className="text-xs text-brown-400">Title</p><p className="font-medium">{viewItem.title}</p></div>
              <div><p className="text-xs text-brown-400">Display Order</p><p className="font-medium">{viewItem.displayOrder}</p></div>
              <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewItem.status} /></div>
            </div>
            <div><p className="text-xs text-brown-400">Description</p><div className="mt-1 rounded-lg bg-cream-50 p-3" dangerouslySetInnerHTML={{ __html: viewItem.description }} /></div>
            <div className="border-t border-brown-100 pt-2">
              <p className="mb-1 text-xs font-semibold text-brown-500">SEO Details</p>
              <div><p className="text-xs text-brown-400">Meta Title</p><p className="font-medium">{viewItem.metaTitle || '-'}</p></div>
              <div><p className="text-xs text-brown-400">Meta Description</p><p className="font-medium">{viewItem.metaDescription || '-'}</p></div>
              <div><p className="text-xs text-brown-400">Meta Keywords</p><p className="font-medium">{viewItem.metaKeywords || '-'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit CMS Page' : 'Add CMS Page'} size="xl"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Template" required error={errors.template}><Dropdown value={form.template} onChange={(v) => setForm({ ...form, template: v })} options={templates} /></FormField>
          <FormField label="Menu" required error={errors.menu}><Dropdown value={form.menu} onChange={(v) => setForm({ ...form, menu: v })} options={activeMenus} placeholder="Select menu..." /></FormField>
          <FormField label="Page Name" required error={errors.pageName} hint="Must be unique"><TextInput value={form.pageName} onChange={(e) => setForm({ ...form, pageName: e.target.value })} /></FormField>
          <FormField label="Title" required error={errors.title}><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FormField>
          <FormField label="Display Order" hint="Numeric only"><TextInput type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></FormField>
          <FormField label="Status" required><RadioGroup value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} /></FormField>
          <div className="sm:col-span-2">
            <FormField label="Description" required error={errors.description}>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[150px] font-mono text-sm" placeholder="Enter page content..." />
            </FormField>
          </div>
          <div className="border-t border-brown-100 pt-2 sm:col-span-2"><p className="mb-2 text-sm font-semibold text-brown-700">SEO Details</p></div>
          <FormField label="Meta Title" error={errors.metaTitle} hint="Max 60 characters (recommended)"><TextInput value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={60} /></FormField>
          <FormField label="Meta Keywords" hint="Comma-separated"><TextInput value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} /></FormField>
          <div className="sm:col-span-2"><FormField label="Meta Description" error={errors.metaDescription} hint="Max 160 characters (recommended)"><TextArea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={160} /></FormField></div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Page" size="sm"
        footer={<><button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn-danger" onClick={handleDelete}>Delete</button></>}>
        <p className="text-sm text-brown-600">Delete page "{deleteTarget?.pageName}"? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
