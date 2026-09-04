import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ApiConfig} from '../configs/api.config';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  public index(filters: string){
    return this.http.get(`${ApiConfig.api}/v1/clients/orders?${filters}`);
  }

  public store(data: any) {
    return this.http.post(`${ApiConfig.api}/v1/clients/orders`, data);
  }

  public show(id: any){
    return this.http.get(`${ApiConfig.api}/v1/clients/orders/${id}`);
  }
}
