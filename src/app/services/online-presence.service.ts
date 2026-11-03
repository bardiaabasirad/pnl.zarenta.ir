import { Injectable, inject, OnDestroy } from '@angular/core';
import { from, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { WebSocketService } from './web-socket.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OnlinePresenceService implements OnDestroy {

  private ws = inject(WebSocketService);
  private authService = inject(AuthService);
  private readonly PRESENCE_CHANNEL = 'online-clients';
  private readonly LEAVE_URL = `${environment.apiUrl}/v1/traders/presence/leave`;
  private connectionSub?: Subscription;
  private wasConnected = false;
  private pageHideHandler = () => this.notifyLeave(true);
  private listenersAttached = false;

  /**
   * شروع حضور آنلاین - این را در AppComponent یا بعد از لاگین صدا بزن
   */
  startPresence(): void {
    from(this.authService.getUserInfo()).subscribe({
      next: () => {
        const user = this.authService.getUser();

        if (user) {
          this.joinPresenceChannel();
          this.attachPageLeaveListeners();
          this.watchSocketConnection();
        } else {
          console.warn('Cannot start presence: User not authenticated');
        }
      },
      error: () => {}
    });
  }

  /**
   * پایان حضور - این را در logout یا ngOnDestroy صدا بزن
   */
  stopPresence(): void {
    this.notifyLeave(false);
    this.leavePresenceChannel();
    this.detachPageLeaveListeners();
    this.connectionSub?.unsubscribe();
    this.connectionSub = undefined;
    this.wasConnected = false;
  }

  private joinPresenceChannel(): void {
    this.ws.joinPresenceChannel(this.PRESENCE_CHANNEL, {
      onHere: () => {},
      onJoining: () => {},
      onLeaving: () => {},
      onError: () => {}
    });
  }

  private leavePresenceChannel(): void {
    this.ws.leavePresenceChannel(this.PRESENCE_CHANNEL);
  }

  /**
   * با قطع سوکت = پایان حضور؛ با وصل مجدد = بازگشت به کانال
   */
  private watchSocketConnection(): void {
    this.connectionSub?.unsubscribe();
    this.wasConnected = this.ws.isFullyConnected();

    this.connectionSub = this.ws.connectionStatus$.pipe(
      map(status => status.isConnected),
      distinctUntilChanged()
    ).subscribe(isConnected => {
      if (this.wasConnected && !isConnected) {
        this.notifyLeave(true);
      }

      if (!this.wasConnected && isConnected && this.authService.isLoggedIn()) {
        this.joinPresenceChannel();
      }

      this.wasConnected = isConnected;
    });
  }

  private attachPageLeaveListeners(): void {
    if (this.listenersAttached || typeof window === 'undefined') {
      return;
    }

    // فقط بستن/ترک صفحه — نه مخفی شدن تب (visibilitychange)
    window.addEventListener('pagehide', this.pageHideHandler);
    this.listenersAttached = true;
  }

  private detachPageLeaveListeners(): void {
    if (!this.listenersAttached || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('pagehide', this.pageHideHandler);
    this.listenersAttached = false;
  }

  /**
   * ثبت last_seen = لحظه قطع حضور در سایت
   */
  private notifyLeave(useBeacon: boolean): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    try {
      void fetch(this.LEAVE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: '{}',
        keepalive: useBeacon,
        credentials: 'omit',
      });
    } catch {
      // نادیده گرفتن خطا هنگام بستن تب / قطع ناگهانی
    }
  }

  ngOnDestroy(): void {
    this.stopPresence();
  }
}
