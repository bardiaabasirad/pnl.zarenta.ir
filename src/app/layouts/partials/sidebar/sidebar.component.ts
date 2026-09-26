import {Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy, signal} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {CommonModule} from '@angular/common';
import {User} from '../../../interfaces/user';
import {from, Subscription} from 'rxjs';
import {AuthService} from '../../../services/auth.service';
import {EventService} from '../../../services/event.service';
import {StorageKey, StorageService} from '../../../services/storage.service';
import {ContactComponent} from '../contact/contact.component';
import {filter} from 'rxjs/operators';
import {OrderStateService} from '../../../services/order-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ContactComponent
  ],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly user = signal<User | null | undefined>(undefined);
  private subscriptions: Subscription[] = [];
  url: string = '';
  loggingOut: boolean = false;
  loading: boolean = false;
  // services
  private router =  inject(Router);
  private authService =  inject(AuthService);
  private eventService =  inject(EventService);

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
    }
    else{
      this.user.set(null);
    }
  }

  logout(){
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

  protected readonly Math = Math;
}

declare global {
  interface String {
    isMatching(pattern: string): boolean;
  }
}

String.prototype.isMatching = function(pattern: string): boolean {
  // Escape special characters in the pattern
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create a regular expression from the pattern
  const regex = new RegExp(escapedPattern);

  // Check if the string matches the pattern
  return regex.test(this.toString());
};
