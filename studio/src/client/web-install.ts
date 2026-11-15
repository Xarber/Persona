// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let registration: Promise<ServiceWorkerRegistration> | undefined;

export function registerStudioWorker() {
  if (!('serviceWorker' in navigator)) return undefined;
  registration ??= navigator.serviceWorker.register('/sw.js').catch((error) => {
    registration = undefined;
    throw error;
  });
  return registration;
}

export function useWebInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(
    () =>
      matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );

  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(undefined);
    };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    void registerStudioWorker()?.catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
    };
  }, []);

  return {
    installed,
    onInstall:
      prompt && !installed
        ? () => {
            setPrompt(undefined);
            void prompt.prompt().catch(() => {});
          }
        : undefined,
  };
}
