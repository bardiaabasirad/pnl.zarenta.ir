import { Component, ChangeDetectionStrategy } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-auth-entry-header',
  imports: [
    RouterLink
  ],
  templateUrl: './auth-entry-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './auth-entry-header.component.scss',
})
export class AuthEntryHeaderComponent {

}
