import type { Match, PredictionArchive } from '../api/types';

const ACTIVE_WINDOW_MS = 120 * 60 * 1000;

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

export function isActiveMatchLike(
  item: Match | PredictionArchive,
  now: Date | number = Date.now(),
) {
  const nowTime = typeof now === 'number' ? now : now.getTime();
  const kickoffAt = getKickoffAt(item);
  if (!kickoffAt) {
    return false;
  }

  const kickoffTime = new Date(kickoffAt).getTime();
  if (!Number.isFinite(kickoffTime)) {
    return false;
  }

  if (hasBlockedArchiveSignal(item)) {
    return false;
  }

  if (nowTime >= kickoffTime + ACTIVE_WINDOW_MS) {
    return false;
  }

  return nowTime < kickoffTime || nowTime < kickoffTime + ACTIVE_WINDOW_MS;
}

export function sortByKickoff<T extends Match | PredictionArchive>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(getKickoffAt(a) || 0).getTime() - new Date(getKickoffAt(b) || 0).getTime(),
  );
}

function getKickoffAt(item: Match | PredictionArchive) {
  return item.kickoffAt || ('match' in item ? item.match?.kickoffAt : undefined) || null;
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
