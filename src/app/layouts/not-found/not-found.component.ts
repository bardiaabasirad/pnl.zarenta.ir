import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

}
