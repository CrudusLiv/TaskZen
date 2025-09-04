import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuggestionsComponent } from '../suggestions/suggestions.component';
import { DailyFocusComponent } from '../daily-focus/daily-focus.component';

@Component({
  selector: 'app-ai-hub',
  standalone: true,
  imports: [CommonModule, SuggestionsComponent, DailyFocusComponent],
  templateUrl: './ai-hub.component.html',
  styleUrls: ['./ai-hub.component.scss']
})
export class AiHubComponent {
  tuningCollapsed = signal(false);
  toggleTuning(){ this.tuningCollapsed.set(!this.tuningCollapsed()); }
}
