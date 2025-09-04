import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CalendarEvent } from './calendar.models';

export const CalendarActions = createActionGroup({
  source: 'Calendar',
  events: {
    'Init': emptyProps(),
    'Load From Cards': emptyProps(),
    'Upsert Events': props<{ events: CalendarEvent[] }>(),
    'Add Event': props<{ event: CalendarEvent }>(),
    'Delete Event': props<{ id: string }>()
  }
});
