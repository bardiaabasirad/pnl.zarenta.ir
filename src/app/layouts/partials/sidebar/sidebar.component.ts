import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  ViewChild
} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {User} from '../../../interfaces/user';
import {from, Subscription} from 'rxjs';
import {AuthService} from '../../../services/auth.service';
import {OnlinePresenceService} from '../../../services/online-presence.service';
import {EventService} from '../../../services/event.service';
import {StorageKey, StorageService} from '../../../services/storage.service';
import {filter} from 'rxjs/operators';
import {OrderStateService} from '../../../services/order-state.service';
import {Modal, ModalInterface, ModalOptions} from 'flowbite';
import {ImageCropperComponent, ImageCroppedEvent} from 'ngx-image-cropper';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SanitizeImageURLPipe} from '../../../pipes/sanitize-image-url.pipe';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {SvgIcon} from '../../../components/svg-icon/svg-icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ImageCropperComponent,
    SanitizeImageURLPipe,
    ButtonWithLoaderComponent,
    SvgIcon
  ],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly user = signal<User | null | undefined>(undefined);
  private subscriptions: Subscription[] = [];
  url: string = '';
  loggingOut: boolean = false;
  loading: boolean = false;

  imageChangedEvent: Event | null = null;
  croppedBlob: Blob | null = null;
  uploadingAvatar = false;
  deletingAvatar = false;
  avatarCropModal: ModalInterface | undefined;

  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private authService = inject(AuthService);
  private presenceService = inject(OnlinePresenceService);
  private eventService = inject(EventService);
  private matSnackBar = inject(MatSnackBar);
  private orderState = inject(OrderStateService);
  readonly hasUnseenUpdate = this.orderState.hasUnseenUpdate;

  ngOnInit(): void {
    this.url = this.router.url;

    this.subscriptions.push(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(event => {
          this.url = (event as NavigationEnd).urlAfterRedirects;
        })
    );

    this.subscriptions.push(
      this.eventService.userUpdateEvent.subscribe(() => {
        this.getUserInfo();
      })
    );

    this.getUserInfo();
  }

  ngAfterViewInit(): void {
    const modalOptions: ModalOptions = {
      placement: 'center',
      backdrop: 'dynamic',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
      closable: true,
    };

    const modalElement = document.querySelector('#avatar-crop-modal');
    if (modalElement) {
      this.avatarCropModal = new Modal(modalElement as HTMLElement, modalOptions);
    }
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

  openAvatarPicker(): void {
    this.avatarFileInput?.nativeElement.click();
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.imageChangedEvent = event;
    this.croppedBlob = null;
    this.avatarCropModal?.show();
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  closeAvatarCropModal(): void {
    this.avatarCropModal?.hide();
    this.resetCropState();
  }

  confirmAvatarUpload(): void {
    if (!this.croppedBlob || this.uploadingAvatar) {
      return;
    }

    this.uploadingAvatar = true;

    this.subscriptions.push(
      this.authService.uploadAvatar(this.croppedBlob).subscribe({
        next: (response) => {
          this.authService.updateUserField('avatar', response.avatar);
          this.user.set(this.authService.getUser());
          this.uploadingAvatar = false;
          this.closeAvatarCropModal();
          this.matSnackBar.open(response.message, 'باشه', {duration: 5000});
        },
        error: (error) => {
          this.uploadingAvatar = false;
          const message = error?.error?.message || 'خطا در آپلود تصویر پروفایل';
          this.matSnackBar.open(message, 'باشه', {duration: 5000});
        }
      })
    );
  }

  deleteAvatar(event: Event): void {
    event.stopPropagation();

    if (this.deletingAvatar || !this.user()?.avatar) {
      return;
    }

    this.deletingAvatar = true;

    this.subscriptions.push(
      this.authService.deleteAvatar().subscribe({
        next: (response) => {
          this.authService.updateUserField('avatar', null);
          this.user.set(this.authService.getUser());
          this.deletingAvatar = false;
          this.matSnackBar.open(response.message, 'باشه', {duration: 5000});
        },
        error: (error) => {
          this.deletingAvatar = false;
          const message = error?.error?.message || 'خطا در حذف تصویر پروفایل';
          this.matSnackBar.open(message, 'باشه', {duration: 5000});
        }
      })
    );
  }

  private resetCropState(): void {
    this.imageChangedEvent = null;
    this.croppedBlob = null;
    if (this.avatarFileInput?.nativeElement) {
      this.avatarFileInput.nativeElement.value = '';
    }
  }

  logout() {
    this.loggingOut = true;
    this.presenceService.stopPresence();

    this.authService.logout().subscribe({
      next: () => {
        this.authService.unsetUser();
        this.loggingOut = false;
      },
      error: () => {
        this.loggingOut = false;
      }
    });
  }

  protected readonly Math = Math;
}

declare global {
  interface String {
    isMatching(pattern: string): boolean;
  }
}

String.prototype.isMatching = function (pattern: string): boolean {
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPattern);
  return regex.test(this.toString());
};
