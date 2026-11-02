import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PhysicalDeliveryService} from '../../services/physical-delivery.service';
import {AssetService} from '../../services/asset.service';
import {Title} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';
import {DropdownSelect} from '../../components/dropdown-select/dropdown-select';

@Component({
  selector: 'app-physical-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelect],
  templateUrl: './physical-deliveries.component.html',
  styleUrl: './physical-deliveries.component.css',
  providers: [DecimalPipe],
})
export class PhysicalDeliveriesComponent implements OnInit {
  private deliveryService = inject(PhysicalDeliveryService);
  private assetService = inject(AssetService);
  private titleService = inject(Title);
  private decimalPipe = inject(DecimalPipe);

  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  items = signal<any[]>([]);
  spotMetals = signal<any[]>([]);
  quote = signal<any | null>(null);
  metalItemId = signal<string | number | null>(null);
  qty = signal('');

  readonly metalOptions = computed(() =>
    this.spotMetals().map((w) => {
      const available = this.decimalPipe.transform(w.available_balance) ?? w.available_balance;
      let label = `${w.metal_item?.title ?? 'فلز'} — آزاد ${available}`;
      if (w.blocked_balance && Number(w.blocked_balance) !== 0) {
        const blocked = this.decimalPipe.transform(w.blocked_balance) ?? w.blocked_balance;
        label += ` (رزرو ${blocked})`;
      }
      return {
        metal_item_id: w.metal_item_id,
        label,
      };
    })
  );

  readonly canSubmit = computed(() => {
    const metalId = this.metalItemId();
    const qty = String(this.qty() ?? '').trim();
    return metalId !== null && metalId !== '' && !!qty && !this.submitting();
  });

  ngOnInit(): void {
    this.titleService.setTitle(`تحویل فیزیکی | ${environment.appTitle || 'زرنتا'}`);
    this.loadAssets();
    this.loadList();
  }

  loadAssets(): void {
    this.assetService.assets().subscribe({
      next: (res) => {
        const spot = res?.assets?.spot_and_cash ?? [];
        const metals = (Array.isArray(spot) ? spot : []).filter(
          (w: any) => w.metal_item_id && w.metal_item?.is_spot && Number(w.available_balance) > 0
        );
        this.spotMetals.set(metals);
      },
    });
  }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);
    this.deliveryService.index('count=50').subscribe({
      next: (res) => {
        this.items.set(res?.data?.data ?? []);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'خطا در دریافت درخواست‌ها');
      },
      complete: () => this.loading.set(false),
    });
  }

  selectedWallet(): any | undefined {
    return this.spotMetals().find((w) => w.metal_item_id == this.metalItemId());
  }

  onMetalChange(value: string | number | null): void {
    this.metalItemId.set(value);
    this.quote.set(null);
    if (this.metalItemId() && this.qty().trim()) {
      this.refreshQuote();
    }
  }

  onQtyChange(value: string): void {
    this.qty.set(value ?? '');
    this.refreshQuote();
  }

  refreshQuote(): void {
    const metalId = this.metalItemId();
    const qty = this.qty().trim();
    if (!metalId || !qty) {
      this.quote.set(null);
      return;
    }
    this.deliveryService.quote({
      metal_item_id: Number(metalId),
      qty,
    }).subscribe({
      next: (res) => this.quote.set(res.data),
      error: (err) => {
        this.quote.set(null);
        this.error.set(err?.error?.message || 'خطا در محاسبه کارمزد');
      },
    });
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    const metalId = this.metalItemId();
    const qty = this.qty().trim();
    const wallet = this.selectedWallet();
    if (wallet && Number(qty) > Number(wallet.available_balance)) {
      this.error.set('مقدار از موجودی آزاد بیشتر است.');
      return;
    }
    if (!confirm('ثبت درخواست تحویل؟ وزن رزرو و کارمزد از کیف‌پول کسر می‌شود.')) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.deliveryService.create({
      metal_item_id: Number(metalId),
      qty,
      idempotency_key: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    }).subscribe({
      next: (res) => {
        this.qty.set('');
        this.quote.set(null);
        this.loadAssets();
        this.loadList();
        alert(res.message || 'ثبت شد');
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'ثبت ناموفق بود');
      },
      complete: () => this.submitting.set(false),
    });
  }

  cancel(row: any): void {
    if (!confirm('لغو درخواست و استرداد کارمزد؟')) {
      return;
    }
    this.submitting.set(true);
    this.deliveryService.cancel(row.id).subscribe({
      next: () => {
        this.loadAssets();
        this.loadList();
      },
      error: (err) => this.error.set(err?.error?.message || 'لغو ناموفق'),
      complete: () => this.submitting.set(false),
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'در انتظار بررسی';
      case 'READY_FOR_PICKUP':
        return 'آماده تحویل';
      case 'DELIVERED':
        return 'تحویل شد';
      case 'CANCELLED':
        return 'لغو شده';
      case 'REJECTED':
        return 'رد شده';
      default:
        return status;
    }
  }

  canCancel(status: string): boolean {
    return status === 'PENDING' || status === 'READY_FOR_PICKUP';
  }
}
