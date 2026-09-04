import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {authGuard} from '../../guards/auth.guard';
import {OrdersComponent} from '../../layouts/orders/orders.component';

const routes: Routes = [
  {
    path: '',
    component: OrdersComponent,
    canActivate: [authGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
