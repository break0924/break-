const crypto = require('crypto');
const { db, _, cloud, todayInShanghai } = require('../common/db');
const { ok, fail } = require('../common/response');
const { recalculatePredictionStats } = require('../common/stats');

function assertAdmin(event) {
  const context = cloud.getWXContext();
  const openid = context.OPENID || '';
  const adminOpenIds = String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const adminToken = process.env.ADMIN_TOKEN || '';

  if (adminToken && event.adminToken === adminToken) {
    return { openid, mode: 'TOKEN' };
  }

  if (adminOpenIds.includes(openid)) {
    return { openid, mode: 'OPENID' };
  }

  if (process.env.ALLOW_DEV_ADMIN === 'true') {
    return { openid: openid || 'dev-openid', mode: 'DEV' };
  }

  throw new Error('无管理员权限');
}

function hashContent(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

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

function defaultPrediction(match, homeTeam, awayTeam) {
  const predictedHome = 1;
  const predictedAway = 1;
  const recommendationDirection = directionFromScore(predictedHome, predictedAway);
  const content = {
    matchId: match._id,
    status: 'DRAFT',
    predictionStage: 'DRAFT',
    homeTeamName: homeTeam?.name || '',
    awayTeamName: awayTeam?.name || '',
    kickoffAt: match.kickoffAt || `${match.matchDate}T${match.kickoffTime || '00:00'}:00+08:00`,
    generatedAt: new Date(),
    publishedAt: null,
    recommendationDirection,
    homeWinProb: 33,
    drawProb: 34,
    awayWinProb: 33,
    homeWinProbability: 33,
    drawProbability: 34,
    awayWinProbability: 33,
    predictedHome,
    predictedAway,
    predictedScore: `${predictedHome}-${predictedAway}`,
    totalGoalsPrediction: predictedHome + predictedAway,
    predictedTotalGoals: predictedHome + predictedAway,
    confidenceIndex: 60,
    riskIndex: 50,
    confidenceLevel: 60,
    riskLevel: 50,
    recommendationReason: 'MVP阶段由管理员手动生成，后续可接入AI生成。',
    riskTip: 'AI分析仅供足球数据参考，不承诺结果。',
    shortAnalysis: '本场预测已生成，建议结合赛前情报综合参考。',
    fullAnalysis: 'MVP阶段保留赛前分析占位内容，管理员可后续补充完整分析。',
    disclaimer: 'AI分析仅供足球数据参考，不承诺结果。',
    model: 'cloudbase-mvp',
    modelVersion: 'cloudbase-mvp-v1',
    promptVersion: 'cloudbase-mvp-v1',
    isMemberContent: true,
    isPublic: false,
    settlement: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    ...content,
    contentHash: hashContent(content),
  };
}

async function writeAdminLog(action, payload, admin) {
  await db.collection('admin_logs').add({
    data: {
      action,
      payload,
      adminOpenId: admin.openid,
      adminMode: admin.mode,
      createdAt: new Date(),
    },
  });
}

async function getMatchesByDate(date) {
  const result = await db.collection('matches').where({ matchDate: date }).orderBy('kickoffTime', 'asc').get();
  return result.data || [];
}

async function getTeamsByIds(ids) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return {};
  const result = await db.collection('teams').where({ _id: _.in(uniqueIds) }).get();
  return Object.fromEntries((result.data || []).map((team) => [team._id, team]));
}

async function generatePredictionsByDate(event, admin) {
  const date = event.date || todayInShanghai();
  const matches = await getMatchesByDate(date);
  const matchIds = matches.map((match) => match._id);
  const existingResult = matchIds.length
    ? await db.collection('prediction_archives').where({ matchId: _.in(matchIds) }).get()
    : { data: [] };
  const existingMatchIds = new Set((existingResult.data || []).map((item) => item.matchId));
  const teams = await getTeamsByIds(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]));

  let generatedCount = 0;
  let skippedCount = 0;
  const generatedIds = [];

  for (const match of matches) {
    if (existingMatchIds.has(match._id)) {
      skippedCount += 1;
      continue;
    }

    const prediction = defaultPrediction(match, teams[match.homeTeamId], teams[match.awayTeamId]);
    const created = await db.collection('prediction_archives').add({ data: prediction });
    generatedIds.push(created._id);
    generatedCount += 1;
  }

  const result = {
    date,
    matchCount: matches.length,
    generatedCount,
    skippedCount,
    generatedIds,
  };
  await writeAdminLog('GENERATE_PREDICTIONS_BY_DATE', result, admin);
  return result;
}

async function publishPredictionsByDate(event, admin) {
  const date = event.date || todayInShanghai();
  const matches = await getMatchesByDate(date);
  const matchIds = matches.map((match) => match._id);
  const predictionResult = matchIds.length
    ? await db.collection('prediction_archives').where({ matchId: _.in(matchIds) }).get()
    : { data: [] };

  let publishedCount = 0;
  let skippedCount = 0;

  for (const prediction of predictionResult.data || []) {
    if (prediction.status === 'PUBLISHED') {
      skippedCount += 1;
      continue;
    }

    await db.collection('prediction_archives').doc(prediction._id).update({
      data: {
        status: 'PUBLISHED',
        predictionStage: 'PUBLISHED',
        isPublic: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    publishedCount += 1;
  }

  const result = {
    date,
    publishedCount,
    skippedCount,
  };
  await writeAdminLog('PUBLISH_PREDICTIONS_BY_DATE', result, admin);
  return result;
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

async function syncMatchResult(event, admin) {
  const { matchId, homeScore, awayScore } = event;
  if (!matchId) {
    throw new Error('matchId不能为空');
  }
  if (homeScore === undefined || awayScore === undefined) {
    throw new Error('homeScore和awayScore不能为空');
  }

  const matchResult = await db.collection('matches').doc(matchId).get();
  const match = matchResult.data;
  const home = Number(homeScore);
  const away = Number(awayScore);
  const winnerTeamId = home === away ? null : home > away ? match.homeTeamId : match.awayTeamId;

  await db.collection('matches').doc(matchId).update({
    data: {
      status: event.status || 'FINISHED',
      homeScore: home,
      awayScore: away,
      winnerTeamId,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const settlement = await settlePredictions(match, home, away);
  const stats = await recalculatePredictionStats();
  const logPayload = {
    matchId,
    provider: 'MANUAL_ADMIN',
    syncStatus: 'SUCCESS',
    rawPayload: {
      homeScore: home,
      awayScore: away,
      status: event.status || 'FINISHED',
    },
    syncedAt: new Date(),
    errorMessage: '',
    retryCount: 0,
    settlement,
    stats,
  };

  await db.collection('result_sync_logs').add({ data: logPayload });
  await writeAdminLog('SYNC_MATCH_RESULT', logPayload, admin);

  return logPayload;
}

async function inviteStats(admin) {
  const statsResult = await db.collection('invite_stats').limit(100).get();
  const usersResult = await db.collection('users').limit(100).get();
  const usersById = Object.fromEntries((usersResult.data || []).map((user) => [user._id, user]));
  const rows = (statsResult.data || []).map((item) => ({
    userId: item.userId,
    inviteCode: usersById[item.userId]?.inviteCode || '',
    invitedCount: item.invitedCount || 0,
    invitedPaidCount: item.invitedPaidCount || 0,
  }));

  const result = {
    totalInvitedCount: rows.reduce((sum, item) => sum + item.invitedCount, 0),
    totalInvitedPaidCount: rows.reduce((sum, item) => sum + item.invitedPaidCount, 0),
    rows,
  };
  await writeAdminLog('VIEW_INVITE_STATS', { total: rows.length }, admin);
  return result;
}

exports.main = async (event = {}) => {
  try {
    const admin = assertAdmin(event);

    if (event.action === 'generatePredictionsByDate') {
      return ok(await generatePredictionsByDate(event, admin));
    }

    if (event.action === 'publishPredictionsByDate') {
      return ok(await publishPredictionsByDate(event, admin));
    }

    if (event.action === 'syncMatchResult') {
      return ok(await syncMatchResult(event, admin));
    }

    if (event.action === 'inviteStats') {
      return ok(await inviteStats(admin));
    }

    return fail('未知管理操作', 'UNKNOWN_ACTION');
  } catch (error) {
    return fail(error.message || '管理操作失败');
  }
};
