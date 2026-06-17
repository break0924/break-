import { Injectable } from '@nestjs/common';
import { EloMatchInput, EloMatchResult } from './elo.types';

@Injectable()
export class EloCalculator {
  calculate(input: EloMatchInput): EloMatchResult {
    const kFactor = input.kFactor ?? this.resolveKFactor(input);
    const homeExpected = this.expectedScore(input.homeRating, input.awayRating);
    const awayExpected = this.expectedScore(input.awayRating, input.homeRating);
    const homeResult = this.actualResult(input.homeScore, input.awayScore);
    const awayResult = 1 - homeResult;
    const homeNewRating = this.updateRating(
      input.homeRating,
      homeResult,
      homeExpected,
      kFactor,
    );
    const awayNewRating = this.updateRating(
      input.awayRating,
      awayResult,
      awayExpected,
      kFactor,
    );

    return {
      matchId: input.matchId,
      home: {
        teamId: input.homeTeamId,
        opponentTeamId: input.awayTeamId,
        isHome: true,
        scoreFor: input.homeScore,
        scoreAgainst: input.awayScore,
        result: homeResult,
        oldRating: input.homeRating,
        newRating: homeNewRating,
        ratingDelta: homeNewRating - input.homeRating,
        kFactor,
        expectedScore: Number(homeExpected.toFixed(4)),
      },
      away: {
        teamId: input.awayTeamId,
        opponentTeamId: input.homeTeamId,
        isHome: false,
        scoreFor: input.awayScore,
        scoreAgainst: input.homeScore,
        result: awayResult,
        oldRating: input.awayRating,
        newRating: awayNewRating,
        ratingDelta: awayNewRating - input.awayRating,
        kFactor,
        expectedScore: Number(awayExpected.toFixed(4)),
      },
    };
  }

  expectedScore(teamRating: number, opponentRating: number) {
    return 1 / (1 + Math.pow(10, (opponentRating - teamRating) / 400));
  }

  actualResult(scoreFor: number, scoreAgainst: number) {
    if (scoreFor > scoreAgainst) {
      return 1;
    }

    if (scoreFor < scoreAgainst) {
      return 0;
    }

    return 0.5;
  }

  private updateRating(
    rating: number,
    actualScore: number,
    expectedScore: number,
    kFactor: number,
  ) {
    return Math.round(rating + kFactor * (actualScore - expectedScore));
  }

  private resolveKFactor(input: EloMatchInput) {
    const goalDiff = Math.abs(input.homeScore - input.awayScore);
    if (goalDiff >= 3) {
      return 40;
    }

    if (goalDiff === 2) {
      return 36;
    }

    return 32;
  }
}
