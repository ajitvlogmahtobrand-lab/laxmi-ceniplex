import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_MASTER_PASSWORD } from '../../services/security';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
  onNavigateForgotPassword: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onNavigateHome,
  onNavigateForgotPassword,
}) => {
  const { loginAdmin } = useAuth();

  const [username, setUsername] = useState('rajanbhogta');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-accept password as soon as the authorized password is typed or pasted
  useEffect(() => {
    if (password.trim() === ADMIN_MASTER_PASSWORD && !isSubmitting) {
      performLogin(username, password.trim());
    }
  }, [password, username]);

  const performLogin = async (usr: string, pwd: string) => {
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdmin(usr, pwd);
      if (res.success) {
        setFeedback({ message: res.message, isError: false });
        setTimeout(() => onSuccess(), 350);
      } else {
        setFeedback({ message: 'Incorrect administrator password.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Authentication error', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    await performLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4 relative antialiased text-[#171923]">
      {/* Background ambient red glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Top return link */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-1.5 text-xs text-[#667085] hover:text-[#171923] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Website</span>
          </button>
          <span className="text-[10px] font-mono text-[#E31837] uppercase tracking-wider font-bold">
            SECURE PORTAL
          </span>
        </div>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E31837] to-[#b31028] flex items-center justify-center mx-auto shadow-md shadow-red-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#171923] font-cinema tracking-tight">
            Laxmi Cineplex Admin
          </h1>
          <p className="text-xs text-[#667085]">
            Management Authentication (Hazaribagh Control Panel)
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 border ${
              feedback.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {feedback.isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Administrator Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="rajanbhogta"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-red-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-700 font-semibold">
                Admin Password *
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-[11px] text-[#E31837] hover:underline font-semibold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-red-500/10 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#E31837] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-700/20 transition-all text-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
          </button>

          <div className="pt-2 flex items-center justify-center text-[11px]">
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-slate-500 hover:text-[#E31837] hover:underline cursor-pointer"
            >
              Account Recovery & Key Verification
            </button>
          </div>
        </form>

        {/* Security Notice Footer */}
        <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-4">
          All administrative sessions are cryptographically audited and bound to actor <strong>rajanbhogta</strong>.
        </div>
      </div>
    </div>
  );
};
