import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  DOCUMENT,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import {TransactionService} from '../../services/transaction.service';
import {DatePipe} from '@angular/common';
import moment from 'jalali-moment';
import {User} from '../../interfaces/user';
import {from, Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {PageEvent} from '@angular/material/paginator';

@Component({
  selector: 'app-transactions',
  standalone: false,
  templateUrl: './transactions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  user: User | null | undefined;
  transactions: any[] = [];
  private transactionService = inject(TransactionService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  @ViewChild('transactionsTable') tableRef!: ElementRef<HTMLTableElement>;
  private authService = inject(AuthService);
  private subs: Subscription[] = [];
  start_date: Date | null = null;
  end_date: Date | null = null;
  rangeType: string = 'month';
  readonly rangeTypeOptions = [
    {value: '', label: 'دستی'},
    {value: 'today', label: 'فقط امروز'},
    {value: 'yesterday', label: 'از دیروز'},
    {value: 'month', label: 'از ابتدای برج'},
    {value: 'year', label: 'از ابتدای سال'},
  ];
  generatingPDF = signal<boolean>(false);
  initialized = signal<boolean>(false);
  loadError: boolean = false;
  loading = signal<boolean>(false);
  pageEvent: PageEvent = {length: 0, pageSize: 50, pageIndex: 0, previousPageIndex: 0};
  private readonly pageSize = 50;
  @ViewChild('expandableContainer') expandableContainer!: ElementRef;
  isExpanded: boolean = false;
  private scrollPosition: number = 0;
  private renderer = inject(Renderer2);
  private shouldHandlePopState: boolean = true;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    const today = moment();
    let start: moment.Moment;
    start = today.clone();
    this.start_date = start.toDate();
    this.end_date = today.toDate();

    this.getUserInfo();
    this.updateRange();
  }

  ngOnDestroy(): void {
    this.subs.forEach(subscription => subscription.unsubscribe());

    if (this.isExpanded) {
      const body = this.document.body;
      this.renderer.removeStyle(body, 'position');
      this.renderer.removeStyle(body, 'top');
      this.renderer.removeStyle(body, 'width');
      this.renderer.removeStyle(body, 'overflow');

      // حذف state از history اگر وجود دارد
      if (window.history.state?.expanded) {
        history.back();
      }
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isExpanded) {
      this.closeExpanded();
    }
  }

  @HostListener('window:popstate', ['$event'])
  onBackButton(event: PopStateEvent): void {
    if (this.isExpanded && this.shouldHandlePopState) {
      this.closeExpanded();
    }
  }

  toggleExpand(): void {
    (document.activeElement as HTMLElement)?.blur();

    if (!this.isExpanded) {
      this.openExpanded();
    } else {
      this.closeExpanded();
    }
  }

  private openExpanded(): void {
    const body = this.document.body;

    // ذخیره موقعیت فعلی اسکرول
    this.scrollPosition = window.scrollY || this.document.documentElement.scrollTop;
    this.isExpanded = true;

    // اضافه کردن state جدید به history
    history.pushState({expanded: true}, '');

    // غیرفعال کردن اسکرول body
    this.renderer.setStyle(body, 'position', 'fixed');
    this.renderer.setStyle(body, 'top', `-${this.scrollPosition}px`);
    this.renderer.setStyle(body, 'width', '100%');
    this.renderer.setStyle(body, 'overflow', 'hidden');
  }

  private closeExpanded(): void {
    const body = this.document.body;

    this.isExpanded = false;

    // فعال کردن مجدد اسکرول body
    this.renderer.removeStyle(body, 'position');
    this.renderer.removeStyle(body, 'top');
    this.renderer.removeStyle(body, 'width');
    this.renderer.removeStyle(body, 'overflow');

    // بازگشت به موقعیت قبلی
    window.scrollTo(0, this.scrollPosition);

    // اگر state ما در history است، آن را حذف کنیم
    if (window.history.state?.expanded) {
      this.shouldHandlePopState = false;
      history.back();
      setTimeout(() => {
        this.shouldHandlePopState = true;
      }, 100);
    }
  }

  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      from(this.authService.getUserInfo()).subscribe({
        next: () => {
          this.user = this.authService.getUser();

          if (this.user) {
            this.getTransactions();
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          if (error === 'Token expired') this.user = undefined;
        }
      });
    } else {
      this.user = null;
    }
  }

  // وقتی کاربر Select را تغییر می‌دهد
  onRangeTypeChange(value: string): void {
    this.rangeType = value;
    this.updateRange();
  }

  // محاسبه بازه بر اساس انتخاب کاربر
  updateRange(): void {
    const today = moment(); // امروز به شمسی
    let start: moment.Moment;

    switch (this.rangeType) {
      case 'today':
        start = today.clone(); // فقط امروز
        break;

      case 'yesterday':
        start = today.clone().subtract(1, 'day'); // از دیروز تا امروز
        break;

      case 'month':
        start = today.clone().startOf('jMonth'); // از ابتدای ماه شمسی تا امروز
        break;

      case 'year':
        start = today.clone().startOf('jYear'); // از ابتدای سال شمسی تا امروز
        break;

      default:
        start = today.clone();
    }

    // تبدیل به نوع Date برای app-date-range-picker
    this.start_date = start.toDate();
    this.end_date = today.toDate();
  }

  toBidiSafe(text: string) {
    return text.replace(/([0-9]+[.,0-9]*\s*[A-Za-z]+)/g, '\u200E$1\u200E');
  }

  onRangeSelected(event: { start: string; end: string }, fetch: boolean = true) {
    this.start_date = moment(event.start, 'jYYYY/jMM/jDD').toDate();
    this.end_date = moment(event.end, 'jYYYY/jMM/jDD').toDate();

    this.rangeType = '';

    if (fetch) this.getTransactions();
  }

  onDateRangeSelected(event: { startDate: Date; endDate: Date }) {
    this.start_date = event.startDate;
    this.end_date = event.endDate;
  }

  getTransactions(page: number = 1) {
    const params: any = {
      page,
      count: this.pageSize,
    };

    if (this.start_date) params['start'] = this.datePipe.transform(this.start_date, 'yyyy-MM-dd');
    if (this.end_date) params['end'] = this.datePipe.transform(this.end_date, 'yyyy-MM-dd');

    this.loading.set(true);

    this.transactionService.getTransactions(params).subscribe({
      next: result => {
        const pageData = result?.data;
        this.transactions = pageData?.data ?? [];
        this.pageEvent = {
          length: pageData?.total ?? 0,
          pageSize: pageData?.per_page ?? this.pageSize,
          pageIndex: (pageData?.current_page ?? 1) - 1,
          previousPageIndex: Math.max((pageData?.current_page ?? 1) - 2, 0),
        };
        this.loading.set(false);
        this.initialized.set(true);
        this.loadError = false;
      },
      error: error => {
        console.log(error);
        this.loading.set(false);
        this.loadError = true;
      }
    });
  }

  rowNumber(index: number): number {
    return this.pageEvent.pageIndex * this.pageEvent.pageSize + index + 1;
  }

  private readonly fiatTypes = new Set([
    'deposit',
    'withdraw',
    'fiat_debt_in',
    'fiat_credit_in',
    'settlement_fiat_transfer',
    'penalty_loss',
    'settlement_correction_fiat',
    'settlement_correction_metal',
    'settlement_delivery_in',
  ]);

  unitLabel(item: any): string {
    if (item?.amount_unit === 'toman' || this.fiatTypes.has(item?.type)) {
      return 'تومان';
    }
    if (item?.amount_unit === 'count' || item?.metal_item_unit === 'count') {
      return 'عدد';
    }
    if (item?.amount_unit === 'gram' || item?.metal_item_unit === 'gram') {
      return 'گرم';
    }
    return 'تومان';
  }

  signedAmount(item: any): number {
    if (item?.signed_amount !== undefined && item?.signed_amount !== null && item?.signed_amount !== '') {
      return Number(item.signed_amount);
    }

    const before = Number(item?.balance_before ?? 0);
    const after = Number(item?.balance_after ?? 0);
    if (Number.isFinite(before) && Number.isFinite(after)) {
      return after - before;
    }

    return Number(item?.amount ?? 0);
  }

  private convertToPersianNumbers(value: string): string {
    if (!value) return value;
    return value.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1728));
  }

  generateAutoPDF() {
    const params: any = {};

    if (this.start_date) params['start'] = this.datePipe.transform(this.start_date, 'yyyy-MM-dd');
    if (this.end_date) params['end'] = this.datePipe.transform(this.end_date, 'yyyy-MM-dd');

    this.generatingPDF.set(true);

    this.transactionService.generatePDF(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const startStr = moment(this.start_date!).format('jYYYYjMMjDD');
        const endStr = moment(this.end_date!).format('jYYYYjMMjDD');
        a.download = `zhik-${startStr}-${endStr}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        this.generatingPDF.set(false);
      },
      error: (err) => {
        console.error('خطا در ساخت PDF', err);
        this.generatingPDF.set(false);
      }
    });
  }

  protected readonly Math = Math;
  protected readonly moment = moment;
}
