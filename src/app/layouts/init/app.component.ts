import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OnlinePresenceService } from '../../services/online-presence.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { NavigationLoaderService } from '../../services/navigation-loader.service';
import {RouterOutlet} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Title} from '@angular/platform-browser';
import {PwaInstallBannerComponent} from '../../components/pwa-install-banner/pwa-install-banner.component';
import {DarkModeService} from '../../services/dark-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    RouterOutlet,
    PwaInstallBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly navigationLoader = inject(NavigationLoaderService);
  private presenceService = inject(OnlinePresenceService);
  private authService = inject(AuthService);
  private readonly titleService = inject(Title);
  private readonly darkModeService = inject(DarkModeService);
  private authSub?: Subscription;

  ngOnInit(): void {
    this.darkModeService.init();
    this.titleService.setTitle(`سامانه معاملات ${environment.appTitle}`);

    if (this.authService.isLoggedIn()) {
      this.presenceService.startPresence();
    }

    this.authSub = this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.presenceService.startPresence();
      } else {
        this.presenceService.stopPresence();
      }
    });
  }

  ngOnDestroy(): void {
    this.presenceService.stopPresence();
    this.authSub?.unsubscribe();
  }
}
