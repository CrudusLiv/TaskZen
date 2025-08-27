import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../card/card.component';
import { CdkDropList, CdkDrag, DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Card, Column } from '../state/board.models';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, DragDropModule],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.scss']
})
export class ColumnComponent {
  @Input() column!: Column;
  @Input() cards: Card[] = [];
  @Input() highlight = '';
  @Input() connectedTo: string[] = [];
  @Output() add = new EventEmitter<void>();
  @Output() rename = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() sort = new EventEmitter<'created' | 'due' | 'priority'>();
  @Output() open = new EventEmitter<string>();
  @Output() removeCard = new EventEmitter<string>();
  @Output() dropCard = new EventEmitter<CdkDragDrop<any>>();
  @Output() updateCard = new EventEmitter<{ id: string; changes: any }>();
  @Output() toggleCard = new EventEmitter<string>();

  editing = false;
  titleDraft = '';
  beginEdit(){ this.editing = true; this.titleDraft = this.column.title; }
  commitTitle(){
    this.editing = false;
    if(this.titleDraft && this.titleDraft !== this.column.title) this.rename.emit(this.titleDraft);
  }
  cancelEdit(){ this.editing = false; }
  drop(ev: CdkDragDrop<any>){ this.dropCard.emit(ev); }
  addCard(){ this.add.emit(); }
  deleteColumn(){ this.delete.emit(); }
}
