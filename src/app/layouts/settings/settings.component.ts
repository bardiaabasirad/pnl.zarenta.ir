import {Component, inject, OnInit, signal, effect, ChangeDetectionStrategy} from '@angular/core';
import {User} from '../../interfaces/user';
import {AuthService} from '../../services/auth.service';
import {Title} from '@angular/platform-browser';
import {StorageKey, StorageService} from '../../services/storage.service';
import {EventService} from '../../services/event.service';
import {CustomCheckboxComponent} from '../../components/custom-checkbox/custom-checkbox.component';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {SettingService} from '../../services/setting.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  imports: [
    CustomCheckboxComponent,
    FormsModule,
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
  private title = inject(Title);

  // Signals
  user = signal<User | null | undefined>(undefined);
  isLoading = signal<boolean>(false);
  userUpdateEvent = toSignal(this.eventService.userUpdateEvent);

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

  update(value: string, key: string) {
    const params = new FormData();
    params.set('value', value);

    if (key === 'market_opening_notification') {
      this.updateMarketOpeningNotification(params, value);
    }
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
    this.title.setTitle(`سامانه معاملات ${environment.appTitle}`);
  }
}
