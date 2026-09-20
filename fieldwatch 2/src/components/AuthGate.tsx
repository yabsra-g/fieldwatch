import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { User } from '../types';
import { RippleButton } from './RippleButton';

interface AuthGateProps {
  onSuccess: (user: User, token: string) => void;
  onBack?: () => void;
  initialMode?: 'login' | 'signup';
}

type Role = 'farmer' | 'admin';
type Mode = 'login' | 'signup';

const DISTRICTS = ['Kajiado North', 'Nakuru South', 'Machakos East', 'Kiambu West', 'Narok Central'];

// Demo-only credentials, pre-filled on the sign-in forms
const DEMO_ADMIN = { id: 'admin@fieldwatch.org', password: 'admin123' };
const DEMO_FARMER = { id: '+254 712 884 102', password: 'farmer123' };

const inputClass =
  'w-full border border-stone-300 rounded-md px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 bg-white';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-stone-700 mb-1">{label}</span>
    {children}
  </label>
);

export const AuthGate: React.FC<AuthGateProps> = ({ onSuccess, onBack, initialMode = 'login' }) => {
  const [role, setRole] = useState<Role>('farmer');
  const [mode, setMode] = useState<Mode>(initialMode);

  const [identifier, setIdentifier] = useState(initialMode === 'login' ? DEMO_FARMER.id : '');
  const [password, setPassword] = useState(initialMode === 'login' ? DEMO_FARMER.password : '');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [village, setVillage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'pending' | 'success'; text: string } | null>(null);

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  const switchRole = (next: Role) => {
    setRole(next);
    setMode('login');
    reset();
    // Demo: pre-fill a working account for whichever role is selected
    const demo = next === 'admin' ? DEMO_ADMIN : DEMO_FARMER;
    setIdentifier(demo.id);
    setPassword(demo.password);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    // The sign-up form starts empty; signing in again brings the demo farmer back
    setIdentifier(next === 'login' ? DEMO_FARMER.id : '');
    setPassword(next === 'login' ? DEMO_FARMER.password : '');
    reset();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.status === 'pending') setNotice({ kind: 'pending', text: data.error });
        else setError(data.error || 'Sign in failed. Check your details and try again.');
        return;
      }
      if (role === 'admin' && data.user.role !== 'admin') {
        setError('This account is not an administrator. Use the Farmer tab instead.');
        return;
      }
      onSuccess(data.user, data.token);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, district, village, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign up failed. Please try again.');
        return;
      }
      setNotice({
        kind: 'success',
        text: 'Account created. A district officer will review it, and you can sign in once it is approved.',
      });
      setName('');
      setPhone('');
      setVillage('');
      setPassword('');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = role === 'farmer' && mode === 'signup';

  return (
    <div className="relative min-h-screen bg-[#fbfbfb] flex flex-col items-center justify-center px-4 py-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute top-5 left-4 sm:left-8 flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex items-end gap-0.75 h-6" aria-hidden="true">
          <div className="w-1.5 h-3.5 bg-stone-950 rounded-xs" />
          <div className="w-1.5 h-6 bg-stone-950 rounded-xs" />
          <div className="w-1.5 h-4 bg-stone-950 rounded-xs" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-stone-950">FieldWatch</span>
      </div>

      <div className="w-full max-w-sm bg-white border border-stone-200 rounded-lg shadow-xs p-6 fw-fade-up">
        {/* Role switch */}
        <div className="grid grid-cols-2 border border-stone-200 rounded-md p-0.5 bg-stone-50 mb-6">
          {(['farmer', 'admin'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchRole(r)}
              className={`py-2 text-xs font-semibold rounded-sm transition cursor-pointer ${
                role === r ? 'bg-stone-950 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {r === 'farmer' ? 'Farmer' : 'Admin'}
            </button>
          ))}
        </div>

        <h1 className="text-lg font-extrabold text-stone-950">
          {isSignup ? 'Create your account' : role === 'admin' ? 'Admin sign in' : 'Welcome back'}
        </h1>
        <p className="text-xs text-stone-500 mt-1 mb-5">
          {isSignup
            ? 'Register as a farmer to report cases and get alerts.'
            : role === 'admin'
            ? 'For district veterinary and agricultural officers.'
            : 'Sign in with your phone number to continue.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div
            className={`mb-4 p-3 border rounded-md flex items-start gap-2 text-xs ${
              notice.kind === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {notice.kind === 'pending' ? (
              <Clock className="w-4 h-4 shrink-0 mt-px" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {isSignup ? (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <Field label="Full name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jane Wanjiku" />
            </Field>
            <Field label="Phone number">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+254 7XX XXX XXX" inputMode="tel" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="District">
                <select className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Village">
                <input className={inputClass} value={village} onChange={(e) => setVillage(e.target.value)} required />
              </Field>
            </div>
            <Field label="Password">
              <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
            </Field>
            <RippleButton
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5"
              wrapperClassName="!block w-full"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </RippleButton>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <Field label={role === 'admin' ? 'Email' : 'Phone number'}>
              <input
                className={inputClass}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={role === 'admin' ? 'admin@fieldwatch.org' : '+254 7XX XXX XXX'}
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <RippleButton
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5"
              wrapperClassName="!block w-full"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </RippleButton>
          </form>
        )}

        {!isSignup && (
          <p className="text-[11px] text-stone-400 text-center mt-4">
            Demo mode: {role} details are filled in for you.
          </p>
        )}

        {role === 'farmer' && (
          <p className="text-xs text-stone-500 text-center mt-5">
            {mode === 'login' ? 'New to FieldWatch?' : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-stone-900 underline underline-offset-2 hover:text-stone-600 cursor-pointer"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
