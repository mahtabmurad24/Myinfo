import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, AlertCircle, Info, User, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [bypassCode, setBypassCode] = useState('');
  const [isBypassVerified, setIsBypassVerified] = useState(false);
  const [showBypassInput, setShowBypassInput] = useState(false);
  const [isVerifyingBypass, setIsVerifyingBypass] = useState(false);
  const [certify, setCertify] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupStatus, setSignupStatus] = useState<{ enabled: boolean, limit: number, current: number, remaining: number | null, bypass_required: boolean, has_active_bypass: boolean } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    fetch('/api/auth/signup-status')
      .then(res => res.json())
      .then(setSignupStatus)
      .catch(err => {
        console.error(err);
        setSignupStatus({ enabled: true, limit: 0, current: 0, remaining: null });
      });
  }, []);

  const handleVerifyBypass = async () => {
    if (bypassCode.length !== 6) return;
    setIsVerifyingBypass(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: bypassCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsBypassVerified(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifyingBypass(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certify) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          phone_number: phone,
          bypass_code: bypassCode 
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      login(data.token, data.user);
      
      if (location.state?.username) {
        navigate('/setup', { state: { username: location.state.username } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Create Account</h1>
          <p className="text-gray-400">Join thousands of professionals today.</p>
          {signupStatus && signupStatus.limit > 0 && (
            <div className="mt-4 inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {signupStatus.remaining} Accounts Remaining Today
            </div>
          )}
        </div>

        {signupStatus === null ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (!signupStatus.enabled && !isBypassVerified) ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Signups Paused</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Admin stop creating new user
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm text-left">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {!showBypassInput ? (
              <button
                onClick={() => setShowBypassInput(true)}
                className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold transition-all text-lg"
              >
                Bypass Code
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    maxLength={6}
                    value={bypassCode}
                    onChange={(e) => setBypassCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-mono tracking-[0.5em] text-center text-xl"
                    placeholder="000000"
                  />
                </div>
                <button
                  onClick={handleVerifyBypass}
                  disabled={isVerifyingBypass || bypassCode.length !== 6}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 rounded-xl font-bold transition-all text-lg flex items-center justify-center gap-2"
                >
                  {isVerifyingBypass ? 'Verifying...' : 'Verify Code'} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowBypassInput(false)}
                  className="text-sm text-gray-500 hover:text-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="pt-4">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-blue-400 hover:underline font-bold text-lg"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-base">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {isBypassVerified && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3 text-base">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Bypass code verified! You can now create your account.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field for basic bot protection */}
              <div className="hidden">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-400 mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-base font-medium text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    placeholder="••••••••"
                  />
                </div>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-10 bottom-full left-0 mb-2 w-full p-3 bg-red-600 rounded-xl text-sm text-white flex items-start gap-2 shadow-2xl"
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <p>Please use a unique password that you do not use for your email or other sensitive accounts.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="certify"
                  required
                  checked={certify}
                  onChange={(e) => setCertify(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="certify" className="text-base text-gray-400">
                  I certify that all the information I have provided is correct.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !certify || (signupStatus?.limit! > 0 && signupStatus?.remaining! <= 0)}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xl"
              >
                {isLoading ? 'Creating Account...' : (signupStatus?.limit! > 0 && signupStatus?.remaining! <= 0 ? 'Limit Reached' : 'Sign Up')} <ArrowRight className="w-6 h-6" />
              </button>
            </form>

            <p className="mt-8 text-center text-gray-500 text-base">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:underline">Log in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
