import {Component, inject, OnInit, signal, effect, ChangeDetectionStrategy} from '@angular/core';
import {User} from '../../interfaces/user';
import {AuthService} from '../../services/auth.service';
import {Title} from '@angular/platform-browser';
import {StorageKey, StorageService} from '../../services/storage.service';
import {EventService} from '../../services/event.service';
import {CustomCheckboxComponent} from '../../components/custom-checkbox/custom-checkbox.component';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {SettingService} from '../../services/setting.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {ButtonWithLoaderComponent} from '../../components/button-with-loader/button-with-loader.component';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  imports: [
    CustomCheckboxComponent,
    FormsModule,
    ButtonWithLoaderComponent,
    ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private settingService = inject(SettingService);
  private matSnackBar = inject(MatSnackBar);
  private title = inject(Title);

  // Signals
  user = signal<User | null | undefined>(undefined);
  isLoading = signal<boolean>(false);

  // Convert Observable to Signal
  userUpdateEvent = toSignal(this.eventService.userUpdateEvent);

  changePasswordLoading: boolean = false;
  changePasswordError: string = '';

  changePasswordForm = new FormGroup({
    currentPassword: new FormControl<string>('', {nonNullable: true}), // اختیاری
    newPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
  }, {validators: this.passwordMatchValidator});

  constructor() {
    // Effect برای پاسخ به تغییرات userUpdateEvent
    effect(() => {
      if (this.userUpdateEvent()) {
        this.getUserInfo();
      }
    });
  }

  ngOnInit() {
    this.setTitleAndMetaTags();
    this.getUserInfo();
  }

  onSubmitChangePassword() {
    this.changePasswordForm.markAllAsTouched();

    if (this.changePasswordForm.invalid || this.changePasswordLoading) {
      return;
    }

    this.changePasswordLoading = true;
    this.changePasswordError = '';

    const {currentPassword, newPassword, confirmPassword} = this.changePasswordForm.getRawValue();

    this.authService.changePasswordByProfile({
      current_password: currentPassword || null, // ممکن است کاربر رمز نداشته باشد
      password: newPassword,
      password_confirmation: confirmPassword,
    }).subscribe({
      next: (res: any) => {
        this.changePasswordLoading = false;
        this.changePasswordForm.reset();

        const currentUser = this.user();

        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            has_pass: true,
          };

          // به‌روزرسانی Signal کامپوننت
          this.user.set(updatedUser);

          // به‌روزرسانی user داخل AuthService
          this.authService.setUser(updatedUser);
        }

        this.matSnackBar.open(res.message, 'باشه', {
          duration: 5000,
        });
      },
      error: (error) => {
        this.changePasswordLoading = false;

        if (error.status == 422) {
          const fieldErrors = error?.error?.errors;

          if (fieldErrors?.['current_password']) {
            this.changePasswordForm.controls.currentPassword.setErrors({
              server: fieldErrors['current_password'][0]
            });
          } else if (fieldErrors?.['password']) {
            this.changePasswordForm.controls.newPassword.setErrors({
              same: fieldErrors['password'][0]
            });
          }
        } else if (error.status == 429) {
          this.matSnackBar.open('تعداد تلاش‌های شما بیش از حد مجاز است. لطفا بعدا تلاش کنید.', 'باشه', {duration: 5000});
        } else {
          this.changePasswordError = 'خطایی رخ داد. لطفا دوباره تلاش کنید.';
        }
      }
    })
  }

  // اعتبارسنج تطابق رمز جدید و تکرار آن
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? {passwordMismatch: true}
      : null;
  }

  update(value: string, key: string) {
    const params = new FormData();
    params.set('value', value);

    if (key === 'aggregated_view_of_invoices') {
      this.updateAggregatedViewOfInvoices(params, value);
    } else if (key === 'market_opening_notification') {
      this.updateMarketOpeningNotification(params, value);
    }
  }

  private updateAggregatedViewOfInvoices(params: FormData, value: string) {
    const previousValue = this.user()?.aggregated_view_of_invoices;

    this.settingService.updateAggregatedViewOfInvoices(params).subscribe({
      next: (response) => {
        this.authService.updateUserField('aggregated_view_of_invoices', response.status);
        // به‌روزرسانی signal
        this.updateUserSignal('aggregated_view_of_invoices', response.status);
      },
      error: (error) => {
        // برگشت تغییرات در صورت بروز خطا
        if (previousValue !== undefined) {
          this.updateUserSignal('aggregated_view_of_invoices', previousValue);
        }
      }
    });
  }

  private updateMarketOpeningNotification(params: FormData, value: string) {
    const previousValue = this.user()?.market_opening_notification;

    this.settingService.updateMarketOpeningNotification(params).subscribe({
      next: (response) => {
        this.authService.updateUserField('market_opening_notification', response.status);
        // به‌روزرسانی signal
        this.updateUserSignal('market_opening_notification', response.status);
      },
      error: (error) => {
        // برگشت تغییرات در صورت بروز خطا
        if (previousValue !== undefined) {
          this.updateUserSignal('market_opening_notification', previousValue);
        }
      }
    });
  }

  private updateUserSignal(key: string, value: any) {
    const currentUser = this.user();
    if (currentUser) {
      this.user.set({
        ...currentUser,
        [key]: value
      });
    }
  }

  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      this.isLoading.set(true);

      this.authService.getUserInfo().then(() => {
        const userData = this.authService.getUser();
        this.user.set(userData);
        this.isLoading.set(false);
      }).catch((error) => {
        if (error === 'Token expired') {
          this.user.set(undefined);
          StorageService.removeCookie(StorageKey.ACCESS_TOKEN);
        }
        this.isLoading.set(false);
      });
    } else {
      this.user.set(null);
    }
  }

  setTitleAndMetaTags() {
    this.title.setTitle('سامانه معاملات ژیک');
  }
}
