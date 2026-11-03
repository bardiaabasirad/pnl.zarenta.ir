import {Component, inject, OnInit, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {firstValueFrom} from 'rxjs';
import {BankAccountService} from '../../services/bank-account.service';
import {ValidationService} from '../../services/validation.service';
import {iranianShebaValidator, normalizeSheba} from '../../validators/iranian-sheba-validator';
import {BankAccountStatus} from '../../interfaces/enums';
import {environment} from '../../../environments/environment';
import {HttpErrorResponse} from '@angular/common/http';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {ConfirmModalComponent} from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, ConfirmModalComponent],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.css',
  providers: [
    provideNgxMask()
  ]
})
export class BankAccountsComponent implements OnInit {
  private readonly confirmModal = viewChild.required(ConfirmModalComponent);
  private bankAccountService = inject(BankAccountService);
  private validationService = inject(ValidationService);
  private titleService = inject(Title);

  loading = signal(false);
  submitting = signal(false);
  deletingId = signal<number | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  items = signal<any[]>([]);

  sheba = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, iranianShebaValidator],
  });

  ngOnInit(): void {
    this.titleService.setTitle(`حساب‌های بانکی | ${environment.appTitle || 'زرنتا'}`);
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);
    this.bankAccountService.index().subscribe({
      next: (res) => this.items.set(res?.data ?? []),
      error: (err) => this.error.set(err?.error?.message || 'خطا در دریافت حساب‌های بانکی'),
      complete: () => this.loading.set(false),
    });
  }

  shebaErrors(): string[] {
    if (!this.sheba.touched && !this.sheba.dirty) {
      return [];
    }
    return this.validationService.getFormErrors(this.sheba).map((e) => e.message);
  }

  submit(): void {
    this.sheba.markAsTouched();
    if (this.sheba.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const sheba = normalizeSheba(this.sheba.value);
    const normalized = sheba.startsWith('IR') ? sheba : `IR${sheba}`;

    this.bankAccountService.create(normalized).subscribe({
      next: (res) => {
        this.sheba.reset('');
        this.success.set(res?.message || 'حساب بانکی ثبت شد.');
        this.loadList();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 422 && err.error?.errors) {
          const normalized = this.validationService.normalizeBackendErrors(err);
          if (normalized['sheba']) {
            this.sheba.setErrors(normalized['sheba']);
          }
          this.error.set(err.error?.message || 'خطا در اعتبارسنجی شماره شبا');
        } else {
          this.error.set(err?.error?.message || 'ثبت حساب بانکی ناموفق بود');
        }
      },
      complete: () => this.submitting.set(false),
    });
  }

  async remove(row: any): Promise<void> {
    await this.confirmModal().ask({
      title: 'حذف حساب بانکی',
      message: 'حساب بانکی حذف شود؟',
      confirmLabel: 'بله، حذفش کن!',
      onConfirm: async () => {
        this.error.set(null);
        try {
          const res = await firstValueFrom(this.bankAccountService.destroy(row.id));
          this.success.set(res?.message || 'حساب بانکی حذف شد.');
          this.loadList();
        } catch (err: any) {
          this.error.set(err?.error?.message || 'حذف ناموفق بود');
          throw err;
        }
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case BankAccountStatus.PENDING:
        return 'در انتظار بررسی';
      case BankAccountStatus.APPROVED:
        return 'تایید شده';
      case BankAccountStatus.REJECTED:
        return 'رد شده';
      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case BankAccountStatus.PENDING:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case BankAccountStatus.APPROVED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case BankAccountStatus.REJECTED:
        return 'bg-rose-50 text-rose-700 border-rose-200';
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

  /**
   * ارقام فارسی/عربی → لاتین؛ پیشوند IR در paste حذف می‌شود.
   * فاصله‌های mask حفظ می‌شوند تا مکان‌نما نپرد.
   */
  public toEnglishDigits = (value: unknown): string => {
    const map: Record<string, string> = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };
    return String(value ?? '')
      .replace(/[۰-۹٠-٩]/g, (digit) => map[digit] ?? digit)
      .replace(/^IR/i, '')
      .replace(/[^\d\s]/g, '');
  };
}
