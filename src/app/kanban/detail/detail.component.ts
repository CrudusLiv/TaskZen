import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectActiveCard } from '../state/board.selectors';
import { BoardActions } from '../state/board.actions';
import { RateLimitService } from '../rate-limit.service';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent {
  private store = inject(Store);
  private rate = inject(RateLimitService);
  card$ = this.store.select(selectActiveCard);
  close(){ this.store.dispatch(BoardActions.closeCard()); }
  toggle(cardId: string, subtaskId: string){ this.store.dispatch(BoardActions.toggleSubtask({ cardId, subtaskId })); }
  // Comments UI state
  showComments = true;
  draft = '';
  editing: { [id: string]: string } = {};
  currentUser = 'alice'; // placeholder
  add(cardId: string){
    if(!this.draft.trim()) return;
    const message = this.draft;
    this.draft='';
    this.rate.debounce(`addComment-${cardId}`, 250, () => {
      this.store.dispatch(BoardActions.addComment({ cardId, message, user: this.currentUser }));
    });
  }
  startEdit(id: string, current: string){ this.editing[id] = current; }
  saveEdit(cardId: string, id: string){ const msg = this.editing[id]?.trim(); if(msg){ this.rate.debounce(`editComment-${id}`, 300, () => this.store.dispatch(BoardActions.editComment({ cardId, commentId: id, message: msg }))); } delete this.editing[id]; }
  cancelEdit(id: string){ delete this.editing[id]; }
  del(cardId: string, id: string){ if(confirm('Delete comment?')) this.store.dispatch(BoardActions.deleteComment({ cardId, commentId: id })); }
  react(cardId: string, commentId: string, emoji: string){ this.rate.debounce(`react-${commentId}-${emoji}`, 200, () => this.store.dispatch(BoardActions.toggleReaction({ cardId, commentId, emoji, user: this.currentUser }))); }
  mentionize(text: string){
    return text.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, (m, pre, user)=> `${pre}<span class="mention">@${user}</span>`);
  }
  emojis = ['👍','🎉','✅','🔥','❤️'];
}
