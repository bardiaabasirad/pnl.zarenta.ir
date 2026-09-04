import { DateAdapter } from "@angular/material/core";
import * as jalaliMoment from "jalali-moment";
import moment from 'jalali-moment';

export const PERSIAN_DATE_FORMATS = {
  parse: {
    dateInput: "jYYYY/jMM/jDD"
  },
  display: {
    dateInput: "jYYYY/jMM/jDD",
    monthYearLabel: "jYYYY jMMMM",
    dateA11yLabel: "jYYYY/jMM/jDD",
    monthYearA11yLabel: "jYYYY jMMMM"
  },
};

export class MaterialPersianDateAdapter extends DateAdapter<jalaliMoment.Moment> {

  constructor() {
    super();
    super.setLocale("fa");
  }

  getYear(date: jalaliMoment.Moment): number {
    return this.clone(date).utc(true).jYear();
  }

  getMonth(date: jalaliMoment.Moment): number {
    return this.clone(date).utc(true).jMonth();
  }

  getDate(date: jalaliMoment.Moment): number {
    return this.clone(date).utc(true).jDate();
  }

  getDayOfWeek(date: jalaliMoment.Moment): number {
    return this.clone(date).utc(true).day();
  }

  getMonthNames(style: "long" | "short" | "narrow"): string[] {
    switch (style) {
      case "long":
      case "short":
        return jalaliMoment.localeData("fa").jMonths().slice(0);
      case "narrow":
        return jalaliMoment.localeData("fa").jMonthsShort().slice(0);
    }
  }

  getDateNames(): string[] {
    const valuesArray = Array(31);
    for (let i = 0; i < 31; i++) {
      valuesArray[i] = String(i + 1);
    }
    return valuesArray;
  }

  getDayOfWeekNames(style: "long" | "short" | "narrow"): string[] {
    switch (style) {
      case "long":
        return jalaliMoment.localeData("fa").weekdays().slice(0);
      case "short":
        return jalaliMoment.localeData("fa").weekdaysShort().slice(0);
      case "narrow":
        return ["ی", "د", "س", "چ", "پ", "ج", "ش"];
    }
  }

  getYearName(date: jalaliMoment.Moment): string {
    return this.clone(date).utc(true).jYear().toString();
  }

  getFirstDayOfWeek(): number {
    return jalaliMoment.localeData("fa").firstDayOfWeek();
  }

  getNumDaysInMonth(date: jalaliMoment.Moment): number {
    return this.clone(date).utc(true).jDaysInMonth();
  }

  clone(date: jalaliMoment.Moment): jalaliMoment.Moment {
    return date.clone().utc(true).locale("fa");
  }

  createDate(year: number, month: number, date: number): jalaliMoment.Moment {
    if (month < 0 || month > 11) {
      throw Error(
        `Invalid month index "${month}". Month index has to be between 0 and 11.`
      );
    }
    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }
    const result = moment()
      .jYear(year).jMonth(month).jDate(date)
      .hours(0).minutes(0).seconds(0).milliseconds(0)
      .locale("fa").utc(true);

    if (this.getMonth(result) !== month) {
      throw Error(`Invalid date ${date} for month with index ${month}.`);
    }
    if (!result.isValid()) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }
    return result;
  }

  today(): jalaliMoment.Moment {
    return moment().locale("fa").utc(true);;
  }

  parse(value: any, parseFormat: string | string[]): jalaliMoment.Moment | null {
    if (value && typeof value === "string") {
      return moment(value, parseFormat, "fa").utc(true);
    }
    return value ? moment(value).locale("fa").utc(true) : null;
  }

  format(date: jalaliMoment.Moment, displayFormat: string): string {
    date = this.clone(date).utc(true);
    if (!this.isValid(date)) {
      throw Error("JalaliMomentDateAdapter: Cannot format invalid date.");
    }
    return date.format(displayFormat);
  }

  addCalendarYears(date: jalaliMoment.Moment, years: number): jalaliMoment.Moment {
    return this.clone(date).utc(true).add(years, "jYear");
  }

  addCalendarMonths(date: jalaliMoment.Moment, months: number): jalaliMoment.Moment {
    return this.clone(date).utc(true).add(months, "jmonth");
  }

  addCalendarDays(date: jalaliMoment.Moment, days: number): jalaliMoment.Moment {
    return this.clone(date).utc(true).add(days, "jDay");
  }

  toIso8601(date: jalaliMoment.Moment): string {
    return this.clone(date).utc(true).format();
  }

  isDateInstance(obj: any): boolean {
    return jalaliMoment.isMoment(obj);
  }

  isValid(date: jalaliMoment.Moment): boolean {
    return this.clone(date).utc(true).isValid();
  }

  invalid(): jalaliMoment.Moment {
    return jalaliMoment.invalid();
  }

  override deserialize(value: any): jalaliMoment.Moment | null {
    let date;
    if (value instanceof Date) {
      date = moment(value).utc(true);
    }
    if (typeof value === "string") {
      if (!value) {
        return null;
      }
      date = moment(value).utc(true).locale("fa");
    }
    if (date && this.isValid(date)) {
      return date;
    }
    return super.deserialize(value);
  }
}
