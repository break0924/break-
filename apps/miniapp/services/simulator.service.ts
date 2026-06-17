import { request } from './api';

export function createSimulationPlan(data: unknown) {
  return request('/simulation/plans', {
    method: 'POST',
    data
  });
}
