import { useEffect, type ReactNode } from 'react';

// Share registration across StrictMode mounts. The virtual registration helper
// can reload active pages, so updates use the native lifecycle instead.
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
const UPDATE_INTERVAL = 15 * 60 * 1000;
let lastUpdateCheck = 0;

export function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const preventInstallPrompt = (event: Event) => event.preventDefault();
    window.addEventListener('beforeinstallprompt', preventInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', preventInstallPrompt);
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let checking = false;
    const checkForUpdate = async () => {
      if (disposed || checking || !registration || !navigator.onLine ||
          document.visibilityState !== 'visible' ||
          Date.now() - lastUpdateCheck < UPDATE_INTERVAL) return;
      checking = true;
      lastUpdateCheck = Date.now();
      try {
        // Download silently; never send SKIP_WAITING or reload. Activation
        // waits until all clients using the old worker have closed.
        await registration.update();
      } catch {
        // Temporary network failures leave the current version usable.
      } finally {
        checking = false;
      }
    };

    registrationPromise ??= navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL, updateViaCache: 'none' },
    ).catch((error: unknown) => {
      registrationPromise = undefined;
      throw error;
    });
    void registrationPromise.then((value) => {
      if (disposed) return;
      registration = value;
      void checkForUpdate();
    }).catch(() => {
      // Registration failure must not prevent the app from opening.
    });

    const onReturn = () => { void checkForUpdate(); };
    const interval = window.setInterval(onReturn, UPDATE_INTERVAL);
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('online', onReturn);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('online', onReturn);
    };
  }, []);

  return children;
}
