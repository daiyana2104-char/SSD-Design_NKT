import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle, MultiSelect } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import {
  hallPackages as initial,
  hallPurposes as purposes,
  halls as hallsList,
  additionalServices,
  currentUser,
  type HallPackage,
} from '@/lib/mockData';
import { hallBookings as seedBookings } from '@/lib/hallData';

const PAGE_SIZE = 6;

const GST_OPTIONS = ['Applicable', 'Exempt', 'Not Applicable'] as const;
type GstOption = (typeof GST_OPTIONS)[number];

type SortField = 'name' | 'price' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function packageHasFutureBookings(packageId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return seedBookings.some(
    (b) =>
      b.packageId === packageId &&
      b.eventDate >= today &&
      b.bookingStatus !== 'Cancelled' &&
      b.bookingStatus !== 'Completed',
  );
}

// ─── sort indicator icon ──────────────────────────────────────────────────────

function SortIcon({ field, sort }: { field: SortField; sort: { field: SortField; dir: SortDir } }) {
  if (sort.field !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-brown-300" />;
  return sort.dir === 'asc'
    ? <ArrowUp className="ml-1 inline h-3 w-3 text-maroon-600" />
    : <ArrowDown className="ml-1 inline h-3 w-3 text-maroon-600" />;
}

// ─── component ────────────────────────────────────────────────────────────────

export function HallPackageMaster() {
  const toast = useToast();

  // ── master data ────────────────────────────────────────────────
  const [data, setData] = useState<HallPackage[]>(initial);

  // ── search + filters ───────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterHall, setFilterHall] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);

  // ── modal ──────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallPackage | null>(null);
  const [viewing, setViewing] = useState<HallPackage | null>(null);
  const [form, setForm] = useState<Partial<HallPackage>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<HallPackage | null>(null);

  // ── active masters ─────────────────────────────────────────────
  const activePurposes = useMemo(() => purposes.filter((p) => p.status === 'Active'), []);
  const activeHalls = useMemo(() => hallsList.filter((h) => h.status === 'Active'), []);
  const activeServices = useMemo(() => additionalServices.filter((s) => s.status === 'Active'), []);

  // ── filtered + sorted listing ──────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (filterPurpose && d.purpose !== filterPurpose) return false;
      if (filterHall && !(d.halls ?? []).includes(filterHall)) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'name') cmp = a.name.localeCompare(b.name);
      else if (sort.field === 'price') cmp = (a.price ?? 0) - (b.price ?? 0);
      else if (sort.field === 'createdAt')
        cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [data, search, filterPurpose, filterHall, filterStatus, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = !!search || !!filterPurpose || !!filterHall || !!filterStatus;

  const clearFilters = () => {
    setSearch('');
    setFilterPurpose('');
    setFilterHall('');
    setFilterStatus('');
    setPage(1);
  };

  const handleRefresh = () => {
    setData([...initial]);
    clearFilters();
    setSort({ field: 'name', dir: 'asc' });
    toast.success('Refreshed', 'Package list has been refreshed.');
  };

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' },
    );
    setPage(1);
  };

  // ── open / close helpers ───────────────────────────────────────
  const blankForm = (): Partial<HallPackage> => ({
    name: '',
    purpose: activePurposes[0]?.id ?? '',
    halls: [],
    price: 0,
    depositAmount: 0,
    gstApplicable: 'Applicable',
    additionalServiceIds: [],
    description: '',
    termsConditions: '',
    status: 'Active',
  });

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm(blankForm());
    setModalOpen(true);
  };

  const openEdit = (p: HallPackage) => {
    setEditing(p);
    setViewing(null);
    setForm({
      ...p,
      purpose: p.purpose ?? '',
      halls: p.halls ?? [],
      status: p.status ?? 'Active',
      description: p.description ?? '',
      gstApplicable: p.gstApplicable ?? 'Applicable',
      additionalServiceIds: p.additionalServiceIds ?? [],
      termsConditions: p.termsConditions ?? '',
    });
    setModalOpen(true);
  };

  const openView = (p: HallPackage) => {
    setViewing(p);
    setEditing(null);
    setForm({
      ...p,
      purpose: p.purpose ?? '',
      halls: p.halls ?? [],
      status: p.status ?? 'Active',
      description: p.description ?? '',
      gstApplicable: p.gstApplicable ?? 'Applicable',
      additionalServiceIds: p.additionalServiceIds ?? [],
      termsConditions: p.termsConditions ?? '',
    });
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
    const name = form.name?.trim() ?? '';
    const purpose = form.purpose ?? '';
    const halls = form.halls ?? [];
    const newStatus = (form.status ?? 'Active') as 'Active' | 'Inactive';

    // Required
    if (!name) return toast.error('Validation Error', 'Package Name is required.');
    if (!purpose) return toast.error('Validation Error', 'Hall Purpose is required.');
    if (!halls.length) return toast.error('Validation Error', 'At least one hall must be selected.');

    // Unique name (exclude self on edit)
    const dupName = data.some(
      (d) => d.name.trim().toLowerCase() === name.toLowerCase() && d.id !== editing?.id,
    );
    if (dupName) return toast.error('Duplicate Name', 'A package with this name already exists.');

    // Active purpose
    if (!purposes.some((p) => p.id === purpose && p.status === 'Active')) {
      return toast.error('Validation Error', 'Selected Hall Purpose is not active.');
    }

    // No duplicate halls in selection (MultiSelect prevents this, but guard anyway)
    const unique = new Set(halls);
    if (unique.size !== halls.length) {
      return toast.error('Validation Error', 'Duplicate hall selection is not allowed.');
    }

    // All selected halls must be active
    const inactiveHalls = halls.filter(
      (id) => !hallsList.some((h) => h.id === id && h.status === 'Active'),
    );
    if (inactiveHalls.length) {
      return toast.error('Validation Error', 'Only active halls can be selected.');
    }

    // Additional services must all be active
    const serviceIds = form.additionalServiceIds ?? [];
    const inactiveSvcs = serviceIds.filter(
      (id) => !additionalServices.some((s) => s.id === id && s.status === 'Active'),
    );
    if (inactiveSvcs.length) {
      return toast.error('Validation Error', 'Only active additional services can be selected.');
    }

    // Package Amount
    const safePrice = Number(form.price ?? 0);
    if (!Number.isFinite(safePrice) || safePrice < 0) {
      return toast.error('Validation Error', 'Package Amount must be zero or a positive amount.');
    }

    // Deposit Amount
    const safeDeposit = Number(form.depositAmount ?? 0);
    if (!Number.isFinite(safeDeposit) || safeDeposit < 0) {
      return toast.error('Validation Error', 'Deposit Amount must be zero or a positive amount.');
    }

    // Future-booking dependency checks (edit only)
    if (editing) {
      const hasFuture = packageHasFutureBookings(editing.id);

      if (hasFuture) {
        // Hall Purpose change blocked
        if (purpose !== (editing.purpose ?? '')) {
          return toast.error(
            'Cannot Change Hall Purpose',
            'This package has future bookings. Hall Purpose cannot be changed until those bookings are completed or cancelled.',
          );
        }
        // Hall list change blocked
        const oldHalls = [...(editing.halls ?? [])].sort().join(',');
        const newHalls = [...halls].sort().join(',');
        if (oldHalls !== newHalls) {
          return toast.error(
            'Cannot Change Halls',
            'This package has future bookings. Mapped halls cannot be added, removed or replaced until those bookings are completed or cancelled.',
          );
        }
      }

      // Deactivation blocked if future bookings exist
      if (editing.status === 'Active' && newStatus === 'Inactive' && hasFuture) {
        return toast.error(
          'Cannot Deactivate',
          'This package has future bookings and cannot be deactivated until those bookings are completed or cancelled.',
        );
      }

      const updated: HallPackage = {
        ...editing,
        name,
        purpose,
        price: safePrice,
        depositAmount: safeDeposit,
        gstApplicable: form.gstApplicable ?? 'Applicable',
        additionalServiceIds: serviceIds,
        description: form.description?.trim() ?? editing.description ?? '',
        termsConditions: form.termsConditions?.trim() ?? editing.termsConditions ?? '',
        halls,
        status: newStatus,
        // preserve creation metadata
        createdAt: editing.createdAt,
        createdBy: editing.createdBy,
      };
      setData((prev) => prev.map((d) => (d.id === editing.id ? updated : d)));
      toast.success('Package updated');
    } else {
      const newRec: HallPackage = {
        id: 'pkg-' + Math.random().toString(36).slice(2),
        name,
        purpose,
        price: safePrice,
        depositAmount: safeDeposit,
        gstApplicable: form.gstApplicable ?? 'Applicable',
        additionalServiceIds: serviceIds,
        description: form.description?.trim() ?? '',
        termsConditions: form.termsConditions?.trim() ?? '',
        halls,
        status: newStatus,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };
      setData((prev) => [...prev, newRec]);
      toast.success('Package created');
    }

    closeModal();
  };

  // ── deactivate from table ──────────────────────────────────────
  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    if (packageHasFutureBookings(deactivateTarget.id)) {
      toast.error(
        'Cannot Deactivate',
        'This package has future bookings and cannot be deactivated until those bookings are completed or cancelled.',
      );
      setDeactivateTarget(null);
      return;
    }
    setData((prev) =>
      prev.map((p) => (p.id === deactivateTarget.id ? { ...p, status: 'Inactive' } : p)),
    );
    toast.success('Package deactivated');
    setDeactivateTarget(null);
  };

  // ── sortable header helper ─────────────────────────────────────
  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold hover:text-maroon-700"
    >
      {label}
      <SortIcon field={field} sort={sort} />
    </button>
  );

  // ── table columns ──────────────────────────────────────────────
  // Note: DataTable renders column.header as ReactNode — we pass the sort button
  // via the render prop on a dummy wrapper because Column.header is `string`.
  // Instead we use a custom header row pattern by overriding column headers with
  // the sort buttons rendered inside the header string slot via a cast.
  const columns: Column<HallPackage>[] = [
    {
      key: 'name',
      header: 'Package Name',
      render: (p) => (
        <div>
          <span className="font-medium text-brown-800">{p.name}</span>
          {p.gstApplicable && p.gstApplicable !== 'Not Applicable' && (
            <span className="ml-2 rounded bg-saffron-50 px-1.5 py-0.5 text-xs text-saffron-700">
              GST {p.gstApplicable === 'Applicable' ? 'Applicable' : 'Exempt'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'Hall Purpose',
      render: (p) => (
        <span className="text-brown-700">
          {purposes.find((x) => x.id === p.purpose)?.name ?? p.purpose ?? '—'}
        </span>
      ),
    },
    {
      key: 'halls',
      header: 'Included Halls',
      render: (p) =>
        p.halls && p.halls.length
          ? p.halls
              .map((id) => hallsList.find((h) => h.id === id)?.name)
              .filter(Boolean)
              .join(', ')
          : '—',
    },
    {
      key: 'price',
      header: 'Package Amount',
      align: 'right',
      render: (p) => (
        <span className="font-medium text-brown-800">S${Number(p.price ?? 0).toFixed(2)}</span>
      ),
    },
    {
      key: 'depositAmount',
      header: 'Deposit Amount',
      align: 'right',
      render: (p) =>
        p.depositAmount && p.depositAmount > 0
          ? <span className="text-brown-700">S${Number(p.depositAmount).toFixed(2)}</span>
          : <span className="text-brown-300">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.status ?? 'Active'} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (p) => (
        <span className="whitespace-nowrap text-brown-600">{formatDate(p.createdAt)}</span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (p) => <span className="text-brown-600">{p.createdBy ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (p) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openView(p)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(p)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          {p.status === 'Active' && (
            <button
              type="button"
              onClick={() => setDeactivateTarget(p)}
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
        title="Hall Package Master"
        description="Create and manage hall packages"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Package
          </button>
        }
      />

      {/* ── Search + Filters ── */}
      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search package name..."
          filters={[
            {
              label: 'Hall Purpose',
              value: filterPurpose,
              onChange: (v) => { setFilterPurpose(v); setPage(1); },
              options: [
                { label: 'All Purposes', value: '' },
                ...purposes.map((p) => ({ label: p.name, value: p.id })),
              ],
            },
            {
              label: 'Hall',
              value: filterHall,
              onChange: (v) => { setFilterHall(v); setPage(1); },
              options: [
                { label: 'All Halls', value: '' },
                ...hallsList.map((h) => ({ label: h.name, value: h.id })),
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
              {/* Sort selector */}
              <div className="flex items-center gap-1.5">
                <span className="hidden text-sm text-brown-500 sm:inline">Sort:</span>
                <select
                  value={`${sort.field}-${sort.dir}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split('-') as [SortField, SortDir];
                    setSort({ field: f, dir: d });
                    setPage(1);
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                  <option value="price-asc">Amount (Low–High)</option>
                  <option value="price-desc">Amount (High–Low)</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>
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
        title={isView ? 'View Package' : editing ? 'Edit Package' : 'Add Package'}
        size="xl"
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
        <div className="space-y-5">

          {/* ── Row 1: Name + Purpose ── */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* 1 — Package Name */}
            <FormField label="Package Name" required>
              <TextInput
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={isView}
                placeholder="e.g. Wedding Package"
              />
            </FormField>

            {/* 2 — Hall Purpose */}
            <FormField label="Hall Purpose" required>
              {isView ? (
                <TextInput
                  value={purposes.find((p) => p.id === form.purpose)?.name ?? '—'}
                  readOnly
                />
              ) : (
                <select
                  value={form.purpose ?? ''}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="input"
                >
                  <option value="">Select purpose</option>
                  {purposes
                    .filter((p) => p.status === 'Active' || p.id === editing?.purpose)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              )}
            </FormField>

          </div>

          {/* ── Hall Selection (full width) ── */}
          <FormField label="Hall Selection" required>
            {isView ? (
              <TextInput
                value={
                  (form.halls ?? [])
                    .map((id) => hallsList.find((h) => h.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '—'
                }
                readOnly
              />
            ) : (
              <div>
                <MultiSelect
                  values={form.halls ?? []}
                  onChange={(vals) => setForm({ ...form, halls: vals })}
                  options={hallsList
                    .filter(
                      (h) => h.status === 'Active' || (editing?.halls ?? []).includes(h.id),
                    )
                    .map((h) => ({
                      label: `${h.name} (Cap: ${h.seatingCapacity ?? '—'})`,
                      value: h.id,
                    }))}
                  placeholder="Select one or more halls"
                />
                <p className="mt-1 text-xs text-brown-400">
                  All mapped halls are checked for availability when this package is booked. Start Time and End Time are entered at booking.
                </p>
              </div>
            )}
          </FormField>

          {/* ── Row 2: Amount + Deposit ── */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* 3 — Package Amount */}
            <FormField label="Package Amount (S$)" required>
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.price !== undefined ? String(form.price) : ''}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                disabled={isView}
                placeholder="0.00"
              />
            </FormField>

            {/* 4 — Deposit Amount */}
            <FormField
              label="Deposit Amount (S$)"
              hint={isView ? undefined : 'Enter 0 if no deposit is required.'}
            >
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.depositAmount !== undefined ? String(form.depositAmount) : ''}
                onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })}
                disabled={isView}
                placeholder="0.00"
              />
            </FormField>

          </div>

          {/* ── Row 3: GST Applicability ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 5 — GST Applicability */}
            <FormField label="GST Applicability">
              {isView ? (
                <TextInput value={form.gstApplicable ?? '—'} readOnly />
              ) : (
                <select
                  value={form.gstApplicable ?? 'Applicable'}
                  onChange={(e) => setForm({ ...form, gstApplicable: e.target.value })}
                  className="input"
                >
                  {GST_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          {/* ── Additional Services ── */}
          <FormField label="Additional Services">
            {isView ? (
              <TextInput
                value={
                  (form.additionalServiceIds ?? []).length
                    ? (form.additionalServiceIds ?? [])
                        .map((id) => additionalServices.find((s) => s.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')
                    : 'None'
                }
                readOnly
              />
            ) : (
              <div>
                <MultiSelect
                  values={form.additionalServiceIds ?? []}
                  onChange={(vals) => setForm({ ...form, additionalServiceIds: vals })}
                  options={additionalServices
                    .filter(
                      (s) =>
                        s.status === 'Active' ||
                        (editing?.additionalServiceIds ?? []).includes(s.id),
                    )
                    .map((s) => ({
                      label: `${s.name} (${s.pricingType ?? 'Fixed'} — S$${(s.rate ?? 0).toFixed(2)})`,
                      value: s.id,
                    }))}
                  placeholder="Select additional services (optional)"
                />
                <p className="mt-1 text-xs text-brown-400">
                  Only active additional services can be selected.
                </p>
              </div>
            )}
          </FormField>

          {/* ── Description ── */}
          <FormField label="Description">
            {isView ? (
              <TextInput value={form.description || '—'} readOnly />
            ) : (
              <TextArea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Package description, what is included, special features…"
              />
            )}
          </FormField>

          {/* ── Terms & Conditions ── */}
          <FormField label="Terms & Conditions">
            {isView ? (
              <TextArea
                value={form.termsConditions || '—'}
                readOnly
                className="min-h-[80px] bg-cream-50"
              />
            ) : (
              <TextArea
                value={form.termsConditions ?? ''}
                onChange={(e) => setForm({ ...form, termsConditions: e.target.value })}
                placeholder="Payment terms, cancellation policy, booking rules…"
              />
            )}
          </FormField>

          {/* ── Status (always last) ── */}
          <FormField label="Status">
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

      {/* ── Deactivate Confirm ── */}
      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Package"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name ?? ''}"? Inactive packages will not be available for new bookings.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default HallPackageMaster;
