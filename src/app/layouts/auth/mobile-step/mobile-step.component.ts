import {Component, inject, OnInit, ChangeDetectionStrategy, signal, viewChild} from '@angular/core';
import {AuthService} from '../../../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {convertToEnglishNumbersUtil} from '../../../utils/convert-to-english-numbers.util';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ValidationService} from '../../../services/validation.service';
import {ErrorDisplayComponent} from '../../../components/error-display/error-display.component';
import {maskCompleteValidator} from '../../../validators/mask-complete-validator';
import {environment} from '../../../../environments/environment';
import {AppModal} from '../../../components/modal/modal.component';
import {PageService} from '../../../services/page.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Page} from '../../../interfaces/page';

@Component({
  selector: 'app-mobile-step',
  imports: [
    ButtonWithLoaderComponent,
    NgxMaskDirective,
    ReactiveFormsModule,
    ErrorDisplayComponent,
    RouterLink,
    AppModal,
  ],
  templateUrl: './mobile-step.component.html',
  styleUrl: './mobile-step.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    provideNgxMask()
  ]
})
export class MobileStepComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private flow = inject(AuthFlowService);
  private matSnackBar = inject(MatSnackBar);
  private validationService = inject(ValidationService);
  private pageService = inject(PageService);
  private sanitizer = inject(DomSanitizer);

  private readonly termsModal = viewChild.required<AppModal>('termsModal');

  readonly environment = environment;

  /** Convert Persian/Arabic numerals to English */
  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  submitting = false;
  submittingLeadForm = false;
  statusError = ''; // مربوط به پیغام غیر فعال بودن حساب کاربری
  state: any;

  leadForm!: FormGroup;
  loginByOtpForm!: FormGroup;

  readonly termsLoading = signal(false);
  readonly termsPage = signal<Page | null>(null);
  readonly termsBody = signal<SafeHtml | null>(null);

  constructor() {
    this.loginByOtpForm = this.formBuilder.group({
      phone: new FormControl('', {
        validators: [
          Validators.required,
          maskCompleteValidator(11)
        ]
      }),
      agreement: new FormControl(false, {
        validators: [Validators.requiredTrue],
      }),
    });

    this.leadForm = this.formBuilder.group({
      lead_phone: new FormControl('', {
        validators: [
          Validators.required,
          maskCompleteValidator(11)
        ]
      }),
    });
  }

  ngOnInit() {
    this.state = this.flow.getState();

    if (this.state && this.state.mobile) {
      this.loginByOtpForm.get('phone')?.setValue(this.state.mobile);
    }

    this.syncAgreementRequirement();
  }

  get isForgotPassword(): boolean {
    return !!this.state?.action && this.state.action === 'forgot_password';
  }

  back() {
    this.flow.clear();
    this.state = this.flow.getState();
    this.syncAgreementRequirement();
  }

  openTermsModal(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.termsModal().show();
    this.ensureTermsLoaded();
  }

  closeTermsModal(): void {
    this.termsModal().hide();
  }

  async submit(): Promise<void> {
    if (this.loginByOtpForm.invalid) {
      this.loginByOtpForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const phone = this.loginByOtpForm.value.phone;

    const data = {
      phone,
      ...(this.state?.action ? {action: this.state.action} : {})
    };

    this.authService.sendOtp(data).subscribe({
      next: (res) => {
        this.submitting = false;

        if (res.action === 'password') {
          // کاربر رمز دارد — بدون OTP به password-step
          this.flow.setState({mobile: phone});
          this.router.navigate(['/auth/password']);
          return;
        }

        // کاربر جدید یا بدون رمز — OTP ارسال شد
        this.flow.setState({
          mobile: phone,
          action: res.action,
          time_remaining: res.time_remaining,
          otp_sent_at: Date.now(),
        });
        this.router.navigate(['/auth/verify']);
      },
      error: error => {
        this.submitting = false;

        if (error.status === 429) {
          this.matSnackBar.open('تعداد درخواست‌ها بیش از حد مجاز است.', 'باشه', {duration: 3000})
        } else if (error.status === 422) {
          const serverErrors = this.validationService.normalizeBackendErrors(error);

          if (serverErrors['status']) {
            this.statusError = serverErrors['status']['serverError'];
          }

          this.applyServerErrors(this.loginByOtpForm, serverErrors);
        }
      }
    });
  }

  submitLead(): void {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.submittingLeadForm = true;

    const lead_phone = this.leadForm.value.lead_phone;

    this.authService.lead({phone: lead_phone}).subscribe({
      next: (res) => {
        this.submittingLeadForm = false;
        this.leadForm.reset();
        this.matSnackBar.open(res.message, 'باشه', {
          duration: 5000,
          verticalPosition: "top",
          horizontalPosition: "center"
        });
      },
      error: error => {
        this.submittingLeadForm = false;

        if (error.status === 429) {
          this.matSnackBar.open('تعداد درخواست‌ها بیش از حد مجاز است.', 'باشه', {duration: 3000})
        } else if (error.status === 422) {
          const serverErrors = this.validationService.normalizeBackendErrors(error);

          if (serverErrors['status']) {
            this.statusError = serverErrors['status']['serverError'];
          }

          this.applyServerErrors(this.leadForm, serverErrors);
        }
      }
    });
  }

  private syncAgreementRequirement(): void {
    const agreement = this.loginByOtpForm.get('agreement');
    if (!agreement) {
      return;
    }

    if (this.isForgotPassword) {
      agreement.clearValidators();
      agreement.setValue(true);
    } else {
      agreement.setValidators([Validators.requiredTrue]);
      if (agreement.value !== true) {
        agreement.setValue(false);
      }
    }
    agreement.updateValueAndValidity({emitEvent: false});
  }

  private ensureTermsLoaded(): void {
    if (this.termsPage() || this.termsLoading()) {
      return;
    }

    this.termsLoading.set(true);
    this.pageService.terms().subscribe({
      next: (page) => {
        this.termsPage.set(page);
        this.termsBody.set(this.sanitizer.bypassSecurityTrustHtml(page.body ?? ''));
        this.termsLoading.set(false);
      },
      error: () => {
        this.termsLoading.set(false);
      },
    });
  }

  /** Apply server-side validation errors to the matching form controls */
  private applyServerErrors(form: FormGroup, errors: Record<string, any>): void {
    Object.keys(errors).forEach(key => {
      const control = form.get(key);
      if (control) control.setErrors(errors[key]);
    });
  }
}
