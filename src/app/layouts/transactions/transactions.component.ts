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
import {KimiaService} from '../../services/kimi.service';
import {DatePipe} from '@angular/common';
import moment from 'jalali-moment';
import {User} from '../../interfaces/user';
import {from, Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {BalanceStateService} from '../../services/balance-state.service';
import {AppConstants} from '../../constants/app-constants';

@Component({
  selector: 'app-transactions',
  standalone: false,
  templateUrl: './transactions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  user: User | null | undefined;
  transactions: any;
  private kimiaService = inject(KimiaService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  @ViewChild('transactionsTable') tableRef!: ElementRef<HTMLTableElement>;
  private authService = inject(AuthService);
  private balanceState = inject(BalanceStateService);
  private subs: Subscription[] = [];
  start_date: Date | null = null;
  end_date: Date | null = null;
  rangeType: string = 'month';
  generatingPDF = signal<boolean>(false);
  initialized = signal<boolean>(false);
  loadError: boolean = false;
  loading = signal<boolean>(false);
  balances: any[] = [];
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

    this.subs.push(
      this.balanceState.balances$.subscribe(b => this.balances = b)
    );

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

  getTransactions() {

    const params: any = {};

    if (this.start_date) params['start'] = this.datePipe.transform(this.start_date, 'yyyy-MM-dd');
    if (this.end_date) params['end'] = this.datePipe.transform(this.end_date, 'yyyy-MM-dd');
    params['pageSize'] = 10000000;

    this.loading.set(true);

    this.kimiaService.getVoucherTransactions(params).subscribe({
      next: result => {
        this.transactions = result
        this.loading.set(false);
        this.initialized.set(true);
        this.loadError = false;
      },
      error: error => {
        console.log(error);
        this.loading.set(false);
        this.loadError = true;
      }
    })

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

    this.kimiaService.generatePDF(params).subscribe({
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

  buildBalanceSummary(balances: any[]): string {
    const A = AppConstants;

    const orderedGoldIds = [
      A.KIMIA_TODAY_SPOT_SETTLEMENT,
      A.KIMIA_TOMORROW_SPOT_SETTLEMENT,
      A.KIMIA_DAY_AFTER_TOMORROW_SPOT_SETTLEMENT
    ];
    const orderedCoinIds = [
      A.KIMIA_GOLD_COIN_86,
      A.KIMIA_GOLD_HALF_COIN_86,
      A.KIMIA_GOLD_QUARTER_COIN_86,
      A.KIMIA_GOLD_COIN_OLD_VERSION
    ];

    const goldBalances = orderedGoldIds
      .map(id => balances.find(b => b.CurrencyId === id))
      .filter(Boolean);

    const coinBalances = orderedCoinIds
      .map(id => balances.find(b => b.CurrencyId === id))
      .filter(Boolean);

    const getColor = (n: number) => n > 0 ? 'blue' : n < 0 ? 'red' : 'black';
    const numFa = (n: number) =>
      Math.abs(n)
        .toLocaleString('fa-IR')
        .replace(/٬/g, ',');

    const moneyLabel = (cid: number) =>
      cid === A.KIMIA_TODAY_SPOT_SETTLEMENT
        ? 'تومان'
        : cid === A.KIMIA_TOMORROW_SPOT_SETTLEMENT
          ? 'فردایی'
          : cid === A.KIMIA_DAY_AFTER_TOMORROW_SPOT_SETTLEMENT
            ? 'پس‌فردایی'
            : '';

    const coinLabel = (cid: number) => {
      switch (cid) {
        case A.KIMIA_GOLD_COIN_OLD_VERSION:
          return 'تمام سکه قدیم';
        case A.KIMIA_GOLD_COIN_86:
          return 'تمام سکه ۸۶';
        case A.KIMIA_GOLD_HALF_COIN_86:
          return 'نیم سکه ۸۶';
        case A.KIMIA_GOLD_QUARTER_COIN_86:
          return 'ربع سکه ۸۶';
        default:
          return '';
      }
    };

    let html = `
    <div style="margin-top:20px;font-size:12px;direction:rtl">
      <div style="display:flex;font-weight:bold;padding:4px 8px">
        <div style="width:80px">وزن ۷۵۰</div>
        <div>مبلغ</div>
      </div>
  `;

    goldBalances.forEach(b => {
      html += `
      <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #ccc;padding:6px 8px;border-radius:6px;margin:4px 0">
        <div style="width:80px;color:${getColor(b.Weight)}">
          ${b.Weight === 0 ? '۰' : b.Weight > 0 ? 'بس ' + numFa(b.Weight) : 'بد ' + numFa(b.Weight)}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex:1;gap:8px;">
          <div style="color:${getColor(b.Money)}">
            ${b.Money === 0 ? '۰' : b.Money > 0 ? 'بس ' + numFa(Math.round(b.Money / 10)) : 'بد ' + numFa(Math.round(Math.abs(b.Money / 10)))}
          </div>
          <div style="background:#dcfce7;color:#166534;border-radius:10px;padding:0 4px;font-size:11px">${moneyLabel(b.CurrencyId)}</div>
        </div>
      </div>`;
    });

    if (coinBalances.length) {
      coinBalances.forEach(b => {
        html += `
        <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #ccc;padding:6px 8px;border-radius:6px;margin:4px 0">
          <div style="color:${getColor(b.Money)}">
            ${b.Money === 0 ? '۰' : b.Money > 0 ? 'بس ' + numFa(b.Money) : 'بد ' + numFa(Math.abs(b.Money))}
          </div>
          <div style="background:#dcfce7;color:#166534;border-radius:10px;padding:0 4px;font-size:11px">${coinLabel(b.CurrencyId)}</div>
        </div>`;
      });
    }

    html += `</div>`;
    return html;
  }

  protected readonly Math = Math;
  protected readonly moment = moment;
}
