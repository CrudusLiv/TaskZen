import {
  Component,
  Injector,
  Type,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_CLOSE, DIALOG_DATA } from '../services/dialog.tokens';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-host.component.html',
  styleUrls: ['./dialog-host.component.scss']
})
export class DialogHostComponent {
  @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;
  stack: { ref: any; close: (r?: any) => void; resolver: (v: any) => void; opts: any }[] = [];
  private hostEl = inject(ElementRef);

  mount<C, D, R>(
    component: Type<C>,
    opts: { data?: D; closeOnBackdrop?: boolean } = {}
  ): { close: (r?: R) => void; afterClosed: Promise<R | undefined> } {
    let resolver!: (v: any) => void;
    const afterClosed = new Promise<R | undefined>((res) => (resolver = res));
    const closeHolder: { fn: (r?: R) => void } = { fn: () => {} };
    const inj = Injector.create({
      providers: [
        { provide: DIALOG_DATA, useValue: opts.data },
        { provide: DIALOG_CLOSE, useValue: (r?: R) => closeHolder.fn(r) },
      ],
    });
    const compRef = this.vc.createComponent(component as any, { injector: inj });
    (compRef.location.nativeElement as HTMLElement).classList.add('dialog-card');
    (compRef.location.nativeElement as HTMLElement).style.pointerEvents = 'auto';
    let closed = false;
    const close = (result?: R) => {
      if (closed) return;
      closed = true;
      compRef.destroy();
      this.stack = this.stack.filter((s) => s.ref !== compRef);
      resolver(result);
      this.updateAttr();
      if (!this.stack.length) {
        setTimeout(() => this.detach(), 250);
      }
    };
    closeHolder.fn = close;
    this.stack.push({ ref: compRef, close, resolver, opts });
    this.updateAttr();
    return { close, afterClosed };
  }

  backdrop() {
    const top = this.stack[this.stack.length - 1];
    if (top && top.opts.closeOnBackdrop !== false) {
      top.close();
    }
  }

  private detach() {
    /* host cleanup left for GC; keep root for reuse */
  }
  private updateAttr() {
    try {
      this.hostEl?.nativeElement?.setAttribute('data-open', this.stack.length ? 'true' : 'false');
    } catch {}
  }
}
