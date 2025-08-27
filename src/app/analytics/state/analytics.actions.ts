import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface ProductivityStats { date: string; completed: number; minutes: number; }

export const AnalyticsActions = createActionGroup({
  source: 'Analytics',
  events: {
  'Load': emptyProps(),
    'Load Success': props<{ streak: number; stats: ProductivityStats[] }>()
  }
});
