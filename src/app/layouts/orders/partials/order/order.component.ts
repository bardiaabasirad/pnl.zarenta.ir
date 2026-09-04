import {ChangeDetectorRef, Component, inject, Input, OnInit, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Order} from '../../../../interfaces/order';
import {WithoutTrailingZerosPipe} from '../../../../pipes/without-trailing-zeros.pipe';
import {JalaliPipe} from '../../../../pipes/jalali.pipe';
import {ProgressBarComponent} from '../../../../components/progress-bar/progress-bar.component';
import {AppConstants} from '../../../../constants/app-constants';
import {CeilPipe} from '../../../../pipes/ceil.pipe';
import {FloorPipe} from '../../../../pipes/floor.pipe';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule,
    WithoutTrailingZerosPipe,
    JalaliPipe,
    ProgressBarComponent,
    CeilPipe,
    FloorPipe,
  ],
  templateUrl: './order.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit{
  @Input() order: Order | undefined;
  @Input() expirationTime: number = 0;
  @Input() now: string = '';
  @ViewChild('progressBar') progressBar!: ProgressBarComponent;
  currentProgress: number = 100;
  currentRemainingTime: number = 0;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    setTimeout(()=> {
      if (this.progressBar) {
        this.progressBar.start();
        this.cdr.detectChanges();
      }
    }, 0);
  }

  onProgressUpdate(event: { progress: number, remainingTime: number }) {
    this.currentProgress = Math.round(event.progress);
    this.currentRemainingTime = event.remainingTime;

    this.cdr.detectChanges();
  }

  protected readonly Math = Math;
  protected readonly AppConstants = AppConstants;
}
