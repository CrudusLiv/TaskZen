import { InjectionToken } from '@angular/core';

export interface DialogCloseFn<T = any> {
  (result?: T): void;
}

export const DIALOG_DATA = new InjectionToken<any>('DIALOG_DATA');
export const DIALOG_CLOSE = new InjectionToken<DialogCloseFn>('DIALOG_CLOSE');
