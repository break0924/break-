import { FactorInput } from '../prediction-engine.types';
import { evidenceFromEdge } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class VenueFactor extends BasePredictionFactor {
  readonly key = 'venue' as const;
  readonly label = '主客场因素';
  readonly defaultWeight = 0.55;

  evaluate(input: FactorInput) {
    if (input.neutralVenue) {
      return this.available(
        input,
        evidenceFromEdge(0, { draw: 33 }),
        '中立场地，主客场因子按均衡处理。',
      );
    }

    return this.available(
      input,
      evidenceFromEdge(0.16, { draw: 30 }),
      '非中立场地，给予主队轻量场地优势。',
    );
  }
}
