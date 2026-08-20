import { useState, useMemo } from 'react';
import { Plus, Edit, AlertTriangle } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { gstRecords as initial, type Gst } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

export function GstManagement() {
  const toast = useToast();
  const [data, setData] = useState<Gst[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gst | null>(null);
  const [activateTarget, setActivateTarget] = useState<Gst | null>(null);
  const [form, setForm] = useState({ gstType: '', percentage: '', gstCode: '', effectiveStart: '', effectiveEnd: '' });
  const [status, setStatus] = useState('Active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.gstType.trim()) e.gstType = 'GST Type is required.';
    if (!form.percentage.trim()) e.percentage = 'GST % is required.';
    else if (isNaN(Number(form.percentage)) || Number(form.percentage) < 0) e.percentage = 'Enter a valid percentage.';
    if (!form.gstCode.trim()) e.gstCode = 'GST Code is required.';
    if (!form.effectiveStart) e.effectiveStart = 'Effective Start Date is required.';
    // Only one active GST % per period
    if (status === 'Active' && form.effectiveStart) {
      const overlap = data.some((g) =>
        g.id !== editing?.id &&
        g.status === 'Active' &&
        g.gstType === form.gstType &&
        g.effectiveStart === form.effectiveStart
      );
      if (overlap) e.effectiveStart = 'An active GST record already exists for this type and start date.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const pct = Number(form.percentage);
    const hasActive = data.some((g) => g.status === 'Active' && g.id !== editing?.id);
    const newStatus = status === 'Active' && hasActive ? 'Active' : status;
    if (editing) {
      setData((prev) => prev.map((g) => {
        if (g.id === editing.id) return { ...g, ...form, percentage: pct, status: newStatus, updatedDate: formatDate(new Date()) };
        if (newStatus === 'Active' && g.status === 'Active') return { ...g, status: 'Inactive', updatedDate: formatDate(new Date()) };
        return g;
      }));
      toast.success('GST record updated');
    } else {
      const newGst: Gst = {
        id: 'g' + Math.random().toString(36).slice(2),
        ...form, percentage: pct, status: newStatus,
        createdDate: formatDate(new Date()), updatedDate: formatDate(new Date()),
      };
      setData((prev) => {
        if (newStatus === 'Active') return [newGst, ...prev.map((g) => g.status === 'Active' ? { ...g, status: 'Inactive', updatedDate: formatDate(new Date()) } : g)];
        return [newGst, ...prev];
      });
      toast.success('GST record created');
    }
    setForm({ gstType: '', percentage: '', gstCode: '', effectiveStart: '', effectiveEnd: '' });
    setStatus('Active');
    setModalOpen(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ gstType: '', percentage: '', gstCode: '', effectiveStart: '', effectiveEnd: '' });
    setStatus('Active');
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (g: Gst) => {
    setEditing(g);
    setForm({ gstType: g.gstType, percentage: String(g.percentage), gstCode: g.gstCode, effectiveStart: g.effectiveStart, effectiveEnd: g.effectiveEnd });
    setStatus(g.status);
    setErrors({});
    setModalOpen(true);
  };

  const handleActivate = () => {
    if (!activateTarget) return;
    setData((prev) => prev.map((g) => ({
      ...g,
      status: g.id === activateTarget.id ? 'Active' : 'Inactive',
      updatedDate: formatDate(new Date()),
    })));
    toast.success('GST activated', `${activateTarget.percentage}% is now the active GST rate.`);
    setActivateTarget(null);
  };

  const columns: Column<Gst>[] = [
    { key: 'gstType', header: 'GST Type', render: (g) => <span className="font-medium text-maroon-700">{g.gstType}</span> },
    { key: 'percentage', header: 'GST %', align: 'right', render: (g) => `${g.percentage}%` },
    { key: 'gstCode', header: 'GST Code' },
    { key: 'effectiveStart', header: 'Effective Start', render: (g) => formatDate(g.effectiveStart) },
    { key: 'effectiveEnd', header: 'Effective End', render: (g) => g.effectiveEnd ? formatDate(g.effectiveEnd) : '—' },
    { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (g) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => openEdit(g)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setActivateTarget(g)} disabled={g.status === 'Active'}
          className="rounded p-1.5 text-saffron-600 hover:bg-saffron-50 disabled:opacity-40" title="Activate"><Plus className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="GST Management" description="Manage GST rates — only one active GST % per period"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add GST</button>} />
      <div className="card mb-4 flex items-center gap-3 border-saffron-100 bg-saffron-50/50 p-4">
        <AlertTriangle className="h-5 w-5 text-saffron-500" />
        <p className="text-sm text-brown-700">Activating a GST record while another is active will deactivate the previous one. Only one GST % can be active per period.</p>
      </div>
      <div className="card"><DataTable columns={columns} data={data} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit GST Record' : 'Add GST Record'} size="lg"
        footer={<><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Save</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="GST Type" required error={errors.gstType}>
            <TextInput value={form.gstType} onChange={(e) => setForm({ ...form, gstType: e.target.value })} placeholder="e.g. Standard Rate" />
          </FormField>
          <FormField label="GST %" required error={errors.percentage}>
            <TextInput type="number" step="0.01" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} placeholder="9" />
          </FormField>
          <FormField label="GST Code" required error={errors.gstCode}>
            <TextInput value={form.gstCode} onChange={(e) => setForm({ ...form, gstCode: e.target.value })} placeholder="SR9" />
          </FormField>
          <FormField label="Effective Start Date" required error={errors.effectiveStart}>
            <TextInput type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} />
          </FormField>
          <FormField label="Effective End Date">
            <TextInput type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} />
          </FormField>
          <FormField label="Status">
            <div className="pt-1"><Toggle checked={status === 'Active'} onChange={(v) => setStatus(v ? 'Active' : 'Inactive')} label={status} /></div>
          </FormField>
        </div>
      </Modal>

      <ConfirmModal open={!!activateTarget} onClose={() => setActivateTarget(null)} onConfirm={handleActivate}
        title="Activate GST Record" message={`This will deactivate the current active GST record and set ${activateTarget?.percentage}% as active. Continue?`}
        confirmLabel="Activate" variant="saffron" />
    </div>
  );
}
