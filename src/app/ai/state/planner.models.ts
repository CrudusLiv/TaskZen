export interface PlannerProfile { weightUrgency: number; weightPriority: number; weightAge: number; }
export interface AiSuggestion { id: string; cardId: string; proposedDate: string; score: number; reason: string; }
export interface AiState { suggestions: { [id: string]: AiSuggestion }; generating: boolean; profile: PlannerProfile; dailyFocusIds: string[]; }
export const aiFeatureKey = 'ai';
export const initialAiState: AiState = { suggestions: {}, generating: false, profile: { weightUrgency: 1, weightPriority: 1, weightAge: 1 }, dailyFocusIds: [] };
