import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import {environment} from '../../environments/environment';
import {Page} from '../interfaces/page';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private http = inject(HttpClient);
  private termsPage: Page | null = null;

  terms(): Observable<Page> {
    if (this.termsPage) {
      return of(this.termsPage);
    }

    return this.http.get<Page>(`${environment.apiUrl}/v1/pages/terms`).pipe(
      tap(page => {
        this.termsPage = page;
      })
    );
  }
}
