import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {BankAccountService} from '../../services/bank-account.service';
import {ValidationService} from '../../services/validation.service';
import {iranianShebaValidator, normalizeSheba} from '../../validators/iranian-sheba-validator';
import {BankAccountStatus} from '../../interfaces/enums';
import {environment} from '../../../environments/environment';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.scss',
})
export class BankAccountsComponent implements OnInit {
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

  remove(row: any): void {
    if (!confirm('حساب بانکی حذف شود؟')) {
      return;
    }

    this.deletingId.set(row.id);
    this.error.set(null);
    this.bankAccountService.destroy(row.id).subscribe({
      next: (res) => {
        this.success.set(res?.message || 'حساب بانکی حذف شد.');
        this.loadList();
      },
      error: (err) => this.error.set(err?.error?.message || 'حذف ناموفق بود'),
      complete: () => this.deletingId.set(null),
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
}
