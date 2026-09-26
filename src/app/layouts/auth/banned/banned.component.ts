import { Component, ChangeDetectionStrategy } from '@angular/core';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-banned',
  standalone: true,
  imports: [],
  templateUrl: './banned.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './banned.component.scss'
})
export class BannedComponent {
  protected readonly environment = environment;
}
