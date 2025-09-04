import { createSelector } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import { calendarFeatureKey, CalendarState } from './calendar.models';

export const selectCalendarState = (s: AppState) => (s as any)[calendarFeatureKey] as CalendarState;
export const selectCalendarEvents = createSelector(selectCalendarState, s => Object.values(s.events));
export const selectEventsByDate = createSelector(selectCalendarEvents, evts => evts.reduce((acc: Record<string, any[]>, e) => { (acc[e.date] ||= []).push(e); return acc; }, {}));
