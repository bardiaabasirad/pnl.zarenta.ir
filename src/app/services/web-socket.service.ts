import { inject, Injectable, OnDestroy } from '@angular/core';
import Echo, { PresenceChannel } from 'laravel-echo';
import Pusher from 'pusher-js';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ApiConfig } from '../configs/api.config';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface WebSocketConnectionStatus {
  isOnline: boolean;
  echoState: string;
  isConnected: boolean;
  lastPingTime?: Date;
}

export interface PresenceMember<T = any> {
  id: string | number;
  info: T;
}

export interface PresenceChannelState<T = any> {
  members: Map<string | number, T>;
  count: number;
}

export interface PresenceChannelCallbacks<T = any> {
  onHere?: (members: PresenceMember<T>[]) => void;
  onJoining?: (member: PresenceMember<T>) => void;
  onLeaving?: (member: PresenceMember<T>) => void;
  onEvent?: (eventName: string, data: any) => void;
  onError?: (error: any) => void;
}

export interface PresenceChannelHandle<T = any> {
  leave: () => void;
  getMembers: () => Map<string | number, T>;
  getMemberCount: () => number;
  isMemberOnline: (memberId: string | number) => boolean;
  listenToEvent: (eventName: string, callback: (data: any) => void) => () => void;
  whisper: (eventName: string, data: any) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private echo!: Echo<any>;
  private readonly activeChannelEvents = new Map<string, Set<string>>();
  private readonly destroy$ = new Subject<void>();
  private readonly channelListeners = new Map<string, () => void>();

  private readonly presenceChannels = new Map<string, PresenceChannel>();
  private readonly presenceStates = new Map<string, BehaviorSubject<PresenceChannelState<any>>>();

  private readonly connectionStatusSubject = new BehaviorSubject<WebSocketConnectionStatus>({
    isOnline: navigator.onLine,
    echoState: 'initializing',
    isConnected: false
  });
  public readonly connectionStatus$ = this.connectionStatusSubject.asObservable();

  private readonly onlineHandler = () => this.handleOnlineStatusChange(true);
  private readonly offlineHandler = () => this.handleOnlineStatusChange(false);

  constructor() {
    this.initializeEcho();
    this.setupConnectionListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.leaveAllChannels();
    this.leaveAllPresenceChannels();
    this.removeConnectionListeners();
    this.echo?.disconnect();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API - Connection
  // ═══════════════════════════════════════════════════════════════════════════

  getCurrentConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  isFullyConnected(): boolean {
    const { isOnline, isConnected } = this.connectionStatusSubject.value;
    return isOnline && isConnected;
  }

  reconnect(): void {
    if (!navigator.onLine) return;

    try {
      (this.echo as any).connector.pusher.connect();
    } catch {
      this.initializeEcho();
    }
  }

  forceReconnect(): void {
    this.leaveAllChannels();
    this.leaveAllPresenceChannels();
    this.echo?.disconnect();
    setTimeout(() => this.initializeEcho(), 100);
  }

  reinitializeWithNewToken(): void {
    this.forceReconnect();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API - Public & Private Channels
  // ═══════════════════════════════════════════════════════════════════════════

  listenToPublicChannel<T = any>(
    channelName: string,
    eventName: string,
    callback: (data: T) => void
  ): () => void {
    return this.listenToChannel(channelName, eventName, callback, 'public');
  }

  listenToPrivateChannel<T = any>(
    channelName: string,
    eventName: string,
    callback: (data: T) => void
  ): () => void {
    return this.listenToChannel(channelName, eventName, callback, 'private');
  }

  isListeningTo(channelName: string, eventName: string): boolean {
    return this.channelListeners.has(`${channelName}.${eventName}`);
  }

  leaveChannel(channelName: string, eventName?: string): void {
    if (eventName) {
      this.leaveSpecificEvent(channelName, eventName);
    } else {
      this.leaveEntireChannel(channelName);
    }
  }

  leaveAllChannels(): void {
    this.channelListeners.forEach(unsubscribe => unsubscribe());
    this.channelListeners.clear();
    this.activeChannelEvents.clear();

    try {
      this.echo?.leaveChannel('*');
    } catch (error) {
      console.warn('Error leaving all channels:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API - Presence Channels
  // ═══════════════════════════════════════════════════════════════════════════

  joinPresenceChannel<T = any>(
    channelName: string,
    callbacks: PresenceChannelCallbacks<T> = {}
  ): PresenceChannelHandle<T> {
    if (this.presenceChannels.has(channelName)) {
      console.warn(`Already joined presence channel: ${channelName}`);
      return this.createPresenceHandle<T>(channelName);
    }

    if (!this.isFullyConnected()) {
      return this.waitForConnectionThenJoinPresence(channelName, callbacks);
    }

    return this.registerPresenceChannel(channelName, callbacks);
  }

  getPresenceChannelState$<T = any>(channelName: string) {
    return this.presenceStates.get(channelName)?.asObservable();
  }

  getPresenceChannelState<T = any>(channelName: string): PresenceChannelState<T> | undefined {
    return this.presenceStates.get(channelName)?.value;
  }

  leavePresenceChannel(channelName: string): void {
    const channel = this.presenceChannels.get(channelName);
    if (!channel) return;

    try {
      this.echo.leave(channelName);
    } catch (error) {
      console.warn(`Error leaving presence channel ${channelName}:`, error);
    }

    this.presenceChannels.delete(channelName);
    this.presenceStates.get(channelName)?.complete();
    this.presenceStates.delete(channelName);

    this.channelListeners.forEach((unsubscribe, key) => {
      if (key.startsWith(`presence-${channelName}.`)) {
        unsubscribe();
      }
    });
  }

  leaveAllPresenceChannels(): void {
    const channelNames = Array.from(this.presenceChannels.keys());
    channelNames.forEach(name => this.leavePresenceChannel(name));
  }

  isMemberOnlineInChannel(channelName: string, memberId: string | number): boolean {
    const state = this.presenceStates.get(channelName)?.value;
    return state?.members.has(memberId) ?? false;
  }

  getPresenceChannelMemberCount(channelName: string): number {
    return this.presenceStates.get(channelName)?.value.count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - Initialization
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeEcho(): void {
    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: '2qvxyvguiix6csb02cdy',
      wsHost: environment.reverb.wsHost,
      wsPort: environment.reverb.wsPort,
      forceTLS: environment.reverb.forceTLS,
      enabledTransports: ['ws', 'wss'],
      auth: {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
          Accept: 'application/json',
        },
      },
      authEndpoint: `${ApiConfig.api}/v1/clients/broadcasting/auth`,
      activityTimeout: 120000,
      pongTimeout: 30000,
      disableStats: true,
      autoReconnect: true
    });

    this.setupEchoConnectionEvents();
  }

  private setupEchoConnectionEvents(): void {
    const connection = (this.echo as any).connector.pusher.connection;

    const states = ['connecting', 'connected', 'disconnected', 'unavailable', 'failed'];
    states.forEach(state => {
      connection.bind(state, () => this.updateConnectionStatus(state));
    });

    connection.bind('error', (error: any) => {
      console.error('Echo connection error:', error);
      this.updateConnectionStatus('error');
    });
  }

  private setupConnectionListeners(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  private removeConnectionListeners(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.updateConnectionStatus(this.getCurrentEchoState());
    if (isOnline) {
      this.reconnect();
    }
  }

  private getCurrentEchoState(): string {
    try {
      return (this.echo as any).connector.pusher.connection.state || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private updateConnectionStatus(echoState: string): void {
    const previousState = this.connectionStatusSubject.value.echoState;

    const status: WebSocketConnectionStatus = {
      isOnline: navigator.onLine,
      echoState,
      isConnected: navigator.onLine && echoState === 'connected',
      lastPingTime: new Date()
    };

    if (previousState !== echoState && (echoState === 'disconnected' || echoState === 'failed')) {
      this.leaveAllChannels();
      this.leaveAllPresenceChannels();
    }

    this.connectionStatusSubject.next(status);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - Public & Private Channels
  // ═══════════════════════════════════════════════════════════════════════════

  private listenToChannel(
    channelName: string,
    eventName: string,
    callback: (data: any) => void,
    channelType: 'public' | 'private'
  ): () => void {
    const channelKey = `${channelName}.${eventName}`;

    if (this.channelListeners.has(channelKey)) {
      console.warn(`Already listening to ${channelKey}`);
      return this.channelListeners.get(channelKey)!;
    }

    if (!this.isFullyConnected()) {
      return this.waitForConnectionThenListen(channelName, eventName, callback, channelType);
    }

    return this.registerChannelListener(channelName, eventName, callback, channelType);
  }

  private registerChannelListener(
    channelName: string,
    eventName: string,
    callback: (data: any) => void,
    channelType: 'public' | 'private'
  ): () => void {
    const channel =
      channelType === 'private'
        ? this.echo.private(channelName)
        : this.echo.channel(channelName);

    channel.listen(eventName, callback);

    const key = `${channelName}.${eventName}`;

    if (!this.activeChannelEvents.has(channelName)) {
      this.activeChannelEvents.set(channelName, new Set());
    }
    this.activeChannelEvents.get(channelName)!.add(eventName);

    const cleanup = () => {
      try {
        channel.stopListening(eventName);
      } catch {}
      this.channelListeners.delete(key);
      this.activeChannelEvents.get(channelName)?.delete(eventName);
    };

    this.channelListeners.set(key, cleanup);
    return cleanup;
  }

  private leaveSpecificEvent(channelName: string, eventName: string): void {
    const key = `${channelName}.${eventName}`;
    this.channelListeners.get(key)?.();
  }

  private leaveEntireChannel(channelName: string): void {
    const events = this.activeChannelEvents.get(channelName);
    if (events) {
      events.forEach(event => this.leaveSpecificEvent(channelName, event));
    }
    this.activeChannelEvents.delete(channelName);

    try {
      this.echo.leave(channelName);
    } catch {}
  }

  private waitForConnectionThenListen(
    channelName: string,
    eventName: string,
    callback: (data: any) => void,
    type: 'public' | 'private'
  ): () => void {
    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    const sub = this.connectionStatus$
      .pipe(
        filter(s => s.isConnected),
        take(1)
      )
      .subscribe(() => {
        if (!cancelled) {
          cleanupFn = this.registerChannelListener(channelName, eventName, callback, type);
        }
      });

    return () => {
      cancelled = true;
      sub.unsubscribe();
      cleanupFn?.();
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - Presence Channels
  // ═══════════════════════════════════════════════════════════════════════════

  private waitForConnectionThenJoinPresence<T>(
    channelName: string,
    callbacks: PresenceChannelCallbacks<T>
  ): PresenceChannelHandle<T> {
    let cancelled = false;
    let realHandle: PresenceChannelHandle<T> | null = null;

    const sub = this.connectionStatus$
      .pipe(
        filter(status => status.isConnected),
        take(1)
      )
      .subscribe(() => {
        if (!cancelled) {
          realHandle = this.registerPresenceChannel(channelName, callbacks);
        }
      });

    // Return a proxy handle that delegates to the real handle once connected
    return {
      leave: () => {
        cancelled = true;
        sub.unsubscribe();
        realHandle?.leave();
        this.leavePresenceChannel(channelName);
      },
      getMembers: () => {
        return realHandle?.getMembers() ?? this.presenceStates.get(channelName)?.value.members ?? new Map();
      },
      getMemberCount: () => {
        return realHandle?.getMemberCount() ?? this.presenceStates.get(channelName)?.value.count ?? 0;
      },
      isMemberOnline: (memberId: string | number) => {
        return realHandle?.isMemberOnline(memberId) ?? this.presenceStates.get(channelName)?.value.members.has(memberId) ?? false;
      },
      listenToEvent: (eventName: string, callback: (data: any) => void) => {
        if (realHandle) {
          return realHandle.listenToEvent(eventName, callback);
        }
        // Queue the listener until connected
        let cleanup: (() => void) | null = null;
        const listenerSub = this.connectionStatus$
          .pipe(
            filter(s => s.isConnected),
            take(1)
          )
          .subscribe(() => {
            if (!cancelled && realHandle) {
              cleanup = realHandle.listenToEvent(eventName, callback);
            }
          });

        return () => {
          listenerSub.unsubscribe();
          cleanup?.();
        };
      },
      whisper: (eventName: string, data: any) => {
        if (realHandle) {
          realHandle.whisper(eventName, data);
        } else {
          // Queue whisper until connected
          this.connectionStatus$
            .pipe(
              filter(s => s.isConnected),
              take(1)
            )
            .subscribe(() => {
              if (!cancelled && realHandle) {
                realHandle.whisper(eventName, data);
              }
            });
        }
      }
    };
  }

  private registerPresenceChannel<T>(
    channelName: string,
    callbacks: PresenceChannelCallbacks<T>
  ): PresenceChannelHandle<T> {
    // Initialize state BehaviorSubject
    const initialState: PresenceChannelState<T> = {
      members: new Map(),
      count: 0
    };
    const state$ = new BehaviorSubject<PresenceChannelState<T>>(initialState);
    this.presenceStates.set(channelName, state$ as BehaviorSubject<PresenceChannelState<any>>);

    // ✅ Join the presence channel - بدون Generic
    const channel = this.echo.join(channelName);
    this.presenceChannels.set(channelName, channel);

    // Handle 'here' event - initial list of members
    channel.here((members: any[]) => {
      const membersMap = new Map<string | number, T>();
      members.forEach(member => {
        const id = member.id ?? member.user_id ?? member.uuid;
        membersMap.set(id, member as T);
      });

      state$.next({
        members: membersMap,
        count: membersMap.size
      });

      callbacks.onHere?.(members.map(m => ({
        id: m.id ?? m.user_id ?? m.uuid,
        info: m as T
      })));
    });

    // Handle 'joining' event - new member joined
    channel.joining((member: any) => {
      const currentState = state$.value;
      const id = member.id ?? member.user_id ?? member.uuid;
      const updatedMembers = new Map(currentState.members);
      updatedMembers.set(id, member as T);

      state$.next({
        members: updatedMembers,
        count: updatedMembers.size
      });

      callbacks.onJoining?.({
        id,
        info: member as T
      });
    });

    // Handle 'leaving' event - member left
    channel.leaving((member: any) => {
      const currentState = state$.value;
      const id = member.id ?? member.user_id ?? member.uuid;
      const updatedMembers = new Map(currentState.members);
      updatedMembers.delete(id);

      state$.next({
        members: updatedMembers,
        count: updatedMembers.size
      });

      callbacks.onLeaving?.({
        id,
        info: member as T
      });
    });

    // Handle errors
    channel.error((error: any) => {
      console.error(`Presence channel ${channelName} error:`, error);
      callbacks.onError?.(error);
    });

    return this.createPresenceHandle<T>(channelName);
  }

  private createPresenceHandle<T>(channelName: string): PresenceChannelHandle<T> {
    // ✅ بدون Generic در دسترسی به Map
    const channel = this.presenceChannels.get(channelName);
    const state$ = this.presenceStates.get(channelName);

    return {
      leave: () => {
        this.leavePresenceChannel(channelName);
      },

      getMembers: () => {
        return (state$?.value.members ?? new Map()) as Map<string | number, T>;
      },

      getMemberCount: () => {
        return state$?.value.count ?? 0;
      },

      isMemberOnline: (memberId: string | number) => {
        return state$?.value.members.has(memberId) ?? false;
      },

      listenToEvent: (eventName: string, callback: (data: any) => void) => {
        if (!channel) {
          console.warn(`Channel ${channelName} not found for listening`);
          return () => {};
        }

        // ✅ channel از نوع PresenceChannel است (بدون Generic)
        channel.listen(eventName, callback);

        const key = `presence-${channelName}.${eventName}`;
        const cleanup = () => {
          try {
            channel.stopListening(eventName);
          } catch (error) {
            console.warn(`Error stopping listener for ${eventName}:`, error);
          }
          this.channelListeners.delete(key);
        };

        this.channelListeners.set(key, cleanup);
        return cleanup;
      },

      whisper: (eventName: string, data: any) => {
        if (!channel) {
          console.warn(`Channel ${channelName} not found for whisper`);
          return;
        }

        try {
          channel.whisper(eventName, data);
        } catch (error) {
          console.error(`Error whispering on ${channelName}:`, error);
        }
      }
    };
  }

}
