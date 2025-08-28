import { createReducer, on } from '@ngrx/store';
import { BoardState, Column, Card, Subtask, CommentItem } from './board.models';
import { BoardActions } from './board.actions';

export const boardFeatureKey = 'kanban';

const seedState = (): BoardState => {
  const now = () => new Date().toISOString();
  const demoComments: CommentItem[] = [
    { id: 'cm1', user: 'alice', message: 'Initial draft created.', createdAt: now() },
    { id: 'cm2', user: 'bob', message: 'Looks good! @alice can you add tests?', createdAt: now() }
  ];
  const c1: Card = { id: 'c1', title: 'Sample Task A', priority: 'high', subtasks: [], tags: ['demo'], completed: false, createdAt: now(), updatedAt: now(), comments: demoComments };
  const c2: Card = { id: 'c2', title: 'Sample Task B', priority: 'medium', subtasks: [], tags: ['demo','sample'], completed: false, createdAt: now(), updatedAt: now(), dueDate: now().substring(0,10), comments: [] };
  const col1: Column = { id: 'col1', title: 'To Do', cardIds: ['c1','c2'], sort: 'created' };
  const col2: Column = { id: 'col2', title: 'In Progress', cardIds: [], sort: 'created' };
  const col3: Column = { id: 'col3', title: 'Done', cardIds: [], sort: 'created' };
  return {
    board: { id: 'b1', title: 'My Board', columnIds: ['col1','col2','col3'] },
    columns: { col1, col2, col3 },
    cards: { c1, c2 },
    filter: { text: '', priority: 'any', due: undefined },
    loaded: true,
    activeCardId: undefined
  };
};

const initialState: BoardState = { board: { id: '', title: '', columnIds: []}, columns: {}, cards: {}, filter: { text: '' }, loaded: false } as BoardState;

function applySort(col: Column, cards: Record<string, Card>) {
  const arr = [...col.cardIds];
  if (col.sort === 'due') {
    arr.sort((a,b)=> (cards[a].dueDate||'') .localeCompare(cards[b].dueDate||''));
  } else if (col.sort === 'priority') {
    const rank: Record<string,number> = { high:0, medium:1, low:2 };
    arr.sort((a,b)=> (rank[cards[a].priority]-rank[cards[b].priority]));
  } // created -> insertion order
  return arr;
}

export const boardReducer = createReducer(
  initialState,
  on(BoardActions.loadSuccess, (_, { state }) => state ? { ...state, loaded: true, activeCardId: undefined } : seedState()),
  on(BoardActions.addColumn, (s, { title }) => {
    const id = crypto.randomUUID();
    return {
      ...s,
      board: { ...s.board, columnIds: [...s.board.columnIds, id]},
      columns: { ...s.columns, [id]: { id, title, cardIds: [], sort: 'created' }}
    };
  }),
  on(BoardActions.renameColumn, (s,{ columnId, title }) => ({ ...s, columns: { ...s.columns, [columnId]: { ...s.columns[columnId], title }}})),
  on(BoardActions.deleteColumn, (s,{ columnId }) => {
    const { [columnId]:_, ...cols } = s.columns;
    const board = { ...s.board, columnIds: s.board.columnIds.filter(id=>id!==columnId) };
    return { ...s, columns: cols, board };
  }),
  on(BoardActions.addCard, (s,{ columnId, title, priority }) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const card: Card = { id, title: title || 'New Card', priority: priority || 'low', createdAt: now, updatedAt: now, subtasks: [] };
    const col = s.columns[columnId];
    return {
      ...s,
      cards: { ...s.cards, [id]: card },
      columns: { ...s.columns, [columnId]: { ...col, cardIds: [...col.cardIds, id] } }
    };
  }),
  on(BoardActions.updateCard, (s,{ cardId, changes }) => ({
    ...s,
    cards: { ...s.cards, [cardId]: { ...s.cards[cardId], ...changes, updatedAt: new Date().toISOString() }}
  })),
  on(BoardActions.toggleCardCompleted, (s,{ cardId }) => ({
    ...s,
    cards: { ...s.cards, [cardId]: { ...s.cards[cardId], completed: !s.cards[cardId].completed, updatedAt: new Date().toISOString() }}
  })),
  on(BoardActions.deleteCard, (s,{ cardId, columnId }) => {
    const col = s.columns[columnId];
    const index = col.cardIds.indexOf(cardId);
    if(index === -1) return s;
    const { [cardId]:removed, ...rest } = s.cards;
    return {
      ...s,
      cards: rest,
      columns: { ...s.columns, [columnId]: { ...col, cardIds: col.cardIds.filter(id=>id!==cardId) } },
      lastDeleted: removed ? { card: removed, columnId, index } : s.lastDeleted
    };
  }),
  on(BoardActions.undoDeleteCard, s => {
    const ld = s.lastDeleted; if(!ld) return s;
    const col = s.columns[ld.columnId]; if(!col) return { ...s, lastDeleted: undefined };
    return {
      ...s,
      cards: { ...s.cards, [ld.card.id]: ld.card },
      columns: { ...s.columns, [ld.columnId]: { ...col, cardIds: [ ...col.cardIds.slice(0, ld.index), ld.card.id, ...col.cardIds.slice(ld.index) ] } },
      lastDeleted: undefined
    };
  }),
  on(BoardActions.clearLastDeleted, s => ({ ...s, lastDeleted: undefined })),
  on(BoardActions.moveCard, (s,{ cardId, fromColumnId, toColumnId, toIndex }) => {
    if (!s.columns[fromColumnId] || !s.columns[toColumnId]) return s;
    const from = s.columns[fromColumnId];
    const to = s.columns[toColumnId];
    const newFromIds = from.cardIds.filter(id=>id!==cardId);
    const newToIds = [...to.cardIds];
    if (toIndex >= 0 && toIndex <= newToIds.length) newToIds.splice(toIndex,0,cardId); else newToIds.push(cardId);
    return {
      ...s,
      columns: {
        ...s.columns,
        [fromColumnId]: { ...from, cardIds: newFromIds },
        [toColumnId]: { ...to, cardIds: newToIds }
      }
    };
  }),
  on(BoardActions.reorderInColumn, (s,{ columnId, previousIndex, currentIndex }) => {
    const col = s.columns[columnId];
    if(!col) return s;
    const ids = [...col.cardIds];
    const [moved] = ids.splice(previousIndex,1);
    ids.splice(currentIndex,0,moved);
    return { ...s, columns: { ...s.columns, [columnId]: { ...col, cardIds: ids }}};
  }),
  on(BoardActions.setFilterText, (s,{ text }) => ({ ...s, filter: { ...s.filter, text }})),
  on(BoardActions.setFilterPriority, (s,{ priority }) => ({ ...s, filter: { ...s.filter, priority }})),
  on(BoardActions.setFilterDue, (s,{ due }) => ({ ...s, filter: { ...s.filter, due }})),
  on(BoardActions.setColumnSort, (s,{ columnId, sort }) => {
    const col = s.columns[columnId];
    const sortedIds = applySort({ ...col, sort }, s.cards);
    return { ...s, columns: { ...s.columns, [columnId]: { ...col, sort, cardIds: sortedIds }}};
  }),
  on(BoardActions.addSubtask, (s,{ cardId, title }) => {
    const card = s.cards[cardId];
    const st: Subtask = { id: crypto.randomUUID(), title, completed: false };
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, subtasks: [...card.subtasks, st] }}};
  }),
  on(BoardActions.toggleSubtask, (s,{ cardId, subtaskId }) => {
    const card = s.cards[cardId];
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, subtasks: card.subtasks.map(st=> st.id===subtaskId ? { ...st, completed: !st.completed } : st ) }}};
  }),
  on(BoardActions.deleteSubtask, (s,{ cardId, subtaskId }) => {
    const card = s.cards[cardId];
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, subtasks: card.subtasks.filter(st=>st.id!==subtaskId) }}};
  }),
  on(BoardActions.addComment, (s,{ cardId, message, user }) => {
    const card = s.cards[cardId]; if(!card) return s;
    const comment: CommentItem = { id: crypto.randomUUID(), user, message: message.trim(), createdAt: new Date().toISOString(), reactions: [] };
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, comments: [...(card.comments||[]), comment], updatedAt: new Date().toISOString() }}};
  }),
  on(BoardActions.editComment, (s,{ cardId, commentId, message }) => {
    const card = s.cards[cardId]; if(!card) return s;
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, comments: (card.comments||[]).map(c=> c.id===commentId ? { ...c, message: message.trim(), updatedAt: new Date().toISOString() } : c) }}};
  }),
  on(BoardActions.deleteComment, (s,{ cardId, commentId }) => {
    const card = s.cards[cardId]; if(!card) return s;
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, comments: (card.comments||[]).filter(c=>c.id!==commentId) }}};
  }),
  on(BoardActions.toggleReaction, (s,{ cardId, commentId, emoji, user }) => {
    const card = s.cards[cardId]; if(!card) return s;
    const comments = (card.comments||[]).map(c=> {
      if(c.id!==commentId) return c;
      const reactions = c.reactions || [];
      const idx = reactions.findIndex(r=>r.emoji===emoji);
      if(idx === -1){
        return { ...c, reactions: [...reactions, { emoji, users: [user] }]};
      } else {
        const r = reactions[idx];
        const has = r.users.includes(user);
        const newUsers = has ? r.users.filter(u=>u!==user) : [...r.users, user];
        const newReactions = [...reactions];
        if(newUsers.length) newReactions[idx] = { ...r, users: newUsers }; else newReactions.splice(idx,1);
        return { ...c, reactions: newReactions };
      }
    });
    return { ...s, cards: { ...s.cards, [cardId]: { ...card, comments }}};
  }),
  on(BoardActions.openCard, (s,{ cardId }) => ({ ...s, activeCardId: cardId })),
  on(BoardActions.closeCard, (s) => ({ ...s, activeCardId: undefined })),
  on(BoardActions.init, s => s.loaded ? s : seedState())
);
