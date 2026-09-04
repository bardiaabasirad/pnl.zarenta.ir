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
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-complete-profile',
  imports: [
    ButtonWithLoaderComponent,
    ErrorDisplayComponent,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './complete-profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './complete-profile.component.scss',
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

  businessTypes = [
    {
      value: 'gold_dealer',
      label: 'طلافروش',
      description: 'همکاران ما در صنف طلافروشی',
      img_src: '/assets/images/37fab7cb2adaee0e5febef01d7085287de17b101.png',
    },
    {
      value: 'trader',
      label: 'تریدر/معامله‌گر',
      description: 'خرید و فروش طلا و مدیریت معاملات',
      img_src: '/assets/images/9cc4f9ed02c220ea49166ced033bf7802fcf3ba9.png',
    },
    {
      value: 'other',
      label: 'سایر',
      description: 'سرمایه‌گذاری و حفظ ارزش دارایی',
      img_src: '/assets/images/81d836dbc6fa451aa5b40a711854f13b36257d3e.png',
    },
  ];

  constructor() {
    this.form = this.formBuilder.group({
      full_name: new FormControl('', {validators: [Validators.required]}),
      business_type: new FormControl('', {validators: [Validators.required]})
    });
  }

  selectBusinessType(value: string): void {
    this.form.get('business_type')?.setValue(value);
    this.form.get('business_type')?.markAsTouched();
  }

  back() {
    this.flow.clear();
    this.router.navigate(['/auth/mobile'])
  }

  get mobile(): string | null {
    return this.flow.getState()?.mobile ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const {
      full_name,
      business_type,
    } = this.form.getRawValue();

    const phone = this.mobile;

    this.authService.completeProfile({
      phone,
      full_name,
      business_type,
    }).subscribe({
      next: (res) => {
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
        }
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
