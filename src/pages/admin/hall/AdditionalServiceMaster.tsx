import { useMemo, useState } from 'react';
import { Plus, Edit, Eye, X, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import {
  additionalServices as initial,
  hallPackages,
  currentUser,
  type AdditionalService,
} from '@/lib/mockData';

const PAGE_SIZE = 10;

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Returns the names of all Active Hall Packages that include this service
 * (via additionalServiceIds). Used to block deactivation.
 */
function activePackagesUsing(serviceId: string): string[] {
  return hallPackages
    .filter(
      (p) =>
        p.status === 'Active' &&
        (p.additionalServiceIds ?? []).includes(serviceId),
    )
    .map((p) => p.name);
}

// ─── component ────────────────────────────────────────────────────────────────

export function AdditionalServiceMaster() {
  const toast = useToast();

  const [data, setData] = useState<AdditionalService[]>(initial);

  // ── search + filters ───────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // ── modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalService | null>(null);
  const [viewing, setViewing] = useState<AdditionalService | null>(null);
  const [form, setForm] = useState<Partial<AdditionalService>>({ status: 'Active' });

  // ── toggle-status confirm ─────────────────────────────────────
  const [toggleTarget, setToggleTarget] = useState<AdditionalService | null>(null);

  // ── filtered listing ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((s) => {
      if (filterStatus && s.status !== filterStatus) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = !!search || !!filterStatus;

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setPage(1);
  };

  const handleRefresh = () => {
    setData([...initial]);
    clearFilters();
    toast.success('Refreshed', 'Service list has been refreshed.');
  };

  // ── open / close helpers ───────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({ code: '', name: '', description: '', status: 'Active' });
    setModalOpen(true);
  };

  const openEdit = (r: AdditionalService) => {
    setEditing(r);
    setViewing(null);
    setForm({ ...r });
    setModalOpen(true);
  };

  const openView = (r: AdditionalService) => {
    setViewing(r);
    setEditing(null);
    setForm({ ...r });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setViewing(null);
    setForm({ status: 'Active' });
  };

  // ── save ───────────────────────────────────────────────────────
  const handleSave = () => {
    const code = form.code?.trim().toUpperCase() ?? '';
    const name = form.name?.trim() ?? '';
    const newStatus = (form.status ?? 'Active') as 'Active' | 'Inactive';

    if (!code) return toast.error('Validation Error', 'Service Code is required.');
    if (!name) return toast.error('Validation Error', 'Service Name is required.');

    // Unique code
    if (data.some((d) => d.code.toUpperCase() === code && d.id !== editing?.id)) {
      return toast.error('Duplicate Code', 'A service with this code already exists.');
    }
    // Unique name
    if (
      data.some((d) => d.name.trim().toLowerCase() === name.toLowerCase() && d.id !== editing?.id)
    ) {
      return toast.error('Duplicate Name', 'A service with this name already exists.');
    }

    // Deactivation dependency check within Edit
    if (editing && editing.status === 'Active' && newStatus === 'Inactive') {
      const blocking = activePackagesUsing(editing.id);
      if (blocking.length > 0) {
        return toast.error(
          'Cannot Deactivate',
          `This service is used by the following active Hall Package${blocking.length > 1 ? 's' : ''}: ${blocking.join(', ')}. Remove it from those packages before deactivating.`,
        );
      }
    }

    if (editing) {
      const updated: AdditionalService = {
        ...editing,
        code,
        name,
        description: form.description?.trim() ?? editing.description ?? '',
        status: newStatus,
        // preserve creation metadata and deprecated fields untouched
        createdAt: editing.createdAt,
        createdBy: editing.createdBy,
      };
      setData((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      toast.success('Service updated');
    } else {
      const newRec: AdditionalService = {
        id: 'as-' + Math.random().toString(36).slice(2),
        code,
        name,
        description: form.description?.trim() ?? '',
        status: newStatus,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };
      setData((prev) => [...prev, newRec]);
      toast.success('Service created');
    }

    closeModal();
  };

  // ── activate / deactivate from table ──────────────────────────
  const handleToggleStatus = () => {
    if (!toggleTarget) return;

    // Only relevant for Active → Inactive
    if (toggleTarget.status === 'Active') {
      const blocking = activePackagesUsing(toggleTarget.id);
      if (blocking.length > 0) {
        toast.error(
          'Cannot Deactivate',
          `This service is used by the following active Hall Package${blocking.length > 1 ? 's' : ''}: ${blocking.join(', ')}. Remove it from those packages before deactivating.`,
        );
        setToggleTarget(null);
        return;
      }
    }

    const newStatus = toggleTarget.status === 'Active' ? 'Inactive' : 'Active';
    setData((prev) =>
      prev.map((s) => (s.id === toggleTarget.id ? { ...s, status: newStatus } : s)),
    );
    toast.success(newStatus === 'Active' ? 'Service activated' : 'Service deactivated');
    setToggleTarget(null);
  };

  // ── table columns ──────────────────────────────────────────────
  const columns: Column<AdditionalService>[] = [
    {
      key: 'name',
      header: 'Service Name',
      render: (r) => <span className="font-medium text-brown-800">{r.name}</span>,
    },
    {
      key: 'code',
      header: 'Service Code',
      render: (r) => (
        <span className="rounded bg-cream-100 px-2 py-0.5 font-mono text-xs text-brown-700">
          {r.code}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <span className="text-brown-600">{r.description || <span className="text-brown-300">—</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (r) => (
        <span className="whitespace-nowrap text-brown-600">{formatDate(r.createdAt)}</span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (r) => <span className="text-brown-600">{r.createdBy ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (r) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openView(r)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToggleTarget(r)}
            className={
              r.status === 'Active'
                ? 'rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600'
                : 'rounded p-1.5 text-brown-500 hover:bg-green-50 hover:text-green-700'
            }
            title={r.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            {r.status === 'Active' ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  const isView = !!viewing;

  return (
    <div>
      <PageHeader
        title="Additional Service Master"
        description="Manage additional services available for hall packages"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Service
          </button>
        }
      />

      {/* ── Search + Filters ── */}
      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by service name or code..."
          filters={[
            {
              label: 'Status',
              value: filterStatus,
              onChange: (v) => { setFilterStatus(v); setPage(1); },
              options: [
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ],
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-outline flex items-center gap-1.5 text-sm"
                  title="Clear all filters"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                className="btn-outline flex items-center gap-1.5 text-sm"
                title="Refresh list"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          }
        />
      </div>

      {/* ── Table ── */}
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

      {/* ── Add / Edit / View Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={isView ? 'View Service' : editing ? 'Edit Service' : 'Add Service'}
        size="md"
        footer={
          isView ? (
            <button type="button" className="btn-outline" onClick={closeModal}>Close</button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSave}>Save</button>
            </>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">

          {/* 1 — Service Name */}
          <FormField label="Service Name" required>
            <TextInput
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Decoration"
              disabled={isView}
            />
          </FormField>

          {/* 2 — Service Code */}
          <FormField
            label="Service Code"
            required
            hint={isView ? undefined : 'Uppercase letters and hyphens, e.g. DEC'}
          >
            <TextInput
              value={form.code ?? ''}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. DEC"
              disabled={isView}
            />
          </FormField>

          {/* 3 — Description (full width) */}
          <FormField label="Description" className="sm:col-span-2">
            {isView ? (
              <TextInput value={form.description || '—'} readOnly />
            ) : (
              <TextArea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this service (optional)"
              />
            )}
          </FormField>

          {/* 4 — Status (always last) */}
          <FormField label="Status" className="sm:col-span-2">
            <div className="pt-1">
              {isView ? (
                <StatusBadge status={form.status ?? 'Active'} />
              ) : (
                <Toggle
                  checked={(form.status ?? 'Active') === 'Active'}
                  onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })}
                  trueLabel="Active"
                  falseLabel="Inactive"
                />
              )}
            </div>
          </FormField>

        </div>
      </Modal>

      {/* ── Activate / Deactivate Confirm ── */}
      <ConfirmModal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.status === 'Active' ? 'Deactivate Service' : 'Activate Service'}
        message={
          toggleTarget?.status === 'Active'
            ? `Deactivate "${toggleTarget?.name ?? ''}"? It will no longer be available for new Hall Package configuration.`
            : `Activate "${toggleTarget?.name ?? ''}"? It will become available for Hall Package configuration.`
        }
        confirmLabel={toggleTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        cancelLabel="Cancel"
        variant={toggleTarget?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default AdditionalServiceMaster;
