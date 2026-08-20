import { Link } from 'react-router-dom';
import { Shield, ShoppingCart, Globe, ArrowRight, Settings } from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';

export function Landing() {
  const apps = [
    { title: 'Admin Panel', description: 'Manage users, masters, transactions, inventory, content, and reports', icon: Shield, to: '/admin/login', color: 'maroon' },
    { title: 'POS Counter', description: 'Process counter sales, manage cart, and print receipts', icon: ShoppingCart, to: '/pos/login', color: 'saffron' },
    { title: 'Customer Portal', description: 'Book services, make offerings, and contact the temple', icon: Globe, to: '/portal', color: 'gold' },
  ];

  const colorMap: Record<string, string> = {
    maroon: 'bg-maroon-50 text-maroon-700 group-hover:bg-maroon-700 group-hover:text-white',
    saffron: 'bg-saffron-50 text-saffron-700 group-hover:bg-saffron-600 group-hover:text-white',
    gold: 'bg-gold-50 text-gold-700 group-hover:bg-gold-500 group-hover:text-white',
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-100 via-cream-50 to-gold-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-maroon-700 text-white shadow-card-hover">
            <Temple className="h-9 w-9" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brown-900 md:text-4xl">Sri Siva Durga Temple</h1>
          <p className="mt-1 font-serif text-lg text-brown-500">ஸ்ரீ சிவ துர்கா கோயில்</p>
          <p className="mt-3 text-sm text-brown-500">Temple Management System · Choose an application to continue</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {apps.map((app) => (
            <Link key={app.title} to={app.to} className={`card group p-6 transition-all hover:shadow-card-hover hover:-translate-y-1`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${colorMap[app.color]}`}>
                <app.icon className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-serif text-xl font-semibold text-brown-900">{app.title}</h2>
              <p className="mt-2 text-sm text-brown-500">{app.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-maroon-600 group-hover:gap-2 transition-all">
                Enter <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-brown-400">
          <Settings className="h-3 w-3" />
          <span>Frontend prototype with mock data · SGD currency · DD/MM/YYYY dates</span>
        </div>
      </div>
    </div>
  );
}
