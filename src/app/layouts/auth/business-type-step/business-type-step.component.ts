import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {NgClass} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {AuthService} from '../../../services/auth.service';
import {ValidationService} from '../../../services/validation.service';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';

@Component({
  selector: 'app-business-type-step',
  imports: [
    ButtonWithLoaderComponent,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './business-type-step.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './business-type-step.component.css',
})
export class BusinessTypeStepComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private flow = inject(AuthFlowService);
  private matSnackBar = inject(MatSnackBar);
  private validationService = inject(ValidationService);

  submitting = false;
  form!: FormGroup;

  businessTypes = [
    {
      value: 'gold_dealer',
      label: 'طلافروش',
      description: 'همکاران ما در صنف طلافروشی',
      img_src: '/images/37fab7cb2adaee0e5febef01d7085287de17b101.png',
    },
    {
      value: 'trader',
      label: 'معامله‌گر',
      description: 'خرید و فروش طلا و مدیریت معاملات',
      img_src: '/images/9cc4f9ed02c220ea49166ced033bf7802fcf3ba9.png',
    },
    {
      value: 'other',
      label: 'سایر',
      description: 'سرمایه‌گذاری و حفظ ارزش دارایی',
      img_src: '/images/81d836dbc6fa451aa5b40a711854f13b36257d3e.png',
    },
  ];

  constructor() {
    this.form = this.formBuilder.group({
      business_type: new FormControl(this.flow.getState()?.business_type ?? '', {
        validators: [Validators.required],
      }),
    });
  }

  get mobile(): string | null {
    return this.flow.getState()?.mobile ?? null;
  }

  selectBusinessType(value: string): void {
    this.form.get('business_type')?.setValue(value);
    this.form.get('business_type')?.markAsTouched();
  }

  back(): void {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }

  submit(): void {
    const businessTypeControl = this.form.get('business_type');

    if (businessTypeControl?.invalid) {
      businessTypeControl.markAsTouched();
      return;
    }

    const phone = this.mobile;
    if (!phone) {
      this.router.navigate(['/auth/mobile']);
      return;
    }

    this.submitting = true;
    const business_type = this.form.getRawValue().business_type;

    this.authService.selectBusinessType({phone, business_type}).subscribe({
      next: (res) => {
        this.submitting = false;
        this.flow.setState({
          ...this.flow.getState(),
          mobile: phone,
          business_type: res.business_type ?? business_type,
        });
        this.router.navigate(['/auth/complete-profile']);
      },
      error: (error) => {
        this.submitting = false;

        if (error.status === 429) {
          this.matSnackBar.open('تعداد درخواست‌ها بیش از حد مجاز است.', 'باشه', {duration: 3000});
        } else if (error.status === 422) {
          const serverErrors = this.validationService.normalizeBackendErrors(error);
          const control = this.form.get('business_type');
          if (control && serverErrors['business_type']) {
            control.setErrors(serverErrors['business_type']);
          }
          if (serverErrors['phone']) {
            this.router.navigate(['/auth/mobile']);
          }
        }
      },
    });
  }
}
