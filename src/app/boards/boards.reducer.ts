import { createReducer, on } from '@ngrx/store';
import { BoardsState, BoardMeta } from './boards.models';
import { BoardsActions } from './boards.actions';

export const boardsFeatureKey = 'boards';

const seed = (): BoardsState => {
  const now = () => new Date().toISOString();
  const b1: BoardMeta = { id: 'b1', title: 'My Board', description: 'Default board', color: '#6366f1', favorite: true, createdAt: now(), updatedAt: now() };
  return { boards: { b1 }, order: ['b1'], activeBoardId: 'b1', loaded: true } as BoardsState;
};

const initial: BoardsState = { boards: {}, order: [], loaded: false } as BoardsState;

export const boardsReducer = createReducer(
  initial,
  on(BoardsActions.loadSuccess, (_, { state }) => state ? { ...state, loaded: true } : seed()),
  on(BoardsActions.createBoard, (s,{ title, description, color }) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const board: BoardMeta = { id, title: title.trim() || 'Untitled', description, color, favorite: false, createdAt: now, updatedAt: now };
    return { ...s, boards: { ...s.boards, [id]: board }, order: [...s.order, id], activeBoardId: id };
  }),
  on(BoardsActions.renameBoard, (s,{ boardId, title }) => ({ ...s, boards: { ...s.boards, [boardId]: { ...s.boards[boardId], title: title.trim(), updatedAt: new Date().toISOString() }}})),
  on(BoardsActions.updateBoardMeta, (s,{ boardId, changes }) => ({ ...s, boards: { ...s.boards, [boardId]: { ...s.boards[boardId], ...changes, updatedAt: new Date().toISOString() }}})),
  on(BoardsActions.toggleFavorite, (s,{ boardId }) => ({ ...s, boards: { ...s.boards, [boardId]: { ...s.boards[boardId], favorite: !s.boards[boardId].favorite, updatedAt: new Date().toISOString() }}})),
  on(BoardsActions.deleteBoard, (s,{ boardId }) => {
    const idx = s.order.indexOf(boardId); if(idx===-1) return s;
    const { [boardId]: removed, ...rest } = s.boards;
    const newOrder = s.order.filter(id=>id!==boardId);
    const activeBoardId = s.activeBoardId === boardId ? newOrder[0] : s.activeBoardId;
    return { ...s, boards: rest, order: newOrder, activeBoardId, lastDeleted: removed ? { board: removed, index: idx } : s.lastDeleted };
  }),
  on(BoardsActions.undoDeleteBoard, s => {
    const ld = s.lastDeleted; if(!ld) return s;
    return { ...s, boards: { ...s.boards, [ld.board.id]: ld.board }, order: [ ...s.order.slice(0, ld.index), ld.board.id, ...s.order.slice(ld.index) ], lastDeleted: undefined };
  }),
  on(BoardsActions.clearLastDeleted, s => ({ ...s, lastDeleted: undefined })),
  on(BoardsActions.setActiveBoard, (s,{ boardId }) => ({ ...s, activeBoardId: boardId })),
  on(BoardsActions.init, s => s.loaded ? s : seed())
);
