import { FactorInput } from '../prediction-engine.types';
import { edgeFromScores, evidenceFromEdge } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class WorldRankingFactor extends BasePredictionFactor {
  readonly key = 'worldRanking' as const;
  readonly label = '世界排名';
  readonly defaultWeight = 0.8;

  evaluate(input: FactorInput) {
    const home = input.homeTeam.worldRanking;
    const away = input.awayTeam.worldRanking;

    if (!home || !away) {
      return this.unavailable(input, '缺少双方世界排名，跳过该因子。');
    }

    const edge = edgeFromScores((away - home) / 80, 0);
    return this.available(
      input,
      evidenceFromEdge(edge),
      `世界排名：主队 ${home}，客队 ${away}，排名数字越小代表基础实力越强。`,
    );
  }
}
