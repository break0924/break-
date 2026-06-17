import {
  FactorContribution,
  FactorInput,
  PredictionFactor,
  PredictionFactorKey,
  ProbabilityTriplet,
} from '../prediction-engine.types';
import {
  BASE_PROBABILITY,
  unavailableProbability,
  weightedEvidence,
} from '../prediction-engine.utils';

export abstract class BasePredictionFactor implements PredictionFactor {
  abstract readonly key: PredictionFactorKey;
  abstract readonly label: string;
  abstract readonly defaultWeight: number;

  abstract evaluate(input: FactorInput): FactorContribution;

  protected available(
    input: FactorInput,
    probability: ProbabilityTriplet,
    reason: string,
  ): FactorContribution {
    return {
      key: this.key,
      label: this.label,
      weight: input.weight,
      available: true,
      probability,
      weightedEvidence: weightedEvidence(probability, input.weight),
      reason,
    };
  }

  protected unavailable(input: FactorInput, reason: string): FactorContribution {
    return {
      key: this.key,
      label: this.label,
      weight: input.weight,
      available: false,
      probability: unavailableProbability(),
      weightedEvidence: weightedEvidence(BASE_PROBABILITY, 0),
      reason,
    };
  }
}
