import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject, Type } from '@angular/core';
import { DialogHostComponent } from './dialogHost.component';

export interface DialogOptions<TData=any> { data?: TData; closeOnBackdrop?: boolean; }
export interface DialogRef<T=any>{ close: (result?:T)=>void; afterClosed: Promise<T|undefined>; }

@Injectable({ providedIn: 'root' })
export class DialogService {
  private appRef = inject(ApplicationRef);
  private env = inject(EnvironmentInjector);
  private hostRef?: ComponentRef<DialogHostComponent>;

  private ensureHost(){
    if(!this.hostRef){
      this.hostRef = createComponent(DialogHostComponent,{environmentInjector:this.env});
      this.appRef.attachView(this.hostRef.hostView);
      document.body.appendChild(this.hostRef.location.nativeElement);
    }
    return this.hostRef.instance;
  }

  open<C, D=any, R=any>(component: Type<C>, opts: DialogOptions<D> = {}): DialogRef<R> {
    const host = this.ensureHost();
    return host.mount<C,D,R>(component, opts);
  }
}
