import {
  Component, computed,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {roundToStep} from '../../../../utils/number-precision';
import {
  convertMetalPrice,
  resolveTargetUnitId
} from '../../../../utils/metal-price.util';

@Component({
  selector: 'app-exchange-btn',
  imports: [
    CommonModule,
  ],
  templateUrl: './exchange-btn.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './exchange-btn.component.scss',
})
export class ExchangeBtnComponent {
  rate = input<number | undefined>(undefined);
  marketStatus = input<'active' | 'inactive'>('inactive');
  config = input<any>();
  productStatus = input<boolean>(false);
  orderType = input<'buy' | 'sell'>('buy');
  metalItem = input<number>();
  pricingUnitId = input<string>('mazane');
  modalOpened = output<{
    orderType: 'buy' | 'sell';
    metal_item_id?: number;
  }>();

  /**
   * ۱. قیمت تعدیل‌شده (شامل کارمزد/تلرانس مارکت) در واحد قیمت‌گذاری خام
   */
  readonly adjustedPrice = computed<number | undefined>(() => {
    const rawRate = this.rate();
    const config = this.config();

    if (rawRate === undefined || rawRate === null) {
      return undefined;
    }

    if (!config) {
      return rawRate;
    }

    const tolerance =
      this.orderType() === 'buy'
        ? Number(config.sell_fee_margin ?? 0)
        : Number(config.buy_fee_margin ?? 0);

    if (config.tolerance_type === 'fixed_amount') {
      return rawRate + tolerance;
    } else {
      return rawRate + (rawRate * tolerance) / 100;
    }
  });

  /**
   * ۲. قیمت نهایی نمایشی در واحد هدف گروه
   * Display = Price × (targetMult / sourceMult); buy ceil thousand, sell floor thousand
   */
  readonly finalDisplayPrice = computed<number | undefined>(() => {
    const price = this.adjustedPrice();
    if (price === undefined || price === null) {
      return undefined;
    }

    const config = this.config();
    const isBuy = this.orderType() === 'buy';
    const sourceUnit = this.pricingUnitId() || 'mazane';
    const targetUnit = resolveTargetUnitId(config);

    const basePrice = convertMetalPrice(price, sourceUnit, targetUnit);

    return isBuy ? roundToStep(Math.ceil(basePrice), true) : roundToStep(Math.floor(basePrice), false);
  });

  openModal() {
    this.modalOpened.emit({
      orderType: this.orderType(),
      metal_item_id: this.metalItem(),
    });
  }
}
