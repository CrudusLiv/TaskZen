import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { Priority, BoardState } from './board.models';

export const BoardActions = createActionGroup({
  source: 'Board',
  events: {
    Init: emptyProps(),
    'Load Success': props<{ state: BoardState | undefined }>(),
    'Add Column': props<{ title: string }>(),
    'Rename Column': props<{ columnId: string; title: string }>(),
    'Delete Column': props<{ columnId: string }>(),
    'Add Card': props<{ columnId: string; title: string; priority?: Priority }>(),
    'Update Card': props<{
      cardId: string;
      changes: Partial<{
        title: string;
        description: string;
        dueDate: string;
        priority: Priority;
        tags: string[];
        completed: boolean;
      }>;
    }>(),
    'Delete Card': props<{ cardId: string; columnId: string }>(),
    'Toggle Card Completed': props<{ cardId: string }>(),
    'Undo Delete Card': emptyProps(),
    'Clear Last Deleted': emptyProps(),
    'Move Card': props<{
      cardId: string;
      fromColumnId: string;
      toColumnId: string;
      toIndex: number;
    }>(),
    'Reorder In Column': props<{ columnId: string; previousIndex: number; currentIndex: number }>(),
    'Set Filter Text': props<{ text: string }>(),
    'Set Filter Priority': props<{ priority?: Priority | 'any' }>(),
    'Set Filter Due': props<{ due?: string }>(),
    'Set Column Sort': props<{ columnId: string; sort: 'created' | 'due' | 'priority' }>(),
    'Add Subtask': props<{ cardId: string; title: string }>(),
    'Toggle Subtask': props<{ cardId: string; subtaskId: string }>(),
    'Delete Subtask': props<{ cardId: string; subtaskId: string }>(),
    'Add Comment': props<{ cardId: string; message: string; user: string }>(),
    'Edit Comment': props<{ cardId: string; commentId: string; message: string }>(),
    'Delete Comment': props<{ cardId: string; commentId: string }>(),
    'Toggle Reaction': props<{ cardId: string; commentId: string; emoji: string; user: string }>(),
    'Toggle Comments Panel': props<{ cardId: string }>(),
    'Open Card': props<{ cardId: string }>(),
    'Close Card': emptyProps(),
  },
});
