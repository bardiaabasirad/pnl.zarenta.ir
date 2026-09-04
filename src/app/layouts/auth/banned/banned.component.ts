import { Component, ChangeDetectionStrategy } from '@angular/core';
import {RouterLink} from '@angular/router';
import {HeaderComponent} from '../../partials/header/header.component';
import {FooterComponent} from '../../partials/footer/footer.component';

@Component({
  selector: 'app-banned',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './banned.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './banned.component.scss'
})
export class BannedComponent {

}
