import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiConfig} from '../configs/api.config';

@Injectable({
  providedIn: 'root'
})
export class KimiaService {
  private http = inject(HttpClient);

  public getVoucherBalance(id: any): Observable<any> {
    return this.http.get<any>(`${ApiConfig.api}/v1/clients/balance/${id}`);
  }

  public getVoucherTransactions(params: any): Observable<any> {
    return this.http.get<any>(`${ApiConfig.api}/v1/clients/transactions`, { params: params });
  }

  // public generatePDF(params: any): Observable<any> {
  //   return this.http.post<any>(`${ApiConfig.api}/v1/clients/transactions/pdf`, params);
  // }

  public generatePDF(params: any) {
    return this.http.get(`${ApiConfig.api}/v1/clients/transactions/pdf`, {params: params, responseType: 'blob'});
  }
}
