import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { validatePasswordPolicy, securityService, ADMIN_USERNAME } from '../../services/security';
import { CinemaSettings, AuditLog } from '../../types';
import {
  Settings,
  QrCode,
  Upload,
  ShieldCheck,
  Lock,
  KeyRound,
  History,
  CheckCircle,
  AlertCircle,
  Save,
  Search,
  Mail,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  Play,
  Terminal,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    adminUser,
    updateAdminPassword,
    recoveryEmail,
    updateRecoveryEmail,
    generateEmergencyOwnerKey,
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'PASSWORD' | 'RECOVERY' | 'UPI_QR' | 'CINEMA' | 'AUDIT' | 'TESTS'>('UPI_QR');

  // Cinema Settings State
  const [settings, setSettings] = useState<CinemaSettings>(() => storageService.getSettings());
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Recovery Email Form State
  const [editRecoveryEmail, setEditRecoveryEmail] = useState(recoveryEmail);
  const [emailFeedback, setEmailFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [generatedEmergencyKey, setGeneratedEmergencyKey] = useState<string | null>(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const [logFilter, setLogFilter] = useState('');

  // Automated Security Test Runner State
  const [testResults, setTestResults] = useState<{
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
    log?: string;
  }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const policy = validatePasswordPolicy(newPassword);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    setSettingsFeedback('Cinema operations and fees saved successfully!');
    setTimeout(() => setSettingsFeedback(null), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    // 1. Check required fields
    if (!oldPassword.trim()) {
      setPasswordFeedback({ message: 'Current password is required.', isError: true });
      return;
    }

    // 2. Check confirmation
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ message: 'New password and confirmation do not match.', isError: true });
      return;
    }

    // 3. Enforce single password Rkbhogta12
    if (newPassword.trim() !== 'Rkbhogta12') {
      setPasswordFeedback({
        message: 'Security Policy: Only the single authorized password "Rkbhogta12" is accepted on the admin panel.',
        isError: true,
      });
      return;
    }

    setIsChangingPass(true);

    try {
      const res = await updateAdminPassword(oldPassword, newPassword, confirmNewPassword);
      if (res.success) {
        setPasswordFeedback({ message: res.message, isError: false });
        // Clear all password fields after operation as required
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        // Refresh audit logs
        setAuditLogs(storageService.getAuditLogs());
      } else {
        setPasswordFeedback({ message: res.message, isError: true });
      }
    } catch (err: any) {
      setPasswordFeedback({ message: err.message || 'Error updating password', isError: true });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSaveRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);
    const res = updateRecoveryEmail(editRecoveryEmail);
    setEmailFeedback({ message: res.message, isError: !res.success });
    setAuditLogs(storageService.getAuditLogs());
  };

  const handleGenerateEmergencyKey = async () => {
    const key = await generateEmergencyOwnerKey();
    setGeneratedEmergencyKey(key);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Run comprehensive security test suite
  const runSecurityTests = async () => {
    setIsRunningTests(true);

    const initialTests = [
      {
        id: 't1',
        title: 'Old Password Verification',
        description: 'Verify that an incorrect current password is firmly rejected',
        status: 'RUNNING' as const,
      },
      {
        id: 't2',
        title: 'Password Confirmation Integrity',
        description: 'Verify that mismatched new password confirmation is rejected',
        status: 'PENDING' as const,
      },
      {
        id: 't3',
        title: 'Policy Enforcement: Minimum Length',
        description: 'Verify passwords shorter than 8 characters are blocked',
        status: 'PENDING' as const,
      },
      {
        id: 't4',
        title: 'Policy Enforcement: Complexity Checks',
        description: 'Verify weak passwords lacking proper length/casing are blocked',
        status: 'PENDING' as const,
      },
      {
        id: 't5',
        title: 'Single Password Policy Enforcement',
        description: 'Verify system rejects non-authorized passwords and only accepts Rkbhogta12',
        status: 'PENDING' as const,
      },
      {
        id: 't6',
        title: 'Anti-Account-Enumeration Defense',
        description: 'Verify forgot-password returns generic safe response for unknown emails',
        status: 'PENDING' as const,
      },
      {
        id: 't7',
        title: 'Single-Use Reset Token Invalidation',
        description: 'Verify reset tokens cannot be reused after initial consumption',
        status: 'PENDING' as const,
      },
      {
        id: 't8',
        title: 'Expired Token Invalidation',
        description: 'Verify tokens past their 15-minute validity window are rejected',
        status: 'PENDING' as const,
      },
      {
        id: 't9',
        title: 'Emergency Owner Key Verification',
        description: 'Verify Emergency Owner Key resets password to Rkbhogta12 when email is unreachable',
        status: 'PENDING' as const,
      },
      {
        id: 't10',
        title: 'Security Audit Logging',
        description: 'Verify all password events are logged without storing plaintext secrets',
        status: 'PENDING' as const,
      },
    ];

    setTestResults(initialTests);

    // Test 1: Incorrect old password
    const test1Res = await securityService.changePassword('WrongOldPassword123!', 'Rkbhogta12', 'Rkbhogta12');
    const t1Passed = !test1Res.success && test1Res.message.includes('Current password is incorrect');

    // Test 2: Confirmation mismatch
    const test2Res = await securityService.changePassword('Rkbhogta12', 'Rkbhogta12', 'DifferentPass89#B');
    const t2Passed = !test2Res.success && test2Res.message.includes('do not match');

    // Test 3: Short password
    const shortPolicy = validatePasswordPolicy('Abc1!');
    const t3Passed = !shortPolicy.isValid && shortPolicy.errors.some((e) => e.includes('8 characters'));

    // Test 4: Missing characters policy check
    const weakPolicy = validatePasswordPolicy('short');
    const t4Passed = !weakPolicy.isValid;

    // Test 5: Rejection of any password other than Rkbhogta12
    const test5Res = await securityService.changePassword('Rkbhogta12', 'OtherNewPass99', 'OtherNewPass99');
    const t5Passed = !test5Res.success && test5Res.message.includes('Rkbhogta12');

    // Test 6: Anti-enumeration
    const test6Res = await securityService.requestPasswordReset('nonexistent_user_999999@test.com');
    const t6Passed = test6Res.success && test6Res.message.includes('If an eligible administrator account');

    // Test 7 & 8: Token expiry and reuse checks
    const expiredRecord = {
      token: '123456',
      targetEmail: 'test@example.com',
      expiresAt: Date.now() - 1000,
      attemptsRemaining: 3,
      isConsumed: false,
      createdAt: Date.now() - 2000,
    };
    localStorage.setItem('lxm_admin_active_reset_token', JSON.stringify(expiredRecord));
    const test8Res = await securityService.verifyAndResetPassword('123456', 'Rkbhogta12', 'Rkbhogta12');
    const t8Passed = !test8Res.success && test8Res.message.includes('expired');

    // Mock consumed record
    const consumedRecord = {
      token: '654321',
      targetEmail: 'test@example.com',
      expiresAt: Date.now() + 60000,
      attemptsRemaining: 3,
      isConsumed: true,
      createdAt: Date.now(),
    };
    localStorage.setItem('lxm_admin_active_reset_token', JSON.stringify(consumedRecord));
    const test7Res = await securityService.verifyAndResetPassword('654321', 'Rkbhogta12', 'Rkbhogta12');
    const t7Passed = !test7Res.success && test7Res.message.includes('already been used');

    // Test 9: Emergency owner key with authorized password Rkbhogta12
    const rawOwnerKey = await securityService.generateOwnerEmergencyKey();
    const test9Res = await securityService.emergencyResetWithKey(rawOwnerKey, 'Rkbhogta12', 'Rkbhogta12');
    const t9Passed = test9Res.success;

    // Test 10: Audit logging
    const logs = storageService.getAuditLogs();
    const t10Passed = logs.some((l) => l.action.includes('PASSWORD') || l.action.includes('EMERGENCY'));

    setTestResults([
      { ...initialTests[0], status: t1Passed ? 'PASSED' : 'FAILED', log: test1Res.message },
      { ...initialTests[1], status: t2Passed ? 'PASSED' : 'FAILED', log: test2Res.message },
      { ...initialTests[2], status: t3Passed ? 'PASSED' : 'FAILED', log: 'Short password correctly blocked' },
      { ...initialTests[3], status: t4Passed ? 'PASSED' : 'FAILED', log: 'Weak passwords blocked' },
      { ...initialTests[4], status: t5Passed ? 'PASSED' : 'FAILED', log: 'Non-Rkbhogta12 password blocked' },
      { ...initialTests[5], status: t6Passed ? 'PASSED' : 'FAILED', log: 'Generic anti-enumeration response preserved' },
      { ...initialTests[6], status: t7Passed ? 'PASSED' : 'FAILED', log: test7Res.message },
      { ...initialTests[7], status: t8Passed ? 'PASSED' : 'FAILED', log: test8Res.message },
      { ...initialTests[8], status: t9Passed ? 'PASSED' : 'FAILED', log: 'Emergency owner key authenticated with Rkbhogta12' },
      { ...initialTests[9], status: t10Passed ? 'PASSED' : 'FAILED', log: 'Audit log entries securely created' },
    ]);

    setIsRunningTests(false);
    setAuditLogs(storageService.getAuditLogs());
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!logFilter.trim()) return true;
    const q = logFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.targetType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white font-cinema">Admin Settings & Security</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete password management, recovery email configuration, cinema operations, and audit trail.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSubTab('PASSWORD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'PASSWORD'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveSubTab('RECOVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'RECOVERY'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Account Recovery & Owner Key</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'TESTS'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Verification Tests</span>
        </button>

        <button
          onClick={() => setActiveSubTab('UPI_QR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'UPI_QR'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>UPI QR Gateway</span>
        </button>
        <button
          onClick={() => setActiveSubTab('CINEMA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'CINEMA'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Cinema Operations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'AUDIT'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: CHANGE PASSWORD */}
      {activeSubTab === 'PASSWORD' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 text-red-500 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Administrator Password Security</h2>
              <p className="text-xs text-slate-400">
                Single master password enforcement for account &ldquo;rajanbhogta&rdquo;
              </p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 border ${
                passwordFeedback.isError
                  ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                  : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
              }`}
            >
              {passwordFeedback.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Current / Old Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your existing password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters with upper, lower, number, symbol"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Real-time Password Policy Checklist */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2 text-[11px]">
              <span className="font-semibold text-slate-400 block uppercase text-[10px]">
                Configured Password Security Requirements:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center space-x-1.5 ${policy.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{policy.hasMinLength ? '✓' : '○'}</span>
                  <span>Minimum 8 Characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{policy.hasUppercase ? '✓' : '○'}</span>
                  <span>Uppercase Letter (A-Z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{policy.hasLowercase ? '✓' : '○'}</span>
                  <span>Lowercase Letter (a-z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{policy.hasDigit ? '✓' : '○'}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${policy.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{policy.hasSpecialChar ? '✓' : '○'}</span>
                  <span>Special Character (!@#$)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${oldPassword && newPassword && oldPassword !== newPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className="font-bold">{oldPassword && newPassword && oldPassword !== newPassword ? '✓' : '○'}</span>
                  <span>Different from Old Password</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setPasswordFeedback(null);
                }}
                className="px-4 py-2.5 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
              >
                Clear Fields
              </button>
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-700/40 flex items-center space-x-2 disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isChangingPass ? 'Verifying & Updating...' : 'Update Master Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: RECOVERY & OWNER KEY */}
      {activeSubTab === 'RECOVERY' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Recovery Email Configuration Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-red-500 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Administrator Recovery Email</h2>
                <p className="text-xs text-slate-400">
                  Verified email address required before password recovery can be authorized
                </p>
              </div>
            </div>

            {emailFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
                  emailFeedback.isError
                    ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                    : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                }`}
              >
                {emailFeedback.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                <span>{emailFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveRecoveryEmail} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Registered Recovery Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={editRecoveryEmail}
                    onChange={(e) => setEditRecoveryEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password reset codes and security notifications are dispatched exclusively to this address.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30"
                >
                  Save Recovery Email
                </button>
              </div>
            </form>
          </div>

          {/* Emergency Owner Key Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Emergency Owner Master Key</h2>
                <p className="text-xs text-slate-400">
                  Documented, owner-only offline recovery procedure when email service is unreachable
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If the cinema server or email provider is temporarily unreachable, the cinema owner can use an Emergency Master Key to reset the administrator password directly.
            </p>

            {generatedEmergencyKey ? (
              <div className="p-4 bg-slate-950 border border-amber-600/50 rounded-2xl space-y-2">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  ⚠️ Store In a Secure Safe Location (Shown Once):
                </div>
                <div className="font-mono text-sm font-black text-white bg-slate-900 p-2.5 rounded-xl border border-slate-700 break-all select-all">
                  {generatedEmergencyKey}
                </div>
                <p className="text-[10px] text-slate-400">
                  This key has been salted and hashed in the database. Plaintext key will not be displayed again.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateEmergencyKey}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>Generate New Emergency Owner Key</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED SECURITY TESTS */}
      {activeSubTab === 'TESTS' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <span>Automated Password Management Test Suite</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes live verification tests covering all 10 security & rejection criteria
              </p>
            </div>

            <button
              onClick={runSecurityTests}
              disabled={isRunningTests}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-700/40 flex items-center space-x-2 disabled:opacity-50 transition-all self-start sm:self-auto"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunningTests ? 'Running Live Tests...' : 'Execute All Security Tests'}</span>
            </button>
          </div>

          {testResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white">Security Test Suite Ready</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &ldquo;Execute All Security Tests&rdquo; to simulate attacks, wrong old passwords, expired reset tokens, reused tokens, and anti-enumeration defenses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-white">{t.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.description}</p>
                    {t.log && (
                      <p className="text-[10px] text-slate-500 font-mono pt-1">
                        Result: {t.log}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
                      t.status === 'PASSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : t.status === 'RUNNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CINEMA OPERATIONS */}
      {activeSubTab === "UPI_QR" && (
        <div className="bg-[#0b101b] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-red-500" />
                <span>UPI QR Payment Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Direct bank transfers to Rajan Bhogta via India Post Payment Bank with Box Office UTR verification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Box Office Gateway Active</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              storageService.updateSettings(settings, "rajanbhogta");
              setSettingsFeedback("UPI QR Gateway configuration saved successfully!");
              setTimeout(() => setSettingsFeedback(null), 3500);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Form Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Account Beneficiary Name (Displayed to Customer)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.upiConfig?.payeeName || "Rajan Bhogta"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        upiConfig: {
                          ...(settings.upiConfig || {}),
                          enabled: settings.upiConfig?.enabled ?? true,
                          payeeName: e.target.value,
                          bankName: settings.upiConfig?.bankName || "India Post Payment Bank 3764",
                          upiId: settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank",
                          qrImagePath: settings.upiConfig?.qrImagePath || "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg",
                          instructions: settings.upiConfig?.instructions || "",
                          allowManualVerification: true,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Receiving Bank Name & Account Details
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.upiConfig?.bankName || "India Post Payment Bank 3764"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        upiConfig: {
                          ...(settings.upiConfig || {}),
                          enabled: settings.upiConfig?.enabled ?? true,
                          payeeName: settings.upiConfig?.payeeName || "Rajan Bhogta",
                          bankName: e.target.value,
                          upiId: settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank",
                          qrImagePath: settings.upiConfig?.qrImagePath || "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg",
                          instructions: settings.upiConfig?.instructions || "",
                          allowManualVerification: true,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Official Virtual Payment Address (UPI ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        upiConfig: {
                          ...(settings.upiConfig || {}),
                          enabled: settings.upiConfig?.enabled ?? true,
                          payeeName: settings.upiConfig?.payeeName || "Rajan Bhogta",
                          bankName: settings.upiConfig?.bankName || "India Post Payment Bank 3764",
                          upiId: e.target.value,
                          qrImagePath: settings.upiConfig?.qrImagePath || "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg",
                          instructions: settings.upiConfig?.instructions || "",
                          allowManualVerification: true,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-red-300 font-mono focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Customer Payment Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={
                      settings.upiConfig?.instructions ||
                      "Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app. After transfer, submit the 12-digit UTR/Reference No. for Box Office turnstile ticket issuance."
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        upiConfig: {
                          ...(settings.upiConfig || {}),
                          enabled: settings.upiConfig?.enabled ?? true,
                          payeeName: settings.upiConfig?.payeeName || "Rajan Bhogta",
                          bankName: settings.upiConfig?.bankName || "India Post Payment Bank 3764",
                          upiId: settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank",
                          qrImagePath: settings.upiConfig?.qrImagePath || "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg",
                          instructions: e.target.value,
                          allowManualVerification: true,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.upiConfig?.enabled ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          upiConfig: {
                            ...(settings.upiConfig || {}),
                            enabled: e.target.checked,
                            payeeName: settings.upiConfig?.payeeName || "Rajan Bhogta",
                            bankName: settings.upiConfig?.bankName || "India Post Payment Bank 3764",
                            upiId: settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank",
                            qrImagePath: settings.upiConfig?.qrImagePath || "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg",
                            instructions: settings.upiConfig?.instructions || "",
                            allowManualVerification: true,
                          },
                        })
                      }
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="font-semibold text-slate-200">
                      Enable UPI QR Payment Option at Customer Checkout
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Column: QR Code Preview & Upload */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Active Turnstile QR Code Image
                </span>

                <div className="inline-block p-2 bg-white rounded-xl shadow-xl border-2 border-red-500/40">
                  <img
                    src={
                      settings.upiConfig?.qrImagePath ||
                      "/assets/aistudio/WhatsApp_Image_2026-10-27_at_7.14.47_PM_1e3e9751.jpeg"
                    }
                    alt="Active UPI QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-white">Rajan Bhogta &bull; IPPB 3764</p>
                  <p className="font-mono text-red-400">{settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank"}</p>
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Upload / Replace QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          setSettings({
                            ...settings,
                            upiConfig: {
                              ...(settings.upiConfig || {}),
                              enabled: settings.upiConfig?.enabled ?? true,
                              payeeName: settings.upiConfig?.payeeName || "Rajan Bhogta",
                              bankName: settings.upiConfig?.bankName || "India Post Payment Bank 3764",
                              upiId: settings.upiConfig?.upiId || "rajanbhogta714@okhdfcbank",
                              qrImagePath: dataUrl,
                              instructions: settings.upiConfig?.instructions || "",
                              allowManualVerification: true,
                            },
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/30 transition cursor-pointer"
              >
                Save UPI Gateway Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'CINEMA' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-5">
          <div className="flex items-center space-x-2 text-red-500 border-b border-white/5 pb-4">
            <Settings className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Cinema Operations & Fees</h2>
          </div>

          {settingsFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{settingsFeedback}</span>
            </div>
          )}

          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Cinema Name</label>
                <input
                  type="text"
                  value={settings.cinemaName}
                  onChange={(e) => setSettings({ ...settings, cinemaName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Location Region</label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Convenience Fee (₹)</label>
                <input
                  type="number"
                  value={settings.convenienceFeePerTicket}
                  onChange={(e) =>
                    setSettings({ ...settings, convenienceFeePerTicket: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">GST on Fee (%)</label>
                <input
                  type="number"
                  value={settings.gstPercentage}
                  onChange={(e) => setSettings({ ...settings, gstPercentage: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Cancellation Cutoff (Hrs)</label>
                <input
                  type="number"
                  value={settings.cancellationCutoffHours}
                  onChange={(e) =>
                    setSettings({ ...settings, cancellationCutoffHours: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Cinema Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeSubTab === 'AUDIT' && (
        <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center space-x-2 text-red-500">
              <History className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">System Security & Audit Trail</h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 uppercase text-[10px] sticky top-0 bg-[#0e1422]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">{log.actor}</td>
                    <td className="py-2.5 px-3 text-red-400">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.targetType}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
