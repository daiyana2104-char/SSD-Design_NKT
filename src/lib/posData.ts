// POS-specific mock data with realistic temple offerings.

// =========================================================
// INTERFACES
// =========================================================

export interface PosDeity {
  id: string;
  name: string;
  tamilName: string;
}

export interface PosCategory {
  id: string;
  name: string;
  tamilName: string;
  colour: string;
  icon: string;
}

export interface PosSubCategory {
  id: string;
  name: string;
  tamilName?: string;

  // Parent category
  category: string;

  displayOrder: number;

  status: 'Active' | 'Inactive';
}

export interface PosPrintingGroup {
  id: string;
  name: string;
}

export interface PosNakshatra {
  id: string;
  name: string;
}

export interface PosSession {
  id: string;
  name: string;
  time: string;
}

export interface PosFamilyMember {
  name: string;
  nakshatra: string;
}

export interface PosCustomer {
  id: string;
  code: string;
  name: string;
  mobile: string;
  email: string;

  status: string;

  portalAccount: boolean;

  familyMembers: PosFamilyMember[];
}

// =========================================================
// OFFERING
// =========================================================

export interface PosOffering {
  id: string;
  code: string;
  name: string;
  tamilName: string;

  type: 'Service' | 'Item';

  // Parent category
  category: string;

  // Optional subcategory.
  // Offerings without a subcategory will continue
  // displaying directly in POS.
  subCategory?: string;

  price: number;

  gstClass:
    | 'Applicable'
    | 'Exempted'
    | 'Out of Scope';

  status: string;

  posAvailable: boolean;

  deities: string[];

  deityRequired: boolean;

  familyMembersRequired: boolean;

  maxFamilyMembers: number;

  eventDateRequired: boolean;

  sessionRequired: boolean;

  individualEntry: boolean;

  inventoryApplicable: boolean;

  stock: number;

  threshold: number;

  reductionFactor: number;

  printingGroup: string;

  isEvent?: boolean;

  eventStartDate?: string;

  eventEndDate?: string;

  eventSlots?: PosEventSlot[];
}

// =========================================================
// EVENT SLOT
// =========================================================

export interface PosEventSlot {
  session:
    | 'Morning'
    | 'Evening';

  slotName: string;

  startTime: string;

  endTime: string;

  maxCount: number;

  status: string;
}

// =========================================================
// CART
// =========================================================

export interface PosCartLine {
  id: string;

  offeringId: string;

  code: string;

  name: string;

  tamilName: string;

  type:
    | 'Service'
    | 'Item';

  price: number;

  qty: number;

  gstClass:
    | 'Applicable'
    | 'Exempted'
    | 'Out of Scope';

  deities?: string[];

  devoteeName?: string;

  nakshatra?: string;

  devotees?: {
    name: string;
    nakshatra: string;
  }[];

  eventDate?: string;

  session?: string;

  printingGroup: string;

  gstAmount: number;

  ledgerAmount: number;

  grossAmount: number;
}

// =========================================================
// TRANSACTION
// =========================================================

export interface PosTransaction {
  id: string;

  txnNo: string;

  receiptNo: string;

  customer:
    | PosCustomer
    | null;

  customerName: string;

  lines: PosCartLine[];

  grossAmount: number;

  gstAmount: number;

  ledgerAmount: number;

  roundOff: number;

  payableAmount: number;

  paymentMode: string;

  paymentStatus: string;

  txnStatus: string;

  paidAmount: number;

  changeAmount: number;

  paymentRef: string;

  posUser: string;

  datetime: string;

  reprintCount: number;

  cancellation?: {
    reason: string;

    user: string;

    datetime: string;

    refundMode: string;

    refundStatus: string;

    refundAmount: number;

    refundRef: string;

    refundDate: string;

    remarks: string;
  };

  audit: PosAuditEntry[];
}

// =========================================================
// AUDIT
// =========================================================

export interface PosAuditEntry {
  action: string;

  module: string;

  ref: string;

  user: string;

  datetime: string;

  prevValue?: string;

  newValue?: string;
}

// =========================================================
// USER
// =========================================================

export interface PosUser {
  username: string;

  password: string;

  name: string;

  role: string;

  designation: string;

  email: string;

  mobile: string;

  accessValidUntil: string;

  status: string;

  canCancel: boolean;
}

// =========================================================
// USERS
// =========================================================

export const posUsers: PosUser[] = [
  {
    username: 'posuser',
    password: 'Temple@123',
    name: 'Lakshmi Devi',
    role: 'POS User',
    designation: 'Counter Executive',
    email: 'pos1@ssdtemple.sg',
    mobile: '+65 8234 5678',
    accessValidUntil: '31/12/2026',
    status: 'Active',
    canCancel: true,
  },
  {
    username: 'expireduser',
    password: 'Temple@123',
    name: 'Ravi Subramaniam',
    role: 'POS User',
    designation: 'Counter Executive',
    email: 'pos2@ssdtemple.sg',
    mobile: '+65 9345 6789',
    accessValidUntil: '31/12/2025',
    status: 'Active',
    canCancel: false,
  },
  {
    username: 'inactiveuser',
    password: 'Temple@123',
    name: 'Priya Murugan',
    role: 'POS User',
    designation: 'Counter Executive',
    email: 'pos3@ssdtemple.sg',
    mobile: '+65 8456 7890',
    accessValidUntil: '31/12/2026',
    status: 'Inactive',
    canCancel: false,
  },
];

// =========================================================
// DEITIES
// =========================================================

export const posDeities: PosDeity[] = [
  {
    id: 'd1',
    name: 'Sri Durga',
    tamilName: 'ஸ்ரீ துர்கா',
  },
  {
    id: 'd2',
    name: 'Sri Siva',
    tamilName: 'ஸ்ரீ சிவன்',
  },
  {
    id: 'd3',
    name: 'Sri Vinayagar',
    tamilName: 'ஸ்ரீ விநாயகர்',
  },
  {
    id: 'd4',
    name: 'Sri Murugan',
    tamilName: 'ஸ்ரீ முருகன்',
  },
  {
    id: 'd5',
    name: 'Sri Anjaneyar',
    tamilName: 'ஸ்ரீ அஞ்சநேயர்',
  },
  {
    id: 'd6',
    name: 'Navagraha',
    tamilName: 'நவக்கிரகம்',
  },
];

// =========================================================
// CATEGORIES
// =========================================================

export const posCategories: PosCategory[] = [
  {
    id: 'cat1',
    name: 'Archanai',
    tamilName: 'அர்ச்சனை',
    colour: '#942237',
    icon: 'sparkles',
  },
  {
    id: 'cat2',
    name: 'Pooja',
    tamilName: 'பூஜை',
    colour: '#fa7710',
    icon: 'flame',
  },
  {
    id: 'cat3',
    name: 'Prayer Items',
    tamilName: 'பிரார்த்தனை பொருட்கள்',
    colour: '#b8860a',
    icon: 'package',
  },
  {
    id: 'cat4',
    name: 'Prasadam',
    tamilName: 'பிரசாதம்',
    colour: '#7e4d38',
    icon: 'gift',
  },
  {
    id: 'cat5',
    name: 'Special Events',
    tamilName: 'சிறப்பு நிகழ்வுகள்',
    colour: '#d4475c',
    icon: 'calendar',
  },
];

// =========================================================
// SUBCATEGORIES
// =========================================================

export const posSubCategories: PosSubCategory[] = [
  // Archanai
  {
    id: 'psc1',
    name: 'Archanai Services',
    tamilName: 'அர்ச்சனை சேவைகள்',
    category: 'Archanai',
    displayOrder: 1,
    status: 'Active',
  },

  // Pooja
  {
    id: 'psc2',
    name: 'Special Pooja',
    tamilName: 'சிறப்பு பூஜை',
    category: 'Pooja',
    displayOrder: 1,
    status: 'Active',
  },

  // Prayer Items
  {
    id: 'psc3',
    name: 'Offerings',
    tamilName: 'காணிக்கைகள்',
    category: 'Prayer Items',
    displayOrder: 1,
    status: 'Active',
  },
  {
    id: 'psc4',
    name: 'Lamps',
    tamilName: 'விளக்குகள்',
    category: 'Prayer Items',
    displayOrder: 2,
    status: 'Active',
  },
];

// =========================================================
// PRINTING GROUPS
// =========================================================

export const posPrintingGroups: PosPrintingGroup[] = [
  {
    id: 'pg1',
    name: 'Priest Counter',
  },
  {
    id: 'pg2',
    name: 'Prayer Item Collection',
  },
  {
    id: 'pg3',
    name: 'Lamp Collection',
  },
  {
    id: 'pg4',
    name: 'Prasadam Collection',
  },
];

// =========================================================
// NAKSHATRAS
// =========================================================

export const posNakshatras: PosNakshatra[] = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
].map(
  (name, index) => ({
    id:
      'n' +
      (index + 1),

    name,
  }),
);

// =========================================================
// SESSIONS
// =========================================================

export const posSessions: PosSession[] = [
  {
    id: 's1',
    name: 'Morning',
    time: '7:00 AM',
  },
  {
    id: 's2',
    name: 'Morning',
    time: '9:00 AM',
  },
  {
    id: 's3',
    name: 'Evening',
    time: '6:00 PM',
  },
  {
    id: 's4',
    name: 'Rahu Kalam Session',
    time: '4:30 PM',
  },
];

// =========================================================
// CUSTOMERS
// =========================================================

export const posCustomers: PosCustomer[] = [
  {
    id: 'c1',
    code: 'CUST001',
    name: 'Rajendran Mohan',
    mobile: '+65 9111 2222',
    email: 'rajendran@email.com',
    status: 'Active',
    portalAccount: true,

    familyMembers: [
      {
        name: 'Lakshmi Rajendran',
        nakshatra: 'Bharani',
      },
      {
        name: 'Karthik Rajendran',
        nakshatra: 'Pushya',
      },
    ],
  },

  {
    id: 'c2',
    code: 'CUST002',
    name: 'Saraswathi Iyer',
    mobile: '+65 9222 3333',
    email: 'saraswathi@email.com',
    status: 'Active',
    portalAccount: true,

    familyMembers: [
      {
        name: 'Venkat Iyer',
        nakshatra: 'Rohini',
      },
    ],
  },

  {
    id: 'c3',
    code: 'CUST003',
    name: 'Murugan Chettiar',
    mobile: '+65 9333 4444',
    email: 'murugan@email.com',
    status: 'Active',
    portalAccount: false,

    familyMembers: [
      {
        name: 'Meenakshi Murugan',
        nakshatra: 'Ashwini',
      },
      {
        name: 'Vignesh Murugan',
        nakshatra: 'Krittika',
      },
    ],
  },

  {
    id: 'c4',
    code: 'CUST004',
    name: 'Geetha Nair',
    mobile: '+65 9444 5555',
    email: 'geetha@email.com',
    status: 'Inactive',
    portalAccount: false,
    familyMembers: [],
  },

  {
    id: 'c5',
    code: 'CUST005',
    name: 'Senthil Kumar',
    mobile: '+65 9555 6666',
    email: 'senthil@email.com',
    status: 'Active',
    portalAccount: true,

    familyMembers: [
      {
        name: 'Divya Senthil',
        nakshatra: 'Anuradha',
      },
    ],
  },
];

// =========================================================
// OFFERINGS
// =========================================================

export const posOfferings: PosOffering[] = [

  // =======================================================
  // SERVICES - ARCHANAI
  // Folder: Archanai Services
  // =======================================================

  {
    id: 'o1',
    code: 'ARC001',

    name: 'Coconut Archanai',

    tamilName:
      'தேங்காய் அர்ச்சனை',

    type: 'Service',

    category: 'Archanai',

    subCategory:
      'Archanai Services',

    price: 5.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Durga',
      'Sri Siva',
      'Sri Vinayagar',
      'Sri Murugan',
      'Sri Anjaneyar',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 1,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: true,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',
  },

  {
    id: 'o2',
    code: 'ARC002',

    name: 'Fruit Archanai',

    tamilName:
      'பழ அர்ச்சனை',

    type: 'Service',

    category: 'Archanai',

    subCategory:
      'Archanai Services',

    price: 10.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Durga',
      'Sri Siva',
      'Sri Vinayagar',
      'Sri Murugan',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 1,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: true,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',
  },

  {
    id: 'o3',
    code: 'ARC003',

    name:
      'Navagraha Archanai',

    tamilName:
      'நவக்கிரக அர்ச்சனை',

    type: 'Service',

    category: 'Archanai',

    subCategory:
      'Archanai Services',

    price: 15.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Navagraha',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 1,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: true,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',
  },

  // =======================================================
  // SERVICES - POOJA
  // Folder: Special Pooja
  // =======================================================

  {
    id: 'o4',
    code: 'POO001',

    name: 'Rahu Kala Pooja',

    tamilName:
      'ராகு கால பூஜை',

    type: 'Service',

    category: 'Pooja',

    subCategory:
      'Special Pooja',

    price: 20.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Durga',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 2,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: false,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',
  },

  {
    id: 'o5',
    code: 'POO002',

    name: 'Abishegam',

    tamilName:
      'அபிஷேகம்',

    type: 'Service',

    category: 'Pooja',

    subCategory:
      'Special Pooja',

    price: 50.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Siva',
      'Sri Durga',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 4,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 30,

    threshold: 10,

    reductionFactor: 1,

    printingGroup:
      'Priest Counter',
  },

  {
    id: 'o6',
    code: 'POO003',

    name: 'Homam',

    tamilName:
      'ஹோமம்',

    type: 'Service',

    category: 'Pooja',

    subCategory:
      'Special Pooja',

    price: 100.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Siva',
      'Sri Vinayagar',
      'Sri Murugan',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 6,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 8,

    threshold: 5,

    reductionFactor: 1,

    printingGroup:
      'Priest Counter',
  },

  // =======================================================
  // ITEMS - PRAYER ITEMS
  // Folder: Offerings
  // =======================================================

  {
    id: 'o7',
    code: 'ITM001',

    name: 'Milk Offering',

    tamilName:
      'பால் காணிக்கை',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Offerings',

    price: 3.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 50,

    threshold: 15,

    reductionFactor: 1,

    printingGroup:
      'Prayer Item Collection',
  },

  {
    id: 'o8',
    code: 'ITM002',

    name:
      'Paneer Offering',

    tamilName:
      'பன்னீர் காணிக்கை',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Offerings',

    price: 4.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 12,

    threshold: 10,

    reductionFactor: 1,

    printingGroup:
      'Prayer Item Collection',
  },

  {
    id: 'o9',
    code: 'ITM003',

    name: 'Coconut',

    tamilName:
      'தேங்காய்',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Offerings',

    price: 2.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 100,

    threshold: 20,

    reductionFactor: 1,

    printingGroup:
      'Prayer Item Collection',
  },

  // =======================================================
  // ITEMS - PRAYER ITEMS
  // Folder: Lamps
  // =======================================================

  {
    id: 'o10',
    code: 'LMP001',

    name: 'Ghee Lamp',

    tamilName:
      'நெய் விளக்கு',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Lamps',

    price: 2.5,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 8,

    threshold: 10,

    reductionFactor: 1,

    printingGroup:
      'Lamp Collection',
  },

  {
    id: 'o11',
    code: 'LMP002',

    name:
      'Sesame Oil Lamp',

    tamilName:
      'எள் எண்ணெய் விளக்கு',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Lamps',

    price: 2.5,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 0,

    threshold: 10,

    reductionFactor: 1,

    printingGroup:
      'Lamp Collection',
  },

  // =======================================================
  // PRASADAM
  // No subcategory.
  // This remains directly visible as an Item card.
  // =======================================================

  {
    id: 'o12',
    code: 'PRS001',

    name: 'Prasadam',

    tamilName:
      'பிரசாதம்',

    type: 'Item',

    category: 'Prasadam',

    price: 5.0,

    gstClass: 'Exempted',

    status: 'Active',

    posAvailable: true,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: true,

    stock: 40,

    threshold: 10,

    reductionFactor: 1,

    printingGroup:
      'Prasadam Collection',
  },

  // =======================================================
  // SPECIAL EVENT SERVICE
  // No subcategory.
  // Remains directly visible.
  // =======================================================

  {
    id: 'o13',
    code: 'EVT001',

    name:
      'Kalyana Utsavam',

    tamilName:
      'கல்யாண உற்சவம்',

    type: 'Service',

    category:
      'Special Events',

    price: 200.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Siva',
      'Sri Durga',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 8,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: true,

    inventoryApplicable: true,

    stock: 5,

    threshold: 2,

    reductionFactor: 1,

    printingGroup:
      'Priest Counter',
  },

  // =======================================================
  // INACTIVE / POS UNAVAILABLE
  // =======================================================

  {
    id: 'o14',
    code: 'ITM004',

    name:
      'Old Stock Item',

    tamilName:
      'பழைய பொருள்',

    type: 'Item',

    category:
      'Prayer Items',

    subCategory:
      'Offerings',

    price: 1.0,

    gstClass:
      'Out of Scope',

    status: 'Inactive',

    posAvailable: false,

    deities: [],

    deityRequired: false,

    familyMembersRequired: false,

    maxFamilyMembers: 0,

    eventDateRequired: false,

    sessionRequired: false,

    individualEntry: false,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Prayer Item Collection',
  },

  // =======================================================
  // EVENTS
  // No subcategory.
  // Events remain directly visible.
  // =======================================================

  {
    id: 'o15',
    code: 'EVT002',

    name:
      'Maha Shivaratri',

    tamilName:
      'மகா சிவராத்திரி',

    type: 'Service',

    category:
      'Special Events',

    price: 50.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Siva',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 2,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: true,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',

    isEvent: true,

    eventStartDate:
      '2026-02-15',

    eventEndDate:
      '2026-02-16',

    eventSlots: [
      {
        session:
          'Morning',

        slotName:
          '6:00 AM - 8:00 AM',

        startTime:
          '06:00',

        endTime:
          '08:00',

        maxCount:
          50,

        status:
          'Active',
      },

      {
        session:
          'Morning',

        slotName:
          '8:00 AM - 10:00 AM',

        startTime:
          '08:00',

        endTime:
          '10:00',

        maxCount:
          40,

        status:
          'Active',
      },

      {
        session:
          'Evening',

        slotName:
          '5:00 PM - 7:00 PM',

        startTime:
          '17:00',

        endTime:
          '19:00',

        maxCount:
          60,

        status:
          'Active',
      },
    ],
  },

  {
    id: 'o16',
    code: 'EVT003',

    name:
      'Navratri Special',

    tamilName:
      'நவராத்ரி சிறப்பு',

    type: 'Service',

    category:
      'Special Events',

    price: 30.0,

    gstClass: 'Applicable',

    status: 'Active',

    posAvailable: true,

    deities: [
      'Sri Durga',
    ],

    deityRequired: true,

    familyMembersRequired: true,

    maxFamilyMembers: 2,

    eventDateRequired: true,

    sessionRequired: true,

    individualEntry: true,

    inventoryApplicable: false,

    stock: 0,

    threshold: 0,

    reductionFactor: 0,

    printingGroup:
      'Priest Counter',

    isEvent: true,

    eventStartDate:
      '2026-09-25',

    eventEndDate:
      '2026-10-05',

    eventSlots: [
      {
        session:
          'Evening',

        slotName:
          '6:00 PM - 8:00 PM',

        startTime:
          '18:00',

        endTime:
          '20:00',

        maxCount:
          80,

        status:
          'Active',
      },
    ],
  },
];

// =========================================================
// GST
// =========================================================

export const GST_RATE =
  0.09;

export function calcGst(
  price: number,
  gstClass: string,
): number {
  if (
    gstClass ===
    'Applicable'
  ) {
    return (
      price /
      (1 + GST_RATE)
    ) * GST_RATE;
  }

  return 0;
}

export function calcLedger(
  price: number,
  gstClass: string,
): number {
  if (
    gstClass ===
    'Applicable'
  ) {
    return (
      price /
      (1 + GST_RATE)
    );
  }

  return price;
}

// =========================================================
// OFFERING STATUS
// =========================================================

export function getOfferingStatus(
  offering: PosOffering,
):
  | 'Available'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Inactive'
  | 'POS Unavailable' {

  if (
    !offering.posAvailable
  ) {
    return 'POS Unavailable';
  }

  if (
    offering.status !==
    'Active'
  ) {
    return 'Inactive';
  }

  if (
    offering.inventoryApplicable
  ) {
    if (
      offering.stock <= 0
    ) {
      return 'Out of Stock';
    }

    if (
      offering.stock <=
      offering.threshold
    ) {
      return 'Low Stock';
    }
  }

  return 'Available';
}

// =========================================================
// PRE-SEEDED TRANSACTIONS
// =========================================================

export function createSeedTransactions(): PosTransaction[] {

  const mkLine = (
    offering: PosOffering,
    qty: number,
    deities?: string[],
    name?: string,
    nakshatra?: string,
    date?: string,
    session?: string,
  ): PosCartLine => {

    const gross =
      offering.price *
      qty;

    const gst =
      calcGst(
        gross,
        offering.gstClass,
      );

    const ledger =
      calcLedger(
        gross,
        offering.gstClass,
      );

    return {
      id:
        Math.random()
          .toString(36)
          .slice(2),

      offeringId:
        offering.id,

      code:
        offering.code,

      name:
        offering.name,

      tamilName:
        offering.tamilName,

      type:
        offering.type,

      price:
        offering.price,

      qty,

      gstClass:
        offering.gstClass,

      deities,

      devoteeName:
        name,

      nakshatra,

      eventDate:
        date,

      session,

      printingGroup:
        offering.printingGroup,

      gstAmount:
        gst,

      ledgerAmount:
        ledger,

      grossAmount:
        gross,
    };
  };

  return [

    // =====================================================
    // TRANSACTION 1
    // =====================================================

    {
      id: 't1',

      txnNo:
        'POS20260728001',

      receiptNo:
        'RCP1001',

      customer:
        posCustomers[0],

      customerName:
        'Rajendran Mohan',

      lines: [
        mkLine(
          posOfferings[0],
          1,
          ['Sri Siva'],
          'Rajendran Mohan',
          'Bharani',
        ),

        mkLine(
          posOfferings[6],
          2,
        ),
      ],

      grossAmount:
        11,

      gstAmount:
        calcGst(
          11,
          'Applicable',
        ),

      ledgerAmount:
        calcLedger(
          11,
          'Applicable',
        ),

      roundOff:
        0,

      payableAmount:
        11,

      paymentMode:
        'Cash',

      paymentStatus:
        'Successful',

      txnStatus:
        'Completed',

      paidAmount:
        15,

      changeAmount:
        4,

      paymentRef:
        '-',

      posUser:
        'posuser',

      datetime:
        '2026-07-28T10:30:00',

      reprintCount:
        0,

      audit: [
        {
          action:
            'Transaction created',

          module:
            'POS',

          ref:
            'POS20260728001',

          user:
            'posuser',

          datetime:
            '2026-07-28T10:30:00',
        },

        {
          action:
            'Payment successful',

          module:
            'POS',

          ref:
            'POS20260728001',

          user:
            'posuser',

          datetime:
            '2026-07-28T10:31:00',
        },

        {
          action:
            'Receipt generated',

          module:
            'POS',

          ref:
            'RCP1001',

          user:
            'posuser',

          datetime:
            '2026-07-28T10:31:00',
        },
      ],
    },

    // =====================================================
    // TRANSACTION 2
    // =====================================================

    {
      id: 't2',

      txnNo:
        'POS20260728002',

      receiptNo:
        'RCP1002',

      customer:
        posCustomers[2],

      customerName:
        'Murugan Chettiar',

      lines: [
        mkLine(
          posOfferings[4],
          1,
          ['Sri Siva'],
          'Murugan Chettiar',
          'Ashwini',
          '2026-07-30',
          'Morning – 7:00 AM',
        ),

        mkLine(
          posOfferings[8],
          3,
        ),
      ],

      grossAmount:
        56,

      gstAmount:
        calcGst(
          56,
          'Applicable',
        ),

      ledgerAmount:
        calcLedger(
          56,
          'Applicable',
        ),

      roundOff:
        0,

      payableAmount:
        56,

      paymentMode:
        'NETS',

      paymentStatus:
        'Successful',

      txnStatus:
        'Completed',

      paidAmount:
        56,

      changeAmount:
        0,

      paymentRef:
        'NETS54321',

      posUser:
        'posuser',

      datetime:
        '2026-07-28T14:15:00',

      reprintCount:
        1,

      audit: [
        {
          action:
            'Transaction created',

          module:
            'POS',

          ref:
            'POS20260728002',

          user:
            'posuser',

          datetime:
            '2026-07-28T14:15:00',
        },

        {
          action:
            'Payment successful',

          module:
            'POS',

          ref:
            'POS20260728002',

          user:
            'posuser',

          datetime:
            '2026-07-28T14:16:00',
        },

        {
          action:
            'Reprint',

          module:
            'POS',

          ref:
            'RCP1002',

          user:
            'posuser',

          datetime:
            '2026-07-28T15:00:00',
        },
      ],
    },

    // =====================================================
    // TRANSACTION 3
    // =====================================================

    {
      id: 't3',

      txnNo:
        'POS20260729001',

      receiptNo:
        'RCP1003',

      customer:
        null,

      customerName:
        'Walk-in Customer',

      lines: [
        mkLine(
          posOfferings[0],
          1,
          ['Sri Durga'],
        ),

        mkLine(
          posOfferings[11],
          2,
        ),
      ],

      grossAmount:
        15,

      gstAmount:
        calcGst(
          5,
          'Applicable',
        ),

      ledgerAmount:
        calcLedger(
          5,
          'Applicable',
        ) + 10,

      roundOff:
        0,

      payableAmount:
        15,

      paymentMode:
        'PayNow',

      paymentStatus:
        'Successful',

      txnStatus:
        'Completed',

      paidAmount:
        15,

      changeAmount:
        0,

      paymentRef:
        'PAYNOW98765',

      posUser:
        'posuser',

      datetime:
        '2026-07-29T09:00:00',

      reprintCount:
        0,

      audit: [
        {
          action:
            'Transaction created',

          module:
            'POS',

          ref:
            'POS20260729001',

          user:
            'posuser',

          datetime:
            '2026-07-29T09:00:00',
        },

        {
          action:
            'Payment successful',

          module:
            'POS',

          ref:
            'POS20260729001',

          user:
            'posuser',

          datetime:
            '2026-07-29T09:01:00',
        },
      ],
    },

    // =====================================================
    // TRANSACTION 4
    // =====================================================

    {
      id: 't4',

      txnNo:
        'POS20260729002',

      receiptNo:
        'RCP1004',

      customer:
        posCustomers[4],

      customerName:
        'Senthil Kumar',

      lines: [
        mkLine(
          posOfferings[12],
          1,
          ['Sri Siva'],
          'Senthil Kumar',
          'Anuradha',
          '2026-08-05',
          'Morning – 9:00 AM',
        ),
      ],

      grossAmount:
        200,

      gstAmount:
        calcGst(
          200,
          'Applicable',
        ),

      ledgerAmount:
        calcLedger(
          200,
          'Applicable',
        ),

      roundOff:
        0,

      payableAmount:
        200,

      paymentMode:
        'Cash',

      paymentStatus:
        'Successful',

      txnStatus:
        'Completed',

      paidAmount:
        200,

      changeAmount:
        0,

      paymentRef:
        '-',

      posUser:
        'posuser',

      datetime:
        '2026-07-29T11:00:00',

      reprintCount:
        0,

      audit: [
        {
          action:
            'Transaction created',

          module:
            'POS',

          ref:
            'POS20260729002',

          user:
            'posuser',

          datetime:
            '2026-07-29T11:00:00',
        },

        {
          action:
            'Payment successful',

          module:
            'POS',

          ref:
            'POS20260729002',

          user:
            'posuser',

          datetime:
            '2026-07-29T11:01:00',
        },
      ],
    },
  ];
}