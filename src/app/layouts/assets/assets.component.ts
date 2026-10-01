import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {AssetService} from '../../services/asset.service';
import {Asset} from '../../interfaces/asset';
import {DecimalPipe} from '@angular/common';
import {SelectedMetalPrice} from '../../interfaces/selected-metal-price';
import {AppConstants} from '../../constants/app-constants';

@Component({
  selector: 'app-assets',
  imports: [DecimalPipe],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent implements OnInit {
  initialized = signal<boolean>(false);
  spotAndCash = signal<Asset[]>([]);
  others = signal<Asset[]>([]);
  latestPrices = signal<SelectedMetalPrice[]>([]);

  readonly assetService = inject(AssetService);

  // ایجاد یک دیکشنری برای جستجوی O(1) و سریع‌ترین نرخ‌ها
  pricesMap = computed(() => {
    const map = new Map<number, SelectedMetalPrice>();
    const rawData = this.latestPrices();
    const prices: SelectedMetalPrice[] = Array.isArray(rawData)
      ? rawData
      : (rawData && typeof rawData === 'object' ? Object.values(rawData) : []);

    for (const price of prices) {
      if (price && price.metal_item_id) {
        map.set(Number(price.metal_item_id), price);
      }
    }
    return map;
  });

  ngOnInit() {
    this.assetService.assets().subscribe({
      next: (response) => {
        this.spotAndCash.set(response.assets.spot_and_cash);
        this.others.set(response.assets.forward_items);
        this.latestPrices.set(response.latest_prices);
        this.initialized.set(true);
      },
      error: () => {
        this.initialized.set(true);
      },
    });
  }

  getEffectiveBuyPrice(priceObj: SelectedMetalPrice, asset: Asset): number | null {
    const isSpot = Boolean(asset.metal_item?.is_spot || priceObj.metal_item?.is_spot);

    const rawBuy = isSpot && priceObj.best_spot_buy != null
      ? Number(priceObj.best_spot_buy)
      : Number(priceObj.buy);

    if (!Number.isFinite(rawBuy) || rawBuy <= 0) {
      return null;
    }

    const itemUnit = asset.metal_item?.unit || priceObj.metal_item?.unit;
    if (itemUnit === 'gram') {
      return rawBuy / AppConstants.MARKET_SPECIFIC_CONVERSION_FACTOR;
    }

    return rawBuy;
  }

// محاسبه نهایی PnL
  calculateProfitLossPercentage(asset: Asset): number | null {
    const avgBuyPrice = Number(asset.avg_buy_price);
    if (!asset.metal_item_id || !Number.isFinite(avgBuyPrice) || avgBuyPrice <= 0) {
      return null;
    }

    const priceObj = this.pricesMap().get(Number(asset.metal_item_id));
    if (!priceObj) {
      return null;
    }

    const effectiveBuyPrice = this.getEffectiveBuyPrice(priceObj, asset);
    if (effectiveBuyPrice === null) {
      return null;
    }

    const pnl = ((effectiveBuyPrice - avgBuyPrice) / avgBuyPrice) * 100;
    return Math.round(pnl * 100) / 100;
  }

}
