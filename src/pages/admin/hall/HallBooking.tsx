import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search, UserPlus, X } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import {
  customers as initialCustomers,
  halls as initialHalls,
  hallPackages as packages,
  hallPurposes,
  additionalServices,
  glRecords,
  mealPackagesMaster,
  paymentModes,
  type HallBooking,
  type HallAdditionalServiceLine,
  type Customer,
} from '@/lib/mockData';
import { hallBookings as initialBookings, hallExceptions, type HallBookingRecord } from '@/lib/hallData';
import { checkHallsAvailability } from '@/lib/hallAvailability';
import { HallBookingCalendar } from '@/pages/admin/hall/HallBookingCalendar';

const PAGE_SIZE = 8;

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(value: string) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function generateBookingRef(existing: HallBookingRecord[]): string {
  const today = new Date();
  const yymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `HB${yymm}`;
  const samePrefixNums = existing
    .map((b) => b.bookingRef)
    .filter((r) => r.startsWith(prefix))
    .map((r) => parseInt(r.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = samePrefixNums.length ? Math.max(...samePrefixNums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcDurationHours(date: string, start: string, end: string): number {
  const s = new Date(`${date}T${start}`).getTime();
  const e = new Date(`${date}T${end}`).getTime();
  return Math.max(0, (e - s) / 3_600_000);
}

function calcBillableHours(date: string, start: string, end: string): number {
  return Math.max(1, Math.ceil(calcDurationHours(date, start, end)));
}

function hallRate(h: { individualBookingRate?: number; hourlyRate?: number } | undefined): number {
  return h?.individualBookingRate ?? h?.hourlyRate ?? 0;
}

function minBookingHours(h: { minBookingDuration?: number; minBookingHours?: number } | undefined): number {
  return h?.minBookingDuration ?? h?.minBookingHours ?? 1;
}

function computeHallAmount(
  hallIds: string[],
  packageId: string | undefined,
  date: string,
  start: string,
  end: string,
): number {
  if (packageId) {
    return packages.find((p) => p.id === packageId)?.price ?? 0;
  }
  const hours = calcBillableHours(date, start, end);
  return hallIds.reduce((sum, id) => {
    const h = initialHalls.find((x) => x.id === id);
    return sum + hallRate(h) * hours;
  }, 0);
}

function computeAdditionalServiceAmount(lines: HallAdditionalServiceLine[]): number {
  return lines.reduce((sum, l) => sum + l.amount, 0);
}

function computeMealAmount(
  mealPackageId: string | undefined,
  adultPax: number,
  childPax: number,
): number {
  if (!mealPackageId) return 0;
  const mp = mealPackagesMaster.find((m) => m.id === mealPackageId);
  if (!mp) return 0;
  return mp.pricePerPax * (adultPax + childPax);
}

function computeTotals(
  hallAmount: number,
  additionalServiceAmount: number,
  mealAmount: number,
  gstRate: number,
): { gstAmount: number; grandTotal: number } {
  const subtotal = hallAmount + additionalServiceAmount + mealAmount;
  const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  return { gstAmount, grandTotal: Math.round((subtotal + gstAmount) * 100) / 100 };
}

// ─── Add New Customer inline modal ─────────────────────────────────────────

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Customer) => void;
  existingCustomers: Customer[];
}

function AddCustomerModal({ open, onClose, onCreated, existingCustomers }: AddCustomerModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<Partial<Customer>>({});
  const [status, setStatus] = useState('Active');

  const reset = () => { setForm({}); setStatus('Active'); };

  const handleSave = () => {
    const name = form.name?.trim() ?? '';
    const mobile = form.mobile?.trim() ?? '';
    const email = form.email?.trim() ?? '';
    if (!name) return toast.error('Validation Error', 'Customer Name is required.');
    if (!mobile) return toast.error('Validation Error', 'Mobile Number is required.');
    if (!email) return toast.error('Validation Error', 'Email Address is required.');

    const nextNum = existingCustomers.length + 1;
    const code = `SSD-C${String(nextNum).padStart(4, '0')}`;
    const newCustomer: Customer = {
      id: 'cu-' + Math.random().toString(36).slice(2),
      code,
      name,
      mobile,
      email,
      status,
      dob: form.dob ?? '',
      gender: form.gender ?? '',
      familyMembers: [],
    };
    onCreated(newCustomer);
    toast.success('Customer created', `${name} has been added.`);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Add New Customer"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-outline" onClick={() => { reset(); onClose(); }}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave}>Save Customer</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Customer Code" hint="Auto-generated">
          <TextInput
            value={`SSD-C${String(existingCustomers.length + 1).padStart(4, '0')}`}
            disabled
          />
        </FormField>
        <FormField label="Customer Name" required>
          <TextInput
            value={form.name ?? ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </FormField>
        <FormField label="Mobile Number" required>
          <TextInput
            value={form.mobile ?? ''}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            placeholder="+65 XXXX XXXX"
          />
        </FormField>
        <FormField label="Email Address" required>
          <TextInput
            type="email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
          />
        </FormField>
        <FormField label="Date of Birth">
          <TextInput
            type="date"
            value={form.dob ?? ''}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
        </FormField>
        <FormField label="Gender">
          <Dropdown
            value={form.gender ?? ''}
            onChange={(v) => setForm({ ...form, gender: v })}
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
              { label: 'Other', value: 'Other' },
            ]}
            placeholder="Select Gender"
          />
        </FormField>
        <FormField label="Status">
          <Dropdown
            value={status}
            onChange={setStatus}
            options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
          />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Additional Service Line Row ─────────────────────────────────────────────

interface ServiceLineRowProps {
  line: HallAdditionalServiceLine;
  onChange: (updated: HallAdditionalServiceLine) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function ServiceLineRow({ line, onChange, onRemove, disabled }: ServiceLineRowProps) {
  const svc = additionalServices.find((s) => s.id === line.serviceId);

  const handleQtyChange = (qty: number) => {
    const amount =
      line.pricingType === 'Fixed' ? line.rate : Math.round(line.rate * qty * 100) / 100;
    onChange({ ...line, quantity: qty, amount });
  };

  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded border border-brown-100 bg-cream-50 p-2 text-sm">
      <div className="col-span-4 font-medium text-brown-800">{line.serviceName}</div>
      <div className="col-span-2 text-brown-500">{line.pricingType}</div>
      <div className="col-span-2 text-right text-brown-700">S${line.rate.toFixed(2)}</div>
      <div className="col-span-2">
        {line.pricingType === 'Fixed' ? (
          <span className="text-brown-500">—</span>
        ) : (
          <TextInput
            type="number"
            min={1}
            value={String(line.quantity)}
            onChange={(e) => handleQtyChange(Math.max(1, Number(e.target.value)))}
            disabled={disabled}
            className="text-center"
          />
        )}
      </div>
      <div className="col-span-1 text-right font-medium text-brown-800">S${line.amount.toFixed(2)}</div>
      {!disabled && (
        <div className="col-span-1 flex justify-center">
          <button type="button" onClick={onRemove} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HallBooking() {
  const toast = useToast();

  // ── shared customer state (so new customers show immediately) ──
  const [allCustomers, setAllCustomers] = useState<Customer[]>(initialCustomers);

  const [bookings, setBookings] = useState<HallBookingRecord[]>(initialBookings);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // main booking modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallBookingRecord | null>(null);
  const [viewing, setViewing] = useState<HallBookingRecord | null>(null);
  const [form, setForm] = useState<Partial<HallBooking>>({});
  const [additionalServiceLines, setAdditionalServiceLines] = useState<HallAdditionalServiceLine[]>([]);

  // add-new-customer modal
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  // customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<HallBookingRecord | null>(null);

  // ── filtered bookings ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        !q ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.hallName.toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── active master data ─────────────────────────────────────────
  const activeHalls = initialHalls.filter((h) => h.status === 'Active');
  const activePackages = packages.filter((p) => p.status === 'Active');
  const activePurposes = hallPurposes.filter((p) => p.status === 'Active');
  const activeServices = additionalServices.filter((s) => s.status === 'Active');
  const activeGLs = glRecords.filter((g) => g.status === 'Active');
  const activeMealPackages = mealPackagesMaster.filter((m) => m.status === 'Active');
  const activePaymentModes = paymentModes.filter((m) => m.status === 'Active');

  // ── customer search dropdown ───────────────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return allCustomers
      .filter((c) => c.status === 'Active')
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.code.toLowerCase().includes(q),
      );
  }, [allCustomers, customerSearch]);

  // ── derived form values ────────────────────────────────────────
  const selectedHall = useMemo(() => {
    if (!form.hallIds || form.hallIds.length !== 1) return null;
    return initialHalls.find((h) => h.id === form.hallIds![0]) ?? null;
  }, [form.hallIds]);

  const selectedPackage = useMemo(
    () => (form.packageId ? packages.find((p) => p.id === form.packageId) ?? null : null),
    [form.packageId],
  );

  const packageHalls = useMemo(() => {
    if (!selectedPackage) return [];
    return selectedPackage.halls
      .map((id) => initialHalls.find((h) => h.id === id))
      .filter(Boolean) as typeof initialHalls;
  }, [selectedPackage]);

  const selectedGL = useMemo(
    () => activeGLs.find((g) => g.glCode === form.glCode),
    [form.glCode, activeGLs],
  );
  const gstRate = selectedGL?.gstRate ?? 0;

  // ── live billing calculation ───────────────────────────────────
  const billing = useMemo(() => {
    if (!form.eventDate || !form.startTime || !form.endTime) {
      return { hallAmount: 0, additionalServiceAmount: 0, mealAmount: 0, gstAmount: 0, grandTotal: 0 };
    }
    const hallAmount = computeHallAmount(
      form.hallIds ?? [],
      form.packageId,
      form.eventDate,
      form.startTime,
      form.endTime,
    );
    const additionalServiceAmount = computeAdditionalServiceAmount(additionalServiceLines);
    const mealAmount = form.mealsRequired
      ? computeMealAmount(form.mealPackageId, form.adultPax ?? 0, form.childPax ?? 0)
      : 0;
    const { gstAmount, grandTotal } = computeTotals(
      hallAmount,
      additionalServiceAmount,
      mealAmount,
      gstRate,
    );
    return { hallAmount, additionalServiceAmount, mealAmount, gstAmount, grandTotal };
  }, [
    form.eventDate,
    form.startTime,
    form.endTime,
    form.hallIds,
    form.packageId,
    form.mealsRequired,
    form.mealPackageId,
    form.adultPax,
    form.childPax,
    additionalServiceLines,
    gstRate,
  ]);

  // ── open / close helpers ───────────────────────────────────────
  const defaultForm = (): Partial<HallBooking> => ({
    bookingRef: generateBookingRef(bookings),
    eventDate: '',
    startTime: '',
    endTime: '',
    guests: undefined,
    mealsRequired: false,
    mealPackageId: activeMealPackages[0]?.id ?? '',
    mealType: 'Lunch',
    adultPax: 0,
    childPax: 0,
    glCode: activeGLs.find((g) => g.glCode === 'GL-2002')?.glCode ?? activeGLs[0]?.glCode ?? '',
    paymentMode: activePaymentModes[0]?.name ?? '',
    advanceAmount: 0,
    bookingStatus: 'Draft',
    paymentStatus: 'Pending',
    status: 'Booked',
  });

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setForm(defaultForm());
    setAdditionalServiceLines([]);
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
    setModalOpen(true);
  };

  const openEdit = (b: HallBookingRecord) => {
    setEditing(b);
    setViewing(null);
    setForm({ ...b });
    setAdditionalServiceLines(b.additionalServices ?? []);
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
    setModalOpen(true);
  };

  const openView = (b: HallBookingRecord) => {
    setViewing(b);
    setEditing(null);
    setForm({ ...b });
    setAdditionalServiceLines(b.additionalServices ?? []);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setViewing(null);
    setForm({});
    setAdditionalServiceLines([]);
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
  };

  // ── package auto-fill ─────────────────────────────────────────
  const handlePackageChange = (pkgId: string) => {
    if (!pkgId) {
      setForm((prev) => ({ ...prev, packageId: undefined, hallIds: [] }));
      return;
    }
    const pkg = packages.find((p) => p.id === pkgId);
    setForm((prev) => ({
      ...prev,
      packageId: pkgId,
      hallIds: pkg ? [...pkg.halls] : [],
      purpose: pkg?.purpose ?? prev.purpose,
      glCode: pkg?.glCode ?? prev.glCode,
    }));
  };

  // ── hall selection ─────────────────────────────────────────────
  const handleHallChange = (hallId: string) => {
    setForm((prev) => ({ ...prev, hallIds: hallId ? [hallId] : [], packageId: undefined }));
  };

  // ── additional service add ─────────────────────────────────────
  const addService = (serviceId: string) => {
    if (!serviceId) return;
    if (additionalServiceLines.some((l) => l.serviceId === serviceId)) {
      toast.error('Duplicate', 'This service is already added.');
      return;
    }
    const svc = additionalServices.find((s) => s.id === serviceId);
    if (!svc) return;
    const isFixed = svc.pricingType === 'Fixed';
    const newLine: HallAdditionalServiceLine = {
      serviceId: svc.id,
      serviceName: svc.name,
      pricingType: svc.pricingType ?? 'Fixed',
      rate: svc.rate ?? 0,
      quantity: 1,
      amount: svc.rate ?? 0,
    };
    setAdditionalServiceLines((prev) => [...prev, newLine]);
  };

  // ── new customer created callback ──────────────────────────────
  const handleCustomerCreated = (c: Customer) => {
    setAllCustomers((prev) => [c, ...prev]);
    setForm((prev) => ({ ...prev, customerId: c.id }));
    setCustomerSearch(c.name);
    setCustomerDropdownOpen(false);
  };

  // ── save ───────────────────────────────────────────────────────
  const handleSave = () => {
    const isView = !!viewing;
    if (isView) return closeModal();

    // Required fields
    if (!form.customerId) return toast.error('Validation Error', 'Customer is required.');
    if (!form.eventDate) return toast.error('Validation Error', 'Event Date is required.');
    if (!editing && form.eventDate < todayLocalDate())
      return toast.error('Validation Error', 'Past dates are not allowed for new bookings.');
    if (!form.startTime) return toast.error('Validation Error', 'Start Time is required.');
    if (!form.endTime) return toast.error('Validation Error', 'End Time is required.');
    if (form.startTime >= form.endTime)
      return toast.error('Validation Error', 'End Time must be later than Start Time.');

    const hasPackage = !!form.packageId;
    const selectedHallIds = form.hallIds ?? [];

    if (hasPackage) {
      const pkg = packages.find((p) => p.id === form.packageId);
      if (!pkg || pkg.status !== 'Active')
        return toast.error('Validation Error', 'Select an active hall package.');
      if (!selectedHallIds.length)
        return toast.error('Validation Error', 'The selected package has no halls configured.');
    } else if (selectedHallIds.length !== 1) {
      return toast.error('Validation Error', 'Select an individual hall or a hall package.');
    }

    if (!form.purpose) return toast.error('Validation Error', 'Hall Purpose is required.');
    if (!Number.isFinite(Number(form.guests)) || Number(form.guests) <= 0)
      return toast.error('Validation Error', 'Number of Guests must be a positive number.');

    // Hall capacity validation
    for (const hid of selectedHallIds) {
      const h = initialHalls.find((x) => x.id === hid);
      if (h && Number(form.guests) > (h.seatingCapacity ?? 0))
        return toast.error(
          'Capacity Exceeded',
          `Number of guests (${form.guests}) exceeds capacity of "${h.name}" (${h.seatingCapacity}).`,
        );
    }

    // Active hall check
    for (const hid of selectedHallIds) {
      if (initialHalls.find((h) => h.id === hid)?.status !== 'Active')
        return toast.error('Validation Error', 'Only active halls can be booked.');
    }

    // Minimum booking duration — individual hall only
    if (!hasPackage && form.eventDate && form.startTime && form.endTime) {
      const hall = initialHalls.find((h) => h.id === selectedHallIds[0]);
      const duration = calcDurationHours(form.eventDate, form.startTime, form.endTime);
      const minHours = minBookingHours(hall);
      if (duration < minHours) {
        return toast.error(
          'Minimum Duration',
          `"${hall?.name ?? 'Hall'}" requires a minimum booking duration of ${minHours} hour${minHours !== 1 ? 's' : ''}.`,
        );
      }
    }

    const bookingStatus = (form.bookingStatus as HallBooking['bookingStatus']) ?? 'Draft';

    // Availability check — confirmed bookings and active hall exceptions
    if (bookingStatus === 'Confirmed') {
      const availability = checkHallsAvailability(
        selectedHallIds,
        form.eventDate!,
        form.startTime!,
        form.endTime!,
        bookings,
        hallExceptions,
        editing?.id,
      );
      if (!availability.available) {
        return toast.error(availability.message, availability.detail);
      }
    }

    // Meals validation
    if (form.mealsRequired) {
      if (!form.mealPackageId)
        return toast.error('Validation Error', 'Meal Package is required when Meals Required is Yes.');
      if (!form.mealType)
        return toast.error('Validation Error', 'Meal Type is required when Meals Required is Yes.');
      if (!Number.isFinite(Number(form.adultPax)) || Number(form.adultPax) < 0)
        return toast.error('Validation Error', 'Adult Pax must be a non-negative number.');
      if (!Number.isFinite(Number(form.childPax)) || Number(form.childPax) < 0)
        return toast.error('Validation Error', 'Child Pax must be a non-negative number.');
      if ((form.adultPax ?? 0) + (form.childPax ?? 0) === 0)
        return toast.error('Validation Error', 'At least one Adult Pax or Child Pax is required.');
      const mealPkg = mealPackagesMaster.find((m) => m.id === form.mealPackageId);
      const totalPax = (form.adultPax ?? 0) + (form.childPax ?? 0);
      if (mealPkg && totalPax < mealPkg.minimumPax) {
        return toast.error(
          'Validation Error',
          `Pax count must be at least ${mealPkg.minimumPax} for the selected meal package.`,
        );
      }
    }

    if (!form.glCode)
      return toast.error('Validation Error', 'GL is required for billing.');

    const advAmt = Number(form.advanceAmount ?? 0);
    if (!Number.isFinite(advAmt) || advAmt < 0)
      return toast.error('Validation Error', 'Advance Amount must be non-negative.');
    if (advAmt > billing.grandTotal)
      return toast.error('Validation Error', 'Advance Amount cannot exceed Grand Total.');

    const customer = allCustomers.find((c) => c.id === form.customerId);
    const hallNames = initialHalls
      .filter((h) => selectedHallIds.includes(h.id))
      .map((h) => h.name)
      .join(', ');
    const pkg = packages.find((p) => p.id === form.packageId);
    const purposeName = hallPurposes.find((p) => p.id === form.purpose)?.name ?? '';

    // Derive payment status from advance amount
    let paymentStatus: HallBooking['paymentStatus'] = 'Pending';
    if (advAmt > 0 && advAmt < billing.grandTotal) paymentStatus = 'Partially Paid';
    else if (advAmt > 0 && advAmt >= billing.grandTotal) paymentStatus = 'Paid';

    const record: HallBookingRecord = {
      id: editing?.id ?? 'hb-' + Math.random().toString(36).slice(2),
      bookingRef: form.bookingRef as string,
      customerId: form.customerId as string,
      customerName: customer?.name ?? '',
      mobileNumber: customer?.mobile ?? '',
      eventName: pkg?.name ?? purposeName,
      hallIds: selectedHallIds,
      hallName: hallNames,
      hallPackage: pkg?.name ?? '',
      hallPurpose: purposeName,
      packageId: form.packageId,
      purpose: form.purpose,
      eventDate: form.eventDate as string,
      startTime: form.startTime as string,
      endTime: form.endTime as string,
      guests: Number(form.guests),
      mealsRequired: !!form.mealsRequired,
      mealPackageId: form.mealsRequired ? form.mealPackageId : undefined,
      mealType: form.mealsRequired ? form.mealType : undefined,
      adultPax: form.mealsRequired ? Number(form.adultPax ?? 0) : undefined,
      childPax: form.mealsRequired ? Number(form.childPax ?? 0) : undefined,
      additionalServices: additionalServiceLines,
      glCode: form.glCode,
      hallAmount: billing.hallAmount,
      additionalServiceAmount: billing.additionalServiceAmount,
      mealAmount: billing.mealAmount,
      gstRate,
      gstAmount: billing.gstAmount,
      grandTotal: billing.grandTotal,
      advanceAmount: advAmt,
      paymentMode: form.paymentMode,
      status: advAmt >= billing.grandTotal ? 'Paid' : advAmt > 0 ? 'Partially Paid' : 'Booked',
      paymentStatus,
      bookingStatus,
      totalAmount: billing.grandTotal,
      paidAmount: advAmt,
      depositAmount: form.depositAmount ?? 0,
      amount: billing.grandTotal,
      cancellationDetails: editing?.cancellationDetails,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    if (editing) {
      setBookings((prev) => prev.map((b) => (b.id === editing.id ? record : b)));
      toast.success('Booking updated');
    } else {
      setBookings((prev) => [record, ...prev]);
      toast.success('Booking created');
    }
    closeModal();
  };

  // ── delete / cancel ────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === deleteTarget.id
          ? { ...b, status: 'Cancelled', bookingStatus: 'Cancelled' }
          : b,
      ),
    );
    toast.success('Booking cancelled');
    setDeleteTarget(null);
  };

  // ── modal is view-only ─────────────────────────────────────────
  const isReadOnly = !!viewing;

  // ── GL reference required modes ─────────────────────────────────
  const referenceRequiredModes = ['Online', 'UPI', 'Card', 'Bank Transfer', 'PayNow', 'DBS', 'NETS'];

  // ── table columns ──────────────────────────────────────────────
  const columns: Column<HallBookingRecord>[] = [
    {
      key: 'ref',
      header: 'Booking Ref',
      render: (b) => <span className="font-medium text-brown-800">{b.bookingRef}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => (
        <div>
          <p className="text-brown-800">{b.customerName}</p>
          <p className="text-xs text-brown-400">{b.mobileNumber}</p>
        </div>
      ),
    },
    {
      key: 'event',
      header: 'Event Date',
      render: (b) => (
        <div>
          <p className="text-brown-800">{b.eventDate}</p>
          <p className="text-xs text-brown-400">{formatTime(b.startTime)} – {formatTime(b.endTime)}</p>
        </div>
      ),
    },
    { key: 'hall', header: 'Hall', render: (b) => <span className="text-brown-700">{b.hallName}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (b) => <span className="font-medium">S${(b.grandTotal ?? b.totalAmount ?? 0).toFixed(2)}</span>,
    },
    { key: 'payment', header: 'Payment', render: (b) => <StatusBadge status={b.paymentStatus} /> },
    { key: 'booking', header: 'Status', render: (b) => <StatusBadge status={b.bookingStatus} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (b) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openView(b)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(b)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="Edit"
            disabled={b.bookingStatus === 'Cancelled'}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(b)}
            className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
            title="Cancel"
            disabled={b.bookingStatus === 'Cancelled'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── modal title ────────────────────────────────────────────────
  const modalTitle = viewing ? 'View Booking' : editing ? 'Edit Booking' : 'Add Booking';

  // ── selected customer display ──────────────────────────────────
  const selectedCustomer = allCustomers.find((c) => c.id === form.customerId);

  // ── available services not yet added ──────────────────────────
  const availableToAdd = activeServices.filter(
    (s) => !additionalServiceLines.some((l) => l.serviceId === s.id),
  );

  return (
    <div>
      <PageHeader
        title="Hall Booking"
        description="Create and manage hall bookings"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Booking
          </button>
        }
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search booking ref, customer or hall..."
          filters={[]}
        />
      </div>

      <HallBookingCalendar bookings={bookings} exceptions={hallExceptions} />

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

      {/* ── Add / Edit / View Booking Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
        footer={
          isReadOnly ? (
            <button type="button" className="btn-outline" onClick={closeModal}>Close</button>
          ) : (
            <>
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSave}>Save</button>
            </>
          )
        }
      >
        <div className="space-y-6">

          {/* ── Section: Booking Details ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Booking Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Booking Reference — auto-generated, read-only */}
              <FormField label="Booking Reference" required hint="Auto-generated">
                <TextInput value={form.bookingRef ?? ''} readOnly className="bg-cream-50" />
              </FormField>

              {/* Customer — search + add new */}
              <FormField label="Customer" required>
                {isReadOnly ? (
                  <TextInput value={selectedCustomer?.name ?? form.customerId ?? ''} readOnly />
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />
                      <input
                        type="text"
                        className="input pl-9"
                        placeholder="Search by name, mobile or code..."
                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setForm((prev) => ({ ...prev, customerId: undefined }));
                          setCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                      />
                      {form.customerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, customerId: undefined }));
                            setCustomerSearch('');
                            setCustomerDropdownOpen(false);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-brown-300 hover:text-brown-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {customerDropdownOpen && !form.customerId && (
                      <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-brown-100 bg-white py-1 shadow-lg">
                        {filteredCustomers.length === 0 && (
                          <div className="px-3 py-2 text-sm text-brown-400">No customers found.</div>
                        )}
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-cream-100"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, customerId: c.id }));
                              setCustomerSearch('');
                              setCustomerDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium text-brown-800">{c.name}</span>
                            <span className="text-xs text-brown-400">{c.code} · {c.mobile}</span>
                          </button>
                        ))}
                        <div className="border-t border-brown-50 px-2 py-1">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-maroon-600 hover:bg-maroon-50"
                            onClick={() => { setCustomerDropdownOpen(false); setAddCustomerOpen(true); }}
                          >
                            <UserPlus className="h-4 w-4" />
                            + Add New Customer
                          </button>
                        </div>
                      </div>
                    )}
                    {form.customerId && selectedCustomer && (
                      <p className="mt-1 text-xs text-brown-400">
                        {selectedCustomer.code} · {selectedCustomer.mobile}
                      </p>
                    )}
                  </div>
                )}
              </FormField>

              <FormField label="Event Date" required>
                <input
                  type="date"
                  value={form.eventDate ?? ''}
                  min={!editing ? todayLocalDate() : undefined}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="input"
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Start Time" required>
                <input
                  type="time"
                  value={form.startTime ?? ''}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="input"
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="End Time" required>
                <input
                  type="time"
                  value={form.endTime ?? ''}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="input"
                  disabled={isReadOnly}
                />
              </FormField>
            </div>
          </section>

          {/* ── Section: Hall Details ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Hall Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">

              <FormField label="Hall Package" hint="Select a package OR an individual hall below">
                {isReadOnly ? (
                  <TextInput value={selectedPackage?.name ?? '—'} readOnly />
                ) : (
                  <select
                    value={form.packageId ?? ''}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="input"
                  >
                    <option value="">Individual Hall (no package)</option>
                    {activePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — S${(p.price ?? 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              {form.packageId ? (
                <FormField label="Included Halls" hint="Auto-selected from package">
                  <TextInput
                    value={packageHalls.map((h) => h.name).join(', ') || '—'}
                    readOnly
                    className="bg-cream-50"
                  />
                  {selectedPackage && (
                    <p className="mt-1 text-xs text-brown-400">
                      Package price: S${(selectedPackage.price ?? 0).toFixed(2)} (fixed)
                    </p>
                  )}
                </FormField>
              ) : (
                <FormField label="Hall" required>
                  {isReadOnly ? (
                    <TextInput
                      value={form.hallIds?.map((id) => initialHalls.find((h) => h.id === id)?.name).join(', ') ?? '—'}
                      readOnly
                    />
                  ) : (
                    <select
                      value={form.hallIds?.[0] ?? ''}
                      onChange={(e) => handleHallChange(e.target.value)}
                      className="input"
                    >
                      <option value="">Select hall</option>
                      {activeHalls.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} (Cap: {h.seatingCapacity})
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedHall && (
                    <p className="mt-1 text-xs text-brown-400">
                      Capacity: {selectedHall.seatingCapacity} · Rate: S${hallRate(selectedHall)}/hr
                      · Min duration: {minBookingHours(selectedHall)} hr
                    </p>
                  )}
                </FormField>
              )}

              <FormField label="Hall Purpose" required>
                {isReadOnly ? (
                  <TextInput value={hallPurposes.find((p) => p.id === form.purpose)?.name ?? '—'} readOnly />
                ) : (
                  <select
                    value={form.purpose ?? ''}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="input"
                  >
                    <option value="">Select purpose</option>
                    {activePurposes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField label="Number of Guests" required>
                <TextInput
                  type="number"
                  min={1}
                  value={form.guests !== undefined ? String(form.guests) : ''}
                  onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                  placeholder="e.g. 150"
                  disabled={isReadOnly}
                />
                {!!form.guests &&
                  form.guests > 0 &&
                  (form.packageId ? packageHalls : selectedHall ? [selectedHall] : []).some(
                    (h) => Number(form.guests) > (h.seatingCapacity ?? 0),
                  ) && (
                    <p className="mt-1 text-xs text-red-600">
                      Exceeds capacity of one or more selected halls.
                    </p>
                  )}
              </FormField>
            </div>
          </section>

          {/* ── Section: Additional Services ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Additional Services</h3>

            {!isReadOnly && availableToAdd.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <select
                  className="input max-w-xs"
                  defaultValue=""
                  onChange={(e) => { addService(e.target.value); e.currentTarget.value = ''; }}
                >
                  <option value="">Add a service...</option>
                  {availableToAdd.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.pricingType}) — S${(s.rate ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {additionalServiceLines.length === 0 ? (
              <p className="text-sm text-brown-400">No additional services added.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium uppercase text-brown-400">
                  <div className="col-span-4">Service</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2">Qty / Hrs</div>
                  <div className="col-span-1 text-right">Amount</div>
                  {!isReadOnly && <div className="col-span-1" />}
                </div>
                {additionalServiceLines.map((line, i) => (
                  <ServiceLineRow
                    key={line.serviceId}
                    line={line}
                    onChange={(updated) =>
                      setAdditionalServiceLines((prev) =>
                        prev.map((l, idx) => (idx === i ? updated : l)),
                      )
                    }
                    onRemove={() =>
                      setAdditionalServiceLines((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    disabled={isReadOnly}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Meals ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Meals</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Meals Required">
                <div className={isReadOnly ? 'pointer-events-none opacity-60' : undefined}>
                  <Toggle
                    checked={!!form.mealsRequired}
                    onChange={(v) => setForm({ ...form, mealsRequired: v })}
                    trueLabel="Yes"
                    falseLabel="No"
                  />
                </div>
              </FormField>

              {form.mealsRequired && (
                <>
                  <FormField label="Meal Package" required>
                    {isReadOnly ? (
                      <TextInput value={mealPackagesMaster.find((m) => m.id === form.mealPackageId)?.name ?? '—'} readOnly />
                    ) : (
                      <select
                        value={form.mealPackageId ?? ''}
                        onChange={(e) => setForm({ ...form, mealPackageId: e.target.value })}
                        className="input"
                      >
                        <option value="">Select meal package</option>
                        {activeMealPackages.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — S${m.pricePerPax}/pax (min {m.minimumPax})
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>

                  <FormField label="Meal Type" required>
                    {isReadOnly ? (
                      <TextInput value={form.mealType ?? '—'} readOnly />
                    ) : (
                      <select
                        value={form.mealType ?? ''}
                        onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                        className="input"
                      >
                        <option value="">Select meal type</option>
                        {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </FormField>

                  <FormField label="Adult Pax" required>
                    <TextInput
                      type="number"
                      min={0}
                      value={form.adultPax !== undefined ? String(form.adultPax) : ''}
                      onChange={(e) => setForm({ ...form, adultPax: Number(e.target.value) })}
                      disabled={isReadOnly}
                    />
                  </FormField>

                  <FormField label="Child Pax" required>
                    <TextInput
                      type="number"
                      min={0}
                      value={form.childPax !== undefined ? String(form.childPax) : ''}
                      onChange={(e) => setForm({ ...form, childPax: Number(e.target.value) })}
                      disabled={isReadOnly}
                    />
                  </FormField>
                </>
              )}
            </div>
          </section>

          {/* ── Section: Billing ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Billing</h3>
            <div className="grid gap-4 sm:grid-cols-2">

              <FormField label="GL" required>
                {isReadOnly ? (
                  <TextInput value={form.glCode ? `${form.glCode} — ${glRecords.find((g) => g.glCode === form.glCode)?.glName ?? ''}` : '—'} readOnly />
                ) : (
                  <select
                    value={form.glCode ?? ''}
                    onChange={(e) => setForm({ ...form, glCode: e.target.value })}
                    className="input"
                  >
                    <option value="">Select GL</option>
                    {activeGLs.map((g) => (
                      <option key={g.glCode} value={g.glCode}>
                        {g.glCode} — {g.glName} ({g.gstType}{g.gstRate ? ` ${g.gstRate}%` : ''})
                      </option>
                    ))}
                  </select>
                )}
                {selectedGL && (
                  <p className="mt-1 text-xs text-brown-400">
                    GST: {selectedGL.gstType} ({selectedGL.gstRate ?? 0}%)
                  </p>
                )}
              </FormField>

              {/* Billing summary — read-only calculated block */}
              <div className="sm:col-span-2 rounded-lg border border-brown-100 bg-cream-50 p-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-brown-600">
                    {form.packageId ? 'Package Amount' : 'Hall Amount'}
                  </span>
                  <span className="text-right font-medium text-brown-800">
                    S${billing.hallAmount.toFixed(2)}
                  </span>
                  <span className="text-brown-600">Additional Services</span>
                  <span className="text-right font-medium text-brown-800">
                    S${billing.additionalServiceAmount.toFixed(2)}
                  </span>
                  <span className="text-brown-600">Meal Amount</span>
                  <span className="text-right font-medium text-brown-800">
                    S${billing.mealAmount.toFixed(2)}
                  </span>
                  <span className="text-brown-600">
                    GST{selectedGL ? ` (${selectedGL.gstType}${selectedGL.gstRate ? ` ${selectedGL.gstRate}%` : ''})` : ` (${gstRate}%)`}
                  </span>
                  <span className="text-right font-medium text-brown-800">
                    S${billing.gstAmount.toFixed(2)}
                  </span>
                  <span className="border-t border-brown-100 pt-2 text-base font-semibold text-brown-900">
                    Grand Total
                  </span>
                  <span className="border-t border-brown-100 pt-2 text-right text-base font-bold text-maroon-700">
                    S${billing.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Payment ── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brown-500">Payment</h3>
            <div className="grid gap-4 sm:grid-cols-2">

              <FormField label="Advance Amount">
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.advanceAmount !== undefined ? String(form.advanceAmount) : ''}
                  onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Payment Mode">
                {isReadOnly ? (
                  <TextInput value={form.paymentMode ?? '—'} readOnly />
                ) : (
                  <select
                    value={form.paymentMode ?? ''}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="input"
                  >
                    <option value="">Select payment mode</option>
                    {activePaymentModes.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                )}
              </FormField>

              {form.paymentMode && referenceRequiredModes.includes(form.paymentMode) && (
                <FormField label="Payment Reference" required>
                  <TextInput
                    value={(form as any).paymentReference ?? ''}
                    onChange={(e) => setForm({ ...form, paymentReference: e.target.value } as any)}
                    placeholder="Transaction / Reference number"
                    disabled={isReadOnly}
                  />
                </FormField>
              )}

              {/* Payment Status — system-controlled, read-only */}
              <FormField label="Payment Status" hint="Derived from advance amount">
                <TextInput
                  value={
                    (form.advanceAmount ?? 0) <= 0
                      ? 'Pending'
                      : (form.advanceAmount ?? 0) >= billing.grandTotal
                      ? 'Paid'
                      : 'Partially Paid'
                  }
                  readOnly
                  className="bg-cream-50"
                />
              </FormField>

              {/* Booking Status */}
              <FormField label="Booking Status" required hint="Draft bookings do not block the hall">
                {isReadOnly ? (
                  <TextInput value={form.bookingStatus ?? '—'} readOnly />
                ) : (
                  <select
                    value={form.bookingStatus ?? 'Draft'}
                    onChange={(e) =>
                      setForm({ ...form, bookingStatus: e.target.value as HallBooking['bookingStatus'] })
                    }
                    className="input"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                )}
              </FormField>

            </div>
          </section>

        </div>
      </Modal>

      {/* ── Add New Customer Modal ── */}
      <AddCustomerModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onCreated={handleCustomerCreated}
        existingCustomers={allCustomers}
      />

      {/* ── Cancel Confirm ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Cancel Booking"
        message={`Cancel booking "${deleteTarget?.bookingRef ?? ''}"? This will release the hall slot.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep"
        variant="danger"
      />
    </div>
  );
}

export default HallBooking;
