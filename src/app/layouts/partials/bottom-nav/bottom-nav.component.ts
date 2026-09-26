import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {SiteInfo} from '../../../interfaces/site-info';
import {OrderStateService} from '../../../services/order-state.service';
import {SettingService} from '../../../services/setting.service';
import {filter} from 'rxjs/operators';
import {from} from 'rxjs';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent implements OnInit {
  siteInfo: SiteInfo | undefined
  private router = inject(Router);
  currentUrl = '';

  private orderState = inject(OrderStateService);
  readonly hasUnseenUpdate = this.orderState.hasUnseenUpdate;

  private settingService = inject(SettingService);

  ngOnInit() {
    this.getSettings();

    this.currentUrl = this.router.url;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  getSettings() {
    from(this.settingService.initialize()).subscribe({
      next: () => {
        this.siteInfo = this.settingService.getSiteInfo();
      },
      error: (error) => {
        if (error === 'Token expired') {
          this.siteInfo = undefined;
        }
      }
    })
  }

  get activeIndex(): number {
    switch (this.currentUrl) {
      case '/settings':
      case '/profile':
      case '/inquiries':
        return 0;
      case '/':
        return 1;
      case '/orders':
        return 2;
      case '/assets':
        return 3;
      default:
        return -1; // هیچ آیتمی فعال نیست
    }
  }
}

