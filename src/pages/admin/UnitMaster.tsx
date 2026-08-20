import { useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
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
  Toggle,
} from '@/components/ui/Form';

import { useToast } from '@/components/ui/Toast';

import {
  unitRecords as initial,
  type UnitMasterRecord,
} from '@/lib/mockData';

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

export function UnitMaster() {
  const toast = useToast();

  const [
    data,
    setData,
  ] = useState<UnitMasterRecord[]>(
    initial,
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<UnitMasterRecord | null>(
      null,
    );

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<UnitMasterRecord | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<
      Partial<UnitMasterRecord>
    >({});

  const [
    status,
    setStatus,
  ] = useState<
    'Active' | 'Inactive'
  >('Active');

  // =========================================================
  // FILTER
  // =========================================================

  const filtered =
    useMemo(() => {
      return data.filter(
        (record) => {
          const query =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !query ||
            record.name
              .toLowerCase()
              .includes(query) ||
            record.code
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            !statusFilter ||
            record.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      data,
      search,
      statusFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          PAGE_SIZE,
      ),
    );

  const paged =
    filtered.slice(
      (page - 1) *
        PAGE_SIZE,
      page * PAGE_SIZE,
    );

  // =========================================================
  // CREATE / EDIT
  // =========================================================

  const openCreate = () => {
    setEditing(null);

    setForm({
      code: '',
      name: '',
      description: '',
    });

    setStatus(
      'Active',
    );

    setModalOpen(
      true,
    );
  };

  const openEdit = (
    record: UnitMasterRecord,
  ) => {
    setEditing(
      record,
    );

    setForm(
      record,
    );

    setStatus(
      record.status,
    );

    setModalOpen(
      true,
    );
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = () => {
    const code =
      form.code
        ?.trim()
        .toUpperCase() ??
      '';

    const name =
      form.name?.trim() ??
      '';

    if (!code) {
      toast.error(
        'Validation Error',
        'Unit Code is required.',
      );

      return;
    }
    if (!name) {
      toast.error(
        'Validation Error',
        'Unit Name is required.',
      );

      return;
    }
    const duplicateCode =
      data.some(
        (record) =>
          record.code
            .toLowerCase() ===
            code.toLowerCase() &&
          record.id !==
            editing?.id,
      );

    if (
      duplicateCode
    ) {
      toast.error(
        'Duplicate Unit Code',
        'Unit Code already exists.',
      );

      return;
    }

    const duplicateName = data.some((record) => record.name.toLowerCase() === name.toLowerCase() && record.id !== editing?.id);

    if (duplicateName) {
      toast.error('Duplicate Unit Name', 'Unit Name already exists.');
      return;
    }

    if (editing) {
      const updated: UnitMasterRecord = {
        ...editing,

        code,

        name,

        description: form.description?.trim() ?? '',

        status,
      };

      setData((previous) => previous.map((record) => (record.id === editing.id ? updated : record)));

      toast.success('Unit updated successfully');
    } else {
      const newRecord: UnitMasterRecord = {
        id: 'unit-' + Math.random().toString(36).slice(2),

        code,

        name,

        symbol: '',

        description: form.description?.trim() ?? '',

        displayOrder: data.length + 1,

        status,
      };

      setData((previous) => [...previous, newRecord]);

      toast.success('Unit created successfully');
    }

    setModalOpen(
      false,
    );

    setEditing(null);

    setForm({});
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = () => {
    if (
      !deleteTarget
    ) {
      return;
    }

    setData(
      (previous) =>
        previous.filter(
          (record) =>
            record.id !==
            deleteTarget.id,
        ),
    );

    toast.success(
      'Unit deleted successfully',
    );

    setDeleteTarget(
      null,
    );
  };

  // =========================================================
  // COLUMNS
  // =========================================================

  const columns: Column<UnitMasterRecord>[] =
    [
      {
        key: 'sno',
        header: 'S.No',
        align: 'center',
        render: (record) => {
          const idx = paged.findIndex((r) => r.id === record.id);
          return (page - 1) * PAGE_SIZE + idx + 1;
        },
      },
      {
        key: 'code',
        header:
          'Unit Code',
        render: (
          record,
        ) => (
          <span className="font-medium text-brown-800">
            {record.code}
          </span>
        ),
      },

      {
        key: 'name',
        header:
          'Unit Name',
        render: (
          record,
        ) => (
          <span className="text-brown-800">
            {record.name}
          </span>
        ),
      },

      {
        key: 'description',
        header: 'Description',
        render: (record) => <span className="text-brown-700">{record.description}</span>,
      },

      {
        key: 'status',
        header:
          'Status',
        render: (
          record,
        ) => (
          <StatusBadge
            status={
              record.status
            }
          />
        ),
      },

      {
        key: 'actions',
        header:
          'Actions',
        align:
          'center',
        render: (
          record,
        ) => (
          <div className="flex justify-center gap-1">

            <button
              type="button"
              onClick={() =>
                openEdit(
                  record,
                )
              }
              className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
              title="Edit Unit"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                setDeleteTarget(
                  record,
                )
              }
              className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
              title="Delete Unit"
            >
              <Trash2 className="h-4 w-4" />
            </button>

          </div>
        ),
      },
    ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div>

      <PageHeader
        title="Unit Master"
        description="Manage units of measure used for items and inventory"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={
              openCreate
            }
          >
            <Plus className="h-4 w-4" />

            Add Unit
          </button>
        }
      />

      {/* FILTER */}

      <div className="card p-4">

        <SearchFilterBar
          search={
            search
          }
          onSearch={(
            value,
          ) => {
            setSearch(
              value,
            );

            setPage(1);
          }}
          placeholder="Search unit code or name..."
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

      {/* TABLE */}

      <div className="card mt-4">

        <DataTable
          columns={
            columns
          }
          data={
            paged
          }
        />

        <Pagination
          page={
            page
          }
          totalPages={
            totalPages
          }
          onPage={
            setPage
          }
          totalItems={
            filtered.length
          }
          pageSize={
            PAGE_SIZE
          }
        />

      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        open={
          modalOpen
        }
        onClose={() =>
          setModalOpen(
            false,
          )
        }
        title={
          editing
            ? 'Edit Unit'
            : 'Add Unit'
        }
        size="md"
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

        <div className="grid gap-4 sm:grid-cols-2">

          <FormField
            label="Unit Code"
            required
          >
            <TextInput
              value={
                form.code ??
                ''
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  code:
                    event
                      .target
                      .value,
                })
              }
              placeholder="e.g. NOS"
            />
          </FormField>

          <FormField
            label="Unit Name"
            required
          >
            <TextInput
              value={
                form.name ??
                ''
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  name:
                    event
                      .target
                      .value,
                })
              }
              placeholder="e.g. Numbers"
            />
          </FormField>

 
 

          <FormField
            label="Description"
            className="sm:col-span-2"
          >
            <TextArea
              value={
                form.description ??
                ''
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  description:
                    event
                      .target
                      .value,
                })
              }
              placeholder="Enter unit description"
              rows={3}
            />
          </FormField>

          <FormField
            label="Status"
            className="sm:col-span-2"
          >
            <div className="pt-1">

              <Toggle
                checked={
                  status ===
                  'Active'
                }
                onChange={(
                  checked,
                ) =>
                  setStatus(
                    checked
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

        </div>

      </Modal>

      {/* DELETE */}

      <ConfirmModal
        open={
          !!deleteTarget
        }
        onClose={() =>
          setDeleteTarget(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete Unit"
        message={`Delete "${deleteTarget?.name ?? ''}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

    </div>
  );
}