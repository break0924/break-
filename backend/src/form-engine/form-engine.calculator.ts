import { Injectable } from '@nestjs/common';
import { FormMatchResult, FormMetrics } from './form-engine.types';

@Injectable()
export class FormEngineCalculator {
  calculate(matches: FormMatchResult[], sampleSize: 5 | 10): FormMetrics {
    const sample = [...matches]
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, sampleSize);
    const matchesPlayed = sample.length;

    if (matchesPlayed === 0) {
      return this.empty(sampleSize);
    }

    const wins = sample.filter((match) => match.goalsFor > match.goalsAgainst).length;
    const draws = sample.filter(
      (match) => match.goalsFor === match.goalsAgainst,
    ).length;
    const losses = matchesPlayed - wins - draws;
    const goalsFor = sample.reduce((sum, match) => sum + match.goalsFor, 0);
    const goalsAgainst = sample.reduce(
      (sum, match) => sum + match.goalsAgainst,
      0,
    );
    const goalDifference = goalsFor - goalsAgainst;
    const winRate = wins / matchesPlayed;
    const averageGoalsFor = goalsFor / matchesPlayed;
    const averageGoalsAgainst = goalsAgainst / matchesPlayed;
    const averageGoalDifference = goalDifference / matchesPlayed;

    return {
      sampleSize,
      matchesPlayed,
      wins,
      draws,
      losses,
      winRate: this.round(winRate * 100),
      averageGoalsFor: this.round(averageGoalsFor),
      averageGoalsAgainst: this.round(averageGoalsAgainst),
      goalDifference,
      averageGoalDifference: this.round(averageGoalDifference),
      formScore: this.score({
        winRate,
        averageGoalsFor,
        averageGoalsAgainst,
        averageGoalDifference,
        sampleRatio: matchesPlayed / sampleSize,
      }),
    };
  }

  private score(input: {
    winRate: number;
    averageGoalsFor: number;
    averageGoalsAgainst: number;
    averageGoalDifference: number;
    sampleRatio: number;
  }) {
    const winComponent = input.winRate * 55;
    const attackComponent = this.clamp(input.averageGoalsFor / 3, 0, 1) * 20;
    const defenseComponent =
      (1 - this.clamp(input.averageGoalsAgainst / 3, 0, 1)) * 15;
    const goalDiffComponent =
      ((this.clamp(input.averageGoalDifference, -2, 2) + 2) / 4) * 10;
    const confidencePenalty = 1 - (1 - input.sampleRatio) * 0.15;

    return Math.round(
      this.clamp(
        (winComponent + attackComponent + defenseComponent + goalDiffComponent) *
          confidencePenalty,
        0,
        100,
      ),
    );
  }

  private empty(sampleSize: 5 | 10): FormMetrics {
    return {
      sampleSize,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      averageGoalsFor: 0,
      averageGoalsAgainst: 0,
      goalDifference: 0,
      averageGoalDifference: 0,
      formScore: 50,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }

  private round(value: number) {
    return Number(value.toFixed(2));
  }
}
