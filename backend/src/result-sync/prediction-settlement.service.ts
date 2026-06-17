import { Injectable } from '@nestjs/common';
import { PredictionsService } from '../predictions/predictions.service';

@Injectable()
export class PredictionSettlementService {
  constructor(private readonly predictionsService: PredictionsService) {}

  settleMatch(matchId: string, force = false) {
    return this.predictionsService.settleMatch(matchId, undefined, force);
  }
}
