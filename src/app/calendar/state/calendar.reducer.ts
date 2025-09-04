import { createFeature, createReducer, on } from '@ngrx/store';
import { CalendarActions } from './calendar.actions';
import { initialCalendarState, calendarFeatureKey } from './calendar.models';

export const calendarReducer = createReducer(
  initialCalendarState,
  on(CalendarActions.upsertEvents, (state, { events }) => ({
    ...state,
    events: events.reduce((acc, ev) => { acc[ev.id] = ev; return acc; }, { ...state.events })
  })),
  on(CalendarActions.addEvent, (state, { event }) => ({
    ...state,
    events: { ...state.events, [event.id]: event }
  })),
  on(CalendarActions.deleteEvent, (state, { id }) => {
    const { [id]: _, ...rest } = state.events; return { ...state, events: rest };
  })
);

export const calendarFeature = createFeature({
  name: calendarFeatureKey,
  reducer: calendarReducer
});
