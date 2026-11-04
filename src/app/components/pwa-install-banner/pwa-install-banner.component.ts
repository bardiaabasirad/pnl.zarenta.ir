import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {PwaInstallService} from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  templateUrl: './pwa-install-banner.component.html',
  styleUrl: './pwa-install-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallBannerComponent {
  readonly pwaInstall = inject(PwaInstallService);
  installing = false;

  async install(): Promise<void> {
    if (this.installing || !this.pwaInstall.canInstall()) {
      return;
    }

    this.installing = true;
    try {
      await this.pwaInstall.showInstallPrompt();
    } finally {
      this.installing = false;
    }
  }

  dismiss(): void {
    this.pwaInstall.dismissBanner();
  }
}
