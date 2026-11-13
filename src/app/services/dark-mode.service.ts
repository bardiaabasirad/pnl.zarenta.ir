import {inject, Injectable, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {StorageKey, StorageService} from './storage.service';
import {EventService} from './event.service';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private readonly document = inject(DOCUMENT);
  private readonly eventService = inject(EventService);

  readonly isDark = signal(false);

  init(): void {
    const enabled = !!StorageService.getCookie(StorageKey.DARK_MODE);
    this.apply(enabled, false);
  }

  toggle(): void {
    this.setEnabled(!this.isDark());
  }

  setEnabled(enabled: boolean): void {
    this.apply(enabled, true);
  }

  private apply(enabled: boolean, persist: boolean): void {
    const body = this.document.body;

    if (enabled) {
      body.classList.add('dark');
      if (persist) {
        StorageService.setCookie(StorageKey.DARK_MODE, '1');
      }
    } else {
      body.classList.remove('dark');
      if (persist) {
        StorageService.removeCookie(StorageKey.DARK_MODE);
      }
    }

    this.isDark.set(enabled);
    this.eventService.darkModeToggled.emit(enabled);

    const themeMeta = this.document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', enabled ? '#111827' : '#ECBD00');
    }
  }
}
