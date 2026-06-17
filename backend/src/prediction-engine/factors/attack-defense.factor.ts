import { FactorInput } from '../prediction-engine.types';
import { edgeFromScores, evidenceFromEdge } from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class AttackFactor extends BasePredictionFactor {
  readonly key = 'attack' as const;
  readonly label = '进球能力';
  readonly defaultWeight = 0.95;

  evaluate(input: FactorInput) {
    const home = input.homeTeam.attackIndex;
    const away = input.awayTeam.attackIndex;

    if (home === undefined || away === undefined) {
      return this.unavailable(input, '缺少进攻指数，跳过该因子。');
    }

    const edge = edgeFromScores((home - away) / 100, 0);
    return this.available(
      input,
      evidenceFromEdge(edge, { draw: 27 }),
      `进攻指数：主队 ${home}，客队 ${away}。`,
    );
  }
}

export class DefenseFactor extends BasePredictionFactor {
  readonly key = 'defense' as const;
  readonly label = '失球能力';
  readonly defaultWeight = 0.95;

  evaluate(input: FactorInput) {
    const home = input.homeTeam.defenseIndex;
    const away = input.awayTeam.defenseIndex;

    if (home === undefined || away === undefined) {
      return this.unavailable(input, '缺少防守指数，跳过该因子。');
    }

    const edge = edgeFromScores((home - away) / 100, 0);
    return this.available(
      input,
      evidenceFromEdge(edge, { draw: 31 }),
      `防守指数：主队 ${home}，客队 ${away}；数值越高代表防守越稳。`,
    );
  }
}

export class GoalsFactor extends BasePredictionFactor {
  readonly key = 'goals' as const;
  readonly label = 'Goals';
  readonly defaultWeight = 20;

  evaluate(input: FactorInput) {
    const homeAttack = input.homeTeam.attackIndex;
    const awayAttack = input.awayTeam.attackIndex;
    const homeDefense = input.homeTeam.defenseIndex;
    const awayDefense = input.awayTeam.defenseIndex;

    if (
      homeAttack === undefined ||
      awayAttack === undefined ||
      homeDefense === undefined ||
      awayDefense === undefined
    ) {
      return this.unavailable(input, '缺少进攻或防守指数，跳过 Goals 因子。');
    }

    const homeGoalEdge = (homeAttack - awayDefense) / 100;
    const awayGoalEdge = (awayAttack - homeDefense) / 100;
    const edge = edgeFromScores(homeGoalEdge, awayGoalEdge);
    const draw = Math.max(22, Math.min(34, 30 - Math.abs(edge) * 4));

    return this.available(
      input,
      evidenceFromEdge(edge, { draw }),
      `Goals 因子：主队进攻${homeAttack}/防守${homeDefense}，客队进攻${awayAttack}/防守${awayDefense}。`,
    );
  }
}
