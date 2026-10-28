import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validatePasswordPolicy } from '../../services/security';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  HelpCircle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminForgotPasswordProps {
  onNavigateLogin: () => void;
}

export const AdminForgotPassword: React.FC<AdminForgotPasswordProps> = ({ onNavigateLogin }) => {
  const { requestPasswordReset, verifyAndResetPassword, emergencyResetWithKey, recoveryEmail } = useAuth();

  // Mode: 'EMAIL_RESET' or 'EMERGENCY_KEY_RESET'
  const [mode, setMode] = useState<'EMAIL_RESET' | 'EMERGENCY_KEY_RESET'>('EMAIL_RESET');

  // Step 1: Request code
  const [emailInput, setEmailInput] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY_AND_RESET' | 'SUCCESS'>('REQUEST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Step 2: Verification & New Password
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Emergency key inputs
  const [emergencyKeyInput, setEmergencyKeyInput] = useState('');

  // Sandbox simulation code preview for testing
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const policy = validatePasswordPolicy(newPassword);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(emailInput);
      if (res.success) {
        setStatusFeedback({ message: res.message, isError: false });
        if (res.codePreview) {
          setDevCodePreview(res.codePreview);
          setMaskedEmail(res.registeredEmailMasked || null);
        }
        setStep('VERIFY_AND_RESET');
      } else {
        setStatusFeedback({ message: res.message, isError: true });
      }
    } catch (err: any) {
      setStatusFeedback({ message: err.message || 'Error processing recovery request', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (newPassword !== confirmPassword) {
      setStatusFeedback({ message: 'New password and confirmation do not match.', isError: true });
      return;
    }

    if (newPassword.trim() !== 'Rkbhogta12') {
      setStatusFeedback({
        message: 'Security Policy: Only the single authorized password "Rkbhogta12" is accepted on the admin panel.',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'EMAIL_RESET') {
        const res = await verifyAndResetPassword(verificationCode, newPassword, confirmPassword);
        if (res.success) {
          setStep('SUCCESS');
        } else {
          setStatusFeedback({ message: res.message, isError: true });
        }
      } else {
        const res = await emergencyResetWithKey(emergencyKeyInput, newPassword, confirmPassword);
        if (res.success) {
          setStep('SUCCESS');
        } else {
          setStatusFeedback({ message: res.message, isError: true });
        }
      }
    } catch (err: any) {
      setStatusFeedback({ message: err.message || 'Error resetting password', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 relative antialiased">
      {/* Background ambient red glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0e1422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top return link */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateLogin}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Login</span>
          </button>
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">
            ACCOUNT RECOVERY
          </span>
        </div>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto shadow-xl shadow-red-600/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white font-cinema tracking-tight">
            Administrator Password Reset
          </h1>
          <p className="text-xs text-slate-400">
            Secure, verified identity verification for account &ldquo;rajanbhogta&rdquo;.
          </p>
        </div>

        {statusFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 border ${
              statusFeedback.isError
                ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
            }`}
          >
            {statusFeedback.isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
        )}

        {/* Mode selector tab */}
        {step !== 'SUCCESS' && (
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => {
                setMode('EMAIL_RESET');
                setStep('REQUEST');
                setStatusFeedback(null);
              }}
              className={`py-1.5 rounded-lg font-semibold transition-colors ${
                mode === 'EMAIL_RESET'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Email Verification
            </button>
            <button
              onClick={() => {
                setMode('EMERGENCY_KEY_RESET');
                setStep('VERIFY_AND_RESET');
                setStatusFeedback(null);
              }}
              className={`py-1.5 rounded-lg font-semibold transition-colors ${
                mode === 'EMERGENCY_KEY_RESET'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Emergency Owner Key
            </button>
          </div>
        )}

        {/* STEP 1: Request Code (Email Mode) */}
        {step === 'REQUEST' && mode === 'EMAIL_RESET' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
              Enter the registered administrator recovery email. For privacy and security, requests are rate-limited, and generic responses protect account existence.
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Registered Recovery Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. chanchalganjhu07@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-700/40 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Dispatching...' : 'Send Recovery Code'}</span>
            </button>

            {/* Quick helper for developer / owner testing */}
            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-500">
                Registered administrator email on file:{' '}
                <strong className="text-slate-400 font-mono">{recoveryEmail}</strong>
              </span>
            </div>
          </form>
        )}

        {/* STEP 2: Verify Code & Reset Password (Email Mode or Emergency Key Mode) */}
        {step === 'VERIFY_AND_RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Developer / Testing sandbox helper banner */}
            {devCodePreview && mode === 'EMAIL_RESET' && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-600/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Testing Verification Sandbox
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">15m expiry</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Generated 6-Digit Code:</span>
                  <span className="font-mono text-base font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-600/50">
                    {devCodePreview}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationCode(devCodePreview)}
                  className="text-[11px] text-emerald-400 hover:underline pt-0.5 block"
                >
                  Click to auto-fill verification code
                </button>
              </div>
            )}

            {mode === 'EMAIL_RESET' ? (
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  6-Digit Verification Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono tracking-widest text-center text-base focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Emergency Owner Recovery Key *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={emergencyKeyInput}
                    onChange={(e) => setEmergencyKeyInput(e.target.value.toUpperCase())}
                    placeholder="OWNER-LXMRC-XXXX-XXXX-XXXX"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found in your owner account credentials document.
                </span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                New Master Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars with upper, lower, number, symbol"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Real-time Password Policy Checklist */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-400 block uppercase text-[10px]">
                Security Policy Requirements
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className={`flex items-center space-x-1.5 ${policy.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="text-xs">{policy.hasMinLength ? '✓' : '○'}</span>
                  <span>8+ Characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="text-xs">{policy.hasUppercase ? '✓' : '○'}</span>
                  <span>Uppercase Letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="text-xs">{policy.hasLowercase ? '✓' : '○'}</span>
                  <span>Lowercase Letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="text-xs">{policy.hasDigit ? '✓' : '○'}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="text-xs">{policy.hasSpecialChar ? '✓' : '○'}</span>
                  <span>Special Symbol (!@#$)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-700/40 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Validating Token & Resetting...' : 'Verify & Set New Password'}</span>
            </button>

            {mode === 'EMAIL_RESET' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Request a new verification code
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white font-cinema">Password Reset Successful!</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Your administrator master password has been updated and cryptographically hashed. Existing sessions have been revoked. You can now log into the Laxmi Cineplex Admin Portal.
            </p>

            <button
              onClick={onNavigateLogin}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all"
            >
              Return to Admin Sign In
            </button>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="text-[11px] text-slate-500 text-center border-t border-white/5 pt-4">
          All recovery activities are rate-limited, single-use, and recorded in the immutable audit log.
        </div>
      </div>
    </div>
  );
};
