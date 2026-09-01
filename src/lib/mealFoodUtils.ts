import { glRecords } from '@/lib/mockData';

export type PricingBasis = 'Per Pax' | 'Per Unit' | 'Per Pack / Quantity' | 'Per Tub';
export type MealBookingStatus = 'Draft' | 'Confirmed' | 'Cancelled' | 'Completed';
export type MealPaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface FoodPackage {
  id: string;
  code: string;
  name: string;
  pricePerPax: number;
  minimumPax: number;
  gstApplicable: boolean;
  description?: string;
  status: 'Active' | 'Inactive';
  itemIds: string[];
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  categoryId?: string;
  pricingBasis?: string;
  cost?: number;
  status: 'Active' | 'Inactive';
}

export interface MealCustomizationLine {
  originalItemId: string;
  originalItemName: string;
  originalCost: number;
  originalPricingBasis: string;
  action: 'included' | 'removed' | 'replaced';
  replacementItemId?: string;
  replacementItemName?: string;
  replacementCost?: number;
  replacementPricingBasis?: string;
  adjustment: number;
}

export interface MealAdditionalLine {
  itemId: string;
  itemName: string;
  pricingBasis: string;
  cost: number;
  quantity: number;
  amount: number;
}

export interface MealBookingRecord {
  id: string;
  reference: string;
  customerId: string;
  eventDate: string;
  categoryId?: string;
  foodRequired: boolean;
  packageId?: string;
  paxCount?: number;
  packageAmount: number;
  customizationAdjustment: number;
  additionalFoodAmount: number;
  customizations?: MealCustomizationLine[];
  additionalItems?: MealAdditionalLine[];
  gst: number;
  foodGrandTotal: number;
  amountPaid: number;
  depositAmount?: number;
  advanceAmount?: number;
  paymentMode?: string;
  paymentSubtype?: string;
  paymentReference?: string;
  paymentRemarks?: string;
  paymentStatus: MealPaymentStatus;
  bookingStatus: MealBookingStatus;
  snapshotPackagePricePerPax?: number;
  createdAt?: string;
  createdBy?: string;
}

const MEAL_PACKAGES_KEY = 'meal_packages';
const MEAL_ITEMS_KEY = 'meal_items';
const MEAL_BOOKINGS_KEY = 'meal_bookings';

const DEFAULT_PACKAGES: FoodPackage[] = [
  {
    id: 'mp1',
    code: 'MEAL001',
    name: 'Annadhanam Package',
    pricePerPax: 10,
    minimumPax: 1,
    gstApplicable: true,
    description: 'Meal package for devotees.',
    status: 'Active',
    itemIds: ['meal-i1'],
  },
  {
    id: 'mp2',
    code: 'MEAL002',
    name: 'Special Meal Set',
    pricePerPax: 15,
    minimumPax: 10,
    gstApplicable: true,
    description: 'Special meal package for events.',
    status: 'Active',
    itemIds: ['meal-i4', 'meal-i5'],
  },
];

const DEFAULT_ITEMS: MenuItem[] = [
  { id: 'meal-i1', code: 'FOOD001', name: 'Idly', categoryId: 'mc1', pricingBasis: 'Per Pax', cost: 2.5, status: 'Active' },
  { id: 'meal-i4', code: 'FOOD004', name: 'Rice', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 1.5, status: 'Active' },
  { id: 'meal-i5', code: 'FOOD005', name: 'Sambar', categoryId: 'mc2', pricingBasis: 'Per Pax', cost: 2.0, status: 'Active' },
];

export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadFoodPackages(): FoodPackage[] {
  try {
    const saved = localStorage.getItem(MEAL_PACKAGES_KEY);
    const parsed = saved ? JSON.parse(saved) as Partial<FoodPackage>[] : [];
    const list = parsed.length ? parsed : DEFAULT_PACKAGES;
    return list.map((p) => ({
      id: p.id ?? '',
      code: p.code ?? '',
      name: p.name ?? '',
      pricePerPax: Number(p.pricePerPax ?? 0),
      minimumPax: Number(p.minimumPax ?? 1),
      gstApplicable: p.gstApplicable ?? true,
      description: p.description,
      status: p.status ?? 'Active',
      itemIds: p.itemIds ?? [],
    }));
  } catch {
    return DEFAULT_PACKAGES;
  }
}

export function loadMenuItems(): MenuItem[] {
  try {
    const saved = localStorage.getItem(MEAL_ITEMS_KEY);
    const parsed = saved ? JSON.parse(saved) as Partial<MenuItem>[] : [];
    const list = parsed.length ? parsed : DEFAULT_ITEMS;
    return list.map((item) => {
      const fallback = DEFAULT_ITEMS.find((i) => i.id === item.id);
      return {
        id: item.id ?? '',
        code: item.code ?? '',
        name: item.name ?? '',
        categoryId: item.categoryId ?? fallback?.categoryId,
        pricingBasis: item.pricingBasis ?? fallback?.pricingBasis ?? 'Per Pax',
        cost: Number(item.cost ?? fallback?.cost ?? 0),
        status: item.status ?? 'Active',
      };
    });
  } catch {
    return DEFAULT_ITEMS;
  }
}

export function loadMealBookings(): MealBookingRecord[] {
  try {
    const saved = localStorage.getItem(MEAL_BOOKINGS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as Partial<MealBookingRecord & { mealType?: string; adultPax?: number; childPax?: number; totalPax?: number }>[];
    return parsed.map((row) => migrateMealBooking(row));
  } catch {
    return [];
  }
}

export function saveMealBookings(rows: MealBookingRecord[]) {
  try {
    localStorage.setItem(MEAL_BOOKINGS_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

function migrateMealBooking(row: Partial<MealBookingRecord> & { adultPax?: number; childPax?: number; totalPax?: number }): MealBookingRecord {
  const paxCount = row.paxCount ?? row.totalPax ?? (Number(row.adultPax ?? 0) + Number(row.childPax ?? 0));
  const foodRequired = row.foodRequired ?? !!row.packageId;
  return {
    id: row.id ?? `mb-${Math.random().toString(36).slice(2)}`,
    reference: row.reference ?? '',
    customerId: row.customerId ?? '',
    eventDate: row.eventDate ?? '',
    categoryId: row.categoryId,
    foodRequired,
    packageId: row.packageId,
    paxCount: foodRequired ? paxCount : undefined,
    packageAmount: Number(row.packageAmount ?? 0),
    customizationAdjustment: Number(row.customizationAdjustment ?? 0),
    additionalFoodAmount: Number(row.additionalFoodAmount ?? 0),
    customizations: row.customizations,
    additionalItems: row.additionalItems,
    gst: Number(row.gst ?? 0),
    foodGrandTotal: Number(row.foodGrandTotal ?? row.totalAmount ?? 0),
    amountPaid: Number(row.amountPaid ?? 0),
    depositAmount: row.depositAmount,
    advanceAmount: row.advanceAmount,
    paymentMode: row.paymentMode,
    paymentSubtype: row.paymentSubtype,
    paymentReference: row.paymentReference,
    paymentRemarks: row.paymentRemarks,
    paymentStatus: row.paymentStatus ?? 'Pending',
    bookingStatus: row.bookingStatus ?? 'Draft',
    snapshotPackagePricePerPax: row.snapshotPackagePricePerPax,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export function generateMealBookingRef(existing: MealBookingRecord[]): string {
  const today = new Date();
  const yymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `MB${yymm}`;
  const nums = existing
    .map((b) => b.reference)
    .filter((r) => r.startsWith(prefix))
    .map((r) => parseInt(r.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export function normalizePricingBasis(value?: string): PricingBasis {
  if (value === 'Per Unit') return 'Per Unit';
  if (value === 'Per Pack / Quantity' || value === 'Per Portion') return 'Per Pack / Quantity';
  if (value === 'Per Tub') return 'Per Tub';
  return 'Per Pax';
}

export function lineAmount(cost: number, basis: string, paxCount: number, quantity: number): number {
  const b = normalizePricingBasis(basis);
  if (b === 'Per Pax') return cost * paxCount;
  return cost * quantity;
}

export function defaultCustomizations(packageId: string, items: MenuItem[], packages: FoodPackage[]): MealCustomizationLine[] {
  const pkg = packages.find((p) => p.id === packageId);
  if (!pkg) return [];
  return (pkg.itemIds ?? []).map((itemId) => {
    const item = items.find((i) => i.id === itemId);
    return {
      originalItemId: itemId,
      originalItemName: item?.name ?? itemId,
      originalCost: item?.cost ?? 0,
      originalPricingBasis: item?.pricingBasis ?? 'Per Pax',
      action: 'included' as const,
      adjustment: 0,
    };
  });
}

export function computeCustomizationAdjustment(
  lines: MealCustomizationLine[],
  paxCount: number,
): number {
  return lines.reduce((sum, line) => sum + line.adjustment, 0);
}

export function recalcCustomizationLine(
  line: MealCustomizationLine,
  paxCount: number,
  items: MenuItem[],
): MealCustomizationLine {
  const originalAmt = lineAmount(line.originalCost, line.originalPricingBasis, paxCount, paxCount);
  if (line.action === 'removed') {
    return { ...line, adjustment: -originalAmt };
  }
  if (line.action === 'replaced' && line.replacementItemId) {
    const replacement = items.find((i) => i.id === line.replacementItemId);
    const repCost = line.replacementCost ?? replacement?.cost ?? 0;
    const repBasis = line.replacementPricingBasis ?? replacement?.pricingBasis ?? 'Per Pax';
    const replacementAmt = lineAmount(repCost, repBasis, paxCount, paxCount);
    return {
      ...line,
      replacementItemName: line.replacementItemName ?? replacement?.name,
      replacementCost: repCost,
      replacementPricingBasis: repBasis,
      adjustment: replacementAmt - originalAmt,
    };
  }
  return { ...line, adjustment: 0 };
}

export function computeFoodTotals(input: {
  packageId?: string;
  paxCount: number;
  packages: FoodPackage[];
  customizations: MealCustomizationLine[];
  additionalItems: MealAdditionalLine[];
  useSnapshotPrice?: number;
  gstApplicable?: boolean;
}) {
  const pkg = input.packages.find((p) => p.id === input.packageId);
  const pricePerPax = input.useSnapshotPrice ?? pkg?.pricePerPax ?? 0;
  const packageAmount = pricePerPax * input.paxCount;
  const customizationAdjustment = computeCustomizationAdjustment(input.customizations, input.paxCount);
  const additionalFoodAmount = input.additionalItems.reduce((sum, line) => sum + line.amount, 0);
  const subtotal = packageAmount + customizationAdjustment + additionalFoodAmount;
  const gstRate = (input.gstApplicable ?? pkg?.gstApplicable) ? getFoodGstRate() : 0;
  const gst = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  const foodGrandTotal = Math.round((subtotal + gst) * 100) / 100;
  return { packageAmount, customizationAdjustment, additionalFoodAmount, gst, foodGrandTotal, pricePerPax };
}

export function getFoodGstRate(): number {
  const gl = glRecords.find((g) => g.glCode === 'GL-2002' && g.status === 'Active');
  return gl?.gstRate ?? 9;
}

export function deriveMealPaymentStatus(foodGrandTotal: number, amountPaid: number): MealPaymentStatus {
  if (amountPaid <= 0) return 'Pending';
  if (amountPaid >= foodGrandTotal) return 'Paid';
  return 'Partially Paid';
}

export function buildAdditionalLine(item: MenuItem, quantity: number, paxCount: number): MealAdditionalLine {
  const basis = normalizePricingBasis(item.pricingBasis);
  const qty = basis === 'Per Pax' ? paxCount : quantity;
  const amount = lineAmount(item.cost ?? 0, basis, paxCount, qty);
  return {
    itemId: item.id,
    itemName: item.name,
    pricingBasis: basis,
    cost: item.cost ?? 0,
    quantity: qty,
    amount: Math.round(amount * 100) / 100,
  };
}
