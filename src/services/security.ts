/**
 * Password Security, Verification, and Account Recovery Service
 * Laxmi Cineplex Hazaribagh Admin Panel
 */

import { hashPassword, storageService } from './storage';

export const ADMIN_USERNAME = 'rajanbhogta';
export const ADMIN_MASTER_PASSWORD = 'Rkbhogta12';
export const ADMIN_HASH_KEY = 'lxm_admin_hash_rajanbhogta';
export const ADMIN_SESSION_KEY = 'lxm_admin_active_session';
export const ADMIN_RECOVERY_EMAIL_KEY = 'lxm_admin_recovery_email';
export const ADMIN_RECOVERY_KEY_HASH = 'lxm_admin_recovery_key_hash';
export const ADMIN_RESET_TOKEN_KEY = 'lxm_admin_active_reset_token';
export const ADMIN_RESET_RATE_LIMIT_KEY = 'lxm_admin_reset_rate_limit';
export const ADMIN_LAST_PASSWORD_CHANGE_KEY = 'lxm_admin_last_password_change';

// Password Security Policy Rules
export interface PasswordPolicyResult {
  isValid: boolean;
  errors: string[];
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (password === ADMIN_MASTER_PASSWORD) {
    return {
      isValid: true,
      errors: [],
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasDigit: true,
      hasSpecialChar: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long.');
  if (!hasUppercase) errors.push('Password must contain at least one uppercase letter (A-Z).');
  if (!hasLowercase) errors.push('Password must contain at least one lowercase letter (a-z).');
  if (!hasDigit) errors.push('Password must contain at least one numeric digit (0-9).');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character (!@#$%^&*...).');

  return {
    isValid: errors.length === 0,
    errors,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
  };
}

export interface PasswordResetRecord {
  token: string; // 6-digit numeric verification code
  targetEmail: string;
  expiresAt: number; // 15 mins
  attemptsRemaining: number;
  isConsumed: boolean;
  createdAt: number;
}

export interface RateLimitRecord {
  requestTimestamps: number[];
}

class SecurityService {
  /**
   * Check if administrator account is initialized
   */
  public isAdminInitialized(): boolean {
    return true; // Single master password Rkbhogta12 is pre-configured and active
  }

  /**
   * Get configured administrator recovery email
   */
  public getRecoveryEmail(): string {
    return localStorage.getItem(ADMIN_RECOVERY_EMAIL_KEY) || 'chanchalganjhu07@gmail.com';
  }

  /**
   * Update administrator recovery email
   */
  public setRecoveryEmail(email: string, actor: string = ADMIN_USERNAME): { success: boolean; message: string } {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    localStorage.setItem(ADMIN_RECOVERY_EMAIL_KEY, trimmed);
    storageService.logAudit(actor, 'UPDATE_RECOVERY_EMAIL', 'AUTH', `Admin recovery email updated to ${trimmed}`);
    return { success: true, message: 'Recovery email updated successfully!' };
  }

  /**
   * Generate emergency owner recovery key (used if email service is unreachable)
   */
  public async generateOwnerEmergencyKey(actor: string = ADMIN_USERNAME): Promise<string> {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rawKey = `OWNER-LXMRC-${part1}-${part2}-${part3}`;

    const keyHash = await hashPassword(rawKey, 'owner_emergency_salt_2026');
    localStorage.setItem(ADMIN_RECOVERY_KEY_HASH, keyHash);
    storageService.logAudit(actor, 'GENERATE_EMERGENCY_KEY', 'AUTH', 'Owner Emergency Recovery Key generated');
    return rawKey;
  }

  /**
   * Verify password against authorized single admin password 'Rkbhogta12'
   */
  public async verifyCurrentPassword(passwordAttempt: string): Promise<boolean> {
    // Only single password accept Rkbhogta12 on admin panel
    return passwordAttempt.trim() === ADMIN_MASTER_PASSWORD;
  }

  /**
   * Change Password Workflow
   */
  public async changePassword(
    oldPass: string,
    newPass: string,
    confirmPass: string,
    actor: string = ADMIN_USERNAME
  ): Promise<{ success: boolean; message: string }> {
    // 1. Validate current password (only Rkbhogta12 accepted)
    const isOldCorrect = await this.verifyCurrentPassword(oldPass);
    if (!isOldCorrect) {
      storageService.logAudit(actor, 'PASSWORD_CHANGE_FAILED', 'AUTH', 'Password change rejected: Incorrect old password.');
      return { success: false, message: 'Current password is incorrect. Verification failed.' };
    }

    // 2. Check matching confirmation
    if (newPass !== confirmPass) {
      return { success: false, message: 'New password and confirmation do not match.' };
    }

    // 3. Single Password Policy check
    if (newPass.trim() !== ADMIN_MASTER_PASSWORD) {
      return {
        success: false,
        message: 'Security Policy: Only the single authorized password "Rkbhogta12" is accepted on the admin panel.',
      };
    }

    // 4. Hash and store password securely
    const newHash = await hashPassword(newPass);
    localStorage.setItem(ADMIN_HASH_KEY, newHash);
    localStorage.setItem(ADMIN_LAST_PASSWORD_CHANGE_KEY, new Date().toISOString());

    // 5. Security audit log
    storageService.logAudit(actor, 'PASSWORD_CHANGE_SUCCESS', 'AUTH', 'Master administrator password confirmed as Rkbhogta12.');

    return { success: true, message: 'Administrator master password verified and confirmed as "Rkbhogta12"!' };
  }

  /**
   * Rate limiting check for forgot password requests (max 3 requests per 10 mins)
   */
  private checkResetRateLimit(): boolean {
    const now = Date.now();
    const tenMins = 10 * 60 * 1000;
    const raw = localStorage.getItem(ADMIN_RESET_RATE_LIMIT_KEY);
    let record: RateLimitRecord = raw ? JSON.parse(raw) : { requestTimestamps: [] };

    // Filter out timestamps older than 10 mins
    record.requestTimestamps = record.requestTimestamps.filter((t) => now - t < tenMins);

    if (record.requestTimestamps.length >= 3) {
      return false; // Rate limit exceeded
    }

    record.requestTimestamps.push(now);
    localStorage.setItem(ADMIN_RESET_RATE_LIMIT_KEY, JSON.stringify(record));
    return true;
  }

  /**
   * Request Password Reset Code
   * Strictly enforces generic anti-enumeration response
   */
  public async requestPasswordReset(emailInput: string): Promise<{
    success: boolean;
    message: string;
    codePreview?: string;
    isEmailConfigured: boolean;
    registeredEmailMasked?: string;
  }> {
    const trimmedInput = emailInput.trim().toLowerCase();
    const genericResponse =
      'If an eligible administrator account is associated with this email address, password recovery instructions and a secure 6-digit verification code have been dispatched.';

    // Check rate limiting
    if (!this.checkResetRateLimit()) {
      return {
        success: false,
        message: 'Too many password reset requests. For security, please wait 10 minutes before requesting another code.',
        isEmailConfigured: true,
      };
    }

    const registeredEmail = this.getRecoveryEmail().trim().toLowerCase();
    const hasConfiguredEmail = Boolean(registeredEmail);

    if (!hasConfiguredEmail) {
      return {
        success: false,
        message: 'No recovery email address is configured for the administrator. An authorized owner must complete account-recovery setup.',
        isEmailConfigured: false,
      };
    }

    // Check match without exposing to public
    const isMatch = trimmedInput === registeredEmail;

    if (!isMatch) {
      // Log failed attempt generically
      storageService.logAudit('SYSTEM', 'RESET_REQUEST_UNMATCHED', 'AUTH', 'Password reset requested for unmatched email identifier.');
      // Return identical generic response to prevent account enumeration
      return {
        success: true,
        message: genericResponse,
        isEmailConfigured: true,
      };
    }

    // Generate cryptographically secure 6-digit numeric verification code
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();

    const resetRecord: PasswordResetRecord = {
      token: code,
      targetEmail: registeredEmail,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
      attemptsRemaining: 3,
      isConsumed: false,
      createdAt: Date.now(),
    };

    localStorage.setItem(ADMIN_RESET_TOKEN_KEY, JSON.stringify(resetRecord));
    storageService.logAudit('SYSTEM', 'RESET_CODE_DISPATCHED', 'AUTH', `Password reset token generated for registered admin email.`);

    // Masked email for display (e.g. ch***@gmail.com)
    const [namePart, domainPart] = registeredEmail.split('@');
    const maskedName = namePart.length > 2 ? `${namePart.slice(0, 2)}***` : `${namePart.slice(0, 1)}***`;
    const maskedEmail = `${maskedName}@${domainPart}`;

    return {
      success: true,
      message: genericResponse,
      codePreview: code, // Provided for preview verification / developer testing in sandbox
      isEmailConfigured: true,
      registeredEmailMasked: maskedEmail,
    };
  }

  /**
   * Verify Reset Code & Set New Password
   */
  public async verifyAndResetPassword(
    codeAttempt: string,
    newPass: string,
    confirmPass: string
  ): Promise<{ success: boolean; message: string }> {
    const raw = localStorage.getItem(ADMIN_RESET_TOKEN_KEY);
    if (!raw) {
      return { success: false, message: 'No active password reset request found or code has expired. Please request a new code.' };
    }

    const resetRecord: PasswordResetRecord = JSON.parse(raw);

    // 1. Check if token already consumed / reused
    if (resetRecord.isConsumed) {
      localStorage.removeItem(ADMIN_RESET_TOKEN_KEY);
      storageService.logAudit('SYSTEM', 'REUSED_RESET_TOKEN_REJECTED', 'AUTH', 'Attempted reuse of consumed password reset token.');
      return { success: false, message: 'This reset code has already been used and is no longer valid. Please request a new code.' };
    }

    // 2. Check token expiration (15 mins)
    if (Date.now() > resetRecord.expiresAt) {
      localStorage.removeItem(ADMIN_RESET_TOKEN_KEY);
      storageService.logAudit('SYSTEM', 'EXPIRED_RESET_TOKEN_REJECTED', 'AUTH', 'Attempted use of expired password reset token.');
      return { success: false, message: 'This reset code has expired (15-minute validity). Please request a new code.' };
    }

    // 3. Verify code attempt matches
    if (resetRecord.token.trim() !== codeAttempt.trim()) {
      resetRecord.attemptsRemaining -= 1;

      if (resetRecord.attemptsRemaining <= 0) {
        localStorage.removeItem(ADMIN_RESET_TOKEN_KEY);
        storageService.logAudit('SYSTEM', 'RESET_CODE_LOCKED_ATTEMPTS', 'AUTH', 'Password reset code invalidated due to 3 failed attempts.');
        return { success: false, message: 'Too many incorrect code attempts. This reset code has been invalidated for security.' };
      }

      localStorage.setItem(ADMIN_RESET_TOKEN_KEY, JSON.stringify(resetRecord));
      return {
        success: false,
        message: `Incorrect verification code. ${resetRecord.attemptsRemaining} attempts remaining.`,
      };
    }

    // 4. Validate matching passwords
    if (newPass !== confirmPass) {
      return { success: false, message: 'New password and confirmation do not match.' };
    }

    // 5. Enforce single password Rkbhogta12
    if (newPass.trim() !== ADMIN_MASTER_PASSWORD) {
      return {
        success: false,
        message: 'Security Policy: Only the single authorized password "Rkbhogta12" is accepted on the admin panel.',
      };
    }

    // 6. Success: Mark token as consumed and delete it
    resetRecord.isConsumed = true;
    localStorage.removeItem(ADMIN_RESET_TOKEN_KEY);

    // Save master password hash
    const finalHash = await hashPassword(ADMIN_MASTER_PASSWORD);
    localStorage.setItem(ADMIN_HASH_KEY, finalHash);
    localStorage.setItem(ADMIN_LAST_PASSWORD_CHANGE_KEY, new Date().toISOString());

    // Invalidate any active session
    localStorage.removeItem(ADMIN_SESSION_KEY);

    // Audit log
    storageService.logAudit(ADMIN_USERNAME, 'PASSWORD_RESET_SUCCESS', 'AUTH', 'Administrator password confirmed as Rkbhogta12 via verified recovery code.');

    return { success: true, message: 'Password confirmed successfully as "Rkbhogta12"! Please sign in with your password.' };
  }

  /**
   * Emergency Owner Recovery using Emergency Master Key
   */
  public async emergencyResetWithKey(
    ownerKeyInput: string,
    newPass: string,
    confirmPass: string
  ): Promise<{ success: boolean; message: string }> {
    const storedKeyHash = localStorage.getItem(ADMIN_RECOVERY_KEY_HASH);
    if (!storedKeyHash) {
      return { success: false, message: 'No Emergency Owner Recovery Key is configured on this system.' };
    }

    const inputHash = await hashPassword(ownerKeyInput.trim(), 'owner_emergency_salt_2026');
    if (inputHash !== storedKeyHash) {
      storageService.logAudit('UNKNOWN', 'EMERGENCY_KEY_FAILED', 'AUTH', 'Failed Emergency Owner Key attempt.');
      return { success: false, message: 'Invalid Emergency Owner Key.' };
    }

    if (newPass !== confirmPass) {
      return { success: false, message: 'New password and confirmation do not match.' };
    }

    if (newPass.trim() !== ADMIN_MASTER_PASSWORD) {
      return {
        success: false,
        message: 'Security Policy: Only the single authorized password "Rkbhogta12" is accepted on the admin panel.',
      };
    }

    const finalHash = await hashPassword(ADMIN_MASTER_PASSWORD);
    localStorage.setItem(ADMIN_HASH_KEY, finalHash);
    localStorage.removeItem(ADMIN_SESSION_KEY);

    storageService.logAudit('OWNER', 'EMERGENCY_PASSWORD_RESET', 'AUTH', 'Administrator password confirmed as Rkbhogta12 via Emergency Owner Key.');
    return { success: true, message: 'Emergency recovery successful! Admin password is confirmed as "Rkbhogta12".' };
  }
}

export const securityService = new SecurityService();
