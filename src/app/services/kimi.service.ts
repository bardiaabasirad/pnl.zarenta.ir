import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KimiaService {
  private http = inject(HttpClient);

  public getVoucherBalance(id: any): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/clients/balance/${id}`);
  }

  public getVoucherTransactions(params: any): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/clients/transactions`, { params: params });
  }

  public generatePDF(params: any) {
    return this.http.get(`${environment.apiUrl}/v1/clients/transactions/pdf`, {params: params, responseType: 'blob'});
  }
}
