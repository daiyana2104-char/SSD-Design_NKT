import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, X, Search, ShoppingCart, User, Phone, Mail, Clock, MapPin,
  Star, Calendar, ChevronRight, Facebook, Instagram, Youtube, Heart, CheckCircle2,
  Sparkles, Package, Plus, Minus, Trash2, ArrowLeft,
} from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { FormField, TextInput, TextArea, Dropdown } from '@/components/ui/Form';
import {
  banners, announcements, services, items, contactInfo, feedbacks,
  highlights, staticPages, menuItems, type Service, type Item,
} from '@/lib/mockData';
import { formatSGD, formatDate, formatDateTime, toInputDate, cn } from '@/lib/utils';

export function CustomerPortal() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number; date?: string; session?: string }[]>([]);

  const headerMenus = menuItems.filter((m) => m.type === 'Header' && m.status === 'Active' && m.parent === '-');
  const subMenus = menuItems.filter((m) => m.type === 'Header' && m.status === 'Active' && m.parent !== '-');

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === service.id);
      if (existing) return prev.map((c) => (c.id === service.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id: service.id, name: service.name, price: service.salePrice, qty: 1 }];
    });
    toast.success('Added to cart', `${service.name} added.`);
  };

  const updateQty = (id: string, delta: number) => setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartGst = cartTotal * 0.09;

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Top bar */}
      <div className="bg-maroon-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contactInfo.phone}</span>
            <span className="hidden items-center gap-1 sm:flex"><Mail className="h-3 w-3" /> {contactInfo.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 sm:flex"><Clock className="h-3 w-3" /> {contactInfo.hours}</span>
            <GlobalNav variant="dark" />
            <button onClick={() => navigate('/admin')} className="hover:text-gold-300">Admin Login</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-brown-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-700 text-white"><Temple className="h-6 w-6" /></div>
            <div><p className="font-serif text-lg font-semibold text-brown-900">Sri Siva Durga Temple</p><p className="text-xs text-brown-400">ஸ்ரீ சிவ துர்கா கோயில்</p></div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {headerMenus.map((m) => (
              <div key={m.id} className="group relative">
                <Link to={m.page} className="rounded-lg px-3 py-2 text-sm font-medium text-brown-700 hover:bg-cream-100 hover:text-maroon-700">{m.name}</Link>
                {subMenus.some((s) => s.parent === m.name) && (
                  <div className="absolute left-0 top-full hidden group-hover:block">
                    <div className="mt-1 w-48 overflow-hidden rounded-lg border border-brown-100 bg-white py-1 shadow-card-hover">
                      {subMenus.filter((s) => s.parent === m.name).map((s) => (
                        <Link key={s.id} to={s.page} className="block px-4 py-2 text-sm text-brown-600 hover:bg-cream-50 hover:text-maroon-700">{s.name}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-brown-600 hover:bg-cream-100">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-saffron-500 text-[10px] font-bold text-white">{cart.length}</span>}
            </button>
            <button className="rounded-lg p-2 text-brown-600 hover:bg-cream-100 lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-brown-100 bg-white px-4 py-2 lg:hidden">
            {headerMenus.map((m) => <Link key={m.id} to={m.page} className="block rounded-lg px-3 py-2 text-sm font-medium text-brown-700 hover:bg-cream-100" onClick={() => setMobileMenuOpen(false)}>{m.name}</Link>)}
          </div>
        )}
      </header>

      {/* Hero banner */}
      <section className="relative">
        <div className="relative h-[400px] overflow-hidden">
          <img src={banners[0].image} alt={banners[0].title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-maroon-950/80 to-maroon-900/40" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl px-4">
              <div className="max-w-lg text-white">
                <p className="mb-2 text-sm font-medium text-gold-300">Welcome to</p>
                <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">{banners[0].title}</h1>
                <p className="mt-3 text-base text-white/90">{banners[0].description}</p>
                <div className="mt-6 flex gap-3">
                  <Link to="#services" className="btn-saffron"><Sparkles className="h-4 w-4" /> Book a Service</Link>
                  <Link to="#about" className="btn-outline bg-white/10 text-white border-white/30 hover:bg-white/20">Learn More</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.filter((a) => a.status === 'Active').length > 0 && (
        <div className="bg-gold-50 border-b border-gold-100">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-brown-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[10px] font-bold text-white">!</span>
              <span className="font-medium">{announcements[0].title}:</span>
              <span className="truncate text-brown-600">{announcements[0].content}</span>
            </div>
          </div>
        </div>
      )}

      {/* Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-semibold text-brown-900">Temple Highlights</h2>
          <p className="mt-1 text-sm text-brown-500">Featured events, services, and offerings</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.id} className="card group overflow-hidden transition-all hover:shadow-card-hover">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-maroon-700 to-maroon-900 text-white">
                {h.contentType === 'Event' ? <Calendar className="h-12 w-12" /> : h.contentType === 'Service' ? <Sparkles className="h-12 w-12" /> : <Package className="h-12 w-12" />}
              </div>
              <div className="p-4">
                <span className="badge bg-gold-100 text-gold-800">{h.contentType}</span>
                <h3 className="mt-2 font-serif text-lg font-semibold text-brown-900">{h.selection}</h3>
                <p className="mt-1 text-xs text-brown-400">Until {formatDate(h.end)}</p>
                <button className="mt-3 flex items-center gap-1 text-sm font-medium text-maroon-600 hover:gap-2 transition-all">Learn more <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-2xl font-semibold text-brown-900">Book a Service</h2>
            <p className="mt-1 text-sm text-brown-500">Choose from our available pooja and seva services</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.filter((s) => s.portalAvailability && s.status === 'Active').map((service) => (
              <div key={service.id} className="card overflow-hidden transition-all hover:shadow-card-hover">
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-gold-100 to-cream-200 text-gold-600"><Temple className="h-14 w-14" /></div>
                <div className="p-4">
                  <h3 className="font-serif text-lg font-semibold text-brown-900">{service.name}</h3>
                  <p className="text-sm text-brown-400">{service.tamilName}</p>
                  <p className="mt-2 text-sm text-brown-600 line-clamp-2">{service.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-serif text-xl font-semibold text-maroon-700">{formatSGD(service.salePrice)}</p>
                    <button onClick={() => addToCart(service)} className="btn-primary px-3 py-1.5 text-sm"><Plus className="h-4 w-4" /> Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Items / Donations */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-semibold text-brown-900">Offerings & Donations</h2>
          <p className="mt-1 text-sm text-brown-500">Make an offering or donation online</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.filter((i) => i.portalAvailability && i.status === 'Active').map((item) => (
            <div key={item.id} className="card overflow-hidden transition-all hover:shadow-card-hover">
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-saffron-50 to-cream-200 text-saffron-600"><Package className="h-10 w-10" /></div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-brown-800">{item.name}</h3>
                <p className="text-xs text-brown-400">{item.tamilName}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-serif text-base font-semibold text-maroon-700">{formatSGD(item.salePrice)}</p>
                  <button onClick={() => {
                    setCart((prev) => {
                      const existing = prev.find((c) => c.id === item.id);
                      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
                      return [...prev, { id: item.id, name: item.name, price: item.salePrice, qty: 1 }];
                    });
                    toast.success('Added to cart', `${item.name} added.`);
                  }} className="btn-outline px-2 py-1 text-xs"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-brown-900">About Our Temple</h2>
              <p className="mt-4 text-sm leading-relaxed text-brown-600">{staticPages[0].content}</p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center"><p className="font-serif text-2xl font-bold text-maroon-700">40+</p><p className="text-xs text-brown-400">Years of Service</p></div>
                <div className="text-center"><p className="font-serif text-2xl font-bold text-maroon-700">10K+</p><p className="text-xs text-brown-400">Devotees</p></div>
                <div className="text-center"><p className="font-serif text-2xl font-bold text-maroon-700">50+</p><p className="text-xs text-brown-400">Services</p></div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl">
              <img src={banners[1].image} alt="Temple" className="h-64 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-semibold text-brown-900">Devotee Feedback</h2>
          <p className="mt-1 text-sm text-brown-500">What our devotees say</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {feedbacks.filter((f) => f.publicVisible && f.reviewStatus === 'Approved').map((f) => (
            <div key={f.id} className="card p-5">
              <div className="flex gap-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn('h-4 w-4', i < f.rating ? 'fill-gold-400 text-gold-400' : 'text-brown-200')} />)}</div>
              <p className="mt-3 text-sm text-brown-600">"{f.feedback}"</p>
              <p className="mt-3 text-sm font-medium text-brown-800">— {f.customer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-brown-900">Contact Us</h2>
              <p className="mt-2 text-sm text-brown-500">Visit us or get in touch</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-600"><MapPin className="h-5 w-5" /></div><div><p className="text-sm font-medium text-brown-700">Address</p><p className="text-sm text-brown-500">{contactInfo.address}</p></div></div>
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-600"><Phone className="h-5 w-5" /></div><div><p className="text-sm font-medium text-brown-700">Phone</p><p className="text-sm text-brown-500">{contactInfo.phone}</p></div></div>
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-600"><Mail className="h-5 w-5" /></div><div><p className="text-sm font-medium text-brown-700">Email</p><p className="text-sm text-brown-500">{contactInfo.email}</p></div></div>
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-600"><Clock className="h-5 w-5" /></div><div><p className="text-sm font-medium text-brown-700">Working Hours</p><p className="text-sm text-brown-500">{contactInfo.hours}</p></div></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Send an Enquiry</h3>
              <form onSubmit={(e) => { e.preventDefault(); toast.success('Enquiry sent', 'We will respond shortly.'); }} className="space-y-3">
                <FormField label="Your Name" required><TextInput placeholder="Enter your name" /></FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Email" required><TextInput type="email" placeholder="email@example.com" /></FormField>
                  <FormField label="Mobile" required><TextInput placeholder="+65 9XXX XXXX" /></FormField>
                </div>
                <FormField label="Subject" required><TextInput placeholder="Subject" /></FormField>
                <FormField label="Message" required><TextArea placeholder="Your message..." /></FormField>
                <button type="submit" className="btn-primary w-full">Send Enquiry</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Cart drawer (floating) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="card w-80 p-4 shadow-card-hover">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-brown-900">Your Cart ({cart.length})</h3>
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear</button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {cart.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1"><p className="font-medium text-brown-800">{c.name}</p><p className="text-xs text-brown-400">{formatSGD(c.price)} × {c.qty}</p></div>
                  <button onClick={() => updateQty(c.id, -1)} className="rounded p-1 hover:bg-cream-100"><Minus className="h-3 w-3" /></button>
                  <button onClick={() => updateQty(c.id, 1)} className="rounded p-1 hover:bg-cream-100"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => removeFromCart(c.id)} className="rounded p-1 text-red-400 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-brown-100 pt-3">
              <div className="flex justify-between text-sm text-brown-500"><span>Subtotal</span><span>{formatSGD(cartTotal)}</span></div>
              <div className="flex justify-between text-sm text-brown-500"><span>GST (9%)</span><span>{formatSGD(cartGst)}</span></div>
              <div className="flex justify-between border-t border-brown-100 pt-2 text-base font-semibold text-brown-900"><span>Total</span><span>{formatSGD(cartTotal + cartGst)}</span></div>
              <button onClick={() => { toast.success('Booking confirmed', 'Your services have been booked. Check your email for details.'); setCart([]); }} className="btn-primary mt-3 w-full">Proceed to Checkout</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-maroon-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-400 text-maroon-900"><Temple className="h-6 w-6" /></div>
                <div><p className="font-serif text-lg font-semibold">Sri Siva Durga Temple</p><p className="text-xs text-gold-300/80">ஸ்ரீ சிவ துர்கா கோயில்</p></div>
              </div>
              <p className="mt-4 max-w-md text-sm text-white/70">{contactInfo.address}</p>
              <p className="mt-2 text-sm text-white/70">{contactInfo.phone} · {contactInfo.email}</p>
              <div className="mt-4 flex gap-3">
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"><Facebook className="h-4 w-4" /></a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"><Instagram className="h-4 w-4" /></a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"><Youtube className="h-4 w-4" /></a>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-gold-300">Quick Links</p>
              <ul className="space-y-2 text-sm text-white/70">
                {menuItems.filter((m) => m.type === 'Footer' && m.status === 'Active').map((m) => <li key={m.id}><Link to={m.page} className="hover:text-white">{m.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-gold-300">Working Hours</p>
              <p className="text-sm text-white/70">{contactInfo.hours}</p>
              <p className="mt-2 text-sm text-white/70">Open every day including public holidays</p>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
            <p>© 2026 Sri Siva Durga Temple. All rights reserved. Made with <Heart className="inline h-3 w-3 fill-gold-400 text-gold-400" /> for devotees.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
