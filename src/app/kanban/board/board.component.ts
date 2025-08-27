import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BoardActions } from '../state/board.actions';
import { FormsModule } from '@angular/forms';
import { selectBoard, selectColumns, selectFilteredColumnCards, selectFilter, selectLastDeleted } from '../state/board.selectors';
import { selectActiveBoardMeta } from '../../boards/boards.selectors';
import { ThemeService } from '../../theme/theme.service';
import { ColumnComponent } from '../column/column.component';
import { DetailComponent } from '../detail/detail.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ColumnComponent, DetailComponent, DragDropModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class KanbanBoardComponent {
  private store = inject(Store);
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

  addColumn(){ const title = prompt('Column title?'); if(title) this.store.dispatch(BoardActions.addColumn({ title })); }
  renameColumn(id: string){ const title = prompt('New title?'); if(title) this.store.dispatch(BoardActions.renameColumn({ columnId: id, title })); }
  deleteColumn(id: string){ if(confirm('Delete column?')) this.store.dispatch(BoardActions.deleteColumn({ columnId: id })); }
  addCard(columnId: string){ const title = prompt('Card title?') || 'New Card'; this.store.dispatch(BoardActions.addCard({ columnId, title })); }
  updateCard(cardId: string, changes: any){ this.store.dispatch(BoardActions.updateCard({ cardId, changes })); }
  toggleCard(cardId: string){ this.store.dispatch(BoardActions.toggleCardCompleted({ cardId })); }
  @HostListener('document:keydown',['$event']) key(e: KeyboardEvent){
    if(e.key==='n' && !e.metaKey && !e.ctrlKey){
      const sub = this.columns$.subscribe(cols => {
        if(cols?.length){ this.store.dispatch(BoardActions.addCard({ columnId: cols[0].id, title: 'New Task' })); }
      });
      setTimeout(()=>sub.unsubscribe(),0);
    }
  }
  deleteCard(cardId: string, columnId: string){ if(confirm('Delete card?')) this.store.dispatch(BoardActions.deleteCard({ cardId, columnId })); }
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
