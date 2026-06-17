import { FactorInput } from '../prediction-engine.types';
import { normalizeTriplet } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class OddsFactor extends BasePredictionFactor {
  readonly key = 'odds' as const;
  readonly label = '最新赔率校准';
  readonly defaultWeight = 18;

  evaluate(input: FactorInput) {
    const odds = input.oddsSnapshot;
    const probability = odds?.normalizedProbability;

    if (!odds || !probability) {
      return this.unavailable(input, '缺少最新赔率快照，跳过赔率校准因子。');
    }

    const movement = odds.movement;
    const movementText = movement
      ? `赔率变化：主胜 ${this.formatDelta(movement.homeWinDelta)}，平局 ${this.formatDelta(
          movement.drawDelta,
        )}，客胜 ${this.formatDelta(movement.awayWinDelta)}。`
      : '暂无开盘到当前的变化幅度。';

    return this.available(
      input,
      normalizeTriplet({
        homeWin: probability.homeWin,
        draw: probability.draw,
        awayWin: probability.awayWin,
      }),
      `赔率校准：去水后隐含概率为主胜 ${probability.homeWin}%、平局 ${probability.draw}%、客胜 ${probability.awayWin}%。${movementText}`,
    );
  }

  private formatDelta(value?: number) {
    if (value === undefined || value === null || !Number.isFinite(Number(value))) {
      return '--';
    }

    return Number(value).toFixed(3);
  }
}
