import { Injectable, signal } from '@angular/core';

export interface ToastMessage { id: string; text: string; type: 'info'|'success'|'error'; createdAt: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  messages = signal<ToastMessage[]>([]);

  private push(text: string, type: 'info'|'success'|'error'){
    const id = crypto.randomUUID();
    const msg: ToastMessage = { id, text, type, createdAt: Date.now() };
    this.messages.update(arr => [...arr, msg]);
    setTimeout(()=> this.dismiss(id), 4500);
  }
  info(t: string){ this.push(t,'info'); }
  success(t: string){ this.push(t,'success'); }
  error(t: string){ this.push(t,'error'); }
  dismiss(id: string){ this.messages.update(arr => arr.filter(m=>m.id!==id)); }
}
