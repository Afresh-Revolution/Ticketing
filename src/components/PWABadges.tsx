import { usePWA } from '../contexts/PWAContext';
import './PWABadges.css';

export default function PWABadges() {
  const pwa = usePWA();
  if (!pwa) return null;

  const { installable, onInstallClick, updateReady, onRefreshClick } = pwa;

  return (
    <>
      {updateReady && (
        <div className="pwa-badge pwa-badge-update" role="dialog" aria-label="Update available">
          <button
            type="button"
            className="pwa-badge-btn"
            onClick={onRefreshClick}
            aria-label="Refresh to get latest version"
          >
            <span className="pwa-badge-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </span>
            <span className="pwa-badge-label">Update available – Refresh</span>
          </button>
        </div>
      )}
      {installable && (
        <div className="pwa-badge pwa-badge-install" role="dialog" aria-label="Install app">
          <button
            type="button"
            className="pwa-badge-btn"
            onClick={onInstallClick}
            aria-label="Install GateWav app"
          >
            <span className="pwa-badge-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <span className="pwa-badge-label">Install app</span>
          </button>
        </div>
      )}
    </>
  );
}
