import { useState, useMemo } from 'react';
import { Eye, Printer, RefreshCw, Ticket, Ban } from 'lucide-react';
import { PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextArea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { payments as initial, cancellations as cancellationData, type Payment, type Cancellation } from '@/lib/mockData';
import { formatSGD, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 5;

export function PaymentManagement() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<Payment | null>(null);
  const [reprintTarget, setReprintTarget] = useState<Payment | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);

  const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Completed', value: 'Completed' }, { label: 'Cancelled', value: 'Cancelled' }];

  const filtered = useMemo(() => initial.filter((p) =>
    (!search || p.txnNo.toLowerCase().includes(search.toLowerCase()) || p.customer.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || p.status === statusFilter)
  ), [search, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleReprint = () => {
    if (!reprintReason.trim()) { toast.error('Reason required', 'Please provide a reason for reprinting.'); return; }
    toast.success('Receipt reprinted', `Receipt ${reprintTarget?.receiptNo} reprinted with REPRINT label.`);
    setReprintTarget(null); setReprintReason('');
  };

  const columns: Column<Payment>[] = [
    { key: 'txnNo', header: 'Transaction No', render: (p) => <span className="font-medium text-maroon-700">{p.txnNo}</span> },
    { key: 'receiptNo', header: 'Receipt No' },
    { key: 'customer', header: 'Customer' },
    { key: 'paymentMode', header: 'Payment Mode' },
    { key: 'gross', header: 'Gross Amount', align: 'right', render: (p) => formatSGD(p.gross) },
    { key: 'gst', header: 'GST Amount', align: 'right', render: (p) => formatSGD(p.gst) },
    { key: 'status', header: 'Payment Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'ref', header: 'Payment Reference' },
    { key: 'datetime', header: 'Date & Time', render: (p) => formatDateTime(p.datetime) },
    { key: 'actions', header: 'Actions', align: 'center', render: (p) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewTarget(p)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => toast.success('Receipt printed', `Receipt ${p.receiptNo} sent to printer.`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Print Receipt"><Printer className="h-4 w-4" /></button>
        <button onClick={() => setReprintTarget(p)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Reprint Receipt"><RefreshCw className="h-4 w-4" /></button>
        <button onClick={() => toast.info('Viewing tickets', `Operational tickets for ${p.txnNo}`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View Tickets"><Ticket className="h-4 w-4" /></button>
        {p.status === 'Completed' && <button onClick={() => setCancelTarget(p)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Cancel"><Ban className="h-4 w-4" /></button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Payments & Receipts" description="View payment history and manage receipts" />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[{ label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } }]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Payment Details" size="lg"
        footer={<button className="btn-primary" onClick={() => setViewTarget(null)}>Close</button>}>
        {viewTarget && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-brown-400">Transaction No</p><p className="text-sm font-medium text-brown-800">{viewTarget.txnNo}</p></div>
            <div><p className="text-xs text-brown-400">Receipt No</p><p className="text-sm font-medium text-brown-800">{viewTarget.receiptNo}</p></div>
            <div><p className="text-xs text-brown-400">Customer</p><p className="text-sm font-medium text-brown-800">{viewTarget.customer}</p></div>
            <div><p className="text-xs text-brown-400">Payment Mode</p><p className="text-sm font-medium text-brown-800">{viewTarget.paymentMode}</p></div>
            <div><p className="text-xs text-brown-400">Gross Amount</p><p className="text-sm font-medium text-brown-800">{formatSGD(viewTarget.gross)}</p></div>
            <div><p className="text-xs text-brown-400">GST Amount</p><p className="text-sm font-medium text-brown-800">{formatSGD(viewTarget.gst)}</p></div>
            <div><p className="text-xs text-brown-400">Payment Reference</p><p className="text-sm font-medium text-brown-800">{viewTarget.ref}</p></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={viewTarget.status} /></div>
            <div><p className="text-xs text-brown-400">Date & Time</p><p className="text-sm font-medium text-brown-800">{formatDateTime(viewTarget.datetime)}</p></div>
          </div>
        )}
      </Modal>

      <Modal open={!!reprintTarget} onClose={() => setReprintTarget(null)} title="Reprint Receipt" description={`Receipt ${reprintTarget?.receiptNo}`}
        footer={<><button className="btn-outline" onClick={() => setReprintTarget(null)}>Cancel</button><button className="btn-saffron" onClick={handleReprint}>Reprint</button></>}>
        <FormField label="Reason for Reprint" required hint="A reason is required for audit purposes">
          <TextArea value={reprintReason} onChange={(e) => setReprintReason(e.target.value)} placeholder="Enter reason for reprinting receipt..." />
        </FormField>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={() => { toast.success('Transaction cancelled', `${cancelTarget?.txnNo} cancelled.`); setCancelTarget(null); }}
        title="Cancel Transaction" message={`Cancel transaction ${cancelTarget?.txnNo}?`} confirmLabel="Cancel Transaction" variant="danger" />
    </div>
  );
}

export function CancellationRefunds() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [cancelStatusFilter, setCancelStatusFilter] = useState('');
  const [refundStatusFilter, setRefundStatusFilter] = useState('');
  const [processTarget, setProcessTarget] = useState<Cancellation | null>(null);

  const cancelStatusOptions: FilterOption[] = [{ label: 'All', value: '' }, { label: 'Requested', value: 'Requested' }, { label: 'Approved', value: 'Approved' }, { label: 'Rejected', value: 'Rejected' }, { label: 'Cancelled', value: 'Cancelled' }];
  const refundStatusOptions: FilterOption[] = [{ label: 'All', value: '' }, { label: 'Not Applicable', value: 'Not Applicable' }, { label: 'Pending', value: 'Pending' }, { label: 'Processed', value: 'Processed' }];

  const filtered = useMemo(() => cancellationData.filter((c) =>
    (!search || c.refNo.toLowerCase().includes(search.toLowerCase()) || c.customer.toLowerCase().includes(search.toLowerCase())) &&
    (!cancelStatusFilter || c.cancellationStatus === cancelStatusFilter) &&
    (!refundStatusFilter || c.refundStatus === refundStatusFilter)
  ), [search, cancelStatusFilter, refundStatusFilter]);

  const columns: Column<Cancellation>[] = [
    { key: 'refNo', header: 'Booking/Txn No', render: (c) => <span className="font-medium text-maroon-700">{c.refNo}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'originalAmount', header: 'Original Amount', align: 'right', render: (c) => formatSGD(c.originalAmount) },
    { key: 'reason', header: 'Cancellation Reason' },
    { key: 'cancellationStatus', header: 'Cancel Status', render: (c) => <StatusBadge status={c.cancellationStatus} /> },
    { key: 'refundableAmount', header: 'Refundable', align: 'right', render: (c) => formatSGD(c.refundableAmount) },
    { key: 'actualRefund', header: 'Actual Refund', align: 'right', render: (c) => formatSGD(c.actualRefund) },
    { key: 'refundMode', header: 'Refund Mode' },
    { key: 'refundDate', header: 'Refund Date' },
    { key: 'refundStatus', header: 'Refund Status', render: (c) => <StatusBadge status={c.refundStatus} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (c) => (
      <button onClick={() => setProcessTarget(c)} disabled={c.cancellationStatus !== 'Requested'}
        className="btn-outline px-3 py-1 text-xs disabled:opacity-40">Process</button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Cancellation Requests" description="Review and process cancellation and manual refund requests" />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={setSearch}
          filters={[
            { label: 'Cancel Status', value: cancelStatusFilter, options: cancelStatusOptions, onChange: setCancelStatusFilter },
            { label: 'Refund Status', value: refundStatusFilter, options: refundStatusOptions, onChange: setRefundStatusFilter },
          ]} />
      </div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={!!processTarget} onClose={() => setProcessTarget(null)} title="Process Cancellation" size="lg"
        footer={<><button className="btn-outline" onClick={() => setProcessTarget(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => { toast.success('Cancellation processed', `${processTarget?.refNo} has been updated.`); setProcessTarget(null); }}>Save</button></>}>
        {processTarget && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-brown-400">Reference</p><p className="text-sm font-medium text-brown-800">{processTarget.refNo}</p></div>
            <div><p className="text-xs text-brown-400">Customer</p><p className="text-sm font-medium text-brown-800">{processTarget.customer}</p></div>
            <div><p className="text-xs text-brown-400">Original Amount</p><p className="text-sm font-medium text-brown-800">{formatSGD(processTarget.originalAmount)}</p></div>
            <div><p className="text-xs text-brown-400">Refundable Amount</p><p className="text-sm font-medium text-brown-800">{formatSGD(processTarget.refundableAmount)}</p></div>
            <FormField label="Actual Refund Amount"><input type="number" step="0.01" className="input" defaultValue={processTarget.actualRefund} /></FormField>
            <FormField label="Refund Mode" hint="Manual entry - no automatic PayNow refund"><select className="input" defaultValue={processTarget.refundMode}><option>Not Applicable</option><option>Cash</option><option>PayNow</option><option>NETS</option><option>Cheque</option></select></FormField>
            <FormField label="Refund Date"><input type="date" className="input" /></FormField>
            <FormField label="Refund Reference"><input type="text" className="input" defaultValue={processTarget.refundRef} /></FormField>
            <FormField label="Remarks" className="sm:col-span-2"><TextArea defaultValue={processTarget.remarks} /></FormField>
            <FormField label="Cancellation Status"><select className="input" defaultValue={processTarget.cancellationStatus}><option>Requested</option><option>Approved</option><option>Rejected</option><option>Cancelled</option></select></FormField>
            <FormField label="Refund Status"><select className="input" defaultValue={processTarget.refundStatus}><option>Not Applicable</option><option>Pending</option><option>Processed</option></select></FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function ManualRefunds() {
  const toast = useToast();
  const pending = cancellationData.filter((c) => c.refundStatus === 'Pending');

  const columns: Column<Cancellation>[] = [
    { key: 'refNo', header: 'Reference No', render: (c) => <span className="font-medium text-maroon-700">{c.refNo}</span> },
    { key: 'customer', header: 'Customer' },
    { key: 'refundableAmount', header: 'Refundable Amount', align: 'right', render: (c) => formatSGD(c.refundableAmount) },
    { key: 'refundMode', header: 'Refund Mode' },
    { key: 'refundStatus', header: 'Refund Status', render: (c) => <StatusBadge status={c.refundStatus} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: () => <button className="btn-outline px-3 py-1 text-xs" onClick={() => toast.info('Opening refund form')}>Update Refund</button> },
  ];

  return (
    <div>
      <PageHeader title="Manual Refund Updates" description="Process pending refunds manually. No automatic PayNow refund is available." />
      <div className="card mb-4 flex items-center gap-3 border-saffron-100 bg-saffron-50/50 p-4">
        <span className="text-sm text-brown-700">Refunds are processed manually. Update refund details after completing the bank transfer or cash refund.</span>
      </div>
      <div className="card"><DataTable columns={columns} data={pending} emptyMessage="No pending refunds" /></div>
    </div>
  );
}
