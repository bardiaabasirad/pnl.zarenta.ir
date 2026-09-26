import {inject, Injectable, Injector} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, catchError, from, Observable, throwError} from "rxjs";
import {StorageKey, StorageService} from "./storage.service";
import {EventService} from "./event.service";
import {User} from '../interfaces/user';
import {Router} from '@angular/router';
import {WebSocketService} from './web-socket.service';
import {EncryptionService} from './encryption.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private user: User | undefined;
  private initializedPromise!: Promise<void>;
  private redirectUrl: string = '';

  // ✅ اضافه شده: Observable برای وضعیت احراز هویت
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.checkInitialAuthState());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // services
  private http = inject(HttpClient);
  private eventService = inject(EventService);
  private router = inject(Router);
  private injector = inject(Injector);
  private encryptionService = inject(EncryptionService);

  constructor() {
    if (StorageService.getCookie(StorageKey.ACCESS_TOKEN)) {
      this.initializedPromise = this.getUserInfo();
    }
  }

  /**
   * ✅ بررسی وضعیت اولیه احراز هویت
   */
  private checkInitialAuthState(): boolean {
    try {
      const token = StorageService.getCookie(StorageKey.ACCESS_TOKEN);
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * ✅ به‌روزرسانی وضعیت احراز هویت
   */
  private updateAuthState(isAuthenticated: boolean): void {
    if (this.isAuthenticatedSubject.value !== isAuthenticated) {
      this.isAuthenticatedSubject.next(isAuthenticated);
    }
  }

  setReturnUrl(url: string) {
    this.redirectUrl = url;
  }

  getReturnUrl() {
    return this.redirectUrl;
  }

  isLoggedIn(): boolean {
    try {
      const token = StorageService.getCookie(StorageKey.ACCESS_TOKEN);
      return !!token;
    } catch (Error) {
      return false;
    }
  }

  saveToken(token: string) {
    StorageService.setCookie(StorageKey.ACCESS_TOKEN, token);

    // ✅ اعلام تغییر وضعیت احراز هویت
    this.updateAuthState(true);

    // Get WebSocketService lazily to avoid circular dependency
    const webSocketService = this.injector.get(WebSocketService);
    webSocketService.reinitializeWithNewToken();
  }

  login(result: any) {
    this.saveToken(result.token);

    // Decrypt the user group before storing
    result.user.group = this.encryptionService.decrypt(
      result.user.group.data,
      result.user.group.iv,
    );
    this.setUser(result.user);

    const returnUrl = this.getReturnUrl();
    this.setReturnUrl('');

    return returnUrl;
  }

  getToken() {
    return StorageService.getCookie(StorageKey.ACCESS_TOKEN);
  }

  sendOtp(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/otp/send`, data);
  }

  lead(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/lead`, data);
  }

  completeProfile(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/complete-profile`, data);
  }

  passwordLogin(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/password/login`, data);
  }

  requestReview(reviewToken: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/request-review`, {
        _method: "PATCH",
      },
      {
        headers: {
          Authorization: `Bearer ${reviewToken}`,
        },
      }
    );
  }

  changePassword(data: any, resetToken: string) {
    return this.http.post(
      `${environment.apiUrl}/v1/clients/auth/change-password`,
      data,
      {
        headers: {
          Authorization: `Bearer ${resetToken}`,
        },
      }
    );
  }

  verify(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/verify`, data);
  }

  verifyOtp(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/otp/verify`, data);
  }

  changePasswordByProfile(payload: {
    current_password: string | null;
    password: string;
    password_confirmation: string;
  }) {
    return this.http.post(`${environment.apiUrl}/v1/clients/change-password`, payload);
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/v1/clients/auth/logout`, {});
  }

  unsetUser() {
    this.user = undefined;
    StorageService.removeCookie(StorageKey.ACCESS_TOKEN);

    // ✅ اعلام تغییر وضعیت احراز هویت
    this.updateAuthState(false);

    this.router.navigate(['/auth/mobile']);
  }

  clearSession(): void {
    this.user = undefined;
    StorageService.removeCookie(StorageKey.ACCESS_TOKEN);
    this.updateAuthState(false);
  }

  updateBalance(balance: number) {
    if (this.user) this.user.balance = balance;
  }

  public getUserInfo(): Promise<void> {
    if (this.user) {
      return Promise.resolve();
    }

    if (this.initializedPromise) {
      return this.initializedPromise;
    }

    this.initializedPromise = new Promise<void>((resolve, reject) => {
      from(this.http.get<any>(environment.apiUrl + '/v1/clients/auth/info'))
        .pipe(
          catchError((error) => {
            return throwError(error);
          })
        )
        .subscribe({
          next: (user) => {

            user.group = this.encryptionService.decrypt(user.group.data, user.group.iv);

            this.user = user;

            // ✅ اعلام تغییر وضعیت احراز هویت (کاربر معتبر)
            this.updateAuthState(true);

            resolve();
          }
        });
    });

    return this.initializedPromise;
  }

  public getUser() {
    return this.user;
  }

  public setUser(user: User | undefined) {
    this.user = user;

    // ✅ به‌روزرسانی وضعیت بر اساس وجود کاربر
    this.updateAuthState(!!user);

    this.eventService.userUpdateEvent.emit();
  }

  public updateUserField<K extends keyof User>(key: K, value: User[K]): void {
    if (!this.user) return;

    this.user = {
      ...this.user,
      [key]: value
    };

    this.eventService.userUpdateEvent.emit();
  }
}
