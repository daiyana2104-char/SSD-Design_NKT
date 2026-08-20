import { useState, useMemo } from 'react';
import { Eye, Printer, RefreshCw, Ticket, Ban, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextArea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { posTransactions, portalBookings, type PosTransaction, type PortalBooking } from '@/lib/mockData';
import { formatSGD, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 5;

export function PosTransactions() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<PosTransaction | null>(null);
  const [reprintTarget, setReprintTarget] = useState<PosTransaction | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<PosTransaction | null>(null);

  const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Completed', value: 'Completed' }];

  const filtered = useMemo(() => posTransactions.filter((t) =>
    (!search || t.txnNo.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || t.status === statusFilter)
  ), [search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleReprint = () => {
    if (!reprintReason.trim()) { toast.error('Reason required', 'Please provide a reason for reprinting.'); return; }
    toast.success('Receipt reprinted', `Receipt ${reprintTarget?.receiptNo} has been reprinted. REPRINT label applied.`);
    setReprintTarget(null); setReprintReason('');
  };
  const handleCancel = () => { toast.success('Transaction cancelled', `${cancelTarget?.txnNo} has been cancelled.`); setCancelTarget(null); };

  const columns: Column<PosTransaction>[] = [
    { key: 'txnNo', header: 'Transaction No', render: (t) => <span className="font-medium text-maroon-700">{t.txnNo}</span> },
    { key: 'receiptNo', header: 'Receipt No' },
    { key: 'customer', header: 'Customer' },
    { key: 'type', header: 'Type', render: (t) => <StatusBadge status={t.type ?? 'Item'} variant="neutral" /> },
    { key: 'paymentMode', header: 'Payment Mode' },
    { key: 'gross', header: 'Gross Amount', align: 'right', render: (t) => formatSGD(t.gross) },
    { key: 'gst', header: 'GST', align: 'right', render: (t) => formatSGD(t.gst) },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'datetime', header: 'Date & Time', render: (t) => formatDateTime(t.datetime) },
    { key: 'actions', header: 'Actions', align: 'center', render: (t) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewTarget(t)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => setReprintTarget(t)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Print Receipt"><Printer className="h-4 w-4" /></button>
        <button onClick={() => setReprintTarget(t)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Reprint Receipt"><RefreshCw className="h-4 w-4" /></button>
        <button onClick={() => toast.info('Viewing tickets', `Operational tickets for ${t.txnNo}`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View Tickets"><Ticket className="h-4 w-4" /></button>
        {t.status === 'Completed' && <button onClick={() => setCancelTarget(t)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Cancel"><Ban className="h-4 w-4" /></button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="POS Transactions" description="View and manage counter transactions" />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {/* View modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Transaction Details" size="lg"
        footer={<button className="btn-primary" onClick={() => setViewTarget(null)}>Close</button>}>
        {viewTarget && (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-brown-400">Transaction No</p><p className="text-sm font-medium text-brown-800">{viewTarget.txnNo}</p></div>
              <div><p className="text-xs text-brown-400">Receipt No</p><p className="text-sm font-medium text-brown-800">{viewTarget.receiptNo}</p></div>
              <div><p className="text-xs text-brown-400">Customer</p><p className="text-sm font-medium text-brown-800">{viewTarget.customer}</p></div>
              <div><p className="text-xs text-brown-400">Payment Mode</p><p className="text-sm font-medium text-brown-800">{viewTarget.paymentMode}</p></div>
              <div><p className="text-xs text-brown-400">Date & Time</p><p className="text-sm font-medium text-brown-800">{formatDateTime(viewTarget.datetime)}</p></div>
              <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewTarget.status} /></div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-brown-700">Items</p>
              <div className="rounded-lg border border-brown-100">
                {viewTarget.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-brown-50 p-3 last:border-0">
                    <span className="text-sm text-brown-700">{item.name} × {item.qty}</span>
                    <span className="text-sm font-medium text-brown-800">{formatSGD(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-cream-50 p-3">
                  <span className="text-sm font-semibold text-brown-800">Total (incl. GST)</span>
                  <span className="text-sm font-semibold text-brown-900">{formatSGD(viewTarget.gross)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reprint modal */}
      <Modal open={!!reprintTarget} onClose={() => setReprintTarget(null)} title="Reprint Receipt" description={`Receipt ${reprintTarget?.receiptNo}`}
        footer={<><button className="btn-outline" onClick={() => setReprintTarget(null)}>Cancel</button><button className="btn-saffron" onClick={handleReprint}>Reprint</button></>}>
        <FormField label="Reason for Reprint" required hint="A reason is required for audit purposes">
          <TextArea value={reprintReason} onChange={(e) => setReprintReason(e.target.value)} placeholder="Enter reason for reprinting receipt..." />
        </FormField>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancel Transaction" message={`Cancel transaction ${cancelTarget?.txnNo}? This will initiate a refund process.`} confirmLabel="Cancel Transaction" variant="danger" />
    </div>
  );
}

export function PortalBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<PortalBooking | null>(null);

  const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Confirmed', value: 'Confirmed' }, { label: 'Cancelled', value: 'Cancelled' }];

  const filtered = useMemo(() => portalBookings.filter((b) =>
    (!search || b.bookingNo.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || b.status === statusFilter)
  ), [search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const columns: Column<PortalBooking>[] = [
    { key: 'bookingNo', header: 'Booking No', render: (b) => <span className="font-medium text-maroon-700">{b.bookingNo}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'service', header: 'Service' },
    { key: 'date', header: 'Service Date' },
    { key: 'amount', header: 'Amount', align: 'right', render: (b) => formatSGD(b.amount) },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'datetime', header: 'Booked On', render: (b) => formatDateTime(b.datetime) },
    { key: 'actions', header: 'Actions', align: 'center', render: (b) => (
      <button onClick={() => setViewTarget(b)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600"><Eye className="h-4 w-4" /></button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Customer Portal Bookings" description="View online service bookings" />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Booking Details"
        footer={<button className="btn-primary" onClick={() => setViewTarget(null)}>Close</button>}>
        {viewTarget && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-brown-400">Booking No</p><p className="text-sm font-medium text-brown-800">{viewTarget.bookingNo}</p></div>
            <div><p className="text-xs text-brown-400">Customer</p><p className="text-sm font-medium text-brown-800">{viewTarget.customer}</p></div>
            <div><p className="text-xs text-brown-400">Service</p><p className="text-sm font-medium text-brown-800">{viewTarget.service}</p></div>
            <div><p className="text-xs text-brown-400">Service Date</p><p className="text-sm font-medium text-brown-800">{viewTarget.date}</p></div>
            <div><p className="text-xs text-brown-400">Amount</p><p className="text-sm font-medium text-brown-800">{formatSGD(viewTarget.amount)}</p></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewTarget.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
