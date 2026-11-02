import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {HttpErrorResponse} from '@angular/common/http';
import {FiatWithdrawalService} from '../../services/fiat-withdrawal.service';
import {ValidationService} from '../../services/validation.service';
import {DropdownSelect} from '../../components/dropdown-select/dropdown-select';
import {environment} from '../../../environments/environment';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {convertToEnglishNumbersUtil} from '../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DropdownSelect, DecimalPipe, NgxMaskDirective],
  templateUrl: './withdrawals.component.html',
  styleUrl: './withdrawals.component.css',
  providers: [
    provideNgxMask()
  ]
})
export class WithdrawalsComponent implements OnInit {
  private withdrawalService = inject(FiatWithdrawalService);
  private validationService = inject(ValidationService);
  private titleService = inject(Title);

  loadingMeta = signal(false);
  loadingList = signal(false);
  submitting = signal(false);
  cancellingId = signal<number | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  availableBalance = signal('0');
  bankAccounts = signal<any[]>([]);
  items = signal<any[]>([]);

  form = new FormGroup({
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+$/)],
    }),
    metal_trader_bank_account_id: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
  });

  readonly bankOptions = computed(() =>
    this.bankAccounts().map((b) => ({
      id: b.id,
      label: this.formatSheba(b.sheba),
    }))
  );

  canSubmit(): boolean {
    return this.form.valid && !this.submitting() && this.bankAccounts().length > 0;
  }

  ngOnInit(): void {
    this.titleService.setTitle(`برداشت تومان | ${environment.appTitle || 'زرنتا'}`);
    this.loadMeta();
    this.loadList();
  }

  loadMeta(): void {
    this.loadingMeta.set(true);
    this.withdrawalService.formMeta().subscribe({
      next: (res) => {
        this.availableBalance.set(String(res?.data?.available_balance ?? '0'));
        const banks = res?.data?.bank_accounts ?? [];
        this.bankAccounts.set(banks);
        if (banks.length === 1) {
          this.form.controls.metal_trader_bank_account_id.setValue(banks[0].id);
        }
      },
      error: (err) => this.error.set(err?.error?.message || 'خطا در دریافت اطلاعات کیف پول'),
      complete: () => this.loadingMeta.set(false),
    });
  }

  loadList(): void {
    this.loadingList.set(true);
    this.withdrawalService.index('count=50').subscribe({
      next: (res) => this.items.set(res?.data?.data ?? []),
      error: (err) => this.error.set(err?.error?.message || 'خطا در دریافت درخواست‌ها'),
      complete: () => this.loadingList.set(false),
    });
  }

  withdrawAll(): void {
    const balance = this.availableBalance();
    if (Number(balance) > 0) {
      this.form.controls.amount.setValue(String(Math.floor(Number(balance))));
    }
  }

  amountErrors(): string[] {
    const control = this.form.controls.amount;
    if (!control.touched && !control.dirty) {
      return [];
    }
    return this.validationService.getFormErrors(control).map((e) => e.message);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) {
      return;
    }

    const amount = this.form.controls.amount.value;
    const bankId = this.form.controls.metal_trader_bank_account_id.value;
    if (!bankId) {
      return;
    }

    if (Number(amount) > Number(this.availableBalance())) {
      this.error.set('مبلغ از موجودی تومان بیشتر است.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.withdrawalService.create({
      amount,
      metal_trader_bank_account_id: bankId,
    }).subscribe({
      next: (res) => {
        this.success.set(res?.message || 'درخواست برداشت ثبت شد.');
        this.form.controls.amount.reset('');
        this.loadMeta();
        this.loadList();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 422 && err.error?.errors) {
          const normalized = this.validationService.normalizeBackendErrors(err);
          Object.keys(normalized).forEach((key) => {
            const control = this.form.get(key);
            if (control) {
              control.setErrors(normalized[key]);
            }
          });
        }
        this.error.set(err?.error?.message || 'ثبت درخواست ناموفق بود');
      },
      complete: () => this.submitting.set(false),
    });
  }

  cancel(row: any): void {
    if (!confirm('لغو درخواست و بازگشت مبلغ به کیف تومان؟')) {
      return;
    }

    this.cancellingId.set(row.id);
    this.error.set(null);
    this.withdrawalService.cancel(row.id).subscribe({
      next: (res) => {
        this.success.set(res?.message || 'درخواست لغو شد.');
        this.loadMeta();
        this.loadList();
      },
      error: (err) => this.error.set(err?.error?.message || 'لغو ناموفق بود'),
      complete: () => this.cancellingId.set(null),
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'در انتظار پرداخت';
      case 'paid':
        return 'پرداخت شده';
      case 'rejected':
        return 'رد شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  formatSheba(sheba: string): string {
    if (!sheba) {
      return '';
    }
    return sheba.replace(/(.{4})/g, '$1 ').trim();
  }

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));
}
