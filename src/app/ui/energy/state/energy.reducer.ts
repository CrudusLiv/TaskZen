import { createReducer, on } from '@ngrx/store';
import { EnergyActions, EnergyLog, energyFeatureKey } from './energy.actions';

export interface EnergyState {
  logs: EnergyLog[]; // newest first
}

const initial: EnergyState = { logs: [] };

function sample(): EnergyState {
  const now = Date.now();
  const logs: EnergyLog[] = [
    {
      id: 'e3',
      level: 4,
      moods: ['focused'],
      createdAt: new Date(now - 3600_000).toISOString(),
      note: 'flowing',
    },
    { id: 'e2', level: 2, moods: ['groggy'], createdAt: new Date(now - 7200_000).toISOString() },
    {
      id: 'e1',
      level: 5,
      moods: ['energized'],
      createdAt: new Date(now - 10800_000).toISOString(),
    },
  ];
  return { logs };
}

export const energyReducer = createReducer(
  initial,
  on(EnergyActions.loadSample, () => sample()),
  on(EnergyActions.addLog, (s, { level, moods, note }) => {
    const log: EnergyLog = {
      id: 'e' + Date.now(),
      level,
      moods,
      note,
      createdAt: new Date().toISOString(),
    };
    return { logs: [log, ...s.logs].slice(0, 200) };
  }),
  on(EnergyActions.deleteLog, (s, { id }) => ({ logs: s.logs.filter((l) => l.id !== id) }))
);

export { energyFeatureKey };
