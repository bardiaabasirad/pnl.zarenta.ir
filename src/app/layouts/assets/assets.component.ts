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

  assets = signal<Asset[]>([]);

  ngOnInit() {
    this.assetService.assets().subscribe({
      next: asset => {
        this.initialized.set(true);

        this.assets.set(asset);
      },
      error: err => {
        this.initialized.set(true);
      }
    })
  }
}
