import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  onSubmit(ev: Event) {
    ev.preventDefault();
    // Placeholder: no persistence yet
  }
}
