import { Injectable, inject, OnDestroy } from '@angular/core';
import {from, Subscription} from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OnlinePresenceService implements OnDestroy {

  private ws = inject(WebSocketService);
  private authService = inject(AuthService);
  private readonly PRESENCE_CHANNEL = 'online-clients';
  private connectionSub?: Subscription;

  /**
   * شروع حضور آنلاین - این را در AppComponent یا بعد از لاگین صدا بزن
   */
  startPresence(): void {

    from(this.authService.getUserInfo()).subscribe({
      next: () => {
        let user = this.authService.getUser(); // Assuming you have a method like getUser() in your service to retrieve the user.

        // Check if the route is allowed for the user type
        if (user) {
          this.joinPresenceChannel();
        } else {
          console.warn('Cannot start presence: User not authenticated');
        }
      },
      error: (error) => {}
    })

  }

  /**
   * پایان حضور - این را در logout یا ngOnDestroy صدا بزن
   */
  stopPresence(): void {
    this.leavePresenceChannel();
  }

  /**
   * اتصال به کانال Presence
   */
  private joinPresenceChannel(): void {
    console.log('joinPresenceChannel');

    this.ws.joinPresenceChannel(this.PRESENCE_CHANNEL, {
      onHere: (members) => {
        // console.log('📍 Online members:', members);
      },
      onJoining: (member) => {
        // console.log('🟢 Member joined:', member);
      },
      onLeaving: (member) => {
        // console.log('🔴 Member left:', member);
      },
      onError: (error) => {
        // console.error('❌ Presence channel error:', error);
      }
    });
  }

  /**
   * ترک کانال Presence
   */
  private leavePresenceChannel(): void {
    this.ws.leavePresenceChannel(this.PRESENCE_CHANNEL);
  }

  ngOnDestroy(): void {
    this.stopPresence();
    this.connectionSub?.unsubscribe();
  }
}
