import {Component, EventEmitter, inject, Input, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {InquiryService} from "../../../../services/inquiry.service";
import {ButtonWithLoaderComponent} from "../../../../components/button-with-loader/button-with-loader.component";
import {DatePickerComponent} from "../../../../components/date-picker/date-picker.component";
import {NgxMaskDirective} from "ngx-mask";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {nationalCodeValidator} from "../../../../validators/national-code-validator";
import {ErrorHandlingService} from "../../../../services/error-handling.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import moment from "jalali-moment";
import {convertToEnglishNumbersUtil} from '../../../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-ncr-inquiry',
  standalone: true,
  imports: [CommonModule, ButtonWithLoaderComponent, DatePickerComponent, NgxMaskDirective, ReactiveFormsModule],
  templateUrl: './ncr-inquiry.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./ncr-inquiry.component.scss']
})
export class NcrInquiryComponent {
  @Input() fee: number = 0;
  @Input() balance: number = 0;
  @Output() balanceChanged: EventEmitter<number> = new EventEmitter();
  @ViewChild(DatePickerComponent) datePicker!: DatePickerComponent;
  inquiryResponse: any;
  loading: boolean = false;
  form: FormGroup;
  national_code = new FormControl('',{validators: [Validators.required, nationalCodeValidator]});
  birthdate = new FormControl('',{validators: [Validators.required]});
  firstname = new FormControl('',{validators: []});
  lastname = new FormControl('',{validators: []});
  father_name = new FormControl('',{validators: []});

  private inquiryService = inject(InquiryService);
  private formBuilder = inject(FormBuilder);
  public errorHandlingService = inject(ErrorHandlingService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  constructor() {
    this.form = this.formBuilder.group({
      national_code: this.national_code,
      birthdate: this.birthdate,
      firstname: this.firstname,
      lastname: this.lastname,
      father_name: this.father_name,
    })
  }

  get isBalanceSufficient(): boolean {
    return Number(this.balance) >= Number(this.fee);
  }

  inquiry(){
    if (this.form.valid) {
      const formValue = this.form.value;
      let params = new FormData();
      params.append('national_code', formValue['national_code']);
      const birthdate = moment(formValue['birthdate'], 'YYYY-MM-DD').locale('fa').format('YYYYMMDD');
      params.append('birthdate', birthdate);
      params.append('firstname', formValue['firstname']);
      params.append('lastname', formValue['lastname']);
      params.append('father_name', formValue['father_name']);

      this.loading = true;

      this.inquiryService.similarity(params).subscribe({
        next: (response: any) => {
          this.inquiryResponse = response;

          this.balanceChanged.emit(response.balance);

          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;

          this.inquiryResponse = error.error;

          if (error.status == 422) {

            this.errorHandlingService.handleFormErrors(error, {
              national_code: this.national_code,
              birthdate: this.birthdate,
            });

            this.errorHandlingService.handleErrors(error, this);
          }
          else if (error.status == 429) {
            this.snackBar.open('تعداد درخواست‌های شما بیش از حد مجاز می‌باشد', 'باشه', {duration: 3000});
          }
          else {
            this.snackBar.open('خطا در برقراری ارتباط با سرور', 'باشه', {duration: 3000});
          }
        }
      })
    }
    else{
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)!.markAsDirty();
      });
    }
  }

  datePicked(date: Date){
    if (date) {
      const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');
      this.birthdate.setValue(formattedDate ?? '');
    }
  }

  resetDatePicker() {
    this.datePicker.resetDate();
  }

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  protected readonly Number = Number;
}
