import { Injectable, Logger } from '@nestjs/common';
import { MatchStatus, Prisma, TournamentStage } from '@prisma/client';
import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import {
  MatchMonitorEventType,
  MatchMonitorMessage,
  MatchMonitorPayload,
} from './match-monitor.types';

type MatchSnapshot = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
  };
}>;

@Injectable()
export class MatchMonitorService {
  private readonly logger = new Logger(MatchMonitorService.name);
  private server?: WebSocketServer;

  attach(httpServer: HttpServer) {
    if (this.server) {
      return;
    }

    this.server = new WebSocketServer({
      server: httpServer,
      path: '/api/match-monitor/ws',
    });

    this.server.on('connection', (socket) => {
      socket.send(
        JSON.stringify({
          type: 'match.monitor.connected',
          payload: { connectedAt: new Date().toISOString() },
        }),
      );
    });

    this.logger.log('Match monitor WebSocket mounted at /api/match-monitor/ws');
  }

  publishStatusChange(
    match: MatchSnapshot,
    previousStatus: MatchStatus | null | undefined,
  ) {
    if (!this.isTrackedTransition(previousStatus, match.status)) {
      return;
    }

    this.broadcast('match.status.changed', this.matchPayload(match, previousStatus));
  }

  publishSettlementUpdated(
    match: MatchSnapshot | {
      id: string;
      status: MatchStatus;
      stage?: TournamentStage;
      groupName?: string | null;
      kickoffAt?: Date;
      homeScore?: number | null;
      awayScore?: number | null;
      homeTeam?: MatchSnapshot['homeTeam'];
      awayTeam?: MatchSnapshot['awayTeam'];
    },
    settlement: MatchMonitorPayload['settlement'],
  ) {
    this.broadcast('match.settlement.updated', {
      ...this.matchPayload(match),
      settlement,
    });
  }

  publishResultCorrected(match: MatchSnapshot) {
    this.broadcast('match.result.corrected', this.matchPayload(match));
  }

  private broadcast(type: MatchMonitorEventType, payload: MatchMonitorPayload) {
    if (!this.server) {
      return;
    }

    const message: MatchMonitorMessage = { type, payload };
    const text = JSON.stringify(message);

    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  }

  private matchPayload(
    match: {
      id: string;
      status: MatchStatus;
      stage?: TournamentStage;
      groupName?: string | null;
      kickoffAt?: Date;
      homeScore?: number | null;
      awayScore?: number | null;
      homeTeam?: MatchSnapshot['homeTeam'];
      awayTeam?: MatchSnapshot['awayTeam'];
    },
    previousStatus?: MatchStatus | null,
  ): MatchMonitorPayload {
    return {
      matchId: match.id,
      previousStatus,
      status: match.status,
      stage: match.stage,
      groupName: match.groupName,
      kickoffAt: match.kickoffAt?.toISOString(),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeTeam: match.homeTeam
        ? {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            fifaCode: match.homeTeam.fifaCode,
            flagUrl: match.homeTeam.flagUrl,
          }
        : undefined,
      awayTeam: match.awayTeam
        ? {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            fifaCode: match.awayTeam.fifaCode,
            flagUrl: match.awayTeam.flagUrl,
          }
        : undefined,
      syncedAt: new Date().toISOString(),
    };
  }

  private isTrackedTransition(
    previousStatus: MatchStatus | null | undefined,
    nextStatus: MatchStatus,
  ) {
    return (
      (previousStatus === MatchStatus.SCHEDULED && nextStatus === MatchStatus.LIVE) ||
      (previousStatus === MatchStatus.LIVE && nextStatus === MatchStatus.FINISHED)
    );
  }
}
