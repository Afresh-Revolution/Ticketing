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
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateReady(true);
      },
      onOfflineReady() {},
    });
    updateSWRef.current = updateSW;
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

export function usePWA() {
  const ctx = useContext(PWAContext);
  return ctx;
}
