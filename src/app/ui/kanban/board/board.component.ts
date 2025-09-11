import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BoardActions } from '../state/board.actions';
import { FormsModule } from '@angular/forms';
import { selectBoard, selectColumns, selectFilteredColumnCards, selectFilter, selectLastDeleted } from '../state/board.selectors';
import { selectActiveBoardMeta } from '../../boards/state/boards.selectors';
import { ThemeService } from '../../../theme/theme.service';
import { ColumnComponent } from '../column/column.component';
import { DetailComponent } from '../detail/detail.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { take } from 'rxjs';
import { DIAG_FIRESTORE_VERBOSE } from '../../../environment.flags';
import { DialogService } from '../../dialogs/services/dialog.service';
import { InputDialogComponent } from '../../dialogs/input-dialog/input-dialog.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ColumnComponent, DetailComponent, DragDropModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class KanbanBoardComponent {
  private store = inject(Store);
  private dialog = inject(DialogService);
  board$ = this.store.select(selectBoard);
  columns$ = this.store.select(selectColumns);
  filter$ = this.store.select(selectFilter);
  lastDeleted$ = this.store.select(selectLastDeleted);
  activeMeta$ = this.store.select(selectActiveBoardMeta);
  private theme = inject(ThemeService);
  trackCol = (_:number,c:any)=>c.id;
  connected(ids: string[], current: string){ return ids.filter(i=>i!==current); }
  cards(columnId: string){ return this.store.select(selectFilteredColumnCards(columnId)); }
  connectedTo(columns: any[], currentId: string){ return columns.filter(c=>c.id !== currentId).map(c=>c.id); }
  cardCount(columns: any[]){ return columns.reduce((sum: number,c: any)=> sum + (c.cardIds?.length||0), 0); }
  showCompleted = signal(true);
  collapsedCols = signal<Set<string>>(new Set());
  toggleShowCompleted(){ this.showCompleted.update(v=> !v); }
  toggleColumnCollapse(id: string){
    this.collapsedCols.update(set=>{ const next = new Set(set); if(next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  isCollapsed(id: string){ return this.collapsedCols().has(id); }
  filteredCards(list: any[]){ if(!Array.isArray(list)) return []; return this.showCompleted() ? list : list.filter(c=> !c.completed); }

  async addColumn(){
    const ref = this.dialog.open(InputDialogComponent, { data: { title: 'New Column', label: 'Title' } });
    const title = await ref.afterClosed;
    if(title) this.store.dispatch(BoardActions.addColumn({ title }));
  }
  async renameColumn(id: string){
    const ref = this.dialog.open(InputDialogComponent, { data: { title: 'Rename Column', label: 'Title' } });
    const title = await ref.afterClosed;
    if(title) this.store.dispatch(BoardActions.renameColumn({ columnId: id, title }));
  }
  async deleteColumn(id: string){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete column?', confirmText: 'Delete' } });
    const ok = await ref.afterClosed;
    if(ok) this.store.dispatch(BoardActions.deleteColumn({ columnId: id }));
  }
  async addCard(columnId: string){
    const ref = this.dialog.open(InputDialogComponent, { data: { title: 'New Card', label: 'Title', placeholder: 'Task title' } });
    const title = (await ref.afterClosed) || 'New Card';
    this.store.dispatch(BoardActions.addCard({ columnId, title }));
  }
  addQuick(title: string){
    this.columns$.pipe(take(1)).subscribe(cols => {
      if(cols?.length){
        if(DIAG_FIRESTORE_VERBOSE){ console.log('[KanbanBoard] quick add ->', title); }
        this.store.dispatch(BoardActions.addCard({ columnId: cols[0].id, title }));
      }
    });
  }
  updateCard(cardId: string, changes: any){
    // Only allow fields permitted by Firestore rules
    const allowed = ['title','description','dueDate','priority','tags','completed'];
    const filtered: any = {};
    for(const k of allowed) if(k in changes) filtered[k] = changes[k];
    this.store.dispatch(BoardActions.updateCard({ cardId, changes: filtered }));
  }
  toggleCard(ev: { id: string; completed: boolean }){ this.store.dispatch(BoardActions.updateCard({ cardId: ev.id, changes: { completed: ev.completed } })); }
  addSubtask(ev: { cardId: string; title: string }){ this.store.dispatch(BoardActions.addSubtask(ev)); }
  toggleSubtask(ev: { cardId: string; subtaskId: string }){ this.store.dispatch(BoardActions.toggleSubtask(ev)); }
  deleteSubtask(ev: { cardId: string; subtaskId: string }){ this.store.dispatch(BoardActions.deleteSubtask(ev)); }
  @HostListener('document:keydown',['$event']) key(e: KeyboardEvent){
    if(e.key==='n' && !e.metaKey && !e.ctrlKey){
      const sub = this.columns$.subscribe(cols => {
        if(cols?.length){ this.store.dispatch(BoardActions.addCard({ columnId: cols[0].id, title: 'New Task' })); }
      });
      queueMicrotask(()=> sub.unsubscribe());
    }
  }
  async deleteCard(cardId: string, columnId: string){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete card?', message: 'This action cannot be undone.' } });
    const ok = await ref.afterClosed;
    if(ok) this.store.dispatch(BoardActions.deleteCard({ cardId, columnId }));
  }
  undo(){ this.store.dispatch(BoardActions.undoDeleteCard()); }
  open(cardId: string){ this.store.dispatch(BoardActions.openCard({ cardId })); }
  drop(ev: CdkDragDrop<any>, columnId: string, fromId: string){
    const prevListId = (ev.previousContainer.id);
    if(prevListId === ev.container.id){
      this.store.dispatch(BoardActions.reorderInColumn({ columnId, previousIndex: ev.previousIndex, currentIndex: ev.currentIndex }));
    } else {
      const item = ev.previousContainer.data[ev.previousIndex];
      if(item){
        this.store.dispatch(BoardActions.moveCard({ cardId: item.id, fromColumnId: prevListId, toColumnId: columnId, toIndex: ev.currentIndex }));
      }
    }
  }
  setText(text: string){ this.store.dispatch(BoardActions.setFilterText({ text })); }
  setPriority(p: string){ this.store.dispatch(BoardActions.setFilterPriority({ priority: p === 'any' ? 'any' : p as any })); }
  setDue(d: string){ this.store.dispatch(BoardActions.setFilterDue({ due: d || undefined })); }
  setSort(columnId: string, sort: 'created'|'due'|'priority'){ this.store.dispatch(BoardActions.setColumnSort({ columnId, sort })); }

  ngOnInit(){
    this.store.dispatch(BoardActions.init());
    const sub = this.activeMeta$.subscribe(meta => this.theme.setAccent(meta?.color));
  }
}
