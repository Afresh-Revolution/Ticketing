import { useState, useEffect, useRef } from 'react';
import './PullToRefresh.css';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;
const MOBILE_MAX_WIDTH = 768;

export default function PullToRefresh() {
  const [pullY, setPullY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const startYRef = useRef(0);
  const pullYRef = useRef(0);

  pullYRef.current = pullY;

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    setIsMobile(mql.matches);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;
      startYRef.current = e.touches[0].clientY;
      setPullY(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - startYRef.current;
      if (delta > 0) {
        e.preventDefault();
        setPullY(Math.min(delta, MAX_PULL));
      }
    };

    const handleTouchEnd = () => {
      const currentPull = pullYRef.current;
      setPullY(0);
      startYRef.current = 0;
      if (currentPull >= PULL_THRESHOLD) {
        (async () => {
          try {
            const reg = await navigator.serviceWorker?.getRegistration();
            await reg?.update();
          } catch {
            /* ignore */
          }
          window.location.reload();
        })();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  if (!isMobile || pullY <= 0) return null;

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);
  const ready = pullY >= PULL_THRESHOLD;

  return (
    <div
      className="pull-to-refresh"
      style={{ opacity: Math.min(pullY / 40, 1) }}
      aria-hidden
    >
      <div
        className="pull-to-refresh-indicator"
        style={{
          transform: `translateY(${Math.min(pullY, 80)}px) scale(${0.5 + progress * 0.5})`,
        }}
      >
        <div className={`pull-to-refresh-spinner ${ready ? 'pull-to-refresh-spinner-ready' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
        <span className="pull-to-refresh-label">
          {ready ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
}
