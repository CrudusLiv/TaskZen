import { Component, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { BoardsActions } from '../state/boards.actions';
import { DialogService } from '../../ui/dialog.service';
import { FormsModule } from '@angular/forms';
import {
  selectFavoriteBoards,
  selectNonFavoriteBoards,
  selectActiveBoardMeta,
  selectLastDeletedBoard,
} from '../state/boards.selectors';
import { BoardMeta } from '../state/boards.models';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-boards-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boards-dashboard.component.html',
  styleUrls: ['./boards-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsDashboardComponent implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private theme = inject(ThemeService);
  private dialog = inject(DialogService);
  fav$ = this.store.select(selectFavoriteBoards);
  others$ = this.store.select(selectNonFavoriteBoards);
  active$ = this.store.select(selectActiveBoardMeta);
  lastDeleted$ = this.store.select(selectLastDeletedBoard);
  creating = false;
  title = '';
  description = '';
  color = '#6366f1';
  filter = '';
  sort: 'updated' | 'created' | 'title' = 'updated';
  // Cached 'now' to keep relative time stable within a change detection cycle
  private nowRef = Date.now();
  private tickId = setInterval(() => {
    this.nowRef = Date.now();
  }, 15000); // update every 15s
  openCreate() {
    this.creating = true;
    this.title = '';
    this.description = '';
    this.color = '#6366f1';
  }
  create() {
    if (this.title.trim()) {
      this.store.dispatch(
        BoardsActions.createBoard({
          title: this.title,
          description: this.description || undefined,
          color: this.color,
        })
      );
      this.creating = false;
    }
  }
  cancel() {
    this.creating = false;
  }
  setFilter(v: string) {
    this.filter = (v || '').toLowerCase();
  }
  setSort(mode: 'updated' | 'created' | 'title') {
    this.sort = mode;
  }
  setActive(id: string) {
    this.store.dispatch(BoardsActions.setActiveBoard({ boardId: id }));
  }
  openBoard(id: string) {
    this.setActive(id);
    // navigate to kanban view to display the active board
    this.router.navigate(['/kanban']);
  }
  rename(b: any) {
    const t = prompt('New board title', b.title);
    if (t)
      this.store.dispatch(
        BoardsActions.renameBoard({ boardId: b.id, title: t })
      ); /* TODO: replace with dialog */
  }
  toggleFavorite(id: string) {
    this.store.dispatch(BoardsActions.toggleFavorite({ boardId: id }));
  }
  delete(id: string) {
    if (confirm('Delete board?'))
      this.store.dispatch(
        BoardsActions.deleteBoard({ boardId: id })
      ); /* TODO: replace with confirmation dialog */
  }
  undo() {
    this.store.dispatch(BoardsActions.undoDeleteBoard());
  }
  boardsView(list: BoardMeta[]) {
    if (!Array.isArray(list)) return [] as BoardMeta[];
    let res = list;
    if (this.filter) {
      res = res.filter((b) =>
        (b.title + ' ' + (b.description || '')).toLowerCase().includes(this.filter)
      );
    }
    const time = (d: string) => new Date(d).getTime();
    switch (this.sort) {
      case 'updated':
        res = [...res].sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
        break;
      case 'created':
        res = [...res].sort((a, b) => time(b.createdAt) - time(a.createdAt));
        break;
      case 'title':
        res = [...res].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return res;
  }
  private relative(ts: string) {
    const d = new Date(ts).getTime();
    const diff = this.nowRef - d;
    const sec = Math.max(0, Math.floor(diff / 1000));
    if (sec < 60) return sec + 's ago';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr / 24);
    if (day < 7) return day + 'd ago';
    const wk = Math.floor(day / 7);
    if (wk < 5) return wk + 'w ago';
    const mo = Math.floor(day / 30);
    if (mo < 12) return mo + 'mo ago';
    const yr = Math.floor(day / 365);
    return yr + 'y ago';
  }
  relativeUpdated(ts: string) {
    return 'Updated ' + this.relative(ts);
  }
  relativeCreated(ts: string) {
    return this.relative(ts);
  }
  ngOnInit() {
    this.store.dispatch(BoardsActions.init());
    // reactively update accent when active board meta changes
    const sub = this.active$.subscribe((meta) => this.theme.setAccent(meta?.color));
    // minimal teardown pattern (standalone component, let GC clear) - could implement ngOnDestroy
  }
  ngOnDestroy() {
    clearInterval(this.tickId);
  }
}
