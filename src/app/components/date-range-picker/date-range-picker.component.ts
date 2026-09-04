import {Component, EventEmitter, Input, Inject, Output, OnChanges, SimpleChanges, ChangeDetectionStrategy} from '@angular/core';
import {FormGroup, FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS} from "../../adapters/material.persian-date.adapter";

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule
],
  providers: [
    { provide: DateAdapter, useClass: MaterialPersianDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: PERSIAN_DATE_FORMATS },
  ],
  templateUrl: './date-range-picker.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./date-range-picker.component.scss'],
})
export class DateRangePickerComponent implements OnChanges {
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Output() selectedRange = new EventEmitter<any>();

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
  ) {}

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['startDate'] || changes['endDate']) {
      this.range.patchValue({
        start: this.startDate,
        end: this.endDate
      });
    }
  }

  onDateRangeChange() {
    const startDate = this.range.value.start;
    const endDate = this.range.value.end;
    if (startDate && endDate) {
      this.selectedRange.emit({ startDate, endDate });
    }
  }
}
