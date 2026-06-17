const https = require('https');
const { db, _, todayInShanghai } = require('../common/db');
const { ok, fail } = require('../common/response');
const { recalculatePredictionStats } = require('../common/stats');

function directionFromScore(home, away) {
  if (home > away) return 'HOME_WIN';
  if (home < away) return 'AWAY_WIN';
  return 'DRAW';
}

function normalizeScoreCandidates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((candidate, index) => {
      const text = candidate.text || candidate.score || '';
      const [textHome, textAway] = String(text).split(/[-:]/).map((part) => Number(part));
      const home = Number(candidate.home ?? candidate.homeScore ?? textHome);
      const away = Number(candidate.away ?? candidate.awayScore ?? textAway);
      if (!Number.isFinite(home) || !Number.isFinite(away)) {
        return null;
      }
      return { home, away, rank: Number(candidate.rank ?? index + 1) };
    })
    .filter(Boolean);
}

function getJson(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`赛果接口返回异常: ${res.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(new Error('赛果接口JSON解析失败'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('赛果接口超时'));
    });
    req.on('error', reject);
  });
}

async function fetchResultFeed(date) {
  const baseUrl = process.env.RESULT_SYNC_API_URL || '';
  if (!baseUrl) {
    return {
      provider: 'DATABASE_ONLY',
      items: [],
      rawPayload: null,
    };
  }

  const joiner = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${joiner}date=${encodeURIComponent(date)}`;
  const rawPayload = await getJson(url);
  const items = Array.isArray(rawPayload) ? rawPayload : rawPayload.matches || rawPayload.results || [];

  return {
    provider: process.env.RESULT_SYNC_PROVIDER || 'SIMPLE_HTTP',
    items,
    rawPayload,
  };
}

function normalizeFeedItem(item) {
  return {
    matchId: item.matchId || item.id || item.externalMatchId,
    status: item.status || (item.finished ? 'FINISHED' : undefined),
    homeScore: item.homeScore ?? item.home?.score ?? item.score?.home,
    awayScore: item.awayScore ?? item.away?.score ?? item.score?.away,
    raw: item,
  };
}

async function settlePredictions(match, homeScore, awayScore) {
  const predictionResult = await db.collection('prediction_archives').where({ matchId: match._id }).get();
  const resultDirection = directionFromScore(homeScore, awayScore);
  let settledCount = 0;
  let skippedCount = 0;

  for (const prediction of predictionResult.data || []) {
    if (prediction.settlement?.settledAt) {
      skippedCount += 1;
      continue;
    }

    const predictedHome = Number(prediction.predictedHome ?? 0);
    const predictedAway = Number(prediction.predictedAway ?? 0);
    const scoreCandidates = normalizeScoreCandidates(
      prediction.scoreCandidates || prediction.candidateScores || prediction.scoreModel?.scoreCandidates,
    );
    const hitScore = predictedHome === homeScore && predictedAway === awayScore;
    const hitScoreCandidate = scoreCandidates.some((candidate) => (
      candidate.home === homeScore && candidate.away === awayScore
    ));
    const settlement = {
      homeScore,
      awayScore,
      resultDirection,
      hitResult: prediction.recommendationDirection === resultDirection,
      hitScore,
      hitScoreCandidate,
      hitScoreReference: hitScore || hitScoreCandidate,
      hitTotalGoals: predictedHome + predictedAway === homeScore + awayScore,
      settledAt: new Date(),
    };

    await db.collection('prediction_archives').doc(prediction._id).update({
      data: {
        settlement,
        resultStatus: 'SETTLED',
        updatedAt: new Date(),
      },
    });
    settledCount += 1;
  }

  return {
    settledCount,
    skippedCount,
  };
}

async function updateMatchFromResult(match, result, provider) {
  const status = result.status || match.status;
  const homeScore = result.homeScore === undefined ? match.homeScore : Number(result.homeScore);
  const awayScore = result.awayScore === undefined ? match.awayScore : Number(result.awayScore);
  const isFinished =
    status === 'FINISHED' &&
    homeScore !== null &&
    homeScore !== undefined &&
    awayScore !== null &&
    awayScore !== undefined;
  const winnerTeamId = !isFinished || homeScore === awayScore
    ? null
    : homeScore > awayScore
      ? match.homeTeamId
      : match.awayTeamId;

  await db.collection('matches').doc(match._id).update({
    data: {
      status,
      homeScore: homeScore ?? null,
      awayScore: awayScore ?? null,
      winnerTeamId,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const settlement = isFinished
    ? await settlePredictions(match, homeScore, awayScore)
    : { settledCount: 0, skippedCount: 0 };

  await db.collection('result_sync_logs').add({
    data: {
      matchId: match._id,
      provider,
      syncStatus: 'SUCCESS',
      rawPayload: result.raw || result,
      syncedAt: new Date(),
      errorMessage: '',
      retryCount: 0,
      settlement,
    },
  });

  return {
    matchId: match._id,
    status,
    homeScore,
    awayScore,
    settlement,
  };
}

async function loadTargetMatches(date) {
  const todayResult = await db.collection('matches')
    .where({
      matchDate: date,
    })
    .get();
  const activeResult = await db.collection('matches')
    .where({
      status: _.in(['LIVE', 'FINISHED']),
    })
    .get();

  const byId = {};
  for (const match of [...(todayResult.data || []), ...(activeResult.data || [])]) {
    byId[match._id] = match;
  }

  return Object.values(byId);
}

async function runSync(event = {}) {
  const date = event.date || todayInShanghai();
  const matches = await loadTargetMatches(date);
  const feed = await fetchResultFeed(date);
  const feedByMatchId = Object.fromEntries(feed.items.map((item) => {
    const normalized = normalizeFeedItem(item);
    return [normalized.matchId, normalized];
  }));

  const updated = [];
  const skipped = [];

  for (const match of matches) {
    const feedResult = feedByMatchId[match._id] || feedByMatchId[match.externalMatchId];
    const dbHasFinishedScore =
      match.status === 'FINISHED' &&
      match.homeScore !== null &&
      match.homeScore !== undefined &&
      match.awayScore !== null &&
      match.awayScore !== undefined;

    if (!feedResult && !dbHasFinishedScore) {
      skipped.push({ matchId: match._id, reason: 'NO_RESULT' });
      continue;
    }

    const result = feedResult || {
      matchId: match._id,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      raw: { source: 'DATABASE_ONLY' },
    };

    updated.push(await updateMatchFromResult(match, result, feed.provider));
  }

  const stats = await recalculatePredictionStats();

  return {
    date,
    provider: feed.provider,
    scannedCount: matches.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    updated,
    skipped,
    stats,
  };
}

exports.main = async (event = {}) => {
  try {
    return ok(await runSync(event));
  } catch (error) {
    await db.collection('result_sync_logs').add({
      data: {
        matchId: event.matchId || '',
        provider: process.env.RESULT_SYNC_PROVIDER || 'SIMPLE_HTTP',
        syncStatus: 'FAILED',
        rawPayload: event,
        syncedAt: new Date(),
        errorMessage: error.message || '赛果同步失败',
        retryCount: 0,
      },
    });
    return fail(error.message || '赛果同步失败');
  }
};
