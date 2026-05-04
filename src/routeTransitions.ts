/** Visual direction for route enter/exit (paired: enter vs exit is mirrored). */
export type RouteTransitionVariant = 'lr' | 'rl' | 'tb' | 'bt'

const VARIANTS: RouteTransitionVariant[] = ['lr', 'rl', 'tb', 'bt']

function hashPath(pathname: string): number {
  let h = 0
  for (let i = 0; i < pathname.length; i += 1) {
    h = (h * 31 + pathname.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Stable variant per route so the same path always gets the same motion,
 * with variety across the app (landing L→R, events R→L, etc.).
 */
export function getRouteTransitionVariant(pathname: string): RouteTransitionVariant {
  const p = pathname.replace(/\/+$/, '') || '/'

  if (p === '/' || p === '') return 'lr'
  if (p === '/events') return 'rl'
  if (p.startsWith('/event/')) return 'tb'
  if (p === '/login' || p === '/signup') return 'bt'
  if (p === '/organizer-form') return 'lr'
  if (p === '/checkout') return 'rl'
  if (p === '/my-tickets') return 'tb'
  if (p === '/payment-success') return 'bt'
  if (p.startsWith('/admin')) {
    if (p === '/admin/login') return 'lr'
    return VARIANTS[hashPath(p) % 4]
  }

  return VARIANTS[hashPath(p) % 4]
}
