import {Component, inject, OnInit, OnDestroy, signal, computed, effect, ChangeDetectionStrategy} from '@angular/core';
import {AbsPipe} from "../../pipes/abs.pipe";
import {AutoFontDirective} from "../../directives/auto-font.directive";
import {CommonModule, DecimalPipe} from "@angular/common";
import {AuthService} from '../../services/auth.service';
import {EventService} from '../../services/event.service';
import {User} from '../../interfaces/user';
import {BalanceStateService} from '../../services/balance-state.service';
import {WebSocketService} from '../../services/web-socket.service';
import {AppConstants} from '../../constants/app-constants';
import {RouterLink} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    CommonModule,
    AbsPipe,
    AutoFontDirective,
    DecimalPipe,
    RouterLink
  ],
  templateUrl: './balance.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './balance.component.scss'
})
export class BalanceComponent implements OnInit, OnDestroy {
  // Services
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private balanceStateService = inject(BalanceStateService);
  private webSocketService = inject(WebSocketService);

  // Signals
  user = signal<User | null | undefined>(undefined);

  // Convert Observables to Signals
  balances = toSignal(this.balanceStateService.balances$, {initialValue: []});
  loading = toSignal(this.balanceStateService.loading$, {initialValue: false});
  errorOnLoadingBalances = toSignal(this.balanceStateService.error$, {initialValue: false});
  initializedBalances = toSignal(this.balanceStateService.initialized$, {initialValue: false});
  userUpdateEvent = toSignal(this.eventService.userUpdateEvent);
  weightBasedBalancesIds = signal<number[]>([11,268,310,317,218]);
  private wsCleanupFunctions: (() => void)[] = [];

  constructor() {
    // Effect برای پاسخ به تغییرات userUpdateEvent
    effect(() => {
      if (this.userUpdateEvent()) {
        this.getUserInfo();
      }
    });
  }

  ngOnInit(): void {
    this.getUserInfo();
  }

  ngOnDestroy() {
    this.webSocketService.leaveAllChannels();
    this.balanceStateService.clear();

    this.wsCleanupFunctions.forEach((cleanup) => cleanup());
    this.wsCleanupFunctions = [];
  }

  // Computed Signals
  weightBasedBalances = computed(() => {
    const balanceList = this.balances();
    if (!balanceList?.length) return [];

    return this.weightBasedBalancesIds()
      .map(id => balanceList.find(b => b.CurrencyId === id))
      .filter(Boolean);
  });

  countableBalances = computed(() => {
    const balanceList = this.balances();
    if (!balanceList?.length) return [];

    return balanceList.filter(b => !this.weightBasedBalancesIds().includes(b.CurrencyId)) ?? [];
  });

  listenToBalance() {
    const currentUser = this.user();
    if (!currentUser?.id) return;

    const unsubscribe = this.webSocketService.listenToPrivateChannel(
      `balance-${currentUser.id}`,
      '.updated',
      (e: any) => {
        if (Array.isArray(e)) {
          this.balanceStateService.updateFromSocket(e);
        }
      }
    );

    this.wsCleanupFunctions.push(unsubscribe);
  }

  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      this.authService.getUserInfo().then(() => {
        const userData = this.authService.getUser();
        this.user.set(userData);
        this.listenToBalance();

        // فقط اگر داده قبلی وجود ندارد تازه لود کن
        if (!this.balances()?.length) {
          this.updateBalances();
        }
      }).catch((error) => {
        if (error === 'Token expired') {
          this.user.set(undefined);
        }
      });
    } else {
      this.user.set(null);
    }
  }

  updateBalances() {
    const currentUser = this.user();
    if (currentUser?.kimi_account_id) {
      this.balanceStateService.loadBalances(currentUser.kimi_account_id);
    }
  }

  protected readonly Math = Math;
}
