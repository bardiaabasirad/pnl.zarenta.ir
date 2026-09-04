import {Component, DestroyRef, inject, ChangeDetectionStrategy} from '@angular/core';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {ErrorDisplayComponent} from '../../../components/error-display/error-display.component';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {passwordMatchValidator} from '../../../validators/password-match-validator';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AuthService} from '../../../services/auth.service';
import {EncryptionService} from '../../../services/encryption.service';
import {Router} from '@angular/router';
import {ValidationService} from '../../../services/validation.service';
import {AuthFlowService} from '../../../services/auth-flow.service';

@Component({
  selector: 'app-reset-credentials',
  imports: [
    ButtonWithLoaderComponent,
    ErrorDisplayComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './reset-credentials.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reset-credentials.component.scss',
})
export class ResetCredentialsComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private encryptionService = inject(EncryptionService);
  private router = inject(Router);
  private validationService = inject(ValidationService);
  private flow = inject(AuthFlowService);

  resetPasswordForm!: FormGroup;

  submitting = false;

  constructor() {
    this.resetPasswordForm = this.formBuilder.group({
      password: new FormControl('', {
        validators: [Validators.required, Validators.minLength(8)]
      }),
      password_confirmation: new FormControl('', {
        validators: [Validators.required, Validators.minLength(8)]
      }),
    }, {validators: passwordMatchValidator});
  }

  back() {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }

  async submitResetPasswordForm(): Promise<void> {

    const state = this.flow.getState();

    const data = {
      phone: state?.mobile,
      password: this.resetPasswordForm.value.password,
      password_confirmation: this.resetPasswordForm.value.password_confirmation
    };

    if (this.resetPasswordForm.valid) {
      this.submitting = true;

      this.authService.changePassword(data, state?.reset_token)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: async (result: any) => {
            this.submitting = false;

            this.flow.clear();

            this.authService.saveToken(result.token);

            // Decrypt the user group before storing
            result.user.group = this.encryptionService.decrypt(
              result.user.group.data,
              result.user.group.iv,
            );
            this.authService.setUser(result.user);

            const returnUrl = this.authService.getReturnUrl();
            this.authService.setReturnUrl('');
            await this.router.navigate([returnUrl || '/']);
          },
          error: error => {
            this.submitting = false;

            if (error.status === 422) {
              const serverErrors = this.validationService.normalizeBackendErrors(error);
              this.applyServerErrors(this.resetPasswordForm, serverErrors);
            }
          }
        });
    } else {
      this.markAllDirty(this.resetPasswordForm);
    }

  }

  /** Mark every control in a form as dirty to surface validation messages */
  private markAllDirty(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => form.get(key)!.markAsDirty());
  }

  /** Apply server-side validation errors to the matching form controls */
  private applyServerErrors(form: FormGroup, errors: Record<string, any>): void {
    Object.keys(errors).forEach(key => {
      const control = form.get(key);
      if (control) control.setErrors(errors[key]);
    });
  }
}
