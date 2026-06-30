import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RoutinesActions, RoutineEntity } from '../state/routines.actions';
import { selectRoutinesArray } from '../state/routines.selectors';
@Component({
  standalone: true,
  selector: 'app-routines-page',
  imports: [CommonModule],
  templateUrl: './routines.page.html',
  styleUrls: ['./routines.page.scss'],
})
export class RoutinesPage {
  private store = inject(Store);
  private router = inject(Router);
  routinesSig = this.store.selectSignal(selectRoutinesArray);
  editingId = signal<string | null>(null);
  newRoutineName = signal('');
  metaName = signal('');
  metaEnergy = signal<number | undefined>(undefined);
  metaCue = signal('');
  stepTitle = signal('');
  stepMinutes = signal<number | undefined>(undefined);

  select(r: RoutineEntity) {
    this.editingId.set(r.id);
    this.metaName.set(r.name);
    this.metaEnergy.set(r.energyTarget);
    this.metaCue.set(r.cue || '');
    this.stepTitle.set('');
    this.stepMinutes.set(undefined);
  }
  addRoutine() {
    const n = this.newRoutineName().trim();
    if (!n) return;
    this.store.dispatch(RoutinesActions.addRoutine({ name: n }));
    this.newRoutineName.set('');
  }
  saveMeta() {
    const id = this.editingId();
    if (!id) return;
    this.store.dispatch(
      RoutinesActions.updateRoutineMeta({
        id,
        changes: {
          name: this.metaName().trim() || 'Untitled',
          energyTarget: this.metaEnergy() as 1 | 2 | 3 | 4 | 5 | undefined,
          cue: this.metaCue().trim() || undefined,
        },
      }),
    );
  }
  deleteRoutine(id: string) {
    this.store.dispatch(RoutinesActions.deleteRoutine({ id }));
    if (this.editingId() === id) this.editingId.set(null);
  }
  addStep() {
    const id = this.editingId();
    if (!id) return;
    const title = this.stepTitle().trim();
    if (!title) return;
    this.store.dispatch(
      RoutinesActions.addStep({ routineId: id, title, minutes: this.stepMinutes() }),
    );
    this.stepTitle.set('');
    this.stepMinutes.set(undefined);
  }
  reorder(r: RoutineEntity, stepId: string, dir: 'up' | 'down') {
    this.store.dispatch(RoutinesActions.reorderStep({ routineId: r.id, stepId, direction: dir }));
  }
  removeStep(r: RoutineEntity, stepId: string) {
    this.store.dispatch(RoutinesActions.removeStep({ routineId: r.id, stepId }));
  }
  updateStep(r: RoutineEntity, stepId: string, field: 'title' | 'minutes', value: string) {
    this.store.dispatch(
      RoutinesActions.updateStep({
        routineId: r.id,
        stepId,
        ...(field === 'title'
          ? { title: value }
          : { minutes: value === '' ? undefined : Number(value as string) }),
      }),
    );
  }
  play(r: RoutineEntity) {
    this.router.navigate(['/routines/play', r.id]);
  }
  isEditing(r: RoutineEntity) {
    return this.editingId() === r.id;
  }
}
