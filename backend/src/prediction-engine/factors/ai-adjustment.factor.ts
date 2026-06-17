import { FactorInput } from '../prediction-engine.types';
import { normalizeTriplet } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class AiAdjustmentFactor extends BasePredictionFactor {
  readonly key = 'aiAdjustment' as const;
  readonly label = 'AI分析修正因子';
  readonly defaultWeight = 0.7;

  evaluate(input: FactorInput) {
    const adjustment = input.aiAdjustment;
    if (!adjustment) {
      return this.unavailable(input, '没有 AI 修正输入，跳过该因子。');
    }

    const confidenceScale = Math.min(
      1,
      Math.max(0.25, (adjustment.confidence ?? 60) / 100),
    );
    const probability = normalizeTriplet({
      homeWin: 34 + (adjustment.homeWinDelta ?? 0) * confidenceScale,
      draw: 32 + (adjustment.drawDelta ?? 0) * confidenceScale,
      awayWin: 34 + (adjustment.awayWinDelta ?? 0) * confidenceScale,
    }, 2);

    return this.available(
      input,
      probability,
      adjustment.reason || 'AI 对阵容、战术和新闻面进行轻量修正。',
    );
  }
}
