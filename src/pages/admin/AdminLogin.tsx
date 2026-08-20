import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Temple } from '@/components/ui/TempleIcon';
import { GlobalNav } from '@/components/ui/GlobalNav';
import { useAdminStore } from '@/lib/adminStore';
import { formatDateTime } from '@/lib/utils';

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    const result = login(email, password);
    if (!result.ok) { setError(result.error || 'Login failed.'); return; }
    navigate('/admin');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-100 via-cream-50 to-gold-50 p-4">
      <div className="mb-6"><GlobalNav /></div>
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-maroon-700 text-white shadow-card-hover">
              <Temple className="h-9 w-9" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-brown-900">Sri Siva Durga Temple</h1>
            <p className="text-sm text-brown-500">Admin Panel Login</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Enter email" autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base">
              <LogIn className="h-5 w-5" /> Login
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-brown-100 pt-4 text-xs text-brown-400">
            <span>v1.0.0</span>
            <span>{formatDateTime(now)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-cream-50 p-3 text-center text-xs text-brown-400">
          <p>Demo: <strong>admin@ssdtemple.sg</strong> / <strong>Temple@123</strong></p>
        </div>
      </div>
    </div>
  );
}
