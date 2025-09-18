import { createFeatureSelector, createSelector } from '@ngrx/store';
import { energyFeatureKey } from './energy.actions';
import { EnergyState } from './energy.reducer';

export const selectEnergyFeature = createFeatureSelector<EnergyState>(energyFeatureKey);
export const selectEnergyLogs = createSelector(selectEnergyFeature, (s) => s.logs);
export const selectLatestEnergy = createSelector(selectEnergyLogs, (logs) => logs[0] || null);
export const selectAverageEnergy = createSelector(selectEnergyLogs, (logs) => {
  if (!logs.length) return null;
  return +(logs.reduce((a, l) => a + l.level, 0) / logs.length).toFixed(2);
});
