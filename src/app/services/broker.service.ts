import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrokerService {
  constructor(private http: HttpClient) {
  }

  public getBrokers() {
    return this.http.get(`${environment.apiUrl}/v1/brokers`);
  }
}
