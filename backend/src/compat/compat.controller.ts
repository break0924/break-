import { Controller, Get, Query } from '@nestjs/common';
import { ChallengeService } from '../challenge/challenge.service';

@Controller()
export class CompatController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('leaderboard')
  leaderboard(@Query('seasonId') seasonId?: string) {
    return this.challengeService.leaderboard(seasonId);
  }

  @Get('invite/status')
  inviteStatus() {
    return {
      inviteCode: null,
      invitedCount: 0,
      rewardUnlocked: false,
    };
  }

  @Get('status')
  status() {
    return {
      isLoggedIn: false,
      membershipStatus: 'NONE',
      membershipExpireAt: null,
      isMember: false,
      benefits: [],
      invite: this.inviteStatus(),
    };
  }
}
