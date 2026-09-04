import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy} from '@angular/core';
import moment from 'jalali-moment';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-jalali-datetime',
  imports: [
    FormsModule
  ],
  templateUrl: './jalali-datetime.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './jalali-datetime.component.scss'
})
export class JalaliDatetimeComponent implements OnInit, OnDestroy {
  @Input() initialDateTime: string = '';
  @Input() allowFutureDates: boolean = false;
  @Output() dateTimeChange = new EventEmitter<string>();

  // Date parts
  year: number = 0;
  month: number = 0;
  day: number = 0;
  hour: number = 0;
  minute: number = 0;

  // Current date (for validation)
  currentJalaliDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } = {
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
    minute: 0
  };

  // Max values
  maxDaysInMonth: number = 31;

  // Error message
  validationError: string = '';

  // Timer reference for updating current date
  private currentDateUpdateInterval: any;

  constructor() {}

  ngOnInit(): void {
    this.initializeCurrentDate();
    this.initializeFromCurrentDate();

    if (this.initialDateTime) {
      this.parseDateTime(this.initialDateTime);
    }

    // Set up interval to update current date every minute
    this.currentDateUpdateInterval = setInterval(() => {
      this.initializeCurrentDate();

      // If not allowing future dates, validate the current selection
      // against the newly updated current date
      if (!this.allowFutureDates) {
        this.validateNotFutureDate();
        this.validateAndEmit();
      }
    }, 1000); // Update every second (1000 ms)
  }

  ngOnDestroy(): void {
    // Clean up interval when component is destroyed
    if (this.currentDateUpdateInterval) {
      clearInterval(this.currentDateUpdateInterval);
    }
  }

  initializeCurrentDate(): void {
    const now = moment().locale('fa');
    this.currentJalaliDate = {
      year: now.jYear(),
      month: now.jMonth() + 1,
      day: now.jDate(),
      hour: now.hour(),
      minute: now.minute()
    };
  }

  initializeFromCurrentDate(): void {
    const now = moment().locale('fa');
    this.year = now.jYear();
    this.month = now.jMonth() + 1;
    this.day = now.jDate();
    this.hour = now.hour();
    this.minute = now.minute();
    this.updateMaxDaysInMonth();
  }

  parseDateTime(dateTimeStr: string): void {
    try {
      const m = moment(dateTimeStr).locale('fa');
      this.year = m.jYear();
      this.month = m.jMonth() + 1;
      this.day = m.jDate();
      this.hour = m.hour();
      this.minute = m.minute();
      this.updateMaxDaysInMonth();

      if (!this.allowFutureDates) {
        this.validateNotFutureDate();
      }
    } catch (e) {
      console.error('Invalid date format', e);
    }
  }

  updateMaxDaysInMonth(): void {
    const m = moment(`${this.year}/${this.month}/1`, 'jYYYY/jM/jD').locale('fa');
    this.maxDaysInMonth = m.jDaysInMonth();

    if (this.day > this.maxDaysInMonth) {
      this.day = this.maxDaysInMonth;
    }
  }

  // Validate that the selected date is not in the future
  validateNotFutureDate(): boolean {
    if (this.allowFutureDates) {
      return true;
    }

    const current = this.currentJalaliDate;
    let wasAdjusted = false;

    // Compare year
    if (this.year > current.year) {
      this.year = current.year;
      this.month = current.month;
      this.day = current.day;
      this.hour = current.hour;
      this.minute = current.minute;
      this.validationError = 'تاریخ آینده مجاز نیست';
      return false;
    }
    // Same year, compare month
    else if (this.year === current.year && this.month > current.month) {
      this.month = current.month;
      this.day = current.day;
      this.hour = current.hour;
      this.minute = current.minute;
      this.validationError = 'تاریخ آینده مجاز نیست';
      return false;
    }
    // Same year and month, compare day
    else if (this.year === current.year && this.month === current.month && this.day > current.day) {
      this.day = current.day;
      this.hour = current.hour;
      this.minute = current.minute;
      this.validationError = 'تاریخ آینده مجاز نیست';
      return false;
    }
    // Same year, month, and day, compare hour
    else if (this.year === current.year && this.month === current.month &&
      this.day === current.day && this.hour > current.hour) {
      this.hour = current.hour;
      this.minute = current.minute;
      this.validationError = 'زمان آینده مجاز نیست';
      return false;
    }
    // Same year, month, day, and hour, compare minute
    else if (this.year === current.year && this.month === current.month &&
      this.day === current.day && this.hour === current.hour &&
      this.minute > current.minute) {
      this.minute = current.minute;
      this.validationError = 'زمان آینده مجاز نیست';
      return false;
    }

    return true;
  }

  // Handlers for changing date parts
  increaseYear(): void {
    const oldYear = this.year;
    this.year++;

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.year = oldYear;
      return;
    }

    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  decreaseYear(): void {
    this.year--;
    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  increaseMonth(): void {
    const oldMonth = this.month;
    const oldYear = this.year;

    if (this.month < 12) {
      this.month++;
    } else {
      this.month = 1;
      this.year++;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.month = oldMonth;
      this.year = oldYear;
      return;
    }

    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  decreaseMonth(): void {
    if (this.month > 1) {
      this.month--;
    } else {
      this.month = 12;
      this.year--;
    }
    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  increaseDay(): void {
    const oldDay = this.day;
    const oldMonth = this.month;
    const oldYear = this.year;

    if (this.day < this.maxDaysInMonth) {
      this.day++;
    } else {
      this.day = 1;
      this.increaseMonth();
      return;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.day = oldDay;
      this.month = oldMonth;
      this.year = oldYear;
      return;
    }

    this.validateAndEmit();
  }

  decreaseDay(): void {
    if (this.day > 1) {
      this.day--;
    } else {
      this.decreaseMonth();
      this.day = this.maxDaysInMonth;
      return;
    }
    this.validateAndEmit();
  }

  increaseHour(): void {
    const oldHour = this.hour;
    const oldDay = this.day;
    const oldMonth = this.month;
    const oldYear = this.year;

    if (this.hour < 23) {
      this.hour++;
    } else {
      this.hour = 0;
      this.increaseDay();
      return;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.hour = oldHour;
      this.day = oldDay;
      this.month = oldMonth;
      this.year = oldYear;
      return;
    }

    this.validateAndEmit();
  }

  decreaseHour(): void {
    if (this.hour > 0) {
      this.hour--;
    } else {
      this.hour = 23;
      this.decreaseDay();
      return;
    }
    this.validateAndEmit();
  }

  increaseMinute(): void {
    const oldMinute = this.minute;
    const oldHour = this.hour;
    const oldDay = this.day;
    const oldMonth = this.month;
    const oldYear = this.year;

    if (this.minute < 59) {
      this.minute++;
    } else {
      this.minute = 0;
      this.increaseHour();
      return;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.minute = oldMinute;
      this.hour = oldHour;
      this.day = oldDay;
      this.month = oldMonth;
      this.year = oldYear;
      return;
    }

    this.validateAndEmit();
  }

  decreaseMinute(): void {
    if (this.minute > 0) {
      this.minute--;
    } else {
      this.minute = 59;
      this.decreaseHour();
      return;
    }
    this.validateAndEmit();
  }

  // Manual input handlers
  onYearChange(newValue: number): void {
    const oldYear = this.year;
    this.year = newValue;

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.year = oldYear;
      return;
    }

    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  onMonthChange(newValue: number): void {
    const oldMonth = this.month;

    if (newValue < 1) {
      this.month = 1;
    } else if (newValue > 12) {
      this.month = 12;
    } else {
      this.month = newValue;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.month = oldMonth;
      return;
    }

    this.updateMaxDaysInMonth();
    this.validateAndEmit();
  }

  onDayChange(newValue: number): void {
    const oldDay = this.day;

    if (newValue < 1) {
      this.day = 1;
    } else if (newValue > this.maxDaysInMonth) {
      this.day = this.maxDaysInMonth;
    } else {
      this.day = newValue;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.day = oldDay;
      return;
    }

    this.validateAndEmit();
  }

  onHourChange(newValue: number): void {
    const oldHour = this.hour;

    if (newValue < 0) {
      this.hour = 0;
    } else if (newValue > 23) {
      this.hour = 23;
    } else {
      this.hour = newValue;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.hour = oldHour;
      return;
    }

    this.validateAndEmit();
  }

  onMinuteChange(newValue: number): void {
    const oldMinute = this.minute;

    if (newValue < 0) {
      this.minute = 0;
    } else if (newValue > 59) {
      this.minute = 59;
    } else {
      this.minute = newValue;
    }

    if (!this.allowFutureDates && !this.validateNotFutureDate()) {
      this.minute = oldMinute;
      return;
    }

    this.validateAndEmit();
  }

  validateAndEmit(): void {
    // Clear previous error
    this.validationError = '';

    // Validate the date is not in the future if required
    if (!this.allowFutureDates) {
      this.validateNotFutureDate();
    }

    // Validate the date
    try {
      // Ensure day is within valid range for the month
      if (this.day > this.maxDaysInMonth) {
        this.day = this.maxDaysInMonth;
      }

      // Format date with leading zeros for month and day if needed
      const dateStr = `${this.year}/${this.month.toString().padStart(2, '0')}/${this.day.toString().padStart(2, '0')} ${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}:00`;

      // Create a moment object to validate the date
      const m = moment(dateStr, 'jYYYY/jMM/jDD HH:mm:ss').locale('fa');

      if (m.isValid()) {
        // Only emit if no validation error
        if (this.validationError === '') {
          // Emit the ISO format date for the parent component
          this.dateTimeChange.emit(m.format('YYYY-MM-DDTHH:mm:ss'));
        }
      } else {
        this.validationError = 'تاریخ و زمان نامعتبر است';
      }
    } catch (e) {
      this.validationError = 'خطا در اعتبارسنجی تاریخ و زمان';
      console.error('Date validation error', e);
    }
  }

  // Get formatted date time
  getFormattedDateTime(): string {
    try {
      const dateStr = `${this.year}/${this.month}/${this.day} ${this.hour}:${this.minute}:00`;
      return moment(dateStr, 'jYYYY/jM/jD HH:mm:ss').locale('fa').format('jYYYY/jMM/jDD HH:mm');
    } catch (e) {
      return 'تاریخ نامعتبر';
    }
  }
}
