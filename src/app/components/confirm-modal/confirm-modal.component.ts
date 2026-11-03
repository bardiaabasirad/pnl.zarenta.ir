import {Component, signal, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AppModal} from '../modal/modal.component';
import {ButtonWithLoaderComponent} from '../button-with-loader/button-with-loader.component';
import {SvgIcon} from '../svg-icon/svg-icon';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => Promise<void> | void;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [FormsModule, AppModal, ButtonWithLoaderComponent, SvgIcon],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  private readonly modal = viewChild<AppModal>('confirmModal');

  readonly title = signal('تأیید');
  readonly message = signal('');
  readonly confirmLabel = signal('بله، ادامه بده!');
  readonly cancelLabel = signal('انصراف');
  readonly reasonLabel = signal<string | null>(null);
  readonly reasonRequired = signal(false);
  readonly reasonPlaceholder = signal('');
  readonly reason = signal('');
  readonly reasonError = signal(false);
  readonly loading = signal(false);

  private onConfirmHandler: ((reason: string) => Promise<void> | void) | null = null;
  private resolver: ((confirmed: boolean) => void) | null = null;

  ask(options: ConfirmModalOptions): Promise<boolean> {
    this.resolver?.(false);
    this.title.set(options.title);
    this.message.set(options.message);
    this.confirmLabel.set(options.confirmLabel ?? 'بله، ادامه بده!');
    this.cancelLabel.set(options.cancelLabel ?? 'انصراف');
    this.reasonLabel.set(options.reasonLabel ?? null);
    this.reasonRequired.set(!!options.reasonRequired);
    this.reasonPlaceholder.set(options.reasonPlaceholder ?? '');
    this.reason.set('');
    this.reasonError.set(false);
    this.loading.set(false);
    this.onConfirmHandler = options.onConfirm;
    this.modal()?.show();

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  async onConfirm(): Promise<void> {
    if (this.loading()) {
      return;
    }
    if (this.reasonRequired() && !this.reason().trim()) {
      this.reasonError.set(true);
      return;
    }

    this.loading.set(true);
    try {
      await this.onConfirmHandler?.(this.reason().trim());
      const resolve = this.resolver;
      this.resolver = null;
      this.loading.set(false);
      this.modal()?.hide();
      resolve?.(true);
    } catch {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    if (this.loading()) {
      return;
    }
    this.resolveFalse();
    this.modal()?.hide();
  }

  onClosed(): void {
    if (this.loading()) {
      return;
    }
    this.resolveFalse();
  }

  private resolveFalse(): void {
    if (!this.resolver) {
      return;
    }
    const resolve = this.resolver;
    this.resolver = null;
    this.onConfirmHandler = null;
    resolve(false);
  }
}
