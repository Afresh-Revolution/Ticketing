import { usePWA } from '../contexts/PWAContext';
import { brandAssetUrl } from '../branding/version';
import './PWABadges.css';

export default function PWABadges() {
  const pwa = usePWA();
  if (!pwa) return null;

  const { installable, onInstallClick, updateReady, onRefreshClick } = pwa;

  return (
    <>
      {updateReady && (
        <div className="pwa-badge pwa-badge-update" role="status" aria-live="polite" aria-label="Update available">
          <button
            type="button"
            className="pwa-badge-btn"
            onClick={onRefreshClick}
            aria-label="Refresh now to install latest app update"
          >
            <span className="pwa-badge-icon-wrap" aria-hidden>
              <span className="pwa-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </span>
            </span>
            <span className="pwa-badge-content">
              <span className="pwa-badge-title">Update ready</span>
              <span className="pwa-badge-label">Tap to refresh and use the latest version</span>
            </span>
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
            <span className="pwa-badge-icon-wrap" aria-hidden>
              <img src={brandAssetUrl('/icon-192.png')} alt="" className="pwa-badge-icon" />
            </span>
            <span className="pwa-badge-content">
              <span className="pwa-badge-title">Install GateWav</span>
              <span className="pwa-badge-label">Add to home screen for a faster app experience</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
