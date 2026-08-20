import { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormField, TextInput, Dropdown } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { items, services, posTransactions, payments } from '@/lib/mockData';
import { exportCSV } from '@/lib/adminStore';
import { formatSGD, formatDate } from '@/lib/utils';

function ReportPage({ title, description, columns, data, totalLabel, totalValue, searchKeys }: {
  title: string; description: string; columns: Column<any>[]; data: any[]; totalLabel?: string; totalValue?: string; searchKeys?: string[];
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterVal, setFilterVal] = useState('');

  const filtered = useMemo(() => {
    let result = data;
    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((r) => searchKeys.some((k) => String((r as any)[k] ?? '').toLowerCase().includes(q)));
    }
    return result;
  }, [data, search, searchKeys]);

  const handleExport = () => {
    const headers = columns.map((c) => c.header);
    const rows = filtered.map((r) => columns.map((c) => c.render ? String(c.render(r) ?? '') : String((r as any)[c.key] ?? '')));
    exportCSV(`${title.replace(/\s+/g, '-').toLowerCase()}.csv`, headers, rows);
    toast.success('Exported', 'CSV file downloaded.');
  };

  return (
    <div>
      <PageHeader title={title} description={description}
        actions={<button className="btn-outline" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</button>} />
      <Card className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {searchKeys && (
            <div className="relative">
              <Search className="absolute left-3 top-9 h-4 w-4 text-brown-300" />
              <FormField label="Search"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input pl-9" /></FormField>
            </div>
          )}
          <FormField label="From Date"><TextInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></FormField>
          <FormField label="To Date"><TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></FormField>
          <FormField label="Filter By"><Dropdown value={filterVal} onChange={setFilterVal} options={[{ label: 'All', value: '' }]} /></FormField>
        </div>
      </Card>
      {totalLabel && (
        <Card className="mb-4 flex items-center justify-between p-4">
          <span className="text-sm font-medium text-brown-700">{totalLabel}</span>
          <span className="font-serif text-xl font-semibold text-maroon-700">{totalValue}</span>
        </Card>
      )}
      <div className="card"><DataTable columns={columns} data={filtered} /></div>
    </div>
  );
}

export function PosSalesReport() {
  const completed = posTransactions.filter((t) => t.status === 'Completed');
  const totalSales = completed.reduce((s, t) => s + t.gross, 0);
  const columns: Column<any>[] = [
    { key: 'txnNo', header: 'Transaction No', render: (t) => <span className="text-maroon-700">{t.txnNo}</span> },
    { key: 'receiptNo', header: 'Receipt No' },
    { key: 'customer', header: 'Customer' },
    { key: 'type', header: 'Type', render: (t) => <StatusBadge status={t.type ?? 'Item'} variant="neutral" /> },
    { key: 'items', header: 'Item', render: (t) => t.items.map((i: any) => i.name).join(', ') },
    { key: 'bookingDate', header: 'Booking Date', render: (t) => formatDate(t.datetime) },
    { key: 'category', header: 'Category', render: () => 'General' },
    { key: 'paymentMode', header: 'Payment Mode' },
    { key: 'gross', header: 'Gross', align: 'right', render: (t) => formatSGD(t.gross) },
    { key: 'gst', header: 'GST', align: 'right', render: (t) => formatSGD(t.gst) },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'datetime', header: 'Date', render: (t) => formatDate(t.datetime) },
  ];
  return <ReportPage title="POS Sales Report" description="All POS sales transactions" columns={columns} data={posTransactions} searchKeys={['txnNo', 'receiptNo', 'customer', 'paymentMode']}
    totalLabel={`Total Sales Count: ${completed.length} | Total Sales Amount`} totalValue={formatSGD(totalSales)} />;
}

export function ItemSalesReport() {
  const columns: Column<any>[] = [
    { key: 'code', header: 'Code', render: (i) => <span className="text-maroon-700">{i.code}</span> },
    { key: 'name', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'qtySold', header: 'Qty Sold', align: 'center', render: () => Math.floor(Math.random() * 50) },
    { key: 'salePrice', header: 'Unit Price', align: 'right', render: (i) => formatSGD(i.salePrice) },
    { key: 'total', header: 'Total Sales', align: 'right', render: (i) => formatSGD(i.salePrice * 25) },
  ];
  return <ReportPage title="Item Sales Report" description="Sales breakdown by item" columns={columns} data={items} searchKeys={['code', 'name', 'category']} totalLabel="Total Item Sales" totalValue={formatSGD(items.reduce((s, i) => s + i.salePrice * 25, 0))} />;
}

export function ServiceSalesReport() {
  const columns: Column<any>[] = [
    { key: 'code', header: 'Code', render: (s) => <span className="text-maroon-700">{s.code}</span> },
    { key: 'name', header: 'Service Name' },
    { key: 'qtySold', header: 'Qty Sold', align: 'center', render: () => Math.floor(Math.random() * 30) },
    { key: 'total', header: 'Total Sales', align: 'right', render: (s) => formatSGD(s.salePrice * 15) },
  ];
  return <ReportPage title="Service Sales Report" description="Sales breakdown by service" columns={columns} data={services} searchKeys={['code', 'name']} totalLabel="Total Service Sales" totalValue={formatSGD(services.reduce((s, i) => s + i.salePrice * 15, 0))} />;
}

export function GstReport() {
  const columns: Column<any>[] = [
    { key: 'txnNo', header: 'Transaction No' },
    { key: 'paymentMode', header: 'Payment Mode' },
    { key: 'gross', header: 'Gross Amount', align: 'right', render: (p) => formatSGD(p.gross) },
    { key: 'gst', header: 'GST Amount', align: 'right', render: (p) => formatSGD(p.gst) },
    { key: 'datetime', header: 'Date', render: (p) => formatDate(p.datetime) },
  ];
  return <ReportPage title="GST Report" description="GST collected from transactions" columns={columns} data={payments} searchKeys={['txnNo', 'paymentMode']} totalLabel="Total GST Collected" totalValue={formatSGD(payments.reduce((s, p) => s + p.gst, 0))} />;
}

export function PaymentReport() {
  const columns: Column<any>[] = [
    { key: 'txnNo', header: 'Order ID', render: (p) => <span className="text-maroon-700">{p.txnNo}</span> },
    { key: 'customer', header: 'Name' },
    { key: 'serviceName', header: 'Service Name', render: () => '-' },
    { key: 'itemName', header: 'Item Name', render: () => '-' },
    { key: 'paymentMode', header: 'Payment Mode' },
    { key: 'gross', header: 'Gross Amount', align: 'right', render: (p) => formatSGD(p.gross) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'datetime', header: 'Date', render: (p) => formatDate(p.datetime) },
  ];
  return <ReportPage title="Payment Report" description="All payments by mode" columns={columns} data={payments} searchKeys={['txnNo', 'customer', 'paymentMode']} totalLabel="Total Payments" totalValue={formatSGD(payments.reduce((s, p) => s + p.gross, 0))} />;
}
