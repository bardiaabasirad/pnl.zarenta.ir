import {Injectable} from '@angular/core';
import {ApiConfig} from '../configs/api.config';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BrokerService {
  constructor(private http: HttpClient) {
  }

  public getBrokers() {
    return this.http.get(`${ApiConfig.api}/v1/brokers`);
  }
}
