import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import {Modal, ModalInterface, ModalOptions} from 'flowbite';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {convertToEnglishNumbersUtil} from '../../../../utils/convert-to-english-numbers.util';
import {OrderService} from '../../../../services/order.service';
import {Order} from '../../../../interfaces/order';
import {MatSnackBar} from '@angular/material/snack-bar';
import {User} from '../../../../interfaces/user';
import {WithoutTrailingZerosPipe} from '../../../../pipes/without-trailing-zeros.pipe';
import {ProgressBarComponent} from '../../../../components/progress-bar/progress-bar.component';
import {WebSocketConnectionStatus, WebSocketService} from '../../../../services/web-socket.service';
import {NotificationService} from '../../../../services/notification.service';
import {SelectedMetalPrice} from '../../../../interfaces/selected-metal-price';
import {ButtonWithLoaderComponent} from '../../../../components/button-with-loader/button-with-loader.component';
import {CeilPipe} from '../../../../pipes/ceil.pipe';
import {FloorPipe} from '../../../../pipes/floor.pipe';
import {AppConstants} from '../../../../constants/app-constants';
import {removeTrailingZeros} from '../../../../utils/remove-trailing-zeros.util';
import {OrderStateService} from '../../../../services/order-state.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-exchange-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonWithLoaderComponent,
    CeilPipe,
    FloorPipe,
    NgxMaskDirective,
    ProgressBarComponent
  ],
  providers: [
    WithoutTrailingZerosPipe,
    provideNgxMask()
  ],
  templateUrl: './exchange-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './exchange-modal.component.scss'
})
export class ExchangeModalComponent implements OnInit, AfterViewInit, OnDestroy {
  // inputs
  baseOrderData = input<{ orderType: 'buy' | 'sell'; metal_item_id?: number } | undefined>(undefined);
  latestPrices = input<SelectedMetalPrice[]>([]);
  metalItems = input<any[]>([]);
  marketStatus = input<'active' | 'inactive'>('inactive');
  user = input<User | undefined>(undefined);
  expirationTime = input<number>(0);
  // signals
  metalOrder = signal<Order | undefined>(undefined);

  private visibilityChangeHandler!: () => void;

  now: string = '';
  modal: ModalInterface | undefined;
  private _amountOfCash: number | null = null;
  amountOfMetal: string = '';
  private settingByMetal = false;
  private settingByCash = false;
  frozenItem: string = '';
  submitting: boolean = false;
  rateChanging = false;
  private metalOrderService = inject(OrderService);
  private matSnackBar = inject(MatSnackBar);
  private webSocketService = inject(WebSocketService);
  private notificationService = inject(NotificationService);
  orderStateService = inject(OrderStateService);
  @ViewChild('progressBar') progressBar!: ProgressBarComponent;
  @ViewChild('quantityInput') quantityInput!: ElementRef<HTMLInputElement>;
  currentProgress: number = 100;
  currentRemainingTime: number = 120;
  // Validations
  errors: { [key: string]: string[] } = {};
  formIsValid: boolean = false;
  private wsCleanupFunctions: (() => void)[] = [];

  private wasConnected = false;
  connectionStatus: WebSocketConnectionStatus = {
    isOnline: true,
    echoState: 'initializing',
    isConnected: false
  };
  private subscriptions: Subscription[] = [];

  private previousRate: number | undefined = undefined;

  constructor() {
    effect(() => {
      const market_status = this.marketStatus();
      let product_status: number = 0;
      const metal_item = this.metalItem();
      const base_order_data = this.baseOrderData();
      const order = this.metalOrder();

      if (metal_item && base_order_data) {
        if (base_order_data.orderType == 'buy') {
          product_status = metal_item.is_buy_active;
        } else {
          product_status = metal_item.is_sell_active;
        }
      }

      if (!order && (market_status === 'inactive' || !product_status)) {
        this.modal?.hide();
      }
    });

    // ردیابی تغییرات latestPrice
    effect(() => {

      let currentRate: number | undefined;

      if (this.baseOrderData()?.orderType == 'buy') {
        currentRate = this.latestPrice()?.sell;
      } else {
        currentRate = this.latestPrice()?.buy;
      }

      // اگر اولین بار است، فقط ذخیره کن
      if (this.previousRate === undefined || currentRate === undefined) {
        this.previousRate = currentRate;
        return;
      }

      // اگر نرخ تغییر نکرده، skip کن
      if (this.previousRate === currentRate) {
        return;
      }

      // نرخ تغییر کرده
      this.previousRate = currentRate;

      const metal_order = this.metalOrder();

      if (metal_order) {
        console.log('Retrying...');
        untracked(() => this.reCalculate());
      } else if (!metal_order) {
        this.clearError('price_id');
        this._amountOfCash = null;
        this.amountOfMetal = '';
        this.formIsValid = false;
        this.rateChanging = true;

        setTimeout(() => {
          this.rateChanging = false;
        }, 5000);
      }

    });
  }

  ngOnInit() {
    this.registerVisibilityChangeListener();

    this.setupConnectionMonitoring();
  }

  ngAfterViewInit() {
    this.initModal();
  }

  ngOnDestroy(): void {
    this.removeVisibilityChangeListener();
    this.cleanupSubscriptions();
    this.stopPollingFallback();

    const metal_order = this.metalOrder();

    if (metal_order) {
      this.webSocketService.leaveChannel(`order-${metal_order.tracking_code}`, '.updated');
    }

    this.wsCleanupFunctions.forEach((cleanup) => cleanup());
    this.wsCleanupFunctions = [];

    this.orderStateService.setModalState(false);
    this.modal?.hide();
  }

  private cleanupSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupConnectionMonitoring() {
    const connectionSub = this.webSocketService.connectionStatus$.subscribe(
      (status: WebSocketConnectionStatus) => {
        this.wasConnected = status.isOnline && status.isConnected;
        this.connectionStatus = status;

        if (this.wasConnected) {
          this.stopPollingFallback();
        } else if (this.metalOrder()) {
          this.startPollingFallback();
        }
      }
    );

    this.subscriptions.push(connectionSub);
  }

  get pendingStatus(): string {
    const metal_order = this.metalOrder();

    if (metal_order) {
      const status = metal_order.status;

      if (status == 'pending' || status == 'processing') {
        return 'pending';
      } else {
        return status
      }
    }

    return '';
  }

  metalItem = computed(() => {
    const data = this.baseOrderData();
    const items = this.metalItems();

    if (!data?.metal_item_id) return undefined;

    return items.find(i => i.id === data.metal_item_id);
  });

  config = computed(() => {
    return this.user()?.group.metal_item_configs.find((each: any) => each.metal_item_id === this.baseOrderData()?.metal_item_id);
  })

  latestPrice = computed(() => {
    return this.latestPrices().find(each => each.metal_item_id === this.baseOrderData()?.metal_item_id);
  })

  calculatedPrice = computed(() => {
    const price = this.latestPrice();
    const config = this.config();

    if (!price) return undefined;

    let calculatedPrice: number | undefined;

    if (this.baseOrderData()?.orderType === 'buy') {
      calculatedPrice = price.sell;
    } else {
      calculatedPrice = price.buy;
    }

    let tolerance = 0;

    if (config) {
      tolerance = this.baseOrderData()?.orderType == 'buy' ? config.sell_fee_margin : config.buy_fee_margin;

      if (calculatedPrice) {
        if (config.tolerance_type == 'fixed_amount') {
          return calculatedPrice + tolerance;
        } else {
          return calculatedPrice + (calculatedPrice * tolerance / 100);
        }
      }
    }

    return calculatedPrice;
  });

  // Add polling fallback method
  private pollingInterval: any;

  private startPollingFallback() {
    this.stopPollingFallback();

    this.pollingInterval = setInterval(() => {
      this.checkOrderStatusManually();
    }, 7000);
  }

  private registerVisibilityChangeListener(): void {
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        this.checkOrderStatusManually();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private removeVisibilityChangeListener(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  private stopPollingFallback() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private reCalculate() {
    const calculated_price = this.calculatedPrice();
    let price: number | undefined;

    switch (this.frozenItem) {
      case 'metal':
        if (this.settingByCash) return;  // Prevent circular updates

        this.settingByMetal = true;

        if (this.metalItem().unit == 'count') {
          price = this.baseOrderData()?.orderType == 'buy' ?
            Math.ceil(calculated_price! * Number(this.amountOfMetal) * 1000) / 1000 :
            Math.floor(calculated_price! * Number(this.amountOfMetal) * 1000) / 1000;
        } else {
          price = this.baseOrderData()?.orderType == 'buy' ?
            Number((Math.ceil(calculated_price! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR / 1000) * 1000 * Number(this.amountOfMetal)).toFixed(0)) :
            Number((Math.floor(calculated_price! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR / 1000) * 1000 * Number(this.amountOfMetal)).toFixed(0));
        }

        if (price) {
          if (this._amountOfCash != price) {
            this._amountOfCash = price;
          }

          setTimeout(() => {
            this.settingByMetal = false;
          }, 10)
        }

        break;
      case 'cash':
        if (this.settingByMetal) return;
        this.settingByCash = true;

        /*
        ** If a product allows entering a custom price for purchase or sale,
        ** its unit cannot be "count". The "count" unit does not support decimal
        ** quantities, while price-based entries may require fractional amounts.
        ** Therefore, any product with manually entered purchase or sale prices
        ** must use a non-count unit.
        */
        const oneGram = this.baseOrderData()?.orderType == 'buy' ?
          Math.ceil(calculated_price! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR * 1000) / 1000 :
          Math.floor(calculated_price! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR * 1000) / 1000;

        let amount = this._amountOfCash! / oneGram;

        if (amount != Number(this.amountOfMetal)) {
          this.amountOfMetal = amount < 0.001 ? '0' : parseFloat(amount.toFixed(3)).toString();
          this.validate();
        }

        setTimeout(() => {
          this.settingByCash = false;
        }, 10)
        break;
    }
  }

  onProgressUpdate(event: { progress: number, remainingTime: number }) {
    this.currentProgress = Math.round(event.progress);
    this.currentRemainingTime = event.remainingTime;
  }

  private initModal() {
    // set the modal menu element
    const $targetEl = document.getElementById('exchange-modal');

    // options with default values
    const options: ModalOptions = {
      placement: 'top-center',
      backdrop: 'dynamic',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
      closable: false,
      onHide: () => {
        // Prevent "Blocked aria-hidden" warning by clearing focus before hiding the modal
        (document.activeElement as HTMLElement)?.blur();
        document.body.focus();

        // Stop polling when modal closes
        this.stopPollingFallback();

        const metal_order = this.metalOrder();

        if (metal_order) {
          this.webSocketService.leaveChannel(`order-${metal_order.tracking_code}`, '.updated');
          this.metalOrder.set(undefined);
        }

        this.previousRate = undefined;
        this.rateChanging = false;
        this._amountOfCash = null;
        this.amountOfMetal = '';
        this.formIsValid = false;

        this.orderStateService.setModalState(false);
      },
      onShow: () => {
        this.orderStateService.setModalState(true);

        setTimeout(() => {
          if (this.quantityInput) {
            this.quantityInput.nativeElement.value = '';
            this.quantityInput.nativeElement.focus();
          }
        });
      }
    };

    // instance options object
    const instanceOptions = {
      id: 'exchange-modal',
      override: true
    };

    this.modal = new Modal($targetEl, options, instanceOptions);
  }

  openModal() {
    this.modal?.show();
  }

  closeModal() {
    this.modal?.hide();
  }

  onInputMetalToExchange(event: any) {
    const calculatedPrice = this.calculatedPrice();
    const input = event.target;
    // مقدار مستقیم از input (mask خودش کنترل می‌کند)
    this.amountOfMetal = input.value;
    const _amountOfMetal = this.normalizeNumericInput(input.value);

    if (this.settingByCash) return;  // Prevent circular updates
    this.settingByMetal = true;

    this.frozenItem = 'metal';

    if (this.metalItem().unit == 'gram') {
      if (this.baseOrderData()?.orderType == 'buy') {

        if (this.config().display_mode == 'quotation') {
          this._amountOfCash = Number(
            (calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR * Number(_amountOfMetal))
              .toFixed(0)
          );
        } else {
          console.log('gram', 'no quotation');

          this._amountOfCash = Number(
            (Math.ceil(calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR / 1000) * 1000 * Number(_amountOfMetal)).toFixed(0)
          );
        }

      } else {

        if (this.config().display_mode == 'quotation') {
          this._amountOfCash = Number(
            (calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR * Number(_amountOfMetal)).toFixed(0)
          );
        } else {
          this._amountOfCash = Number(
            (Math.floor(calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR / 1000) * 1000 * Number(_amountOfMetal)).toFixed(0)
          );
        }

      }
    } else {
      this._amountOfCash = Number(
        (calculatedPrice! * Number(_amountOfMetal)).toFixed(0)
      );
    }

    this.validate();

    setTimeout(() => {
      this.settingByMetal = false;
    }, 10);
  }

  get amountOfCash(): number | null {
    return this._amountOfCash;
  }

  set amountOfCash(value: number) {
    if (this.settingByMetal) return;

    const calculatedPrice = this.calculatedPrice();

    this.settingByCash = true;

    this.frozenItem = 'cash';

    this._amountOfCash = value;

    let price: number;

    if (this.config()?.display_mode == 'quotation' && this.metalItem().unit == 'count') {
      if (this.baseOrderData()?.orderType == 'buy') {
        price = Math.ceil(calculatedPrice! / 1000) * 1000;
      } else {
        price = Math.floor(calculatedPrice! / 1000) * 1000;
      }
    } else {
      if (this.baseOrderData()?.orderType == 'buy') {
        price = Math.ceil(calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR);
      } else {
        price = Math.floor(calculatedPrice! / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR);
      }
    }

    let amount = value! / price;
    this.amountOfMetal = amount < 0.001 ? '0' : parseFloat(amount.toFixed(3)).toString();

    this.validate();

    setTimeout(() => {
      this.settingByCash = false;
    }, 10)
  }

  get mask(): string {
    if (this.metalItem().unit == 'gram') {
      return 'separator.3';
    } else {
      return 'separator.0';
    }
  }

  private normalizeNumericInput(value: string | null | undefined): string {
    return (value ?? '').replace(/,/g, '').trim();
  }

  exchange() {
    if (this.validate()) {

      const _amountOfMetal = this.normalizeNumericInput(this.amountOfMetal);

      const data = {
        'metal_item_id': this.metalItem().id,
        'selected_metal_price_id': String(this.latestPrice()?.id),
        'quantity': String(_amountOfMetal),
        'amount': Math.floor(this.amountOfCash!).toString(),
        'frozen': this.frozenItem,
        'dealing_group_id': this.config().dealing_group_id,
        'action': this.baseOrderData()?.orderType
      }

      this.submitting = true;

      this.metalOrderService.store(data).subscribe({
        next: (response: any) => {
          this.submitting = false;
          this.now = response.order.now;
          this.metalOrder.set(response.order);

          if (this.progressBar) {
            this.progressBar.start();
          }

          this.orderStateService.setModalState(true, response.order.tracking_code);

          // Start listening immediately without delay
          this.listenToOrder();
        },
        error: (error) => {
          this.submitting = false;
          if (error.status == 406) {
            this.matSnackBar.open(error.error.message, 'باشه', {duration: 3000});
          }
        }
      })
    }
  }

  public validate(): boolean {
    this.errors = {};
    let valid = true;
    const minOrder = this.config().min_order ?? 0.001;
    const maxOrder = this.config().max_order ?? Infinity;
    const _amountOfMetal = this.normalizeNumericInput(this.amountOfMetal);

    if (!_amountOfMetal || (_amountOfMetal && Number(_amountOfMetal) <= 0)) {
      this.errors['amountOfMetal'] = [`فیلد مقدار سفارش الزامی است`];
      valid = false;
    } else {
      if (
        _amountOfMetal &&
        Number(_amountOfMetal) != 0 &&
        Number(_amountOfMetal) < minOrder
      ) {
        this.errors['amountOfMetal'] = [`حداقل سفارش ${removeTrailingZeros(minOrder)} گرم می‌باشد `];
        valid = false;
      } else if (
        _amountOfMetal &&
        Number(_amountOfMetal) != 0 &&
        Number(_amountOfMetal) > maxOrder
      ) {
        this.errors['amountOfMetal'] = [`حداکثر سفارش ${removeTrailingZeros(maxOrder)} گرم می‌باشد `];
        valid = false;
      }
    }

    this.formIsValid = Object.entries(this.errors).length === 0;

    return valid;
  }

  public clearError(key: string) {
    delete this.errors[key];
  }

  listenToOrder() {

    const metal_order = this.metalOrder();

    if (metal_order) {

      const unsubscribe = this.webSocketService.listenToPrivateChannel(
        `order-${metal_order.tracking_code}`,
        '.updated',
        (e: any) => {

          if (metal_order && e) {
            this.metalOrder.set(e);
            if (e.status == 'succeed') {
              this.notificationService.playSucceedSound();
            } else if (e.status == 'rejected') {
              this.notificationService.playRejectSound();
            }
          }
        });

      this.wsCleanupFunctions.push(unsubscribe);

    }
  }

  checkOrderStatusManually() {
    const metal_order = this.metalOrder();
    if (! metal_order || ['succeed', 'rejected', 'canceled'].includes(metal_order.status)) return;

    if (metal_order) {
      this.metalOrderService.show(metal_order.tracking_code).subscribe({
        next: (response: any) => {
          if (metal_order && metal_order.status != response.order.status) {

            this.metalOrder.set(response.order);
            if (response.order.status == 'succeed') {
              this.notificationService.playSucceedSound();
            } else if (response.order.status == 'rejected') {
              this.notificationService.playRejectSound();
            }
          }
        }
      })
    }
  }

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));
  protected readonly Math = Math;
  protected readonly AppConstants = AppConstants;
}
