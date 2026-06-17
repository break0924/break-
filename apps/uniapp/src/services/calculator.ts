import { request } from './api';

export type PrizeSelectionInput = {
  matchId?: string;
  market: string;
  selection: string;
  odds: string;
};

export function calculatePrize(data: {
  stake: string;
  multiple: number;
  mode: 'SINGLE' | 'PARLAY';
  selections: PrizeSelectionInput[];
}) {
  return request<{
    estimatedPrizeMin: string;
    estimatedPrizeMax: string;
    riskNotice: string;
  }>('/calculator/prize', {
    method: 'POST',
    data
  });
}
