// TaskZen Data Schema v2 (local + future Firestore)
// Versioned to allow migrations

export const DATA_SCHEMA_VERSION = 2;

// Core Identifiers: All Firestore docs will use these ID patterns when remote is enabled.
// Local-only (ephemeral) entities can use 'local-' prefix.

// -------------------- ITEMS --------------------
export interface ItemEntityV2 {
  id: string; // 'item_<timestamp>' or firestore doc id
  title: string;
  description?: string;
  status: 'inbox' | 'next' | 'progress' | 'done';
  estimateMinutes?: number; // planned effort
  actualMinutes?: number; // accumulated from focus sessions
  energyFit?: 1 | 2 | 3 | 4 | 5; // recommended energy band
  effort?: 1 | 2 | 3 | 4 | 5; // subjective difficulty
  due?: string; // ISO date
  rewardNote?: string; // small reward or incentive
  focusBoost?: boolean; // candidate for focus starter
  routineId?: string; // link to routine template if spawned from routine
  microSteps?: string[]; // optional step breakdown
  tags?: string[]; // free-form hashtags parsed at capture (#call, #email)
  createdAt: string; // ISO
  updatedAt: string; // ISO
  completedAt?: string; // when status became done
  archived?: boolean;
  v: number; // schema version (2)
}

// -------------------- FOCUS SESSIONS --------------------
export interface FocusSessionV2 {
  id: string; // 'focus_<timestamp>'
  itemId?: string; // optional if free-focus
  plannedMinutes: number; // user selected length
  actualMinutes: number; // derived at stop
  startedAt: string; // ISO start
  stoppedAt?: string; // ISO end
  breakMinutes?: number; // total break time inside session
  aborted?: boolean; // ended early without completion
  calmModeEnabled: boolean; // snapshot of preference
  interruptions?: FocusInterruptionEvent[]; // recorded distraction events
  v: number;
}

export interface FocusInterruptionEvent {
  at: string; // ISO
  type: 'contextSwitch' | 'notification' | 'restlessness' | 'external';
  note?: string;
}

// -------------------- ENERGY LOGS --------------------
export interface EnergyLogV2 {
  id: string; // 'energy_<timestamp>'
  value: 1 | 2 | 3 | 4 | 5; // current perceived energy
  tags?: string[]; // e.g. ['sleepLow','caffeine']
  note?: string;
  createdAt: string;
  v: number;
}

// -------------------- ROUTINES --------------------
export interface RoutineTemplateV2 {
  id: string; // 'routine_<timestamp>'
  title: string;
  cue?: RoutineCue; // when / after what
  targetEnergy?: 1 | 2 | 3 | 4 | 5;
  steps: RoutineStepV2[];
  estimatedMinutes?: number; // sum of step estimates
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  v: number;
}

export interface RoutineCue {
  type: 'timeOfDay' | 'afterEvent' | 'energyWindow';
  value: string; // '07:30', 'lunch', 'lowEnergy'
}

export interface RoutineStepV2 {
  id: string; // stable id for reordering
  label: string;
  estimateMinutes?: number;
  optional?: boolean;
}

export interface RoutineRunV2 {
  id: string; // 'rRun_<timestamp>'
  routineId: string;
  startedAt: string;
  finishedAt?: string;
  aborted?: boolean;
  stepProgress: RoutineRunStepProgress[];
  v: number;
}

export interface RoutineRunStepProgress {
  stepId: string;
  startedAt?: string;
  completedAt?: string;
  skipped?: boolean;
}

// -------------------- COACH PROMPTS --------------------
export interface CoachPromptV2 {
  id: string; // 'coach_<timestamp>'
  trigger: CoachTriggerV2;
  message: string;
  createdAt: string;
  dismissed?: boolean;
  acted?: boolean; // user did suggested action
  v: number;
}

export type CoachTriggerV2 =
  | { type: 'focusAborted'; count: number }
  | { type: 'lowEnergyStreak'; length: number }
  | { type: 'inboxOverflow'; items: number }
  | { type: 'routineMiss'; routineId: string }
  | { type: 'noFocusToday'; since: string };

// -------------------- INSIGHTS CACHE --------------------
export interface InsightsCacheV2 {
  id: string; // constant 'insights_daily_<date>' etc.
  span: 'daily' | 'weekly';
  dateKey: string; // '2025-09-18'
  metrics: InsightMetricsV2;
  generatedAt: string;
  v: number;
}

export interface InsightMetricsV2 {
  itemsCompleted: number;
  avgFocusMinutes: number;
  totalFocusMinutes: number;
  energyDistribution: Record<string, number>; // energy value -> count
  routineRuns: number;
  routineAdherencePct?: number;
  abortedSessions: number;
}

// -------------------- UNION AGGREGATE --------------------
export interface RootDataSnapshotV2 {
  version: number;
  items: ItemEntityV2[];
  focusSessions: FocusSessionV2[];
  energyLogs: EnergyLogV2[];
  routines: RoutineTemplateV2[];
  routineRuns: RoutineRunV2[];
  coachPrompts: CoachPromptV2[];
  insights: InsightsCacheV2[];
  exportedAt: string;
}

// -------------------- MIGRATION NOTES --------------------
// v1 -> v2 changes:
// - Added versioned entities (v field) for forward migrations.
// - Item: added tags, routine linkage, microSteps, completedAt, archived, energyFit rename (from energyLevel), explicit v.
// - Introduced focusSessions, energyLogs, routines, coachPrompts, insights structures.
// - Provide RootDataSnapshotV2 for export/import & offline sync batching.

// Placeholder utilities (can be expanded when persistence layer added)
export function createItemDraft(title: string): ItemEntityV2 {
  const now = new Date().toISOString();
  return {
    id: 'item_' + Date.now(),
    title,
    status: 'inbox',
    createdAt: now,
    updatedAt: now,
    v: 2,
  };
}
