export type Priority = 'low' | 'medium' | 'high';

export interface Subtask { id: string; title: string; completed: boolean; }

export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date
  priority: Priority;
  subtasks: Subtask[];
  tags?: string[];
  completed?: boolean;
  comments?: CommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  user: string; // username
  avatar?: string; // url or initials
  message: string;
  createdAt: string;
  updatedAt?: string;
  reactions?: { emoji: string; users: string[] }[]; // aggregated
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
  sort: 'created' | 'due' | 'priority';
}

export interface Board {
  id: string;
  title: string;
  columnIds: string[];
}

export interface BoardFilter {
  text: string;
  priority?: Priority | 'any';
  due?: string; // YYYY-MM-DD
}

export interface BoardState {
  board: Board;
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  filter: BoardFilter;
  loaded: boolean;
  activeCardId?: string; // for detail modal
  lastDeleted?: { card: Card; columnId: string; index: number }; // for undo
}
