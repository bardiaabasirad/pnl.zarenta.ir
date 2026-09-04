import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChildren,
  ElementRef,
  QueryList,
  AfterViewInit,
  OnChanges, SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import moment from 'jalali-moment';
import {FormsModule} from '@angular/forms';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {convertToEnglishNumbersUtil} from '../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-range-date-input',
  templateUrl: './range-date-input.component.html',
  imports: [
    FormsModule,
    NgxMaskDirective
  ],
  providers: [provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./range-date-input.component.scss']
})
export class RangeDateInputComponent implements AfterViewInit, OnChanges {
  @Input() startDate!: string;
  @Input() endDate!: string;
  @Output() dateRangeSelected = new EventEmitter<{ start: string, end: string }>();
  @Output() dateRangeChanged = new EventEmitter<{ start: string, end: string }>();

  // 🔸 فیلدهای فعال/غیرفعال برای روز، ماه، سال
  @Input() disableDay: boolean = false;
  @Input() disableMonth: boolean = false;
  @Input() disableYear: boolean = false;

  start = { day: '', month: '', year: '' };
  end = { day: '', month: '', year: '' };
  private previousValues: { [key: string]: string } = {};

  @ViewChildren('inputRef') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  ngAfterViewInit(): void {
    this.initializeDates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      this.initializeDates();
    }
  }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const name = input.getAttribute('name');
    if (name) this.previousValues[name] = input.value;
    setTimeout(() => input.select(), 0);
  }

  validateField(type: 'start' | 'end', field: 'day' | 'month' | 'year'): void {
    const target = type === 'start' ? this.start : this.end;
    const name = `${type}-${field}`;
    const value = Number(target[field]);

    // بررسی محدوده مقدماتی برای فیلدها
    if (field === 'day' && (value < 1 || value > 31)) {
      target[field] = this.previousValues[name] || '';
      return;
    }

    if (field === 'month' && (value < 1 || value > 12)) {
      target[field] = this.previousValues[name] || '';
      return;
    }

    if (field === 'year' && target[field].length !== 4) {
      target[field] = this.previousValues[name] || '';
      return;
    }

    // ✅ بررسی صحت واقعی تاریخ — همیشه بعد از تغییر سال یا ماه یا روز
    if (
      (field === 'day' || field === 'month' || field === 'year') &&
      target.year && target.month && target.day
    ) {
      const year = Number(target.year);
      const month = Number(target.month);
      const enteredDay = Number(target.day);

      const startOfMonth = moment(`${year}/${month}/01`, 'jYYYY/jMM/jDD');
      const maxDay = startOfMonth.endOf('jMonth').jDate();

      if (enteredDay > maxDay) {
        target.day = String(maxDay).padStart(2, '0');
      }
    }

    this.previousValues[name] = target[field];
    this.emitDateRangeChanged();
  }

  private initializeDates(): void {
    if (this.startDate) {
      const m = moment(this.startDate, 'jYYYY/jMM/jDD');
      if (m.isValid()) {
        this.start = {
          day: m.jDate().toString().padStart(2, '0'),
          month: (m.jMonth() + 1).toString().padStart(2, '0'),
          year: m.jYear().toString()
        };
      }
    }

    if (this.endDate) {
      const m = moment(this.endDate, 'jYYYY/jMM/jDD');
      if (m.isValid()) {
        this.end = {
          day: m.jDate().toString().padStart(2, '0'),
          month: (m.jMonth() + 1).toString().padStart(2, '0'),
          year: m.jYear().toString()
        };
      }
    }
  }

  // 🔹 کنترل رفتار Enter بر اساس فعال بودن فیلدها
  onEnter(index: number): void {
    const inputsArray = this.inputs.toArray();
    let nextIndex = index + 1;

    // پیدا کردن input بعدی که disabled نباشد
    while (nextIndex < inputsArray.length && inputsArray[nextIndex].nativeElement.disabled) {
      nextIndex++;
    }

    // اگر input بعدی وجود ندارد (یا همه بعدی‌ها غیرفعالند) => رویداد را اجرا کن
    if (nextIndex >= inputsArray.length) {
      this.emitDateRange();
      return;
    }

    const nextInput = inputsArray[nextIndex].nativeElement;
    nextInput.focus();
    nextInput.select();
  }

  private emitDateRange(): void {
    const start = `${this.start.year}/${this.start.month}/${this.start.day}`;
    const end = `${this.end.year}/${this.end.month}/${this.end.day}`;
    const mStart = moment(start, 'jYYYY/jMM/jDD');
    const mEnd = moment(end, 'jYYYY/jMM/jDD');

    if (mStart.isValid() && mEnd.isValid()) {
      this.dateRangeSelected.emit({
        start: mStart.format('jYYYY/jMM/jDD'),
        end: mEnd.format('jYYYY/jMM/jDD'),
      });
    }
  }

  private emitDateRangeChanged(): void {
    const start = `${this.start.year}/${this.start.month}/${this.start.day}`;
    const end = `${this.end.year}/${this.end.month}/${this.end.day}`;
    const mStart = moment(start, 'jYYYY/jMM/jDD');
    const mEnd = moment(end, 'jYYYY/jMM/jDD');

    if (mStart.isValid() && mEnd.isValid()) {
      this.dateRangeChanged.emit({
        start: mStart.format('jYYYY/jMM/jDD'),
        end: mEnd.format('jYYYY/jMM/jDD'),
      });
    }
  }

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));
}
