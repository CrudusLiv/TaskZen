import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBannerComponent } from './core/update/update-banner.component';
import { StorageErrorBannerComponent } from './core/storage/storage-error-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UpdateBannerComponent, StorageErrorBannerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
