import { Injectable, inject } from '@angular/core';
import { FirebaseService } from '../../firebase.service';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { PlannerProfile } from '../state/planner.models';

@Injectable({ providedIn: 'root' })
export class PlannerApiService {
  private fb = inject(FirebaseService);
  baseUrl: string | null = null;

  async sendCardsForScoring(cards: any[], profile: PlannerProfile){
    if(!this.baseUrl){ return null; }
    try {
      const res = await fetch(this.baseUrl + '/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cards, profile }) });
      if(!res.ok) throw new Error('Bad response');
      return await res.json();
    } catch(err){ console.warn('[PlannerApi] scoring fallback -> heuristic', err); return null; }
  }

  async recordFeedback(cardId: string, verdict: 'accept'|'reject'){
    if(!this.baseUrl) return;
    try { await fetch(this.baseUrl + '/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cardId, verdict, ts: Date.now() }) }); } catch(err){ console.warn('[PlannerApi] feedback ignored', err); }
  }

  async loadProfileFromFirestore(userId: string){
    try {
      const db = getFirestore();
      const ref = doc(db, 'plannerProfiles', userId);
      const snap = await getDoc(ref);
      if(snap.exists()){ return snap.data(); }
    } catch(err){ console.warn('[PlannerApi] load profile failed', err); }
    return null;
  }

  async saveProfileToFirestore(userId: string, profile: any){
    try {
      const db = getFirestore();
      const ref = doc(db, 'plannerProfiles', userId);
      await setDoc(ref, profile, { merge: true });
    } catch(err){ console.warn('[PlannerApi] save profile failed', err); }
  }
}
