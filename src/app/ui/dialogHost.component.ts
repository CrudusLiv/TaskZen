import { Component, EnvironmentInjector, Injector, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="backdrop()"></div>
    <div class="dialog-stack">
      <ng-container #vc></ng-container>
    </div>
  `,
  styles:[`
    :host{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;pointer-events:none;}
    .dialog-overlay{position:absolute;inset:0;background:rgba(10,12,15,.72);backdrop-filter:blur(6px);pointer-events:auto;}
    .dialog-stack{position:relative;display:flex;flex-direction:column;gap:1rem;max-width:90vw;max-height:90vh;overflow:auto;padding:1rem;pointer-events:none;}
    :host([data-open='true']) .dialog-stack > *{animation:popIn .4s cubic-bezier(.4,0,.2,1);} 
    @keyframes popIn{0%{opacity:0;transform:translateY(12px) scale(.96);}100%{opacity:1;transform:translateY(0) scale(1);} }
  `]
})
export class DialogHostComponent {
  @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;
  stack: { ref: any; close: (r?:any)=>void; resolver: (v:any)=>void; opts: any }[] = [];

  mount<C,D,R>(component: Type<C>, opts: { data?: D; closeOnBackdrop?: boolean } = {}): { close:(r?:R)=>void; afterClosed: Promise<R|undefined> } {
    const compRef = this.vc.createComponent(component as any, { injector: Injector.create({providers:[{provide:'DIALOG_DATA',useValue:opts.data}]}) });
    (compRef.location.nativeElement as HTMLElement).classList.add('dialog-card');
    (compRef.location.nativeElement as HTMLElement).style.pointerEvents='auto';
    let closed = false; let resolver!: (v:any)=>void; const afterClosed = new Promise<R|undefined>(res=>resolver=res);
    const close = (result?:R)=>{ if(closed) return; closed=true; compRef.destroy(); this.stack = this.stack.filter(s=>s.ref!==compRef); resolver(result); this.updateAttr(); if(!this.stack.length){ setTimeout(()=>this.detach(),250); } };
    this.stack.push({ ref: compRef, close, resolver, opts });
    this.updateAttr();
    return { close, afterClosed };
  }

  backdrop(){
    const top = this.stack[this.stack.length-1];
    if(top && top.opts.closeOnBackdrop!==false){ top.close(); }
  }

  private detach(){ /* host cleanup left for GC; keep root for reuse */ }
  private updateAttr(){ (this as any).elementRef?.nativeElement?.setAttribute('data-open', this.stack.length? 'true':'false'); }
}
