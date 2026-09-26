import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  public index(filters: string){
    return this.http.get(`${environment.apiUrl}/v1/clients/orders?${filters}`);
  }

  public store(data: any) {
    return this.http.post(`${environment.apiUrl}/v1/clients/orders`, data);
  }

  public show(id: any){
    return this.http.get(`${environment.apiUrl}/v1/clients/orders/${id}`);
  }
}
