import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {finalize, Observable, shareReplay} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class RateService {

  private http = inject(HttpClient);
  private rate$: Observable<any> | null = null;

  public getRate(): Observable<any> {

    if (this.rate$) {
      return this.rate$;
    }

    this.rate$ = this.http.get<any>(`${environment.apiUrl}/v1/clients/rate`).pipe(
      shareReplay(1),
      finalize(() => {
        this.rate$ = null;
      })
    );

    return this.rate$;
  }

}
