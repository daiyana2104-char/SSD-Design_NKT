import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Banknote, CreditCard, Smartphone,
  X, ArrowLeft, Receipt, User, CheckCircle2, Printer,
} from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Dropdown, FormField, TextInput } from '@/components/ui/Form';
import { items, services, customers, type Item, type Service } from '@/lib/mockData';
import { formatSGD, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CartLine { id: string; name: string; tamilName?: string; code: string; price: number; qty: number; type: 'Item' | 'Service'; }

const GST_RATE = 0.09;

export function PosCounter() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'items' | 'services'>('items');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [customer, setCustomer] = useState('Walk-in Customer');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ txnNo: string; receiptNo: string; lines: CartLine[]; gross: number; gst: number; total: number; paymentMode: string; customer: string } | null>(null);

  const availableItems = useMemo(() => items.filter((i) => i.status === 'Active' && (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))), [search]);
  const availableServices = useMemo(() => services.filter((s) => s.status === 'Active' && (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))), [search]);

  const addToCart = (item: Item | Service, type: 'Item' | 'Service') => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id: item.id, name: item.name, tamilName: item.tamilName, code: item.code, price: item.salePrice, qty: 1, type }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));
  };
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('Cart is empty', 'Add items before checkout.'); return; }
    setCheckoutOpen(false);
    const txnNo = 'POS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const receiptNo = 'RCP' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    setReceiptData({ txnNo, receiptNo, lines: cart, gross: subtotal, gst, total, paymentMode, customer });
    clearCart();
    toast.success('Payment completed', `${formatSGD(total)} received via ${paymentMode}.`);
  };

  const paymentModes = [
    { label: 'Cash', value: 'Cash', icon: Banknote },
    { label: 'NETS', value: 'NETS', icon: CreditCard },
    { label: 'PayNow', value: 'PayNow', icon: Smartphone },
  ];

  return (
    <div className="flex h-screen flex-col bg-cream-100">
      {/* POS Header */}
      <header className="flex h-14 items-center justify-between border-b border-brown-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="rounded-lg p-2 text-brown-600 hover:bg-cream-100"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon-700 text-white"><Temple className="h-5 w-5" /></div>
          <div><p className="font-serif text-sm font-semibold text-brown-900">Sri Siva Durga Temple</p><p className="text-[11px] text-brown-400">POS Counter</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-brown-500">{formatDateTime(new Date())}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-50 text-sm font-semibold text-maroon-700">L</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Product selection area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-brown-100 bg-white p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items or services..." className="input pl-9" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setTab('items')} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'items' ? 'bg-maroon-700 text-white' : 'bg-cream-100 text-brown-600 hover:bg-cream-200')}>Items</button>
              <button onClick={() => setTab('services')} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'services' ? 'bg-maroon-700 text-white' : 'bg-cream-100 text-brown-600 hover:bg-cream-200')}>Services</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {tab === 'items' ? availableItems.map((item) => (
                <button key={item.id} onClick={() => addToCart(item, 'Item')} className="card p-3 text-left transition-all hover:shadow-card-hover hover:border-maroon-200">
                  <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-cream-100 text-maroon-600"><Temple className="h-8 w-8" /></div>
                  <p className="text-sm font-medium text-brown-800">{item.name}</p>
                  {item.tamilName && <p className="text-xs text-brown-400">{item.tamilName}</p>}
                  <p className="mt-1 text-xs text-brown-400">{item.code}</p>
                  <p className="mt-2 font-serif text-base font-semibold text-maroon-700">{formatSGD(item.salePrice)}</p>
                </button>
              )) : availableServices.map((service) => (
                <button key={service.id} onClick={() => addToCart(service, 'Service')} className="card p-3 text-left transition-all hover:shadow-card-hover hover:border-maroon-200">
                  <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-gold-50 text-gold-600"><Temple className="h-8 w-8" /></div>
                  <p className="text-sm font-medium text-brown-800">{service.name}</p>
                  {service.tamilName && <p className="text-xs text-brown-400">{service.tamilName}</p>}
                  <p className="mt-1 text-xs text-brown-400">{service.code}</p>
                  <p className="mt-2 font-serif text-base font-semibold text-maroon-700">{formatSGD(service.salePrice)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="flex w-full max-w-md flex-col border-l border-brown-100 bg-white">
          <div className="flex items-center justify-between border-b border-brown-100 p-4">
            <div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-maroon-600" /><h2 className="font-serif text-lg font-semibold text-brown-900">Cart</h2></div>
            {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-500 hover:underline">Clear all</button>}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-brown-200" />
                <p className="mt-3 text-sm text-brown-400">Cart is empty</p>
                <p className="text-xs text-brown-300">Click items to add them</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 rounded-lg border border-brown-50 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brown-800">{line.name}</p>
                      <p className="text-xs text-brown-400">{line.code} · {formatSGD(line.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(line.id, -1)} className="rounded p-1 hover:bg-cream-100"><Minus className="h-4 w-4 text-brown-500" /></button>
                      <span className="w-8 text-center text-sm font-medium">{line.qty}</span>
                      <button onClick={() => updateQty(line.id, 1)} className="rounded p-1 hover:bg-cream-100"><Plus className="h-4 w-4 text-brown-500" /></button>
                    </div>
                    <p className="w-16 text-right text-sm font-semibold text-brown-900">{formatSGD(line.price * line.qty)}</p>
                    <button onClick={() => removeFromCart(line.id)} className="rounded p-1 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer & totals */}
          <div className="border-t border-brown-100 p-4">
            <div className="mb-3">
              <Dropdown value={customer} onChange={setCustomer} options={[{ label: 'Walk-in Customer', value: 'Walk-in Customer' }, ...customers.filter((c) => c.status === 'Active').map((c) => ({ label: c.name, value: c.name }))]} />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-brown-500"><span>Subtotal</span><span>{formatSGD(subtotal)}</span></div>
              <div className="flex justify-between text-brown-500"><span>GST (9%)</span><span>{formatSGD(gst)}</span></div>
              <div className="flex justify-between border-t border-brown-100 pt-2 text-base font-semibold text-brown-900"><span>Total</span><span>{formatSGD(total)}</span></div>
            </div>
            <button onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0} className="btn-primary mt-4 w-full py-3 text-base">
              <Receipt className="h-5 w-5" /> Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout" description={`Total: ${formatSGD(total)}`}
        footer={<><button className="btn-outline" onClick={() => setCheckoutOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleCheckout}><CheckCircle2 className="h-4 w-4" /> Complete Payment</button></>}>
        <div className="space-y-4">
          <FormField label="Customer"><TextInput value={customer} disabled /></FormField>
          <div>
            <label className="label">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentModes.map((m) => (
                <button key={m.value} onClick={() => setPaymentMode(m.value)}
                  className={cn('flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors', paymentMode === m.value ? 'border-maroon-500 bg-maroon-50' : 'border-brown-100 hover:border-brown-200')}>
                  <m.icon className={cn('h-6 w-6', paymentMode === m.value ? 'text-maroon-600' : 'text-brown-400')} />
                  <span className="text-sm font-medium text-brown-700">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-cream-50 p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-brown-500"><span>Subtotal</span><span>{formatSGD(subtotal)}</span></div>
              <div className="flex justify-between text-brown-500"><span>GST (9%)</span><span>{formatSGD(gst)}</span></div>
              <div className="flex justify-between border-t border-brown-200 pt-2 text-lg font-semibold text-brown-900"><span>Total</span><span>{formatSGD(total)}</span></div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!receiptData} onClose={() => setReceiptData(null)} title="Receipt" size="md"
        footer={<><button className="btn-outline" onClick={() => setReceiptData(null)}>Close</button><button className="btn-primary" onClick={() => toast.success('Receipt printed', 'Sent to printer.')}><Printer className="h-4 w-4" /> Print</button></>}>
        {receiptData && (
          <div className="font-mono text-sm">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-maroon-700 text-white"><Temple className="h-7 w-7" /></div>
              <p className="font-serif text-base font-bold">Sri Siva Durga Temple</p>
              <p className="text-xs text-brown-500">123 Serangoon Road, Singapore 218223</p>
              <p className="text-xs text-brown-500">Tel: +65 6234 5678</p>
            </div>
            <div className="my-3 border-t border-dashed border-brown-200" />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Receipt No:</span><span className="font-bold">{receiptData.receiptNo}</span></div>
              <div className="flex justify-between"><span>Transaction No:</span><span>{receiptData.txnNo}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{formatDateTime(new Date())}</span></div>
              <div className="flex justify-between"><span>Customer:</span><span>{receiptData.customer}</span></div>
              <div className="flex justify-between"><span>Payment:</span><span>{receiptData.paymentMode}</span></div>
            </div>
            <div className="my-3 border-t border-dashed border-brown-200" />
            <div className="space-y-2">
              {receiptData.lines.map((line) => (
                <div key={line.id} className="flex justify-between text-xs">
                  <div><p>{line.name}</p><p className="text-brown-400">{line.code} · {line.qty} × {formatSGD(line.price)}</p></div>
                  <p className="font-medium">{formatSGD(line.price * line.qty)}</p>
                </div>
              ))}
            </div>
            <div className="my-3 border-t border-dashed border-brown-200" />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatSGD(receiptData.gross)}</span></div>
              <div className="flex justify-between"><span>GST (9%):</span><span>{formatSGD(receiptData.gst)}</span></div>
              <div className="flex justify-between border-t border-brown-200 pt-1 text-sm font-bold"><span>TOTAL:</span><span>{formatSGD(receiptData.total)}</span></div>
            </div>
            <div className="my-3 border-t border-dashed border-brown-200" />
            <p className="text-center text-xs text-brown-500">Thank you for your devotion!</p>
            <p className="text-center text-xs text-brown-400">Om Namah Shivaya</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
