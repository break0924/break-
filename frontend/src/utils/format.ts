export function formatKickoff(value?: string) {
  if (!value) return '时间待定';
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export function directionLabel(direction: string) {
  const map: Record<string, string> = {
    HOME_WIN: '主胜',
    DRAW: '平局',
    AWAY_WIN: '客胜',
  };
  return map[direction] || direction;
}

export function matchStatusLabel(status?: string) {
  const normalized = normalizeMatchStatus(status);
  const map: Record<string, string> = {
    SCHEDULED: '未开始',
    LIVE: '进行中',
    FINISHED: '已结束',
    POSTPONED: '已延期',
    CANCELLED: '已取消',
  };
  return normalized ? map[normalized] || normalized : '状态待定';
}

export function matchStatusClass(status?: string) {
  const normalized = normalizeMatchStatus(status);
  return {
    live: normalized === 'LIVE',
    finished: normalized === 'FINISHED',
    postponed: normalized === 'POSTPONED',
    cancelled: normalized === 'CANCELLED',
  };
}

export function formatMatchResult(match?: {
  homeScore?: number | null;
  awayScore?: number | null;
}) {
  if (
    !match ||
    match.homeScore === null ||
    match.homeScore === undefined ||
    match.awayScore === null ||
    match.awayScore === undefined
  ) {
    return '赛果待定';
  }

  return `${match.homeScore}-${match.awayScore}`;
}

export function settlementStatusText(item: {
  match?: { status?: string; homeScore?: number | null; awayScore?: number | null } | null;
  settlement?: { hitResult: boolean; hitScore?: boolean; hitTotalGoals?: boolean } | null;
}) {
  if (item.settlement) {
    return item.settlement.hitResult ? '方向命中' : '方向未中';
  }

  if (item.match?.status === 'FINISHED') {
    return '赛果待结算';
  }

  return '待赛果';
}

export function centsToYuan(cents: number) {
  return (cents / 100).toFixed(0);
}

export function normalizeMatchStatus(status?: string | null) {
  const value = String(status || 'SCHEDULED').trim().toUpperCase();
  if (['FINISHED', 'COMPLETED', 'ENDED', 'FULL_TIME', 'FT'].includes(value)) {
    return 'FINISHED';
  }
  if (['LIVE', 'IN_PLAY', 'PLAYING', 'ONGOING'].includes(value)) {
    return 'LIVE';
  }
  if (['POSTPONED', 'DELAYED'].includes(value)) {
    return 'POSTPONED';
  }
  if (['CANCELLED', 'CANCELED'].includes(value)) {
    return 'CANCELLED';
  }
  return 'SCHEDULED';
}
