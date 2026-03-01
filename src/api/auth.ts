import { apiUrl } from './config';

const AUTH_EMAIL_TIMEOUT_MS = 20000;

function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = AUTH_EMAIL_TIMEOUT_MS, ...rest } = opts;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...rest, signal: controller.signal }).finally(() => clearTimeout(id));
}

export type UserRole = 'superadmin' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role?: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Super admin credentials
const SUPER_ADMIN_EMAIL = 'ticketing@2026gmail.com';
const SUPER_ADMIN_PASSWORD = 'Afresh@2026';

export type SignInResult = AuthResponse | { requiresOtp: true; email: string };

export async function signIn(
  email: string,
  password: string,
  otp?: string
): Promise<SignInResult> {
  // Check if credentials match super admin
  if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
    return {
      user: {
        id: 0,
        email: SUPER_ADMIN_EMAIL,
        name: 'Super Admin',
        role: 'superadmin'
      },
      token: 'superadmin-token-' + Date.now()
    };
  }

  const body: { email: string; password: string; otp?: string } = { email, password };
  if (otp) body.otp = otp;

  const res = await fetch(apiUrl('/api/auth/signin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Sign in failed');
  }

  if (data.requiresOtp) {
    return { requiresOtp: true, email: data.email };
  }

  if (!data.user.role) {
    data.user.role = 'admin';
  }

  return data as AuthResponse;
}

export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ message: string }> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? 'Sign up failed');
    }
    return data as { message: string };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw e;
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? 'Failed to send reset code');
    }
    return data as { message: string };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw e;
  }
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/auth/resend-verification'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? 'Failed to send code');
    }
    return data as { message: string };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw e;
  }
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to reset password');
  }
  return data as { message: string };
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
}

export async function createAdmin(adminData: CreateAdminData): Promise<AuthResponse> {
  const res = await fetch(apiUrl('/api/auth/create-admin'), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    body: JSON.stringify(adminData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to create admin');
  }
  return data as AuthResponse;
}

export interface PasswordChangeStatus {
  canChange: boolean;
  nextChangeAllowedAt: string | null;
  reason?: string;
}

export async function getPasswordChangeStatus(): Promise<PasswordChangeStatus> {
  const res = await fetch(apiUrl('/api/admin/password-change-status'), {
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Failed to load');
  return data;
}

export async function verifyAdminPassword(currentPassword: string): Promise<{ verified: true }> {
  const res = await fetch(apiUrl('/api/admin/verify-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify({ currentPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Invalid current password');
  return data;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: true; message: string }> {
  const res = await fetch(apiUrl('/api/admin/change-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Failed to change password');
  return data;
}

/** Organizer self-signup. Sends one-time OTP to email for verification. */
export async function organizerSignup(
  username: string,
  email: string,
  password: string
): Promise<{ message: string }> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/auth/organizer-signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'Failed to register as organizer');
    return data as { message: string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isNetworkOrCert =
      msg.includes('certificate') ||
      msg.includes('SSL') ||
      msg.includes('TLS') ||
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('Failed to fetch') ||
      msg === 'The operation was aborted.';
    if (isNetworkOrCert) {
      throw new Error(
        'Connection error (e.g. certificate or network). Try again or use a different network. If the problem continues, contact support.'
      );
    }
    throw err;
  }
}

/** Verify OTP for new organizer; enables admin login for that account. */
export async function organizerVerifyOtp(email: string, otp: string): Promise<{ message: string }> {
  try {
    const res = await fetch(apiUrl('/api/auth/organizer-verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'Invalid or expired code');
    return data as { message: string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('certificate') || msg.includes('Failed to fetch') || msg.includes('network')) {
      throw new Error('Connection error. Try again or use a different network.');
    }
    throw err;
  }
}
