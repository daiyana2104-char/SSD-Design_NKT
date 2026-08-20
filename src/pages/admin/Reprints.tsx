import { useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Modal } from '@/components/ui/Modal';
import { FormField, TextArea, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAdminStore, exportCSV } from '@/lib/adminStore';
import { posTransactions, type PosTransaction } from '@/lib/mockData';
import { formatSGD, formatDate, formatDateTime } from '@/lib/utils';

export function Reprints() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [reprintTarget, setReprintTarget] = useState<PosTransaction | null>(null);
  const [printType, setPrintType] = useState('Financial Receipt');
  const [reason, setReason] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [viewItem, setViewItem] = useState<PosTransaction | null>(null);

  const filtered = posTransactions.filter((t) => t.status === 'Completed' && (
    !search || t.txnNo.toLowerCase().includes(search.toLowerCase()) || t.receiptNo.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase())
  ));

  const handleReprint = () => {
    if (!reason.trim()) { toast.error('Reprint reason is required.'); return; }
    addAudit('Reprinted', 'Reprints', `Reprint of ${reprintTarget?.receiptNo}: ${reason}`);
    toast.success('Reprint generated', `${printType} for ${reprintTarget?.receiptNo} sent to printer.`);
    setReprintTarget(null);
    setReason('');
    setPrintType('Financial Receipt');
  };

  const columns: Column<PosTransaction>[] = [
    { key: 'txnNo', header: 'Transaction No', render: (t) => <span className="font-medium text-maroon-700">{t.txnNo}</span> },
    { key: 'receiptNo', header: 'Receipt No' },
    { key: 'customer', header: 'Customer' },
    { key: 'gross', header: 'Amount', align: 'right', render: (t) => formatSGD(t.gross) },
    { key: 'paymentMode', header: 'Payment' },
    { key: 'datetime', header: 'Date', render: (t) => formatDate(t.datetime) },
    { key: 'actions', header: 'Actions', align: 'center', render: (t) => (
      <div className="flex justify-center gap-1">
        <button onClick={() => setViewItem(t)} className="rounded p-1.5 text-brown-500 hover:bg-cream-100" title="View"><Eye className="h-4 w-4" /></button>
        <button onClick={() => setReprintTarget(t)} className="rounded p-1.5 text-saffron-600 hover:bg-saffron-50" title="Reprint"><RefreshCw className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Reprints" description="Search and reprint receipts and tickets"
        actions={<button className="btn-outline" onClick={() => exportCSV('reprint-eligible.csv', ['Transaction No', 'Receipt No', 'Customer', 'Amount', 'Date'], filtered.map((t) => [t.txnNo, t.receiptNo, t.customer, t.gross, formatDate(t.datetime)]))}>Export CSV</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} searchPlaceholder="Search by Transaction No, Receipt No, or Customer..." /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={!!reprintTarget} onClose={() => setReprintTarget(null)} title="Reprint" size="md"
        footer={<><button className="btn-outline" onClick={() => setReprintTarget(null)}>Cancel</button><button className="btn-saffron" onClick={handleReprint}>Confirm Reprint</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-brown-400">Transaction No</p><p className="font-medium">{reprintTarget?.txnNo}</p></div>
            <div><p className="text-xs text-brown-400">Receipt No</p><p className="font-medium">{reprintTarget?.receiptNo}</p></div>
          </div>
          <FormField label="Print Type" required>
            <Dropdown value={printType} onChange={setPrintType} options={[{ label: 'Financial Receipt', value: 'Financial Receipt' }, { label: 'Operational Ticket', value: 'Operational Ticket' }, { label: 'All Operational Tickets', value: 'All Operational Tickets' }]} />
          </FormField>
          <FormField label="Reprint Reason" required><TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for reprint..." /></FormField>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Transaction ${viewItem?.txnNo ?? ''}`} size="md"
        footer={<button className="btn-outline" onClick={() => setViewItem(null)}>Close</button>}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-brown-400">Receipt No</p><p className="font-medium">{viewItem.receiptNo}</p></div>
              <div><p className="text-xs text-brown-400">Customer</p><p className="font-medium">{viewItem.customer}</p></div>
              <div><p className="text-xs text-brown-400">Date</p><p className="font-medium">{formatDateTime(viewItem.datetime)}</p></div>
              <div><p className="text-xs text-brown-400">Payment</p><p className="font-medium">{viewItem.paymentMode}</p></div>
            </div>
            <div>
              <p className="mb-1 text-xs text-brown-400">Items</p>
              {viewItem.items.map((it, i) => <div key={i} className="flex justify-between border-b border-brown-50 py-1"><span>{it.name} × {it.qty}</span><span>{formatSGD(it.price * it.qty)}</span></div>)}
            </div>
            <div className="space-y-1 border-t border-brown-100 pt-2">
              <div className="flex justify-between"><span className="text-brown-500">Subtotal</span><span className="font-medium">{formatSGD(viewItem.gross)}</span></div>
              <div className="flex justify-between"><span className="text-brown-500">GST</span><span className="font-medium">{formatSGD(viewItem.gst)}</span></div>
              <div className="flex justify-between border-t border-brown-100 pt-1 text-base"><span className="font-semibold text-maroon-700">Total Amount</span><span className="font-bold text-maroon-700">{formatSGD(viewItem.gross)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function CancellationRequests() {
  const { addAudit } = useAdminStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [data, setData] = useState([
    { id: 'cr1', refNo: 'BKG20260729005', source: 'Portal Booking', customer: 'Geetha Nair', originalAmount: 150, reason: 'Unable to attend', status: 'Requested', remarks: '' },
    { id: 'cr2', refNo: 'POS20260728012', source: 'POS', customer: 'Rajendran Mohan', originalAmount: 80, reason: 'Duplicate payment', status: 'Approved', remarks: 'Approved - refund processing' },
    { id: 'cr3', refNo: 'BKG20260728008', source: 'Portal Booking', customer: 'Senthil Kumar', originalAmount: 50, reason: 'Service unavailable', status: 'Rejected', remarks: 'Outside cancellation window' },
    { id: 'cr4', refNo: 'HALL2026080001', source: 'Hall Booking', customer: 'Rajendran Mohan', originalAmount: 800, reason: 'Event cancelled', status: 'Requested', remarks: '' },
  ]);

  const filtered = data.filter((d) => {
    const m = !search || d.refNo.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase());
    const s = !statusFilter || d.status === statusFilter;
    return m && s;
  });

  const handleApprove = () => {
    if (!remarks.trim()) { toast.error('Remarks are required for approval.'); return; }
    setData(data.map((d) => d.id === approveTarget.id ? { ...d, status: 'Approved', remarks } : d));
    addAudit('Approved Cancellation', 'Cancellation Requests', `Approved ${approveTarget.refNo}: ${remarks}`);
    toast.success('Cancellation approved', `${approveTarget.refNo} has been approved.`);
    setApproveTarget(null);
    setRemarks('');
  };

  const handleReject = () => {
    if (!remarks.trim()) { toast.error('Remarks are required for rejection.'); return; }
    setData(data.map((d) => d.id === rejectTarget.id ? { ...d, status: 'Rejected', remarks } : d));
    addAudit('Rejected Cancellation', 'Cancellation Requests', `Rejected ${rejectTarget.refNo}: ${remarks}`);
    toast.info('Cancellation rejected', `${rejectTarget.refNo} has been rejected.`);
    setRejectTarget(null);
    setRemarks('');
  };

  const columns: Column<any>[] = [
    { key: 'refNo', header: 'Reference No', render: (d) => <span className="font-medium text-maroon-700">{d.refNo}</span> },
    { key: 'source', header: 'Source' },
    { key: 'customer', header: 'Customer' },
    { key: 'originalAmount', header: 'Original Amount', align: 'right', render: (d) => formatSGD(d.originalAmount) },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex justify-center gap-1">
        {d.status === 'Requested' && <>
          <button onClick={() => { setApproveTarget(d); setRemarks(''); }} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">Approve</button>
          <button onClick={() => { setRejectTarget(d); setRemarks(''); }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Reject</button>
        </>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Cancellation Requests" description="Approve or reject cancellation requests from all sources"
        actions={<button className="btn-outline" onClick={() => exportCSV('cancellation-requests.csv', ['Reference', 'Source', 'Customer', 'Amount', 'Reason', 'Status'], filtered.map((d) => [d.refNo, d.source, d.customer, d.originalAmount, d.reason, d.status]))}>Export CSV</button>} />
      <div className="card p-4"><SearchFilterBar search={search} onSearch={setSearch} filters={[{ label: 'Status', value: statusFilter, options: [{ label: 'All', value: '' }, { label: 'Requested', value: 'Requested' }, { label: 'Approved', value: 'Approved' }, { label: 'Rejected', value: 'Rejected' }], onChange: setStatusFilter }]} /></div>
      <div className="card mt-4"><DataTable columns={columns} data={filtered} /></div>

      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Cancellation" size="md"
        footer={<><button className="btn-outline" onClick={() => setApproveTarget(null)}>Cancel</button><button className="btn-primary" onClick={handleApprove}>Approve</button></>}>
        {approveTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-brown-400">Reference</p><p className="font-medium">{approveTarget.refNo}</p></div>
              <div><p className="text-xs text-brown-400">Customer</p><p className="font-medium">{approveTarget.customer}</p></div>
              <div><p className="text-xs text-brown-400">Amount</p><p className="font-medium">{formatSGD(approveTarget.originalAmount)}</p></div>
              <div><p className="text-xs text-brown-400">Reason</p><p className="font-medium">{approveTarget.reason}</p></div>
            </div>
            <FormField label="Remarks" required><TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter approval remarks..." /></FormField>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Cancellation" size="md"
        footer={<><button className="btn-outline" onClick={() => setRejectTarget(null)}>Cancel</button><button className="btn-danger" onClick={handleReject}>Reject</button></>}>
        {rejectTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-brown-400">Reference</p><p className="font-medium">{rejectTarget.refNo}</p></div>
              <div><p className="text-xs text-brown-400">Customer</p><p className="font-medium">{rejectTarget.customer}</p></div>
              <div><p className="text-xs text-brown-400">Amount</p><p className="font-medium">{formatSGD(rejectTarget.originalAmount)}</p></div>
              <div><p className="text-xs text-brown-400">Reason</p><p className="font-medium">{rejectTarget.reason}</p></div>
            </div>
            <FormField label="Remarks" required><TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter rejection reason..." /></FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
