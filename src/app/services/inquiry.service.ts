import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {

  constructor(
    private http: HttpClient,
  ) { }

  public fee(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/traders/inquiries/fee`);
  }

  public matching(params: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/v1/traders/inquiries/matching`, params)
  }

  public similarity(params: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/v1/traders/inquiries/similarity`, params)
  }

  public iban(params: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/v1/traders/inquiries/iban`, params)
  }

  public ibanFromCard(params: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/v1/traders/inquiries/iban-from-card`, params)
  }

}
