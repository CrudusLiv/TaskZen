import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CalendarEvent } from './calendar.models';

export const CalendarActions = createActionGroup({
  source: 'Calendar',
  events: {
    Init: emptyProps(),
    'Load From Cards': emptyProps(),
    'Load User Events': emptyProps(),
    'Load User Events Success': props<{ events: CalendarEvent[] }>(),
    'Upsert Events': props<{ events: CalendarEvent[] }>(),
    'Add Event': props<{ event: CalendarEvent }>(),
    'Add Event Request': props<{ title: string; date: string }>(),
    'Update Event Request': props<{ id: string; changes: Partial<CalendarEvent> }>(),
    'Delete Event': props<{ id: string }>(),
  },
});
