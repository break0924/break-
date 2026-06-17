import { FactorInput } from '../prediction-engine.types';
import {
  clamp,
  edgeFromScores,
  evidenceFromEdge,
} from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class HeadToHeadFactor extends BasePredictionFactor {
  readonly key = 'headToHead' as const;
  readonly label = '历史交锋';
  readonly defaultWeight = 0.65;

  evaluate(input: FactorInput) {
    const h2h = input.headToHead;
    const matches =
      h2h?.matches ??
      h2h?.matchesPlayed ??
      (h2h?.homeWins ?? 0) + (h2h?.draws ?? 0) + (h2h?.awayWins ?? 0);

    if (!h2h || matches <= 0) {
      return this.unavailable(input, '缺少历史交锋样本，跳过该因子。');
    }

    const homeRate =
      h2h.homeWinRate !== undefined
        ? h2h.homeWinRate / 100
        : ((h2h.homeWins ?? 0) + (h2h.draws ?? 0) * 0.35) / matches;
    const awayRate =
      h2h.awayWinRate !== undefined
        ? h2h.awayWinRate / 100
        : ((h2h.awayWins ?? 0) + (h2h.draws ?? 0) * 0.35) / matches;
    const draw =
      h2h.drawRate !== undefined
        ? clamp(h2h.drawRate, 18, 42)
        : Math.min(38, Math.max(22, ((h2h.draws ?? 0) / matches) * 100));
    const scoreEdge =
      h2h.h2hScore !== undefined
        ? clamp((h2h.h2hScore - 50) / 50, -1, 1)
        : edgeFromScores(homeRate, awayRate);

    return this.available(
      input,
      evidenceFromEdge(scoreEdge, { draw }),
      `历史交锋 ${matches} 场：主胜 ${h2h.homeWins ?? 0}，平 ${h2h.draws ?? 0}，客胜 ${h2h.awayWins ?? 0}，h2hScore ${h2h.h2hScore ?? 'N/A'}。`,
    );
  }
}
