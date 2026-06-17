import { ProbabilityTriplet } from './prediction-engine.types';

export const BASE_PROBABILITY: ProbabilityTriplet = {
  homeWin: 34,
  draw: 32,
  awayWin: 34,
};

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function evidenceFromEdge(
  edge: number,
  options: {
    draw?: number;
    scale?: number;
    floor?: number;
  } = {},
): ProbabilityTriplet {
  const scale = options.scale ?? 18;
  const draw = clamp(options.draw ?? 30 - Math.abs(edge) * 5, 18, 38);
  const decisive = 100 - draw;
  const homeShare = clamp(0.5 + edge / 2, 0.08, 0.92);
  const homeWin = decisive * homeShare;

  return normalizeTriplet({
    homeWin: homeWin + scale * 0,
    draw,
    awayWin: decisive - homeWin,
  }, options.floor ?? 2);
}

export function normalizeTriplet(
  input: ProbabilityTriplet,
  floor = 0,
): ProbabilityTriplet {
  const values = [
    clamp(input.homeWin, floor, 100),
    clamp(input.draw, floor, 100),
    clamp(input.awayWin, floor, 100),
  ];
  const sum = values.reduce((total, value) => total + value, 0);

  if (sum <= 0) {
    return { ...BASE_PROBABILITY };
  }

  return {
    homeWin: (values[0] / sum) * 100,
    draw: (values[1] / sum) * 100,
    awayWin: (values[2] / sum) * 100,
  };
}

export function exactHundred(input: ProbabilityTriplet): ProbabilityTriplet {
  const raw = [input.homeWin, input.draw, input.awayWin];
  const floors = raw.map(Math.floor);
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (const item of order) {
    if (remaining <= 0) {
      break;
    }
    floors[item.index] += 1;
    remaining -= 1;
  }

  return {
    homeWin: floors[0],
    draw: floors[1],
    awayWin: floors[2],
  };
}

export function weightedEvidence(
  probability: ProbabilityTriplet,
  weight: number,
): ProbabilityTriplet {
  return {
    homeWin: probability.homeWin * weight,
    draw: probability.draw * weight,
    awayWin: probability.awayWin * weight,
  };
}

export function unavailableProbability(): ProbabilityTriplet {
  return { ...BASE_PROBABILITY };
}

export function formScore(metrics?: {
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  formScore?: number;
}) {
  if (!metrics) {
    return null;
  }

  if (metrics.formScore !== undefined) {
    return clamp(metrics.formScore, 0, 100);
  }

  const matches =
    (metrics.wins ?? 0) + (metrics.draws ?? 0) + (metrics.losses ?? 0);
  if (matches <= 0) {
    return null;
  }

  const pointsPerMatch =
    ((metrics.wins ?? 0) * 3 + (metrics.draws ?? 0)) / (matches * 3);
  const goalBalancePerMatch =
    ((metrics.goalsFor ?? 0) - (metrics.goalsAgainst ?? 0)) /
    Math.max(matches, 1);

  return clamp(
    (pointsPerMatch * 0.75 + goalBalancePerMatch * 0.08 + 0.12) * 100,
    0,
    100,
  );
}

export function edgeFromScores(homeScore: number, awayScore: number) {
  return clamp(homeScore - awayScore, -1, 1);
}
