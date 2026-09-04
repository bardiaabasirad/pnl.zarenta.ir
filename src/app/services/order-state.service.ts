import {Injectable, inject, signal} from '@angular/core';
import {WebSocketService} from './web-socket.service';
import {NotificationService} from './notification.service';
import {Order} from '../interfaces/order';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs';

@Injectable({providedIn: 'root'})
export class OrderStateService {
  private webSocketService = inject(WebSocketService);
  private notificationService = inject(NotificationService);

  // state داخلی، فقط از داخل سرویس قابل تغییر
  private _orders = signal<Order[]>([]);
  private _hasUnseenUpdate = signal(false);
  private _lastChangedOrder = signal<Order | null>(null);

  private _activeRoute = signal<string>('');
  private _openOrderTrackingCode = signal<string | null>(null);
  private _isModalOpen = signal(false);

  // نمای فقط‌خواندنی برای کامپوننت‌ها
  readonly orders = this._orders.asReadonly();
  readonly hasUnseenUpdate = this._hasUnseenUpdate.asReadonly();

  private cleanupFns: Array<() => void> = [];
  private started = false;

  constructor(private router: Router) {
    // رهگیری اتوماتیک مسیر (Route)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // استخراج نام مسیر (مثلاً 'orders')
      const url = event.urlAfterRedirects.split('/').pop() || '';
      this._activeRoute.set(url);
    });
  }

  // متدی برای آپدیت وضعیت مودال از سمت کامپوننت مودال
  setModalState(isOpen: boolean, trackingCode: string | null = null): void {
    this._isModalOpen.set(isOpen);
    this._openOrderTrackingCode.set(isOpen ? trackingCode : null);
  }

  private shouldMarkUnseen(e: any): boolean {
    const incomingTrackingCode = e.tracking_code?.toString();

    // شرط ۱: اگر مودال باز است و مربوط به همین سفارش است -> دیده شده محسوب می‌شود
    if (this._isModalOpen() && this._openOrderTrackingCode() == incomingTrackingCode) {
      return false;
    }

    // شرط ۲: اگر در صفحه سفارشات هستیم
    if (this._activeRoute() === 'orders') {
      const existsInCurrentList = this._orders().some(
        o => o.tracking_code?.toString() === incomingTrackingCode
      );
      // اگر در لیست موجود است، کاربر تغییر را می‌بیند -> false، در غیر این صورت -> true
      return !existsInCurrentList;
    }

    // در سایر حالت‌ها (مودال برای سفارش دیگر باز است یا در صفحه دیگری هستیم)
    return true;
  }

  /** یک‌بار بعد از مشخص‌شدن کاربر صدا زده می‌شود */
  start(userId: string | number): void {
    if (this.started) return;
    this.started = true;

    const channel = `client-order-${userId}`;

    this.cleanupFns.push(
      this.webSocketService.listenToPrivateChannel(
        channel, '.updated', (e: any) => this.onUpdated(e),
      ),
    );

    this.cleanupFns.push(
      this.webSocketService.listenToPrivateChannel(
        channel, '.created', (e: any) => this.onCreated(e),
      ),
    );
  }

  /** هیدریت اولیه از API توسط صفحه‌ی orders */
  setOrders(orders: Order[]): void {
    this._orders.set(orders);
  }

  /** پاک‌کردن دایره‌ی قرمز وقتی کاربر سفارش‌ها را دید */
  markSeen(): void {
    this._hasUnseenUpdate.set(false);
  }

  stop(): void {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    this.started = false;
    this._orders.set([]);
    this._hasUnseenUpdate.set(false);
  }

  private onUpdated(e: any): void {
    this._orders.update(orders => {
      // ... منطق قبلی آپدیت لیست (فایل اصلی خط ۶۵-۷۱)
      const i = orders.findIndex(o => o.tracking_code.toString() === e.tracking_code.toString());
      if (i === -1) return orders;
      const next = [...orders];
      next[i] = {...next[i], status: e.status, message: e.message};
      return next;
    });

    this._lastChangedOrder.set(e);

    // اعمال منطق جدید شما
    if (this.shouldMarkUnseen(e)) {
      this._hasUnseenUpdate.set(true);

      if (e.status == 'succeed') {
        this.notificationService.playSucceedSound();
      } else if (e.status == 'rejected') {
        this.notificationService.playRejectSound();
      }
    }
  }

  private onCreated(e: any): void {
    this._orders.update(orders => [e, ...orders.slice(0, -1)]);

    // برای سفارش جدید معمولاً همیشه true است مگر در شرایط خاص
    if (!this._isModalOpen() && this.shouldMarkUnseen(e)) {
      this._hasUnseenUpdate.set(true);
      this.notificationService.playCreatedSound();
    }
  }

}
