import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBannerComponent } from './core/update/update-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UpdateBannerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
