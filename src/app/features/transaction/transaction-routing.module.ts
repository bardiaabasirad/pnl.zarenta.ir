import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {authGuard} from '../../guards/auth.guard';
import {TransactionsComponent} from '../../layouts/transactions/transactions.component';

const routes: Routes = [
  {
    path: '',
    component: TransactionsComponent,
    canActivate: [authGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionRoutingModule { }
