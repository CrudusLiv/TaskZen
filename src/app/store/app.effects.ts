import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AppActions } from './app.actions';
import { ToastService } from '../ui/toast.service';
import { tap } from 'rxjs';

@Injectable()
export class AppEffects {
  private actions$ = inject(Actions);
  private toasts = inject(ToastService);

  errors$ = createEffect(()=> this.actions$.pipe(
    ofType(AppActions.error),
    tap(({ message })=> this.toasts.error(message))
  ), { dispatch:false });

  info$ = createEffect(()=> this.actions$.pipe(
    ofType(AppActions.info),
    tap(({ message })=> this.toasts.info(message))
  ), { dispatch:false });

  success$ = createEffect(()=> this.actions$.pipe(
    ofType(AppActions.success),
    tap(({ message })=> this.toasts.success(message))
  ), { dispatch:false });
}
