import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle } from '@/components/ui/Form';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import {
  halls as initial,
  hallCategories as categories,
  hallBookings as mockHallBookings,
  hallPackages,
  currentUser,
  type Hall,
} from '@/lib/mockData';
import { hallBookings as seedBookings } from '@/lib/hallData';

const PAGE_SIZE = 5;

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Returns true if the given hall has at least one future booking
 * (direct or via a package) that is not Cancelled or Completed.
 */
function hasFutureBookings(hallId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const allBookings = [...seedBookings, ...mockHallBookings];
  return allBookings.some((b) => {
    if (b.eventDate < today) return false;
    if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Completed') return false;
    if (b.hallIds.includes(hallId)) return true;
    if (b.packageId) {
      const pkg = hallPackages.find((p) => p.id === b.packageId);
      if (pkg && pkg.halls.includes(hallId)) return true;
    }
    return false;
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export function HallMaster() {
  const toast = useToast();

  // ── master data ────────────────────────────────────────────────
  const [data, setData] = useState<Hall[]>(initial);

  // ── search + filters ───────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // ── modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [viewing, setViewing] = useState<Hall | null>(null);
  const [form, setForm] = useState<Partial<Hall>>({ status: 'Active' });
  const [deactivateTarget, setDeactivateTarget] = useState<Hall | null>(null);

  // ── active categories for dropdowns ───────────────────────────
  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === 'Active'),
    [],
  );

  // ── filtered listing ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (filterCategory && r.categoryId !== filterCategory) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [data, search, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = !!search || !!filterCategory || !!filterStatus;

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStatus('');
    setPage(1);
  };

  const handleRefresh = () => {
    setData([...initial]);
    clearFilters();
    toast.success('Refreshed', 'Hall list has been refreshed.');
  };

  // ── open / close helpers ───────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({
      code: '',
      name: '',
      categoryId: activeCategories[0]?.id ?? '',
      seatingCapacity: undefined,
      individualBookingRate: 0,
      minBookingDuration: undefined,
      depositAmount: 0,
      description: '',
      images: [],
      floorPlan: '',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEdit = (record: Hall) => {
    setEditing(record);
    setViewing(null);
    setForm({ ...record });
    setModalOpen(true);
  };

  const openView = (record: Hall) => {
    setViewing(record);
    setEditing(null);
    setForm({ ...record });
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
    const code = form.code?.trim() ?? '';
    const name = form.name?.trim() ?? '';
    const categoryId = form.categoryId ?? '';
    const newStatus = (form.status ?? 'Active') as 'Active' | 'Inactive';

    // Required fields
    if (!code) return toast.error('Validation Error', 'Hall Code is required.');
    if (!name) return toast.error('Validation Error', 'Hall Name is required.');
    if (!categoryId) return toast.error('Validation Error', 'Hall Category is required.');

    // Seating Capacity — positive integer
    const capacityRaw = form.seatingCapacity;
    const capacity = Number(capacityRaw);
    if (
      capacityRaw === undefined ||
      capacityRaw === null ||
      !Number.isFinite(capacity) ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      return toast.error('Validation Error', 'Hall Capacity must be a positive whole number.');
    }

    // Individual Booking Rate — non-negative
    const bookingRate = Number(form.individualBookingRate ?? 0);
    if (!Number.isFinite(bookingRate) || bookingRate < 0) {
      return toast.error('Validation Error', 'Individual Booking Rate must be zero or a positive amount.');
    }

    // Minimum Booking Duration — positive when provided
    const minDuration = form.minBookingDuration !== undefined && form.minBookingDuration !== null
      ? Number(form.minBookingDuration)
      : undefined;
    if (minDuration !== undefined && (!Number.isFinite(minDuration) || minDuration <= 0)) {
      return toast.error('Validation Error', 'Minimum Booking Duration must be a positive number when specified.');
    }

    // Deposit Amount — non-negative
    const depositAmount = Number(form.depositAmount ?? 0);
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      return toast.error('Validation Error', 'Deposit Amount must be zero or a positive amount.');
    }

    // Duplicate code
    const dupCode = data.some(
      (r) => r.code.trim().toLowerCase() === code.toLowerCase() && r.id !== editing?.id,
    );
    if (dupCode) return toast.error('Duplicate Code', 'A hall with this code already exists.');

    // Duplicate name
    const dupName = data.some(
      (r) => r.name.trim().toLowerCase() === name.toLowerCase() && r.id !== editing?.id,
    );
    if (dupName) return toast.error('Duplicate Name', 'A hall with this name already exists.');

    // Active → Inactive guard
    if (editing && editing.status === 'Active' && newStatus === 'Inactive') {
      if (hasFutureBookings(editing.id)) {
        return toast.error(
          'Cannot Deactivate',
          'Hall cannot be deactivated because future bookings exist for this hall. ' +
            'Please complete, cancel or reschedule the associated bookings before deactivating.',
        );
      }
    }

    if (editing) {
      const updated: Hall = {
        ...editing,
        code,
        name,
        categoryId,
        seatingCapacity: capacity,
        individualBookingRate: bookingRate,
        hourlyRate: bookingRate,           // keep legacy alias in sync
        minBookingDuration: minDuration,
        minBookingHours: minDuration,      // keep legacy alias in sync
        depositAmount,
        description: form.description?.trim() ?? editing.description ?? '',
        images: form.images ?? editing.images ?? [],
        floorPlan: form.floorPlan ?? editing.floorPlan ?? '',
        status: newStatus,
        // preserve creation metadata
        createdAt: editing.createdAt,
        createdBy: editing.createdBy,
      };
      setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      toast.success('Hall updated');
    } else {
      const newRec: Hall = {
        id: 'h-' + Math.random().toString(36).slice(2),
        code,
        name,
        categoryId,
        seatingCapacity: capacity,
        individualBookingRate: bookingRate,
        hourlyRate: bookingRate,
        minBookingDuration: minDuration,
        minBookingHours: minDuration,
        depositAmount,
        description: form.description?.trim() ?? '',
        images: form.images ?? [],
        floorPlan: form.floorPlan ?? '',
        status: newStatus,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };
      setData((prev) => [...prev, newRec]);
      toast.success('Hall created');
    }

    closeModal();
  };

  // ── deactivate from table ──────────────────────────────────────
  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    if (hasFutureBookings(deactivateTarget.id)) {
      toast.error(
        'Cannot Deactivate',
        'Hall cannot be deactivated because future bookings exist for this hall. ' +
          'Please complete, cancel or reschedule the associated bookings before deactivating.',
      );
      setDeactivateTarget(null);
      return;
    }
    setData((prev) =>
      prev.map((r) => (r.id === deactivateTarget.id ? { ...r, status: 'Inactive' } : r)),
    );
    toast.success('Hall deactivated');
    setDeactivateTarget(null);
  };

  // ── table columns ──────────────────────────────────────────────
  const columns: Column<Hall>[] = [
    {
      key: 'code',
      header: 'Hall Code',
      render: (r) => <span className="font-medium text-brown-800">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Hall Name',
      render: (r) => <span className="text-brown-800">{r.name}</span>,
    },
    {
      key: 'category',
      header: 'Hall Category',
      render: (r) => (
        <span className="text-brown-700">
          {categories.find((c) => c.id === r.categoryId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Hall Capacity',
      align: 'center',
      render: (r) => (
        <span className="text-brown-700">{r.seatingCapacity ?? '—'}</span>
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
      render: (r) => (
        <span className="text-brown-600">{r.createdBy ?? '—'}</span>
      ),
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
          {r.status === 'Active' && (
            <button
              type="button"
              onClick={() => setDeactivateTarget(r)}
              className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
              title="Deactivate"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const isView = !!viewing;

  return (
    <div>
      <PageHeader
        title="Hall Master"
        description="Manage halls available for booking"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Hall
          </button>
        }
      />

      {/* ── Search + Filters ── */}
      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search hall code or name..."
          filters={[
            {
              label: 'Category',
              value: filterCategory,
              onChange: (v) => { setFilterCategory(v); setPage(1); },
              options: [
                { label: 'All Categories', value: '' },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ],
            },
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
        title={isView ? 'View Hall' : editing ? 'Edit Hall' : 'Add Hall'}
        size="lg"
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

          {/* 1 — Hall Code */}
          <FormField label="Hall Code" required>
            <TextInput
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. H-WED-03"
              disabled={isView}
            />
          </FormField>

          {/* 2 — Hall Name */}
          <FormField label="Hall Name" required>
            <TextInput
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wedding Hall"
              disabled={isView}
            />
          </FormField>

          {/* 3 — Hall Category */}
          <FormField label="Hall Category" required>
            {isView ? (
              <TextInput
                value={categories.find((c) => c.id === form.categoryId)?.name ?? '—'}
                readOnly
              />
            ) : (
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input"
              >
                <option value="">Select category</option>
                {categories
                  .filter(
                    (c) => c.status === 'Active' || c.id === editing?.categoryId,
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            )}
          </FormField>

          {/* 4 — Hall Capacity */}
          <FormField label="Hall Capacity" required>
            <TextInput
              type="number"
              min={1}
              step={1}
              value={form.seatingCapacity !== undefined ? String(form.seatingCapacity) : ''}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({ ...form, seatingCapacity: raw === '' ? undefined : Math.floor(Number(raw)) });
              }}
              placeholder="e.g. 300"
              disabled={isView}
            />
          </FormField>

          {/* 5 — Individual Booking Rate */}
          <FormField
            label="Individual Booking Rate (S$/hr)"
            hint={isView ? undefined : 'Rate per hour for direct (non-package) bookings. Enter 0 if not applicable.'}
          >
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={form.individualBookingRate !== undefined ? String(form.individualBookingRate) : ''}
              onChange={(e) => setForm({ ...form, individualBookingRate: Number(e.target.value) })}
              placeholder="0.00"
              disabled={isView}
            />
          </FormField>

          {/* 6 — Minimum Booking Duration */}
          <FormField
            label="Minimum Booking Duration (hrs)"
            hint={isView ? undefined : 'Minimum hours required per booking. Validated at booking time.'}
          >
            <TextInput
              type="number"
              min={1}
              step={0.5}
              value={form.minBookingDuration !== undefined ? String(form.minBookingDuration) : ''}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({ ...form, minBookingDuration: raw === '' ? undefined : Number(raw) });
              }}
              placeholder="e.g. 2"
              disabled={isView}
            />
          </FormField>

          {/* 7 — Deposit Amount */}
          <FormField
            label="Deposit Amount (S$)"
            hint={isView ? undefined : 'Enter 0 if no deposit is required.'}
          >
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={form.depositAmount !== undefined ? String(form.depositAmount) : '0'}
              onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })}
              placeholder="0.00"
              disabled={isView}
            />
          </FormField>

          {/* 8 — Description (optional, retained for business use) */}
          <FormField label="Description" className="sm:col-span-2">
            {isView ? (
              <TextInput value={form.description || '—'} readOnly />
            ) : (
              <TextArea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Hall description, facilities, special features (optional)"
              />
            )}
          </FormField>

          {/* 9 — Hall Images */}
          <FormField label="Hall Images" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(form.images ?? []).map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-24 w-36 overflow-hidden rounded border border-brown-200"
                >
                  <img src={img} alt={`hall-img-${idx}`} className="h-full w-full object-cover" />
                  {!isView && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          images: (form.images ?? []).filter((_, i) => i !== idx),
                        })
                      }
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {!isView && (
                <div className="w-36">
                  <FileUpload
                    accept="image/*"
                    onFile={(f) => {
                      const url = URL.createObjectURL(f);
                      setForm({ ...form, images: [...(form.images ?? []), url] });
                    }}
                  />
                </div>
              )}
            </div>
          </FormField>

          {/* 10 — Floor Plan */}
          <FormField
            label="Floor Plan"
            className="sm:col-span-2"
            hint={isView ? undefined : 'Upload an image of the hall floor plan (optional).'}
          >
            {form.floorPlan ? (
              <div className="flex flex-wrap gap-2">
                <div className="relative h-24 w-36 overflow-hidden rounded border border-brown-200">
                  <img
                    src={form.floorPlan}
                    alt="floor-plan"
                    className="h-full w-full object-cover"
                  />
                  {!isView && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, floorPlan: '' })}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : isView ? (
              <TextInput value="No floor plan uploaded" readOnly />
            ) : (
              <div className="w-full sm:max-w-xs">
                <FileUpload
                  accept="image/*,.pdf"
                  onFile={(f) => {
                    const url = URL.createObjectURL(f);
                    setForm({ ...form, floorPlan: url });
                  }}
                />
              </div>
            )}
          </FormField>

          {/* 11 — Status (always last) */}
          <FormField label="Status" className="sm:col-span-2">
            <div className="pt-1">
              {isView ? (
                <StatusBadge status={form.status ?? 'Active'} />
              ) : (
                <Toggle
                  checked={(form.status ?? 'Active') === 'Active'}
                  onChange={(v) =>
                    setForm({ ...form, status: v ? 'Active' : 'Inactive' })
                  }
                  trueLabel="Active"
                  falseLabel="Inactive"
                />
              )}
            </div>
          </FormField>

        </div>
      </Modal>

      {/* ── Deactivate Confirm ── */}
      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Hall"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name ?? ''}"? Inactive halls will not be available for new bookings or packages.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default HallMaster;
