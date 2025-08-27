import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BoardsActions } from '../boards.actions';
import { DialogService } from '../../ui/dialog.service';
import { FormsModule } from '@angular/forms';
import { selectFavoriteBoards, selectNonFavoriteBoards, selectActiveBoardMeta, selectLastDeletedBoard } from '../boards.selectors';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-boards-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boards-dashboard.component.html',
  styleUrls: ['./boards-dashboard.component.scss']
})
export class BoardsDashboardComponent {
  private store = inject(Store);
  private theme = inject(ThemeService);
  private dialog = inject(DialogService);
  fav$ = this.store.select(selectFavoriteBoards);
  others$ = this.store.select(selectNonFavoriteBoards);
  active$ = this.store.select(selectActiveBoardMeta);
  lastDeleted$ = this.store.select(selectLastDeletedBoard);
  creating = false;
  title = ''; description = ''; color = '#6366f1';
  openCreate(){ this.creating = true; this.title=''; this.description=''; this.color='#6366f1'; }
  create(){ if(this.title.trim()){ this.store.dispatch(BoardsActions.createBoard({ title: this.title, description: this.description || undefined, color: this.color })); this.creating=false; } }
  cancel(){ this.creating=false; }
  setActive(id: string){ this.store.dispatch(BoardsActions.setActiveBoard({ boardId: id })); }
  rename(b: any){ const t = prompt('New board title', b.title); if(t) this.store.dispatch(BoardsActions.renameBoard({ boardId: b.id, title: t })); /* TODO: replace with dialog */ }
  toggleFavorite(id: string){ this.store.dispatch(BoardsActions.toggleFavorite({ boardId: id })); }
  delete(id: string){ if(confirm('Delete board?')) this.store.dispatch(BoardsActions.deleteBoard({ boardId: id })); /* TODO: replace with confirmation dialog */ }
  undo(){ this.store.dispatch(BoardsActions.undoDeleteBoard()); }
  ngOnInit(){
    this.store.dispatch(BoardsActions.init());
    // reactively update accent when active board meta changes
    const sub = this.active$.subscribe(meta => this.theme.setAccent(meta?.color));
    // minimal teardown pattern (standalone component, let GC clear) - could implement ngOnDestroy
  }
}
