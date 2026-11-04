import {Injectable, OnDestroy, PLATFORM_ID, inject, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

export type PwaInstallOutcome = 'accepted' | 'dismissed' | null;

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed-at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly boundBeforeInstall = (event: Event) => this.onBeforeInstallPrompt(event as BeforeInstallPromptEvent);
  private readonly boundDeferredPrompt = (event: Event) => {
    const detail = (event as CustomEvent<BeforeInstallPromptEvent>).detail;
    if (detail) {
      this.capturePrompt(detail);
    }
  };
  private readonly boundAppInstalled = () => this.onAppInstalled();

  /** True when Chromium has deferred an install prompt we can trigger from UI. */
  readonly canInstall = signal(false);
  /** True when the app is already running in standalone/installed mode. */
  readonly isInstalled = signal(false);
  /** True when the soft-promote banner should be visible. */
  readonly showBanner = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isInstalled.set(this.detectInstalled());
    if (this.isInstalled()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', this.boundBeforeInstall);
    window.addEventListener('pwa-deferred-prompt', this.boundDeferredPrompt);
    window.addEventListener('appinstalled', this.boundAppInstalled);

    const early = window.__pwaDeferredPrompt;
    if (early) {
      this.capturePrompt(early);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('beforeinstallprompt', this.boundBeforeInstall);
    window.removeEventListener('pwa-deferred-prompt', this.boundDeferredPrompt);
    window.removeEventListener('appinstalled', this.boundAppInstalled);
  }

  async showInstallPrompt(): Promise<PwaInstallOutcome> {
    if (!this.deferredPrompt) {
      return null;
    }

    const promptEvent = this.deferredPrompt;

    try {
      await promptEvent.prompt();
      const {outcome} = await promptEvent.userChoice;

      if (outcome === 'accepted') {
        this.showBanner.set(false);
        this.isInstalled.set(true);
      } else {
        this.dismissBanner(true);
      }

      return outcome;
    } catch {
      return null;
    } finally {
      // Chromium allows prompt() once per deferred event.
      this.clearDeferredPrompt();
    }
  }

  dismissBanner(persist = true): void {
    this.showBanner.set(false);

    if (persist && isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore quota / private mode */
      }
    }
  }

  private onBeforeInstallPrompt(event: BeforeInstallPromptEvent): void {
    event.preventDefault();
    this.capturePrompt(event);
  }

  private capturePrompt(event: BeforeInstallPromptEvent): void {
    if (this.isInstalled()) {
      return;
    }

    this.deferredPrompt = event;
    window.__pwaDeferredPrompt = event;
    this.canInstall.set(true);

    if (!this.isDismissCooldownActive()) {
      this.showBanner.set(true);
    }
  }

  private onAppInstalled(): void {
    this.clearDeferredPrompt();
    this.showBanner.set(false);
    this.isInstalled.set(true);

    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {
      /* ignore */
    }

    // Hook for analytics if/when a tracker is wired up.
    console.info('[pwa] appinstalled');
  }

  private clearDeferredPrompt(): void {
    this.deferredPrompt = null;
    window.__pwaDeferredPrompt = null;
    this.canInstall.set(false);
  }

  private detectInstalled(): boolean {
    const standaloneMq = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = 'standalone' in navigator && Boolean((navigator as Navigator & {standalone?: boolean}).standalone);
    return standaloneMq || iosStandalone;
  }

  private isDismissCooldownActive(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const dismissedAt = Number(raw);
      if (!Number.isFinite(dismissedAt)) {
        return false;
      }
      return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
    } catch {
      return false;
    }
  }
}
