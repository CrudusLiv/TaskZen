import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-skeleton-loader',
  imports: [NgFor],
  template: `
    <div class="skeleton-wrap" aria-hidden="true">
      <div
        *ngFor="let i of lineArray"
        class="skeleton-line"
        [class.skeleton-card]="type === 'card'"
        [class.skeleton-short]="i === lineArray.length - 1 && type === 'text'"
      ></div>
    </div>
  `,
  styleUrls: ['./skeleton-loader.component.scss'],
})
export class SkeletonLoaderComponent {
  @Input() lines = 3;
  @Input() type: 'text' | 'card' = 'text';

  get lineArray(): number[] {
    return Array.from({ length: this.lines }, (_, i) => i + 1);
  }
}
