import {
  Component, computed,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CeilPipe} from '../../../../pipes/ceil.pipe';
import {FloorPipe} from '../../../../pipes/floor.pipe';
import {AppConstants} from '../../../../constants/app-constants';

@Component({
  selector: 'app-exchange-btn',
  imports: [
    CommonModule,
    CeilPipe,
    FloorPipe,
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
  modalOpened = output<{
    orderType: 'buy' | 'sell';
    metal_item_id?: number;
  }>();

  calculatedPrice = computed(() => {
    const price = this.rate();
    const config = this.config();

    let tolerance = 0
    if (config) {
      tolerance = this.orderType() == 'buy' ? config.sell_fee_margin : config.buy_fee_margin;

      if (price) {
        if (this.config().tolerance_type == 'fixed_amount') {
          return price + tolerance;
        } else {
          return price + (price * tolerance / 100);
        }
      }
    }

    return price;
  });

  openModal() {
    this.modalOpened.emit({
      orderType: this.orderType(),
      metal_item_id: this.metalItem(),
    });
  }

  protected readonly AppConstants = AppConstants;
}
