import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {FooterComponent} from '../../layouts/partials/footer/footer.component';
import {HeaderComponent} from '../../layouts/partials/header/header.component';
import {SidebarComponent} from '../../layouts/partials/sidebar/sidebar.component';
import {RouterLink} from '@angular/router';
import {PaginationComponent} from "../../components/pagination/pagination.component";
import {FormsModule} from '@angular/forms';
import {DateRangePickerComponent} from '../../components/date-range-picker/date-range-picker.component';
import {WithoutTrailingZerosPipe} from '../../pipes/without-trailing-zeros.pipe';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {JalaliPipe} from "../../pipes/jalali.pipe";
import {TransactionsComponent} from '../../layouts/transactions/transactions.component';
import {TransactionRoutingModule} from './transaction-routing.module';
import {ExchangeModalComponent} from '../../layouts/exchange/partials/exchange-modal/exchange-modal.component';
import {TransactionDescriptionPipe} from '../../pipes/transaction-description.pipe';
import {RangeDateInputComponent} from "../../components/range-date-input/range-date-input.component";

@NgModule({
  declarations: [
    TransactionsComponent,
  ],
  imports: [
    TransactionRoutingModule,
    CommonModule,
    FooterComponent,
    HeaderComponent,
    SidebarComponent,
    RouterLink,
    FormsModule,
    DateRangePickerComponent,
    WithoutTrailingZerosPipe,
    PaginationComponent,
    NgxMaskDirective,
    JalaliPipe,
    ExchangeModalComponent,
    TransactionDescriptionPipe,
    RangeDateInputComponent,
  ],
  providers: [DatePipe, provideNgxMask()],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TransactionModule {
}
