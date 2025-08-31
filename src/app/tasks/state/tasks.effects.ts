import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TasksActions, TaskItem } from './tasks.actions';
import { switchMap, of, from, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUser } from '../../auth/state/auth.selectors';
import { FirebaseService } from '../../firebase.service';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { writeBatch } from 'firebase/firestore';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private firebase = inject(FirebaseService);
  private user$ = this.store.select(selectUser);

  private ensureInit(){ this.firebase.init(); }

  init$ = createEffect(()=> this.actions$.pipe(
    ofType(TasksActions.init),
    switchMap(()=> this.user$),
    switchMap(user => {
      if(!user) return of();
      this.ensureInit();
      const db = getFirestore();
      const col = collection(db, 'tasks');
      const q = query(col, where('userId', '==', user.id));
      return new Promise<any>(resolve => {
        onSnapshot(q, snap => {
          const tasks: TaskItem[] = [];
          snap.forEach(d => {
            const data = d.data() as any;
            tasks.push({
              id: d.id,
              title: data.title,
              description: data.description,
              due: data.due,
              priority: data.priority || 'medium',
              completed: !!data.completed,
              categoryId: data.categoryId,
              position: data.position,
              createdAt: data.createdAt?.toMillis? new Date(data.createdAt.toMillis()).toISOString(): data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toMillis? new Date(data.updatedAt.toMillis()).toISOString(): data.updatedAt || new Date().toISOString()
            });
          });
          resolve(tasks);
        });
      }).then((tasks: TaskItem[])=> TasksActions.replaceAllTasks({ tasks }));
    })
  ));

  add$ = createEffect(()=> this.actions$.pipe(
    ofType(TasksActions.addTask),
    switchMap(({ title, description, due, priority='medium', categoryId })=> this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        this.ensureInit();
        const db = getFirestore();
        const col = collection(db, 'tasks');
  const position = Date.now();
  return from(addDoc(col, { title, description, due, priority, categoryId, completed: false, userId: user.id, position, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
      })
    ))
  ), { dispatch:false });

  update$ = createEffect(()=> this.actions$.pipe(
    ofType(TasksActions.updateTask, TasksActions.toggleComplete),
    switchMap(act=> this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        const id = (act as any).id;
        const changes = act.type === TasksActions.toggleComplete.type ? { completed: (act as any).completed === undefined ? true : !(act as any).completed } : (act as any).changes;
        this.ensureInit();
        const db = getFirestore();
        return from(updateDoc(doc(db, 'tasks', id), { ...changes, updatedAt: serverTimestamp() }));
      })
    ))
  ), { dispatch:false });

  delete$ = createEffect(()=> this.actions$.pipe(
    ofType(TasksActions.deleteTask),
    switchMap(({ id })=> this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        this.ensureInit();
        const db = getFirestore();
        return from(deleteDoc(doc(db, 'tasks', id)));
      })
    ))
  ), { dispatch:false });

  reorder$ = createEffect(()=> this.actions$.pipe(
    ofType(TasksActions.reorderTasks),
    switchMap(({ orderedIds })=> this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        this.ensureInit();
        const db = getFirestore();
        const batch = writeBatch(db);
        orderedIds.forEach((id, idx)=> batch.update(doc(db,'tasks', id), { position: idx, updatedAt: serverTimestamp() }));
        return from(batch.commit());
      })
    ))
  ), { dispatch:false });
}