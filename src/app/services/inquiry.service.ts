import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ApiConfig} from '../configs/api.config';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {

  constructor(
    private http: HttpClient,
  ) { }

  public fee(): Observable<any> {
    return this.http.get<any>(ApiConfig.api + '/v1/clients/inquiries/fee');
  }

  public matching(params: any): Observable<any> {
    return this.http.post<any>(ApiConfig.api + '/v1/clients/inquiries/matching', params)
  }

  public similarity(params: any): Observable<any> {
    return this.http.post<any>(ApiConfig.api + '/v1/clients/inquiries/similarity', params)
  }

  public iban(params: any): Observable<any> {
    return this.http.post<any>(ApiConfig.api + '/v1/clients/inquiries/iban', params)
  }

  public ibanFromCard(params: any): Observable<any> {
    return this.http.post<any>(ApiConfig.api + '/v1/clients/inquiries/iban-from-card', params)
  }

}
