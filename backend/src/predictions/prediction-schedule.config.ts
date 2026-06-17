import { ConfigService } from '@nestjs/config';

export type PredictionScheduleConfig = {
  timezone: string;
  generateCron: string;
  publishCron: string;
  resultSyncCron: string;
  lockMinutes: number;
  refreshHoursBefore: number;
  finalRefreshMinutesBefore: number;
  dueScanCron: string;
  lockScanCron: string;
};

export const DEFAULT_PREDICTION_SCHEDULE_CONFIG: PredictionScheduleConfig = {
  timezone: 'Asia/Shanghai',
  generateCron: '0 18 * * *',
  publishCron: '0 20 * * *',
  resultSyncCron: '0 * * * *',
  lockMinutes: 30,
  refreshHoursBefore: 6,
  finalRefreshMinutesBefore: 90,
  dueScanCron: '*/10 * * * *',
  lockScanCron: '* * * * *',
};

export function normalizeCronForNest(cron: string) {
  const trimmed = cron.trim();
  const parts = trimmed.split(/\s+/);
  return parts.length === 5 ? `0 ${trimmed}` : trimmed;
}

export function predictionTimeZone() {
  return process.env.APP_TIMEZONE || DEFAULT_PREDICTION_SCHEDULE_CONFIG.timezone;
}

export function predictionGenerateCron() {
  return normalizeCronForNest(
    process.env.PREDICTION_GENERATE_CRON ||
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.generateCron,
  );
}

export function predictionPublishCron() {
  return normalizeCronForNest(
    process.env.PREDICTION_PUBLISH_CRON ||
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.publishCron,
  );
}

export function predictionDueScanCron() {
  return normalizeCronForNest(
    process.env.PREDICTION_DUE_SCAN_CRON ||
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.dueScanCron,
  );
}

export function predictionLockScanCron() {
  return normalizeCronForNest(
    process.env.PREDICTION_LOCK_SCAN_CRON ||
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.lockScanCron,
  );
}

export function getPredictionScheduleConfig(
  configService: ConfigService,
): PredictionScheduleConfig {
  return {
    timezone: configService.get<string>(
      'APP_TIMEZONE',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.timezone,
    ),
    generateCron: configService.get<string>(
      'PREDICTION_GENERATE_CRON',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.generateCron,
    ),
    publishCron: configService.get<string>(
      'PREDICTION_PUBLISH_CRON',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.publishCron,
    ),
    resultSyncCron: configService.get<string>(
      'RESULT_SYNC_CRON',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.resultSyncCron,
    ),
    lockMinutes: numberConfig(
      configService,
      'PREDICTION_LOCK_MINUTES',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.lockMinutes,
    ),
    refreshHoursBefore: numberConfig(
      configService,
      'PREDICTION_REFRESH_HOURS_BEFORE',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.refreshHoursBefore,
    ),
    finalRefreshMinutesBefore: numberConfig(
      configService,
      'PREDICTION_FINAL_REFRESH_MINUTES_BEFORE',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.finalRefreshMinutesBefore,
    ),
    dueScanCron: configService.get<string>(
      'PREDICTION_DUE_SCAN_CRON',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.dueScanCron,
    ),
    lockScanCron: configService.get<string>(
      'PREDICTION_LOCK_SCAN_CRON',
      DEFAULT_PREDICTION_SCHEDULE_CONFIG.lockScanCron,
    ),
  };
}

function numberConfig(
  configService: ConfigService,
  key: string,
  fallback: number,
) {
  const value = Number(configService.get<string | number>(key, fallback));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
