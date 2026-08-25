import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Eye, Printer, RefreshCw, Ban, ArrowLeft, Search, Ticket, Receipt,
  CheckCircle2, AlertTriangle, X, FileText, History,
} from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';
import { PageHeader, Card, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar, type FilterOption } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { usePosStore } from '@/lib/posStore';
import {
  posOfferings, GST_RATE, calcGst, calcLedger,
  type PosTransaction, type PosCartLine,
} from '@/lib/posData';
import { formatSGD, formatDate, formatDateTime, cn } from '@/lib/utils';

const PAGE_SIZE = 8;

// ---- Transaction History ----
export function PosTransactions() {
  const navigate = useNavigate();
  const { transactions } = usePosStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const paymentOptions: FilterOption[] = [{ label: 'All Modes', value: '' }, { label: 'Cash', value: 'Cash' }, { label: 'NETS', value: 'NETS' }, { label: 'PayNow', value: 'PayNow' }];
  const statusOptions: FilterOption[] = [{ label: 'All Status', value: '' }, { label: 'Completed', value: 'Completed' }, { label: 'Cancelled', value: 'Cancelled' }];

  const filtered = useMemo(() => transactions.filter((t) => {
    const q = search.toLowerCase();
    const m = !search || t.txnNo.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q);
    const p = !paymentFilter || t.paymentMode === paymentFilter;
    const s = !statusFilter || t.txnStatus === statusFilter;
    return m && p && s;
  }), [transactions, search, paymentFilter, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const columns: Column<PosTransaction>[] = [
    { key: 'txnNo', header: 'Transaction No', render: (t) => <span className="font-medium text-maroon-700">{t.txnNo}</span> },
    { key: 'receiptNo', header: 'Receipt No' },
    { key: 'customerName', header: 'Customer' },
    { key: 'lines', header: 'Items', align: 'center', render: (t) => t.lines.length },
    { key: 'payableAmount', header: 'Amount', align: 'right', render: (t) => formatSGD(t.payableAmount) },
    { key: 'paymentMode', header: 'Payment' },
    { key: 'paymentStatus', header: 'Pay Status', render: (t) => <StatusBadge status={t.paymentStatus} /> },
    { key: 'txnStatus', header: 'Txn Status', render: (t) => <StatusBadge status={t.txnStatus} variant={t.txnStatus === 'Completed' ? 'success' : 'error'} /> },
    { key: 'posUser', header: 'POS User' },
    { key: 'datetime', header: 'Date & Time', render: (t) => formatDateTime(t.datetime) },
    { key: 'actions', header: 'Actions', align: 'center', render: (t) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => navigate(`/pos/transactions/${t.id}`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View"><Eye className="h-4 w-4" /></button>
        {t.txnStatus === 'Completed' && (
          <>
            <button onClick={() => { navigate(`/pos/transactions/${t.id}`); }} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="View Receipt"><Receipt className="h-4 w-4" /></button>
            <button onClick={() => navigate(`/pos/reprint?txn=${t.id}`)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100 hover:text-maroon-600" title="Reprint"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => navigate(`/pos/transactions/${t.id}?cancel=1`)} className="rounded p-1.5 text-brown-500 hover:bg-red-50 hover:text-red-600" title="Cancel"><Ban className="h-4 w-4" /></button>
          </>
        )}
      </div>
    ) },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <PageHeader title="Transaction History" description="View and manage all POS transactions" />
      <div className="card p-4">
        <SearchFilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
          filters={[
            { label: 'Payment', value: paymentFilter, options: paymentOptions, onChange: (v) => { setPaymentFilter(v); setPage(1); } },
            { label: 'Status', value: statusFilter, options: statusOptions, onChange: (v) => { setStatusFilter(v); setPage(1); } },
          ]} />
      </div>
      <div className="card mt-4">
        <DataTable columns={columns} data={paged} />
        <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}

// ---- Transaction Detail ----
export function PosTransactionDetail() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { transactions, updateTransaction, user } = usePosStore();
  const toast = useToast();
  const txn = transactions.find((t) => t.id === transactionId);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundData, setRefundData] = useState({ refundMode: 'Cash', refundAmount: 0, refundRef: '', refundDate: '', remarks: '', refundStatus: 'Pending' });

  if (!txn) return <div className="p-8 text-center text-brown-500">Transaction not found. <button className="text-maroon-600 underline" onClick={() => navigate('/pos/transactions')}>Back</button></div>;

  const handleCancel = () => {
    if (!cancelReason.trim()) { toast.error('Cancellation reason is required.'); return; }
    updateTransaction({
      ...txn, txnStatus: 'Completed',
      cancellation: { reason: cancelReason, user: user!.username, datetime: new Date().toISOString(), refundMode: refundData.refundMode, refundStatus: 'Pending', refundAmount: 0, refundRef: '', refundDate: '', remarks: '' },
      audit: [...txn.audit, { action: 'Cancellation', module: 'POS', ref: txn.txnNo, user: user!.username, datetime: new Date().toISOString(), newValue: 'Cancelled' }],
    });
    setCancelOpen(false);
    toast.success('Transaction cancelled', `${txn.txnNo} is now Cancelled.`);
  };

  const handleRefund = () => {
    updateTransaction({
      ...txn,
      cancellation: { ...txn.cancellation!, refundMode: refundData.refundMode, refundAmount: refundData.refundAmount, refundRef: refundData.refundRef, refundDate: refundData.refundDate, remarks: refundData.remarks, refundStatus: refundData.refundStatus },
      audit: [...txn.audit, { action: 'Manual refund update', module: 'POS', ref: txn.txnNo, user: user!.username, datetime: new Date().toISOString(), newValue: refundData.refundStatus }],
    });
    setRefundOpen(false);
    toast.success('Refund updated', `Refund status: ${refundData.refundStatus}`);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <PageHeader title={`Transaction ${txn.txnNo}`} description={`${txn.receiptNo} · ${formatDateTime(txn.datetime)}`}
        actions={<><button className="btn-outline" onClick={() => navigate('/pos/transactions')}><ArrowLeft className="h-4 w-4" /> Back</button>
          {txn.txnStatus === 'Completed' && <>
            <button className="btn-outline" onClick={() => setReceiptOpen(true)}><Receipt className="h-4 w-4" /> Print Receipt</button>
            <button className="btn-outline" onClick={() => setTicketsOpen(true)}><Ticket className="h-4 w-4" /> View Tickets</button>
            <button className="btn-outline" onClick={() => navigate(`/pos/reprint?txn=${txn.id}`)}><RefreshCw className="h-4 w-4" /> Reprint</button>
            {user?.canCancel && <button className="btn-danger" onClick={() => setCancelOpen(true)}><Ban className="h-4 w-4" /> Cancel Transaction</button>}
          </>}
        </>} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Transaction Info */}
        <Card className="p-5">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Transaction Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-brown-400">Transaction No</p><p className="font-medium text-brown-800">{txn.txnNo}</p></div>
            <div><p className="text-xs text-brown-400">Receipt No</p><p className="font-medium text-brown-800">{txn.receiptNo}</p></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={txn.txnStatus} variant={txn.txnStatus === 'Completed' ? 'success' : 'error'} /></div>
            <div><p className="text-xs text-brown-400">Date & Time</p><p className="font-medium text-brown-800">{formatDateTime(txn.datetime)}</p></div>
            <div><p className="text-xs text-brown-400">POS User</p><p className="font-medium text-brown-800">{txn.posUser}</p></div>
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="p-5">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Customer Information</h3>
          {txn.customer ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-brown-400">Customer Code</p><p className="font-medium text-brown-800">{txn.customer.code}</p></div>
              <div><p className="text-xs text-brown-400">Name</p><p className="font-medium text-brown-800">{txn.customer.name}</p></div>
              <div><p className="text-xs text-brown-400">Mobile</p><p className="font-medium text-brown-800">{txn.customer.mobile}</p></div>
              <div><p className="text-xs text-brown-400">Email</p><p className="font-medium text-brown-800">{txn.customer.email}</p></div>
            </div>
          ) : <p className="text-sm text-brown-500">Walk-in Customer</p>}
        </Card>

        {/* Transaction Lines */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Transaction Lines</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-brown-100 text-left text-xs uppercase text-brown-500">
                <th className="py-2">Item/Service</th><th className="py-2">Deity</th><th className="py-2">Name</th><th className="py-2">Nakshatra</th>
                <th className="py-2">Event Date</th><th className="py-2">Session</th><th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th><th className="py-2">GST Class</th><th className="py-2 text-right">GST Amt</th>
                <th className="py-2 text-right">Ledger</th><th className="py-2 text-right">Gross</th><th className="py-2">Print Group</th>
              </tr></thead>
              <tbody>
                {txn.lines.map((l, i) => (
                  <tr key={i} className="border-b border-brown-50">
                    <td className="py-2 font-medium text-brown-800">{l.name}</td>
                    <td className="py-2 text-brown-600">{l.deities?.join(', ') ?? '-'}</td>
                    <td className="py-2 text-brown-600">{l.devoteeName ?? '-'}</td>
                    <td className="py-2 text-brown-600">{l.nakshatra ?? '-'}</td>
                    <td className="py-2 text-brown-600">{l.eventDate ? formatDate(l.eventDate) : '-'}</td>
                    <td className="py-2 text-brown-600">{l.session ?? '-'}</td>
                    <td className="py-2 text-center">{l.qty}</td>
                    <td className="py-2 text-right">{formatSGD(l.price)}</td>
                    <td className="py-2 text-brown-600">{l.gstClass}</td>
                    <td className="py-2 text-right">{formatSGD(l.gstAmount)}</td>
                    <td className="py-2 text-right">{formatSGD(l.ledgerAmount)}</td>
                    <td className="py-2 text-right font-medium">{formatSGD(l.grossAmount)}</td>
                    <td className="py-2 text-brown-600">{l.printingGroup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Info */}
        <Card className="p-5">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Payment Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-brown-400">Payment Mode</p><p className="font-medium text-brown-800">{txn.paymentMode}</p></div>
            <div><p className="text-xs text-brown-400">Paid Amount</p><p className="font-medium text-brown-800">{formatSGD(txn.paidAmount)}</p></div>
            <div><p className="text-xs text-brown-400">Change Amount</p><p className="font-medium text-brown-800">{formatSGD(txn.changeAmount)}</p></div>
            <div><p className="text-xs text-brown-400">Payment Reference</p><p className="font-medium text-brown-800">{txn.paymentRef}</p></div>
            <div><p className="text-xs text-brown-400">Payment Status</p><StatusBadge status={txn.paymentStatus} /></div>
          </div>
        </Card>

        {/* Printing Info */}
        <Card className="p-5">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Printing Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-brown-400">Financial Receipt</p><p className="font-medium text-brown-800">{txn.receiptNo}</p></div>
            <div><p className="text-xs text-brown-400">Reprint Count</p><p className="font-medium text-brown-800">{txn.reprintCount}</p></div>
            <div><p className="text-xs text-brown-400">Original Print</p><StatusBadge status="Completed" variant="success" /></div>
          </div>
        </Card>

        {/* Cancellation Info */}
        {txn.cancellation && (
          <Card className="p-5 lg:col-span-2 border-red-100">
            <h3 className="mb-3 font-serif text-lg font-semibold text-red-700">Cancellation & Refund</h3>
            <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
              <div><p className="text-xs text-brown-400">Reason</p><p className="font-medium text-brown-800">{txn.cancellation.reason}</p></div>
              <div><p className="text-xs text-brown-400">Cancelled By</p><p className="font-medium text-brown-800">{txn.cancellation.user}</p></div>
              <div><p className="text-xs text-brown-400">Cancel Date</p><p className="font-medium text-brown-800">{formatDateTime(txn.cancellation.datetime)}</p></div>
              <div><p className="text-xs text-brown-400">Refund Status</p><StatusBadge status={txn.cancellation.refundStatus} /></div>
              <div><p className="text-xs text-brown-400">Refund Mode</p><p className="font-medium text-brown-800">{txn.cancellation.refundMode}</p></div>
              <div><p className="text-xs text-brown-400">Refund Amount</p><p className="font-medium text-brown-800">{formatSGD(txn.cancellation.refundAmount)}</p></div>
              <div><p className="text-xs text-brown-400">Refund Reference</p><p className="font-medium text-brown-800">{txn.cancellation.refundRef || '-'}</p></div>
              <div><p className="text-xs text-brown-400">Refund Date</p><p className="font-medium text-brown-800">{txn.cancellation.refundDate || '-'}</p></div>
            </div>
            {txn.cancellation.refundStatus === 'Pending' && user?.canCancel && (
              <button className="btn-outline mt-3" onClick={() => { setRefundData({ ...refundData, refundAmount: txn.payableAmount * 0.9 }); setRefundOpen(true); }}>Update Refund Details</button>
            )}
          </Card>
        )}

        {/* Audit Timeline */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-serif text-lg font-semibold text-brown-900">Audit Timeline</h3>
          <div className="space-y-2">
            {txn.audit.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-brown-50 p-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-maroon-600"><History className="h-3 w-3" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brown-800">{a.action}</p>
                  <p className="text-xs text-brown-400">{a.module} · {a.ref} · {a.user} · {formatDateTime(a.datetime)}</p>
                  {a.newValue && <p className="text-xs text-brown-500">→ {a.newValue}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Receipt Preview */}
      {receiptOpen && <ReceiptPreview txn={txn} onClose={() => setReceiptOpen(false)} />}
      {/* Tickets Preview */}
      {ticketsOpen && <TicketsPreview txn={txn} onClose={() => setTicketsOpen(false)} />}

      {/* Cancel Modal */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Transaction" size="lg"
        footer={<><button className="btn-outline" onClick={() => setCancelOpen(false)}>Keep Transaction</button><button className="btn-danger" onClick={handleCancel}>Confirm Cancellation</button></>}>
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mb-1 inline h-4 w-4" /> Cancel this completed transaction? This action cannot be undone.
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-brown-400">Transaction No</p><p className="font-medium">{txn.txnNo}</p></div>
            <div><p className="text-xs text-brown-400">Receipt No</p><p className="font-medium">{txn.receiptNo}</p></div>
            <div><p className="text-xs text-brown-400">Customer</p><p className="font-medium">{txn.customerName}</p></div>
            <div><p className="text-xs text-brown-400">Original Amount</p><p className="font-medium">{formatSGD(txn.payableAmount)}</p></div>
          </div>
          <FormField label="Cancellation Reason" required>
            <TextArea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Enter reason for cancellation..." />
          </FormField>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="Manual Refund Update" size="lg"
        footer={<><button className="btn-outline" onClick={() => setRefundOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleRefund}>Save Refund</button></>}>
        <div className="space-y-4">
          <div className="rounded-lg bg-cream-50 p-3 text-sm text-brown-600">Refund processing is manual. No automatic PayNow or NETS refund will be triggered.</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Refundable Amount"><TextInput type="number" step="0.01" value={refundData.refundAmount || ''} onChange={(e) => setRefundData({ ...refundData, refundAmount: Number(e.target.value) })} /></FormField>
            <FormField label="Actual Refund Amount"><TextInput type="number" step="0.01" value={refundData.refundAmount || ''} onChange={(e) => setRefundData({ ...refundData, refundAmount: Number(e.target.value) })} /></FormField>
            <FormField label="Refund Mode"><Dropdown value={refundData.refundMode} onChange={(v) => setRefundData({ ...refundData, refundMode: v })} options={[{ label: 'Cash', value: 'Cash' }, { label: 'PayNow', value: 'PayNow' }, { label: 'NETS', value: 'NETS' }, { label: 'Cheque', value: 'Cheque' }]} /></FormField>
            <FormField label="Refund Date"><TextInput type="date" value={refundData.refundDate} onChange={(e) => setRefundData({ ...refundData, refundDate: e.target.value })} /></FormField>
            <FormField label="Refund Reference"><TextInput value={refundData.refundRef} onChange={(e) => setRefundData({ ...refundData, refundRef: e.target.value })} /></FormField>
            <FormField label="Remarks" className="col-span-2"><TextArea value={refundData.remarks} onChange={(e) => setRefundData({ ...refundData, remarks: e.target.value })} /></FormField>
            <FormField label="Refund Status" className="col-span-2"><Dropdown value={refundData.refundStatus} onChange={(v) => setRefundData({ ...refundData, refundStatus: v })} options={[{ label: 'Not Applicable', value: 'Not Applicable' }, { label: 'Pending', value: 'Pending' }, { label: 'Processed', value: 'Processed' }]} /></FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---- Reprint Screen ----
export function PosReprint() {
  const navigate = useNavigate();
  const { transactions, updateTransaction, user } = usePosStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [reprintTarget, setReprintTarget] = useState<PosTransaction | null>(null);
  const [printType, setPrintType] = useState('Financial Receipt');
  const [reason, setReason] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [previewTxn, setPreviewTxn] = useState<PosTransaction | null>(null);
  const [isReprint, setIsReprint] = useState(false);

  const filtered = useMemo(() => transactions.filter((t) => {
    if (t.txnStatus !== 'Completed') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.txnNo.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q);
  }), [transactions, search]);

  const handleReprint = () => {
    if (!reason.trim()) { toast.error('Reprint reason is required.'); return; }
    if (reprintTarget) {
      updateTransaction({ ...reprintTarget, reprintCount: reprintTarget.reprintCount + 1,
        audit: [...reprintTarget.audit, { action: 'Reprint', module: 'POS', ref: reprintTarget.receiptNo, user: user!.username, datetime: new Date().toISOString(), newValue: `Reprint #${reprintTarget.reprintCount + 1}: ${reason}` }] });
      setPreviewTxn({ ...reprintTarget, reprintCount: reprintTarget.reprintCount + 1 });
      setIsReprint(true);
      if (printType === 'Financial Receipt') setReceiptOpen(true);
      else setTicketsOpen(true);
      setReprintTarget(null);
      setReason('');
      toast.success('Reprint generated', `Reprint count: ${reprintTarget.reprintCount + 1}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <PageHeader title="Reprint" description="Search and reprint receipts and tickets" />
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Transaction No, Receipt No, or Customer Name..." className="input pl-9" />
        </div>
      </div>
      <div className="card mt-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-brown-400">No completed transactions found.</div>
        ) : (
          <div className="divide-y divide-brown-50">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-cream-50">
                <div>
                  <p className="text-sm font-medium text-brown-800">{t.txnNo} · {t.receiptNo}</p>
                  <p className="text-xs text-brown-400">{t.customerName} · {formatDate(t.datetime)} · {t.paymentMode} · Reprints: {t.reprintCount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-brown-900">{formatSGD(t.payableAmount)}</p>
                  <button onClick={() => { setPreviewTxn(t); setIsReprint(false); setReceiptOpen(true); }} className="btn-outline px-2 py-1 text-xs"><Receipt className="h-3 w-3" /> Receipt</button>
                  <button onClick={() => { setPreviewTxn(t); setIsReprint(false); setTicketsOpen(true); }} className="btn-outline px-2 py-1 text-xs"><Ticket className="h-3 w-3" /> Tickets</button>
                  <button onClick={() => setReprintTarget(t)} className="btn-saffron px-2 py-1 text-xs"><RefreshCw className="h-3 w-3" /> Reprint</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reprint Modal */}
      <Modal open={!!reprintTarget} onClose={() => setReprintTarget(null)} title="Reprint" size="md"
        footer={<><button className="btn-outline" onClick={() => setReprintTarget(null)}>Cancel</button><button className="btn-saffron" onClick={handleReprint}>Confirm Reprint</button></>}>
        {reprintTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-brown-400">Transaction No</p><p className="font-medium">{reprintTarget.txnNo}</p></div>
              <div><p className="text-xs text-brown-400">Receipt No</p><p className="font-medium">{reprintTarget.receiptNo}</p></div>
            </div>
            <FormField label="Print Type" required>
              <Dropdown value={printType} onChange={setPrintType} options={[
                { label: 'Financial Receipt', value: 'Financial Receipt' },
                { label: 'Operational Ticket', value: 'Operational Ticket' },
                { label: 'All Operational Tickets', value: 'All Operational Tickets' },
              ]} />
            </FormField>
            <FormField label="Reprint Reason" required>
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for reprint..." />
            </FormField>
          </div>
        )}
      </Modal>

      {receiptOpen && previewTxn && <ReceiptPreview txn={previewTxn} onClose={() => setReceiptOpen(false)} isReprint={isReprint} />}
      {ticketsOpen && previewTxn && <TicketsPreview txn={previewTxn} onClose={() => setTicketsOpen(false)} isReprint={isReprint} />}
    </div>
  );
}

// ---- Profile Screen ----
export function PosProfile() {
  const { user, updateProfile } = usePosStore();
  const toast = useToast();
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  if (!user) return null;

  const handleSave = () => {
    if (newPwd && newPwd !== confirmPwd) { toast.error('Passwords do not match.'); return; }
    updateProfile({ mobile });
    if (newPwd) toast.success('Profile updated', 'Mobile and password updated.');
    else toast.success('Profile updated', 'Mobile number updated.');
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <PageHeader title="Profile" description="View and update your profile" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-700 text-2xl font-semibold text-white">{user.name.charAt(0)}</div>
            <p className="mt-3 font-medium text-brown-800">{user.name}</p>
            <p className="text-sm text-brown-500">{user.designation}</p>
            <p className="text-xs text-brown-400">{user.role}</p>
          </div>
          <div className="mt-5 space-y-3 border-t border-brown-100 pt-4 text-sm">
            <div><p className="text-xs text-brown-400">Username</p><p className="font-medium text-brown-800">{user.username}</p></div>
            <div><p className="text-xs text-brown-400">Email</p><p className="font-medium text-brown-800">{user.email}</p></div>
            <div><p className="text-xs text-brown-400">Access Valid Until</p><p className="font-medium text-brown-800">{user.accessValidUntil}</p></div>
            <div><p className="text-xs text-brown-400">Status</p><StatusBadge status={user.status} /></div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Edit Profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name"><TextInput value={user.name} disabled /></FormField>
            <FormField label="Username"><TextInput value={user.username} disabled /></FormField>
            <FormField label="Role"><TextInput value={user.role} disabled /></FormField>
            <FormField label="Designation"><TextInput value={user.designation} disabled /></FormField>
            <FormField label="Email"><TextInput value={user.email} disabled /></FormField>
            <FormField label="Mobile Number"><TextInput value={mobile} onChange={(e) => setMobile(e.target.value)} /></FormField>
          </div>
          <div className="mt-6 border-t border-brown-100 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-brown-700">Change Password</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Current Password"><TextInput type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} /></FormField>
              <FormField label="New Password"><TextInput type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></FormField>
              <FormField label="Confirm Password"><TextInput type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} /></FormField>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="btn-primary" onClick={handleSave}>Save</button>
            <button className="btn-outline" onClick={() => { setMobile(user.mobile); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }}>Cancel</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Receipt Preview Component ----
function ReceiptPreview({ txn, onClose, isReprint = false }: { txn: PosTransaction; onClose: () => void; isReprint?: boolean }) {
  const toast = useToast();
  return (
    <Modal open={true} onClose={onClose} title="Financial Receipt" size="md"
      footer={<><button className="btn-outline" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={() => { window.print(); toast.success('Sent to printer.'); }}><Printer className="h-4 w-4" /> Print</button></>}>
      <div className="font-mono text-sm">
        {isReprint && <div className="mb-2 rounded border-2 border-red-500 bg-red-50 p-2 text-center text-lg font-bold text-red-600">REPRINT</div>}
        {txn.txnStatus === 'Cancelled' && <div className="mb-2 rounded border-2 border-red-500 bg-red-50 p-2 text-center text-lg font-bold text-red-600">CANCELLED</div>}
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-maroon-700 text-white"><Temple className="h-7 w-7" /></div>
          <p className="font-serif text-base font-bold">Sri Siva Durga Temple</p>
          <p className="text-xs text-brown-500">123 Serangoon Road, Singapore 218223</p>
          <p className="text-xs text-brown-500">Tel: +65 6234 5678</p>
        </div>
        <div className="my-3 border-t border-dashed border-brown-200" />
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Receipt No:</span><span className="font-bold">{txn.receiptNo}</span></div>
          <div className="flex justify-between"><span>Transaction No:</span><span>{txn.txnNo}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{formatDateTime(txn.datetime)}</span></div>
          <div className="flex justify-between"><span>POS User:</span><span>{txn.posUser}</span></div>
          {txn.customer && <>
            <div className="flex justify-between"><span>Customer:</span><span>{txn.customer.name}</span></div>
            <div className="flex justify-between"><span>Mobile:</span><span>{txn.customer.mobile}</span></div>
          </>}
        </div>
        <div className="my-3 border-t border-dashed border-brown-200" />
        <div className="space-y-2">
          {txn.lines.map((l, i) => (
            <div key={i} className="flex justify-between text-xs">
              <div><p>{l.name} × {l.qty}</p>{l.deities && l.deities.length > 0 && <p className="text-brown-400">Deities: {l.deities.join(', ')}</p>}{l.devoteeName && <p className="text-brown-400">{l.devoteeName} · {l.nakshatra}</p>}</div>
              <p className="font-medium">{formatSGD(l.grossAmount)}</p>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-brown-200" />
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Gross:</span><span>{formatSGD(txn.grossAmount)}</span></div>
          <div className="flex justify-between"><span>GST Included:</span><span>{formatSGD(txn.gstAmount)}</span></div>
          <div className="flex justify-between"><span>Ledger:</span><span>{formatSGD(txn.ledgerAmount)}</span></div>
          {Math.abs(txn.roundOff) > 0.001 && <div className="flex justify-between"><span>Round-off:</span><span>{formatSGD(txn.roundOff)}</span></div>}
          <div className="flex justify-between border-t border-brown-200 pt-1 text-sm font-bold"><span>TOTAL:</span><span>{formatSGD(txn.payableAmount)}</span></div>
          <div className="flex justify-between"><span>Payment:</span><span>{txn.paymentMode}</span></div>
          <div className="flex justify-between"><span>Reference:</span><span>{txn.paymentRef}</span></div>
        </div>
        <div className="my-3 border-t border-dashed border-brown-200" />
        <p className="text-center text-xs font-medium text-brown-500">GST Inclusive</p>
        <p className="text-center text-xs text-brown-500">Thank you for your devotion!</p>
        <p className="text-center text-xs text-brown-400">Om Namah Shivaya</p>
      </div>
    </Modal>
  );
}

// ---- Tickets Preview Component ----
function TicketsPreview({ txn, onClose, isReprint = false }: { txn: PosTransaction; onClose: () => void; isReprint?: boolean }) {
  const toast = useToast();
  const tickets = useMemo(() => {
    // Group by deity first, then printing group
    const groups: Record<string, PosCartLine[]> = {};
    for (const line of txn.lines) {
      const key = line.deities?.join(', ') || line.printingGroup;
      if (!groups[key]) groups[key] = [];
      groups[key].push(line);
    }
    return Object.entries(groups);
  }, [txn]);

  return (
    <Modal open={true} onClose={onClose} title="Operational Tickets" size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={() => { window.print(); toast.success('All tickets sent to printer.'); }}><Printer className="h-4 w-4" /> Print All Tickets</button></>}>
      <div className="space-y-4">
        {tickets.map(([groupKey, lines], idx) => (
          <div key={groupKey} className="rounded-lg border-2 border-brown-100 p-4">
            {isReprint && <div className="mb-2 rounded bg-red-50 p-1 text-center text-sm font-bold text-red-600">REPRINT</div>}
            {txn.txnStatus === 'Cancelled' && <div className="mb-2 rounded bg-red-50 p-1 text-center text-sm font-bold text-red-600">CANCELLED</div>}
            <div className="flex items-center justify-between border-b border-brown-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon-700 text-white"><Temple className="h-5 w-5" /></div>
                <div><p className="font-serif text-sm font-bold text-brown-900">Sri Siva Durga Temple</p><p className="text-xs text-brown-400">Ticket {idx + 1} of {tickets.length}</p></div>
              </div>
              <div className="text-right"><p className="text-xs text-brown-400">{txn.txnNo}</p></div>
            </div>
            <p className="mt-2 text-sm font-semibold text-maroon-700">{lines[0].deities && lines[0].deities.length > 0 ? `Deities: ${groupKey}` : `Group: ${groupKey}`}</p>
            <div className="mt-2 space-y-1">
              {lines.map((l, i) => (
                <div key={i} className="flex justify-between border-b border-brown-50 py-1 text-sm last:border-0">
                  <div>
                    <p className="font-medium text-brown-800">{l.name} × {l.qty}</p>
                    {l.devoteeName && <p className="text-xs text-brown-400">Name: {l.devoteeName} · {l.nakshatra}</p>}
                    {l.eventDate && <p className="text-xs text-brown-400">Date: {formatDate(l.eventDate)} · {l.session}</p>}
                  </div>
                  <p className="text-xs text-brown-500">{l.printingGroup}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
