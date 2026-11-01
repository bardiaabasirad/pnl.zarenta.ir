import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FiatWithdrawalService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/traders/fiat-withdrawals`;

  index(params: string = ''): Observable<any> {
    const qs = params ? `?${params}` : '';
    return this.http.get(`${this.base}${qs}`);
  }

  formMeta(): Observable<any> {
    return this.http.get(`${this.base}/form-meta`);
  }

  create(body: {amount: string | number; metal_trader_bank_account_id: number}): Observable<any> {
    return this.http.post(this.base, body);
  }

  cancel(id: number | string): Observable<any> {
    return this.http.post(`${this.base}/${id}/cancel`, {});
  }
}
