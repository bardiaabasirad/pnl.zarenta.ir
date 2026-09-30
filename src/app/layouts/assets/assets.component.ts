import {Component, inject, OnInit, signal} from '@angular/core';
import {AssetService} from '../../services/asset.service';
import {Asset} from '../../interfaces/asset';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-assets',
  imports: [
    DecimalPipe,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent implements OnInit {
  initialized = signal<boolean>(false);

  readonly assetService = inject(AssetService);

  spotAndCash = signal<Asset[]>([]);
  others = signal<Asset[]>([]);

  ngOnInit() {
    this.assetService.assets().subscribe({
      next: asset => {
        this.initialized.set(true);

        this.spotAndCash.set(asset.spot_and_cash);
        this.others.set(asset.forward_items);
      },
      error: err => {
        this.initialized.set(true);
      }
    })
  }
}
