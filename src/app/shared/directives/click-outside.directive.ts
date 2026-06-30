import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<Event>();
  private el = inject(ElementRef<HTMLElement>);
  private lastInside = 0;
  @HostListener('mousedown', ['$event']) onDown(e: Event) {
    if (this.el.nativeElement.contains(e.target as Node)) this.lastInside = Date.now();
  }
  @HostListener('touchstart', ['$event']) onTouch(e: Event) {
    if (this.el.nativeElement.contains(e.target as Node)) this.lastInside = Date.now();
  }
  @HostListener('document:mousedown', ['$event']) docDown(e: Event) {
    if (this.el.nativeElement.contains(e.target as Node)) return;
    // slight debounce to avoid immediate re-trigger during opening animations
    if (Date.now() - this.lastInside < 10) return;
    this.appClickOutside.emit(e);
  }
  @HostListener('document:touchstart', ['$event']) docTouch(e: Event) {
    if (this.el.nativeElement.contains(e.target as Node)) return;
    if (Date.now() - this.lastInside < 10) return;
    this.appClickOutside.emit(e);
  }
}
