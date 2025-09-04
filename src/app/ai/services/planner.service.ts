import { Injectable } from '@angular/core';
import { PlannerProfile } from '../state/planner.models';

interface CardLite { id: string; title: string; dueDate?: string; priority?: string; createdAt?: string; completed?: boolean; }

@Injectable({ providedIn: 'root' })
export class PlannerService {
  score(card: CardLite, profile: PlannerProfile): number {
    let score = 0;
    if(card.completed) return -1000;
    const now = Date.now();
    if(card.dueDate){
      const diffDays = (new Date(card.dueDate).getTime() - now) / 86400000;
      let urgency = 0;
      if(diffDays < 0) urgency = 200; else urgency = Math.max(0, 100 - diffDays * 10);
      score += urgency * profile.weightUrgency;
    }
    let pr = 0;
    if(card.priority === 'high') pr = 50; else if(card.priority === 'medium') pr = 25;
    score += pr * profile.weightPriority;
    if(card.createdAt){
      const ageDays = (now - new Date(card.createdAt).getTime()) / 86400000;
      const ageScore = Math.min(40, ageDays * 2);
      score += ageScore * profile.weightAge;
    }
    return score;
  }
  proposeDate(card: CardLite): string {
    if(card.dueDate) return card.dueDate;
    const d = new Date(); d.setDate(d.getDate()+1);
    return d.toISOString().substring(0,10);
  }
}
