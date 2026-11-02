import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {from, map, timer} from 'rxjs';
import {Flowbite, InitFlowbiteFix} from '../../../decorators/flowbite.decorator';
import {JalaliPipe} from '../../../pipes/jalali.pipe';
import {AuthService} from '../../../services/auth.service';
import {TraderNotificationApiService} from '../../../services/trader-notification.service';
import {WebSocketService} from '../../../services/web-socket.service';
import {CommonModule} from '@angular/common';

interface TraderNotification {
  id: number;
  title: string;
  content: string;
  link?: string | null;
  type?: string | null;
  created_at?: string;
}

@Flowbite()
@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    JalaliPipe,
    CommonModule,
  ],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly timeChanged = output<Date>();

  readonly rxTime = toSignal(
    timer(0, 1000).pipe(map(() => new Date())),
    {initialValue: new Date()}
  );

  notifications = signal<TraderNotification[]>([]);
  loadingIds = signal<Set<number>>(new Set());
  markingAll = signal(false);

  hasNotifications = computed(() => this.notifications().length > 0);

  private authService = inject(AuthService);
  private notificationApi = inject(TraderNotificationApiService);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);
  private readonly channelUnsubscribers: (() => void)[] = [];

  constructor() {
    effect(() => this.timeChanged.emit(this.rxTime()));
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.fetchNotifications();

    from(this.authService.getUserInfo()).subscribe({
      next: () => this.listenForRealtimeNotifications(),
      error: () => this.listenForRealtimeNotifications(),
    });
  }

  ngOnDestroy(): void {
    this.channelUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.channelUnsubscribers.length = 0;
  }

  private fetchNotifications(): void {
    this.notificationApi.index().subscribe({
      next: (res) => {
        this.notifications.set(res?.data ?? []);
        setTimeout(() => InitFlowbiteFix(), 0);
      },
    });
  }

  private listenForRealtimeNotifications(): void {
    const user = this.authService.getUser();
    if (!user?.id) {
      return;
    }

    const unsubscribe = this.webSocketService.listenToPrivateChannel(
      `metal-trader-${user.id}`,
      '.trader-notification-created',
      (payload: TraderNotification) => {
        this.notifications.update((list) => [payload, ...list]);
        setTimeout(() => InitFlowbiteFix(), 0);
      }
    );

    this.channelUnsubscribers.push(unsubscribe);
  }

  openNotification(notification: TraderNotification): void {
    this.markAsRead(notification.id, () => {
      if (notification.link) {
        this.router.navigateByUrl(notification.link);
      }
    });
  }

  markAsRead(id: number, after?: () => void): void {
    this.loadingIds.update((set) => new Set(set).add(id));

    this.notificationApi.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update((list) => list.filter((n) => n.id !== id));
        after?.();
      },
      complete: () => {
        this.loadingIds.update((set) => {
          const next = new Set(set);
          next.delete(id);
          return next;
        });
      },
    });
  }

  isLoading(id: number): boolean {
    return this.loadingIds().has(id);
  }

  markAllAsRead(): void {
    if (!this.hasNotifications() || this.markingAll()) {
      return;
    }

    this.markingAll.set(true);
    this.notificationApi.markAllAsRead().subscribe({
      next: () => this.notifications.set([]),
      complete: () => this.markingAll.set(false),
    });
  }
}
