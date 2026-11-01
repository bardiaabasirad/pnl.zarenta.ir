import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankAccountService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/traders/bank-accounts`;

  index(): Observable<any> {
    return this.http.get(this.base);
  }

  create(sheba: string): Observable<any> {
    return this.http.post(this.base, {sheba});
  }

  destroy(id: number | string): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
