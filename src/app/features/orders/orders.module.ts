import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {OrdersComponent} from '../../layouts/orders/orders.component';
import {FooterComponent} from '../../layouts/partials/footer/footer.component';
import {HeaderComponent} from '../../layouts/partials/header/header.component';
import {SidebarComponent} from '../../layouts/partials/sidebar/sidebar.component';
import {FactorSeparatorComponent} from '../../components/factor-separator/factor-separator.component';
import {RouterLink} from '@angular/router';
import {OrdersRoutingModule} from './orders-routing.module';
import {PaginationComponent} from "../../components/pagination/pagination.component";
import {FormsModule} from '@angular/forms';
import {DateRangePickerComponent} from '../../components/date-range-picker/date-range-picker.component';
import {WithoutTrailingZerosPipe} from '../../pipes/without-trailing-zeros.pipe';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {JalaliPipe} from "../../pipes/jalali.pipe";
import {OrderComponent} from '../../layouts/orders/partials/order/order.component';

@NgModule({
  declarations: [
    OrdersComponent,
  ],
  imports: [
    OrdersRoutingModule,
    CommonModule,
    FooterComponent,
    HeaderComponent,
    SidebarComponent,
    FactorSeparatorComponent,
    RouterLink,
    PaginationComponent,
    FormsModule,
    DateRangePickerComponent,
    WithoutTrailingZerosPipe,
    PaginationComponent,
    NgxMaskDirective,
    JalaliPipe,
    OrderComponent,
  ],
  providers: [DatePipe, provideNgxMask()],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrdersModule { }
