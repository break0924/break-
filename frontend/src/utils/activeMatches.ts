import type { Match, PredictionArchive } from '../api/types';

const ACTIVE_WINDOW_MS = 120 * 60 * 1000;
const MAX_HOME_PREDICTIONS = 4;

const BLOCKED_STATUS = new Set([
  'FINISHED',
  'COMPLETED',
  'ENDED',
  'FULL_TIME',
  'FT',
  'ARCHIVED',
  'RESULTED',
  'SETTLED',
  'POSTPONED',
  'CANCELLED',
  'CANCELED',
]);

export type PredictionFilterReason =
  | 'missing_kickoffAt'
  | 'invalid_kickoffAt'
  | 'blocked_status'
  | 'finished_by_time';

export type PredictionFilterLog = {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  now: string;
  reason: PredictionFilterReason;
};

export type VisiblePredictionResult<T extends Match | PredictionArchive> = {
  visiblePredictions: T[];
  filteredOutPredictions: PredictionFilterLog[];
  source: 'active' | 'next_available' | 'empty';
  displayDate: string;
};

export function isActiveMatchLike(
  item: Match | PredictionArchive,
  now: Date | number = Date.now(),
) {
  return !inactiveReason(item, now);
}

export function sortByKickoff<T extends Match | PredictionArchive>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(getKickoffAt(a) || 0).getTime() - new Date(getKickoffAt(b) || 0).getTime(),
  );
}

export function getNextAvailablePredictions<T extends Match | PredictionArchive>(
  items: T[],
  now: Date | number = Date.now(),
  take = MAX_HOME_PREDICTIONS,
): VisiblePredictionResult<T> {
  const sorted = sortByKickoff(items);
  const filteredOutPredictions = sorted
    .map((item) => {
      const reason = inactiveReason(item, now);
      return reason ? filterLog(item, now, reason) : null;
    })
    .filter((item): item is PredictionFilterLog => Boolean(item));
  const active = sorted.filter((item) => !inactiveReason(item, now));
  const nowTime = typeof now === 'number' ? now : now.getTime();
  const currentDate = beijingDate(new Date(nowTime).toISOString());
  const currentActive = active.filter((item) => {
    const kickoffTime = new Date(getKickoffAt(item) || '').getTime();
    return kickoffTime <= nowTime || beijingDate(getKickoffAt(item)) === currentDate;
  });

  if (currentActive.length > 0) {
    return {
      visiblePredictions: currentActive.slice(0, take),
      filteredOutPredictions,
      source: 'active',
      displayDate: '',
    };
  }

  const future = active.filter((item) => {
    const kickoffTime = new Date(getKickoffAt(item) || '').getTime();
    return Number.isFinite(kickoffTime) && kickoffTime > nowTime;
  });
  const firstFuture = future[0];
  const nextDate = firstFuture ? beijingDate(getKickoffAt(firstFuture)) : '';
  const nextAvailable = nextDate
    ? future.filter((item) => beijingDate(getKickoffAt(item)) === nextDate).slice(0, take)
    : [];

  return {
    visiblePredictions: nextAvailable,
    filteredOutPredictions,
    source: nextAvailable.length > 0 ? 'next_available' : 'empty',
    displayDate: nextAvailable.length > 0 ? nextDate : '',
  };
}

export function normalizePredictions(source?: unknown): PredictionArchive[] {
  const value = unwrapData(source);
  if (Array.isArray(value)) {
    return normalizePredictionItems(value);
  }
  if (!value || typeof value !== 'object') {
    return [];
  }

  for (const key of ['predictions', 'items', 'matches', 'recommendedMatches']) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      return normalizePredictionItems(candidate);
    }
  }

  return [];
}

export function filterActivePredictions<T extends Match | PredictionArchive>(
  items: T[],
  now: Date | number = Date.now(),
) {
  return sortByKickoff(items.filter((item) => isActiveMatchLike(item, now)));
}

function getKickoffAt(item: Match | PredictionArchive) {
  const record = item as Record<string, any>;
  return record.kickoffAt
    || record.kickoffTime
    || ('match' in item ? item.match?.kickoffAt : undefined)
    || null;
}

function hasBlockedArchiveSignal(item: Match | PredictionArchive) {
  const prediction = item as PredictionArchive;
  const match = ('match' in prediction && prediction.match) || (item as Match);
  const values = [
    (item as Match).status,
    prediction.predictionStage,
    prediction.resultStatus,
    match?.status,
  ];

  if (values.some((value) => BLOCKED_STATUS.has(String(value || '').trim().toUpperCase()))) {
    return true;
  }

  if (String(prediction.archiveLabel || '').includes('归档')) {
    return true;
  }

  if (String(prediction.id || '').includes('fallback_archive_demo')) {
    return true;
  }

  return Boolean(prediction.settlement);
}

function inactiveReason(
  item: Match | PredictionArchive,
  now: Date | number = Date.now(),
): PredictionFilterReason | null {
  const nowTime = typeof now === 'number' ? now : now.getTime();
  const kickoffAt = getKickoffAt(item);
  if (!kickoffAt) {
    return 'missing_kickoffAt';
  }

  const kickoffTime = new Date(kickoffAt).getTime();
  if (!Number.isFinite(kickoffTime)) {
    return 'invalid_kickoffAt';
  }

  if (hasBlockedArchiveSignal(item)) {
    return 'blocked_status';
  }

  if (nowTime >= kickoffTime + ACTIVE_WINDOW_MS) {
    return 'finished_by_time';
  }

  return null;
}

function filterLog(
  item: Match | PredictionArchive,
  now: Date | number,
  reason: PredictionFilterReason,
): PredictionFilterLog {
  const record = item as Record<string, any>;
  const match = ('match' in item ? item.match : undefined) || record;
  return {
    homeTeam: stringValue(record.homeTeamName)
      || stringValue(record.homeTeam)
      || stringValue(match?.homeTeam?.name),
    awayTeam: stringValue(record.awayTeamName)
      || stringValue(record.awayTeam)
      || stringValue(match?.awayTeam?.name),
    kickoffAt: stringValue(getKickoffAt(item)),
    now: new Date(typeof now === 'number' ? now : now.getTime()).toISOString(),
    reason,
  };
}

function normalizePredictionItems(items: unknown[]) {
  return items
    .filter((item): item is Record<string, any> => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const match = item.match && typeof item.match === 'object' ? item.match : undefined;
      return {
        ...item,
        homeTeamName: stringValue(item.homeTeamName)
          || stringValue(item.homeTeam)
          || stringValue(match?.homeTeam?.name),
        awayTeamName: stringValue(item.awayTeamName)
          || stringValue(item.awayTeam)
          || stringValue(match?.awayTeam?.name),
        homeFlag: stringValue(item.homeFlag) || stringValue(item.homeFlagUrl),
        awayFlag: stringValue(item.awayFlag) || stringValue(item.awayFlagUrl),
        kickoffAt: stringValue(item.kickoffAt)
          || stringValue(item.kickoffTime)
          || stringValue(match?.kickoffAt),
        kickoffTimeText: stringValue(item.kickoffTimeText),
        group: stringValue(item.group) || stringValue(item.groupName) || stringValue(match?.groupName),
        predictedScore: stringValue(item.predictedScore),
        recommendationDirection: stringValue(item.recommendationDirection),
        confidenceLevel: item.confidenceLevel ?? item.confidenceIndex ?? item.confidence,
        riskLevel: item.riskLevel ?? item.riskIndex ?? item.risk,
        shortAnalysis: stringValue(item.shortAnalysis) || stringValue(item.recommendationReason),
        isMemberOnly: Boolean(item.isMemberOnly ?? item.isMemberContent),
        isLocked: Boolean(item.isLocked ?? item.locked),
        status: stringValue(item.status),
        resultStatus: stringValue(item.resultStatus),
        archiveLabel: stringValue(item.archiveLabel),
      } as unknown as PredictionArchive;
    });
}

function unwrapData(source?: unknown): unknown {
  let current = parseJsonPayload(source);

  for (let index = 0; index < 5; index += 1) {
    if (!current || typeof current !== 'object') {
      return current;
    }

    const record = current as Record<string, unknown>;
    const next = record.data ?? record.result;
    if (next === undefined || next === current) {
      return current;
    }

    current = parseJsonPayload(next);
  }

  return current;
}

function parseJsonPayload(source?: unknown): unknown {
  if (typeof source !== 'string') {
    return source;
  }

  try {
    return JSON.parse(source);
  } catch {
    return source;
  }
}

function beijingDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}
