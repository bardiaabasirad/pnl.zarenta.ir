import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, Subscription } from 'rxjs';

const RELOAD_ONCE_KEY = 'sw-reload-once';
const STABLE_BOOT_MS = 10_000;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private started = false;
  private subscriptions = new Subscription();

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_ONCE_KEY);
      } catch {
        /* ignore */
      }
    }, STABLE_BOOT_MS);

    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.subscriptions.add(
      this.swUpdate.unrecoverable.subscribe(() => {
        this.reloadOnce();
      })
    );

    this.subscriptions.add(
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => {
          const ref = this.snackBar.open('نسخه جدید آماده است', 'بارگذاری مجدد', {
            duration: 0,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });

          this.subscriptions.add(
            ref.onAction().subscribe(() => {
              document.location.reload();
            })
          );
        })
    );

    void this.checkForUpdate();

    this.subscriptions.add(
      interval(CHECK_INTERVAL_MS).subscribe(() => {
        void this.checkForUpdate();
      })
    );

    this.subscriptions.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (document.visibilityState === 'visible') {
          void this.checkForUpdate();
        }
      })
    );
  }

  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      /* ignore check failures */
    }
  }

  reloadOnce(): void {
    try {
      if (sessionStorage.getItem(RELOAD_ONCE_KEY)) {
        return;
      }
      sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
    } catch {
      /* proceed with reload if storage is unavailable */
    }

    document.location.reload();
  }
}
