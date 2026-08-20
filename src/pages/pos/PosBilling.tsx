import {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';

import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  UserPlus,
  UserX,
  X,
  Edit,
  Check,
  Sparkles,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  CheckCircle,
  Calendar,
  ChevronDown,
  Folder,
  FolderOpen,
} from 'lucide-react';

import { Temple } from '@/components/ui/TempleIcon';

import {
  Modal,
  ConfirmModal,
} from '@/components/ui/Modal';

import {
  FormField,
  TextInput,
  Dropdown,
} from '@/components/ui/Form';

import { useToast } from '@/components/ui/Toast';

import { usePosStore } from '@/lib/posStore';

import {
  posOfferings,
  posCategories,
  posSubCategories,
  posDeities,
  posNakshatras,
  calcGst,
  calcLedger,
  getOfferingStatus,
  type PosOffering,
  type PosCustomer,
  type PosCartLine,
  type PosFamilyMember,
  type PosTransaction,
} from '@/lib/posData';

import {
  formatSGD,
  formatDate,
  formatDateTime,
  cn,
} from '@/lib/utils';

// =========================================================
// POS BILLING
// =========================================================

export function PosBilling() {
  const toast = useToast();

  const {
    user,
    customers,
    addCustomer,
    updateCustomer,
    addTransaction,
    transactions,
  } = usePosStore();

  // =======================================================
  // CART
  // =======================================================

  const [cart, setCart] = useState<PosCartLine[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('pos_cart') || '[]',
      );
    } catch {
      return [];
    }
  });

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<PosCustomer | null>(() => {
    try {
      const value = localStorage.getItem(
        'pos_selected_customer',
      );

      return value
        ? JSON.parse(value)
        : null;
    } catch {
      return null;
    }
  });

  const [tempNames, setTempNames] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('pos_temp_names') || '[]',
      );
    } catch {
      return [];
    }
  });

  // =======================================================
  // SEARCH / CATEGORY / SUBCATEGORY
  // =======================================================

  const [search, setSearch] = useState('');

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState('All');

  const [
    subCategoryFilter,
    setSubCategoryFilter,
  ] = useState('');

  // =======================================================
  // CUSTOMER
  // =======================================================

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState('');

  const [
    customerSearchOpen,
    setCustomerSearchOpen,
  ] = useState(false);

  const [
    createCustomerOpen,
    setCreateCustomerOpen,
  ] = useState(false);

  const [
    editCustomerOpen,
    setEditCustomerOpen,
  ] = useState(false);

  // =======================================================
  // OFFERING
  // =======================================================

  const [
    offeringModal,
    setOfferingModal,
  ] = useState<PosOffering | null>(null);

  const [
    editLineId,
    setEditLineId,
  ] = useState<string | null>(null);

  // =======================================================
  // CART ACTIONS
  // =======================================================

  const [
    removeTarget,
    setRemoveTarget,
  ] = useState<string | null>(null);

  const [
    clearCartOpen,
    setClearCartOpen,
  ] = useState(false);

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
  ] = useState<PosTransaction | null>(null);

  // =======================================================
  // FAMILY / DEVOTEE
  // =======================================================

  const [
    selectedFamilyMember,
    setSelectedFamilyMember,
  ] = useState<string | null>(null);

  const [
    expandedLines,
    setExpandedLines,
  ] = useState<Set<string>>(new Set());

  const [
    previewTxn,
    setPreviewTxn,
  ] = useState<PosTransaction | null>(null);

  const [
    editingDevotee,
    setEditingDevotee,
  ] = useState<{
    lineId: string;
    index: number;
  } | null>(null);

  const [
    devoteeDraft,
    setDevoteeDraft,
  ] = useState<{
    name: string;
    nakshatra: string;
  }>({
    name: '',
    nakshatra: '',
  });

  // =======================================================
  // DEVOTEE EDIT
  // =======================================================

  const startDevoteeEdit = (
    lineId: string,
    index: number,
    devotee: {
      name: string;
      nakshatra: string;
    },
  ) => {
    setEditingDevotee({
      lineId,
      index,
    });

    setDevoteeDraft({
      ...devotee,
    });
  };

  const cancelDevoteeEdit = () => {
    setEditingDevotee(null);
  };

  const saveDevoteeEdit = () => {
    if (!editingDevotee) {
      return;
    }

    if (!devoteeDraft.name.trim()) {
      toast.error(
        'Name required',
        'Devotee name cannot be empty.',
      );
      return;
    }

    if (
      /^\d+$/.test(
        devoteeDraft.name.trim(),
      )
    ) {
      toast.error(
        'Invalid name',
        'Name cannot contain only numbers.',
      );
      return;
    }

    if (!devoteeDraft.nakshatra) {
      toast.error(
        'Nakshatra required',
        'Select a Nakshatra.',
      );
      return;
    }

    setCart((previous) =>
      previous.map((line) => {
        if (
          line.id !== editingDevotee.lineId ||
          !line.devotees
        ) {
          return line;
        }

        const updated = line.devotees.map(
          (devotee, index) =>
            index === editingDevotee.index
              ? {
                  ...devoteeDraft,
                  name: devoteeDraft.name.trim(),
                }
              : devotee,
        );

        return {
          ...line,
          devotees: updated,
          devoteeName: updated[0]?.name,
          nakshatra: updated[0]?.nakshatra,
        };
      }),
    );

    setEditingDevotee(null);

    toast.success(
      'Devotee updated',
    );
  };

  const toggleLine = (
    id: string,
  ) => {
    setExpandedLines((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  // =======================================================
  // LOCAL STORAGE
  // =======================================================

  useEffect(() => {
    localStorage.setItem(
      'pos_cart',
      JSON.stringify(cart),
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      'pos_selected_customer',
      JSON.stringify(selectedCustomer),
    );
  }, [selectedCustomer]);

  useEffect(() => {
    localStorage.setItem(
      'pos_temp_names',
      JSON.stringify(tempNames),
    );
  }, [tempNames]);

  // =======================================================
  // CUSTOMER SEARCH
  // =======================================================

  const [
    debouncedCustSearch,
    setDebouncedCustSearch,
  ] = useState('');

  const searchTimer = useRef<
    ReturnType<typeof setTimeout>
  >();

  useEffect(() => {
    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(
      () =>
        setDebouncedCustSearch(
          customerSearch,
        ),
      300,
    );

    return () =>
      clearTimeout(searchTimer.current);
  }, [customerSearch]);

  const customerResults = useMemo(() => {
    if (!debouncedCustSearch.trim()) {
      return [];
    }

    const query =
      debouncedCustSearch.toLowerCase();

    return customers
      .filter(
        (customer) =>
          customer.status === 'Active' &&
          (
            customer.name
              .toLowerCase()
              .includes(query) ||
            customer.code
              .toLowerCase()
              .includes(query) ||
            customer.mobile.includes(query) ||
            customer.email
              .toLowerCase()
              .includes(query)
          ),
      )
      .slice(0, 5);
  }, [
    customers,
    debouncedCustSearch,
  ]);

  // =======================================================
  // CATEGORY
  // =======================================================

  const activeCategories = useMemo(() => {
    return posCategories.filter(
      (category) =>
        posOfferings.some(
          (offering) =>
            offering.category === category.name &&
            offering.status === 'Active' &&
            offering.posAvailable,
        ),
    );
  }, []);

  const getCategoryCount = (
    categoryName: string,
  ) =>
    posOfferings.filter(
      (offering) =>
        offering.category === categoryName &&
        offering.status === 'Active' &&
        offering.posAvailable,
    ).length;

  // =======================================================
  // SUBCATEGORY FOLDERS
  // =======================================================

  const visibleSubCategories =
    useMemo(() => {
      // When folder is opened, show only items/services.
      if (subCategoryFilter) {
        return [];
      }

      return posSubCategories
        .filter((subCategory) => {
          if (
            subCategory.status !== 'Active'
          ) {
            return false;
          }

          if (
            categoryFilter !== 'All' &&
            subCategory.category !==
              categoryFilter
          ) {
            return false;
          }

          // Only show folder if it contains
          // at least one active POS offering.
          return posOfferings.some(
            (offering) =>
              offering.subCategory ===
                subCategory.name &&
              offering.status === 'Active' &&
              offering.posAvailable &&
              (
                categoryFilter === 'All' ||
                offering.category ===
                  categoryFilter
              ),
          );
        })
        .sort(
          (a, b) =>
            a.displayOrder -
            b.displayOrder,
        );
    }, [
      categoryFilter,
      subCategoryFilter,
    ]);

  const getSubCategoryCount = (
    subCategoryName: string,
  ) =>
    posOfferings.filter(
      (offering) =>
        offering.subCategory ===
          subCategoryName &&
        offering.status === 'Active' &&
        offering.posAvailable &&
        (
          categoryFilter === 'All' ||
          offering.category ===
            categoryFilter
        ),
    ).length;

  // =======================================================
  // OFFERING FILTER
  // =======================================================

  const filteredOfferings =
    useMemo(() => {
      return posOfferings.filter(
        (offering) => {
          if (
            offering.status !== 'Active' ||
            !offering.posAvailable
          ) {
            return false;
          }

          // Category filter
          if (
            categoryFilter !== 'All' &&
            offering.category !==
              categoryFilter
          ) {
            return false;
          }

          // Folder filter
          if (
            subCategoryFilter &&
            offering.subCategory !==
              subCategoryFilter
          ) {
            return false;
          }

          // Search
          if (search) {
            const query =
              search.toLowerCase();

            if (
              !offering.name
                .toLowerCase()
                .includes(query) &&
              !offering.code
                .toLowerCase()
                .includes(query) &&
              !offering.tamilName
                .toLowerCase()
                .includes(query)
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      search,
      categoryFilter,
      subCategoryFilter,
    ]);

  // =======================================================
  // TOTALS
  // =======================================================

  const totals = useMemo(() => {
    const gross =
      cart.reduce(
        (sum, line) =>
          sum + line.grossAmount,
        0,
      );

    const gst =
      cart.reduce(
        (sum, line) =>
          sum + line.gstAmount,
        0,
      );

    const ledger =
      cart.reduce(
        (sum, line) =>
          sum + line.ledgerAmount,
        0,
      );

    const roundOff =
      Math.round(gross) - gross;

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
  // ADD TO CART
  // =======================================================

  const addToCart = (
    offering: PosOffering,
    details: {
      deities?: string[];
      devotees?: {
        name: string;
        nakshatra: string;
      }[];
      eventDate?: string;
      session?: string;
    },
  ) => {
    const deities =
      details.deities ?? [];

    const devotees =
      details.devotees ?? [];

    const newTempNames =
      devotees
        .map(
          (devotee) =>
            devotee.name,
        )
        .filter(
          (name) =>
            name.trim() &&
            !tempNames.includes(
              name,
            ),
        );

    if (
      newTempNames.length > 0
    ) {
      setTempNames(
        (previous) => [
          ...previous,
          ...newTempNames,
        ],
      );
    }

    const qty =
      offering.isEvent
        ? 1
        : Math.max(
            deities.length,
            1,
          );

    const gross =
      offering.price * qty;

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

    const newLine: PosCartLine = {
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
        offering.gstClass as any,

      deities:
        deities.length > 0
          ? deities
          : undefined,

      devoteeName:
        devotees[0]?.name,

      nakshatra:
        devotees[0]?.nakshatra,

      devotees:
        devotees.length > 0
          ? devotees
          : undefined,

      eventDate:
        details.eventDate,

      session:
        details.session,

      printingGroup:
        offering.printingGroup,

      gstAmount:
        gst,

      ledgerAmount:
        ledger,

      grossAmount:
        gross,
    };

    setCart(
      (previous) => [
        ...previous,
        newLine,
      ],
    );

    setOfferingModal(null);

    toast.success(
      'Added to cart',
      `${offering.name} added.`,
    );
  };

  // =======================================================
  // REMOVE / CLEAR
  // =======================================================

  const removeLine = (
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

    toast.info(
      'Entry removed',
    );
  };

  const clearCart = () => {
    setCart([]);

    setTempNames([]);

    setClearCartOpen(false);

    toast.info(
      'Cart cleared',
    );
  };

  // =======================================================
  // OFFERING CLICK
  // =======================================================

  const handleOfferingClick = (
    offering: PosOffering,
  ) => {
    const status =
      getOfferingStatus(
        offering,
      );

    if (
      status === 'Out of Stock'
    ) {
      toast.error(
        'Out of Stock',
        `${offering.name} is currently out of stock.`,
      );

      return;
    }

    if (
      status === 'Inactive' ||
      status === 'POS Unavailable'
    ) {
      toast.error(
        'Unavailable',
        `${offering.name} is not available.`,
      );

      return;
    }

    setOfferingModal(
      offering,
    );

    setEditLineId(null);
  };

  // =======================================================
  // EDIT CART LINE
  // =======================================================

  const handleEditLine = (
    line: PosCartLine,
  ) => {
    const offering =
      posOfferings.find(
        (record) =>
          record.id ===
          line.offeringId,
      );

    if (offering) {
      setOfferingModal(
        offering,
      );

      setEditLineId(
        line.id,
      );
    }
  };

  const handleEditSave = (
    offering: PosOffering,
    details: {
      deities?: string[];
      devotees?: {
        name: string;
        nakshatra: string;
      }[];
      eventDate?: string;
      session?: string;
    },
  ) => {
    if (editLineId) {
      const deities =
        details.deities ?? [];

      const devotees =
        details.devotees ?? [];

      const qty =
        offering.isEvent
          ? 1
          : Math.max(
              deities.length,
              1,
            );

      const gross =
        offering.price * qty;

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

      const updatedLine: PosCartLine = {
        id:
          editLineId,

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
          offering.gstClass as any,

        deities:
          deities.length > 0
            ? deities
            : undefined,

        devoteeName:
          devotees[0]?.name,

        nakshatra:
          devotees[0]?.nakshatra,

        devotees:
          devotees.length > 0
            ? devotees
            : undefined,

        eventDate:
          details.eventDate,

        session:
          details.session,

        printingGroup:
          offering.printingGroup,

        gstAmount:
          gst,

        ledgerAmount:
          ledger,

        grossAmount:
          gross,
      };

      setCart(
        (previous) =>
          previous.map(
            (line) =>
              line.id ===
              editLineId
                ? updatedLine
                : line,
          ),
      );

      setEditLineId(null);

      setOfferingModal(null);

      toast.success(
        'Entry updated',
      );
    } else {
      addToCart(
        offering,
        details,
      );
    }
  };

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
  // CUSTOMER TRANSACTIONS
  // =======================================================

  const customerTxns =
    useMemo(() => {
      if (
        !selectedCustomer
      ) {
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
        .slice(0, 3);
    }, [
      selectedCustomer,
      transactions,
    ]);

  // =======================================================
  // LOAD PREVIOUS TRANSACTION
  // =======================================================

  const loadPrevToCart = (
    txnId: string,
  ) => {
    const transaction =
      transactions.find(
        (record) =>
          record.id === txnId,
      );

    if (!transaction) {
      return;
    }

    setPreviewTxn(
      transaction,
    );
  };

  const confirmLoadTxn = () => {
    if (!previewTxn) {
      return;
    }

    const available: PosCartLine[] = [];

    const unavailable: string[] = [];

    for (
      const line of previewTxn.lines
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
        unavailable.push(
          line.name,
        );

        continue;
      }

      const gross =
        offering.price *
        line.qty;

      const newLine: PosCartLine = {
        ...line,

        id:
          Math.random()
            .toString(36)
            .slice(2),

        price:
          offering.price,

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

    setPreviewTxn(null);

    if (
      unavailable.length > 0
    ) {
      toast.warning(
        'Some items unavailable',
        `${unavailable.join(
          ', ',
        )} not available.`,
      );
    } else {
      toast.success(
        'Transaction loaded',
        `${available.length} item(s) added to cart.`,
      );
    }
  };

  // =======================================================
  // PAYMENT COMPLETE
  // =======================================================

  const handlePaymentComplete = (
    txn: PosTransaction,
  ) => {
    addTransaction(txn);

    setCart([]);

    setTempNames([]);

    setSelectedCustomer(null);

    setPaymentOpen(false);

    setSuccessTxn(txn);
  };

  const handleNewTransaction = () => {
    setSuccessTxn(null);

    setSearch('');

    setCategoryFilter(
      'All',
    );

    setSubCategoryFilter('');
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
  // UI
  // =======================================================

  return (
    <div className="flex h-full overflow-hidden">

      {/* CUSTOMER */}

      <div className="hidden w-64 shrink-0 flex-col border-r border-brown-100 bg-white lg:flex">

        <CustomerSection
          selectedCustomer={
            selectedCustomer
          }

          setSelectedCustomer={
            setSelectedCustomer
          }

          customerSearch={
            customerSearch
          }

          setCustomerSearch={
            setCustomerSearch
          }

          customerSearchOpen={
            customerSearchOpen
          }

          setCustomerSearchOpen={
            setCustomerSearchOpen
          }

          customerResults={
            customerResults
          }

          setCreateCustomerOpen={
            setCreateCustomerOpen
          }

          setEditCustomerOpen={
            setEditCustomerOpen
          }

          customerTxns={
            customerTxns
          }

          onPrevTxnLoad={
            loadPrevToCart
          }
        />

      </div>

      {/* ================================================= */}
      {/* OFFERINGS */}
      {/* ================================================= */}

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* SEARCH + CATEGORY */}

        <div className="border-b border-brown-100 bg-white p-4">

          <div className="relative mb-3">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search offerings..."
              className="input pl-9"
            />

          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => {
                setCategoryFilter(
                  'All',
                );

                setSubCategoryFilter(
                  '',
                );
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium',

                categoryFilter ===
                  'All'
                  ? 'bg-gold-100 text-gold-800'
                  : 'bg-cream-50 text-brown-500',
              )}
            >
              All Categories
            </button>

            {activeCategories.map(
              (category) => (

                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() => {
                    setCategoryFilter(
                      category.name,
                    );

                    setSubCategoryFilter(
                      '',
                    );
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium',

                    categoryFilter ===
                      category.name
                      ? 'text-white'
                      : 'bg-cream-50 text-brown-500',
                  )}
                  style={
                    categoryFilter ===
                    category.name
                      ? {
                          backgroundColor:
                            category.colour,
                        }
                      : {}
                  }
                >
                  {category.name}{' '}
                  (
                  {getCategoryCount(
                    category.name,
                  )}
                  )
                </button>

              ),
            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* SAME GRID: FOLDERS + ITEMS + SERVICES */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto p-4">

          {/* OPEN FOLDER HEADER */}

          {subCategoryFilter && (

            <div className="mb-3 flex items-center gap-2">

              <FolderOpen className="h-4 w-4 text-gold-600" />

              <span className="text-sm font-semibold text-brown-800">
                {subCategoryFilter}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSubCategoryFilter('')
                }
                className="ml-1 text-xs font-medium text-maroon-600 hover:underline"
              >
                Back
              </button>

            </div>

          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {/* ============================================= */}
            {/* SUBCATEGORY FOLDERS */}
            {/* SAME GRID AS ITEMS/SERVICES */}
            {/* ============================================= */}

            {visibleSubCategories.map(
              (subCategory) => (

                <button
                  key={`folder-${subCategory.id}`}
                  type="button"
                  onClick={() =>
                    setSubCategoryFilter(
                      subCategory.name,
                    )
                  }
                  className="card p-3 text-left transition-all hover:border-gold-300 hover:shadow-card-hover"
                >

                  <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-gold-50 text-gold-600">

                    <Folder className="h-9 w-9" />

                  </div>

                  <p className="text-sm font-medium text-brown-800">
                    {subCategory.name}
                  </p>

                  {subCategory.tamilName && (

                    <p className="text-xs text-brown-400">
                      {subCategory.tamilName}
                    </p>

                  )}

                  <div className="mt-1 flex items-center gap-1">

                    <span className="badge bg-gold-100 text-[10px] text-gold-700">
                      Folder
                    </span>

                    <span className="text-[10px] text-brown-400">
                      {getSubCategoryCount(
                        subCategory.name,
                      )}{' '}
                      offering(s)
                    </span>

                  </div>

                </button>

              ),
            )}

            {/* ============================================= */}
            {/* EXISTING ITEM / SERVICE CARDS */}
            {/* DISPLAY KEPT THE SAME */}
            {/* ============================================= */}

            {filteredOfferings.map(
              (offering) => {
                const status =
                  getOfferingStatus(
                    offering,
                  );

                const disabled =
                  status ===
                    'Out of Stock' ||
                  status ===
                    'Inactive' ||
                  status ===
                    'POS Unavailable';

                return (

                  <button
                    key={
                      offering.id
                    }
                    type="button"
                    onClick={() =>
                      handleOfferingClick(
                        offering,
                      )
                    }
                    disabled={
                      disabled
                    }
                    className={cn(
                      'card p-3 text-left transition-all',

                      !disabled &&
                        'hover:shadow-card-hover hover:border-maroon-200',

                      disabled &&
                        'cursor-not-allowed opacity-60',
                    )}
                  >

                    <div
                      className={cn(
                        'mb-2 flex h-16 items-center justify-center rounded-lg',

                        offering.isEvent
                          ? 'bg-saffron-50 text-saffron-600'
                          : offering.type ===
                              'Service'
                            ? 'bg-gold-50 text-gold-600'
                            : 'bg-cream-100 text-brown-500',
                      )}
                    >

                      {offering.isEvent ? (

                        <Calendar className="h-8 w-8" />

                      ) : offering.type ===
                        'Service' ? (

                        <Sparkles className="h-8 w-8" />

                      ) : (

                        <Package className="h-8 w-8" />

                      )}

                    </div>

                    <p className="text-sm font-medium text-brown-800">
                      {offering.name}
                    </p>

                    <p className="text-xs text-brown-400">
                      {offering.tamilName}
                    </p>

                    <div className="mt-1 flex items-center gap-1">

                      <span
                        className={cn(
                          'badge text-[10px]',

                          offering.isEvent
                            ? 'bg-saffron-100 text-saffron-700'
                            : offering.type ===
                                'Service'
                              ? 'bg-gold-100 text-gold-700'
                              : 'bg-cream-100 text-brown-600',
                        )}
                      >
                        {offering.isEvent
                          ? 'Event'
                          : offering.type}
                      </span>

                      {status !==
                        'Available' && (

                        <span
                          className={cn(
                            'badge text-[10px]',

                            status ===
                              'Low Stock'
                              ? 'bg-saffron-100 text-saffron-700'
                              : status ===
                                  'Out of Stock'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-brown-100 text-brown-600',
                          )}
                        >
                          {status}
                        </span>

                      )}

                    </div>

                    <p className="mt-2 font-serif text-base font-semibold text-maroon-700">

                      {formatSGD(
                        offering.price,
                      )}

                    </p>

                  </button>

                );
              },
            )}

          </div>

          {/* NO RESULTS */}

          {visibleSubCategories.length === 0 &&
            filteredOfferings.length === 0 && (

            <div className="py-12 text-center text-sm text-brown-400">
              No items or services found.
            </div>

          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* CART */}
      {/* ================================================= */}

      <div className="flex w-full max-w-sm flex-col border-l border-brown-100 bg-white sm:max-w-md">

        <div className="flex items-center justify-between border-b border-brown-100 p-4">

          <div className="flex items-center gap-2">

            <ShoppingCart className="h-5 w-5 text-maroon-600" />

            <h2 className="font-serif text-lg font-semibold text-brown-900">
              Cart
            </h2>

            <span className="badge bg-maroon-50 text-maroon-700">
              {cart.length}
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

        <div className="flex-1 overflow-y-auto p-3">

          {cart.length === 0 ? (

            <div className="flex flex-col items-center justify-center py-16 text-center">

              <ShoppingCart className="h-12 w-12 text-brown-200" />

              <p className="mt-3 text-sm font-medium text-brown-500">
                No items or services added
              </p>

              <p className="text-xs text-brown-400">
                Select an offering to begin the transaction.
              </p>

            </div>

          ) : (

            <div className="space-y-1.5">

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
                      className="rounded-lg border border-brown-50"
                    >

                      <div className="flex items-center justify-between p-2.5">

                        <button
                          type="button"
                          onClick={() =>
                            toggleLine(
                              line.id,
                            )
                          }
                          className="flex flex-1 items-center gap-1.5 text-left"
                        >

                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 text-brown-400 transition-transform',

                              expanded &&
                                'rotate-180',
                            )}
                          />

                          <div className="flex-1">

                            <p className="text-sm font-medium text-brown-800">
                              {line.name}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-brown-500">

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
                                <span>·</span>
                              )}

                              <span>
                                Qty: {line.qty}
                              </span>

                              {line.eventDate && (

                                <>
                                  <span>·</span>

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

                          </div>

                        </button>

                        <div className="flex items-center gap-1">

                          <p className="text-sm font-semibold text-brown-900">
                            {formatSGD(
                              line.grossAmount,
                            )}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              handleEditLine(
                                line,
                              )
                            }
                            className="rounded p-1 text-brown-400 hover:bg-cream-100 hover:text-maroon-600"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRemoveTarget(
                                line.id,
                              )
                            }
                            className="rounded p-1 text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                        </div>

                      </div>

                      {expanded &&
                        line.devotees &&
                        line.devotees.length >
                          0 && (

                        <div className="border-t border-brown-50 p-2.5 pl-8">

                          <p className="mb-1.5 text-xs font-medium text-brown-600">
                            Devotees
                          </p>

                          <div className="space-y-1">

                            {line.devotees.map(
                              (
                                devotee,
                                index,
                              ) => {
                                const isEditing =
                                  editingDevotee?.lineId ===
                                    line.id &&
                                  editingDevotee?.index ===
                                    index;

                                if (
                                  isEditing
                                ) {
                                  return (

                                    <div
                                      key={
                                        index
                                      }
                                      className="flex items-center gap-2"
                                    >

                                      <TextInput
                                        value={
                                          devoteeDraft.name
                                        }
                                        onChange={(event) =>
                                          setDevoteeDraft({
                                            ...devoteeDraft,
                                            name:
                                              event.target.value,
                                          })
                                        }
                                        placeholder="Devotee Name"
                                        className="flex-1 !py-1 !text-xs"
                                      />

                                      <div className="flex-1">

                                        <Dropdown
                                          value={
                                            devoteeDraft.nakshatra
                                          }
                                          onChange={(value) =>
                                            setDevoteeDraft({
                                              ...devoteeDraft,
                                              nakshatra:
                                                value,
                                            })
                                          }
                                          options={posNakshatras.map(
                                            (
                                              nakshatra,
                                            ) => ({
                                              label:
                                                nakshatra.name,
                                              value:
                                                nakshatra.name,
                                            }),
                                          )}
                                          placeholder="Nakshatra"
                                        />

                                      </div>

                                      <button
                                        type="button"
                                        onClick={
                                          saveDevoteeEdit
                                        }
                                        className="rounded p-1 text-green-600 hover:bg-green-50"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={
                                          cancelDevoteeEdit
                                        }
                                        className="rounded p-1 text-red-500 hover:bg-red-50"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>

                                    </div>

                                  );
                                }

                                return (

                                  <div
                                    key={
                                      index
                                    }
                                    className="group flex items-center gap-2 text-xs text-brown-700"
                                  >

                                    <span className="font-medium">
                                      {devotee.name}
                                    </span>

                                    <span className="text-brown-400">
                                      ·
                                    </span>

                                    <span>
                                      {devotee.nakshatra}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        startDevoteeEdit(
                                          line.id,
                                          index,
                                          devotee,
                                        )
                                      }
                                      className="rounded p-0.5 text-brown-300 opacity-0 transition hover:bg-cream-100 hover:text-maroon-600 group-hover:opacity-100"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>

                                  </div>

                                );
                              },
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

        </div>

        <div className="border-t border-brown-100 p-4">

          <div className="flex justify-between border-t border-brown-100 pt-2 text-base font-semibold text-brown-900">

            <span>
              Total Payable
            </span>

            <span>
              {formatSGD(
                totals.payable,
              )}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setPaymentOpen(
                true,
              )
            }
            disabled={
              !cartValid
            }
            className="btn-primary mt-4 w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard className="h-5 w-5" />

            Proceed to Payment
          </button>

        </div>

      </div>

      {/* MOBILE CUSTOMER */}

      <button
        type="button"
        onClick={() =>
          setCustomerSearchOpen(
            true,
          )
        }
        className="fixed bottom-4 left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-maroon-700 text-white shadow-card-hover lg:hidden"
      >
        <UserPlus className="h-5 w-5" />
      </button>

      {/* PREVIOUS TRANSACTION */}

      {previewTxn && (

        <TransactionPreviewModal
          txn={
            previewTxn
          }
          onClose={() =>
            setPreviewTxn(null)
          }
          onConfirm={
            confirmLoadTxn
          }
        />

      )}

      {/* OFFERING MODAL */}

      {offeringModal && (

        <OfferingModal
          offering={
            offeringModal
          }
          onClose={() => {
            setOfferingModal(
              null,
            );

            setEditLineId(
              null,
            );
          }}
          onAdd={
            handleEditSave
          }
          editLine={
            editLineId
              ? cart.find(
                  (line) =>
                    line.id ===
                    editLineId,
                ) ?? null
              : null
          }
          selectedCustomer={
            selectedCustomer
          }
          selectedFamilyMember={
            selectedFamilyMember
          }
          tempNames={
            tempNames
          }
        />

      )}

      {/* CREATE CUSTOMER */}

      <CreateCustomerModal
        open={
          createCustomerOpen
        }
        onClose={() =>
          setCreateCustomerOpen(
            false,
          )
        }
        onSave={(customer) => {
          addCustomer(customer);

          setSelectedCustomer(
            customer,
          );

          setCreateCustomerOpen(
            false,
          );

          toast.success(
            'Customer created successfully',
            `${customer.name} (${customer.code}) added.`,
          );
        }}
        existingCustomers={
          customers
        }
      />

      {/* EDIT CUSTOMER */}

      <EditCustomerModal
        open={
          editCustomerOpen
        }
        customer={
          selectedCustomer
        }
        onClose={() =>
          setEditCustomerOpen(
            false,
          )
        }
        onSave={(customer) => {
          updateCustomer(
            customer,
          );

          setSelectedCustomer(
            customer,
          );

          setEditCustomerOpen(
            false,
          );

          toast.success(
            'Customer updated',
            `${customer.name} updated.`,
          );
        }}
      />

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
            removeLine(
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
          setClearCartOpen(
            false,
          )
        }
        onConfirm={
          clearCart
        }
        title="Clear Cart"
        message="Clear all cart entries and temporary devotee names?"
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
            setPaymentOpen(
              false,
            )
          }
          cart={
            cart
          }
          totals={
            totals
          }
          customer={
            selectedCustomer
          }
          posUser={
            user!
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
// CUSTOMER SECTION
// =========================================================

function CustomerSection({
  selectedCustomer,
  setSelectedCustomer,
  customerSearch,
  setCustomerSearch,
  customerSearchOpen,
  setCustomerSearchOpen,
  customerResults,
  setCreateCustomerOpen,
  setEditCustomerOpen,
  customerTxns,
  onPrevTxnLoad,
}: any) {
  return (
    <div className="flex h-full flex-col">

      <div className="border-b border-brown-100 p-3">

        <h3 className="mb-2 font-serif text-sm font-semibold text-brown-900">
          Customer
        </h3>

        {!selectedCustomer ? (

          <>
            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />

              <input
                type="text"
                value={
                  customerSearch
                }
                onChange={(event) => {
                  setCustomerSearch(
                    event.target.value,
                  );

                  setCustomerSearchOpen(
                    true,
                  );
                }}
                onFocus={() =>
                  setCustomerSearchOpen(
                    true,
                  )
                }
                placeholder="Search customer..."
                className="input pl-9 py-1.5 text-sm"
              />

              {customerSearch && (

                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearch(
                      '',
                    );

                    setCustomerSearchOpen(
                      false,
                    );
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400"
                >
                  <X className="h-4 w-4" />
                </button>

              )}

            </div>

            {customerSearchOpen &&
              customerSearch && (

              <div className="mt-2">

                {customerResults.length ===
                0 ? (

                  <div className="rounded-lg border border-brown-100 p-2 text-center">

                    <p className="text-xs text-brown-500">
                      No matching customer found.
                    </p>

                    <div className="mt-2">

                      <button
                        type="button"
                        onClick={() => {
                          setCreateCustomerOpen(
                            true,
                          );

                          setCustomerSearchOpen(
                            false,
                          );
                        }}
                        className="btn-primary w-full py-1 text-xs"
                      >
                        Create New
                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="space-y-1">

                    {customerResults.map(
                      (
                        customer: PosCustomer,
                      ) => (

                        <button
                          key={
                            customer.id
                          }
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(
                              customer,
                            );

                            setCustomerSearch(
                              '',
                            );

                            setCustomerSearchOpen(
                              false,
                            );
                          }}
                          className="group w-full rounded-lg border border-brown-50 p-2 text-left hover:bg-cream-50"
                        >

                          <p className="text-sm font-medium text-brown-800">
                            {customer.name}
                          </p>

                          <p className="text-xs text-brown-400">
                            {customer.code}
                            {' · '}
                            {customer.mobile}
                          </p>

                        </button>

                      ),
                    )}

                  </div>

                )}

              </div>

            )}

            <button
              type="button"
              onClick={() =>
                setCreateCustomerOpen(
                  true,
                )
              }
              className="btn-outline mt-2 w-full py-1.5 text-xs"
            >
              <UserPlus className="h-3 w-3" />

              Create Customer
            </button>

          </>

        ) : (

          <div className="group rounded-lg border border-brown-100 p-2">

            <div className="flex items-start justify-between">

              <div className="flex-1">

                <p className="text-sm font-semibold text-brown-800">
                  {selectedCustomer.name}
                </p>

                <div className="mt-1 hidden space-y-0.5 group-hover:block">

                  <p className="text-xs text-brown-500">
                    Mobile: {selectedCustomer.mobile}
                  </p>

                  {selectedCustomer.email && (

                    <p className="text-xs text-brown-500">
                      Email: {selectedCustomer.email}
                    </p>

                  )}

                </div>

              </div>

              <div className="flex gap-1">

                <button
                  type="button"
                  onClick={() =>
                    setEditCustomerOpen(
                      true,
                    )
                  }
                  className="rounded p-1 text-brown-400 hover:bg-cream-100 hover:text-maroon-600"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCustomer(
                      null,
                    )
                  }
                  className="rounded p-1 text-red-400 hover:bg-red-50"
                >
                  <UserX className="h-3.5 w-3.5" />
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

      {selectedCustomer && (

        <div className="flex-1 overflow-y-auto p-3">

          <p className="mb-2 text-xs font-medium text-brown-600">
            Last 3 Transactions
          </p>

          {customerTxns.length ===
          0 ? (

            <p className="text-xs text-brown-400">
              No previous transactions.
            </p>

          ) : (

            <div className="space-y-1.5">

              {customerTxns.map(
                (
                  transaction: PosTransaction,
                ) => (

                  <div
                    key={
                      transaction.id
                    }
                    className="rounded-lg border border-brown-50 p-2"
                  >

                    <div className="flex justify-between">

                      <p className="text-xs font-medium text-brown-700">
                        Txn ID: {transaction.txnNo}
                      </p>

                      <p className="text-xs font-semibold text-brown-800">
                        {formatSGD(
                          transaction.payableAmount,
                        )}
                      </p>

                    </div>

                    <p className="text-[10px] text-brown-400">
                      {formatDate(
                        transaction.datetime,
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onPrevTxnLoad(
                          transaction.id,
                        )
                      }
                      className="btn-ghost mt-1 px-2 py-0.5 text-[10px]"
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

    </div>
  );
}

// =========================================================
// OFFERING MODAL
// =========================================================

function OfferingModal({
  offering,
  onClose,
  onAdd,
  editLine,
  selectedCustomer,
}: {
  offering: PosOffering;

  onClose: () => void;

  onAdd: (
    offering: PosOffering,
    details: {
      deities?: string[];
      devotees?: {
        name: string;
        nakshatra: string;
      }[];
      eventDate?: string;
      session?: string;
    },
  ) => void;

  editLine: PosCartLine | null;

  selectedCustomer: PosCustomer | null;

  selectedFamilyMember: string | null;

  tempNames: string[];
}) {
  const isEvent =
    !!offering.isEvent;

  const deityList =
    posDeities;

  const [
    selectedDeities,
    setSelectedDeities,
  ] = useState<string[]>(
    editLine?.deities ?? [],
  );

  const [
    devotees,
    setDevotees,
  ] = useState<
    {
      name: string;
      nakshatra: string;
    }[]
  >(() => {
    if (
      editLine?.devotees &&
      editLine.devotees.length >
        0
    ) {
      const rows =
        editLine.devotees.map(
          (value) => ({
            ...value,
          }),
        );

      while (
        rows.length < 2
      ) {
        rows.push({
          name: '',
          nakshatra: '',
        });
      }

      return rows;
    }

    return [
      {
        name: '',
        nakshatra: '',
      },
      {
        name: '',
        nakshatra: '',
      },
    ];
  });

  const [
    eventDate,
    setEventDate,
  ] = useState(
    editLine?.eventDate ?? '',
  );

  const [
    eventSession,
    setEventSession,
  ] = useState<
    | 'Morning'
    | 'Evening'
    | ''
  >(
    isEvent &&
      editLine?.session
      ? editLine.session.startsWith(
          'Morning',
        )
        ? 'Morning'
        : 'Evening'
      : '',
  );

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(
    editLine?.session ?? '',
  );

  const [
    errors,
    setErrors,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const availableSlots =
    useMemo(() => {
      if (
        !isEvent ||
        !eventSession
      ) {
        return [];
      }

      return (
        offering.eventSlots ??
        []
      ).filter(
        (slot) =>
          slot.session ===
            eventSession &&
          slot.status ===
            'Active',
      );
    }, [
      isEvent,
      eventSession,
      offering.eventSlots,
    ]);

  const qty =
    isEvent
      ? 1
      : Math.max(
          selectedDeities.length,
          1,
        );

  const totalCost =
    offering.price *
    qty;

  const validate = () => {
    const validationErrors: Record<
      string,
      string
    > = {};

    if (
      isEvent &&
      selectedDeities.length !==
        1
    ) {
      validationErrors.deities =
        'Select exactly one deity.';
    }

    if (
      !isEvent &&
      selectedDeities.length ===
        0
    ) {
      validationErrors.deities =
        'Select at least one deity.';
    }

    const validRows =
      devotees.filter(
        (row) =>
          row.name.trim(),
      );

    if (
      validRows.length ===
      0
    ) {
      validationErrors.devotees =
        'Enter at least one devotee.';
    } else if (
      validRows.some(
        (row) =>
          /^\d+$/.test(
            row.name.trim(),
          ),
      )
    ) {
      validationErrors.devotees =
        'Name cannot contain only numbers.';
    } else if (
      validRows.some(
        (row) =>
          !row.nakshatra,
      )
    ) {
      validationErrors.devotees =
        'Select a Nakshatra for each devotee.';
    }

    if (isEvent) {
      if (!eventDate) {
        validationErrors.eventDate =
          'Select an event date.';
      }

      if (!eventSession) {
        validationErrors.session =
          'Select a session.';
      }

      if (!selectedSlot) {
        validationErrors.slot =
          'Select a slot.';
      }
    } else {
      if (
        offering.eventDateRequired &&
        !eventDate
      ) {
        validationErrors.eventDate =
          'Select an event date.';
      }

      if (
        offering.sessionRequired &&
        !selectedSlot
      ) {
        validationErrors.session =
          'Select a session.';
      }
    }

    setErrors(
      validationErrors,
    );

    return (
      Object.keys(
        validationErrors,
      ).length === 0
    );
  };

  const handleAdd = () => {
    if (!validate()) {
      return;
    }

    const validDevotees =
      devotees
        .filter(
          (row) =>
            row.name.trim(),
        )
        .map(
          (row) => ({
            ...row,
          }),
        );

    onAdd(
      offering,
      {
        deities:
          selectedDeities.length >
          0
            ? selectedDeities
            : undefined,

        devotees:
          validDevotees.length >
          0
            ? validDevotees
            : undefined,

        eventDate:
          eventDate ||
          undefined,

        session:
          selectedSlot ||
          undefined,
      },
    );
  };

  const toggleDeity = (
    name: string,
  ) => {
    if (isEvent) {
      setSelectedDeities(
        selectedDeities[0] ===
          name
          ? []
          : [name],
      );
    } else {
      setSelectedDeities(
        (previous) =>
          previous.includes(
            name,
          )
            ? previous.filter(
                (deity) =>
                  deity !==
                  name,
              )
            : [
                ...previous,
                name,
              ],
      );
    }
  };

  const updateDevoteeRow = (
    index: number,
    field:
      | 'name'
      | 'nakshatra',
    value: string,
  ) =>
    setDevotees(
      (previous) =>
        previous.map(
          (
            row,
            rowIndex,
          ) =>
            rowIndex ===
            index
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row,
        ),
    );

  return (
    <Modal
      open={true}
      onClose={
        onClose
      }
      title={
        editLine
          ? 'Edit Entry'
          : offering.name
      }
      description={
        offering.tamilName
      }
      size="lg"
      footer={
        <div className="flex flex-1 items-center justify-between">

          <span className="text-sm text-brown-500">
            Total:{' '}
            <span className="font-semibold text-brown-900">
              {formatSGD(
                totalCost,
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
                handleAdd
              }
            >
              {editLine
                ? 'Save'
                : 'Add to Cart'}
            </button>

          </div>

        </div>
      }
    >

      <div className="grid gap-3 sm:grid-cols-2">

        {isEvent && (

          <>
            <FormField
              label="Event Date"
              required
              error={
                errors.eventDate
              }
            >
              <TextInput
                type="date"
                value={
                  eventDate
                }
                onChange={(event) =>
                  setEventDate(
                    event.target.value,
                  )
                }
                min={
                  offering.eventStartDate
                }
                max={
                  offering.eventEndDate
                }
              />
            </FormField>

            <FormField
              label="Session"
              required
              error={
                errors.session
              }
            >

              <div className="flex gap-3 pt-1.5">

                {[
                  'Morning',
                  'Evening',
                ].map(
                  (session) => (

                    <label
                      key={
                        session
                      }
                      className="flex cursor-pointer items-center gap-1.5 text-sm text-brown-700"
                    >
                      <input
                        type="radio"
                        checked={
                          eventSession ===
                          session
                        }
                        onChange={() => {
                          setEventSession(
                            session as
                              | 'Morning'
                              | 'Evening',
                          );

                          setSelectedSlot(
                            '',
                          );
                        }}
                        className="h-4 w-4 accent-maroon-600"
                      />

                      {session}
                    </label>

                  ),
                )}

              </div>

            </FormField>

            <FormField
              label="Slot"
              required
              error={
                errors.slot
              }
              className="sm:col-span-2"
            >
              <Dropdown
                value={
                  selectedSlot
                }
                onChange={
                  setSelectedSlot
                }
                options={availableSlots.map(
                  (slot) => ({
                    label: `${slot.slotName} (Max: ${slot.maxCount})`,
                    value: `${slot.session} – ${slot.slotName}`,
                  }),
                )}
                placeholder={
                  eventSession
                    ? 'Select a slot'
                    : 'Select a session first'
                }
              />
            </FormField>

          </>

        )}

        {!isEvent &&
          offering.eventDateRequired && (

          <FormField
            label="Event Date"
            required
            error={
              errors.eventDate
            }
          >
            <TextInput
              type="date"
              value={
                eventDate
              }
              onChange={(event) =>
                setEventDate(
                  event.target.value,
                )
              }
              min={
                new Date()
                  .toISOString()
                  .slice(
                    0,
                    10,
                  )
              }
            />
          </FormField>

        )}

        {!isEvent &&
          offering.sessionRequired && (

          <FormField
            label="Session"
            required
            error={
              errors.session
            }
          >
            <Dropdown
              value={
                selectedSlot
              }
              onChange={
                setSelectedSlot
              }
              options={[
                {
                  label:
                    'Morning',
                  value:
                    'Morning',
                },
                {
                  label:
                    'Evening',
                  value:
                    'Evening',
                },
              ]}
              placeholder="Select session"
            />
          </FormField>

        )}

        <FormField
          label={
            isEvent
              ? 'Deity'
              : 'Deities (Multi-Select)'
          }
          required
          error={
            errors.deities
          }
          className="sm:col-span-2"
        >

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
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm transition-colors',

                      selected
                        ? 'border-maroon-500 bg-maroon-50'
                        : 'border-brown-100 hover:border-brown-200',
                    )}
                  >
                    <Temple className="h-4 w-4 text-gold-600" />

                    {deity.name}
                  </button>

                );
              },
            )}

          </div>

          {!isEvent &&
            selectedDeities.length >
              0 && (

            <p className="mt-1 text-xs text-brown-400">
              {selectedDeities.length}{' '}
              deity/deities selected · Qty:{' '}
              {selectedDeities.length}
            </p>

          )}

        </FormField>

        {selectedDeities.length >
          0 && (

          <FormField
            label="Devotee Details (2 rows — applies to all selected deities)"
            required
            error={
              errors.devotees
            }
            className="sm:col-span-2"
          >

            {selectedCustomer?.familyMembers &&
              selectedCustomer.familyMembers.length >
                0 && (

              <div className="mb-2 flex flex-wrap gap-1">

                {selectedCustomer.familyMembers.map(
                  (
                    member,
                    index,
                  ) => (

                    <button
                      key={
                        index
                      }
                      type="button"
                      onClick={() =>
                        setDevotees(
                          (previous) => {
                            const next = [
                              ...previous,
                            ];

                            next[0] = {
                              name:
                                member.name,
                              nakshatra:
                                member.nakshatra,
                            };

                            return next;
                          },
                        )
                      }
                      className="rounded-lg bg-cream-100 px-2 py-1 text-xs text-brown-600 hover:bg-cream-200"
                    >
                      {member.name}
                    </button>

                  ),
                )}

              </div>

            )}

            <div className="space-y-2">

              {devotees.map(
                (
                  row,
                  index,
                ) => (

                  <div
                    key={
                      index
                    }
                    className="flex items-center gap-2"
                  >

                    <span className="w-6 shrink-0 text-xs font-medium text-brown-400">
                      {index + 1}.
                    </span>

                    <TextInput
                      value={
                        row.name
                      }
                      onChange={(event) =>
                        updateDevoteeRow(
                          index,
                          'name',
                          event.target.value,
                        )
                      }
                      placeholder="Devotee Name"
                      className="flex-1"
                    />

                    <div className="flex-1">

                      <Dropdown
                        value={
                          row.nakshatra
                        }
                        onChange={(value) =>
                          updateDevoteeRow(
                            index,
                            'nakshatra',
                            value,
                          )
                        }
                        options={posNakshatras.map(
                          (
                            nakshatra,
                          ) => ({
                            label:
                              nakshatra.name,
                            value:
                              nakshatra.name,
                          }),
                        )}
                        placeholder="Nakshatra"
                      />

                    </div>

                  </div>

                ),
              )}

            </div>

          </FormField>

        )}

      </div>

    </Modal>
  );
}

// =========================================================
// CREATE CUSTOMER
// =========================================================

function CreateCustomerModal({
  open,
  onClose,
  onSave,
  existingCustomers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    customer: PosCustomer,
  ) => void;
  existingCustomers: PosCustomer[];
}) {
  const [name, setName] =
    useState('');

  const [mobile, setMobile] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [
    familyMembers,
    setFamilyMembers,
  ] =
    useState<
      PosFamilyMember[]
    >([]);

  const [
    errors,
    setErrors,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const reset = () => {
    setName('');
    setMobile('');
    setEmail('');
    setFamilyMembers([]);
    setErrors({});
  };

  const validate = () => {
    const validationErrors: Record<
      string,
      string
    > = {};

    if (!name.trim()) {
      validationErrors.name =
        'Customer Name is required.';
    }

    if (!mobile.trim()) {
      validationErrors.mobile =
        'Mobile Number is required.';
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim(),
      )
    ) {
      validationErrors.email =
        'Email must use a valid format.';
    }

    setErrors(
      validationErrors,
    );

    return (
      Object.keys(
        validationErrors,
      ).length === 0
    );
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const code =
      'CUST' +
      String(
        Math.floor(
          Math.random() * 9000,
        ) + 1000,
      );

    onSave({
      id:
        'c' +
        Math.random()
          .toString(36)
          .slice(2),
      code,
      name:
        name.trim(),
      mobile:
        mobile.trim(),
      email:
        email.trim(),
      status:
        'Active',
      portalAccount:
        false,
      familyMembers,
    });

    reset();
  };

  return (
    <Modal
      open={
        open
      }
      onClose={() => {
        onClose();
        reset();
      }}
      title="Create Customer"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={
              handleSave
            }
          >
            Save Customer
          </button>
        </>
      }
    >

      <div className="space-y-4">

        <FormField
          label="Customer Name"
          required
          error={
            errors.name
          }
        >
          <TextInput
            value={
              name
            }
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
          />
        </FormField>

        <FormField
          label="Mobile Number"
          required
          error={
            errors.mobile
          }
        >
          <TextInput
            value={
              mobile
            }
            onChange={(event) =>
              setMobile(
                event.target.value,
              )
            }
          />
        </FormField>

        <FormField
          label="Email Address"
          error={
            errors.email
          }
        >
          <TextInput
            type="email"
            value={
              email
            }
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
          />
        </FormField>

        <div>

          <div className="mb-2 flex items-center justify-between">

            <label className="label mb-0">
              Family Members
            </label>

            <button
              type="button"
              onClick={() =>
                setFamilyMembers([
                  ...familyMembers,
                  {
                    name: '',
                    nakshatra: '',
                  },
                ])
              }
              className="btn-outline px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3" />

              Add Family Member
            </button>

          </div>

          {familyMembers.map(
            (
              member,
              index,
            ) => (

              <div
                key={
                  index
                }
                className="mb-2 flex gap-2"
              >

                <TextInput
                  value={
                    member.name
                  }
                  onChange={(event) =>
                    setFamilyMembers(
                      familyMembers.map(
                        (
                          item,
                          rowIndex,
                        ) =>
                          rowIndex ===
                          index
                            ? {
                                ...item,
                                name:
                                  event.target.value,
                              }
                            : item,
                      ),
                    )
                  }
                  placeholder="Family Member Name"
                />

                <div className="w-40">

                  <Dropdown
                    value={
                      member.nakshatra
                    }
                    onChange={(value) =>
                      setFamilyMembers(
                        familyMembers.map(
                          (
                            item,
                            rowIndex,
                          ) =>
                            rowIndex ===
                            index
                              ? {
                                  ...item,
                                  nakshatra:
                                    value,
                                }
                              : item,
                        ),
                      )
                    }
                    options={posNakshatras.map(
                      (
                        nakshatra,
                      ) => ({
                        label:
                          nakshatra.name,
                        value:
                          nakshatra.name,
                      }),
                    )}
                    placeholder="Nakshatra"
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFamilyMembers(
                      familyMembers.filter(
                        (
                          _,
                          rowIndex,
                        ) =>
                          rowIndex !==
                          index,
                      ),
                    )
                  }
                  className="rounded p-2 text-red-400 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>

              </div>

            ),
          )}

        </div>

      </div>

    </Modal>
  );
}

// =========================================================
// EDIT CUSTOMER
// =========================================================

function EditCustomerModal({
  open,
  customer,
  onClose,
  onSave,
}: {
  open: boolean;
  customer: PosCustomer | null;
  onClose: () => void;
  onSave: (
    customer: PosCustomer,
  ) => void;
}) {
  const [name, setName] =
    useState('');

  const [mobile, setMobile] =
    useState('');

  const [
    familyMembers,
    setFamilyMembers,
  ] =
    useState<
      PosFamilyMember[]
    >([]);

  useEffect(() => {
    if (customer) {
      setName(
        customer.name,
      );

      setMobile(
        customer.mobile,
      );

      setFamilyMembers(
        customer.familyMembers,
      );
    }
  }, [customer]);

  if (!customer) {
    return null;
  }

  return (
    <Modal
      open={
        open
      }
      onClose={
        onClose
      }
      title="Edit Customer"
      size="lg"
      footer={
        <>
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
            onClick={() =>
              onSave({
                ...customer,
                name,
                mobile,
                familyMembers,
              })
            }
          >
            Save
          </button>
        </>
      }
    >

      <div className="space-y-4">

        <FormField
          label="Customer Name"
          required
        >
          <TextInput
            value={
              name
            }
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
          />
        </FormField>

        <FormField
          label="Mobile Number"
          required
        >
          <TextInput
            value={
              mobile
            }
            onChange={(event) =>
              setMobile(
                event.target.value,
              )
            }
          />
        </FormField>

        <FormField label="Email Address">

          <TextInput
            value={
              customer.email
            }
            disabled={
              customer.portalAccount
            }
          />

        </FormField>

      </div>

    </Modal>
  );
}

// =========================================================
// PAYMENT MODAL
// SHARED BY POS AND ADMIN BOOKING
// =========================================================

export function PaymentModal({
  open,
  onClose,
  cart,
  totals,
  customer,
  posUser,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  cart: PosCartLine[];
  totals: {
    gross: number;
    gst: number;
    ledger: number;
    roundOff: number;
    payable: number;
  };
  customer: PosCustomer | null;
  posUser: any;
  onComplete: (
    txn: PosTransaction,
  ) => void;
}) {
  const toast =
    useToast();

  const [mode, setMode] =
    useState('Cash');

  const [
    cashReceived,
    setCashReceived,
  ] = useState(0);

  const [
    confirmCashOpen,
    setConfirmCashOpen,
  ] = useState(false);

  const [
    bankReference,
    setBankReference,
  ] = useState('');

  const [
    bankAmount,
    setBankAmount,
  ] = useState('');

  const [
    netsState,
    setNetsState,
  ] = useState<
    | 'Not Started'
    | 'Pending'
    | 'Successful'
    | 'Failed'
    | 'Cancelled'
  >('Not Started');

  const [
    paynowState,
    setPaynowState,
  ] = useState<
    | 'QR Generated'
    | 'Pending'
    | 'Successful'
    | 'Failed'
    | 'Expired'
    | 'Cancelled'
  >('QR Generated');

  const [
    paynowCountdown,
    setPaynowCountdown,
  ] = useState(120);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const change =
    Math.max(
      0,
      cashReceived -
        totals.payable,
    );

  useEffect(() => {
    if (
      mode === 'PayNow' &&
      paynowState ===
        'QR Generated'
    ) {
      const timer =
        setInterval(() => {
          setPaynowCountdown(
            (current) => {
              if (
                current <= 1
              ) {
                setPaynowState(
                  'Expired',
                );

                clearInterval(
                  timer,
                );

                return 0;
              }

              return current - 1;
            },
          );
        }, 1000);

      return () =>
        clearInterval(timer);
    }
  }, [
    mode,
    paynowState,
  ]);

  const generateTxn = (
    paymentRef: string,
    paidAmount: number,
    changeAmount: number,
  ): PosTransaction => {
    const now =
      new Date();

    const txnNo =
      'POS' +
      now
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '') +
      String(
        Math.floor(
          Math.random() * 999,
        ) + 1,
      ).padStart(3, '0');

    const receiptNo =
      'RCP' +
      String(
        Math.floor(
          Math.random() * 9999,
        ) + 1000,
      );

    return {
      id:
        't' +
        Math.random()
          .toString(36)
          .slice(2),

      txnNo,
      receiptNo,
      customer,

      customerName:
        customer?.name ??
        'Walk-in Customer',

      lines:
        cart,

      grossAmount:
        totals.gross,

      gstAmount:
        totals.gst,

      ledgerAmount:
        totals.ledger,

      roundOff:
        totals.roundOff,

      payableAmount:
        totals.payable,

      paymentMode:
        mode,

      paymentStatus:
        'Successful',

      txnStatus:
        'Completed',

      paidAmount,
      changeAmount,
      paymentRef,

      posUser:
        posUser.username,

      datetime:
        now.toISOString(),

      reprintCount:
        0,

      audit: [
        {
          action:
            'Transaction created',
          module:
            'POS',
          ref:
            txnNo,
          user:
            posUser.username,
          datetime:
            now.toISOString(),
        },
      ],
    };
  };

  const completePayment = (
    paymentRef: string,
    paidAmount: number,
    changeAmount: number,
  ) => {
    if (processing) {
      return;
    }

    setProcessing(
      true,
    );

    setTimeout(() => {
      onComplete(
        generateTxn(
          paymentRef,
          paidAmount,
          changeAmount,
        ),
      );

      setProcessing(
        false,
      );
    }, 800);
  };

  const handleCashConfirm = () => {
    setConfirmCashOpen(
      false,
    );

    completePayment(
      '-',
      cashReceived,
      change,
    );
  };

  const bankAmountValid =
    !!bankAmount &&
    Math.abs(
      Number(bankAmount) -
        totals.payable,
    ) <= 0.001;

  const handleBankTransferConfirm = () => {
    if (
      !bankReference.trim()
    ) {
      toast.error(
        'Required',
        'Transaction Reference Number is required.',
      );
      return;
    }

    const received =
      Number(
        bankAmount,
      );

    if (
      !bankAmount ||
      received <= 0
    ) {
      toast.error(
        'Required',
        'Amount Received is required.',
      );
      return;
    }

    if (
      !bankAmountValid
    ) {
      toast.error(
        'Invalid Amount',
        `Amount Received must be exactly ${formatSGD(
          totals.payable,
        )}.`,
      );
      return;
    }

    completePayment(
      bankReference.trim(),
      received,
      0,
    );
  };

  const handleNetsSuccess = () => {
    setNetsState(
      'Successful',
    );

    completePayment(
      'NETS' +
        Math.floor(
          Math.random() * 99999,
        ),
      totals.payable,
      0,
    );
  };

  const handlePaynowSuccess = () => {
    setPaynowState(
      'Successful',
    );

    completePayment(
      'PAYNOW' +
        Math.floor(
          Math.random() * 99999,
        ),
      totals.payable,
      0,
    );
  };

  const changePaymentMode = (
    newMode: string,
  ) => {
    setMode(
      newMode,
    );

    if (
      newMode ===
      'Bank Transfer'
    ) {
      setBankReference('');
      setBankAmount('');
    }
  };

  return (
    <>
      <Modal
        open={
          open
        }
        onClose={
          onClose
        }
        title="Payment"
        size="md"
        footer={
          <div className="flex gap-2">

            <button
              type="button"
              className="btn-outline flex-1"
              onClick={
                onClose
              }
            >
              Cancel Payment
            </button>

            {mode ===
              'Cash' && (

              <button
                type="button"
                onClick={() =>
                  setConfirmCashOpen(
                    true,
                  )
                }
                disabled={
                  cashReceived <
                    totals.payable ||
                  processing
                }
                className="btn-primary flex-1 py-2.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />

                Confirm Payment
              </button>

            )}

            {mode ===
              'Bank Transfer' && (

              <button
                type="button"
                onClick={
                  handleBankTransferConfirm
                }
                disabled={
                  processing ||
                  !bankReference.trim() ||
                  !bankAmountValid
                }
                className="btn-primary flex-1 py-2.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />

                Confirm Payment
              </button>

            )}

          </div>
        }
      >

        <div className="space-y-4">

          <div className="rounded-lg bg-cream-50 p-3">

            {customer && (

              <div className="flex justify-between text-sm">

                <span className="text-brown-500">
                  Customer
                </span>

                <span className="font-medium text-brown-800">
                  {customer.name}
                </span>

              </div>

            )}

            <div className="flex justify-between border-t border-brown-200 pt-1 text-base font-semibold text-brown-900">

              <span>
                Final Payable
              </span>

              <span>
                {formatSGD(
                  totals.payable,
                )}
              </span>

            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

            {[
              {
                label:
                  'Cash',
                value:
                  'Cash',
                icon:
                  Banknote,
              },
              {
                label:
                  'Bank Transfer',
                value:
                  'Bank Transfer',
                icon:
                  CreditCard,
              },
              {
                label:
                  'NETS',
                value:
                  'NETS',
                icon:
                  CreditCard,
              },
              {
                label:
                  'PayNow',
                value:
                  'PayNow',
                icon:
                  Smartphone,
              },
            ].map(
              (
                paymentMode,
              ) => {
                const Icon =
                  paymentMode.icon;

                return (

                  <button
                    key={
                      paymentMode.value
                    }
                    type="button"
                    onClick={() =>
                      changePaymentMode(
                        paymentMode.value,
                      )
                    }
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-4',

                      mode ===
                        paymentMode.value
                        ? 'border-maroon-500 bg-maroon-50'
                        : 'border-brown-100',
                    )}
                  >
                    <Icon className="h-6 w-6" />

                    <span className="text-center text-sm font-medium">
                      {paymentMode.label}
                    </span>
                  </button>

                );
              },
            )}

          </div>

          {mode ===
            'Cash' && (

            <div className="space-y-3">

              <FormField
                label="Amount Received"
                required
              >
                <TextInput
                  type="number"
                  step="0.01"
                  value={
                    cashReceived ||
                    ''
                  }
                  onChange={(event) =>
                    setCashReceived(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder="0.00"
                />
              </FormField>

              <div className="grid grid-cols-5 gap-2">

                {[
                  {
                    label:
                      'Exact',
                    value:
                      totals.payable,
                  },
                  {
                    label:
                      'S$10',
                    value:
                      10,
                  },
                  {
                    label:
                      'S$20',
                    value:
                      20,
                  },
                  {
                    label:
                      'S$50',
                    value:
                      50,
                  },
                  {
                    label:
                      'S$100',
                    value:
                      100,
                  },
                ].map(
                  (
                    amount,
                  ) => (

                    <button
                      key={
                        amount.label
                      }
                      type="button"
                      onClick={() =>
                        setCashReceived(
                          amount.value,
                        )
                      }
                      className="rounded-lg border border-brown-200 py-2 text-sm"
                    >
                      {amount.label}
                    </button>

                  ),
                )}

              </div>

              <div className="flex justify-between rounded-lg bg-cream-50 p-3 text-sm">

                <span>
                  Change Amount
                </span>

                <strong>
                  {formatSGD(
                    change,
                  )}
                </strong>

              </div>

            </div>

          )}

          {mode ===
            'Bank Transfer' && (

            <div className="space-y-4">

              <FormField
                label="Transaction Reference Number"
                required
              >
                <TextInput
                  value={
                    bankReference
                  }
                  onChange={(event) =>
                    setBankReference(
                      event.target.value,
                    )
                  }
                />
              </FormField>

              <FormField
                label="Amount Received"
                required
              >
                <TextInput
                  type="number"
                  value={
                    bankAmount
                  }
                  onChange={(event) =>
                    setBankAmount(
                      event.target.value,
                    )
                  }
                />
              </FormField>

              {bankAmount &&
                !bankAmountValid && (

                <p className="text-sm text-red-600">
                  Amount Received must be exactly{' '}
                  {formatSGD(
                    totals.payable,
                  )}
                  .
                </p>

              )}

            </div>

          )}

          {mode ===
            'NETS' && (

            <div className="space-y-3">

              <p className="rounded-lg bg-cream-50 p-4 text-center text-sm">
                {netsState ===
                  'Pending'
                  ? 'Waiting for NETS terminal confirmation...'
                  : 'Click Start Payment to begin NETS transaction.'}
              </p>

              {netsState ===
                'Not Started' && (

                <button
                  type="button"
                  onClick={() =>
                    setNetsState(
                      'Pending',
                    )
                  }
                  className="btn-primary w-full"
                >
                  Start Payment
                </button>

              )}

              {netsState ===
                'Pending' && (

                <button
                  type="button"
                  onClick={
                    handleNetsSuccess
                  }
                  className="btn-primary w-full"
                >
                  Simulate Success
                </button>

              )}

            </div>

          )}

          {mode ===
            'PayNow' && (

            <div className="space-y-3 text-center">

              <div className="rounded-lg bg-cream-50 p-4">

                <Smartphone className="mx-auto h-8 w-8" />

                <p>
                  PayNow QR
                </p>

                <strong>
                  {formatSGD(
                    totals.payable,
                  )}
                </strong>

                <p className="mt-2 text-xs">
                  {paynowCountdown}s remaining
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handlePaynowSuccess
                }
                className="btn-primary w-full"
              >
                Simulate Success
              </button>

            </div>

          )}

        </div>

      </Modal>

      <ConfirmModal
        open={
          confirmCashOpen
        }
        onClose={() =>
          setConfirmCashOpen(
            false,
          )
        }
        onConfirm={
          handleCashConfirm
        }
        title="Confirm Cash Payment"
        message={`Confirm cash payment of ${formatSGD(
          totals.payable,
        )}?`}
        confirmLabel="Confirm"
        cancelLabel="Back"
      />

    </>
  );
}

// =========================================================
// TRANSACTION PREVIEW
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

          <span>
            Total:{' '}
            <strong>
              {formatSGD(
                txn.payableAmount,
              )}
            </strong>
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

      <div className="space-y-3">

        <div className="rounded-lg bg-cream-50 p-3">

          <p>
            Transaction ID: {txn.txnNo}
          </p>

          <p>
            Date:{' '}
            {formatDateTime(
              txn.datetime,
            )}
          </p>

          <p>
            Customer: {txn.customerName}
          </p>

          <p>
            Payment Mode: {txn.paymentMode}
          </p>

        </div>

        {txn.lines.map(
          (
            line,
            index,
          ) => (

            <div
              key={
                index
              }
              className="rounded-lg border border-brown-50 p-2.5"
            >

              <div className="flex justify-between">

                <div>
                  <p className="font-medium">
                    {line.name}
                  </p>

                  <p className="text-xs">
                    Qty: {line.qty}
                  </p>
                </div>

                <strong>
                  {formatSGD(
                    line.grossAmount,
                  )}
                </strong>

              </div>

            </div>

          ),
        )}

      </div>

    </Modal>
  );
}

// =========================================================
// PAYMENT SUCCESS
// =========================================================

export function PaymentSuccessScreen({
  txn,
  onDone,
}: {
  txn: PosTransaction;
  onDone: () => void;
}) {
  const [
    countdown,
    setCountdown,
  ] = useState(5);

  useEffect(() => {
    const interval =
      setInterval(() => {
        setCountdown(
          (previous) => {
            if (
              previous <= 1
            ) {
              clearInterval(
                interval,
              );

              onDone();

              return 0;
            }

            return previous - 1;
          },
        );
      }, 1000);

    return () =>
      clearInterval(
        interval,
      );
  }, [onDone]);

  return (
    <div className="flex h-full items-center justify-center bg-cream-100 p-4">

      <div className="card w-full max-w-md p-8 text-center">

        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />

        <h2 className="mt-4 text-2xl font-bold">
          Payment Successful
        </h2>

        <div className="mt-6 rounded-lg bg-cream-50 p-4 text-left">

          <p>
            Receipt No: {txn.receiptNo}
          </p>

          <p>
            Transaction No: {txn.txnNo}
          </p>

          <p>
            Customer: {txn.customerName}
          </p>

          <p>
            Payment Mode: {txn.paymentMode}
          </p>

          {txn.paymentMode ===
            'Bank Transfer' &&
            txn.paymentRef && (

            <p>
              Transaction Reference:{' '}
              {txn.paymentRef}
            </p>

          )}

          <p className="mt-2 font-semibold">
            Total Paid:{' '}
            {formatSGD(
              txn.payableAmount,
            )}
          </p>

        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brown-400">

          <Loader2 className="h-3 w-3 animate-spin" />

          Redirecting in {countdown}s

        </div>

      </div>

    </div>
  );
}