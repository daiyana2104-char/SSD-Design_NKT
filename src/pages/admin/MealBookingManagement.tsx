import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Dropdown, FormField, TextInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore } from '@/lib/adminStore';
import { customers } from '@/lib/mockData';
import {
  MealBookingRecord,
  MealCustomizationLine,
  MealAdditionalLine,
  FoodPackage,
  MenuItem,
  loadFoodPackages,
  loadMenuItems,
  loadMealBookings,
  saveMealBookings,
  generateMealBookingRef,
  todayLocalDate,
  defaultCustomizations,
  recalcCustomizationLine,
  computeFoodTotals,
  deriveMealPaymentStatus,
  buildAdditionalLine,
} from '@/lib/mealFoodUtils';

const PAYMENT_MODES = ['NETS Terminal', 'PayNow', 'Cash', 'Other'];
const NETS_SUBTYPES = ['QR', 'Debit Card', 'Credit Card'];

function loadMealCategories() {
  try {
    const saved = localStorage.getItem('meal_categories');
    if (saved) return JSON.parse(saved) as { id: string; name: string; status: string }[];
  } catch {
    /* ignore */
  }
  return [
    { id: 'mc1', name: 'Breakfast', status: 'Active' },
    { id: 'mc2', name: 'Lunch', status: 'Active' },
    { id: 'mc3', name: 'Dinner', status: 'Active' },
  ];
}

function emptyBooking(ref: string): MealBookingRecord {
  return {
    id: '',
    reference: ref,
    customerId: '',
    eventDate: todayLocalDate(),
    foodRequired: false,
    packageAmount: 0,
    customizationAdjustment: 0,
    additionalFoodAmount: 0,
    gst: 0,
    foodGrandTotal: 0,
    amountPaid: 0,
    paymentStatus: 'Pending',
    bookingStatus: 'Draft',
  };
}

function formatMoney(n: number) {
  return `S$${n.toFixed(2)}`;
}

export function MealBookingManagement() {
  const toast = useToast();
  const { user } = useAdminStore();
  const [bookings, setBookings] = useState<MealBookingRecord[]>(() => loadMealBookings());
  const packages = useMemo(() => loadFoodPackages(), []);
  const menuItems = useMemo(() => loadMenuItems(), []);
  const categories = useMemo(() => loadMealCategories(), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MealBookingRecord>(() => emptyBooking(generateMealBookingRef(loadMealBookings())));
  const [customizations, setCustomizations] = useState<MealCustomizationLine[]>([]);
  const [additionalItems, setAdditionalItems] = useState<MealAdditionalLine[]>([]);
  const [collectPayment, setCollectPayment] = useState(false);
  const [depositInput, setDepositInput] = useState('');
  const [advanceInput, setAdvanceInput] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentSubtype, setPaymentSubtype] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [addItemId, setAddItemId] = useState('');
  const [addItemQty, setAddItemQty] = useState('1');

  const [filterRef, setFilterRef] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const isConfirmed = form.bookingStatus === 'Confirmed';
  const isEditing = !!form.id;
  const paxCount = Number(form.paxCount ?? 0);
  const activePackages = packages.filter((p) => p.status === 'Active');
  const activeItems = menuItems.filter((i) => i.status === 'Active');
  const activeCustomers = customers.filter((c) => c.status === 'Active');

  const selectedPackage = packages.find((p) => p.id === form.packageId);
  const snapshotPrice = isConfirmed ? form.snapshotPackagePricePerPax : undefined;

  const totals = form.foodRequired && form.packageId && paxCount > 0
    ? computeFoodTotals({
        packageId: form.packageId,
        paxCount,
        packages,
        customizations,
        additionalItems,
        useSnapshotPrice: snapshotPrice,
        gstApplicable: selectedPackage?.gstApplicable,
      })
    : { packageAmount: 0, customizationAdjustment: 0, additionalFoodAmount: 0, gst: 0, foodGrandTotal: 0, pricePerPax: 0 };

  const persist = (next: MealBookingRecord[]) => {
    setBookings(next);
    saveMealBookings(next);
  };

  const openCreate = () => {
    const ref = generateMealBookingRef(bookings);
    setForm(emptyBooking(ref));
    setCustomizations([]);
    setAdditionalItems([]);
    setCollectPayment(false);
    setDepositInput('');
    setAdvanceInput('');
    setPaymentMode('');
    setPaymentSubtype('');
    setPaymentReference('');
    setPaymentRemarks('');
    setModalOpen(true);
  };

  const openEdit = (row: MealBookingRecord) => {
    setForm({ ...row });
    setCustomizations(row.customizations ?? []);
    setAdditionalItems(row.additionalItems ?? []);
    setCollectPayment(false);
    setDepositInput(String(row.depositAmount ?? ''));
    setAdvanceInput(String(row.advanceAmount ?? ''));
    setPaymentMode(row.paymentMode ?? '');
    setPaymentSubtype(row.paymentSubtype ?? '');
    setPaymentReference(row.paymentReference ?? '');
    setPaymentRemarks(row.paymentRemarks ?? '');
    setModalOpen(true);
  };

  const onFoodRequiredChange = (yes: boolean) => {
    setForm((f) => ({
      ...f,
      foodRequired: yes,
      packageId: yes ? f.packageId : undefined,
      paxCount: yes ? f.paxCount : undefined,
    }));
    if (!yes) {
      setCustomizations([]);
      setAdditionalItems([]);
    }
  };

  const onPackageChange = (packageId: string) => {
    if (isConfirmed) return;
    setForm((f) => ({ ...f, packageId }));
    setCustomizations(defaultCustomizations(packageId, menuItems, packages));
    setAdditionalItems([]);
  };

  const onPaxChange = (value: string) => {
    const pax = Number(value);
    setForm((f) => ({ ...f, paxCount: pax }));
    if (!isConfirmed) {
      setCustomizations((lines) =>
        lines.map((line) => recalcCustomizationLine(line, pax, menuItems)),
      );
      setAdditionalItems((lines) =>
        lines.map((line) => {
          const item = menuItems.find((i) => i.id === line.itemId);
          if (!item) return line;
          return buildAdditionalLine(item, line.quantity, pax);
        }),
      );
    }
  };

  const removeCustomization = (idx: number) => {
    if (isConfirmed) return;
    setCustomizations((lines) => {
      const next = [...lines];
      const line = { ...next[idx], action: 'removed' as const };
      next[idx] = recalcCustomizationLine(line, paxCount, menuItems);
      return next;
    });
  };

  const restoreCustomization = (idx: number) => {
    if (isConfirmed) return;
    setCustomizations((lines) => {
      const next = [...lines];
      const line = {
        ...next[idx],
        action: 'included' as const,
        replacementItemId: undefined,
        replacementItemName: undefined,
        replacementCost: undefined,
        replacementPricingBasis: undefined,
      };
      next[idx] = recalcCustomizationLine(line, paxCount, menuItems);
      return next;
    });
  };

  const replaceCustomization = (idx: number, replacementId: string) => {
    if (isConfirmed) return;
    const replacement = menuItems.find((i) => i.id === replacementId);
    setCustomizations((lines) => {
      const next = [...lines];
      const line = {
        ...next[idx],
        action: 'replaced' as const,
        replacementItemId: replacementId,
        replacementItemName: replacement?.name,
        replacementCost: replacement?.cost ?? 0,
        replacementPricingBasis: replacement?.pricingBasis ?? 'Per Pax',
      };
      next[idx] = recalcCustomizationLine(line, paxCount, menuItems);
      return next;
    });
  };

  const addAdditionalItem = () => {
    if (isConfirmed) return;
    const item = menuItems.find((i) => i.id === addItemId);
    if (!item) return toast.error('Validation', 'Select a menu item.');
    const qty = Number(addItemQty);
    if (!Number.isFinite(qty) || qty <= 0) return toast.error('Validation', 'Quantity must be positive.');
    const line = buildAdditionalLine(item, qty, paxCount);
    setAdditionalItems((prev) => [...prev, line]);
    setAddItemId('');
    setAddItemQty('1');
  };

  const removeAdditionalItem = (idx: number) => {
    if (isConfirmed) return;
    setAdditionalItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): string | null => {
    if (!form.eventDate) return 'Event Date is required.';
    if (!isEditing && form.eventDate < todayLocalDate()) return 'Past dates are not allowed for new bookings.';
    if (!form.customerId) return 'Customer is required.';
    if (form.foodRequired) {
      if (!form.packageId) return 'Food Package is required when Food Required is Yes.';
      if (!Number.isInteger(paxCount) || paxCount <= 0) return 'Pax Count must be a positive whole number.';
      const pkg = packages.find((p) => p.id === form.packageId);
      if (pkg && paxCount < pkg.minimumPax) {
        return `Minimum ${pkg.minimumPax} Pax is required for the selected Food Package.`;
      }
    }
    if (form.bookingStatus === 'Confirmed') {
      if (collectPayment) {
        const deposit = Number(depositInput) || 0;
        const advance = Number(advanceInput) || 0;
        if (deposit + advance > 0) {
          if (!paymentMode) return 'Payment Mode is required when collecting payment.';
          if (paymentMode === 'NETS Terminal' && !paymentSubtype) return 'Payment Subtype is required for NETS Terminal.';
          if (paymentMode === 'Other' && !paymentRemarks.trim()) return 'Remarks are required when Payment Mode is Other.';
        }
      }
    }
    return null;
  };

  const save = (asConfirmed: boolean) => {
    const status = asConfirmed ? 'Confirmed' : form.bookingStatus === 'Confirmed' ? 'Confirmed' : 'Draft';
    if (asConfirmed || status === 'Confirmed') {
      const err = validate();
      if (err) return toast.error('Validation Error', err);
    } else {
      if (!form.eventDate || !form.customerId) return toast.error('Validation Error', 'Event Date and Customer are required.');
    }

    const deposit = collectPayment ? Number(depositInput) || 0 : form.depositAmount ?? 0;
    const advance = collectPayment ? Number(advanceInput) || 0 : form.advanceAmount ?? 0;
    const newPaid = deposit + advance;
    const amountPaid = isEditing && !collectPayment ? form.amountPaid : newPaid;

    const foodTotals = form.foodRequired && form.packageId && paxCount > 0
      ? totals
      : {
          packageAmount: 0,
          customizationAdjustment: 0,
          additionalFoodAmount: 0,
          gst: 0,
          foodGrandTotal: 0,
          pricePerPax: 0,
        };

    const record: MealBookingRecord = {
      ...form,
      bookingStatus: status,
      packageAmount: foodTotals.packageAmount,
      customizationAdjustment: foodTotals.customizationAdjustment,
      additionalFoodAmount: foodTotals.additionalFoodAmount,
      gst: foodTotals.gst,
      foodGrandTotal: foodTotals.foodGrandTotal,
      customizations: form.foodRequired ? customizations : [],
      additionalItems: form.foodRequired ? additionalItems : [],
      depositAmount: deposit > 0 ? deposit : undefined,
      advanceAmount: advance > 0 ? advance : undefined,
      amountPaid,
      paymentMode: collectPayment && newPaid > 0 ? paymentMode : form.paymentMode,
      paymentSubtype: collectPayment && paymentMode === 'NETS Terminal' ? paymentSubtype : form.paymentSubtype,
      paymentReference: collectPayment && newPaid > 0 ? paymentReference : form.paymentReference,
      paymentRemarks: collectPayment && paymentMode === 'Other' ? paymentRemarks : form.paymentRemarks,
      paymentStatus: deriveMealPaymentStatus(foodTotals.foodGrandTotal, amountPaid),
      snapshotPackagePricePerPax:
        status === 'Confirmed' && form.foodRequired
          ? (form.snapshotPackagePricePerPax ?? selectedPackage?.pricePerPax ?? foodTotals.pricePerPax)
          : undefined,
      createdAt: form.createdAt ?? new Date().toISOString(),
      createdBy: form.createdBy ?? user?.name ?? 'Admin',
    };

    if (form.id) {
      persist(bookings.map((b) => (b.id === form.id ? { ...record, id: form.id } : b)));
      toast.success('Booking updated');
    } else {
      persist([...bookings, { ...record, id: `mb-${Date.now()}` }]);
      toast.success(status === 'Confirmed' ? 'Booking confirmed' : 'Booking saved as draft');
    }
    setModalOpen(false);
  };

  const cancelBooking = (id: string) => {
    persist(bookings.map((b) => (b.id === id ? { ...b, bookingStatus: 'Cancelled' } : b)));
    toast.success('Booking cancelled');
  };

  const filtered = bookings.filter((b) => {
    const cust = customers.find((c) => c.id === b.customerId);
    return (
      (!filterRef || b.reference.toLowerCase().includes(filterRef.toLowerCase())) &&
      (!filterCustomer || (cust?.name ?? '').toLowerCase().includes(filterCustomer.toLowerCase())) &&
      (!filterStatus || b.bookingStatus === filterStatus) &&
      (!filterPayment || b.paymentStatus === filterPayment)
    );
  });

  const columns: Column<MealBookingRecord>[] = [
    { key: 'reference', header: 'Reference' },
    { key: 'customer', header: 'Customer', render: (r) => customers.find((c) => c.id === r.customerId)?.name ?? '-' },
    { key: 'eventDate', header: 'Event Date' },
    { key: 'food', header: 'Food', render: (r) => r.foodRequired ? 'Yes' : 'No' },
    { key: 'package', header: 'Food Package', render: (r) => packages.find((p) => p.id === r.packageId)?.name ?? '-' },
    { key: 'pax', header: 'Pax', align: 'right', render: (r) => r.paxCount ?? '-' },
    { key: 'total', header: 'Food Total', align: 'right', render: (r) => formatMoney(r.foodGrandTotal) },
    { key: 'bookingStatus', header: 'Booking Status', render: (r) => <StatusBadge status={r.bookingStatus} /> },
    { key: 'paymentStatus', header: 'Payment Status', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button type="button" onClick={() => openEdit(r)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="Edit">
            <Edit className="h-4 w-4" />
          </button>
          {r.bookingStatus !== 'Cancelled' && (
            <button type="button" onClick={() => cancelBooking(r.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Cancel">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const minPaxError =
    form.foodRequired &&
    form.packageId &&
    selectedPackage &&
    paxCount > 0 &&
    paxCount < selectedPackage.minimumPax
      ? `Minimum ${selectedPackage.minimumPax} Pax is required for the selected Food Package.`
      : null;

  return (
    <div>
      <PageHeader
        title="Meal Booking"
        description="Manage food bookings with optional package customization"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        }
      />

      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput placeholder="Reference" value={filterRef} onChange={(e) => setFilterRef(e.target.value)} />
          <TextInput placeholder="Customer" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} />
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Booking Status</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
          <select className="input" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
            <option value="">All Payment Status</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="card mt-4">
        <DataTable columns={columns} data={filtered} emptyMessage="No meal bookings found" />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Meal Booking' : 'New Meal Booking'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            {form.bookingStatus !== 'Confirmed' && (
              <button type="button" className="btn-outline" onClick={() => save(false)}>Save Draft</button>
            )}
            {form.bookingStatus !== 'Confirmed' && (
              <button type="button" className="btn-primary" onClick={() => save(true)} disabled={!!minPaxError}>
                Confirm Booking
              </button>
            )}
            {form.bookingStatus === 'Confirmed' && (
              <button type="button" className="btn-primary" onClick={() => save(false)}>Save</button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          {/* A. Booking Details */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-brown-700">A. Booking Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Booking Reference">
                <TextInput value={form.reference} readOnly className="bg-cream-50" />
              </FormField>
              <FormField label="Event Date" required>
                <TextInput
                  type="date"
                  min={!isEditing ? todayLocalDate() : undefined}
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  disabled={isConfirmed}
                />
              </FormField>
              <FormField label="Customer" required className="sm:col-span-2">
                <div className={isConfirmed ? 'pointer-events-none opacity-60' : undefined}>
                  <Dropdown
                    value={form.customerId}
                    onChange={(v) => setForm({ ...form, customerId: v })}
                    options={activeCustomers.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select customer"
                  />
                </div>
              </FormField>
              <FormField label="Meal Category" hint="Optional classification from Meal Category Master">
                <div className={isConfirmed ? 'pointer-events-none opacity-60' : undefined}>
                  <Dropdown
                    value={form.categoryId ?? ''}
                    onChange={(v) => setForm({ ...form, categoryId: v || undefined })}
                    options={categories.filter((c) => c.status === 'Active').map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select category (optional)"
                  />
                </div>
              </FormField>
              <FormField label="Food Required?" required>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.foodRequired}
                      onChange={() => onFoodRequiredChange(true)}
                      disabled={isConfirmed}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!form.foodRequired}
                      onChange={() => onFoodRequiredChange(false)}
                      disabled={isConfirmed}
                    />
                    No
                  </label>
                </div>
              </FormField>
            </div>
          </section>

          {form.foodRequired && (
            <>
              {/* B. Food Details */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-brown-700">B. Food Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Food Package" required>
                    <div className={isConfirmed ? 'pointer-events-none opacity-60' : undefined}>
                      <Dropdown
                        value={form.packageId ?? ''}
                        onChange={onPackageChange}
                        options={activePackages.map((p) => ({ value: p.id, label: `${p.name} (${formatMoney(p.pricePerPax)}/pax)` }))}
                        placeholder="Select food package"
                      />
                    </div>
                  </FormField>
                  <FormField label="Pax Count" required>
                    <TextInput
                      type="number"
                      min="1"
                      value={String(form.paxCount ?? '')}
                      onChange={(e) => onPaxChange(e.target.value)}
                      disabled={isConfirmed}
                    />
                    {minPaxError && <p className="mt-1 text-xs text-red-600">{minPaxError}</p>}
                  </FormField>
                  {selectedPackage && (
                    <div className="sm:col-span-2 text-sm text-brown-600">
                      Price Per Pax: {formatMoney(snapshotPrice ?? selectedPackage.pricePerPax)}
                      {selectedPackage.minimumPax > 1 && ` · Minimum ${selectedPackage.minimumPax} Pax`}
                      {selectedPackage.gstApplicable && ' · GST applicable'}
                    </div>
                  )}
                </div>
              </section>

              {/* C. Food Customization */}
              {customizations.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-brown-700">C. Food Customization</h3>
                  <div className="space-y-3">
                    {customizations.map((line, idx) => (
                      <div key={line.originalItemId} className="rounded-lg border border-cream-200 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-brown-800">{line.originalItemName}</p>
                            <p className="text-xs text-brown-500">
                              {line.originalPricingBasis} · {formatMoney(line.originalCost)}
                              {line.action === 'removed' && ' · Removed'}
                              {line.action === 'replaced' && ` · Replaced with ${line.replacementItemName}`}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {line.adjustment !== 0 ? formatMoney(line.adjustment) : '—'}
                          </p>
                        </div>
                        {!isConfirmed && line.action === 'included' && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button type="button" className="btn-outline text-xs" onClick={() => removeCustomization(idx)}>
                              Remove Item
                            </button>
                            <Dropdown
                              value=""
                              onChange={(v) => replaceCustomization(idx, v)}
                              options={activeItems
                                .filter((i) => i.id !== line.originalItemId)
                                .map((i) => ({ value: i.id, label: i.name }))}
                              placeholder="Replace with..."
                              className="min-w-[180px]"
                            />
                          </div>
                        )}
                        {!isConfirmed && line.action !== 'included' && (
                          <button type="button" className="mt-2 btn-outline text-xs" onClick={() => restoreCustomization(idx)}>
                            Restore Original
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* D. Additional Food Items */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-brown-700">D. Additional Food Items</h3>
                {additionalItems.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {additionalItems.map((line, idx) => (
                      <div key={`${line.itemId}-${idx}`} className="flex items-center justify-between rounded border border-cream-200 px-3 py-2 text-sm">
                        <span>
                          {line.itemName} ({line.pricingBasis}, qty {line.quantity}) — {formatMoney(line.amount)}
                        </span>
                        {!isConfirmed && (
                          <button type="button" onClick={() => removeAdditionalItem(idx)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!isConfirmed && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Dropdown
                      value={addItemId}
                      onChange={setAddItemId}
                      options={activeItems.map((i) => ({ value: i.id, label: i.name }))}
                      placeholder="Menu item"
                    />
                    <TextInput
                      type="number"
                      min="1"
                      value={addItemQty}
                      onChange={(e) => setAddItemQty(e.target.value)}
                      placeholder="Quantity"
                    />
                    <button type="button" className="btn-outline" onClick={addAdditionalItem}>Add Item</button>
                  </div>
                )}
              </section>

              {/* E. Calculation Summary */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-brown-700">E. Calculation Summary</h3>
                <div className="rounded-lg bg-cream-50 p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Food Package Amount</span>
                    <span>{formatMoney(totals.packageAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food Customization Adjustment</span>
                    <span>{formatMoney(totals.customizationAdjustment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Food Amount</span>
                    <span>{formatMoney(totals.additionalFoodAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST</span>
                    <span>{formatMoney(totals.gst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-cream-200 pt-2 font-semibold text-brown-800">
                    <span>Food Grand Total</span>
                    <span>{formatMoney(totals.foodGrandTotal)}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* F. Payment / Booking Status */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-brown-700">F. Payment / Booking Status</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Booking Status">
                <StatusBadge status={form.bookingStatus} />
              </FormField>
              <FormField label="Payment Status">
                <StatusBadge status={deriveMealPaymentStatus(totals.foodGrandTotal, form.amountPaid)} />
                <p className="mt-1 text-xs text-brown-500">Derived from payment transactions</p>
              </FormField>
              {form.amountPaid > 0 && (
                <div className="sm:col-span-2 text-sm text-brown-600">
                  Amount Paid: {formatMoney(form.amountPaid)}
                  {form.paymentMode && ` · ${form.paymentMode}`}
                  {form.paymentSubtype && ` (${form.paymentSubtype})`}
                </div>
              )}
              {!isConfirmed && form.foodRequired && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={collectPayment} onChange={(e) => setCollectPayment(e.target.checked)} />
                    Collect payment at booking
                  </label>
                </div>
              )}
              {collectPayment && !isConfirmed && (
                <>
                  <FormField label="Deposit Amount">
                    <TextInput type="number" min="0" step="0.01" value={depositInput} onChange={(e) => setDepositInput(e.target.value)} />
                  </FormField>
                  <FormField label="Advance Amount">
                    <TextInput type="number" min="0" step="0.01" value={advanceInput} onChange={(e) => setAdvanceInput(e.target.value)} />
                  </FormField>
                  {(Number(depositInput) > 0 || Number(advanceInput) > 0) && (
                    <>
                      <FormField label="Payment Mode" required>
                        <Dropdown
                          value={paymentMode}
                          onChange={setPaymentMode}
                          options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
                          placeholder="Select mode"
                        />
                      </FormField>
                      {paymentMode === 'NETS Terminal' && (
                        <FormField label="Payment Subtype" required>
                          <Dropdown
                            value={paymentSubtype}
                            onChange={setPaymentSubtype}
                            options={NETS_SUBTYPES.map((s) => ({ value: s, label: s }))}
                            placeholder="Select subtype"
                          />
                        </FormField>
                      )}
                      <FormField label="Transaction / Reference Number">
                        <TextInput value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
                      </FormField>
                      {paymentMode === 'Other' && (
                        <FormField label="Remarks" required className="sm:col-span-2">
                          <TextInput value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)} />
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </Modal>
    </div>
  );
}

export default MealBookingManagement;
