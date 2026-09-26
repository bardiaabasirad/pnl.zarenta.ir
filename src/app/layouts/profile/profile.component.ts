import {Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy, signal} from '@angular/core';
import {Title} from "@angular/platform-browser";
import {User} from '../../interfaces/user';
import {from, Subscription} from 'rxjs';
import {StorageKey, StorageService} from '../../services/storage.service';
import {AuthService} from '../../services/auth.service';
import {EventService} from '../../services/event.service';
import {RouterLink} from "@angular/router";
import {BalanceComponent} from '../balance/balance.component';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterLink,
    BalanceComponent,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  readonly user = signal<User | null | undefined>(undefined);
  private subscriptions: Subscription[] = [];
  loggingOut: boolean = false;
  // services
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private readonly titleService = inject(Title);

  ngOnInit() {
    this.setTitleAndMetaTags();

    this.subscriptions.push(
      this.eventService.userUpdateEvent.subscribe(() => {
        this.getUserInfo();
      })
    );

    this.getUserInfo();
    // this.initModals();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      this.subscriptions.push(
        from(this.authService.getUserInfo()).subscribe({
          next: () => {
            this.user.set(this.authService.getUser());
          },
          error: (error) => {
            if (error === 'Token expired') {
              this.user.set(undefined);
              StorageService.removeCookie(StorageKey.ACCESS_TOKEN);
            }
          }
        })
      );
    } else {
      this.user.set(null);
    }
  }

  logout() {
    this.loggingOut = true;

    this.authService.logout().subscribe({
      next: (response) => {
        this.authService.unsetUser();
        this.loggingOut = false;
      },
      error: (error) => {
        this.loggingOut = false;
      }
    });
  }

  setTitleAndMetaTags() {
    this.titleService.setTitle(`سامانه معاملات ${environment.appTitle}`);
  }


  // changePasswordModal: ModalInterface | undefined;
  // changePasswordLoading: boolean = false;
  // changePasswordError: string = '';

  // changePasswordForm = new FormGroup({
  //   currentPassword: new FormControl<string>('', {nonNullable: true}), // اختیاری
  //   newPassword: new FormControl<string>('', {
  //     nonNullable: true,
  //     validators: [Validators.required, Validators.minLength(8)]
  //   }),
  //   confirmPassword: new FormControl<string>('', {
  //     nonNullable: true,
  //     validators: [Validators.required]
  //   }),
  // }, {validators: this.passwordMatchValidator});

  // اعتبارسنج تطابق رمز جدید و تکرار آن
  // private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  //   const newPassword = group.get('newPassword')?.value;
  //   const confirmPassword = group.get('confirmPassword')?.value;
  //   return newPassword && confirmPassword && newPassword !== confirmPassword
  //     ? {passwordMismatch: true}
  //     : null;
  // }

  // private initModals() {
  //
  //   const modalOptions: ModalOptions = {
  //     placement: 'center',
  //     backdrop: 'dynamic',
  //     backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
  //     closable: true,
  //   }
  //
  //   const $changePasswordModalElement: HTMLElement | null = document.querySelector('#change-password-modal');
  //
  //   this.changePasswordModal = new Modal($changePasswordModalElement, modalOptions);
  // }

  // showChangePasswordModal() {
  //   this.changePasswordForm.reset();
  //   this.changePasswordError = '';
  //   this.changePasswordModal?.show();
  // }
  //
  // onSubmitChangePassword() {
  //   this.changePasswordForm.markAllAsTouched();
  //
  //   if (this.changePasswordForm.invalid || this.changePasswordLoading) {
  //     return;
  //   }
  //
  //   this.changePasswordLoading = true;
  //   this.changePasswordError = '';
  //
  //   const {currentPassword, newPassword, confirmPassword} = this.changePasswordForm.getRawValue();
  //
  //   this.subscriptions.push(
  //     this.authService.changePasswordByProfile({
  //       current_password: currentPassword || null, // ممکن است کاربر رمز نداشته باشد
  //       password: newPassword,
  //       password_confirmation: confirmPassword,
  //     }).subscribe({
  //       next: (res: any) => {
  //         this.changePasswordLoading = false;
  //         this.changePasswordForm.reset();
  //         this.changePasswordModal?.hide();
  //
  //         this.matSnackBar.open(res.message, 'باشه', {duration: 5000});
  //       },
  //       error: (error) => {
  //         this.changePasswordLoading = false;
  //
  //         if (error.status == 422) {
  //           const fieldErrors = error?.error?.errors;
  //
  //           if (fieldErrors?.['current_password']) {
  //             this.changePasswordForm.controls.currentPassword.setErrors({
  //               server: fieldErrors['current_password'][0]
  //             });
  //           } else if (fieldErrors?.['password']) {
  //             this.changePasswordForm.controls.newPassword.setErrors({
  //               same: fieldErrors['password'][0]
  //             });
  //           }
  //         } else if (error.status == 429) {
  //           this.matSnackBar.open('تعداد تلاش‌های شما بیش از حد مجاز است. لطفا بعدا تلاش کنید.', 'باشه', {duration: 5000});
  //         } else {
  //           this.changePasswordError = 'خطایی رخ داد. لطفا دوباره تلاش کنید.';
  //         }
  //       }
  //     })
  //   );
  // }

  protected readonly Math = Math;
}
