import { useMemo, useState } from 'react';
import { Edit, Plus, Trash2, X } from 'lucide-react';

import {
  PageHeader,
  StatusBadge,
} from '@/components/ui/StatusBadge';

import {
  DataTable,
  type Column,
} from '@/components/ui/DataTable';

import {
  SearchFilterBar,
  type FilterOption,
} from '@/components/ui/SearchFilterBar';

import { Pagination } from '@/components/ui/Pagination';

import {
  ConfirmModal,
  Modal,
} from '@/components/ui/Modal';

import {
  Dropdown,
  FormField,
  MultiSelect,
  RadioGroup,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui/Form';

import { useToast } from '@/components/ui/Toast';

import {
  categories,
  deities,
  events as initial,
  subCategories,
  type EventMaster,
  type EventSlot,
} from '@/lib/mockData';

import {
  formatDate,
  formatSGD,
} from '@/lib/utils';

const PAGE_SIZE = 5;

const statusOptions: FilterOption[] = [
  {
    label: 'All Status',
    value: '',
  },
  {
    label: 'Active',
    value: 'Active',
  },
  {
    label: 'Inactive',
    value: 'Inactive',
  },
];

const gstOptions = [
  {
    label: 'Applicable',
    value: 'Applicable',
  },
  {
    label: 'Exempted',
    value: 'Exempted',
  },
  {
    label: 'Out of Scope',
    value: 'Out of Scope',
  },
];

const yesNoOptions = [
  {
    label: 'Yes',
    value: 'Yes',
  },
  {
    label: 'No',
    value: 'No',
  },
];

export function EventMasterPage() {
  const toast = useToast();

  const [data, setData] =
    useState<EventMaster[]>(initial);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [page, setPage] =
    useState(1);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<EventMaster | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<EventMaster | null>(null);

  const [form, setForm] =
    useState<Partial<EventMaster>>({});

  const [status, setStatus] =
    useState('Active');

  const [slots, setSlots] =
    useState<EventSlot[]>([]);

  const filtered = useMemo(
    () =>
      data.filter(
        (event) =>
          (
            !search ||
            event.name
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            event.eventCode
              .toLowerCase()
              .includes(search.toLowerCase())
          ) &&
          (
            !statusFilter ||
            event.status === statusFilter
          ),
      ),
    [
      data,
      search,
      statusFilter,
    ],
  );

  const paged = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalPages =
    Math.ceil(filtered.length / PAGE_SIZE);

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------

  const openCreate = () => {
    setEditing(null);

    setForm({
      gstClass: 'Applicable',

      // Default YES
      slotRequired: true,

      posVisibility: true,
      portalVisibility: true,
      deities: [],
      displayOrder: 1,
    });

    setStatus('Active');
    setSlots([]);
    setModalOpen(true);
  };

  // ---------------------------------------------------------
  // EDIT
  // ---------------------------------------------------------

  const openEdit = (
    event: EventMaster,
  ) => {
    setEditing(event);

    setForm(event);

    setStatus(event.status);

    setSlots(event.slots ?? []);

    setModalOpen(true);
  };

  // ---------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------

  const handleSave = () => {
    if (!form.eventCode?.trim()) {
      toast.error(
        'Required',
        'Event code is required.',
      );

      return;
    }

    if (!form.name?.trim()) {
      toast.error(
        'Required',
        'Event name is required.',
      );

      return;
    }

    if (!form.startDate) {
      toast.error(
        'Required',
        'Start date is required.',
      );

      return;
    }

    if (!form.endDate) {
      toast.error(
        'Required',
        'End date is required.',
      );

      return;
    }

    if (
      form.startDate > form.endDate
    ) {
      toast.error(
        'Invalid Date',
        'End date cannot be earlier than Start date.',
      );

      return;
    }

    // Validate slots
    if (form.slotRequired) {
      if (slots.length === 0) {
        toast.error(
          'Required',
          'At least one slot is required.',
        );

        return;
      }

      for (
        let index = 0;
        index < slots.length;
        index++
      ) {
        const slot = slots[index];

        if (!slot.slotName?.trim()) {
          toast.error(
            'Required',
            `Slot Name is required for row ${index + 1}.`,
          );

          return;
        }

        if (!slot.slotDate) {
          toast.error(
            'Required',
            `Slot Date is required for row ${index + 1}.`,
          );

          return;
        }

        if (
          slot.slotDate <
            form.startDate ||
          slot.slotDate >
            form.endDate
        ) {
          toast.error(
            'Invalid Slot Date',
            `Slot Date in row ${index + 1} must be between Event Start Date and End Date.`,
          );

          return;
        }

        if (!slot.startTime) {
          toast.error(
            'Required',
            `Start Time is required for row ${index + 1}.`,
          );

          return;
        }

        if (!slot.endTime) {
          toast.error(
            'Required',
            `End Time is required for row ${index + 1}.`,
          );

          return;
        }

        if (
          slot.endTime <=
          slot.startTime
        ) {
          toast.error(
            'Invalid Time',
            `End Time must be later than Start Time in row ${index + 1}.`,
          );

          return;
        }

        if (
          !slot.seats ||
          slot.seats <= 0
        ) {
          toast.error(
            'Required',
            `No. of Seats must be greater than 0 in row ${index + 1}.`,
          );

          return;
        }
      }
    }

    const saved = {
      ...form,
      status,

      slots:
        form.slotRequired
          ? slots
          : [],
    };

    if (editing) {
      setData((previous) =>
        previous.map((event) =>
          event.id === editing.id
            ? {
                ...event,
                ...saved,
              }
            : event,
        ),
      );

      toast.success(
        'Event updated',
      );
    } else {
      setData((previous) => [
        {
          id:
            'ev' +
            Math.random()
              .toString(36)
              .slice(2),

          ...saved,
        } as EventMaster,

        ...previous,
      ]);

      toast.success(
        'Event created',
      );
    }

    setModalOpen(false);
  };

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setData((previous) =>
      previous.filter(
        (event) =>
          event.id !==
          deleteTarget.id,
      ),
    );

    toast.success(
      'Event deleted',
    );

    setDeleteTarget(null);
  };

  // ---------------------------------------------------------
  // SLOT
  // ---------------------------------------------------------

  const addSlot = () => {
    if (
      !form.startDate ||
      !form.endDate
    ) {
      toast.error(
        'Required',
        'Please select Event Start Date and End Date before adding a slot.',
      );

      return;
    }

    setSlots((previous) => [
      ...previous,

      {
        slotName: '',
        slotDate:
          form.startDate,
        startTime: '',
        endTime: '',
        seats: 0,
        status: 'Active',
      } as EventSlot,
    ]);
  };

  const removeSlot = (
    index: number,
  ) => {
    setSlots((previous) =>
      previous.filter(
        (_, rowIndex) =>
          rowIndex !== index,
      ),
    );
  };

  const updateSlot = (
    index: number,
    field: keyof EventSlot,
    value: string | number,
  ) => {
    setSlots((previous) =>
      previous.map(
        (slot, rowIndex) =>
          rowIndex === index
            ? {
                ...slot,
                [field]: value,
              }
            : slot,
      ),
    );
  };

  // ---------------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------------

  const columns: Column<EventMaster>[] = [
    {
      key: 'eventCode',
      header: 'Event Code',

      render: (event) => (
        <span className="font-medium text-maroon-700">
          {event.eventCode}
        </span>
      ),
    },

    {
      key: 'name',
      header: 'Event Name',
    },

    {
      key: 'tamilName',
      header: 'Tamil Name',
    },

    {
      key: 'category',
      header: 'Category',
    },

    {
      key: 'salePrice',
      header: 'Sale Price',
      align: 'right',

      render: (event) =>
        formatSGD(
          event.salePrice,
        ),
    },

    {
      key: 'startDate',
      header: 'Start Date',
      align: 'center',

      render: (event) =>
        formatDate(
          event.startDate,
        ),
    },

    {
      key: 'endDate',
      header: 'End Date',
      align: 'center',

      render: (event) =>
        formatDate(
          event.endDate,
        ),
    },

    {
      key: 'slotRequired',
      header: 'Slots',
      align: 'center',

      render: (event) =>
        event.slotRequired ? (
          <StatusBadge
            status="Yes"
            variant="info"
          />
        ) : (
          <StatusBadge
            status="No"
            variant="neutral"
          />
        ),
    },

    {
      key: 'posVisibility',
      header: 'POS',
      align: 'center',

      render: (event) =>
        event.posVisibility ? (
          <StatusBadge
            status="Yes"
            variant="info"
          />
        ) : (
          <StatusBadge
            status="No"
            variant="neutral"
          />
        ),
    },

    {
      key: 'portalVisibility',
      header: 'Portal',
      align: 'center',

      render: (event) =>
        event.portalVisibility ? (
          <StatusBadge
            status="Yes"
            variant="info"
          />
        ) : (
          <StatusBadge
            status="No"
            variant="neutral"
          />
        ),
    },

    {
      key: 'status',
      header: 'Status',

      render: (event) => (
        <StatusBadge
          status={event.status}
        />
      ),
    },

    {
      key: 'actions',
      header: 'Actions',
      align: 'center',

      render: (event) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() =>
              openEdit(event)
            }
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setDeleteTarget(
                event,
              )
            }
            className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Event Master"
        description="Manage temple events for POS and Customer Portal"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={
              openCreate
            }
          >
            <Plus className="h-4 w-4" />

            Add Event
          </button>
        }
      />

      {/* SEARCH */}

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filters={[
            {
              label:
                'Status',

              value:
                statusFilter,

              options:
                statusOptions,

              onChange: (
                value,
              ) => {
                setStatusFilter(
                  value,
                );

                setPage(1);
              },
            },
          ]}
        />
      </div>

      {/* EVENT LIST */}

      <div className="card mt-4">
        <DataTable
          columns={columns}
          data={paged}
        />

        <Pagination
          page={page}
          totalPages={
            totalPages
          }
          onPage={setPage}
          totalItems={
            filtered.length
          }
          pageSize={
            PAGE_SIZE
          }
        />
      </div>

      {/* ================================================= */}
      {/* ADD / EDIT EVENT MODAL */}
      {/* ================================================= */}

      <Modal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        title={
          editing
            ? 'Edit Event'
            : 'Add Event'
        }
        size="xl"
        footer={
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() =>
                setModalOpen(
                  false,
                )
              }
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
              Save
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* BASIC DETAILS */}

          <FormField
            label="Event Code"
            required
          >
            <TextInput
              value={
                form.eventCode ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  eventCode:
                    event.target
                      .value,
                })
              }
            />
          </FormField>

          <FormField
            label="Event Name"
            required
          >
            <TextInput
              value={
                form.name ?? ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  name:
                    event.target
                      .value,
                })
              }
            />
          </FormField>

          <FormField label="Tamil Name">
            <TextInput
              value={
                form.tamilName ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  tamilName:
                    event.target
                      .value,
                })
              }
            />
          </FormField>

          <FormField
            label="Description"
            className="sm:col-span-2 lg:col-span-3"
          >
            <TextArea
              value={
                form.description ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  description:
                    event.target
                      .value,
                })
              }
            />
          </FormField>

          {/* CATEGORY */}

          <FormField
            label="Category"
            required
          >
            <Dropdown
              value={
                form.category ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  category:
                    value,

                  subCategory:
                    '',
                })
              }
              options={categories.map(
                (category) => ({
                  label:
                    category.name,

                  value:
                    category.name,
                }),
              )}
              placeholder="Select Category"
            />
          </FormField>

          <FormField label="Sub Category">
            <Dropdown
              value={
                form.subCategory ??
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  subCategory:
                    value,
                })
              }
              options={subCategories
                .filter(
                  (
                    subCategory,
                  ) =>
                    subCategory.category ===
                    form.category,
                )
                .map(
                  (
                    subCategory,
                  ) => ({
                    label:
                      subCategory.name,

                    value:
                      subCategory.name,
                  }),
                )}
              placeholder="Select Sub Category"
            />
          </FormField>

          <FormField label="Deity Mapping">
            <MultiSelect
              values={
                form.deities ?? []
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  deities:
                    value,
                })
              }
              options={deities.map(
                (deity) => ({
                  label: `${deity.name} (${deity.tamilName})`,

                  value:
                    deity.name,
                }),
              )}
              placeholder="Select deities"
            />
          </FormField>

          {/* DATE */}

          <FormField
            label="Start Date"
            required
          >
            <TextInput
              type="date"
              value={
                form.startDate ??
                ''
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setForm({
                  ...form,

                  startDate:
                    value,
                });
              }}
            />
          </FormField>

          <FormField
            label="End Date"
            required
          >
            <TextInput
              type="date"
              min={
                form.startDate ??
                ''
              }
              value={
                form.endDate ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  endDate:
                    event.target
                      .value,
                })
              }
            />
          </FormField>

          {/* SLOT REQUIRED */}

          <FormField
            label="Slot Required"
            required
          >
            <RadioGroup
              value={
                form.slotRequired
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  slotRequired:
                    value ===
                    'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* SALE PRICE */}

          <FormField
            label="Sale Price (GST Inclusive)"
            required
          >
            <TextInput
              type="number"
              step="0.01"
              value={
                form.salePrice ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  salePrice:
                    Number(
                      event.target
                        .value,
                    ),
                })
              }
            />
          </FormField>

          {/* GST */}

          <FormField
            label="GST Classification"
            required
          >
            <RadioGroup
              value={
                form.gstClass ??
                'Applicable'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  gstClass:
                    value,
                })
              }
              options={
                gstOptions
              }
            />
          </FormField>

          {/* DISPLAY ORDER */}

          <FormField label="Display Order">
            <TextInput
              type="number"
              value={
                form.displayOrder ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  displayOrder:
                    Number(
                      event.target
                        .value,
                    ),
                })
              }
            />
          </FormField>

          {/* VISIBILITY */}

          <FormField label="POS Visibility">
            <RadioGroup
              value={
                form.posVisibility
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  posVisibility:
                    value ===
                    'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          <FormField label="Customer Portal Visibility">
            <RadioGroup
              value={
                form.portalVisibility
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  portalVisibility:
                    value ===
                    'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* STATUS */}

          <FormField label="Status">
            <div className="pt-1">
              <Toggle
                checked={
                  status ===
                  'Active'
                }
                onChange={(value) =>
                  setStatus(
                    value
                      ? 'Active'
                      : 'Inactive',
                  )
                }
                label={
                  status
                }
              />
            </div>
          </FormField>

          {/* ================================================= */}
          {/* SLOT DETAILS */}
          {/* ================================================= */}

          {form.slotRequired && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="label mb-0">
                    Slot Details
                  </label>

                  <p className="mt-1 text-xs text-brown-400">
                    Slot Date must be between Event Start Date and End Date.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addSlot
                  }
                  disabled={
                    !form.startDate ||
                    !form.endDate
                  }
                  className="btn-outline px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />

                  Add Slot
                </button>
              </div>

              {!form.startDate ||
              !form.endDate ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                  Please select Event Start Date and End Date before adding slots.
                </div>
              ) : slots.length ===
                0 ? (
                <div className="rounded-lg border border-dashed border-brown-200 p-4 text-center text-sm text-brown-400">
                  No slots added. Click "Add Slot" to create time slots.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[950px] space-y-2">

                    {/* SLOT HEADER */}

                    <div className="grid grid-cols-[1.4fr_1.25fr_1fr_1fr_1fr_1fr_50px] gap-2 px-3 text-xs font-medium text-brown-500">
                      <span>
                        Slot Name
                      </span>

                      <span>
                        Slot Date
                      </span>

                      <span>
                        Start Time
                      </span>

                      <span>
                        End Time
                      </span>

                      <span>
                        No. of Seats
                      </span>

                      <span>
                        Status
                      </span>

                      <span />
                    </div>

                    {/* SLOT ROWS */}

                    {slots.map(
                      (
                        slot,
                        index,
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="grid grid-cols-[1.4fr_1.25fr_1fr_1fr_1fr_1fr_50px] gap-2 rounded-lg border border-brown-100 p-3"
                        >
                          {/* SLOT NAME */}

                          <TextInput
                            value={
                              slot.slotName ??
                              ''
                            }
                            onChange={(event) =>
                              updateSlot(
                                index,
                                'slotName',
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Slot Name"
                          />

                          {/* SLOT DATE */}

                          <TextInput
                            type="date"
                            value={
                              slot.slotDate ??
                              ''
                            }
                            min={
                              form.startDate ??
                              ''
                            }
                            max={
                              form.endDate ??
                              ''
                            }
                            onChange={(event) =>
                              updateSlot(
                                index,
                                'slotDate',
                                event.target
                                  .value,
                              )
                            }
                          />

                          {/* START TIME */}

                          <TextInput
                            type="time"
                            value={
                              slot.startTime ??
                              ''
                            }
                            onChange={(event) =>
                              updateSlot(
                                index,
                                'startTime',
                                event.target
                                  .value,
                              )
                            }
                          />

                          {/* END TIME */}

                          <TextInput
                            type="time"
                            value={
                              slot.endTime ??
                              ''
                            }
                            onChange={(event) =>
                              updateSlot(
                                index,
                                'endTime',
                                event.target
                                  .value,
                              )
                            }
                          />

                          {/* SEATS */}

                          <TextInput
                            type="number"
                            min="1"
                            value={
                              slot.seats ??
                              0
                            }
                            onChange={(event) =>
                              updateSlot(
                                index,
                                'seats',
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                            placeholder="Seats"
                          />

                          {/* STATUS */}

                          <Dropdown
                            value={
                              slot.status
                            }
                            onChange={(value) =>
                              updateSlot(
                                index,
                                'status',
                                value,
                              )
                            }
                            options={[
                              {
                                label:
                                  'Active',

                                value:
                                  'Active',
                              },

                              {
                                label:
                                  'Inactive',

                                value:
                                  'Inactive',
                              },
                            ]}
                            placeholder="Status"
                          />

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              removeSlot(
                                index,
                              )
                            }
                            className="flex items-center justify-center rounded p-2 text-red-500 hover:bg-red-50"
                            title="Remove Slot"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* DELETE CONFIRM */}

      <ConfirmModal
        open={
          !!deleteTarget
        }
        onClose={() =>
          setDeleteTarget(null)
        }
        onConfirm={
          handleDelete
        }
        title="Delete Event"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}