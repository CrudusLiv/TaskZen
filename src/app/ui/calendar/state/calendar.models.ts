export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  source: 'card' | 'event';
  cardId?: string;
  priority?: string;
}
export interface CalendarState {
  events: { [id: string]: CalendarEvent };
  loading: boolean;
}
export const calendarFeatureKey = 'calendar';
export const initialCalendarState: CalendarState = { events: {}, loading: false };
