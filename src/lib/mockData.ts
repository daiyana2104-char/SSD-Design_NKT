// Centralized mock data for the temple management prototype.

export interface User {
  id: string; name: string; email: string; mobile: string;
  designation?: string; role: string; accessUpto: string; status: string; avatar?: string;
}

export interface Role { id: string; name: string; accessType?: string; users: number; status: string; }

export interface Category {
  id: string; code: string; name: string; tamilName: string; description: string;
  displayOrder: number; colour: string; image?: string; status: string;
}

export interface Deity { id: string; name: string; tamilName: string; printingGroup: string; image?: string; status: string; }

export interface Gst {
  id: string; gstType: string; percentage: number; gstCode: string;
  effectiveStart: string; effectiveEnd: string;
  status: string; createdDate: string; updatedDate: string;
}

export interface UnitMasterRecord {
  id: string;
  code: string;
  name: string;
  symbol: string;
  description: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

export interface HallCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  status: 'Active' | 'Inactive';
}

export interface Hall {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  level?: string;
  seatingCapacity?: number;
  minBookingHours?: number;
  hourlyRate?: number;
  depositApplicable?: boolean;
  depositAmount?: number;
  additionalHourRate?: number;
  images?: string[];
  glCode?: string;
  status: 'Active' | 'Inactive';
}

export interface HallPackage {
  id: string;
  name: string;
  purpose?: string;
  sessionDurationHours?: number;
  price?: number;
  advanceAmount?: number;
  depositAmount?: number;
  additionalHourRate?: number;
  glCode?: string;
  description?: string;
  halls: string[]; // hall ids
  status: 'Active' | 'Inactive';
}

export interface Holiday {
  id: string;
  name: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  status: 'Active' | 'Inactive';
}

export interface AdditionalService {
  id: string;
  code: string;
  name: string;
  description?: string;
  pricingType?: 'Fixed' | 'Per Hour' | 'Per Person' | 'Per Unit';
  rate?: number;
  glCode?: string;
  status: 'Active' | 'Inactive';
}

export interface HallBooking {
  id: string;
  bookingRef: string;
  customerId: string;
  hallIds: string[]; // halls or package halls
  packageId?: string;
  purpose?: string;
  eventDate: string; // date
  startTime: string; // ISO time
  endTime: string; // ISO time
  guests?: number;
  mealsRequired?: boolean;
  status: 'Booked' | 'Partially Paid' | 'Paid' | 'Completed' | 'Cancelled' | 'Refund Pending' | 'Refunded';
  totalAmount: number;
  paidAmount: number;
  depositAmount: number;
  createdAt: string;
}

export interface HallPayment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  reference?: string;
  collectedBy?: string;
  paymentType?: 'Advance Payment' | 'Partial Payment' | 'Balance Payment';
  remarks?: string;
}

export interface HallAudit {
  id: string;
  action: string;
  module: string;
  refId: string;
  previous?: any;
  next?: any;
  by: string;
  at: string;
}

export interface Service {
  id: string; code: string; name: string; tamilName: string; description: string;
  salePrice: number; displayOrder: number; categoryMapping: string;
  deities: string[]; deityMappingRequired: boolean;
  familyMembersRequired: boolean; maxFamilyMembers: number;
  sessionRequired: boolean;
  inventoryApplicable: boolean; threshold?: number; printingGroup: string; glCode: string;
  posAvailability: boolean; portalAvailability: boolean; image?: string; status: string;
  categories?: { category: string; subCategory?: string; salePrice: number; displayOrder: number; mapping: string }[];
  bookingUpTo?: string;
}

export interface Item {
  id: string; code: string; name: string; tamilName: string; description: string;
  category: string; salePrice: number;
  inventoryApplicable: boolean; uom: string; threshold: number; reductionFactor: number;
  minQty: number; maxQty: number;
  deities: string[]; deityMappingRequired: boolean;
  familyMembersRequired?: boolean; maxFamilyMembers?: number;
  printingGroup: string; glCode: string;
  posAvailability: boolean; portalAvailability: boolean;
  displayOrder: number; status: string; stock?: number;
  categories?: { category: string; subCategory?: string; salePrice: number; displayOrder: number; mapping: string }[];
  bookingUpTo?: string;
}

export interface SubCategory {
  id: string; code: string; name: string; tamilName: string; category: string;
  displayOrder: number; colour: string; description: string; status: string;
}

export interface EventSlot {
  slotName: string;  slotDate: string; startTime: string; endTime: string; seats: number; status: string;
  slotTime?: string; session?: string; slotName?: string; maxCount?: number;
}

export interface EventMaster {
  id: string; eventCode: string; name: string; tamilName: string; description: string;
  category: string; subCategory: string; deities: string[];
  startDate: string; endDate: string; slotRequired: boolean;
  salePrice: number; gstClass: string;
  posVisibility: boolean; portalVisibility: boolean;
  displayOrder: number; status: string;
  slots: EventSlot[];
}

export interface PrintingGroup {
  id: string; name: string; description: string; mappedItems: number; mappedServices: number; status: string;
}

export interface GLGroupL1 {
  id: string; name: string; description: string; status: string;
}

export interface GLGroupL2 {
  id: string; l1Id: string; name: string; description: string; status: string;
}

export interface GLGroupL3 {
  id: string; l2Id: string; name: string; description: string; status: string;
}

export interface GLMaster {
  id: string; glCode: string; glName: string; gstType: string; gstRate?: number;
  groupL1Id: string; groupL2Id: string; groupL3Id: string;
  description: string; status: string;
}

export interface Customer {
  id: string; code: string; name: string; mobile: string; email: string; status: string;
  dob?: string; gender?: string;
  familyMembers: { name: string; nakshatra: string }[];
  maxFamilyMembers?: number;
}

export interface PosTransaction {
  id: string; txnNo: string; receiptNo: string; customer: string; paymentMode: string;
  gross: number; gst: number; status: string; ref: string; datetime: string; items: { name: string; qty: number; price: number }[];
  type?: string;
}

export interface PortalBooking {
  id: string; bookingNo: string; customer: string; service: string; date: string;
  amount: number; status: string; datetime: string;
}

export interface Payment { id: string; txnNo: string; receiptNo: string; customer: string; paymentMode: string; gross: number; gst: number; status: string; ref: string; datetime: string; }

export interface Cancellation {
  id: string; refNo: string; customer: string; originalAmount: number; reason: string;
  cancellationStatus: string; refundableAmount: number; actualRefund: number; refundMode: string;
  refundDate: string; refundRef: string; refundStatus: string; remarks: string;
}

export interface InventoryHistory {
  id: string; item: string; code: string; source: string; type: string; ref: string;
  qty: number; prev: number; balance: number; updatedBy: string; datetime: string; remarks: string;
}

export interface Banner {
  id: string; title: string; description: string; image: string; link: string;
  displayOrder: number; start: string; end: string; status: string;
}

export interface Announcement {
  id: string; title: string; content: string; start: string; end: string;
  displayOrder: number; status: string;
}

export interface MenuItem { id: string; name: string; type: string; linkType: string; page: string; parent: string; displayOrder: number; status: string; }

export interface StaticPage { id: string; title: string; slug: string; content: string; metaTitle: string; metaDesc: string; status: string; }

export interface Contact { id: string; address: string; phone: string; email: string; hours: string; status: string; }

export interface Highlight { id: string; contentType: string; selection: string; displayOrder: number; start: string; end: string; status: string; }

export interface Enquiry { id: string; number: string; customer: string; email: string; mobile: string; subject: string; message: string; submitted: string; status: string; remarks: string; }

export interface Feedback { id: string; number: string; customer: string; rating: number; feedback: string; submitted: string; reviewStatus: string; publicVisible: boolean; remarks: string; }

export interface AuditLog { id: string; user: string; action: string; module: string; timestamp: string; details: string; }

// ---- Data ----

export const currentUser: User = {
  id: 'u1', name: 'Suresh Krishnan', email: 'admin@ssdtemple.sg',
  mobile: '+65 9123 4567', designation: 'Temple Administrator', role: 'Super Admin',
  accessUpto: '31/12/2026', status: 'Active',
};

export const users: User[] = [
  { id: 'u1', name: 'Suresh Krishnan', email: 'admin@ssdtemple.sg', mobile: '+65 9123 4567', designation: 'Temple Administrator', role: 'Super Admin', accessUpto: '31/12/2026', status: 'Active' },
  { id: 'u2', name: 'Lakshmi Devi', email: 'pos1@ssdtemple.sg', mobile: '+65 8234 5678', designation: 'Counter Executive', role: 'POS User', accessUpto: '30/06/2026', status: 'Active' },
  { id: 'u3', name: 'Ravi Subramaniam', email: 'finance@ssdtemple.sg', mobile: '+65 9345 6789', designation: 'Finance Manager', role: 'Admin Panel User', accessUpto: '31/12/2026', status: 'Active' },
  { id: 'u4', name: 'Priya Murugan', email: 'pos2@ssdtemple.sg', mobile: '+65 8456 7890', designation: 'Counter Executive', role: 'POS User', accessUpto: '31/03/2026', status: 'Inactive' },
  { id: 'u5', name: 'Anand Pillai', email: 'content@ssdtemple.sg', mobile: '+65 9567 8901', designation: 'Content Editor', role: 'Content Manager', accessUpto: '31/12/2026', status: 'Active' },
  { id: 'u6', name: 'Kavitha Raj', email: 'pos3@ssdtemple.sg', mobile: '+65 8678 9012', designation: 'Counter Executive', role: 'Both Admin Panel and POS User', accessUpto: '30/09/2026', status: 'Active' },
];

export const roles: Role[] = [
  { id: 'r1', name: 'Super Admin', accessType: 'Both Admin Panel and POS User', users: 1, status: 'Active' },
  { id: 'r2', name: 'Admin Panel User', accessType: 'Admin Panel User', users: 2, status: 'Active' },
  { id: 'r3', name: 'POS User', accessType: 'POS User', users: 3, status: 'Active' },
  { id: 'r4', name: 'Content Manager', accessType: 'Admin Panel User', users: 1, status: 'Active' },
];

export const categories: Category[] = [
  { id: 'c1', code: 'PUJA', name: 'Pooja Services', tamilName: 'பூஜை சேவைகள்', description: 'Daily and special pooja services', displayOrder: 1, colour: '#942237', status: 'Active' },
  { id: 'c2', code: 'ARCHANA', name: 'Archana', tamilName: 'அர்ச்சனை', description: 'Archana offerings', displayOrder: 2, colour: '#fa7710', status: 'Active' },
  { id: 'c3', code: 'HOMAM', name: 'Homam', tamilName: 'ஹோமம்', description: 'Fire rituals', displayOrder: 3, colour: '#b8860a', status: 'Active' },
  { id: 'c4', code: 'DONATION', name: 'Donations', tamilName: 'தானம்', description: 'General donations', displayOrder: 4, colour: '#7e4d38', status: 'Active' },
  { id: 'c5', code: 'FESTIVAL', name: 'Festival Services', tamilName: 'திருவிழா சேவைகள்', description: 'Special festival related services', displayOrder: 5, colour: '#d4475c', status: 'Active' },
];

export const deities: Deity[] = [
  { id: 'd1', name: 'Lord Shiva', tamilName: 'சிவன்', printingGroup: 'Pooja Receipts', status: 'Active' },
  { id: 'd2', name: 'Goddess Durga', tamilName: 'துர்கா', printingGroup: 'Pooja Receipts', status: 'Active' },
  { id: 'd3', name: 'Lord Ganesha', tamilName: 'விநாயகர்', printingGroup: 'Archana Tickets', status: 'Active' },
  { id: 'd4', name: 'Lord Murugan', tamilName: 'முருகன்', printingGroup: 'Archana Tickets', status: 'Active' },
  { id: 'd5', name: 'Lord Vishnu', tamilName: 'விஷ்ணு', printingGroup: 'Pooja Receipts', status: 'Active' },
  { id: 'd6', name: 'Goddess Lakshmi', tamilName: 'லட்சுமி', printingGroup: 'Pooja Receipts', status: 'Active' },
];

export const glGroupL1Records: GLGroupL1[] = [
  { id: 'l1-1', name: 'Income', description: 'Revenue accounts', status: 'Active' },
  { id: 'l1-2', name: 'CL', description: 'Current liabilities', status: 'Active' },
  { id: 'l1-3', name: 'Expense', description: 'Operating expenses', status: 'Active' },
];

export const glGroupL2Records: GLGroupL2[] = [
  { id: 'l2-1', l1Id: 'l1-1', name: 'Pooja Income', description: 'Income from pooja services', status: 'Active' },
  { id: 'l2-2', l1Id: 'l1-1', name: 'Donation Income', description: 'Donation revenue', status: 'Active' },
  { id: 'l2-3', l1Id: 'l1-1', name: 'Rental Income', description: 'Hall rental revenue', status: 'Active' },
  { id: 'l2-4', l1Id: 'l1-2', name: 'GST Payable', description: 'GST output tax', status: 'Active' },
  { id: 'l2-5', l1Id: 'l1-3', name: 'Admin Expense', description: 'Administrative expenses', status: 'Active' },
];

export const glGroupL3Records: GLGroupL3[] = [
  { id: 'l3-1', l2Id: 'l2-1', name: 'Archana Income', description: 'Archana offerings income', status: 'Active' },
  { id: 'l3-2', l2Id: 'l2-1', name: 'Abhishekam Income', description: 'Abhishekam income', status: 'Active' },
  { id: 'l3-3', l2Id: 'l2-2', name: 'General Donation', description: 'General donations', status: 'Active' },
  { id: 'l3-4', l2Id: 'l2-3', name: 'Hall Rental', description: 'Hall rental income', status: 'Active' },
  { id: 'l3-5', l2Id: 'l2-4', name: 'GST Output', description: 'GST output tax payable', status: 'Active' },
  { id: 'l3-6', l2Id: 'l2-5', name: 'Office Supplies', description: 'Office supply expenses', status: 'Active' },
];

export const glRecords: GLMaster[] = [
  { id: 'gl1', glCode: 'GL-1001', glName: 'Pooja Income', gstType: 'Standard Rate', gstRate: 9, groupL1Id: 'l1-1', groupL2Id: 'l2-1', groupL3Id: 'l3-2', description: 'Income from pooja services', status: 'Active' },
  { id: 'gl2', glCode: 'GL-1002', glName: 'Archana Income', gstType: 'Standard Rate', gstRate: 9, groupL1Id: 'l1-1', groupL2Id: 'l2-1', groupL3Id: 'l3-1', description: 'Income from archana offerings', status: 'Active' },
  { id: 'gl3', glCode: 'GL-1003', glName: 'Donation Income', gstType: 'Exempt', gstRate: 0, groupL1Id: 'l1-1', groupL2Id: 'l2-2', groupL3Id: 'l3-3', description: 'General donation income', status: 'Active' },
  { id: 'gl4', glCode: 'GL-2001', glName: 'Festival Income', gstType: 'Standard Rate', gstRate: 9, groupL1Id: 'l1-1', groupL2Id: 'l2-1', groupL3Id: '', description: 'Income from festival events', status: 'Inactive' },
  { id: 'gl5', glCode: 'GL-2002', glName: 'Hall Rental Income', gstType: 'Standard Rate', gstRate: 9, groupL1Id: 'l1-1', groupL2Id: 'l2-3', groupL3Id: 'l3-4', description: 'Income from hall rentals', status: 'Active' },
  { id: 'gl6', glCode: 'GL-3001', glName: 'GST Payable', gstType: 'Standard Rate', gstRate: 9, groupL1Id: 'l1-2', groupL2Id: 'l2-4', groupL3Id: 'l3-5', description: 'GST output tax payable', status: 'Active' },
];

export const unitRecords: UnitMasterRecord[] = [
  {
    id: 'unit1',
    code: 'NOS',
    name: 'Numbers',
    symbol: 'Nos',
    description: 'Individual count-based items',
    displayOrder: 1,
    status: 'Active',
  },
  {
    id: 'unit2',
    code: 'KG',
    name: 'Kilogram',
    symbol: 'Kg',
    description: 'Weight measured in kilograms',
    displayOrder: 2,
    status: 'Active',
  },
  {
    id: 'unit3',
    code: 'LTR',
    name: 'Litre',
    symbol: 'Litre',
    description: 'Liquid quantity measured in litres',
    displayOrder: 3,
    status: 'Active',
  },
  {
    id: 'unit4',
    code: 'PACK',
    name: 'Pack',
    symbol: 'Pack',
    description: 'Packaged quantity',
    displayOrder: 4,
    status: 'Active',
  },
  {
    id: 'unit5',
    code: 'BOX',
    name: 'Box',
    symbol: 'Box',
    description: 'Box quantity',
    displayOrder: 5,
    status: 'Active',
  },
  {
    id: 'unit6',
    code: 'SET',
    name: 'Set',
    symbol: 'Set',
    description: 'Set or grouped quantity',
    displayOrder: 6,
    status: 'Active',
  },
];

export const hallCategories: HallCategory[] = [
  { id: 'hc1', code: 'WEDDING', name: 'Wedding Halls', description: 'Large halls suitable for weddings', displayOrder: 1, status: 'Active' },
  { id: 'hc2', code: 'FUNCTION', name: 'Function Halls', description: 'Medium sized halls for functions', displayOrder: 2, status: 'Active' },
  { id: 'hc3', code: 'DINING', name: 'Dining Halls', description: 'Dining and banquet halls', displayOrder: 3, status: 'Active' },
];

export const halls: Hall[] = [
  { id: 'h1', code: 'H-WED-03', name: 'Wedding Hall - Level 3', categoryId: 'hc1', level: 'Level 3', seatingCapacity: 300, minBookingHours: 3, hourlyRate: 200, depositApplicable: true, depositAmount: 500, additionalHourRate: 250, images: [], status: 'Active' },
  { id: 'h2', code: 'H-FUN-02', name: 'Function Hall - Level 2', categoryId: 'hc2', level: 'Level 2', seatingCapacity: 150, minBookingHours: 2, hourlyRate: 120, depositApplicable: true, depositAmount: 300, additionalHourRate: 150, images: [], status: 'Active' },
  { id: 'h3', code: 'H-DIN-01', name: 'Dining Hall - Level 1', categoryId: 'hc3', level: 'Level 1', seatingCapacity: 200, minBookingHours: 2, hourlyRate: 100, depositApplicable: false, depositAmount: 0, additionalHourRate: 120, images: [], status: 'Active' },
];

export const hallPackages: HallPackage[] = [
  { id: 'hp1', name: 'Wedding Package', purpose: 'hp-1', sessionDurationHours: 6, price: 3700, advanceAmount: 500, depositAmount: 500, additionalHourRate: 350, glCode: 'GL-2001', description: 'Wedding package including halls and basic inclusions', halls: ['h1', 'h3'], status: 'Active' },
];

export interface HallPurpose {
  id: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export const hallPurposes: HallPurpose[] = [
  { id: 'hp-1', name: 'Marriage / Wedding', description: 'Wedding ceremonies', status: 'Active' },
  { id: 'hp-2', name: 'Other Function', description: 'General functions', status: 'Active' },
  { id: 'hp-3', name: 'Meeting', description: 'Meetings and conferences', status: 'Active' },
  { id: 'hp-4', name: 'Temple Event', description: 'Temple organised events', status: 'Active' },
];

export const holidays: Holiday[] = [
  { id: 'hol1', name: 'National Day', start: '2026-08-09T09:00', end: '2026-08-09T18:00', status: 'Active' },
  { id: 'hol2', name: 'Deepavali Holiday', start: '2026-10-20T00:00', end: '2026-10-21T23:59', status: 'Active' },
];

export const additionalServices: AdditionalService[] = [
  { id: 'as1', code: 'DEC', name: 'Decoration', pricingType: 'Fixed', rate: 200, glCode: 'GL-2001', status: 'Active' },
  { id: 'as2', code: 'SOUND', name: 'Sound System', pricingType: 'Per Hour', rate: 150, glCode: 'GL-2001', status: 'Active' },
  { id: 'as3', code: 'TENT', name: 'Tent Setup', pricingType: 'Per Unit', rate: 300, glCode: 'GL-2001', status: 'Active' },
];

export const hallBookings: HallBooking[] = [];

export const hallPayments: HallPayment[] = [];

export const hallAudits: HallAudit[] = [];

export const gstRecords: Gst[] = [
  { id: 'g1', gstType: 'Standard Rate', percentage: 9, gstCode: 'SR9', effectiveStart: '2024-01-01', effectiveEnd: '', status: 'Active', createdDate: '01/01/2024', updatedDate: '01/01/2024' },
  { id: 'g2', gstType: 'Standard Rate', percentage: 8, gstCode: 'SR8', effectiveStart: '2023-01-01', effectiveEnd: '2023-12-31', status: 'Inactive', createdDate: '01/01/2023', updatedDate: '31/12/2023' },
  { id: 'g3', gstType: 'Zero Rate', percentage: 0, gstCode: 'ZR0', effectiveStart: '2022-01-01', effectiveEnd: '2022-12-31', status: 'Inactive', createdDate: '01/01/2022', updatedDate: '31/12/2022' },
];

export const subCategories: SubCategory[] = [
  { id: 'sc1', code: 'DAILY-PUJA', name: 'Daily Pooja', tamilName: 'நாளாந்த பூஜை', category: 'Pooja Services', displayOrder: 1, colour: '#942237', description: 'Daily temple pooja services', status: 'Active' },
  { id: 'sc2', code: 'SPECIAL-PUJA', name: 'Special Pooja', tamilName: 'சிறப்பு பூஜை', category: 'Pooja Services', displayOrder: 2, colour: '#b8860a', description: 'Special occasion pooja services', status: 'Active' },
  { id: 'sc3', code: 'ARCHANA-STD', name: 'Standard Archana', tamilName: 'வழக்கான அர்ச்சனை', category: 'Archana', displayOrder: 1, colour: '#fa7710', description: 'Standard archana offerings', status: 'Active' },
  { id: 'sc4', code: 'HOMAM-GP', name: 'Ganapathy Homam', tamilName: 'கணபதி ஹோமம்', category: 'Homam', displayOrder: 1, colour: '#d4475c', description: 'Ganapathy homam services', status: 'Active' },
  { id: 'sc5', code: 'DONATION-GEN', name: 'General Donation', tamilName: 'பொது தானம்', category: 'Donations', displayOrder: 1, colour: '#7e4d38', description: 'General temple donations', status: 'Active' },
];

export const events: EventMaster[] = [
  { id: 'ev1', eventCode: 'EVT001', name: 'Maha Shivaratri', tamilName: 'மகா சிவராத்திரி', description: 'All-night Shivaratri celebrations', category: 'Festival Services', subCategory: '', deities: ['Lord Shiva'], startDate: '2026-02-15', endDate: '2026-02-16', slotRequired: true, salePrice: 50.00, gstClass: 'Applicable', posVisibility: true, portalVisibility: true, displayOrder: 1, status: 'Active', slots: [
    { startTime: '06:00', endTime: '08:00', seats: 50, status: 'Active' },
    { startTime: '08:00', endTime: '10:00', seats: 40, status: 'Active' },
    { startTime: '17:00', endTime: '19:00', seats: 60, status: 'Active' },
  ] },
  { id: 'ev2', eventCode: 'EVT002', name: 'Navratri Special', tamilName: 'நவராத்ரி சிறப்பு', description: 'Nine days of Durga pooja', category: 'Festival Services', subCategory: '', deities: ['Goddess Durga'], startDate: '2026-09-25', endDate: '2026-10-05', slotRequired: false, salePrice: 30.00, gstClass: 'Applicable', posVisibility: true, portalVisibility: true, displayOrder: 2, status: 'Active', slots: [] },
];

export const printingGroups: PrintingGroup[] = [
  { id: 'pg1', name: 'Pooja Receipts', description: 'Standard pooja service receipts', mappedItems: 12, mappedServices: 18, status: 'Active' },
  { id: 'pg2', name: 'Archana Tickets', description: 'Archana and offering tickets', mappedItems: 8, mappedServices: 6, status: 'Active' },
  { id: 'pg3', name: 'Festival Tickets', description: 'Special festival event tickets', mappedItems: 5, mappedServices: 14, status: 'Active' },
  { id: 'pg4', name: 'Donation Receipts', description: 'Donation acknowledgement receipts', mappedItems: 3, mappedServices: 0, status: 'Inactive' },
];

export const items: Item[] = [
  { id: 'i1', code: 'ITM001', name: 'Vilva Archana', tamilName: 'வில்வ அர்ச்சனை', description: 'Archana with vilva leaves', category: 'Archana', salePrice: 10.00, inventoryApplicable: true, uom: 'Nos', threshold: 50, reductionFactor: 1, minQty: 1, maxQty: 0, deities: ['Lord Shiva'], deityMappingRequired: true, printingGroup: 'Archana Tickets', glCode: 'GL-1002', posAvailability: true, portalAvailability: true, displayOrder: 1, status: 'Active', stock: 120 },
  { id: 'i2', code: 'ITM002', name: 'Milk Abhishekam', tamilName: 'பாலாபிஷேகம்', description: 'Milk abhishekam for Lord Shiva', category: 'Pooja Services', salePrice: 20.00, inventoryApplicable: true, uom: 'Litre', threshold: 20, reductionFactor: 0.5, minQty: 1, maxQty: 0, deities: ['Lord Shiva'], deityMappingRequired: true, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: true, displayOrder: 2, status: 'Active', stock: 15 },
  { id: 'i3', code: 'ITM003', name: 'Flower Garland', tamilName: 'மாலை', description: 'Flower garland offering', category: 'Pooja Services', salePrice: 15.00, inventoryApplicable: true, uom: 'Nos', threshold: 30, reductionFactor: 1, minQty: 1, maxQty: 0, deities: ['Goddess Durga'], deityMappingRequired: true, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: false, displayOrder: 3, status: 'Active', stock: 8 },
  { id: 'i4', code: 'ITM004', name: 'Camphor', tamilName: 'கற்பூரம்', description: 'Camphor for aarti', category: 'Pooja Services', salePrice: 5.00, inventoryApplicable: true, uom: 'Pack', threshold: 40, reductionFactor: 1, minQty: 1, maxQty: 0, deities: [], deityMappingRequired: false, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: false, displayOrder: 4, status: 'Active', stock: 200 },
  { id: 'i5', code: 'ITM005', name: 'General Donation', tamilName: 'பொது தானம்', description: 'General temple donation', category: 'Donations', salePrice: 50.00, inventoryApplicable: false, uom: '', threshold: 0, reductionFactor: 0, minQty: 1, maxQty: 0, deities: [], deityMappingRequired: false, printingGroup: 'Donation Receipts', glCode: 'GL-1003', posAvailability: true, portalAvailability: true, displayOrder: 5, status: 'Active' },
  { id: 'i6', code: 'ITM006', name: 'Honey Abhishekam', tamilName: 'தேனாபிஷேகம்', description: 'Honey abhishekam', category: 'Pooja Services', salePrice: 30.00, inventoryApplicable: true, uom: 'Litre', threshold: 15, reductionFactor: 0.25, minQty: 1, maxQty: 0, deities: ['Lord Shiva'], deityMappingRequired: true, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: true, displayOrder: 6, status: 'Active', stock: 10 },
  { id: 'i7', code: 'ITM007', name: 'Panchamirtham', tamilName: 'பஞ்சாமிர்தம்', description: 'Sacred five-nectar mix', category: 'Pooja Services', salePrice: 25.00, inventoryApplicable: true, uom: 'Kg', threshold: 10, reductionFactor: 0.1, minQty: 1, maxQty: 0, deities: ['Lord Murugan'], deityMappingRequired: true, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: false, displayOrder: 7, status: 'Active', stock: 5 },
];

export const services: Service[] = [
  { id: 's1', code: 'SVC001', name: 'Rudra Abhishekam', tamilName: 'ருத்ராபிஷேகம்', description: 'Rudra abhishekam for Lord Shiva', salePrice: 100.00, displayOrder: 1, categoryMapping: 'Multiple', deities: ['Lord Shiva'], deityMappingRequired: true, familyMembersRequired: true, maxFamilyMembers: 4, sessionRequired: true, inventoryApplicable: true, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: true, status: 'Active' },
  { id: 's2', code: 'SVC002', name: 'Sahasranama Archana', tamilName: 'சகஸ்ரநாம அர்ச்சனை', description: '1008 names archana', salePrice: 50.00, displayOrder: 2, categoryMapping: 'Single', deities: ['Lord Shiva', 'Goddess Durga'], deityMappingRequired: true, familyMembersRequired: true, maxFamilyMembers: 2, sessionRequired: false, inventoryApplicable: false, printingGroup: 'Archana Tickets', glCode: 'GL-1002', posAvailability: true, portalAvailability: true, status: 'Active' },
  { id: 's3', code: 'SVC003', name: 'Homam - Ganapathy', tamilName: 'கணபதி ஹோமம்', description: 'Ganapathy homam', salePrice: 150.00, displayOrder: 3, categoryMapping: 'Single', deities: ['Lord Ganesha'], deityMappingRequired: true, familyMembersRequired: true, maxFamilyMembers: 6, sessionRequired: true, inventoryApplicable: true, printingGroup: 'Festival Tickets', glCode: 'GL-1001', posAvailability: true, portalAvailability: true, status: 'Active' },
  { id: 's4', code: 'SVC004', name: 'Durga Pooja', tamilName: 'துர்கா பூஜை', description: 'Special Durga pooja', salePrice: 80.00, displayOrder: 4, categoryMapping: 'Single', deities: ['Goddess Durga'], deityMappingRequired: true, familyMembersRequired: true, maxFamilyMembers: 4, sessionRequired: true, inventoryApplicable: false, printingGroup: 'Pooja Receipts', glCode: 'GL-1001', posAvailability: true, portalAvailability: true, status: 'Active' },
  { id: 's5', code: 'SVC005', name: 'Kalyana Utsavam', tamilName: 'கல்யாண உற்சவம்', description: 'Kalyana utsavam seva', salePrice: 200.00, displayOrder: 5, categoryMapping: 'Multiple', deities: ['Lord Shiva', 'Goddess Durga'], deityMappingRequired: true, familyMembersRequired: true, maxFamilyMembers: 8, sessionRequired: true, inventoryApplicable: true, printingGroup: 'Festival Tickets', glCode: 'GL-2001', posAvailability: true, portalAvailability: true, status: 'Active' },
];

export const customers: Customer[] = [
  { id: 'cu1', code: 'SSD-C0001', name: 'Rajendran Mohan', mobile: '+65 9111 2222', email: 'rajendran@email.com', status: 'Active', dob: '1985-03-15', gender: 'Male', familyMembers: [{ name: 'Lakshmi Rajendran', nakshatra: 'Bharani' }, { name: 'Karthik Rajendran', nakshatra: 'Pushya' }] },
  { id: 'cu2', code: 'SSD-C0002', name: 'Saraswathi Iyer', mobile: '+65 9222 3333', email: 'saraswathi@email.com', status: 'Active', dob: '1990-07-22', gender: 'Female', familyMembers: [{ name: 'Venkat Iyer', nakshatra: 'Rohini' }] },
  { id: 'cu3', code: 'SSD-C0003', name: 'Murugan Chettiar', mobile: '+65 9333 4444', email: 'murugan@email.com', status: 'Active', dob: '1978-11-05', gender: 'Male', familyMembers: [{ name: 'Meenakshi Murugan', nakshatra: 'Ashwini' }, { name: 'Vignesh Murugan', nakshatra: 'Krittika' }, { name: 'Aishwarya Murugan', nakshatra: 'Mrigashira' }] },
  { id: 'cu4', code: 'SSD-C0004', name: 'Geetha Nair', mobile: '+65 9444 5555', email: 'geetha@email.com', status: 'Inactive', dob: '1992-01-18', gender: 'Female', familyMembers: [] },
  { id: 'cu5', code: 'SSD-C0005', name: 'Senthil Kumar', mobile: '+65 9555 6666', email: 'senthil@email.com', status: 'Active', dob: '1983-09-10', gender: 'Male', familyMembers: [{ name: 'Divya Senthil', nakshatra: 'Anuradha' }] },
];

export const posTransactions: PosTransaction[] = [
  { id: 'pt1', txnNo: 'POS20260730001', receiptNo: 'RCP001', customer: 'Walk-in Customer', paymentMode: 'Cash', gross: 60.00, gst: 4.95, status: 'Completed', ref: '-', datetime: '2026-07-30T09:15:00', items: [{ name: 'Vilva Archana', qty: 2, price: 10 }, { name: 'Milk Abhishekam', qty: 2, price: 20 }] },
  { id: 'pt2', txnNo: 'POS20260730002', receiptNo: 'RCP002', customer: 'Rajendran Mohan', paymentMode: 'NETS', gross: 100.00, gst: 8.26, status: 'Completed', ref: 'NETS12345', datetime: '2026-07-30T10:30:00', items: [{ name: 'Rudra Abhishekam', qty: 1, price: 100 }] },
  { id: 'pt3', txnNo: 'POS20260730003', receiptNo: 'RCP003', customer: 'Walk-in Customer', paymentMode: 'PayNow', gross: 50.00, gst: 4.13, status: 'Completed', ref: 'PAYNOW67890', datetime: '2026-07-30T11:45:00', items: [{ name: 'General Donation', qty: 1, price: 50 }] },
  { id: 'pt4', txnNo: 'POS20260730004', receiptNo: 'RCP004', customer: 'Saraswathi Iyer', paymentMode: 'Cash', gross: 30.00, gst: 2.48, status: 'Completed', ref: '-', datetime: '2026-07-30T13:00:00', items: [{ name: 'Flower Garland', qty: 2, price: 15 }] },
  { id: 'pt5', txnNo: 'POS20260730005', receiptNo: 'RCP005', customer: 'Walk-in Customer', paymentMode: 'Cash', gross: 25.00, gst: 2.06, status: 'Cancelled', ref: '-', datetime: '2026-07-30T14:20:00', items: [{ name: 'Panchamirtham', qty: 1, price: 25 }] },
];

export const portalBookings: PortalBooking[] = [
  { id: 'pb1', bookingNo: 'BKG20260730001', customer: 'Senthil Kumar', service: 'Rudra Abhishekam', date: '05/08/2026', amount: 100.00, status: 'Confirmed', datetime: '2026-07-30T08:00:00' },
  { id: 'pb2', bookingNo: 'BKG20260730002', customer: 'Murugan Chettiar', service: 'Kalyana Utsavam', date: '12/08/2026', amount: 200.00, status: 'Pending', datetime: '2026-07-30T09:30:00' },
  { id: 'pb3', bookingNo: 'BKG20260730003', customer: 'Saraswathi Iyer', service: 'Sahasranama Archana', date: '07/08/2026', amount: 50.00, status: 'Confirmed', datetime: '2026-07-30T10:15:00' },
];

export const payments: Payment[] = posTransactions.map((p) => ({
  id: p.id, txnNo: p.txnNo, receiptNo: p.receiptNo, customer: p.customer, paymentMode: p.paymentMode,
  gross: p.gross, gst: p.gst, status: p.status, ref: p.ref, datetime: p.datetime,
}));

export const cancellations: Cancellation[] = [
  { id: 'cn1', refNo: 'BKG20260729005', customer: 'Geetha Nair', originalAmount: 150.00, reason: 'Unable to attend', cancellationStatus: 'Requested', refundableAmount: 135.00, actualRefund: 0, refundMode: 'Not Applicable', refundDate: '-', refundRef: '-', refundStatus: 'Pending', remarks: '' },
  { id: 'cn2', refNo: 'POS20260728012', customer: 'Rajendran Mohan', originalAmount: 80.00, reason: 'Duplicate payment', cancellationStatus: 'Approved', refundableAmount: 72.00, actualRefund: 72.00, refundMode: 'PayNow', refundDate: '29/07/2026', refundRef: 'RFND001', refundStatus: 'Processed', remarks: 'Duplicate transaction refund' },
  { id: 'cn3', refNo: 'BKG20260728008', customer: 'Senthil Kumar', originalAmount: 50.00, reason: 'Service unavailable', cancellationStatus: 'Rejected', refundableAmount: 0, actualRefund: 0, refundMode: 'Not Applicable', refundDate: '-', refundRef: '-', refundStatus: 'Not Applicable', remarks: 'Outside cancellation window' },
  { id: 'cn4', refNo: 'POS20260730005', customer: 'Walk-in Customer', originalAmount: 25.00, reason: 'Customer changed mind', cancellationStatus: 'Cancelled', refundableAmount: 22.50, actualRefund: 22.50, refundMode: 'Cash', refundDate: '30/07/2026', refundRef: 'CASH001', refundStatus: 'Processed', remarks: 'Cash refund at counter' },
];

export const inventoryHistory: InventoryHistory[] = [
  { id: 'ih1', item: 'Vilva Archana', code: 'ITM001', source: 'Manual Adjustment', type: 'Stock In', ref: 'ADJ001', qty: 50, prev: 70, balance: 120, updatedBy: 'admin.siva', datetime: '2026-07-30T08:00:00', remarks: 'Restock from supplier' },
  { id: 'ih2', item: 'Milk Abhishekam', code: 'ITM002', source: 'POS Sale', type: 'Stock Out', ref: 'POS20260730001', qty: 2, prev: 17, balance: 15, updatedBy: 'pos.counter1', datetime: '2026-07-30T09:15:00', remarks: 'POS sale' },
  { id: 'ih3', item: 'Flower Garland', code: 'ITM003', source: 'POS Sale', type: 'Stock Out', ref: 'POS20260730004', qty: 2, prev: 10, balance: 8, updatedBy: 'pos.counter1', datetime: '2026-07-30T13:00:00', remarks: 'POS sale' },
  { id: 'ih4', item: 'Panchamirtham', code: 'ITM007', source: 'Manual Adjustment', type: 'Stock Out', ref: 'ADJ002', qty: 5, prev: 10, balance: 5, updatedBy: 'mgr.finance', datetime: '2026-07-29T16:00:00', remarks: 'Damaged stock written off' },
];

export const banners: Banner[] = [
  { id: 'b1', title: 'Maha Shivaratri 2026', description: 'Join us for all-night Shivaratri celebrations on 15 Feb 2026', image: 'https://images.pexels.com/photos/8145069/pexels-photo-8145069.jpeg?auto=compress&cs=tinysrgb&w=1200', link: '/events/shivaratri', displayOrder: 1, start: '2026-01-15T00:00', end: '2026-02-16T23:59', status: 'Active' },
  { id: 'b2', title: 'Navratri Special Pooja', description: 'Nine days of Durga pooja - book your services online', image: 'https://images.pexels.com/photos/8145056/pexels-photo-8145056.jpeg?auto=compress&cs=tinysrgb&w=1200', link: '/services/navratri', displayOrder: 2, start: '2026-09-15T00:00', end: '2026-10-10T23:59', status: 'Active' },
  { id: 'b3', title: 'Temple Renovation Fund', description: 'Support our temple renovation project', image: 'https://images.pexels.com/photos/8145044/pexels-photo-8145044.jpeg?auto=compress&cs=tinysrgb&w=1200', link: '/donate', displayOrder: 3, start: '2026-07-01T00:00', end: '2026-12-31T23:59', status: 'Active' },
];

export const announcements: Announcement[] = [
  { id: 'a1', title: 'Temple Timing Change', content: 'From 1 August 2026, morning pooja will begin at 5:30 AM instead of 6:00 AM. Please plan your visit accordingly.', start: '2026-07-25T00:00', end: '2026-08-15T23:59', displayOrder: 1, status: 'Active' },
  { id: 'a2', title: 'New Online Booking System', content: 'We are pleased to launch our new online booking system. You can now book pooja services from the comfort of your home.', start: '2026-07-01T00:00', end: '2026-07-31T23:59', displayOrder: 2, status: 'Active' },
  { id: 'a3', title: 'Volunteers Needed', content: 'We are looking for volunteers for the upcoming Maha Shivaratri festival. Please contact the temple office.', start: '2026-01-01T00:00', end: '2026-02-14T23:59', displayOrder: 3, status: 'Inactive' },
];

export const menuItems: MenuItem[] = [
  { id: 'm1', name: 'Home', type: 'Header', linkType: 'Internal Page', page: '/home', parent: '-', displayOrder: 1, status: 'Active' },
  { id: 'm2', name: 'About Us', type: 'Header', linkType: 'Internal Page', page: '/about', parent: '-', displayOrder: 2, status: 'Active' },
  { id: 'm3', name: 'Services', type: 'Header', linkType: 'Internal Page', page: '/services', parent: '-', displayOrder: 3, status: 'Active' },
  { id: 'm4', name: 'Bookings', type: 'Header', linkType: 'Internal Page', page: '/bookings', parent: 'Services', displayOrder: 1, status: 'Active' },
  { id: 'm5', name: 'Donations', type: 'Header', linkType: 'Internal Page', page: '/donations', parent: '-', displayOrder: 4, status: 'Active' },
  { id: 'm6', name: 'Contact', type: 'Header', linkType: 'Internal Page', page: '/contact', parent: '-', displayOrder: 5, status: 'Active' },
  { id: 'm7', name: 'Privacy Policy', type: 'Footer', linkType: 'Internal Page', page: '/privacy', parent: '-', displayOrder: 1, status: 'Active' },
  { id: 'm8', name: 'Terms of Service', type: 'Footer', linkType: 'Internal Page', page: '/terms', parent: '-', displayOrder: 2, status: 'Active' },
  { id: 'm9', name: 'Facebook', type: 'Footer', linkType: 'External URL', page: 'https://facebook.com/ssdtemple', parent: '-', displayOrder: 3, status: 'Active' },
];

export const staticPages: StaticPage[] = [
  { id: 'sp1', title: 'About Us', slug: 'about', content: 'Sri Siva Durga Temple has been a spiritual home for the Hindu community in Singapore since 1985. Our temple is dedicated to Lord Shiva and Goddess Durga...', metaTitle: 'About Sri Siva Durga Temple', metaDesc: 'Learn about the history and mission of Sri Siva Durga Temple', status: 'Published' },
  { id: 'sp2', title: 'Privacy Policy', slug: 'privacy', content: 'This privacy policy describes how Sri Siva Durga Temple collects, uses and protects your information...', metaTitle: 'Privacy Policy', metaDesc: 'Our privacy policy and data protection practices', status: 'Published' },
  { id: 'sp3', title: 'Terms of Service', slug: 'terms', content: 'By using our services you agree to the following terms and conditions...', metaTitle: 'Terms of Service', metaDesc: 'Terms and conditions for using temple services', status: 'Published' },
  { id: 'sp4', title: 'Festival Calendar', slug: 'festivals', content: 'Our temple celebrates many festivals throughout the year...', metaTitle: 'Festival Calendar', metaDesc: 'Upcoming festivals and events', status: 'Draft' },
];

export const contactInfo: Contact = {
  id: 'ct1', address: '123 Serangoon Road, Singapore 218223', phone: '+65 6234 5678', email: 'info@ssdtemple.sg', hours: 'Mon-Sun: 6:00 AM - 9:00 PM', status: 'Active',
};

export const highlights: Highlight[] = [
  { id: 'h1', contentType: 'Event', selection: 'Maha Shivaratri', displayOrder: 1, start: '2026-01-15T00:00', end: '2026-02-16T23:59', status: 'Active' },
  { id: 'h2', contentType: 'Service', selection: 'Rudra Abhishekam', displayOrder: 2, start: '2026-07-01T00:00', end: '2026-12-31T23:59', status: 'Active' },
  { id: 'h3', contentType: 'Item', selection: 'General Donation', displayOrder: 3, start: '2026-07-01T00:00', end: '2026-12-31T23:59', status: 'Active' },
];

export const enquiries: Enquiry[] = [
  { id: 'e1', number: 'ENQ001', customer: 'Kavitha Raj', email: 'kavitha@email.com', mobile: '+65 8678 9012', subject: 'Booking for Rudra Abhishekam', message: 'I would like to book Rudra Abhishekam for next Friday. What time slots are available?', submitted: '2026-07-30T10:30:00', status: 'New', remarks: '' },
  { id: 'e2', number: 'ENQ002', customer: 'Rajendran Mohan', email: 'rajendran@email.com', mobile: '+65 9111 2222', subject: 'Donation receipt', message: 'I made a donation last week but did not receive a receipt. Could you please assist?', submitted: '2026-07-29T14:15:00', status: 'In Progress', remarks: 'Checking payment records' },
  { id: 'e3', number: 'ENQ003', customer: 'Saraswathi Iyer', email: 'saraswathi@email.com', mobile: '+65 9222 3333', subject: 'Festival timing', message: 'What time does the Navratri pooja start each evening?', submitted: '2026-07-28T09:00:00', status: 'Responded', remarks: 'Replied with schedule' },
  { id: 'e4', number: 'ENQ004', customer: 'Senthil Kumar', email: 'senthil@email.com', mobile: '+65 9555 6666', subject: 'Parking enquiry', message: 'Is parking available at the temple?', submitted: '2026-07-27T16:45:00', status: 'Closed', remarks: 'Directed to nearby parking' },
];

export const feedbacks: Feedback[] = [
  { id: 'f1', number: 'FB001', customer: 'Rajendran Mohan', rating: 5, feedback: 'Excellent service and the priests were very kind. The Rudra Abhishekam was conducted beautifully.', submitted: '2026-07-29', reviewStatus: 'Approved', publicVisible: true, remarks: '' },
  { id: 'f2', number: 'FB002', customer: 'Saraswathi Iyer', rating: 4, feedback: 'Very peaceful atmosphere. The archana service was good but waiting time was a bit long.', submitted: '2026-07-28', reviewStatus: 'Pending', publicVisible: false, remarks: '' },
  { id: 'f3', number: 'FB003', customer: 'Murugan Chettiar', rating: 5, feedback: 'The Kalyana Utsavam was wonderful. Highly recommend booking online for convenience.', submitted: '2026-07-27', reviewStatus: 'Approved', publicVisible: true, remarks: '' },
  { id: 'f4', number: 'FB004', customer: 'Geetha Nair', rating: 3, feedback: 'Temple is nice but the online booking system could be improved.', submitted: '2026-07-26', reviewStatus: 'Pending', publicVisible: false, remarks: '' },
];

export interface Nakshathira {
  id: string; code: string; mainFlag: boolean; displayOrder: number; nakshathiram: string; tamil: string; rasi: string; tamilRasi: string; status: string;
}

export const nakshathiraRecords: Nakshathira[] = [
  { id: 'n1', code: 'NS01', mainFlag: true, displayOrder: 1, nakshathiram: 'Ashwini', tamil: 'அஸ்வினி', rasi: 'Mesha', tamilRasi: 'மேஷம்', status: 'Active' },
  { id: 'n2', code: 'NS02', mainFlag: true, displayOrder: 2, nakshathiram: 'Bharani', tamil: 'பரணி', rasi: 'Mesha', tamilRasi: 'மேஷம்', status: 'Active' },
  { id: 'n3', code: 'NS03', mainFlag: true, displayOrder: 3, nakshathiram: 'Krittika', tamil: 'கிருத்திகை', rasi: 'Vrishabha', tamilRasi: 'ரிஷபம்', status: 'Active' },
  { id: 'n4', code: 'NS04', mainFlag: true, displayOrder: 4, nakshathiram: 'Rohini', tamil: 'ரோகிணி', rasi: 'Vrishabha', tamilRasi: 'ரிஷபம்', status: 'Active' },
  { id: 'n5', code: 'NS05', mainFlag: true, displayOrder: 5, nakshathiram: 'Mrigashira', tamil: 'மிருகசீரிஷம்', rasi: 'Mithuna', tamilRasi: 'மிதுனம்', status: 'Active' },
  { id: 'n6', code: 'NS06', mainFlag: false, displayOrder: 6, nakshathiram: 'Ardra', tamil: 'திருவாதிரை', rasi: 'Mithuna', tamilRasi: 'மிதுனம்', status: 'Active' },
  { id: 'n7', code: 'NS07', mainFlag: false, displayOrder: 7, nakshathiram: 'Punarvasu', tamil: 'புனர்பூசம்', rasi: 'Karkata', tamilRasi: 'கடகம்', status: 'Active' },
  { id: 'n8', code: 'NS08', mainFlag: true, displayOrder: 8, nakshathiram: 'Pushya', tamil: 'பூசம்', rasi: 'Karkata', tamilRasi: 'கடகம்', status: 'Active' },
];

export const auditLogs: AuditLog[] = [
  { id: 'al1', user: 'admin.siva', action: 'Updated GST Percentage', module: 'GST Management', timestamp: '2026-07-30T11:30:00', details: 'Changed GST from 8% to 9%' },
  { id: 'al2', user: 'pos.counter1', action: 'Created POS Transaction', module: 'POS', timestamp: '2026-07-30T09:15:00', details: 'Transaction POS20260730001 - S$60.00' },
  { id: 'al3', user: 'mgr.finance', action: 'Approved Cancellation', module: 'Cancellation Requests', timestamp: '2026-07-29T15:00:00', details: 'Approved refund for BKG20260729005' },
  { id: 'al4', user: 'content.editor', action: 'Published Announcement', module: 'Announcements', timestamp: '2026-07-28T10:00:00', details: 'Published "Temple Timing Change"' },
  { id: 'al5', user: 'admin.siva', action: 'Created User', module: 'User Management', timestamp: '2026-07-27T14:30:00', details: 'Created user account for Kavitha Raj' },
];

// Dashboard stats
export const dashboardStats = {
  totalCollections: 265.00,
  posSales: 215.00,
  onlineBookings: 350.00,
  cashCollection: 115.00,
  netsCollection: 100.00,
  paynowCollection: 50.00,
  totalGst: 21.88,
  pendingCancellations: 1,
  pendingRefunds: 1,
  lowStockItems: 2,
  activeCustomers: 4,
  activeServices: 5,
  activeItems: 7,
};

export const dailyCollectionData = [
  { day: 'Mon', amount: 320 }, { day: 'Tue', amount: 450 }, { day: 'Wed', amount: 280 },
  { day: 'Thu', amount: 510 }, { day: 'Fri', amount: 680 }, { day: 'Sat', amount: 890 }, { day: 'Sun', amount: 265 },
];

export const paymentModeData = [
  { name: 'Cash', value: 115, color: '#942237' },
  { name: 'NETS', value: 100, color: '#fa7710' },
  { name: 'PayNow', value: 50, color: '#b8860a' },
];

export const lowStockItems = [
  { id: 'i3', name: 'Flower Garland', code: 'ITM003', stock: 8, threshold: 30 },
  { id: 'i7', name: 'Panchamirtham', code: 'ITM007', stock: 5, threshold: 10 },
];
