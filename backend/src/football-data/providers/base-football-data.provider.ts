import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus, PredictionDirection } from '@prisma/client';
import { ProviderRequestConfig } from '../football-data.types';

export abstract class BaseFootballDataProvider {
  protected readonly logger = new Logger(this.constructor.name);

  protected constructor(protected readonly configService: ConfigService) {}

  protected requestConfig(prefix: string): ProviderRequestConfig {
    return {
      timeoutMs: this.configService.get<number>(
        `${prefix}_TIMEOUT_MS`,
        this.configService.get<number>('FOOTBALL_DATA_TIMEOUT_MS', 10000),
      ),
      retries: this.configService.get<number>(
        `${prefix}_RETRIES`,
        this.configService.get<number>('FOOTBALL_DATA_RETRIES', 3),
      ),
      retryDelayMs: this.configService.get<number>(
        `${prefix}_RETRY_DELAY_MS`,
        this.configService.get<number>('FOOTBALL_DATA_RETRY_DELAY_MS', 500),
      ),
    };
  }

  protected async requestJson<T>(
    url: string,
    init: RequestInit,
    config: ProviderRequestConfig,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= config.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (attempt >= config.retries) {
          break;
        }

        await this.sleep(config.retryDelayMs * Math.max(1, attempt + 1));
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Football data request failed');
  }

  protected toDateOnly(value = new Date()) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  protected direction(homeScore?: number | null, awayScore?: number | null) {
    if (homeScore === null || homeScore === undefined) {
      return null;
    }

    if (awayScore === null || awayScore === undefined) {
      return null;
    }

    if (homeScore > awayScore) {
      return PredictionDirection.HOME_WIN;
    }

    if (homeScore < awayScore) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
  }

  protected isFinalStatus(status: MatchStatus) {
    return status === MatchStatus.FINISHED || status === MatchStatus.CANCELLED;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
