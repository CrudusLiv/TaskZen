export interface BoardMeta {
  id: string;
  title: string;
  description?: string;
  color?: string; // hex or tailwind-like token
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardsState {
  boards: Record<string, BoardMeta>;
  order: string[]; // ordering for list/grid
  activeBoardId?: string;
  lastDeleted?: { board: BoardMeta; index: number };
  loaded: boolean;
}
