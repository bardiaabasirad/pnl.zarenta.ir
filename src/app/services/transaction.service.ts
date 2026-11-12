import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);

  public getTransactions(params: any): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/traders/transactions`, {params});
  }

  public generatePDF(params: any) {
    return this.http.get(`${environment.apiUrl}/v1/traders/transactions/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}
