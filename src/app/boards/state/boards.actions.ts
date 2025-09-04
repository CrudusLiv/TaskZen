import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { BoardMeta } from './boards.models';

export const BoardsActions = createActionGroup({
  source: 'Boards',
  events: {
    'Init': emptyProps(),
    'Load Success': props<{ state: any | undefined }>(),
    'Create Board': props<{ title: string; description?: string; color?: string }>(),
    'Rename Board': props<{ boardId: string; title: string }>(),
    'Update Board Meta': props<{ boardId: string; changes: Partial<Pick<BoardMeta,'description'|'color'|'favorite'|'title'>> }>(),
    'Delete Board': props<{ boardId: string }>(),
    'Undo Delete Board': emptyProps(),
    'Clear Last Deleted': emptyProps(),
    'Set Active Board': props<{ boardId: string }>(),
    'Toggle Favorite': props<{ boardId: string }>()
  }
});
