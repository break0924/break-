import { FactorInput } from '../prediction-engine.types';
import { edgeFromScores, evidenceFromEdge } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class EloRatingFactor extends BasePredictionFactor {
  readonly key = 'elo' as const;
  readonly label = 'Elo Rating';
  readonly defaultWeight = 1.25;

  evaluate(input: FactorInput) {
    const home = input.homeTeam.eloRating;
    const away = input.awayTeam.eloRating;

    if (home === undefined || away === undefined) {
      return this.unavailable(input, '缺少双方 Elo Rating，跳过该因子。');
    }

    const edge = edgeFromScores((home - away) / 420, 0);
    return this.available(
      input,
      evidenceFromEdge(edge),
      `Elo 差值 ${Math.round(home - away)}，换算为强弱边际 ${edge.toFixed(2)}。`,
    );
  }
}
