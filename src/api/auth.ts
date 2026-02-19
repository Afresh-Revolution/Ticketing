import { apiUrl } from './config';

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
  const res = await fetch(apiUrl('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Sign up failed');
  }
  return data as { message: string };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to send reset code');
  }
  return data as { message: string };
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/auth/resend-verification'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to send code');
  }
  return data as { message: string };
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
