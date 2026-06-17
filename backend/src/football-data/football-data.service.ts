import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExternalMatchResult,
  ExternalPreMatchContext,
  FootballDataProvider,
  FootballDataSourceCode,
} from './football-data.types';
import { ApiFootballProvider } from './providers/api-football.provider';
import { ManualProvider } from './providers/manual.provider';
import { SportmonksProvider } from './providers/sportmonks.provider';

type ProviderAction<T> = (provider: FootballDataProvider) => Promise<T>;

@Injectable()
export class FootballDataService {
  private readonly logger = new Logger(FootballDataService.name);
  private readonly providers: FootballDataProvider[];

  constructor(
    private readonly configService: ConfigService,
    apiFootballProvider: ApiFootballProvider,
    sportmonksProvider: SportmonksProvider,
    manualProvider: ManualProvider,
  ) {
    const registry: Record<FootballDataSourceCode, FootballDataProvider> = {
      API_FOOTBALL: apiFootballProvider,
      SPORTMONKS: sportmonksProvider,
      MANUAL: manualProvider,
    };

    this.providers = this.providerOrder()
      .map((code) => registry[code])
      .filter(Boolean)
      .sort((a, b) => a.priority - b.priority);
  }

  getTodayMatches() {
    return this.withFallback((provider) => provider.getTodayMatches());
  }

  getMatchesByDate(date: string) {
    return this.withFallback((provider) => provider.getMatchesByDate(date));
  }

  getMatchResult(externalMatchId: string) {
    return this.withFallback((provider) =>
      provider.getMatchResult(externalMatchId),
    );
  }

  getLiveMatches() {
    return this.withFallback((provider) => provider.getLiveMatches());
  }

  getFinishedMatches(date: string) {
    return this.withFallback((provider) => provider.getFinishedMatches(date));
  }

  getPreMatchContext(externalMatchId: string) {
    return this.withFallback((provider) =>
      provider.getPreMatchContext(externalMatchId),
    );
  }

  health() {
    return this.providers.map((provider) => provider.health());
  }

  private async withFallback<
    T extends
      | ExternalMatchResult[]
      | ExternalMatchResult
      | ExternalPreMatchContext
      | null,
  >(
    action: ProviderAction<T>,
  ): Promise<T> {
    const errors: Array<{ provider: FootballDataSourceCode; message: string }> = [];
    const enabledProviders = this.providers.filter((provider) =>
      provider.isEnabled(),
    );

    if (enabledProviders.length === 0) {
      throw new Error('No football data provider is enabled');
    }

    for (const [index, provider] of enabledProviders.entries()) {
      try {
        const result = await action(provider);
        const hasNextProvider = index < enabledProviders.length - 1;

        if (Array.isArray(result) && result.length === 0 && hasNextProvider) {
          this.logger.warn(
            `${provider.code} returned no football data; trying next provider if available`,
          );
          errors.push({
            provider: provider.code,
            message: 'No football data returned',
          });
          continue;
        }

        if (result === null && hasNextProvider) {
          this.logger.warn(
            `${provider.code} returned no match result; trying next provider if available`,
          );
          errors.push({
            provider: provider.code,
            message: 'No match result returned',
          });
          continue;
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ provider: provider.code, message });
        this.logger.warn(
          `${provider.code} football data provider failed: ${message}`,
        );
      }
    }

    throw new Error(
      `All football data providers failed: ${errors
        .map((item) => `${item.provider}: ${item.message}`)
        .join('; ')}`,
    );
  }

  private providerOrder(): FootballDataSourceCode[] {
    const configured = this.configService.get<string>('FOOTBALL_DATA_PROVIDERS');
    if (configured) {
      return configured
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter((item): item is FootballDataSourceCode =>
          ['API_FOOTBALL', 'SPORTMONKS', 'MANUAL'].includes(item),
        );
    }

    const primary = this.configService
      .get<string>('FOOTBALL_DATA_PRIMARY', 'API_FOOTBALL')
      .trim()
      .toUpperCase() as FootballDataSourceCode;
    const baseOrder: FootballDataSourceCode[] = [
      'API_FOOTBALL',
      'SPORTMONKS',
      'MANUAL',
    ];

    return [primary, ...baseOrder.filter((item) => item !== primary)];
  }
}
