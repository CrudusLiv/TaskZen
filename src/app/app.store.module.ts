import { isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export function provideAppStore() {
  return [
    provideStore(reducers),
    provideEffects([]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ];
}
