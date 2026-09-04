import {Component, ChangeDetectionStrategy} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {AuthEntryHeaderComponent} from '../partials/auth-entry-header/auth-entry-header.component';
import {AuthFooterComponent} from '../partials/auth-footer/auth-footer.component';

@Component({
  selector: 'app-auth-entry-layout',
  standalone: true,
  imports: [RouterOutlet, AuthEntryHeaderComponent, AuthFooterComponent],
  templateUrl: './auth-entry-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './auth-entry-layout.component.scss',
})
export class AuthEntryLayoutComponent {

}
