import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { debounceTime, catchError, filter, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { ItemsActions } from '../../ui/items/state/items.actions';
import { EnergyActions } from '../../ui/energy/state/energy.actions';
import { RoutinesActions } from '../../ui/routines/state/routines.actions';
import { FocusActions } from '../../ui/focus/state/focus.actions';
import { EncryptedStorageService } from './encrypted-storage.service';
import { StorageErrorService } from './storage-error.service';
import { of, merge, EMPTY } from 'rxjs';
import { selectItemsArray } from '../../ui/items/state/items.selectors';
import { selectRoutinesArray } from '../../ui/routines/state/routines.selectors';
import { selectEnergyLogs } from '../../ui/energy/state/energy.selectors';
import { selectCurrentFocus } from '../../ui/focus/state/focus.selectors';
import { selectFocusHistory, selectFocusDayStreak } from '../../ui/focus/state/focus.selectors';
import { selectCoachCards } from '../../ui/coach/state/coach.selectors';
import { selectPreferencesState } from '../../ui/preferences/state/preferences.selectors';
import { CoachActions } from '../../ui/coach/state/coach.actions';
import { PreferencesActions } from '../../ui/preferences/state/preferences.actions';

const SAVE_ACTIONS = [
  ItemsActions.addItem,
  ItemsActions.addMany,
  ItemsActions.updateItem,
  ItemsActions.deleteItem,
  ItemsActions.moveStatus,
  RoutinesActions.addRoutine,
  RoutinesActions.updateRoutineMeta,
  RoutinesActions.deleteRoutine,
  RoutinesActions.addStep,
  RoutinesActions.updateStep,
  RoutinesActions.removeStep,
  RoutinesActions.reorderStep,
  EnergyActions.addLog,
  EnergyActions.deleteLog,
  FocusActions.startSession,
  FocusActions.pause,
  FocusActions.resume,
  FocusActions.startBreak,
  FocusActions.endBreak,
  FocusActions.complete,
  FocusActions.stop,
  FocusActions.abort,
  ItemsActions.togglePin,
  ItemsActions.toggleMicroStep,
  CoachActions.dismissCard,
  CoachActions.pinCard,
  CoachActions.pruneOld,
  PreferencesActions.toggleCalmMode,
  PreferencesActions.setCalmMode,
  PreferencesActions.setThemeMode,
  PreferencesActions.setAccent,
  PreferencesActions.setDensity,
  PreferencesActions.setHighContrast,
  PreferencesActions.setPassphraseFlag,
];

export class PersistenceEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private storage = inject(EncryptedStorageService);
  private storageError = inject(StorageErrorService);

  hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ItemsActions.init,
        FocusActions.init,
        EnergyActions.init,
        RoutinesActions.init,
        CoachActions.init,
        PreferencesActions.init
      ),
      take(1),
      switchMap(() => this.storage.load()),
      filter((snap): snap is any => !!snap),
      switchMap((snap) => {
        return of(
          ItemsActions.hydrate({ items: snap.items || [] }),
          EnergyActions.hydrate({ logs: snap.energy?.logs || [] }),
          RoutinesActions.hydrate({ routines: snap.routines?.list || [] }),
          FocusActions.hydrate({
            current: snap.focus?.current,
            history: snap.focus?.history || [],
            dayStreak: snap.focus?.dayStreak,
            lastSessionDate: snap.focus?.lastSessionDate,
          }),
          CoachActions.hydrate({ cards: snap.coach?.cards || [] }),
          PreferencesActions.hydrate({ state: snap.preferences || {} })
        );
      }),
      catchError((err) => {
        console.error('[persistence] hydration failed — showing user error banner', err);
        this.storageError.showLoadError();
        return EMPTY;
      })
    )
  );

  save$ = createEffect(
    () =>
      merge(...SAVE_ACTIONS.map((a) => this.actions$.pipe(ofType(a)))).pipe(
        debounceTime(400),
        withLatestFrom(
          this.store.select(selectItemsArray),
          this.store.select(selectRoutinesArray),
          this.store.select(selectEnergyLogs),
          this.store.select(selectCurrentFocus),
          this.store.select(selectFocusHistory),
          this.store.select(selectFocusDayStreak),
          this.store.select(selectCoachCards),
          this.store.select(selectPreferencesState)
        ),
        switchMap(
          ([_, items, routines, logs, focus, focusHistory, focusStreak, coachCards, prefs]) =>
            this.storage.save({
              version: 3,
              items,
              routines: { list: routines },
              energy: { logs },
              focus: { current: focus, history: focusHistory, dayStreak: focusStreak },
              coach: { cards: coachCards },
              preferences: prefs,
            })
        )
      ),
    { dispatch: false }
  );
}
