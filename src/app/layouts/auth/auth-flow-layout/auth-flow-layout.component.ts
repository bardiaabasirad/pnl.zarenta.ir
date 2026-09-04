import { Component, ChangeDetectionStrategy } from '@angular/core';
import {AuthFooterComponent} from "../partials/auth-footer/auth-footer.component";
import {RouterOutlet} from "@angular/router";
import {AuthFlowHeaderComponent} from '../partials/auth-flow-header/auth-flow-header.component';

@Component({
  selector: 'app-auth-flow-layout',
  imports: [
    AuthFooterComponent,
    RouterOutlet,
    AuthFlowHeaderComponent
  ],
  templateUrl: './auth-flow-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './auth-flow-layout.component.scss',
})
export class AuthFlowLayoutComponent {

}
