import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { registerSW } from 'virtual:pwa-register';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<{ outcome: string }> };

type PWAContextValue = {
  installable: boolean;
  onInstallClick: () => Promise<void>;
  updateReady: boolean;
  onRefreshClick: () => void;
};

const PWAContext = createContext<PWAContextValue | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [installable, setInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const updateSWRef = useRef<((reload?: boolean) => void) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    let intervalId: number | null = null;
    let activeRegistration: ServiceWorkerRegistration | undefined;
    const revalidateForUpdate = async (registration?: ServiceWorkerRegistration) => {
      if (!registration) return;
      try {
        await registration.update();
      } catch {
        // Ignore transient update errors (offline, throttling, etc).
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void revalidateForUpdate(activeRegistration);
      }
    };
    const onFocus = () => {
      void revalidateForUpdate(activeRegistration);
    };

    const bindRegistration = (registration?: ServiceWorkerRegistration) => {
      if (!registration) return;
      activeRegistration = registration;
      void revalidateForUpdate(activeRegistration);
      if (!intervalId) {
        intervalId = window.setInterval(() => {
          void revalidateForUpdate(activeRegistration);
        }, 60 * 1000);
      }
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('focus', onFocus);
    };

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateReady(true);
      },
      onOfflineReady() {},
      onRegisteredSW(_swUrl, registration) {
        bindRegistration(registration);
      },
      onRegistered(registration) {
        bindRegistration(registration);
      },
    });
    updateSWRef.current = updateSW;
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const onInstallClick = async () => {
    if (!installPrompt) return;
    const { outcome } = await installPrompt.prompt();
    if (outcome === 'accepted') {
      setInstallable(false);
      setInstallPrompt(null);
    }
  };

  const onRefreshClick = () => {
    // Avoid lingering UI if reload is suppressed for any reason (edge cases/offline transitions).
    setUpdateReady(false);
    updateSWRef.current?.(true);
  };

  const value: PWAContextValue = {
    installable,
    onInstallClick,
    updateReady,
    onRefreshClick,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

// Context consumer hook – same-file export is intentional
// eslint-disable-next-line react-refresh/only-export-components
export function usePWA() {
  const ctx = useContext(PWAContext);
  return ctx;
}
