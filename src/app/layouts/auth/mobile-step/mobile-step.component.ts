import {Component, inject, OnInit, ChangeDetectionStrategy} from '@angular/core';
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
import {TestimonialSliderComponent} from '../partials/testimonial-slider/testimonial-slider.component';

@Component({
  selector: 'app-mobile-step',
  imports: [
    ButtonWithLoaderComponent,
    NgxMaskDirective,
    ReactiveFormsModule,
    RouterLink,
    ErrorDisplayComponent,
    TestimonialSliderComponent
  ],
  templateUrl: './mobile-step.component.html',
  styleUrl: './mobile-step.component.scss',
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

  /** Convert Persian/Arabic numerals to English */
  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  submitting = false;
  submittingLeadForm = false;
  statusError = ''; // مربوط به پیغام غیر فعال بودن حساب کاربری
  state: any;

  leadForm!: FormGroup;
  loginByOtpForm!: FormGroup;

  constructor() {
    this.loginByOtpForm = this.formBuilder.group({
      phone: new FormControl('', {
        validators: [
          Validators.required,
          maskCompleteValidator(11)
        ]
      }),
      agreement: new FormControl(true),
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
  }

  back() {
    this.flow.clear();
    this.state = this.flow.getState();
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
          otp_sent_at: Date.now(),   // ← زمان دریافت پاسخ برای حساب دقیق
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

  /** Apply server-side validation errors to the matching form controls */
  private applyServerErrors(form: FormGroup, errors: Record<string, any>): void {
    Object.keys(errors).forEach(key => {
      const control = form.get(key);
      if (control) control.setErrors(errors[key]);
    });
  }

}
