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

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  // Check if credentials match super admin
  if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
    // Return super admin user without API call
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

  // Otherwise, authenticate as regular admin via API
  const res = await fetch(apiUrl('/api/auth/signin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Sign in failed');
  }
  
  // Add role to the response if not present
  if (!data.user.role) {
    data.user.role = 'admin';
  }
  
  return data as AuthResponse;
}

export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetch(apiUrl('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Sign up failed');
  }
  return data as AuthResponse;
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
