import {Component, DestroyRef, inject, ChangeDetectionStrategy} from '@angular/core';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {ErrorDisplayComponent} from '../../../components/error-display/error-display.component';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ValidationService} from '../../../services/validation.service';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-step',
  imports: [
    ButtonWithLoaderComponent,
    ErrorDisplayComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './password-step.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './password-step.component.scss'
})
export class PasswordStepComponent {
  // ─── Services ────────────────────────────────────────────────────────────────

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private flow = inject(AuthFlowService);
  private matSnackBar = inject(MatSnackBar);
  private validationService = inject(ValidationService);

  loginByPasswordForm!: FormGroup;

  statusError = ''; // مربوط به پیغام غیر فعال بودن حساب کاربری
  submitting = false;
  otpLoading = false;
  errors: { [key: string]: string[] } = {};

  constructor() {
    this.loginByPasswordForm = this.formBuilder.group({
      password: new FormControl('', {validators: [Validators.required]}),
      agreement: new FormControl(true),
    });
  }

  back() {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }

  get mobile(): string | null {
    return this.flow.getState()?.mobile ?? null;
  }

  forgotPassword() {
    this.flow.setState({...this.flow.getState(), action: 'forgot_password'});
    this.router.navigate(['/auth/mobile']);
  }

  /** Login by password */
  async loginByPassword(): Promise<void> {
    this.statusError = '';

    (document.activeElement as HTMLElement | null)?.blur();
    this.loginByPasswordForm.updateValueAndValidity();

    if (this.loginByPasswordForm.valid) {
      const phone = this.mobile;

      if (!phone) {
        this.router.navigate(['/auth/mobile']);
      }

      const data = {
        phone,
        password: this.loginByPasswordForm.value.password,
      };

      this.submitting = true;

      this.authService.passwordLogin(data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: async res => {
            this.submitting = false;

            this.errors = {};

            this.flow.clear();

            const returnUrl = this.authService.login(res);
            this.router.navigate([returnUrl || '/']);
          },
          error: error => {
            this.submitting = false;

            if (error.status === 422) {
              const serverErrors = this.validationService.normalizeBackendErrors(error);

              if (serverErrors['status']) {
                this.statusError = serverErrors['status']['serverError'];
              }

              this.applyServerErrors(this.loginByPasswordForm, serverErrors);
            } else if (error.status === 401) {
              const serverErrors = this.validationService.normalizeBackendErrors(error);

              if (serverErrors['status']) {
                this.statusError = serverErrors['status']['serverError'];
              }

              this.applyServerErrors(this.loginByPasswordForm, serverErrors);
            }
          }
        });
    } else {
      this.markAllDirty(this.loginByPasswordForm);
    }
  }

  loginByOtp(): void {
    const phone = this.mobile;
    this.otpLoading = true;

    this.authService.sendOtp({ phone, force_otp: true }).subscribe({
      next: (res) => {
        this.otpLoading = false;
        this.flow.setState({
          mobile: phone,
          time_remaining: res.time_remaining,
          otp_sent_at: Date.now(),
          force_otp: true
        });
        this.router.navigate(['/auth/verify']);
      },
      error: () => {
        this.otpLoading = false;
        this.matSnackBar.open('خطا در ارسال کد تایید', 'بستن', { duration: 3000 });
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

  /** Mark every control in a form as dirty to surface validation messages */
  private markAllDirty(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => form.get(key)!.markAsDirty());
  }
}
