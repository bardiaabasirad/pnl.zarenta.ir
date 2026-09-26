import {
  afterNextRender,
  Component,
  computed, effect,
  ElementRef,
  inject, Injector, NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import {RateService} from '../../services/rate.service';
import {ReactiveFormsModule} from '@angular/forms';
import {from, Subscription, timer} from 'rxjs';
import {StorageKey, StorageService} from '../../services/storage.service';
import {AuthService} from '../../services/auth.service';
import {User} from '../../interfaces/user';
import {WebSocketConnectionStatus, WebSocketService} from '../../services/web-socket.service';
import {EncryptionService} from '../../services/encryption.service';
import {MetalItemGroup} from '../../interfaces/metal-item-group';
import {ExchangeBtnComponent} from './partials/exchange-btn/exchange-btn.component';
import {JalaliPipe} from '../../pipes/jalali.pipe';
import {ExchangeModalComponent} from './partials/exchange-modal/exchange-modal.component';
import { viewChild } from '@angular/core';
import {DomSanitizer, SafeHtml, Title} from '@angular/platform-browser';
import {RouterLinkHandlerDirective} from '../../directives/router-link-handler.directive';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ExchangeBtnComponent,
    JalaliPipe,
    ExchangeModalComponent,
    RouterLinkHandlerDirective
  ],
  templateUrl: './exchange.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './exchange.component.scss'
})
export class ExchangeComponent implements OnInit, OnDestroy {
  marketStatus = signal<'active' | 'inactive'>('inactive');
  metalItemGroups = signal<MetalItemGroup[]>([]);
  expirationTime = signal<number>(0);
  initialized = signal<boolean>(false);
  messages = signal<string>('');
  user = signal<User | undefined>(undefined);
  baseOrderData = signal<{orderType: 'buy' | 'sell';metal_item_id?: number} | undefined>(undefined);

  private wasConnected = false;
  // Fallback mechanism properties
  private disconnectionTimer?: Subscription;
  private fallbackDataTimer?: Subscription;
  private isUsingFallback = false;
  private readonly DISCONNECTION_THRESHOLD = 10000; // 10 seconds
  private readonly FALLBACK_FETCH_INTERVAL = 5000; // Fetch every 5 seconds when using fallback
  // services
  private rateService = inject(RateService);
  private webSocketService = inject(WebSocketService);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);

  private wsCleanupFunctions: (() => void)[] = [];

  expanded = signal(false);
  showToggle = signal(false);
  contentHeight = signal<number | null>(null);

  private readonly BUTTON_AREA_HEIGHT = 40;

  private readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  private readonly LINE_HEIGHT = 24;
  private readonly DESKTOP_LINES = 3;
  private readonly MOBILE_LINES = 5;

  collapsedHeight = computed(() =>
    this.LINE_HEIGHT * (this.isMobile() ? this.MOBILE_LINES : this.DESKTOP_LINES)
  );

  // --- آیا واقعاً ارزش نمایش دکمه را دارد؟ ---
  effectiveShowToggle = computed(() =>
    this.showToggle() &&
    (this.contentHeight() ?? 0) - this.collapsedHeight() > this.BUTTON_AREA_HEIGHT
  );

  hiddenLineLimit = 2;   // اگر خطوط پنهان ≤ این مقدار باشد، دکمه نمایش داده نمی‌شود

  contentBox = viewChild<ElementRef<HTMLDivElement>>('contentBox');

  private resizeObserver?: ResizeObserver;
  private ngZone = inject(NgZone);
  private injector = inject(Injector);

  @ViewChild('exchangeModal') exchangeModal!: ExchangeModalComponent;

  connectionStatus: WebSocketConnectionStatus = {
    isOnline: true,
    echoState: 'initializing',
    isConnected: false
  };

  private subscriptions: Subscription[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(max-width: 767px)');
      mql.addEventListener('change', e => this.isMobile.set(e.matches));
    }

    effect(() => {
      // ایجاد وابستگی به پیام‌ها؛ هر زمان پیام‌ها تغییر کنند این افکت اجرا می‌شود
      const currentMessages = this.messages();
      const el = this.contentBox()?.nativeElement;

      // اگر پیامی نیست یا المان هنوز در DOM ساخته نشده، خارج شو
      if (currentMessages.length === 0 || !el) {
        return;
      }

      // راه اندازی ResizeObserver فقط برای یک بار
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          // چون تغییرات خارج از چرخه انگولار (توسط مرورگر) تشخیص داده می‌شود
          this.ngZone.run(() => {
            this.checkIfExpandable();
            this.updateContentHeight(); // هر دو را اینجا صدا بزن
          });
        });
        this.resizeObserver.observe(el);
      }

      // برای اطمینان از رندر اولیه، یک بار هم بعد از رندر اجرا کن
      afterNextRender(() => {
        this.checkIfExpandable();
        this.updateContentHeight();
      }, { injector: this.injector });
    });
  }

  readonly safeMessages = computed<SafeHtml>(() => {
    const html = this.messages() ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  private checkIfExpandable(): void {
    const el = this.contentBox()?.nativeElement;   // ← () اضافه شد
    if (!el) return;

    const style = getComputedStyle(el);
    let lineHeight = parseFloat(style.lineHeight);
    if (isNaN(lineHeight)) {
      // اگر line-height روی normal باشد
      lineHeight = parseFloat(style.fontSize) * 1.2;
    }

    const fullHeight = el.scrollHeight;
    const hiddenHeight = fullHeight - this.collapsedHeight();
    const threshold = lineHeight * this.hiddenLineLimit; // ۲ خط = ۴۰px

    // فقط اگر بخش پنهان بیشتر از ۴۰px (۲ خط) بود دکمه را نشان بده
    // +1 برای جلوگیری از خطای گرد کردن
    this.showToggle.set(hiddenHeight > threshold + 1);

    if (!this.showToggle()) this.expanded.set(false);
  }

  ngOnInit() {
    this.titleService.setTitle(`سامانه معاملات ${environment.appTitle}`);

    this.getUserInfo();
    this.fetchData();
    this.setupConnectionMonitoring();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();

    this.webSocketService.leaveChannel(
      `rates`,
      '.updated'
    );
    this.webSocketService.leaveChannel(
      'client-messages',
      '.updated'
    );

    this.cleanupSubscriptions();
    this.stopFallbackMechanism();
  }

  latestPrices = computed(() =>
    this.metalItemGroups()
      .flatMap(g => g.metal_items)
      .flatMap(i => i.latest_price ? [i.latest_price] : [])
  );

  metalItemsWithoutPrice = computed(() =>
    this.metalItemGroups()
      .flatMap(group => group.metal_items)
      .map(({ latest_price, ...rest }) => rest)
  );

  filteredGroups = computed(() =>
    this.metalItemGroups().filter(group =>
      group.metal_items.some(metalItem => {
        const config = this.getConfig(metalItem.id);
        return config && (metalItem.is_buy_active || metalItem.is_sell_active);
      })
    )
  );

  updateContentHeight() {
    // استفاده از afterNextRender برای اطمینان از اینکه DOM آپدیت شده است
    afterNextRender(() => {
      const el = this.contentBox()?.nativeElement;
      if (el) {
        const height = el.scrollHeight;
        this.contentHeight.set(height);
      }
    }, { injector: this.injector });
  }

  getGroupLastUpdate(groupId: number): Date | null {
    const group = this.metalItemGroups().find(g => g.id === groupId);
    if (!group) return null;

    const dates = group.metal_items
      .map(item => item.latest_price?.created_at)
      .filter(date => date != null)
      .map(date => new Date(date));

    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
  }

  onModalOpened(event: {
    orderType: 'buy' | 'sell';
    product?: number;
  }) {
    this.baseOrderData.set(event);
    this.exchangeModal.openModal();
  }

  // Monitoring connection status - start section
  private setupConnectionMonitoring() {
    // Monitor connection status
    const connectionSub = this.webSocketService.connectionStatus$.subscribe(
      (status: WebSocketConnectionStatus) => {
        const isFullyConnected = status.isOnline && status.isConnected;

        // Handle connection state changes
        this.handleConnectionChange(isFullyConnected);

        if (!this.wasConnected && isFullyConnected) {
          this.onConnectionRestored();
        }

        this.wasConnected = isFullyConnected;
        this.connectionStatus = status;

        // Handle reconnection logic
        if (status.isConnected) {
          // Reconnected - restart rate subscription
          setTimeout(() => {
            this.listenToClientMessages();
            this.listenToPriceChanges();
            this.listenToMetalTraderChanges();
            this.listenToDealingGroupChanges();
            this.listenToMarketStatusChanges();
            this.listenToMetalItemChanges();
          }, 1000)
        }
      }
    );

    this.subscriptions.push(connectionSub);
  }

  private handleConnectionChange(isConnected: boolean) {
    if (isConnected) {
      // Connection is good - stop fallback mechanism
      this.stopFallbackMechanism();
    } else {
      // Connection lost - start countdown for fallback
      this.startDisconnectionTimer();
    }
  }

  private startDisconnectionTimer() {
    // Clear any existing timer
    this.stopDisconnectionTimer();

    this.disconnectionTimer = timer(this.DISCONNECTION_THRESHOLD).subscribe(() => {
      this.activateFallbackMode();
    });
  }

  private stopDisconnectionTimer() {
    if (this.disconnectionTimer) {
      this.disconnectionTimer.unsubscribe();
      this.disconnectionTimer = undefined;
    }
  }

  private activateFallbackMode() {
    if (this.isUsingFallback) {
      return; // Already in fallback mode
    }

    this.isUsingFallback = true;
    // Immediately fetch data
    this.fetchDataViaHttp();

    // Set up periodic fetching
    this.fallbackDataTimer = timer(0, this.FALLBACK_FETCH_INTERVAL).subscribe(() => {
      this.fetchDataViaHttp();
    });
  }

  private stopFallbackMechanism() {
    this.stopDisconnectionTimer();

    if (this.fallbackDataTimer) {
      this.fallbackDataTimer.unsubscribe();
      this.fallbackDataTimer = undefined;
    }

    if (this.isUsingFallback) {
      this.isUsingFallback = false;
    }
  }

  private async fetchDataViaHttp() {
    try {
      // Fetching data via HTTP fallback

      this.fetchRateWithFallback();
    } catch (error) {
      // console.error('Failed to fetch data via HTTP fallback:', error);

      // Optionally, you can implement retry logic here
      // or handle different types of errors differently
    }
  }

  private cleanupSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.wsCleanupFunctions.forEach((cleanup) => cleanup());
    this.wsCleanupFunctions = [];
  }

  private onConnectionRestored() {
    this.fetchRateWithFallback();
  }

  listenToClientMessages() {

    const unsubscribe = this.webSocketService.listenToPublicChannel(
      'client-messages',
      '.updated',
      (e: any) => {
        this.messages.set(e.messages);
      });

    this.wsCleanupFunctions.push(unsubscribe);

  }

  listenToMarketStatusChanges() {

    const unsubscribe = this.webSocketService.listenToPublicChannel(
      'market-status',
      '.changed',
      (e: any) => {
        this.marketStatus.set(e.status);
      });

    this.wsCleanupFunctions.push(unsubscribe);

  }

  listenToMetalItemChanges() {

    const unsubscribe = this.webSocketService.listenToPublicChannel(
      'metal-items',
      '.changed',
      (e: any) => {
        const updated = e.metalItem;

        this.metalItemGroups.update(groups =>
          groups.map(group =>
            group.id !== updated.metal_item_group_id
              ? group
              : {
                ...group,
                metal_items: group.metal_items.map(item =>
                  item.id === updated.id
                    ? { ...item, ...updated }
                    : item
                )
              }
          )
        );
      });

    this.wsCleanupFunctions.push(unsubscribe);

  }

  fetchRateWithFallback() {
    this.fetchData();
  }

  fetchData() {
    this.rateService.getRate().subscribe({
      next: (response: any) => {
        // تنظیمات نرخ حاضر
        const metal_item_groups = this.encryptionService.decrypt(response.metal_item_groups.data, response.metal_item_groups.iv);
        this.metalItemGroups.set(metal_item_groups);
        this.marketStatus.set(response.market_status);
        this.expirationTime.set(response.expiration_time);
        this.messages.set(response.messages);
        this.initialized.set(true);

        setTimeout(() => {
          this.checkIfExpandable();
        }, 500);
      }
    });
  }

  // یک computed signal برای map کردن configs
  private configMap = computed(() => {
    const configs = this.user()?.group?.metal_item_configs ?? [];
    return new Map(configs.map((c: any) => [c.metal_item_id, c]));
  });

  getConfig(metalItemId: number) {
    return this.configMap().get(metalItemId);
  }

  private listenToPriceChanges() {
    const unsubscribe = this.webSocketService.listenToPublicChannel(
      `metal-prices`,
      '.updated',
      (e: any) => {
        const newPrice = this.encryptionService.decrypt(e.data, e.iv);

        this.metalItemGroups.update(groups =>
          groups.map(group => ({
            ...group,
            metal_items: group.metal_items.map(item =>
              item.id === newPrice.metal_item_id
                ? { ...item, latest_price: newPrice }
                : item
            )
          }))
        );
      }
    );

    this.wsCleanupFunctions.push(unsubscribe);
  }

  private listenToMetalTraderChanges() {
    const unsubscribe = this.webSocketService.listenToPrivateChannel(
      `metal-trader-${this.user()?.id!}`,
      '.updated',
      (e: any) => {
        e.group = this.encryptionService.decrypt(e.group.data, e.group.iv);

        this.user.set(e);
        this.authService.setUser(this.user());
      }
    );

    this.wsCleanupFunctions.push(unsubscribe);
  }

  private listenToDealingGroupChanges() {
    const unsubscribe = this.webSocketService.listenToPrivateChannel(
      `dealing-group-${this.user()?.group.id}`,
      '.updated',
      (e: any) => {
        const decryptedData = this.encryptionService.decrypt(e.data, e.iv);

        this.user.update(u => ({
          ...u!,
          group: decryptedData
        }));

        this.authService.setUser(this.user());
      }
    );

    this.wsCleanupFunctions.push(unsubscribe);
  }


  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      from(this.authService.getUserInfo()).subscribe({
        next: () => {
          this.user.set(this.authService.getUser());
        },
        error: (error) => {
          if (error === 'Token expired') {
            this.user.set(undefined);
            StorageService.removeCookie(StorageKey.ACCESS_TOKEN);
          }
        }
      })
    }
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;

    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }
}
