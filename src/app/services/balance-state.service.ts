import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { KimiaService } from './kimi.service';

@Injectable({ providedIn: 'root' })
export class BalanceStateService {
  private kimiaService = inject(KimiaService);

  private balancesSubject = new BehaviorSubject<any[]>([]);
  balances$ = this.balancesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<boolean>(false);
  error$ = this.errorSubject.asObservable();

  private initializedSubject = new BehaviorSubject<boolean>(false);
  initialized$ = this.initializedSubject.asObservable();

  loadBalances(accountId: string) {
    this.loadingSubject.next(true);

    this.kimiaService.getVoucherBalance(accountId)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (balances) => {
          this.balancesSubject.next(balances);
          this.initializedSubject.next(true);
          this.errorSubject.next(false);
        },
        error: () => {
          this.errorSubject.next(true);
          this.initializedSubject.next(true);
        }
      });
  }

  updateFromSocket(balances: any[]) {
    this.balancesSubject.next(balances);
    this.initializedSubject.next(true);
    this.errorSubject.next(false);
  }

  clear() {
    this.initializedSubject.next(false);
    this.balancesSubject.next([]);
    this.errorSubject.next(false);
  }
}
