import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/AppDownloadCard.css';

const FRONTEND_BASE =
  (import.meta.env.VITE_FRONTEND_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://gatewav.com';

const APP_STORE_URL =
  (import.meta.env.VITE_APP_STORE_URL as string | undefined)?.trim() ||
  `${FRONTEND_BASE}/download`;

const PLAY_STORE_URL =
  (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() ||
  'https://play.google.com/store/apps/details?id=com.gatewav.mobile';

const AppDownloadCard = () => {
  return (
    <section className="app-download" aria-labelledby="app-download-heading">
      <ScrollReveal className="app-download-card" animation="fadeIn">
        <div className="app-download-copy">
          <span className="app-download-label">Mobile app</span>
          <h2 id="app-download-heading" className="app-download-title">
            Take GateWav with you
          </h2>
          <p className="app-download-description">
            Browse events, buy tickets, and show your QR at the door — download the GateWav app for
            iPhone or Android.
          </p>
        </div>

        <div className="app-download-buttons">
          <a
            className="app-store-btn"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
          >
            <svg className="app-store-btn-icon" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
              />
            </svg>
            <span className="app-store-btn-text">
              <span className="app-store-btn-eyebrow">Download on the</span>
              <span className="app-store-btn-name">App Store</span>
            </span>
          </a>

          <a
            className="app-store-btn"
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get it on Google Play"
          >
            <svg className="app-store-btn-icon" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.337 1.352c.84.486.84 1.7 0 2.186l-2.337 1.352L15.313 12l2.385-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"
              />
            </svg>
            <span className="app-store-btn-text">
              <span className="app-store-btn-eyebrow">Get it on</span>
              <span className="app-store-btn-name">Google Play</span>
            </span>
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default AppDownloadCard;
