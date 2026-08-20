import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Edit,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';

import {
  Modal,
  ConfirmModal,
} from '@/components/ui/Modal';

import { Temple } from '@/components/ui/TempleIcon';
import { useToast } from '@/components/ui/Toast';

import { usePosStore } from '@/lib/posStore';

import {
  calcGst,
  calcLedger,
  getOfferingStatus,
  posDeities,
  posNakshatras,
  posOfferings,
  posUsers,
  type PosCartLine,
  type PosCustomer,
  type PosFamilyMember,
  type PosOffering,
  type PosTransaction,
} from '@/lib/posData';

import {
  formatDate,
  formatDateTime,
  formatSGD,
} from '@/lib/utils';

import {
  PaymentModal,
  PaymentSuccessScreen,
} from '@/pages/pos/PosBilling';

// =========================================================
// TYPES
// =========================================================

type OfferingType = 'Item' | 'Service';

interface PersonalDetails {
  fullName: string;
  tamilName: string;
  email: string;
  mobile: string;
}

interface DevoteeRow {
  name: string;
  nakshatra: string;
}

// =========================================================
// TAMIL NAME SUGGESTIONS
// =========================================================

const tamilNameMap: Record<string, string[]> = {
  rajendran: ['ராஜேந்திரன்', 'ராஜேந்திரன் மோகன்'],
  mohan: ['மோகன்'],

  lakshmi: ['லட்சுமி', 'லக்ஷ்மி'],
  lakshman: ['லட்சுமணன்'],

  murugan: ['முருகன்'],
  murugesan: ['முருகேசன்'],

  senthil: ['செந்தில்'],
  senthilkumar: ['செந்தில்குமார்'],

  kumar: ['குமார்'],
  kumaran: ['குமரன்'],

  saraswathi: ['சரஸ்வதி'],

  siva: ['சிவா', 'சிவன்'],
  sivakumar: ['சிவகுமார்'],
  sivaraman: ['சிவராமன்'],

  durga: ['துர்கா'],

  ganesh: ['கணேஷ்'],
  ganesan: ['கணேசன்'],

  rajan: ['ராஜன்'],
  raj: ['ராஜ்'],
  rajesh: ['ராஜேஷ்'],
  rajkumar: ['ராஜ்குமார்'],

  ravi: ['ரவி'],
  ravikumar: ['ரவிக்குமார்'],

  priya: ['பிரியா'],

  karthik: ['கார்த்திக்'],
  karthikeyan: ['கார்த்திகேயன்'],

  krishnan: ['கிருஷ்ணன்'],
  krishna: ['கிருஷ்ணா'],

  suresh: ['சுரேஷ்'],
  sureshkumar: ['சுரேஷ்குமார்'],

  devi: ['தேவி'],

  ram: ['ராம்'],
  raman: ['ராமன்'],
  ramesh: ['ரமேஷ்'],
  ramkumar: ['ராம்குமார்'],

  bala: ['பாலா'],
  balaji: ['பாலாஜி'],

  arun: ['அருண்'],
  arunkumar: ['அருண்குமார்'],

  anand: ['ஆனந்த்'],
  anbu: ['அன்பு'],

  vishnu: ['விஷ்ணு'],

  vinoth: ['வினோத்'],
  vignesh: ['விக்னேஷ்'],

  venkat: ['வெங்கட்'],
  venkatesh: ['வெங்கடேஷ்'],

  mani: ['மணி'],
  manikandan: ['மணிகண்டன்'],

  selva: ['செல்வா'],
  selvan: ['செல்வன்'],
  selvi: ['செல்வி'],

  tamil: ['தமிழ்'],
  tamilselvan: ['தமிழ்செல்வன்'],

  sakthi: ['சக்தி'],

  shankar: ['சங்கர்'],
  sankar: ['சங்கர்'],

  kannan: ['கண்ணன்'],

  muthu: ['முத்து'],
  muthukumar: ['முத்துக்குமார்'],

  nathan: ['நாதன்'],

  nithya: ['நித்யா'],

  divya: ['திவ்யா'],

  kavitha: ['கவிதா'],

  revathi: ['ரேவதி'],

  meena: ['மீனா'],
  meenakshi: ['மீனாட்சி'],

  geetha: ['கீதா'],

  jaya: ['ஜெயா'],
  jayakumar: ['ஜெயக்குமார்'],

  prakash: ['பிரகாஷ்'],

  prabhu: ['பிரபு'],

  vijay: ['விஜய்'],

  ajith: ['அஜித்'],

  surya: ['சூர்யா'],

  subramani: ['சுப்பிரமணி'],
  subramanian: ['சுப்பிரமணியன்'],

  bhuvaneswar: ['புவனேஸ்வர்'],
  bhuvaneswaran: ['புவனேஸ்வரன்'],

  nishanth: ['நிஷாந்த்'],
  nishant: ['நிஷாந்த்'],

  rajthilak: ['ராஜ்திலக்'],

  marai: ['மறை'],

  ilango: ['இளங்கோ'],

  dinesh: ['தினேஷ்'],

  gokul: ['கோகுல்'],

  rohit: ['ரோஹித்'],

  anusha: ['அனுஷா'],

  monica: ['மோனிகா'],
};

function getTamilSuggestions(
  value: string,
): string[] {
  const input =
    value.trim().toLowerCase();

  if (!input) {
    return [];
  }

  const words =
    input.split(/\s+/);

  const lastWord =
    words[words.length - 1];

  const exactMatches =
    tamilNameMap[lastWord] ?? [];

  const startsWithMatches =
    Object.entries(tamilNameMap)
      .filter(
        ([english]) =>
          english.startsWith(lastWord) &&
          english !== lastWord,
      )
      .flatMap(
        ([, tamilValues]) =>
          tamilValues,
      );

  const containsMatches =
    Object.entries(tamilNameMap)
      .filter(
        ([english]) =>
          english.includes(lastWord) &&
          !english.startsWith(lastWord),
      )
      .flatMap(
        ([, tamilValues]) =>
          tamilValues,
      );

  return [
    ...new Set([
      ...exactMatches,
      ...startsWithMatches,
      ...containsMatches,
    ]),
  ].slice(0, 8);
}

// =========================================================
// DEFAULT VALUES
// =========================================================

const EMPTY_PERSONAL_DETAILS: PersonalDetails = {
  fullName: '',
  tamilName: '',
  email: '',
  mobile: '',
};

const createEmptyDevotees = (): [
  DevoteeRow,
  DevoteeRow,
] => [
  {
    name: '',
    nakshatra: '',
  },
  {
    name: '',
    nakshatra: '',
  },
];

// =========================================================
// ADMIN BOOKING
// =========================================================

export function AdminBookingForm() {
  const toast = useToast();

  const {
    user,
    customers,
    transactions,
    addTransaction,
  } = usePosStore();

  // =======================================================
  // TAMIL NAME
  // =======================================================

  const [
    tamilSearch,
    setTamilSearch,
  ] = useState('');

  const [
    tamilSuggestions,
    setTamilSuggestions,
  ] = useState<string[]>([]);

  const [
    tamilSuggestionOpen,
    setTamilSuggestionOpen,
  ] = useState(false);

  // =======================================================
  // CUSTOMER
  // =======================================================

  const [
    personalDetails,
    setPersonalDetails,
  ] =
    useState<PersonalDetails>(
      EMPTY_PERSONAL_DETAILS,
    );

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState<PosCustomer | null>(
      null,
    );

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState('');

  const [
    customerSearchOpen,
    setCustomerSearchOpen,
  ] = useState(false);

  const [
    previewTxn,
    setPreviewTxn,
  ] =
    useState<PosTransaction | null>(
      null,
    );

  // =======================================================
  // OFFERING
  // =======================================================

  const [
    offeringType,
    setOfferingType,
  ] =
    useState<OfferingType>('Item');

  const [
    selectedOfferingId,
    setSelectedOfferingId,
  ] = useState('');

  const [
    selectedDeities,
    setSelectedDeities,
  ] = useState<string[]>([]);

  const [
    devotees,
    setDevotees,
  ] = useState<
    [DevoteeRow, DevoteeRow]
  >(createEmptyDevotees());

  const [
    eventDate,
    setEventDate,
  ] = useState('');

  const [
    session,
    setSession,
  ] = useState('');

  const [
    editLineId,
    setEditLineId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    tempNames,
    setTempNames,
  ] = useState<string[]>([]);

  // =======================================================
  // CART
  // =======================================================

  const [
    cart,
    setCart,
  ] =
    useState<PosCartLine[]>([]);

  const [
    removeTarget,
    setRemoveTarget,
  ] =
    useState<string | null>(
      null,
    );

  const [
    clearCartOpen,
    setClearCartOpen,
  ] = useState(false);

  const [
    expandedLines,
    setExpandedLines,
  ] =
    useState<Set<string>>(
      new Set(),
    );

  // =======================================================
  // PAYMENT
  // =======================================================

  const [
    paymentOpen,
    setPaymentOpen,
  ] = useState(false);

  const [
    successTxn,
    setSuccessTxn,
  ] =
    useState<PosTransaction | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState('');

  // =======================================================
  // CUSTOMER SEARCH
  // =======================================================

  const customerResults =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      return customers
        .filter(
          (customer) => {
            if (
              customer.status !==
              'Active'
            ) {
              return false;
            }

            return (
              customer.name
                .toLowerCase()
                .includes(query) ||
              customer.code
                .toLowerCase()
                .includes(query) ||
              customer.mobile
                .toLowerCase()
                .includes(query) ||
              customer.email
                .toLowerCase()
                .includes(query)
            );
          },
        )
        .slice(0, 5);
    }, [
      customers,
      customerSearch,
    ]);

  // =======================================================
  // LAST 3 TRANSACTIONS
  // =======================================================

  const customerTransactions =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return transactions
        .filter(
          (transaction) =>
            transaction.customer
              ?.id ===
              selectedCustomer.id &&
            transaction.txnStatus ===
              'Completed',
        )
        .sort(
          (first, second) =>
            new Date(
              second.datetime,
            ).getTime() -
            new Date(
              first.datetime,
            ).getTime(),
        )
        .slice(0, 3);
    }, [
      selectedCustomer,
      transactions,
    ]);

  // =======================================================
  // OFFERINGS
  // =======================================================

  const availableOfferings =
    useMemo(() => {
      return posOfferings.filter(
        (offering) =>
          offering.type ===
            offeringType &&
          offering.status ===
            'Active' &&
          offering.posAvailable,
      );
    }, [offeringType]);

  const selectedOffering =
    useMemo(() => {
      return posOfferings.find(
        (offering) =>
          offering.id ===
          selectedOfferingId,
      );
    }, [selectedOfferingId]);

  // =======================================================
  // ALL DEITIES FOR EVERY ITEM/SERVICE
  // =======================================================

  const deityList =
    posDeities;

  // =======================================================
  // TOTALS
  // =======================================================

  const totals =
    useMemo(() => {
      const gross =
        cart.reduce(
          (sum, line) =>
            sum +
            line.grossAmount,
          0,
        );

      const gst =
        cart.reduce(
          (sum, line) =>
            sum +
            line.gstAmount,
          0,
        );

      const ledger =
        cart.reduce(
          (sum, line) =>
            sum +
            line.ledgerAmount,
          0,
        );

      const roundOff =
        Math.round(gross) -
        gross;

      const payable =
        gross + roundOff;

      return {
        gross,
        gst,
        ledger,
        roundOff,
        payable,
      };
    }, [cart]);

  // =======================================================
  // CART VALIDATION
  // =======================================================

  const cartValid =
    useMemo(() => {
      if (
        cart.length === 0
      ) {
        return false;
      }

      for (
        const line of cart
      ) {
        const offering =
          posOfferings.find(
            (record) =>
              record.id ===
              line.offeringId,
          );

        if (
          !offering ||
          offering.status !==
            'Active' ||
          !offering.posAvailable
        ) {
          return false;
        }

        if (
          offering.inventoryApplicable &&
          offering.stock <
            line.qty *
              offering.reductionFactor
        ) {
          return false;
        }
      }

      return true;
    }, [cart]);

  // =======================================================
  // CUSTOMER SELECT
  // =======================================================

  const selectCustomer = (
    customer: PosCustomer,
  ) => {
    setSelectedCustomer(
      customer,
    );

    setCustomerSearch(
      customer.name,
    );

    setCustomerSearchOpen(
      false,
    );

    // Reset Tamil field for selected customer
    setTamilSearch('');
    setTamilSuggestions([]);
    setTamilSuggestionOpen(
      false,
    );

    setPersonalDetails({
      fullName:
        customer.name,

      tamilName: '',

      email:
        customer.email ?? '',

      mobile:
        customer.mobile ?? '',
    });

    setError('');
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);

    setCustomerSearch('');

    setCustomerSearchOpen(
      false,
    );

    setTamilSearch('');
    setTamilSuggestions([]);
    setTamilSuggestionOpen(
      false,
    );

    setPersonalDetails(
      EMPTY_PERSONAL_DETAILS,
    );

    setError('');
  };

  // =======================================================
  // TAMIL NAME HANDLERS
  // =======================================================

  const handleTamilTyping = (
    value: string,
  ) => {
    setTamilSearch(value);

    const suggestions =
      getTamilSuggestions(
        value,
      );

    setTamilSuggestions(
      suggestions,
    );

    setTamilSuggestionOpen(
      suggestions.length > 0,
    );

    /*
     * English search text is not
     * stored as Tamil Name.
     */
    setPersonalDetails(
      (previous) => ({
        ...previous,
        tamilName: '',
      }),
    );
  };

  const selectTamilSuggestion = (
    suggestion: string,
  ) => {
    setTamilSearch(
      suggestion,
    );

    setPersonalDetails(
      (previous) => ({
        ...previous,
        tamilName:
          suggestion,
      }),
    );

    setTamilSuggestions([]);

    setTamilSuggestionOpen(
      false,
    );
  };

  const clearTamilName = () => {
    setTamilSearch('');

    setTamilSuggestions([]);

    setTamilSuggestionOpen(
      false,
    );

    setPersonalDetails(
      (previous) => ({
        ...previous,
        tamilName: '',
      }),
    );
  };

  // =======================================================
  // OFFERING RESET
  // =======================================================

  const resetOffering = () => {
    setSelectedOfferingId('');

    setSelectedDeities([]);

    setDevotees(
      createEmptyDevotees(),
    );

    setEventDate('');

    setSession('');

    setEditLineId(null);

    setError('');
  };

  const changeOfferingType = (
    type: OfferingType,
  ) => {
    setOfferingType(type);

    resetOffering();
  };

  const handleOfferingChange = (
    offeringId: string,
  ) => {
    setSelectedOfferingId(
      offeringId,
    );

    setSelectedDeities([]);

    setDevotees(
      createEmptyDevotees(),
    );

    setEventDate('');

    setSession('');

    setEditLineId(null);

    setError('');
  };

  // =======================================================
  // DEITY MULTI SELECT
  // =======================================================

  const toggleDeity = (
    deityName: string,
  ) => {
    setSelectedDeities(
      (previous) =>
        previous.includes(
          deityName,
        )
          ? previous.filter(
              (name) =>
                name !==
                deityName,
            )
          : [
              ...previous,
              deityName,
            ],
    );

    setError('');
  };

  // =======================================================
  // DEVOTEE
  // =======================================================

  const updateDevotee = (
    index: number,
    field: keyof DevoteeRow,
    value: string,
  ) => {
    setDevotees(
      (previous) => {
        const next = [
          ...previous,
        ] as [
          DevoteeRow,
          DevoteeRow,
        ];

        next[index] = {
          ...next[index],

          [field]: value,
        };

        return next;
      },
    );

    setError('');
  };

  const selectFamilyMember = (
    member: PosFamilyMember,
  ) => {
    setDevotees(
      (previous) => {
        const next = [
          ...previous,
        ] as [
          DevoteeRow,
          DevoteeRow,
        ];

        const emptyIndex =
          next.findIndex(
            (row) =>
              !row.name.trim(),
          );

        const index =
          emptyIndex >= 0
            ? emptyIndex
            : 0;

        next[index] = {
          name:
            member.name,

          nakshatra:
            member.nakshatra,
        };

        return next;
      },
    );
  };

  const selectTempName = (
    name: string,
  ) => {
    setDevotees(
      (previous) => {
        const next = [
          ...previous,
        ] as [
          DevoteeRow,
          DevoteeRow,
        ];

        const emptyIndex =
          next.findIndex(
            (row) =>
              !row.name.trim(),
          );

        const index =
          emptyIndex >= 0
            ? emptyIndex
            : 0;

        next[index] = {
          ...next[index],

          name,
        };

        return next;
      },
    );
  };

  // =======================================================
  // VALIDATE OFFERING
  // =======================================================

  const validateOffering =
    () => {
      if (
        !selectedOffering
      ) {
        setError(
          `Please select an ${offeringType.toLowerCase()}.`,
        );

        return false;
      }

      if (
        selectedDeities.length ===
        0
      ) {
        setError(
          'Please select at least one deity.',
        );

        return false;
      }

      const enteredDevotees =
        devotees.filter(
          (devotee) =>
            devotee.name.trim() ||
            devotee.nakshatra,
        );

      if (
        !devotees[0].name.trim()
      ) {
        setError(
          'Devotee 1 name is required.',
        );

        return false;
      }

      if (
        !devotees[0].nakshatra
      ) {
        setError(
          'Devotee 1 Nakshatra is required.',
        );

        return false;
      }

      for (
        const devotee of
        enteredDevotees
      ) {
        if (
          devotee.name.trim() &&
          /^\d+$/.test(
            devotee.name.trim(),
          )
        ) {
          setError(
            'Devotee name cannot contain only numbers.',
          );

          return false;
        }

        if (
          devotee.name.trim() &&
          !devotee.nakshatra
        ) {
          setError(
            `Select Nakshatra for ${devotee.name}.`,
          );

          return false;
        }

        if (
          !devotee.name.trim() &&
          devotee.nakshatra
        ) {
          setError(
            'Enter devotee name for the selected Nakshatra.',
          );

          return false;
        }
      }

      if (
        selectedOffering.eventDateRequired &&
        !eventDate
      ) {
        setError(
          'Please select Event Date.',
        );

        return false;
      }

      if (
        selectedOffering.sessionRequired &&
        !session
      ) {
        setError(
          'Please select Session.',
        );

        return false;
      }

      setError('');

      return true;
    };

  // =======================================================
  // CREATE CART LINE
  // =======================================================

  const createCartLine = (
    offering: PosOffering,
    id?: string,
  ): PosCartLine => {
    const validDevotees =
      devotees
        .filter(
          (devotee) =>
            devotee.name.trim(),
        )
        .map(
          (devotee) => ({
            name:
              devotee.name.trim(),

            nakshatra:
              devotee.nakshatra,
          }),
        );

    const qty =
      Math.max(
        selectedDeities.length,
        1,
      );

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
        id ??
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

      deities:
        selectedDeities,

      devoteeName:
        validDevotees[0]
          ?.name,

      nakshatra:
        validDevotees[0]
          ?.nakshatra,

      devotees:
        validDevotees,

      eventDate:
        eventDate ||
        undefined,

      session:
        session ||
        undefined,

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

  // =======================================================
  // ADD / UPDATE CART
  // =======================================================

  const addOrUpdateCart = () => {
    if (
      !validateOffering() ||
      !selectedOffering
    ) {
      return;
    }

    const status =
      getOfferingStatus(
        selectedOffering,
      );

    if (
      status ===
      'Out of Stock'
    ) {
      setError(
        `${selectedOffering.name} is out of stock.`,
      );

      return;
    }

    if (
      status ===
        'Inactive' ||
      status ===
        'POS Unavailable'
    ) {
      setError(
        `${selectedOffering.name} is unavailable.`,
      );

      return;
    }

    const newLine =
      createCartLine(
        selectedOffering,
        editLineId ??
          undefined,
      );

    const newNames =
      newLine.devotees
        ?.map(
          (devotee) =>
            devotee.name,
        )
        .filter(
          (name) =>
            name &&
            !tempNames.includes(
              name,
            ),
        ) ?? [];

    if (
      newNames.length > 0
    ) {
      setTempNames(
        (previous) => [
          ...previous,
          ...newNames,
        ],
      );
    }

    if (editLineId) {
      setCart(
        (previous) =>
          previous.map(
            (line) =>
              line.id ===
              editLineId
                ? newLine
                : line,
          ),
      );

      toast.success(
        'Entry updated',
      );
    } else {
      setCart(
        (previous) => [
          ...previous,
          newLine,
        ],
      );

      toast.success(
        'Added to cart',
        `${selectedOffering.name} added.`,
      );
    }

    resetOffering();
  };

  // =======================================================
  // EDIT CART
  // =======================================================

  const editCartLine = (
    line: PosCartLine,
  ) => {
    const offering =
      posOfferings.find(
        (record) =>
          record.id ===
          line.offeringId,
      );

    if (!offering) {
      return;
    }

    setOfferingType(
      offering.type,
    );

    setSelectedOfferingId(
      offering.id,
    );

    setSelectedDeities(
      line.deities ?? [],
    );

    const oldDevotees =
      line.devotees ??
      (
        line.devoteeName
          ? [
              {
                name:
                  line.devoteeName,

                nakshatra:
                  line.nakshatra ??
                  '',
              },
            ]
          : []
      );

    setDevotees([
      {
        name:
          oldDevotees[0]
            ?.name ?? '',

        nakshatra:
          oldDevotees[0]
            ?.nakshatra ??
          '',
      },

      {
        name:
          oldDevotees[1]
            ?.name ?? '',

        nakshatra:
          oldDevotees[1]
            ?.nakshatra ??
          '',
      },
    ]);

    setEventDate(
      line.eventDate ?? '',
    );

    setSession(
      line.session ?? '',
    );

    setEditLineId(
      line.id,
    );

    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =======================================================
  // REMOVE CART
  // =======================================================

  const removeCartLine = (
    id: string,
  ) => {
    setCart(
      (previous) =>
        previous.filter(
          (line) =>
            line.id !== id,
        ),
    );

    setRemoveTarget(null);

    if (
      editLineId === id
    ) {
      resetOffering();
    }

    toast.info(
      'Entry removed',
    );
  };

  const clearCart = () => {
    setCart([]);

    setTempNames([]);

    setClearCartOpen(false);

    resetOffering();

    toast.info(
      'Cart cleared',
    );
  };

  // =======================================================
  // EXPAND CART
  // =======================================================

  const toggleLine = (
    id: string,
  ) => {
    setExpandedLines(
      (previous) => {
        const next =
          new Set(previous);

        if (
          next.has(id)
        ) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      },
    );
  };

  // =======================================================
  // LOAD PREVIOUS TRANSACTION
  // =======================================================

  const confirmLoadTransaction =
    () => {
      if (!previewTxn) {
        return;
      }

      const available: PosCartLine[] =
        [];

      const unavailable: string[] =
        [];

      for (
        const oldLine of
        previewTxn.lines
      ) {
        const offering =
          posOfferings.find(
            (record) =>
              record.id ===
              oldLine.offeringId,
          );

        if (
          !offering ||
          offering.status !==
            'Active' ||
          !offering.posAvailable
        ) {
          unavailable.push(
            oldLine.name,
          );

          continue;
        }

        const gross =
          offering.price *
          oldLine.qty;

        const newLine: PosCartLine =
          {
            ...oldLine,

            id:
              Math.random()
                .toString(36)
                .slice(2),

            price:
              offering.price,

            gstClass:
              offering.gstClass,

            printingGroup:
              offering.printingGroup,

            grossAmount:
              gross,

            gstAmount:
              calcGst(
                gross,
                offering.gstClass,
              ),

            ledgerAmount:
              calcLedger(
                gross,
                offering.gstClass,
              ),
          };

        available.push(
          newLine,
        );
      }

      setCart(
        (previous) => [
          ...previous,
          ...available,
        ],
      );

      const names =
        available.flatMap(
          (line) =>
            line.devotees?.map(
              (devotee) =>
                devotee.name,
            ) ?? [],
        );

      setTempNames(
        (previous) => [
          ...new Set([
            ...previous,
            ...names,
          ]),
        ],
      );

      setPreviewTxn(null);

      if (
        unavailable.length >
        0
      ) {
        toast.warning(
          'Some items unavailable',

          `${unavailable.join(
            ', ',
          )} were not loaded.`,
        );
      } else {
        toast.success(
          'Transaction loaded',

          `${available.length} item(s) added to cart.`,
        );
      }
    };

  // =======================================================
  // CUSTOMER VALIDATION
  // =======================================================

  const validatePersonalDetails =
    () => {
      if (
        !personalDetails.fullName.trim()
      ) {
        setError(
          'Full Name is required.',
        );

        return false;
      }

      if (
        !personalDetails.email.trim()
      ) {
        setError(
          'Email ID is required.',
        );

        return false;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          personalDetails.email.trim(),
        )
      ) {
        setError(
          'Enter a valid Email ID.',
        );

        return false;
      }

      // Mobile Number is optional

      if (
        cart.length === 0
      ) {
        setError(
          'Please add at least one item or service.',
        );

        return false;
      }

      setError('');

      return true;
    };

  // =======================================================
  // CUSTOMER FOR PAYMENT
  // =======================================================

  const customerForPayment =
    useMemo<
      PosCustomer | null
    >(() => {
      if (
        selectedCustomer
      ) {
        return selectedCustomer;
      }

      if (
        !personalDetails.fullName.trim() ||
        !personalDetails.email.trim()
      ) {
        return null;
      }

      return {
        id:
          'admin-' +
          Math.random()
            .toString(36)
            .slice(2),

        code:
          'ADMIN-WALKIN',

        name:
          personalDetails.fullName.trim(),

        mobile:
          personalDetails.mobile.trim(),

        email:
          personalDetails.email.trim(),

        status:
          'Active',

        portalAccount:
          false,

        familyMembers:
          [],
      };
    }, [
      selectedCustomer,
      personalDetails,
    ]);

  // =======================================================
  // PAYMENT
  // =======================================================

  const proceedToPayment =
    () => {
      if (
        !validatePersonalDetails()
      ) {
        return;
      }

      if (!cartValid) {
        setError(
          'One or more cart entries are currently unavailable or out of stock.',
        );

        return;
      }

      setPaymentOpen(true);
    };

  const handlePaymentComplete = (
    txn: PosTransaction,
  ) => {
    addTransaction(txn);

    setCart([]);

    setTempNames([]);

    setSelectedCustomer(null);

    setCustomerSearch('');

    setCustomerSearchOpen(
      false,
    );

    setTamilSearch('');

    setTamilSuggestions([]);

    setTamilSuggestionOpen(
      false,
    );

    setPersonalDetails(
      EMPTY_PERSONAL_DETAILS,
    );

    setPaymentOpen(false);

    setSuccessTxn(txn);

    resetOffering();
  };

  const handleNewTransaction =
    () => {
      setSuccessTxn(null);

      setSelectedCustomer(null);

      setCustomerSearch('');

      setCustomerSearchOpen(
        false,
      );

      setTamilSearch('');

      setTamilSuggestions([]);

      setTamilSuggestionOpen(
        false,
      );

      setPersonalDetails(
        EMPTY_PERSONAL_DETAILS,
      );

      setCart([]);

      setTempNames([]);

      resetOffering();
    };

  // =======================================================
  // SUCCESS
  // =======================================================

  if (successTxn) {
    return (
      <PaymentSuccessScreen
        txn={successTxn}
        onDone={
          handleNewTransaction
        }
      />
    );
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="h-full overflow-y-auto bg-[#fbfaf8] p-4">

      {/* ERROR */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">

        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="space-y-4 xl:col-span-7">

          {/* ================================================= */}
          {/* PERSONAL DETAILS */}
          {/* ================================================= */}

          <section className="rounded-xl border border-brown-100 bg-white p-5">

            <h2 className="mb-5 font-semibold text-brown-900">
              Personal Details
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* CUSTOMER SEARCH */}

              <div className="relative">

                <label className="mb-1.5 block text-sm font-medium text-brown-800">
                  Full Name

                  <span className="text-red-500">
                    {' '}*
                  </span>
                </label>

                <div className="relative">

                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />

                  <input
                    type="text"

                    value={
                      customerSearch
                    }

                    onFocus={() =>
                      setCustomerSearchOpen(
                        true,
                      )
                    }

                    onChange={(event) => {
                      const value =
                        event.target.value;

                      setCustomerSearch(
                        value,
                      );

                      setCustomerSearchOpen(
                        true,
                      );

                      if (
                        selectedCustomer &&
                        value !==
                          selectedCustomer.name
                      ) {
                        setSelectedCustomer(
                          null,
                        );

                        setPersonalDetails(
                          (previous) => ({
                            ...previous,

                            fullName:
                              value,

                            email:
                              '',

                            mobile:
                              '',
                          }),
                        );
                      } else {
                        setPersonalDetails(
                          (previous) => ({
                            ...previous,

                            fullName:
                              value,
                          }),
                        );
                      }
                    }}

                    placeholder="Search customer name..."

                    className="form-input pl-9 pr-9"
                  />

                  {customerSearch && (
                    <button
                      type="button"

                      onClick={
                        clearCustomer
                      }

                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                </div>

                {/* CUSTOMER RESULTS */}

                {customerSearchOpen &&
                  customerSearch.trim() &&
                  !selectedCustomer && (

                    <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-brown-100 bg-white shadow-lg">

                      {customerResults.length ===
                      0 ? (

                        <div className="p-3">

                          <p className="text-sm text-brown-500">
                            No matching customer found.
                          </p>

                          <p className="mt-1 text-xs text-brown-400">
                            Continue with the entered name to create a new admin booking.
                          </p>

                        </div>

                      ) : (

                        customerResults.map(
                          (customer) => (

                            <button
                              key={
                                customer.id
                              }

                              type="button"

                              onMouseDown={(
                                event,
                              ) => {
                                event.preventDefault();

                                selectCustomer(
                                  customer,
                                );
                              }}

                              className="block w-full border-b border-brown-50 p-3 text-left last:border-b-0 hover:bg-cream-50"
                            >

                              <p className="text-sm font-semibold text-brown-800">
                                {customer.name}
                              </p>

                              <p className="mt-0.5 text-xs text-brown-500">

                                {customer.code}

                                {customer.mobile
                                  ? ` · ${customer.mobile}`
                                  : ''}

                              </p>

                              {customer.email && (

                                <p className="text-xs text-brown-400">
                                  {customer.email}
                                </p>

                              )}

                              {customer.familyMembers.length >
                                0 && (

                                <p className="mt-1 text-xs text-brown-400">

                                  Family:{' '}

                                  {customer.familyMembers
                                    .map(
                                      (
                                        member,
                                      ) =>
                                        member.name,
                                    )
                                    .join(
                                      ', ',
                                    )}

                                </p>

                              )}

                            </button>

                          ),
                        )

                      )}

                    </div>

                  )}

              </div>

              {/* ================================================= */}
              {/* NAME IN TAMIL */}
              {/* ================================================= */}

              <div className="relative">

                <label className="mb-1.5 block text-sm font-medium text-brown-800">
                  Name in Tamil
                </label>

                <div className="relative">

                  <input
                    type="text"

                    className="form-input pr-9"

                    value={
                      tamilSearch
                    }

                    onChange={(event) =>
                      handleTamilTyping(
                        event.target.value,
                      )
                    }

                    onFocus={() => {
                      if (
                        tamilSuggestions.length >
                        0
                      ) {
                        setTamilSuggestionOpen(
                          true,
                        );
                      }
                    }}

                    placeholder="Type name in English"
                  />

                  {tamilSearch && (

                    <button
                      type="button"

                      onClick={
                        clearTamilName
                      }

                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-red-500"

                      title="Clear Tamil name"
                    >
                      <X className="h-4 w-4" />
                    </button>

                  )}

                </div>

                {/* TAMIL SUGGESTIONS */}

                {tamilSuggestionOpen &&
                  tamilSuggestions.length >
                    0 && (

                    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-brown-100 bg-white shadow-lg">

                      <div className="border-b border-brown-50 bg-cream-50 px-3 py-2">

                        <p className="text-xs text-brown-500">
                          Select Tamil name
                        </p>

                      </div>

                      {tamilSuggestions.map(
                        (suggestion) => (

                          <button
                            key={
                              suggestion
                            }

                            type="button"

                            onMouseDown={(
                              event,
                            ) => {
                              event.preventDefault();

                              selectTamilSuggestion(
                                suggestion,
                              );
                            }}

                            className="block w-full border-b border-brown-50 px-3 py-2.5 text-left text-sm text-brown-800 last:border-b-0 hover:bg-cream-50"
                          >
                            {suggestion}
                          </button>

                        ),
                      )}

                    </div>

                  )}

                {personalDetails.tamilName && (

                  <p className="mt-1 text-xs text-green-600">

                    Selected:{' '}

                    {
                      personalDetails.tamilName
                    }

                  </p>

                )}

              </div>

              {/* EMAIL */}

              <FormInput
                label="Email ID"

                required

                type="email"

                value={
                  personalDetails.email
                }

                onChange={(value) =>
                  setPersonalDetails(
                    (previous) => ({
                      ...previous,

                      email:
                        value,
                    }),
                  )
                }

                placeholder="Enter email id"
              />

              {/* MOBILE OPTIONAL */}

              <FormInput
                label="Mobile Number"

                value={
                  personalDetails.mobile
                }

                onChange={(value) =>
                  setPersonalDetails(
                    (previous) => ({
                      ...previous,

                      mobile:
                        value,
                    }),
                  )
                }

                placeholder="+65 Enter mobile number"
              />

            </div>

            {/* SELECTED CUSTOMER */}

            {selectedCustomer && (

              <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm font-semibold text-brown-800">
                      {selectedCustomer.name}
                    </p>

                    <p className="mt-1 text-xs text-brown-500">

                      {selectedCustomer.code}

                      {selectedCustomer.email
                        ? ` · ${selectedCustomer.email}`
                        : ''}

                      {selectedCustomer.mobile
                        ? ` · ${selectedCustomer.mobile}`
                        : ''}

                    </p>

                  </div>

                  <button
                    type="button"

                    onClick={
                      clearCustomer
                    }

                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Change
                  </button>

                </div>

              </div>

            )}

            {/* LAST 3 TRANSACTIONS */}

            {selectedCustomer && (

              <div className="mt-5 border-t border-brown-100 pt-4">

                <h3 className="mb-3 text-sm font-semibold text-brown-800">
                  Last 3 Transactions
                </h3>

                {customerTransactions.length ===
                0 ? (

                  <p className="text-sm text-brown-400">
                    No previous transactions found.
                  </p>

                ) : (

                  <div className="grid gap-3 lg:grid-cols-3">

                    {customerTransactions.map(
                      (
                        transaction,
                      ) => (

                        <div
                          key={
                            transaction.id
                          }

                          className="rounded-lg border border-brown-100 bg-cream-50 p-3"
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div>

                              <p className="text-[10px] uppercase tracking-wide text-brown-400">
                                Transaction
                              </p>

                              <p className="text-xs font-semibold text-brown-800">
                                {transaction.txnNo}
                              </p>

                            </div>

                            <p className="text-xs font-semibold text-maroon-700">

                              {formatSGD(
                                transaction.payableAmount,
                              )}

                            </p>

                          </div>

                          <p className="mt-2 text-xs text-brown-500">

                            {formatDate(
                              transaction.datetime,
                            )}

                          </p>

                          <p className="text-xs text-brown-500">
                            {transaction.paymentMode}
                          </p>

                          <button
                            type="button"

                            onClick={() =>
                              setPreviewTxn(
                                transaction,
                              )
                            }

                            className="mt-3 flex items-center gap-1 text-xs font-medium text-maroon-600 hover:underline"
                          >

                            <ArrowRight className="h-3 w-3" />

                            Load Transaction

                          </button>

                        </div>

                      ),
                    )}

                  </div>

                )}

              </div>

            )}

          </section>

          {/* ================================================= */}
          {/* ITEM / SERVICE */}
          {/* ================================================= */}

          <section className="rounded-xl border border-brown-100 bg-white p-5">

            <h2 className="mb-5 font-semibold text-brown-900">
              Select Item / Service and Add to Cart
            </h2>

            <div className="mb-4 flex gap-6">

              <label className="flex cursor-pointer items-center gap-2">

                <input
                  type="radio"

                  checked={
                    offeringType ===
                    'Item'
                  }

                  onChange={() =>
                    changeOfferingType(
                      'Item',
                    )
                  }
                />

                Item

              </label>

              <label className="flex cursor-pointer items-center gap-2">

                <input
                  type="radio"

                  checked={
                    offeringType ===
                    'Service'
                  }

                  onChange={() =>
                    changeOfferingType(
                      'Service',
                    )
                  }
                />

                Service

              </label>

            </div>

            {/* OFFERING */}

            <div>

              <label className="mb-1.5 block text-sm font-medium text-brown-800">

                Select {offeringType}

                <span className="text-red-500">
                  {' '}*
                </span>

              </label>

              <select
                className="form-input"

                value={
                  selectedOfferingId
                }

                onChange={(event) =>
                  handleOfferingChange(
                    event.target.value,
                  )
                }
              >

                <option value="">
                  Select {offeringType.toLowerCase()}
                </option>

                {availableOfferings.map(
                  (offering) => (

                    <option
                      key={
                        offering.id
                      }

                      value={
                        offering.id
                      }
                    >

                      {offering.name}

                      {' — '}

                      {formatSGD(
                        offering.price,
                      )}

                    </option>

                  ),
                )}

              </select>

            </div>

            {/* ALL DEITIES */}

            {selectedOffering && (

              <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-brown-800">

                  Deities (Multi-Select)

                  <span className="text-red-500">
                    {' '}*
                  </span>

                </label>

                <div className="flex flex-wrap gap-2">

                  {deityList.map(
                    (deity) => {

                      const selected =
                        selectedDeities.includes(
                          deity.name,
                        );

                      return (

                        <button
                          key={
                            deity.id
                          }

                          type="button"

                          onClick={() =>
                            toggleDeity(
                              deity.name,
                            )
                          }

                          className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                            selected
                              ? 'border-maroon-500 bg-maroon-50 text-maroon-700'
                              : 'border-brown-100 bg-white text-brown-700 hover:border-brown-200'
                          }`}
                        >

                          <Temple className="h-4 w-4 text-gold-600" />

                          {deity.name}

                        </button>

                      );
                    },
                  )}

                </div>

                <p className="mt-2 text-xs text-brown-400">

                  {
                    selectedDeities.length
                  }{' '}
                  deity/deities selected · Qty:{' '}
                  {
                    selectedDeities.length
                  }

                </p>

              </div>

            )}

            {/* DEVOTEE */}

            {selectedOffering &&
              selectedDeities.length >
                0 && (

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-medium text-brown-800">

                    Devotee Details

                    <span className="text-red-500">
                      {' '}*
                    </span>

                  </label>

                  <p className="mb-3 text-xs text-brown-400">
                    2 rows — same devotees apply to all selected deities.
                  </p>

                  {/* EXISTING FAMILY MEMBERS */}

                  {selectedCustomer &&
                    selectedCustomer.familyMembers.length >
                      0 && (

                      <div className="mb-4">

                        <p className="mb-2 text-xs font-medium text-brown-500">
                          Choose existing devotee
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {selectedCustomer.familyMembers.map(
                            (
                              member,
                              index,
                            ) => (

                              <button
                                key={`${member.name}-${index}`}

                                type="button"

                                onClick={() =>
                                  selectFamilyMember(
                                    member,
                                  )
                                }

                                className="rounded-lg bg-cream-100 px-3 py-1.5 text-xs text-brown-700 hover:bg-cream-200"
                              >

                                {member.name}

                                <span className="ml-1 text-brown-400">

                                  (
                                  {
                                    member.nakshatra
                                  }
                                  )

                                </span>

                              </button>

                            ),
                          )}

                        </div>

                      </div>

                    )}

                  {/* TEMP NAMES */}

                  {tempNames.length >
                    0 && (

                    <div className="mb-4">

                      <p className="mb-2 text-xs font-medium text-brown-500">
                        Recently entered devotees
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {tempNames.map(
                          (name) => (

                            <button
                              key={
                                name
                              }

                              type="button"

                              onClick={() =>
                                selectTempName(
                                  name,
                                )
                              }

                              className="rounded-lg bg-maroon-50 px-3 py-1.5 text-xs text-maroon-700 hover:bg-maroon-100"
                            >

                              {name}

                            </button>

                          ),
                        )}

                      </div>

                    </div>

                  )}

                  {/* TWO DEVOTEE ROWS */}

                  <div className="space-y-3">

                    {devotees.map(
                      (
                        devotee,
                        index,
                      ) => (

                        <div
                          key={
                            index
                          }

                          className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[28px_1fr_1fr]"
                        >

                          <span className="text-sm text-brown-400">
                            {index + 1}.
                          </span>

                          <input
                            type="text"

                            className="form-input"

                            value={
                              devotee.name
                            }

                            onChange={(event) =>
                              updateDevotee(
                                index,
                                'name',
                                event.target.value,
                              )
                            }

                            placeholder="Devotee Name"
                          />

                          <select
                            className="form-input"

                            value={
                              devotee.nakshatra
                            }

                            onChange={(event) =>
                              updateDevotee(
                                index,
                                'nakshatra',
                                event.target.value,
                              )
                            }
                          >

                            <option value="">
                              Nakshatra
                            </option>

                            {posNakshatras.map(
                              (
                                nakshatra,
                              ) => (

                                <option
                                  key={
                                    nakshatra.id
                                  }

                                  value={
                                    nakshatra.name
                                  }
                                >
                                  {nakshatra.name}
                                </option>

                              ),
                            )}

                          </select>

                        </div>

                      ),
                    )}

                  </div>

                  {selectedDeities.length >
                    1 && (

                    <div className="mt-3 rounded-lg bg-orange-50 p-2 text-xs text-orange-700">

                      The same devotee details will be applied to all{' '}

                      {
                        selectedDeities.length
                      }{' '}

                      selected deities. To use different devotees,
                      add this entry to cart and create another entry.

                    </div>

                  )}

                </div>

              )}

            {/* EVENT DATE */}

            {selectedOffering?.eventDateRequired && (

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-brown-800">

                    Event Date

                    <span className="text-red-500">
                      {' '}*
                    </span>

                  </label>

                  <input
                    type="date"

                    className="form-input"

                    value={
                      eventDate
                    }

                    onChange={(event) =>
                      setEventDate(
                        event.target.value,
                      )
                    }

                    min={
                      selectedOffering.eventStartDate ??
                      new Date()
                        .toISOString()
                        .slice(
                          0,
                          10,
                        )
                    }

                    max={
                      selectedOffering.eventEndDate
                    }
                  />

                </div>

                {selectedOffering.sessionRequired && (

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-brown-800">

                      Session

                      <span className="text-red-500">
                        {' '}*
                      </span>

                    </label>

                    <select
                      className="form-input"

                      value={
                        session
                      }

                      onChange={(event) =>
                        setSession(
                          event.target.value,
                        )
                      }
                    >

                      <option value="">
                        Select session
                      </option>

                      {selectedOffering.eventSlots &&
                      selectedOffering.eventSlots.length >
                        0 ? (

                        selectedOffering.eventSlots
                          .filter(
                            (slot) =>
                              slot.status ===
                              'Active',
                          )
                          .map(
                            (
                              slot,
                              index,
                            ) => (

                              <option
                                key={`${slot.session}-${slot.slotName}-${index}`}

                                value={`${slot.session} – ${slot.slotName}`}
                              >

                                {slot.session}

                                {' – '}

                                {slot.slotName}

                              </option>

                            ),
                          )

                      ) : (

                        <>
                          <option value="Morning">
                            Morning
                          </option>

                          <option value="Evening">
                            Evening
                          </option>
                        </>

                      )}

                    </select>

                  </div>

                )}

              </div>

            )}

            {/* PRICE */}

            {selectedOffering && (

              <div className="mt-5 rounded-lg bg-cream-50 p-4">

                <div className="flex justify-between text-sm">

                  <span className="text-brown-500">
                    Unit Price
                  </span>

                  <strong className="text-brown-900">

                    {formatSGD(
                      selectedOffering.price,
                    )}

                  </strong>

                </div>

                <div className="mt-2 flex justify-between text-sm">

                  <span className="text-brown-500">
                    Selected Deities
                  </span>

                  <strong>
                    {
                      selectedDeities.length
                    }
                  </strong>

                </div>

                <div className="mt-3 flex justify-between border-t border-brown-100 pt-3">

                  <span className="font-semibold text-brown-900">
                    Total Amount
                  </span>

                  <strong className="text-lg text-orange-600">

                    {formatSGD(
                      selectedOffering.price *
                        selectedDeities.length,
                    )}

                  </strong>

                </div>

              </div>

            )}

            {/* BUTTONS */}

            <div className="mt-5 flex gap-3">

              <button
                type="button"

                className="btn-outline"

                onClick={
                  resetOffering
                }
              >
                Reset
              </button>

              <button
                type="button"

                className="btn-primary"

                onClick={
                  addOrUpdateCart
                }
              >

                {editLineId ? (

                  <>
                    <Edit className="h-4 w-4" />

                    Update Cart
                  </>

                ) : (

                  <>
                    <ShoppingCart className="h-4 w-4" />

                    Add to Cart
                  </>

                )}

              </button>

            </div>

          </section>

        </div>

        {/* ================================================= */}
        {/* RIGHT */}
        {/* ================================================= */}

        <div className="space-y-4 xl:col-span-5">

          {/* CART */}

          <section className="overflow-hidden rounded-xl border border-brown-100 bg-white">

            <div className="flex items-center justify-between border-b border-brown-100 px-5 py-4">

              <div className="flex items-center gap-2">

                <ShoppingCart className="h-5 w-5 text-maroon-600" />

                <h2 className="font-semibold text-brown-900">
                  Cart Summary
                </h2>

                <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs text-maroon-700">

                  {
                    cart.length
                  }

                </span>

              </div>

              {cart.length > 0 && (

                <button
                  type="button"

                  onClick={() =>
                    setClearCartOpen(
                      true,
                    )
                  }

                  className="text-xs text-red-500 hover:underline"
                >
                  Clear Cart
                </button>

              )}

            </div>

            {cart.length === 0 ? (

              <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center">

                <ShoppingCart className="h-12 w-12 text-brown-200" />

                <p className="mt-3 text-sm font-medium text-brown-500">
                  No items or services added
                </p>

                <p className="text-xs text-brown-400">
                  Select an item or service to continue.
                </p>

              </div>

            ) : (

              <div className="space-y-2 p-3">

                {cart.map(
                  (line) => {

                    const expanded =
                      expandedLines.has(
                        line.id,
                      );

                    return (

                      <div
                        key={
                          line.id
                        }

                        className="rounded-lg border border-brown-100"
                      >

                        <div className="flex items-start justify-between p-3">

                          <button
                            type="button"

                            onClick={() =>
                              toggleLine(
                                line.id,
                              )
                            }

                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                          >

                            <ChevronDown
                              className={`mt-0.5 h-4 w-4 shrink-0 text-brown-400 transition-transform ${
                                expanded
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />

                            <div className="min-w-0 flex-1">

                              <p className="text-sm font-semibold text-brown-800">
                                {line.name}
                              </p>

                              {line.deities &&
                                line.deities.length >
                                  0 && (

                                <p className="mt-1 text-xs text-brown-500">

                                  Deity:{' '}

                                  {line.deities.join(
                                    ', ',
                                  )}

                                </p>

                              )}

                              <p className="text-xs text-brown-500">

                                Qty:{' '}

                                {line.qty}

                              </p>

                              {line.eventDate && (

                                <p className="text-xs text-brown-500">

                                  {formatDate(
                                    line.eventDate,
                                  )}

                                  {line.session
                                    ? ` · ${line.session}`
                                    : ''}

                                </p>

                              )}

                            </div>

                          </button>

                          <div className="flex items-center gap-1">

                            <span className="mr-1 text-sm font-semibold text-brown-900">

                              {formatSGD(
                                line.grossAmount,
                              )}

                            </span>

                            <button
                              type="button"

                              onClick={() =>
                                editCartLine(
                                  line,
                                )
                              }

                              className="rounded p-1.5 text-brown-400 hover:bg-cream-100 hover:text-maroon-600"

                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"

                              onClick={() =>
                                setRemoveTarget(
                                  line.id,
                                )
                              }

                              className="rounded p-1.5 text-red-400 hover:bg-red-50"

                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>

                        </div>

                        {expanded &&
                          line.devotees &&
                          line.devotees.length >
                            0 && (

                          <div className="border-t border-brown-50 bg-cream-50 px-4 py-3">

                            <p className="mb-2 text-xs font-semibold text-brown-600">
                              Devotees
                            </p>

                            <div className="space-y-1">

                              {line.devotees.map(
                                (
                                  devotee,
                                  index,
                                ) => (

                                  <div
                                    key={
                                      index
                                    }

                                    className="flex items-center gap-2 text-xs text-brown-700"
                                  >

                                    <span>
                                      {index + 1}.
                                    </span>

                                    <span className="font-medium">
                                      {devotee.name}
                                    </span>

                                    <span className="text-brown-400">
                                      ·
                                    </span>

                                    <span>
                                      {devotee.nakshatra}
                                    </span>

                                  </div>

                                ),
                              )}

                            </div>

                          </div>

                        )}

                      </div>

                    );
                  },
                )}

              </div>

            )}

            {/* TOTALS */}

            <div className="border-t border-brown-100 p-5">

              <AmountRow
                label="Sub Total (S$)"

                value={
                  totals.gross
                }
              />

              <AmountRow
                label="GST (S$)"

                value={
                  totals.gst
                }
              />

              {Math.abs(
                totals.roundOff,
              ) > 0.001 && (

                <AmountRow
                  label="Round Off (S$)"

                  value={
                    totals.roundOff
                  }
                />

              )}

              <div className="mt-3 flex justify-between border-t border-brown-100 pt-3 font-semibold">

                <span>
                  Grand Total (S$)
                </span>

                <span className="text-lg text-orange-600">

                  {totals.payable.toFixed(
                    2,
                  )}

                </span>

              </div>

            </div>

          </section>

          {/* PAYMENT */}

          <section className="rounded-xl border border-brown-100 bg-white p-5">

            <h2 className="mb-2 font-semibold text-brown-900">
              Payment Summary
            </h2>

            <p className="text-sm text-brown-500">
              Payment mode will be selected in the payment screen.
            </p>

            <button
              type="button"

              disabled={
                !cartValid
              }

              onClick={
                proceedToPayment
              }

              className="btn-primary mt-5 w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Payment
            </button>

          </section>

        </div>

      </div>

      {/* ================================================= */}
      {/* LOAD TRANSACTION */}
      {/* ================================================= */}

      {previewTxn && (

        <TransactionPreviewModal
          txn={
            previewTxn
          }

          onClose={() =>
            setPreviewTxn(null)
          }

          onConfirm={
            confirmLoadTransaction
          }
        />

      )}

      {/* REMOVE */}

      <ConfirmModal
        open={
          !!removeTarget
        }

        onClose={() =>
          setRemoveTarget(null)
        }

        onConfirm={() => {
          if (
            removeTarget
          ) {
            removeCartLine(
              removeTarget,
            );
          }
        }}

        title="Remove Entry"

        message="Remove this entry from the cart?"

        confirmLabel="Remove"

        cancelLabel="Keep"

        variant="danger"
      />

      {/* CLEAR CART */}

      <ConfirmModal
        open={
          clearCartOpen
        }

        onClose={() =>
          setClearCartOpen(false)
        }

        onConfirm={
          clearCart
        }

        title="Clear Cart"

        message="Clear all cart entries?"

        confirmLabel="Clear Cart"

        cancelLabel="Cancel"

        variant="danger"
      />

      {/* PAYMENT */}

      {paymentOpen && (

        <PaymentModal
          open={
            paymentOpen
          }

          onClose={() =>
            setPaymentOpen(false)
          }

          cart={
            cart
          }

          totals={
            totals
          }

          customer={
            customerForPayment
          }

          posUser={
            user ??
            posUsers[0]
          }

          onComplete={
            handlePaymentComplete
          }
        />

      )}

    </div>
  );
}

// =========================================================
// LOAD TRANSACTION MODAL
// =========================================================

function TransactionPreviewModal({
  txn,
  onClose,
  onConfirm,
}: {
  txn: PosTransaction;

  onClose: () => void;

  onConfirm: () => void;
}) {
  return (
    <Modal
      open={true}

      onClose={
        onClose
      }

      title="Load Transaction"

      description={
        txn.txnNo
      }

      size="lg"

      footer={
        <div className="flex flex-1 items-center justify-between">

          <span className="text-sm text-brown-500">

            Total:{' '}

            <span className="font-semibold text-brown-900">

              {formatSGD(
                txn.payableAmount,
              )}

            </span>

          </span>

          <div className="flex gap-2">

            <button
              type="button"

              className="btn-outline"

              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="button"

              className="btn-primary"

              onClick={
                onConfirm
              }
            >
              <ShoppingCart className="h-4 w-4" />

              Add to Cart
            </button>

          </div>

        </div>
      }
    >

      <div className="space-y-4">

        <div className="rounded-lg bg-cream-50 p-3">

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">

            <div>

              <span className="text-brown-500">
                Transaction ID:
              </span>{' '}

              <span className="font-medium text-brown-800">
                {txn.txnNo}
              </span>

            </div>

            <div>

              <span className="text-brown-500">
                Date:
              </span>{' '}

              <span className="font-medium text-brown-800">

                {formatDateTime(
                  txn.datetime,
                )}

              </span>

            </div>

            <div>

              <span className="text-brown-500">
                Customer:
              </span>{' '}

              <span className="font-medium text-brown-800">
                {txn.customerName}
              </span>

            </div>

            <div>

              <span className="text-brown-500">
                Payment Mode:
              </span>{' '}

              <span className="font-medium text-brown-800">
                {txn.paymentMode}
              </span>

            </div>

          </div>

        </div>

        <div>

          <p className="mb-2 text-xs font-medium text-brown-600">
            Items in this transaction
          </p>

          <div className="space-y-2">

            {txn.lines.map(
              (
                line,
                index,
              ) => (

                <div
                  key={`${line.id}-${index}`}

                  className="rounded-lg border border-brown-100 p-3"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-medium text-brown-800">
                        {line.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-brown-500">

                        {line.deities &&
                          line.deities.length >
                            0 && (

                          <span>

                            Deity:{' '}

                            {line.deities.join(
                              ', ',
                            )}

                          </span>

                        )}

                        {line.deities &&
                          line.deities.length >
                            0 && (

                          <span>
                            ·
                          </span>

                        )}

                        <span>
                          Qty: {line.qty}
                        </span>

                        {line.eventDate && (

                          <>
                            <span>
                              ·
                            </span>

                            <span>

                              {formatDate(
                                line.eventDate,
                              )}

                              {line.session
                                ? ` ${line.session}`
                                : ''}

                            </span>
                          </>

                        )}

                      </div>

                      {line.devotees &&
                        line.devotees.length >
                          0 && (

                        <div className="mt-2 space-y-1 rounded bg-cream-50 p-2">

                          {line.devotees.map(
                            (
                              devotee,
                              devoteeIndex,
                            ) => (

                              <p
                                key={
                                  devoteeIndex
                                }

                                className="text-xs text-brown-600"
                              >

                                {devotee.name}

                                {' · '}

                                {devotee.nakshatra}

                              </p>

                            ),
                          )}

                        </div>

                      )}

                      {!line.devotees &&
                        line.devoteeName && (

                        <p className="mt-2 text-xs text-brown-600">

                          {line.devoteeName}

                          {line.nakshatra
                            ? ` · ${line.nakshatra}`
                            : ''}

                        </p>

                      )}

                    </div>

                    <p className="text-sm font-semibold text-brown-900">

                      {formatSGD(
                        line.grossAmount,
                      )}

                    </p>

                  </div>

                </div>

              ),
            )}

          </div>

        </div>

      </div>

    </Modal>
  );
}

// =========================================================
// FORM INPUT
// =========================================================

interface FormInputProps {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  required?: boolean;

  type?: string;

  placeholder?: string;
}

function FormInput({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder,
}: FormInputProps) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium text-brown-800">

        {label}

        {required && (

          <span className="text-red-500">
            {' '}*
          </span>

        )}

      </label>

      <input
        type={
          type
        }

        className="form-input"

        value={
          value
        }

        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }

        placeholder={
          placeholder
        }
      />

    </div>
  );
}

// =========================================================
// AMOUNT ROW
// =========================================================

function AmountRow({
  label,
  value,
}: {
  label: string;

  value: number;
}) {
  return (
    <div className="mb-2 flex justify-between text-sm">

      <span className="text-brown-600">
        {label}
      </span>

      <span className="font-medium text-brown-900">
        {value.toFixed(2)}
      </span>

    </div>
  );
}