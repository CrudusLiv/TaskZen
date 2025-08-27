import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectFocusActive, selectFocusRemaining } from './state/focus.selectors';
import { FocusActions } from './state/focus.actions';

@Component({
  selector: 'app-focus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './focus.component.html',
  styleUrls: ['./focus.component.scss']
})
export class FocusComponent implements OnDestroy {
  private store = inject(Store);
  active$ = this.store.select(selectFocusActive);
  remaining$ = this.store.select(selectFocusRemaining);
  interval?: any;
  start(min:number){
    this.store.dispatch(FocusActions.start({ duration: min }));
    this.clear();
    let remaining = min * 60;
    this.interval = setInterval(()=>{
      remaining -= 1;
      if(remaining <= 0){ this.store.dispatch(FocusActions.complete()); this.clear(); }
      else { this.store.dispatch(FocusActions.tick({ remaining })); }
    },1000);
  }
  cancel(){ this.store.dispatch(FocusActions.cancel()); this.clear(); }
  clear(){ if(this.interval){ clearInterval(this.interval); this.interval = undefined; } }
  ngOnDestroy(){ this.clear(); }
}