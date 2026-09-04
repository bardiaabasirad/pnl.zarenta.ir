import {Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from "@angular/material/core";
import {MatDatepickerInputEvent, MatDatepickerModule} from "@angular/material/datepicker";
import {MatButtonModule} from "@angular/material/button";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS} from "../../adapters/material.persian-date.adapter";

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: MaterialPersianDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: PERSIAN_DATE_FORMATS }
  ],
  templateUrl: './date-picker.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./date-picker.component.scss']
})
export class DatePickerComponent implements OnInit {
  @Input() style: string = 'w-full border border-gray-200 rounded bg-gray-50 dark:border-gray-700 flex items-center';
  @Input() placeholder: string = '';
  @Output() datePicked = new EventEmitter<Date>();
  @Input() date: Date | null | undefined = null;
  dateControl = new FormControl<Date | null>(null);

  ngOnInit() {
    if (this.date){
      this.dateControl.setValue(this.date);
    }
  }

  addEvent(event: MatDatepickerInputEvent<Date>) {
    console.log('this.dateControl.value', this.dateControl.value);
    if (event.value) {
      this.datePicked.emit(event.value);
    }
  }

  resetDate() {
    this.dateControl.reset();
    this.datePicked.emit();
  }

  preventDefault(event: Event){
    event.preventDefault();
    event.stopPropagation();
  }
}
