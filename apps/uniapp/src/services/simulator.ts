import { request } from './api';
import type { PrizeSelectionInput } from './calculator';

export function createSimulationPlan(data: {
  name?: string;
  stake: string;
  multiple: number;
  mode: 'SINGLE' | 'PARLAY';
  riskNoticeAccepted: boolean;
  selections: Array<PrizeSelectionInput & { matchId: string }>;
}) {
  return request<{
    id: string;
    estimatedPrizeMin: string;
    estimatedPrizeMax: string;
    riskNotice: string;
  }>('/simulation/plans', {
    method: 'POST',
    data
  });
}
