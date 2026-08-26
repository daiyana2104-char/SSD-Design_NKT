import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  type Hall,
} from '@/lib/mockData';
import { hallBookings as seedBookings } from '@/lib/hallData';

const PAGE_SIZE = 5;

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given hall has at least one future booking
 * (either a direct booking or via a package that includes this hall).
 * "Future" = eventDate is today or later AND bookingStatus is not Cancelled/Completed.
 */
function hasFutureBookings(hallId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);

  // Check direct bookings from hallData seed + any runtime bookings from mockData
  const allBookings = [...seedBookings, ...mockHallBookings];

  return allBookings.some((b) => {
    if (b.eventDate < today) return false;
    if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Completed') return false;

    // Direct hall booking
    if (b.hallIds.includes(hallId)) return true;

    // Package-based booking — check if the package includes this hall
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
  const [data, setData] = useState<Hall[]>(initial);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [viewing, setViewing] = useState<Hall | null>(null);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [form, setForm] = useState<Partial<Hall>>({ status: 'Active' });
  const [deactivateTarget, setDeactivateTarget] = useState<Hall | null>(null);

  // ── filtered list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── active categories for dropdown ────────────────────────────
  const activeCategories = categories.filter((c) => c.status === 'Active');

  // ── open helpers ───────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm({
      code: '',
      name: '',
      categoryId: activeCategories[0]?.id ?? '',
      seatingCapacity: undefined,
      depositAmount: 0,
      description: '',
      images: [],
      status: 'Active',
    });
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (record: Hall) => {
    setEditing(record);
    setViewing(null);
    setForm({ ...record });
    setStatus(record.status);
    setModalOpen(true);
  };

  const openView = (record: Hall) => {
    setViewing(record);
    setEditing(null);
    setForm({ ...record });
    setStatus(record.status);
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

    // ── required field validation ──
    if (!code) return toast.error('Validation Error', 'Hall Code is required.');
    if (!name) return toast.error('Validation Error', 'Hall Name is required.');
    if (!categoryId) return toast.error('Validation Error', 'Hall Category is required.');

    // ── seating capacity: positive integer ──
    const capacityRaw = form.seatingCapacity;
    const capacity = Number(capacityRaw);
    if (
      capacityRaw === undefined ||
      capacityRaw === null ||
      !Number.isFinite(capacity) ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      return toast.error('Validation Error', 'Seating Capacity must be a positive whole number.');
    }

    // ── deposit amount: non-negative ──
    const depositAmount = Number(form.depositAmount ?? 0);
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      return toast.error('Validation Error', 'Deposit Amount must be zero or a positive amount.');
    }

    // ── duplicate code check (exclude self on edit) ──
    const dupCode = data.some(
      (r) => r.code.trim().toLowerCase() === code.toLowerCase() && r.id !== editing?.id,
    );
    if (dupCode) return toast.error('Duplicate Code', 'A hall with this code already exists.');

    // ── duplicate name check (exclude self on edit) ──
    const dupName = data.some(
      (r) => r.name.trim().toLowerCase() === name.toLowerCase() && r.id !== editing?.id,
    );
    if (dupName) return toast.error('Duplicate Name', 'A hall with this name already exists.');

    // ── active → inactive: check future bookings ──
    const newStatus = status;
    if (editing && editing.status === 'Active' && newStatus === 'Inactive') {
      if (hasFutureBookings(editing.id)) {
        return toast.error(
          'Cannot Deactivate',
          'Hall cannot be deactivated because future bookings exist for this hall. ' +
          'Please complete, cancel or reschedule the associated bookings before deactivating the hall.',
        );
      }
    }

    if (editing) {
      // Preserve all legacy optional fields that exist on the record
      const updated: Hall = {
        ...editing,
        code,
        name,
        categoryId,
        seatingCapacity: capacity,
        depositAmount,
        description: form.description?.trim() ?? editing.description ?? '',
        images: form.images ?? editing.images ?? [],
        status: newStatus,
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
        depositAmount,
        description: form.description?.trim() ?? '',
        images: form.images ?? [],
        status: newStatus,
      };
      setData((prev) => [...prev, newRec]);
      toast.success('Hall created');
    }

    closeModal();
  };

  // ── deactivate via table action ────────────────────────────────
  const handleDeactivate = () => {
    if (!deactivateTarget) return;

    if (hasFutureBookings(deactivateTarget.id)) {
      toast.error(
        'Cannot Deactivate',
        'Hall cannot be deactivated because future bookings exist for this hall. ' +
        'Please complete, cancel or reschedule the associated bookings before deactivating the hall.',
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
      header: 'Seating Capacity',
      align: 'center',
      render: (r) => r.seatingCapacity ?? '—',
    },
    {
      key: 'deposit',
      header: 'Deposit (S$)',
      align: 'right',
      render: (r) =>
        r.depositAmount !== undefined && r.depositAmount > 0
          ? `S$${Number(r.depositAmount).toFixed(2)}`
          : <span className="text-brown-300">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
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

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search hall code or name..."
          filters={[]}
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

      {/* ── Add / Edit / View Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={viewing ? 'View Hall' : editing ? 'Edit Hall' : 'Add Hall'}
        size="lg"
        footer={
          viewing ? (
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
              disabled={!!viewing}
            />
          </FormField>

          {/* 2 — Hall Name */}
          <FormField label="Hall Name" required>
            <TextInput
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wedding Hall"
              disabled={!!viewing}
            />
          </FormField>

          {/* 3 — Hall Category */}
          <FormField label="Hall Category" required>
            {viewing ? (
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
                {/* Active categories for new/edit; always include the saved one for existing record */}
                {categories
                  .filter(
                    (c) =>
                      c.status === 'Active' ||
                      c.id === editing?.categoryId,
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            )}
          </FormField>

          {/* 4 — Seating Capacity */}
          <FormField label="Seating Capacity" required>
            <TextInput
              type="number"
              min={1}
              step={1}
              value={form.seatingCapacity !== undefined ? String(form.seatingCapacity) : ''}
              onChange={(e) => {
                const raw = e.target.value;
                // Allow only non-negative integers while typing
                const parsed = raw === '' ? undefined : Math.floor(Number(raw));
                setForm({ ...form, seatingCapacity: parsed });
              }}
              placeholder="e.g. 300"
              disabled={!!viewing}
            />
          </FormField>

          {/* 5 — Deposit Amount */}
          <FormField
            label="Deposit Amount (S$)"
            hint={viewing ? undefined : 'Enter 0 if no deposit is required.'}
          >
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={form.depositAmount !== undefined ? String(form.depositAmount) : '0'}
              onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })}
              placeholder="0.00"
              disabled={!!viewing}
            />
          </FormField>

          {/* 6 — Description */}
          <FormField label="Description" className="sm:col-span-2">
            <TextArea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!!viewing}
              placeholder="Hall description, facilities and special features (optional)"
            />
          </FormField>

          {/* 7 — Hall Images */}
          <FormField label="Hall Images" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(form.images ?? []).map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-24 w-36 overflow-hidden rounded border border-brown-200"
                >
                  <img src={img} alt={`hall-img-${idx}`} className="h-full w-full object-cover" />
                  {!viewing && (
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
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {!viewing && (
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

          {/* 8 — Status (always last) */}
          <FormField label="Status" className="sm:col-span-2">
            <div className="pt-1">
              {viewing ? (
                <StatusBadge status={status} />
              ) : (
                <Toggle
                  checked={status === 'Active'}
                  onChange={(v) => {
                    setStatus(v ? 'Active' : 'Inactive');
                    setForm({ ...form, status: v ? 'Active' : 'Inactive' });
                  }}
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
