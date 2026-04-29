// Default to local backend in dev to avoid testing against stale remote code.
// You can still override with VITE_API_URL in your environment when needed.
const defaultBase = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://ticketing-back.onrender.com';
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? defaultBase;

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
