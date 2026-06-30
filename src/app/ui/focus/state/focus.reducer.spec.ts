import { focusReducer, FocusSessionState } from './focus.reducer';
import { FocusActions, FocusSessionStateEntity } from './focus.actions';

const initial: FocusSessionState = { history: [], dayStreak: 0 };

function makeSession(overrides: Partial<FocusSessionStateEntity> = {}): FocusSessionStateEntity {
  return {
    id: 'f1',
    plannedMinutes: 25,
    startedAt: new Date().toISOString(),
    tickSeconds: 0,
    status: 'running',
    calmSnapshot: false,
    breakSegments: [],
    ...overrides,
  };
}

describe('focusReducer', () => {
  // ── startSession ────────────────────────────────────────────────────────────
  it('startSession creates a current session', () => {
    const s1 = focusReducer(initial, FocusActions.startSession({ plannedMinutes: 25, calmSnapshot: false }));
    expect(s1.current).toBeDefined();
    expect(s1.current?.plannedMinutes).toBe(25);
    expect(s1.current?.status).toBe('running');
    expect(s1.current?.tickSeconds).toBe(0);
  });

  it('startSession with itemId records itemId', () => {
    const s1 = focusReducer(initial, FocusActions.startSession({ itemId: 'item123', plannedMinutes: 10, calmSnapshot: true }));
    expect(s1.current?.itemId).toBe('item123');
    expect(s1.current?.calmSnapshot).toBe(true);
  });

  // ── tick ────────────────────────────────────────────────────────────────────
  it('tick increments tickSeconds when running', () => {
    const s0 = { ...initial, current: makeSession({ tickSeconds: 5 }) };
    const s1 = focusReducer(s0, FocusActions.tick());
    expect(s1.current?.tickSeconds).toBe(6);
  });

  it('tick does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.tick());
    expect(s1).toBe(initial);
  });

  it('tick does nothing when status is paused', () => {
    const s0 = { ...initial, current: makeSession({ status: 'paused' }) };
    const s1 = focusReducer(s0, FocusActions.tick());
    expect(s1).toBe(s0);
  });

  // ── pause ───────────────────────────────────────────────────────────────────
  it('pause changes status to paused from running', () => {
    const s0 = { ...initial, current: makeSession({ status: 'running' }) };
    const s1 = focusReducer(s0, FocusActions.pause());
    expect(s1.current?.status).toBe('paused');
  });

  it('pause while on break ends break segment and pauses', () => {
    const startBreakAt = new Date().toISOString();
    const s0 = {
      ...initial,
      current: makeSession({ status: 'break', breakSegments: [{ start: startBreakAt }] }),
    };
    const s1 = focusReducer(s0, FocusActions.pause());
    expect(s1.current?.status).toBe('paused');
    expect(s1.current?.breakSegments?.[0].end).toBeTruthy();
  });

  it('pause does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.pause());
    expect(s1).toBe(initial);
  });

  it('pause does nothing when already paused', () => {
    const s0 = { ...initial, current: makeSession({ status: 'paused' }) };
    const s1 = focusReducer(s0, FocusActions.pause());
    expect(s1).toBe(s0);
  });

  // ── resume ──────────────────────────────────────────────────────────────────
  it('resume changes status to running from paused', () => {
    const s0 = { ...initial, current: makeSession({ status: 'paused' }) };
    const s1 = focusReducer(s0, FocusActions.resume());
    expect(s1.current?.status).toBe('running');
  });

  it('resume does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.resume());
    expect(s1).toBe(initial);
  });

  it('resume does nothing when status is running', () => {
    const s0 = { ...initial, current: makeSession({ status: 'running' }) };
    const s1 = focusReducer(s0, FocusActions.resume());
    expect(s1).toBe(s0);
  });

  // ── startBreak ──────────────────────────────────────────────────────────────
  it('startBreak changes status to break and adds segment', () => {
    const s0 = { ...initial, current: makeSession({ status: 'running', breakSegments: [] }) };
    const s1 = focusReducer(s0, FocusActions.startBreak());
    expect(s1.current?.status).toBe('break');
    expect(s1.current?.breakSegments?.length).toBe(1);
    expect(s1.current?.breakSegments?.[0].start).toBeTruthy();
    expect(s1.current?.breakSegments?.[0].end).toBeUndefined();
  });

  it('startBreak does nothing when not running', () => {
    const s0 = { ...initial, current: makeSession({ status: 'paused' }) };
    const s1 = focusReducer(s0, FocusActions.startBreak());
    expect(s1).toBe(s0);
  });

  it('startBreak does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.startBreak());
    expect(s1).toBe(initial);
  });

  // ── endBreak ────────────────────────────────────────────────────────────────
  it('endBreak sets break end time and resumes running', () => {
    const s0 = {
      ...initial,
      current: makeSession({ status: 'break', breakSegments: [{ start: new Date().toISOString() }] }),
    };
    const s1 = focusReducer(s0, FocusActions.endBreak());
    expect(s1.current?.status).toBe('running');
    expect(s1.current?.breakSegments?.[0].end).toBeTruthy();
  });

  it('endBreak does not overwrite already-ended break segment', () => {
    const endTime = new Date().toISOString();
    const s0 = {
      ...initial,
      current: makeSession({ status: 'break', breakSegments: [{ start: new Date().toISOString(), end: endTime }] }),
    };
    const s1 = focusReducer(s0, FocusActions.endBreak());
    // end is already set; it should not be changed
    expect(s1.current?.breakSegments?.[0].end).toBe(endTime);
  });

  it('endBreak does nothing when not on break', () => {
    const s0 = { ...initial, current: makeSession({ status: 'running' }) };
    const s1 = focusReducer(s0, FocusActions.endBreak());
    expect(s1).toBe(s0);
  });

  it('endBreak does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.endBreak());
    expect(s1).toBe(initial);
  });

  // ── complete ────────────────────────────────────────────────────────────────
  it('complete archives session with completed=true', () => {
    const s0 = { ...initial, current: makeSession({ tickSeconds: 1500 }) };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.current).toBeUndefined();
    expect(s1.history.length).toBe(1);
    expect(s1.history[0].completed).toBe(true);
    expect(s1.history[0].actualMinutes).toBe(25); // 1500s = 25min
  });

  it('complete increments streak on new day', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const s0: FocusSessionState = {
      ...initial,
      current: makeSession({ tickSeconds: 60 }),
      dayStreak: 3,
      lastSessionDate: yesterday,
    };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.dayStreak).toBe(4);
  });

  it('complete resets streak when gap > 1 day', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const s0: FocusSessionState = {
      ...initial,
      current: makeSession({ tickSeconds: 60 }),
      dayStreak: 5,
      lastSessionDate: twoDaysAgo,
    };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.dayStreak).toBe(1);
  });

  it('complete same day does not change streak', () => {
    const today = new Date().toISOString().slice(0, 10);
    const s0: FocusSessionState = {
      ...initial,
      current: makeSession({ tickSeconds: 60 }),
      dayStreak: 2,
      lastSessionDate: today,
    };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.dayStreak).toBe(2);
  });

  it('complete first session ever sets streak to 1', () => {
    const s0 = { ...initial, current: makeSession({ tickSeconds: 60 }) };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.dayStreak).toBe(1);
    expect(s1.lastSessionDate).toBeTruthy();
  });

  it('complete does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.complete());
    expect(s1).toBe(initial);
  });

  // ── stop ────────────────────────────────────────────────────────────────────
  it('stop archives session without completed flag', () => {
    const s0 = { ...initial, current: makeSession() };
    const s1 = focusReducer(s0, FocusActions.stop());
    expect(s1.current).toBeUndefined();
    expect(s1.history.length).toBe(1);
    expect(s1.history[0].completed).toBeFalsy();
  });

  it('stop does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.stop());
    expect(s1).toBe(initial);
  });

  // ── abort ───────────────────────────────────────────────────────────────────
  it('abort archives session with aborted=true', () => {
    const s0 = { ...initial, current: makeSession() };
    const s1 = focusReducer(s0, FocusActions.abort());
    expect(s1.current).toBeUndefined();
    expect(s1.history[0].aborted).toBe(true);
  });

  it('abort does nothing when no current session', () => {
    const s1 = focusReducer(initial, FocusActions.abort());
    expect(s1).toBe(initial);
  });

  // ── hydrate ─────────────────────────────────────────────────────────────────
  it('hydrate restores saved state', () => {
    const session = makeSession();
    const s1 = focusReducer(initial, FocusActions.hydrate({
      current: session,
      history: [makeSession({ id: 'h1', status: 'stopped', completed: true })],
      dayStreak: 7,
      lastSessionDate: '2026-01-01',
    }));
    expect(s1.current?.id).toBe('f1');
    expect(s1.history.length).toBe(1);
    expect(s1.dayStreak).toBe(7);
    expect(s1.lastSessionDate).toBe('2026-01-01');
  });

  it('hydrate without optional fields keeps existing values', () => {
    const s0: FocusSessionState = { ...initial, dayStreak: 3, lastSessionDate: '2026-01-10' };
    const s1 = focusReducer(s0, FocusActions.hydrate({}));
    expect(s1.dayStreak).toBe(3);
    expect(s1.lastSessionDate).toBe('2026-01-10');
  });

  // ── history overflow ─────────────────────────────────────────────────────────
  it('history is capped at 300 entries', () => {
    // Pre-fill 300 history entries
    const history = Array.from({ length: 300 }, (_, i) =>
      makeSession({ id: `h${i}`, status: 'stopped', completed: true }),
    );
    const s0: FocusSessionState = { ...initial, current: makeSession(), history };
    const s1 = focusReducer(s0, FocusActions.complete());
    expect(s1.history.length).toBe(300);
  });
});
