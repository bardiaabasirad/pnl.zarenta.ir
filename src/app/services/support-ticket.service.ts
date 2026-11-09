import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class SupportTicketService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/traders/support-tickets`;

  index(params: string = ''): Observable<any> {
    const qs = params ? `?${params}` : '';
    return this.http.get(`${this.base}${qs}`);
  }

  show(id: number | string): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  create(formData: FormData): Observable<any> {
    return this.http.post(`${this.base}`, formData);
  }

  reply(id: number | string, formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/${id}/reply`, formData);
  }

  close(id: number | string, body: {rating?: number | null} = {}): Observable<any> {
    return this.http.post(`${this.base}/${id}/close`, body);
  }
}
