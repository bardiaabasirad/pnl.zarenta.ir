interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface Window {
  __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  'pwa-deferred-prompt': CustomEvent<BeforeInstallPromptEvent>;
}
