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
  styleUrl: './assets.component.css',
})
export class AssetsComponent implements OnInit {
  initialized = signal<boolean>(false);
  spotAndCash = signal<Asset[]>([]);
  others = signal<Asset[]>([]);
  latestPrices = signal<SelectedMetalPrice[]>([]);

  readonly assetService = inject(AssetService);

  /** کیف‌پول تومانی حاضر: metal_item_id خالی است */
  readonly cashWallet = computed(() =>
    this.spotAndCash().find((asset) => this.isCashWallet(asset)) ?? null
  );

  readonly spotMetals = computed(() =>
    this.spotAndCash().filter((asset) => !this.isCashWallet(asset))
  );

  readonly hasAssets = computed(() =>
    this.spotAndCash().length > 0 || this.others().length > 0
  );

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
        const spotAndCash = this.toAssetArray(response?.assets?.spot_and_cash);
        const forwardItems = this.toAssetArray(response?.assets?.forward_items);

        // کیف تومانی را همیشه اول لیست موجودی حاضر نگه می‌داریم
        this.spotAndCash.set(this.withCashFirst(spotAndCash));
        this.others.set(forwardItems);
        this.latestPrices.set(response?.latest_prices ?? []);
        this.initialized.set(true);
      },
      error: () => {
        this.initialized.set(true);
      },
    });
  }

  isCashWallet(asset: Asset | null | undefined): boolean {
    if (!asset) {
      return false;
    }
    return asset.metal_item_id == null || asset.metal_item == null;
  }

  /** موجودی قابل‌نمایش کیف تومانی (available + blocked) */
  cashBalance(asset: Asset): number {
    const available = Number(asset.available_balance ?? 0);
    const blocked = Number(asset.blocked_balance ?? 0);
    const total = Number(asset.total_balance);
    if (Number.isFinite(total)) {
      return total;
    }
    return (Number.isFinite(available) ? available : 0) + (Number.isFinite(blocked) ? blocked : 0);
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

  private toAssetArray(value: unknown): Asset[] {
    if (Array.isArray(value)) {
      return value as Asset[];
    }
    if (value && typeof value === 'object') {
      return Object.values(value) as Asset[];
    }
    return [];
  }

  private withCashFirst(assets: Asset[]): Asset[] {
    const cash: Asset[] = [];
    const rest: Asset[] = [];
    for (const asset of assets) {
      if (this.isCashWallet(asset)) {
        cash.push(asset);
      } else {
        rest.push(asset);
      }
    }
    return [...cash, ...rest];
  }

}
