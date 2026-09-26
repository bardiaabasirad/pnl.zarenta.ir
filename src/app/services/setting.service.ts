import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {StorageKey, StorageService} from './storage.service';
import {catchError, from, Observable, throwError} from 'rxjs';
import {SiteInfo} from '../interfaces/site-info';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SettingService {

  private siteInfo: SiteInfo | undefined;
  private initializedPromise!: Promise<void>;

  constructor(
    private http: HttpClient,
  ) {
    if(StorageService.getCookie(StorageKey.ACCESS_TOKEN)){
      this.initializedPromise = this.initialize();
    }
  }

  public initialize(): Promise<void> {

    if (this.siteInfo) {
      return Promise.resolve(); // User info already available, resolve immediately.
    }

    if (this.initializedPromise) {
      return this.initializedPromise; // Return the existing promise if it's being initialized.
    }

    // If not initialized yet, fetch siteInfo info.
    this.initializedPromise = new Promise<void>((resolve, reject) => {
      from(this.http.get<any>(`${environment.apiUrl}/v1/clients/site-info`))
        .pipe(
          catchError((error) => {
            // Handle specific errors, e.g., token expiration
            if (error.status === 401) {
              // Token expired, handle accordingly (e.g., redirect to login)
              // For now, let's reject the promise with a specific message
              reject('Token expired');
            } else {
              // Handle other errors
              reject('Failed to get site info');
            }
            return throwError(error); // Rethrow the error to propagate it further
          })
        )
        .subscribe({
          next: (siteInfo) => {
            this.siteInfo = siteInfo;
            resolve();
          }
        });
    });

    return this.initializedPromise;
  }

  public getSiteInfo(){
    return this.siteInfo;
  }

  public updateAggregatedViewOfInvoices(params: any): Observable<any> {
    params.append('_method', 'PATCH');
    return this.http.post<any>(`${environment.apiUrl}/v1/clients/settings/aggregated-view-of-invoices`, params);
  }

  public updateMarketOpeningNotification(params: any): Observable<any> {
    params.append('_method', 'PATCH');
    return this.http.post<any>(`${environment.apiUrl}/v1/clients/settings/market-opening-notification`, params);
  }

}
