import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from '../state/board.models';

@Component({
  selector: 'app-kanban-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() card!: Card;
  @Input() highlight = '';
  @Output() open = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() update = new EventEmitter<Partial<Card>>();
  @Output() toggle = new EventEmitter<void>();
  openDetails(){ this.open.emit(this.card.id); }
  deleteCard(e: MouseEvent){ e.stopPropagation(); this.delete.emit(this.card.id); }
  get dueSoon(): boolean {
    if(!this.card.dueDate) return false;
    const diff = (new Date(this.card.dueDate).getTime() - Date.now()) / (1000*60*60*24);
    return diff <= 2;
  }
  mark(text: string){
    if(!this.highlight) return text;
    const h = this.highlight.toLowerCase();
    if(!text.toLowerCase().includes(h)) return text;
    const idx = text.toLowerCase().indexOf(h);
    return text.substring(0,idx) + '<mark>' + text.substring(idx, idx+h.length) + '</mark>' + text.substring(idx+h.length);
  }
  get completedSubtasks(){
    return this.card.subtasks?.reduce((acc,st)=> acc + (st.completed?1:0), 0) ?? 0;
  }
  get progressPct(){
    const total = this.card.subtasks?.length || 0; if(!total) return 0; return Math.round((this.completedSubtasks/total)*100);
  }
  editing = false;
  edit(e: Event){ e.stopPropagation(); this.editing = true; }
  save(){
  const changes: any = {};
  const t = this.editTitle.trim(); if(t && t !== this.card.title) changes.title = t;
  const d = this.editDescription.trim(); if(d !== (this.card.description || '')) changes.description = d || undefined;
  if(this.editPriority !== this.card.priority) changes.priority = this.editPriority;
  if((this.editDueDate || undefined) !== (this.card.dueDate || undefined)) changes.dueDate = this.editDueDate || undefined;
  const tagsArr = this.editTags.split(',').map(t=>t.trim()).filter(t=>!!t);
  const origTags = this.card.tags || [];
  if(JSON.stringify(tagsArr) !== JSON.stringify(origTags)) changes.tags = tagsArr;
  if(Object.keys(changes).length) this.update.emit(changes);
    this.editing = false;
  }
  cancel(e: Event){ e.stopPropagation(); this.editing = false; }
  toggleCompleted(e: Event){ e.stopPropagation(); this.toggle.emit(); }
  editTitle = '';
  editDescription = '';
  editPriority = 'low';
  editDueDate = '';
  editTags = '';
  ngOnInit(){
    this.editTitle = this.card.title;
    this.editDescription = this.card.description || '';
    this.editPriority = this.card.priority;
    this.editDueDate = this.card.dueDate || '';
    this.editTags = (this.card.tags || []).join(', ');
  }
}
