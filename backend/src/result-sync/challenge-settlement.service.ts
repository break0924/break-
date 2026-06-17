import { Injectable } from '@nestjs/common';
import { ChallengeService } from '../challenge/challenge.service';

@Injectable()
export class ChallengeSettlementService {
  constructor(private readonly challengeService: ChallengeService) {}

  settleMatch(matchId: string, force = false) {
    return this.challengeService.settleMatchPoints(matchId, force);
  }
}
