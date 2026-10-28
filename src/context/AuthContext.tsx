import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { hashPassword, storageService } from '../services/storage';
import {
  securityService,
  ADMIN_USERNAME,
  ADMIN_MASTER_PASSWORD,
  ADMIN_HASH_KEY,
  ADMIN_SESSION_KEY,
  validatePasswordPolicy,
  PasswordPolicyResult,
} from '../services/security';

interface AuthContextType {
  currentUser: User | null;
  adminUser: User | null;
  isAdminSetupDone: boolean;
  recoveryEmail: string;
  loginCustomer: (email: string, name?: string, phone?: string) => void;
  logoutCustomer: () => void;
  loginAdmin: (username: string, passwordAttempt: string) => Promise<{ success: boolean; message: string }>;
  setupAdminMasterPassword: (password: string, recoveryEmail?: string) => Promise<{ success: boolean; message: string; emergencyKey?: string }>;
  logoutAdmin: () => void;
  updateAdminPassword: (oldPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (emailInput: string) => Promise<{
    success: boolean;
    message: string;
    codePreview?: string;
    isEmailConfigured: boolean;
    registeredEmailMasked?: string;
  }>;
  verifyAndResetPassword: (codeAttempt: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  updateRecoveryEmail: (email: string) => { success: boolean; message: string };
  generateEmergencyOwnerKey: () => Promise<string>;
  emergencyResetWithKey: (ownerKey: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CUSTOMER_SESSION_KEY = 'lxm_customer_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminSetupDone, setIsAdminSetupDone] = useState<boolean>(() => {
    return securityService.isAdminInitialized();
  });

  const [recoveryEmail, setRecoveryEmailState] = useState<string>(() => {
    return securityService.getRecoveryEmail();
  });

  // Failed login attempts tracker for rate limiting
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);

  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        setAdminUser(JSON.parse(session));
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  }, []);

  const loginCustomer = (email: string, name?: string, phone?: string) => {
    const user: User = {
      id: `usr-${Date.now().toString(36)}`,
      name: name || email.split('@')[0],
      email,
      phone,
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(user);
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(user));
  };

  const logoutCustomer = () => {
    setCurrentUser(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  };

  const setupAdminMasterPassword = async (
    password: string,
    emailForRecovery?: string
  ): Promise<{ success: boolean; message: string; emergencyKey?: string }> => {
    // Validate strength
    const policy = validatePasswordPolicy(password);
    if (!policy.isValid) {
      return { success: false, message: policy.errors[0] };
    }

    const hashed = await hashPassword(password);
    localStorage.setItem(ADMIN_HASH_KEY, hashed);
    setIsAdminSetupDone(true);

    if (emailForRecovery) {
      securityService.setRecoveryEmail(emailForRecovery);
      setRecoveryEmailState(emailForRecovery);
    }

    // Generate emergency recovery key
    const emergencyKey = await securityService.generateOwnerEmergencyKey(ADMIN_USERNAME);

    const admin: User = {
      id: 'admin-rajanbhogta-1',
      name: 'Rajan Bhogta',
      email: emailForRecovery || 'rajanbhogta@laxmicineplex.in',
      role: 'SUPER_ADMIN',
      createdAt: new Date().toISOString(),
    };

    setAdminUser(admin);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));

    storageService.logAudit('rajanbhogta', 'ADMIN_INITIAL_SETUP', 'AUTH', 'Master administrator password initialized with security policy compliance.');
    return {
      success: true,
      message: 'Master Administrator account setup successful!',
      emergencyKey,
    };
  };

  const loginAdmin = async (username: string, passwordAttempt: string): Promise<{ success: boolean; message: string }> => {
    if (Date.now() < lockoutUntil) {
      const waitSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { success: false, message: `Too many failed attempts. Account locked. Please try again in ${waitSeconds}s.` };
    }

    const trimmedUser = username.trim().toLowerCase();
    if (trimmedUser !== ADMIN_USERNAME.toLowerCase() && trimmedUser !== 'admin') {
      storageService.logAudit(username, 'FAILED_LOGIN_ATTEMPT', 'AUTH', `Invalid administrator username: ${username}`);
      return { success: false, message: 'Invalid administrator credentials. Authorized username: rajanbhogta' };
    }

    const isMatch = await securityService.verifyCurrentPassword(passwordAttempt);
    if (!isMatch) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      storageService.logAudit(username, 'FAILED_LOGIN_PASSWORD', 'AUTH', `Incorrect password attempt (#${newAttempts})`);

      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 60 * 1000);
        setFailedAttempts(0);
        return { success: false, message: '5 consecutive failed attempts. Locked for 60 seconds.' };
      }

      return { success: false, message: 'Incorrect password. Only single password "Rkbhogta12" is accepted on admin panel.' };
    }

    // Success
    setFailedAttempts(0);
    const admin: User = {
      id: 'admin-rajanbhogta-1',
      name: 'Rajan Bhogta',
      email: securityService.getRecoveryEmail(),
      role: 'SUPER_ADMIN',
      createdAt: new Date().toISOString(),
    };

    setAdminUser(admin);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
    storageService.logAudit(ADMIN_USERNAME, 'ADMIN_LOGIN_SUCCESS', 'AUTH', 'Administrator logged into dashboard with master password.');

    return { success: true, message: 'Welcome back, Administrator Rajan Bhogta!' };
  };

  const updateAdminPassword = async (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ): Promise<{ success: boolean; message: string }> => {
    return securityService.changePassword(oldPass, newPass, confirmPass, adminUser?.name || ADMIN_USERNAME);
  };

  const requestPasswordReset = async (emailInput: string) => {
    return securityService.requestPasswordReset(emailInput);
  };

  const verifyAndResetPassword = async (codeAttempt: string, newPass: string, confirmPass: string) => {
    const res = await securityService.verifyAndResetPassword(codeAttempt, newPass, confirmPass);
    if (res.success) {
      setAdminUser(null); // revoke session upon reset
    }
    return res;
  };

  const updateRecoveryEmail = (email: string) => {
    const res = securityService.setRecoveryEmail(email, adminUser?.name || ADMIN_USERNAME);
    if (res.success) {
      setRecoveryEmailState(email.trim().toLowerCase());
    }
    return res;
  };

  const generateEmergencyOwnerKey = async () => {
    return securityService.generateOwnerEmergencyKey(adminUser?.name || ADMIN_USERNAME);
  };

  const emergencyResetWithKey = async (ownerKey: string, newPass: string, confirmPass: string) => {
    const res = await securityService.emergencyResetWithKey(ownerKey, newPass, confirmPass);
    if (res.success) {
      setAdminUser(null);
    }
    return res;
  };

  const logoutAdmin = () => {
    storageService.logAudit(adminUser?.name || 'ADMIN', 'ADMIN_LOGOUT', 'AUTH', 'Admin session logged out');
    setAdminUser(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUser,
        isAdminSetupDone,
        recoveryEmail,
        loginCustomer,
        logoutCustomer,
        loginAdmin,
        setupAdminMasterPassword,
        logoutAdmin,
        updateAdminPassword,
        requestPasswordReset,
        verifyAndResetPassword,
        updateRecoveryEmail,
        generateEmergencyOwnerKey,
        emergencyResetWithKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
