import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { OrderStateService } from '../../services/order-state.service';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../partials/footer/footer.component';
import {HeaderComponent} from '../partials/header/header.component';
import {SidebarComponent} from '../partials/sidebar/sidebar.component';
import {BottomNavComponent} from '../partials/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, HeaderComponent, SidebarComponent, BottomNavComponent],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  private authService = inject(AuthService);
  private orderState = inject(OrderStateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          void this.startOrderState();
        } else {
          this.orderState.stop();
        }
      });
  }

  private async startOrderState(): Promise<void> {
    // مطمئن می‌شویم اطلاعات کاربر لود شده تا id در دسترس باشد
    await this.authService.getUserInfo();

    const user = this.authService.getUser();
    if (user) {
      this.orderState.start(user.id);
    }
  }
}
