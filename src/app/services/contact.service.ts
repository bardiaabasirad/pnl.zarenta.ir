import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import {of} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);

  // تعریف یک Signal برای نگهداری دیتا
  private _contacts = signal<any[] | null>(null);

  // اکسپوز کردن دیتا به صورت Read-only
  public contacts = this._contacts.asReadonly();

  public index() {
    // اگر دیتا قبلاً گرفته شده باشد، همان را برمی‌گردانیم (به صورت Observable)
    if (this._contacts()) {
      return of(this._contacts());
    }

    return this.http.get<any[]>(`${environment.apiUrl}/v1/traders/contacts`).pipe(
      tap(data => this._contacts.set(data)) // ذخیره در سیگنال
    );
  }

  // متدی برای اجبار به آپدیت (مثلاً بعد از ایجاد دپارتمان جدید)
  public clearCache() {
    this._contacts.set(null);
  }
}
