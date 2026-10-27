import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Ticket, Sparkles, AlertCircle, ArrowRight, Check, Building2, User } from 'lucide-react';
import { useAuth, Role } from '../context/AuthContext.tsx';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, switchDemoUser } = useAuth();

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialRole = (searchParams.get('role') as Role) || 'ATTENDEE';
  const redirectPath = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await login(email, password);
        if (user.role === 'ORGANIZER') {
          navigate('/organizer');
        } else if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate(redirectPath);
        }
      } else {
        const user = await register(name, email, password, role, organizationName);
        if (user.role === 'ORGANIZER') {
          navigate('/organizer');
        } else {
          navigate(redirectPath);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE') => {
    setError(null);
    setSubmitting(true);
    try {
      await switchDemoUser(demoRole);
      if (demoRole === 'ADMIN') navigate('/admin');
      else if (demoRole === 'ORGANIZER') navigate('/organizer');
      else navigate('/events');
    } catch (err: any) {
      setError('Failed to switch demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5c5c] to-[#ff8f70] flex items-center justify-center text-white shadow-md">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#1c0f2b]">
            Ticket<span className="text-[#ff5c5c]">Nest</span>
          </span>
        </Link>
        <p className="text-xs text-gray-500">
          {mode === 'login' ? 'Sign in to access reservations and dashboard' : 'Join TicketNest as an Attendee or Organizer'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick 1-Click Demo Showcase Box */}
        <div className="bg-[#231238] text-white p-4 rounded-2xl mb-6 shadow-lg border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ff8f70]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Account Quick Login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('ATTENDEE')}
              disabled={submitting}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition-colors text-xs cursor-pointer"
            >
              <div className="font-bold text-white">Attendee</div>
              <div className="text-[10px] text-white/60">Aarav Patel</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ORGANIZER')}
              disabled={submitting}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition-colors text-xs cursor-pointer"
            >
              <div className="font-bold text-[#ff8f70]">Organizer</div>
              <div className="text-[10px] text-white/60">PulseLive</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              disabled={submitting}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition-colors text-xs cursor-pointer"
            >
              <div className="font-bold text-[#ff5c5c]">Admin</div>
              <div className="text-[10px] text-white/60">Elena Rostova</div>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl border border-gray-200/90 shadow-xl space-y-6">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#1c0f2b] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#1c0f2b] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <>
                {/* Role Picker */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('ATTENDEE')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                        role === 'ATTENDEE'
                          ? 'border-[#ff5c5c] bg-[#fff8f6] font-bold text-[#1c0f2b]'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <User className="w-4 h-4 text-[#ff5c5c]" />
                      <span>Attendee</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('ORGANIZER')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                        role === 'ORGANIZER'
                          ? 'border-[#ff5c5c] bg-[#fff8f6] font-bold text-[#1c0f2b]'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[#ff5c5c]" />
                      <span>Organizer</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] focus:bg-white font-medium"
                  />
                </div>

                {role === 'ORGANIZER' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Organization / Brand Name</label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Apex Summits"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] focus:bg-white font-medium"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] focus:bg-white font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
