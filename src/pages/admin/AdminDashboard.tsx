import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Globe, Banknote, CreditCard, Smartphone, Percent,
  Undo2, AlertTriangle, Users, Sparkles, Package, Plus, UserPlus, Calculator,
  Megaphone, ArrowUpRight, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, PageHeader } from '@/components/ui/StatusBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import {
  dashboardStats, dailyCollectionData, paymentModeData, posTransactions,
  portalBookings, lowStockItems, cancellations,
} from '@/lib/mockData';
import { formatSGD, formatDateTime } from '@/lib/utils';

export function AdminDashboard() {
  const toast = useToast();

  const statCards = [
    { label: "Today's Collections", value: formatSGD(dashboardStats.totalCollections), icon: DollarSign, color: 'maroon', sub: 'Total' },
    { label: "Today's POS Sales", value: formatSGD(dashboardStats.posSales), icon: ShoppingCart, color: 'saffron', sub: 'Counter' },
    { label: "Today's Online Bookings", value: formatSGD(dashboardStats.onlineBookings), icon: Globe, color: 'gold', sub: 'Portal' },
    { label: 'Cash Collection', value: formatSGD(dashboardStats.cashCollection), icon: Banknote, color: 'brown', sub: 'Today' },
    { label: 'NETS Collection', value: formatSGD(dashboardStats.netsCollection), icon: CreditCard, color: 'maroon', sub: 'Today' },
    { label: 'PayNow Collection', value: formatSGD(dashboardStats.paynowCollection), icon: Smartphone, color: 'saffron', sub: 'Today' },
    { label: 'Total GST Collected', value: formatSGD(dashboardStats.totalGst), icon: Percent, color: 'gold', sub: 'Today' },
    { label: 'Pending Cancellations', value: String(dashboardStats.pendingCancellations), icon: Undo2, color: 'saffron', sub: 'Requests' },
    { label: 'Pending Refunds', value: String(dashboardStats.pendingRefunds), icon: Undo2, color: 'brown', sub: 'Manual' },
    { label: 'Low-Stock Items', value: String(dashboardStats.lowStockItems), icon: AlertTriangle, color: 'saffron', sub: 'Alerts' },
    { label: 'Active Customers', value: String(dashboardStats.activeCustomers), icon: Users, color: 'maroon', sub: 'Registered' },
    { label: 'Active Services', value: String(dashboardStats.activeServices), icon: Sparkles, color: 'gold', sub: 'Available' },
    { label: 'Active Items', value: String(dashboardStats.activeItems), icon: Package, color: 'brown', sub: 'Available' },
  ];

  const colorMap: Record<string, string> = {
    maroon: 'bg-maroon-50 text-maroon-700', saffron: 'bg-saffron-50 text-saffron-700',
    gold: 'bg-gold-50 text-gold-700', brown: 'bg-brown-50 text-brown-700',
  };

  const quickActions = [
    { label: 'Create Item', icon: Plus, to: '/admin/items', action: () => toast.info('Opening Item Master') },
    { label: 'Create Service', icon: Sparkles, to: '/admin/services', action: () => toast.info('Opening Service Master') },
    { label: 'Create Customer', icon: UserPlus, to: '/admin/customers', action: () => toast.info('Opening Customer Master') },
    { label: 'Open POS', icon: Calculator, to: '/pos/login', action: () => toast.info('Opening POS Counter') },
    { label: 'View Bookings', icon: Globe, to: '/admin/portal-bookings', action: () => toast.info('Loading bookings') },
    { label: 'Add Inventory', icon: Package, to: '/admin/inventory-adjustment', action: () => toast.info('Opening Inventory') },
    { label: 'Add Announcement', icon: Megaphone, to: '/admin/announcements', action: () => toast.info('Opening Announcements') },
    { label: 'User Management', icon: Users, to: '/admin/users', action: () => toast.info('Opening Users') },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back, Suresh. Here's what's happening at the temple today."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[s.color]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-brown-300" />
            </div>
            <p className="mt-3 font-serif text-xl font-semibold text-brown-900">{s.value}</p>
            <p className="mt-0.5 text-xs text-brown-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-brown-900">Daily Collection</h3>
              <p className="text-xs text-brown-500">Last 7 days</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-4 w-4" /> +12.5%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyCollectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efe6e0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7a4e10' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7a4e10' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatSGD(Number(v))}
                contentStyle={{ borderRadius: 8, border: '1px solid #efe6e0', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#942237" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Payment Mode Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paymentModeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {paymentModeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatSGD(Number(v))} contentStyle={{ borderRadius: 8, border: '1px solid #efe6e0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="mt-6 p-5">
        <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              onClick={a.action}
              className="flex flex-col items-center gap-2 rounded-lg border border-brown-100 p-3 text-center transition-all hover:border-maroon-200 hover:bg-cream-50 hover:shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-700">
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-brown-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent transactions & bookings */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-brown-900">Recent POS Transactions</h3>
            <Link to="/admin/pos-transactions" className="text-xs font-medium text-maroon-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {posTransactions.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-brown-50 p-3 hover:bg-cream-50">
                <div>
                  <p className="text-sm font-medium text-brown-800">{t.txnNo}</p>
                  <p className="text-xs text-brown-400">{t.customer} · {formatDateTime(t.datetime)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brown-900">{formatSGD(t.gross)}</p>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-brown-900">Recent Portal Bookings</h3>
            <Link to="/admin/portal-bookings" className="text-xs font-medium text-maroon-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {portalBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-brown-50 p-3 hover:bg-cream-50">
                <div>
                  <p className="text-sm font-medium text-brown-800">{b.bookingNo}</p>
                  <p className="text-xs text-brown-400">{b.customer} · {b.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brown-900">{formatSGD(b.amount)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low stock & pending cancellations */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-brown-900">Low-Stock Alerts</h3>
            <Link to="/admin/low-stock" className="text-xs font-medium text-maroon-600 hover:underline">View report</Link>
          </div>
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-saffron-100 bg-saffron-50/50 p-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-saffron-500" />
                  <div>
                    <p className="text-sm font-medium text-brown-800">{item.name}</p>
                    <p className="text-xs text-brown-400">{item.code}</p>
                  </div>
                </div>
                <StatusBadge status="Low Stock" variant="warning" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-brown-900">Pending Cancellations</h3>
            <Link to="/admin/cancellations" className="text-xs font-medium text-maroon-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {cancellations.filter((c) => c.cancellationStatus === 'Requested').map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-brown-50 p-3 hover:bg-cream-50">
                <div>
                  <p className="text-sm font-medium text-brown-800">{c.refNo}</p>
                  <p className="text-xs text-brown-400">{c.customer} · {c.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brown-900">{formatSGD(c.originalAmount)}</p>
                  <StatusBadge status={c.cancellationStatus} />
                </div>
              </div>
            ))}
            {cancellations.filter((c) => c.cancellationStatus === 'Requested').length === 0 && (
              <p className="py-6 text-center text-sm text-brown-400">No pending cancellations</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
