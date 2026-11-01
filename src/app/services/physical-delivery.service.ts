import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhysicalDeliveryService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/traders/physical-deliveries`;

  index(params: string = ''): Observable<any> {
    const qs = params ? `?${params}` : '';
    return this.http.get(`${this.base}${qs}`);
  }

  show(id: number | string): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  quote(body: {metal_item_id: number; qty: string | number}): Observable<any> {
    return this.http.get(`${this.base}/quote`, {params: body as any});
  }

  create(body: Record<string, unknown>): Observable<any> {
    return this.http.post(`${this.base}`, body);
  }

  cancel(id: number | string): Observable<any> {
    return this.http.post(`${this.base}/${id}/cancel`, {});
  }
}
