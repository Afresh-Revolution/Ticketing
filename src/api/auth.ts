import { apiUrl } from './config';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(apiUrl('/api/auth/signin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Sign in failed');
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
