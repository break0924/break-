const {
  _,
  db,
  ensureUser,
  getInviteStatus,
  getMembership,
  getOpenId,
  todayInShanghai,
} = require('./db');

function normalizeTeam(team) {
  if (!team) {
    return null;
  }

  return {
    id: team._id || team.id,
    name: team.name,
    nameEn: team.nameEn || '',
    fifaCode: team.fifaCode || '',
    countryCode: team.countryCode || '',
    groupName: team.groupName || '',
    flagUrl: team.flagUrl || '',
  };
}

function displayStatus(match) {
  if (match.status === 'POSTPONED' || match.status === 'CANCELLED') {
    return match.status;
  }

  if (match.homeScore !== null && match.homeScore !== undefined &&
    match.awayScore !== null && match.awayScore !== undefined) {
    return 'FINISHED';
  }

  const kickoffAt = new Date(match.kickoffAt || `${match.matchDate}T${match.kickoffTime || '00:00'}:00+08:00`).getTime();
  if (!Number.isFinite(kickoffAt)) {
    return match.status || 'SCHEDULED';
  }

  const now = Date.now();
  if (now < kickoffAt) {
    return 'SCHEDULED';
  }

  if (now < kickoffAt + 120 * 60 * 1000) {
    return 'LIVE';
  }

  return 'FINISHED';
}

function isRecommendable(match) {
  const status = displayStatus(match || {});
  return status === 'SCHEDULED' || status === 'LIVE';
}

function addShanghaiDays(date, days) {
  const value = new Date(`${date}T00:00:00.000+08:00`);
  value.setUTCDate(value.getUTCDate() + days);
  const shanghai = new Date(value.getTime() + 8 * 60 * 60 * 1000);
  const year = shanghai.getUTCFullYear();
  const month = String(shanghai.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shanghai.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeMatch(match, teamsById, prediction) {
  const homeTeam = normalizeTeam(teamsById[match.homeTeamId] || match.homeTeam);
  const awayTeam = normalizeTeam(teamsById[match.awayTeamId] || match.awayTeam);
  const kickoffAt = match.kickoffAt || `${match.matchDate}T${match.kickoffTime || '00:00'}:00+08:00`;
  return {
    id: match._id || match.id,
    stage: match.stage || 'GROUP',
    groupName: match.groupName || '',
    matchDate: match.matchDate || '',
    kickoffTime: match.kickoffTime || '',
    timezone: match.timezone || 'Asia/Shanghai',
    kickoffAt,
    venue: match.venue || '',
    city: match.city || '',
    roundName: match.roundName || '',
    status: displayStatus({ ...match, kickoffAt }),
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    winnerTeamId: match.winnerTeamId || null,
    homeTeam,
    awayTeam,
    aiPrediction: prediction || null,
  };
}

function normalizePrediction(item, match) {
  const predictedHome = item.predictedHome ?? Number(String(item.predictedScore || '0-0').split('-')[0] || 0);
  const predictedAway = item.predictedAway ?? Number(String(item.predictedScore || '0-0').split('-')[1] || 0);
  const scoreCandidates = normalizeScoreCandidates(item.scoreCandidates || item.candidateScores || item.scoreModel?.scoreCandidates);
  const totalGoalsRange =
    item.totalGoalsRange ||
    item.scoreModel?.totalGoalsRange ||
    item.predictionEngine?.totalGoalsRange ||
    null;

  return {
    id: item._id || item.id,
    matchId: item.matchId,
    status: item.status || 'PUBLISHED',
    predictionStage: item.predictionStage || 'PUBLISHED',
    homeTeamName: item.homeTeamName || match?.homeTeam?.name || '',
    awayTeamName: item.awayTeamName || match?.awayTeam?.name || '',
    kickoffAt: item.kickoffAt || match?.kickoffAt || '',
    publishedAt: item.publishedAt || null,
    generatedAt: item.generatedAt || null,
    lockedAt: item.lockedAt || null,
    recommendationDirection: item.recommendationDirection || 'DRAW',
    homeWinProb: item.homeWinProb ?? item.homeWinProbability ?? 33,
    drawProb: item.drawProb ?? item.drawProbability ?? 34,
    awayWinProb: item.awayWinProb ?? item.awayWinProbability ?? 33,
    homeWinProbability: item.homeWinProbability ?? item.homeWinProb ?? 33,
    drawProbability: item.drawProbability ?? item.drawProb ?? 34,
    awayWinProbability: item.awayWinProbability ?? item.awayWinProb ?? 33,
    predictedHome,
    predictedAway,
    predictedScore: item.predictedScore || `${predictedHome}-${predictedAway}`,
    scoreCandidates,
    totalGoalsRange,
    totalGoalsPrediction: item.totalGoalsPrediction ?? predictedHome + predictedAway,
    predictedTotalGoals: item.predictedTotalGoals ?? predictedHome + predictedAway,
    confidenceIndex: item.confidenceIndex ?? 60,
    riskIndex: item.riskIndex ?? 50,
    confidenceLevel: item.confidenceLevel || item.confidenceIndex || 60,
    riskLevel: item.riskLevel || item.riskIndex || 50,
    recommendationReason: item.recommendationReason || '',
    riskTip: item.riskTip || 'AI分析仅供足球数据参考，不承诺结果。',
    shortAnalysis: item.shortAnalysis || '',
    fullAnalysis: item.fullAnalysis || '',
    disclaimer: item.disclaimer || 'AI分析仅供足球数据参考，不承诺结果。',
    model: item.model || item.modelVersion || 'mvp',
    modelVersion: item.modelVersion || 'mvp',
    promptVersion: item.promptVersion || 'mvp-v1',
    isMemberContent: Boolean(item.isMemberContent),
    isPublic: item.isPublic !== false,
    contentHash: item.contentHash || '',
    resultStatus: item.resultStatus || 'PENDING_RESULT',
    settlement: item.settlement || null,
    match: match || null,
  };
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

      return {
        home,
        away,
        text: candidate.text || `${home}-${away}`,
        probability: Number(candidate.probability ?? 0),
        totalGoals: Number(candidate.totalGoals ?? home + away),
        rank: Number(candidate.rank ?? index + 1),
      };
    })
    .filter(Boolean);
}

function isCandidateScoreHit(item) {
  if (item.settlement?.hitScoreCandidate !== undefined) {
    return Boolean(item.settlement.hitScoreCandidate);
  }

  const homeScore = Number(item.settlement?.homeScore);
  const awayScore = Number(item.settlement?.awayScore);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return false;
  }

  return (item.scoreCandidates || []).some((candidate) => (
    Number(candidate.home) === homeScore && Number(candidate.away) === awayScore
  ));
}

function isScoreReferenceHit(item) {
  if (item.settlement?.hitScoreReference !== undefined) {
    return Boolean(item.settlement.hitScoreReference);
  }

  return Boolean(item.settlement?.hitScore) || isCandidateScoreHit(item);
}

function isTotalGoalsRangeHit(item) {
  if (item.settlement?.hitTotalGoalsRange !== undefined) {
    return Boolean(item.settlement.hitTotalGoalsRange);
  }

  const homeScore = Number(item.settlement?.homeScore);
  const awayScore = Number(item.settlement?.awayScore);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return false;
  }

  const totalGoals = homeScore + awayScore;
  if (item.totalGoalsRange === '0-1球') {
    return totalGoals <= 1;
  }
  if (item.totalGoalsRange === '2-3球') {
    return totalGoals >= 2 && totalGoals <= 3;
  }
  if (item.totalGoalsRange === '4球以上') {
    return totalGoals >= 4;
  }
  return false;
}

function currentStreak(items) {
  let streak = 0;
  for (const item of items) {
    if (!item.settlement?.hitResult) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function bestStreak(items) {
  let best = 0;
  let current = 0;
  for (const item of [...items].reverse()) {
    if (item.settlement?.hitResult) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function buildStats(predictions) {
  const settled = predictions.filter((item) => item.settlement);
  const settledByLatest = [...settled].sort((a, b) => {
    const left = new Date(a.settlement?.settledAt || a.kickoffAt || 0).getTime();
    const right = new Date(b.settlement?.settledAt || b.kickoffAt || 0).getTime();
    return right - left;
  });
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7Settled = settledByLatest.filter((item) => {
    const settledAt = new Date(item.settlement?.settledAt || item.kickoffAt || 0).getTime();
    return Number.isFinite(settledAt) && settledAt >= sevenDaysAgo;
  });
  const last30Settled = settledByLatest.slice(0, 30);
  const resultHits = settled.filter((item) => item.settlement?.hitResult).length;
  const scoreHits = settled.filter((item) => item.settlement?.hitScore).length;
  const scoreCandidateHits = settled.filter((item) => isCandidateScoreHit(item)).length;
  const scoreReferenceHits = settled.filter((item) => isScoreReferenceHit(item)).length;
  const highConfidenceSettled = settled.filter((item) => (
    item.confidenceLevel === 'HIGH' || Number(item.confidenceIndex || 0) >= 70
  ));
  const highConfidenceHits = highConfidenceSettled.filter((item) => item.settlement?.hitResult).length;
  const totalGoalsHits = settled.filter((item) => item.settlement?.hitTotalGoals).length;
  const totalGoalsRangeHits = settled.filter((item) => isTotalGoalsRangeHit(item)).length;
  const count = settled.length || 1;
  const highConfidenceCount = highConfidenceSettled.length || 1;

  return {
    source: 'cloudbase',
    totalPredictions: predictions.length,
    settledPredictions: settled.length,
    archivedMatchCount: settled.length,
    last7DaysHitRate: Math.round((last7Settled.filter((item) => item.settlement?.hitResult).length / (last7Settled.length || 1)) * 100),
    last30MatchesHitRate: Math.round((last30Settled.filter((item) => item.settlement?.hitResult).length / (last30Settled.length || 1)) * 100),
    resultHitRate: Math.round((resultHits / count) * 100),
    scoreHitRate: Math.round((scoreHits / count) * 100),
    scoreCandidateHitRate: Math.round((scoreCandidateHits / count) * 100),
    scoreReferenceHitRate: Math.round((scoreReferenceHits / count) * 100),
    highConfidenceHitRate: Math.round((highConfidenceHits / highConfidenceCount) * 100),
    highConfidenceSettledCount: highConfidenceSettled.length,
    totalGoalsHitRate: Math.round((totalGoalsHits / count) * 100),
    totalGoalsRangeHitRate: Math.round((totalGoalsRangeHits / count) * 100),
    currentHitStreak: currentStreak(settledByLatest),
    bestHitStreak: bestStreak(settledByLatest),
    highConfidenceStats: {
      count: highConfidenceSettled.length,
      resultHitRate: Math.round((highConfidenceHits / highConfidenceCount) * 100),
      scoreHitRate: Math.round((highConfidenceSettled.filter((item) => item.settlement?.hitScore).length / highConfidenceCount) * 100),
      scoreCandidateHitRate: Math.round((highConfidenceSettled.filter((item) => isCandidateScoreHit(item)).length / highConfidenceCount) * 100),
    },
    recentPredictions: predictions.slice(0, 10),
  };
}

async function loadHomeData(options = {}) {
  const requestedDate = options.date || todayInShanghai();
  const openid = await getOpenId();
  const user = await ensureUser(openid);
  const membership = await getMembership(user);
  const invite = await getInviteStatus(user);
  let date = requestedDate;
  let homeData = await loadHomeMatchesForDate(date);

  if (!options.date && !homeData.predictions.some((item) => isRecommendable(item.match))) {
    for (let offset = 1; offset <= 14; offset += 1) {
      const candidateDate = addShanghaiDays(requestedDate, offset);
      const candidateData = await loadHomeMatchesForDate(candidateDate);
      if (
        candidateData.predictions.some((item) => isRecommendable(item.match)) ||
        candidateData.matchesWithPrediction.some(isRecommendable)
      ) {
        date = candidateDate;
        homeData = candidateData;
        break;
      }
    }
  }

  const predictions = homeData.predictions.filter((item) => isRecommendable(item.match));

  return {
    date,
    requestedDate,
    displayDate: date,
    isMember: membership.isMember,
    predictions,
    matches: homeData.matchesWithPrediction,
    stats: buildStats(homeData.predictions),
    membership,
    invite,
  };
}

async function loadHomeMatchesForDate(date) {
  const matchesResult = await db.collection('matches').where({ matchDate: date }).orderBy('kickoffTime', 'asc').get();
  const matchesRaw = matchesResult.data || [];
  const teamIds = Array.from(new Set(matchesRaw.flatMap((item) => [item.homeTeamId, item.awayTeamId]).filter(Boolean)));
  const teamsResult = teamIds.length
    ? await db.collection('teams').where({ _id: _.in(teamIds) }).get()
    : { data: [] };
  const teamsById = Object.fromEntries((teamsResult.data || []).map((team) => [team._id, team]));
  const matchIds = matchesRaw.map((item) => item._id || item.id);
  const predictionsResult = matchIds.length
    ? await db.collection('prediction_archives')
        .where({
          matchId: _.in(matchIds),
          status: 'PUBLISHED',
          isPublic: true,
        })
        .get()
    : { data: [] };
  const predictionsByMatchId = Object.fromEntries((predictionsResult.data || []).map((item) => [item.matchId, item]));
  const matches = matchesRaw.map((match) => normalizeMatch(match, teamsById));
  const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]));
  const predictions = (predictionsResult.data || [])
    .map((item) => normalizePrediction(item, matchesById[item.matchId]))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  const matchesWithPrediction = matches.map((match) => ({
    ...match,
    aiPrediction: predictionsByMatchId[match.id]
      ? normalizePrediction(predictionsByMatchId[match.id], match)
      : null,
  }));

  return {
    predictions,
    matchesWithPrediction,
  };
}

module.exports = {
  loadHomeData,
  normalizePrediction,
  buildStats,
};
