import { Injectable } from '@nestjs/common';
import {
  HeadToHeadMatchResult,
  HeadToHeadMetrics,
} from './head-to-head-engine.types';

@Injectable()
export class HeadToHeadEngineCalculator {
  calculate(input: {
    homeTeamId: string;
    awayTeamId: string;
    matches: HeadToHeadMatchResult[];
    sampleSize?: number;
  }): HeadToHeadMetrics {
    const sampleSize = input.sampleSize ?? 10;
    const sample = [...input.matches]
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, sampleSize);

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;

    for (const match of sample) {
      const normalized = this.normalizeScore(input.homeTeamId, input.awayTeamId, match);
      if (!normalized) {
        continue;
      }

      if (normalized.homeScore > normalized.awayScore) {
        homeWins += 1;
      } else if (normalized.homeScore < normalized.awayScore) {
        awayWins += 1;
      } else {
        draws += 1;
      }
    }

    const matchesPlayed = homeWins + draws + awayWins;
    if (matchesPlayed === 0) {
      return {
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        sampleSize,
        matchesPlayed: 0,
        homeWins: 0,
        draws: 0,
        awayWins: 0,
        homeWinRate: 0,
        drawRate: 0,
        awayWinRate: 0,
        h2hScore: 50,
      };
    }

    const homeWinRate = homeWins / matchesPlayed;
    const drawRate = draws / matchesPlayed;
    const awayWinRate = awayWins / matchesPlayed;

    return {
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      sampleSize,
      matchesPlayed,
      homeWins,
      draws,
      awayWins,
      homeWinRate: this.percent(homeWinRate),
      drawRate: this.percent(drawRate),
      awayWinRate: this.percent(awayWinRate),
      h2hScore: this.score(homeWinRate, drawRate, awayWinRate),
    };
  }

  private normalizeScore(
    homeTeamId: string,
    awayTeamId: string,
    match: HeadToHeadMatchResult,
  ) {
    if (match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId) {
      return {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      };
    }

    if (match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId) {
      return {
        homeScore: match.awayScore,
        awayScore: match.homeScore,
      };
    }

    return null;
  }

  private score(homeWinRate: number, drawRate: number, awayWinRate: number) {
    const raw = 50 + (homeWinRate - awayWinRate) * 42 + drawRate * 4;
    return Math.round(Math.min(100, Math.max(0, raw)));
  }

  private percent(value: number) {
    return Number((value * 100).toFixed(2));
  }
}
