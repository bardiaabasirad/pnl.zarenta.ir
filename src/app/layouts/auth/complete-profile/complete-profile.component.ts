import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ValidationService} from '../../../services/validation.service';
import {convertToEnglishNumbersUtil} from '../../../utils/convert-to-english-numbers.util';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {ErrorDisplayComponent} from '../../../components/error-display/error-display.component';
import {nationalCodeValidator} from '../../../validators/national-code-validator';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';

@Component({
  selector: 'app-complete-profile',
  imports: [
    ButtonWithLoaderComponent,
    ErrorDisplayComponent,
    ReactiveFormsModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
  templateUrl: './complete-profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './complete-profile.component.css',
})
export class CompleteProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private flow = inject(AuthFlowService);
  private matSnackBar = inject(MatSnackBar);
  private validationService = inject(ValidationService);

  /** Convert Persian/Arabic numerals to English */
  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  submitting = false;
  form!: FormGroup;

  constructor() {
    if (!this.flow.getState()?.business_type) {
      this.router.navigate(['/auth/business-type']);
    }

    this.form = this.formBuilder.group({
      full_name: new FormControl('', {validators: [Validators.required]}),
      national_code: new FormControl('', {
        validators: [Validators.required, Validators.minLength(10), Validators.maxLength(10), nationalCodeValidator],
      }),
      address: new FormControl('', {validators: [Validators.required, Validators.maxLength(2000)]}),
    });
  }

  back() {
    this.router.navigate(['/auth/business-type']);
  }

  get mobile(): string | null {
    return this.flow.getState()?.mobile ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const phone = this.mobile;
    if (!phone) {
      this.router.navigate(['/auth/mobile']);
      return;
    }

    this.submitting = true;

    const {
      full_name,
      national_code,
      address,
    } = this.form.getRawValue();

    this.authService.completeProfile({
      phone,
      full_name,
      national_code,
      address,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.flow.clear();
        this.router.navigate(['/auth/pending']);
      },

      error: error => {
        this.submitting = false;

        if (error.status === 429) {
          this.matSnackBar.open(
            'تعداد درخواست‌ها بیش از حد مجاز است.',
            'باشه',
            {duration: 3000}
          );
        } else if (error.status === 422) {
          const serverErrors = this.validationService.normalizeBackendErrors(error);
          this.applyServerErrors(this.form, serverErrors);

          if (serverErrors['business_type'] || serverErrors['phone']) {
            this.router.navigate(['/auth/business-type']);
          }
        }
      },
    });
  }

  private applyServerErrors(form: FormGroup, errors: Record<string, any>): void {
    Object.keys(errors).forEach(key => {
      const control = form.get(key);
      if (control) control.setErrors(errors[key]);
    });
  }
}
