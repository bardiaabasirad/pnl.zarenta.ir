import {Component, inject, OnInit, ChangeDetectionStrategy, signal} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {getFiltersUtil} from '../../utils/get-filters.util';
import {Sort} from '../../interfaces/sort';
import {PageEvent} from '@angular/material/paginator';
import {Title} from '@angular/platform-browser';
import {MatSnackBar} from '@angular/material/snack-bar';
import {OrderStateService} from '../../services/order-state.service';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  expirationTime: number = 0;
  readonly initialized = signal(false);
  loading: boolean = false;
  currentTime: string = '';

  filters: any = {
    tracking_code: '',
    status: 'all',
    start_date: '',
    end_date: '',
  };

  sort: Sort = {by: 'created_at', direction: 'DESC'};
  pageEvent: PageEvent = {length: 0, pageSize: 0, pageIndex: 0, previousPageIndex: 0};

  statuses: any[] = [
    {status: 'pending', persian_status: 'در انتظار بررسی'},
    {status: 'succeed', persian_status: 'تایید شده'},
    {status: 'rejected', persian_status: 'رد شده'},
  ];

  // services
  private orderService = inject(OrderService);
  private title = inject(Title);
  private matSnackBar = inject(MatSnackBar);
  private orderState = inject(OrderStateService);

  // منبع حقیقت لیست از سرویس مرکزی خوانده می‌شود (سیگنال)
  orders = this.orderState.orders;

  ngOnInit(): void {
    this.fetchData();
    // کاربر وارد صفحه سفارشات شده، اعلان قرمز فوتر را ریست می‌کنیم
    this.orderState.markSeen();
    this.title.setTitle('طلای ژیک | سفارشات آبشده');
  }

  fetchData(page: number = 1): void {
    let filters = getFiltersUtil(this.filters, this.sort);
    filters = `page=${page}&${filters}`;

    this.loading = true;

    this.orderService.index(filters).subscribe({
      next: (response: any) => {
        this.pageEvent = {
          length: response.data.total,
          pageSize: response.data.per_page,
          pageIndex: response.data.current_page - 1,
          previousPageIndex: response.data.current_page - 2,
        };

        // لیست را در سرویس قرار می‌دهیم تا آپدیت‌های سوکت روی همین داده اعمال شود
        this.orderState.setOrders(response.data.data);

        this.expirationTime = response.expiration_time;
        this.initialized.set(true);
        this.loading = false;
        this.currentTime = response.now;

        // پس از بارگذاری مجدد، چون کاربر در حال مشاهده است اعلان را خوانده‌شده می‌کنیم
        this.orderState.markSeen();
      },
      error: (error: any) => {
        this.initialized.set(true);

        if (error.status == 422) {
          this.matSnackBar.open(error.error.message);
        } else if (error.status == 429) {
          this.matSnackBar.open('تعداد درخواست‌های شما بیش از حد مجاز می‌باشد');
        } else if (error.status == 0) {
          this.matSnackBar.open('خطا در برقراری ارتباط', 'باشه', {duration: 3000});
        }

        this.loading = false;
      }
    });
  }

  protected readonly Math = Math;
}
