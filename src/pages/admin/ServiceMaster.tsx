import { useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  X,
} from 'lucide-react';

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
  Modal,
  ConfirmModal,
} from '@/components/ui/Modal';

import {
  FormField,
  TextInput,
  TextArea,
  Dropdown,
  MultiSelect,
  Toggle,
  RadioGroup,
} from '@/components/ui/Form';

import { useToast } from '@/components/ui/Toast';

import {
  services as initial,
  categories,
  subCategories,
  deities,
  printingGroups,
  glRecords,
  type Service,
} from '@/lib/mockData';

import { formatSGD } from '@/lib/utils';

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

interface CatRow {
  category: string;
  subCategory: string;
  salePrice: number;
  displayOrder: number;
  mapping: string;
}

export function ServiceMaster() {
  const toast = useToast();

  const [data, setData] =
    useState<Service[]>(initial);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [page, setPage] =
    useState(1);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Service | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Service | null>(null);

  const [form, setForm] =
    useState<Partial<Service>>({});

  const [status, setStatus] =
    useState('Active');

  const [catRows, setCatRows] =
    useState<CatRow[]>([]);

  const filtered = useMemo(
    () =>
      data.filter(
        (service) =>
          (
            !search ||
            service.name
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            service.code
              .toLowerCase()
              .includes(search.toLowerCase())
          ) &&
          (
            !statusFilter ||
            service.status === statusFilter
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

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE,
  );

  /*
   * ADD NEW SERVICE
   *
   * Default requirements:
   * Family Members Required = Yes
   * Inventory Applicable = Yes
   * Threshold = 0
   */
  const openCreate = () => {
    setEditing(null);

    setForm({
      familyMembersRequired: true,
      maxFamilyMembers: 2,

      sessionRequired: false,

      inventoryApplicable: true,
      threshold: 0,

      posAvailability: true,
      portalAvailability: true,

      deities: [],
      deityMappingRequired: false,

      glCode: '',
    });

    setStatus('Active');
    setCatRows([]);
    setModalOpen(true);
  };

  /*
   * EDIT SERVICE
   */
  const openEdit = (service: Service) => {
    setEditing(service);

    setForm({
      ...service,

      /*
       * Existing old records may not have threshold.
       * In that situation default it to 0.
       */
      threshold:
        service.threshold ?? 0,
    });

    setStatus(service.status);

    setCatRows(
      (service.categories ?? []).map(
        (category) => ({
          category: category.category,
          subCategory:
            category.subCategory ?? '',
          salePrice:
            category.salePrice,
          displayOrder:
            category.displayOrder,
          mapping:
            category.mapping,
        }),
      ),
    );

    setModalOpen(true);
  };

  /*
   * SAVE
   */
  const handleSave = () => {
    const saved = {
      ...form,

      /*
       * If inventory is not applicable,
       * threshold must remain 0.
       */
      threshold:
        form.inventoryApplicable
          ? Number(form.threshold ?? 0)
          : 0,

      status,
      categories: catRows,
    };

    if (editing) {
      setData((previous) =>
        previous.map((service) =>
          service.id === editing.id
            ? {
                ...service,
                ...saved,
              }
            : service,
        ),
      );

      toast.success(
        'Service updated',
      );
    } else {
      setData((previous) => [
        {
          id:
            's' +
            Math.random()
              .toString(36)
              .slice(2),

          ...saved,
        } as Service,

        ...previous,
      ]);

      toast.success(
        'Service created',
      );
    }

    setModalOpen(false);
  };

  /*
   * DELETE
   */
  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setData((previous) =>
      previous.filter(
        (service) =>
          service.id !==
          deleteTarget.id,
      ),
    );

    toast.success(
      'Service deleted',
    );

    setDeleteTarget(null);
  };

  /*
   * CATEGORY ROW
   */
  const addCatRow = () => {
    setCatRows((previous) => [
      ...previous,
      {
        category: '',
        subCategory: '',
        salePrice: 0,
        displayOrder:
          previous.length + 1,
        mapping: 'Active',
      },
    ]);
  };

  const removeCatRow = (
    index: number,
  ) => {
    setCatRows((previous) =>
      previous.filter(
        (_, rowIndex) =>
          rowIndex !== index,
      ),
    );
  };

  const updateCatRow = (
    index: number,
    field: keyof CatRow,
    value: string | number,
  ) => {
    setCatRows((previous) =>
      previous.map(
        (row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                [field]: value,
              }
            : row,
      ),
    );
  };

  /*
   * TABLE
   */
  const columns: Column<Service>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (service) => (
        <span className="font-medium text-maroon-700">
          {service.code}
        </span>
      ),
    },

    {
      key: 'name',
      header: 'Service Name',
    },

    {
      key: 'tamilName',
      header: 'Tamil Name',
    },

    {
      key: 'salePrice',
      header: 'Sale Price',
      align: 'right',
      render: (service) =>
        formatSGD(
          service.salePrice,
        ),
    },

    {
      key: 'glCode',
      header: 'GL Account',
      render: (service) => {
        const gl =
          glRecords.find(
            (record) =>
              record.glCode ===
              service.glCode,
          );

        return gl
          ? `${gl.glCode} - ${gl.glName}`
          : '—';
      },
    },

    {
      key: 'posAvailability',
      header: 'POS',
      align: 'center',
      render: (service) =>
        service.posAvailability ? (
          <StatusBadge
            status="Yes"
            variant="success"
          />
        ) : (
          <StatusBadge
            status="No"
            variant="neutral"
          />
        ),
    },

    {
      key: 'portalAvailability',
      header: 'Portal',
      align: 'center',
      render: (service) =>
        service.portalAvailability ? (
          <StatusBadge
            status="Yes"
            variant="success"
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
      render: (service) => (
        <StatusBadge
          status={service.status}
        />
      ),
    },

    {
      key: 'actions',
      header: 'Actions',
      align: 'center',

      render: (service) => (
        <div className="flex justify-center gap-1">
          <button
            onClick={() =>
              openEdit(service)
            }
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={() =>
              setDeleteTarget(service)
            }
            className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Master"
        description="Manage temple services and sevas"
        actions={
          <button
            className="btn-primary"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        }
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filters={[
            {
              label: 'Status',
              value: statusFilter,
              options:
                statusOptions,

              onChange: (value) => {
                setStatusFilter(
                  value,
                );

                setPage(1);
              },
            },
          ]}
        />
      </div>

      <div className="card mt-4">
        <DataTable
          columns={columns}
          data={paged}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          totalItems={
            filtered.length
          }
          pageSize={PAGE_SIZE}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        title={
          editing
            ? 'Edit Service'
            : 'Add Service'
        }
        size="xl"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() =>
                setModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
            >
              Save
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* SERVICE CODE */}
          <FormField
            label="Service Code"
            required
          >
            <TextInput
              value={
                form.code ?? ''
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  code:
                    event.target.value,
                })
              }
            />
          </FormField>

          {/* SERVICE NAME */}
          <FormField
            label="Service Name"
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
                    event.target.value,
                })
              }
            />
          </FormField>

          {/* TAMIL NAME */}
          <FormField
            label="Tamil Name"
          >
            <TextInput
              value={
                form.tamilName ?? ''
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  tamilName:
                    event.target.value,
                })
              }
            />
          </FormField>

          {/* DESCRIPTION */}
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
                    event.target.value,
                })
              }
            />
          </FormField>

          {/* DEITY MAPPING REQUIRED */}
          <FormField
            label="Deity Mapping Required"
            required
          >
            <RadioGroup
              value={
                form.deityMappingRequired
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  deityMappingRequired:
                    value === 'Yes',

                  deities:
                    value === 'No'
                      ? []
                      : form.deities,
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* DEITY / PRINTING GROUP */}
          {form.deityMappingRequired ? (
            <FormField
              label="Deity Mapping"
              required
              className="sm:col-span-2"
            >
              <MultiSelect
                values={
                  form.deities ?? []
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    deities: value,
                  })
                }
                options={deities
                  .filter(
                    (deity) =>
                      deity.status ===
                      'Active',
                  )
                  .map((deity) => ({
                    label: `${deity.name} (${deity.tamilName})`,
                    value:
                      deity.name,
                  }))}
                placeholder="Select deities"
              />
            </FormField>
          ) : (
            <FormField
              label="Printing Group"
              required
            >
              <Dropdown
                value={
                  form.printingGroup ??
                  ''
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    printingGroup:
                      value,
                  })
                }
                options={printingGroups
                  .filter(
                    (group) =>
                      group.status ===
                      'Active',
                  )
                  .map((group) => ({
                    label:
                      group.name,
                    value:
                      group.name,
                  }))}
                placeholder="Select Printing Group"
              />
            </FormField>
          )}

          {/* CATEGORY DETAILS */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">
                Category Details
              </label>

              <button
                type="button"
                onClick={addCatRow}
                className="btn-outline px-3 py-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Row
              </button>
            </div>

            {catRows.length ===
            0 ? (
              <div className="rounded-lg border border-dashed border-brown-200 p-4 text-center text-sm text-brown-400">
                No category rows
                added. Click "Add
                Row" to add
                categories.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 px-3 text-xs font-medium text-brown-500 sm:grid-cols-5">
                  <span>
                    Category
                  </span>

                  <span>
                    Sub Category
                  </span>

                  <span>
                    Sale Price
                  </span>

                  <span>
                    Display Order
                  </span>

                  <span></span>
                </div>

                {catRows.map(
                  (row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-brown-100 p-3 sm:grid-cols-5"
                    >
                      <Dropdown
                        value={
                          row.category
                        }
                        onChange={(
                          value,
                        ) => {
                          updateCatRow(
                            index,
                            'category',
                            value,
                          );

                          updateCatRow(
                            index,
                            'subCategory',
                            '',
                          );
                        }}
                        options={categories
                          .filter(
                            (
                              category,
                            ) =>
                              category.status ===
                              'Active',
                          )
                          .map(
                            (
                              category,
                            ) => ({
                              label:
                                category.name,
                              value:
                                category.name,
                            }),
                          )}
                        placeholder="Category"
                      />

                      <Dropdown
                        value={
                          row.subCategory
                        }
                        onChange={(
                          value,
                        ) =>
                          updateCatRow(
                            index,
                            'subCategory',
                            value,
                          )
                        }
                        options={subCategories
                          .filter(
                            (
                              subCategory,
                            ) =>
                              subCategory.category ===
                                row.category &&
                              subCategory.status ===
                                'Active',
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
                        placeholder="Sub Category"
                      />

                      <TextInput
                        type="number"
                        step="0.01"
                        value={
                          row.salePrice
                        }
                        onChange={(
                          event,
                        ) =>
                          updateCatRow(
                            index,
                            'salePrice',
                            Number(
                              event
                                .target
                                .value,
                            ),
                          )
                        }
                        placeholder="Sale Price"
                      />

                      <TextInput
                        type="number"
                        value={
                          row.displayOrder
                        }
                        onChange={(
                          event,
                        ) =>
                          updateCatRow(
                            index,
                            'displayOrder',
                            Number(
                              event
                                .target
                                .value,
                            ),
                          )
                        }
                        placeholder="Display Order"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeCatRow(
                            index,
                          )
                        }
                        className="flex items-center justify-center rounded p-2 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* GENERAL LEDGER */}
          <FormField
            label="General Ledger (GL)"
            required
            hint="GST is derived from the selected GL account"
          >
            <Dropdown
              value={
                form.glCode ?? ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  glCode: value,
                })
              }
              options={glRecords
                .filter(
                  (gl) =>
                    gl.status ===
                    'Active',
                )
                .map((gl) => ({
                  label: `${gl.glCode} - ${gl.glName}`,
                  value:
                    gl.glCode,
                }))}
              placeholder="Select GL Account"
            />
          </FormField>

          {/* FAMILY MEMBERS REQUIRED */}
          <FormField
            label="Family Members Required"
            required
          >
            <RadioGroup
              value={
                form.familyMembersRequired
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  familyMembersRequired:
                    value === 'Yes',

                  maxFamilyMembers:
                    value === 'Yes'
                      ? form.maxFamilyMembers ??
                        2
                      : 0,
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* MAX FAMILY MEMBERS */}
          {form.familyMembersRequired && (
            <FormField
              label="Maximum Family Members"
            >
              <TextInput
                type="number"
                min="1"
                value={
                  form.maxFamilyMembers ??
                  2
                }
                onChange={(event) =>
                  setForm({
                    ...form,

                    maxFamilyMembers:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
              />
            </FormField>
          )}

          {/* SESSION REQUIRED */}
          <FormField
            label="Session Required"
          >
            <RadioGroup
              value={
                form.sessionRequired
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  sessionRequired:
                    value === 'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* INVENTORY APPLICABLE */}
          <FormField
            label="Inventory Applicable"
            required
          >
            <RadioGroup
              value={
                form.inventoryApplicable
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  inventoryApplicable:
                    value === 'Yes',

                  /*
                   * Yes:
                   * Keep existing threshold
                   * or default to 0.
                   *
                   * No:
                   * Reset threshold to 0.
                   */
                  threshold:
                    value === 'Yes'
                      ? form.threshold ??
                        0
                      : 0,
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* THRESHOLD */}
          {form.inventoryApplicable && (
            <FormField
              label="Threshold"
              required
              hint="Minimum stock level before low stock warning"
            >
              <TextInput
                type="number"
                min="0"
                value={
                  form.threshold ??
                  0
                }
                onChange={(event) => {
                  const value =
                    Number(
                      event.target
                        .value,
                    );

                  setForm({
                    ...form,

                    threshold:
                      value < 0
                        ? 0
                        : value,
                  });
                }}
              />
            </FormField>
          )}

          {/* FUTURE BOOKING CUT OFF */}
          <FormField
            label="Future Booking Cut off Date"
          >
            <TextInput
              type="date"
              value={
                form.bookingUpTo ??
                ''
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  bookingUpTo:
                    event.target.value,
                })
              }
            />
          </FormField>

          {/* POS AVAILABILITY */}
          <FormField
            label="POS Availability"
          >
            <RadioGroup
              value={
                form.posAvailability
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  posAvailability:
                    value === 'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* PORTAL AVAILABILITY */}
          <FormField
            label="Customer Portal Availability"
          >
            <RadioGroup
              value={
                form.portalAvailability
                  ? 'Yes'
                  : 'No'
              }
              onChange={(value) =>
                setForm({
                  ...form,

                  portalAvailability:
                    value === 'Yes',
                })
              }
              options={
                yesNoOptions
              }
            />
          </FormField>

          {/* STATUS */}
          <FormField
            label="Status"
          >
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
                label={status}
              />
            </div>
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}