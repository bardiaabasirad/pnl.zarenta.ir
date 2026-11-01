import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TraderNotificationApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/traders/notifications`;

  index(): Observable<any> {
    return this.http.get(this.base);
  }

  markAsRead(id: number | string): Observable<any> {
    return this.http.post(`${this.base}/${id}/mark-as-read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.base}/mark-all-as-read`, {});
  }
}
