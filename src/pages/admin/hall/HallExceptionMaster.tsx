import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, Toggle, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { halls, type HallException } from '@/lib/mockData';
import { hallBookings, hallExceptions as initialExceptions } from '@/lib/hallData';
import { bookingOverlaps, exceptionOverlaps } from '@/lib/hallAvailability';

const PAGE_SIZE = 8;

function fmtTime(value: string): string {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function HallExceptionMaster() {
  const toast = useToast();
  const [data, setDataState] = useState<HallException[]>(initialExceptions);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallException | null>(null);
  const [form, setForm] = useState<Partial<HallException>>({ status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState<HallException | null>(null);

  const activeHalls = useMemo(() => halls.filter((h) => h.status === 'Active'), []);

  const setData = (next: HallException[]) => {
    setDataState(next);
    initialExceptions.length = 0;
    initialExceptions.push(...next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(
      (r) =>
        !q ||
        r.hallName?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.exceptionDate.includes(q),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ hallId: '', exceptionDate: '', startTime: '', endTime: '', reason: '', status: 'Active' });
    setModalOpen(true);
  };

  const openEdit = (r: HallException) => {
    setEditing(r);
    setForm(r);
    setModalOpen(true);
  };

  const handleSave = () => {
    const hallId = form.hallId ?? '';
    const exceptionDate = form.exceptionDate ?? '';
    const startTime = form.startTime ?? '';
    const endTime = form.endTime ?? '';
    const reason = form.reason?.trim() ?? '';
    const status = form.status ?? 'Active';

    if (!hallId) return toast.error('Validation Error', 'Hall is required.');
    if (!exceptionDate) return toast.error('Validation Error', 'Exception Date is required.');
    if (!startTime) return toast.error('Validation Error', 'Start Time is required.');
    if (!endTime) return toast.error('Validation Error', 'End Time is required.');
    if (startTime >= endTime)
      return toast.error('Validation Error', 'End Time must be later than Start Time.');

    const hall = activeHalls.find((h) => h.id === hallId);
    if (!hall) return toast.error('Validation Error', 'Select an active hall.');

    const bookingHit = bookingOverlaps(hallBookings, hallId, exceptionDate, startTime, endTime);
    if (bookingHit) {
      return toast.error(
        'Booking Conflict',
        `An existing booking (${bookingHit.bookingRef}) overlaps this date and time.`,
      );
    }

    const exceptionHit = exceptionOverlaps(data, hallId, exceptionDate, startTime, endTime, editing?.id);
    if (exceptionHit) {
      return toast.error(
        'Exception Conflict',
        'An active hall exception already exists for this date and time.',
      );
    }

    if (editing) {
      const updated: HallException = {
        ...editing,
        hallId,
        hallName: hall.name,
        exceptionDate,
        startTime,
        endTime,
        reason,
        status,
      };
      setData(data.map((p) => (p.id === editing.id ? updated : p)));
      toast.success('Hall exception updated');
    } else {
      const newRec: HallException = {
        id: 'hex-' + Math.random().toString(36).slice(2),
        hallId,
        hallName: hall.name,
        exceptionDate,
        startTime,
        endTime,
        reason,
        status,
      };
      setData([...data, newRec]);
      toast.success('Hall exception created');
    }

    setModalOpen(false);
    setEditing(null);
    setForm({ status: 'Active' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData(data.map((p) => (p.id === deleteTarget.id ? { ...p, status: 'Inactive' } : p)));
    toast.success('Hall exception deactivated');
    setDeleteTarget(null);
  };

  const columns: Column<HallException>[] = [
    { key: 'hall', header: 'Hall', render: (r) => <span className="text-brown-800">{r.hallName}</span> },
    { key: 'date', header: 'Exception Date', render: (r) => <span className="text-brown-700">{r.exceptionDate}</span> },
    {
      key: 'time',
      header: 'Time',
      render: (r) => (
        <span className="text-brown-700">{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</span>
      ),
    },
    { key: 'reason', header: 'Reason / Description', render: (r) => <span className="text-brown-700">{r.reason}</span> },
    { key: 'status', header: 'Status', render: (r) => r.status },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (r) => (
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600"
            title="Delete"
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
        title="Hall Exception"
        description="Block halls for specific dates and time periods"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Exception
          </button>
        }
      />

      <div className="card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search hall, reason or date..."
          filters={[]}
        />
      </div>

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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Hall Exception' : 'Add Hall Exception'}
        size="md"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Hall" required>
            <Dropdown
              value={form.hallId ?? ''}
              onChange={(v) => setForm({ ...form, hallId: v })}
              options={activeHalls.map((h) => ({ label: h.name, value: h.id }))}
              placeholder="Select hall..."
            />
          </FormField>
          <FormField label="Exception Date" required>
            <input
              type="date"
              value={form.exceptionDate ?? ''}
              onChange={(e) => setForm({ ...form, exceptionDate: e.target.value })}
              className="input"
            />
          </FormField>
          <FormField label="Start Time" required>
            <input
              type="time"
              value={form.startTime ?? ''}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="input"
            />
          </FormField>
          <FormField label="End Time" required>
            <input
              type="time"
              value={form.endTime ?? ''}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="input"
            />
          </FormField>
          <FormField label="Reason / Description" className="sm:col-span-2">
            <TextInput
              value={form.reason ?? ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </FormField>
          <FormField label="Status">
            <Toggle
              checked={form.status === 'Active'}
              onChange={(v) => setForm({ ...form, status: v ? 'Active' : 'Inactive' })}
              trueLabel="Active"
              falseLabel="Inactive"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Hall Exception"
        message={`Deactivate exception for "${deleteTarget?.hallName ?? ''}" on ${deleteTarget?.exceptionDate ?? ''}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default HallExceptionMaster;
