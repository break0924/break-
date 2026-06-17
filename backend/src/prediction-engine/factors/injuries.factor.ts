import { FactorInput } from '../prediction-engine.types';
import { edgeFromScores, evidenceFromEdge } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class InjuriesFactor extends BasePredictionFactor {
  readonly key = 'injuries' as const;
  readonly label = '伤停影响';
  readonly defaultWeight = 0.85;

  evaluate(input: FactorInput) {
    const home = input.homeTeam.injuryImpact;
    const away = input.awayTeam.injuryImpact;

    if (home === undefined && away === undefined) {
      return this.unavailable(input, '缺少伤停影响评分，跳过该因子。');
    }

    const homeImpact = home ?? 0;
    const awayImpact = away ?? 0;
    const edge = edgeFromScores((awayImpact - homeImpact) / 100, 0);

    return this.available(
      input,
      evidenceFromEdge(edge),
      `伤停影响：主队 ${homeImpact}，客队 ${awayImpact}；数值越高代表受损越大。`,
    );
  }
}
