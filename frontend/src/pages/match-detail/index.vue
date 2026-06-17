<template>
  <view class="page match-detail-page">
    <view v-if="match" class="match-hero">
      <view class="eyebrow">{{ compactStage }}</view>
      <view class="teams-head">
        <view class="team-side">
          <TeamFlag :team="match.homeTeam" />
          <view>{{ match.homeTeam.name }}</view>
        </view>
        <view class="vs-pill">{{ isFinished ? formatMatchResult(match) : 'VS' }}</view>
        <view class="team-side away">
          <TeamFlag :team="match.awayTeam" />
          <view>{{ match.awayTeam.name }}</view>
        </view>
      </view>
      <view class="sub">{{ formatKickoff(match.kickoffAt) }} · {{ match.venue || '场地待定' }}</view>
      <view class="status-line">
        <view class="status-tag" :class="matchStatusClass(match.status)">
          {{ matchStatusLabel(match.status) }}
        </view>
        <view class="result-pill">{{ statusHint }}</view>
      </view>
    </view>

    <view class="section-title">AI赛前分析</view>
    <view v-if="loading" class="card muted">加载报告中...</view>
    <view v-else-if="!report && !prediction" class="card muted">
      {{ missingPredictionText }}
    </view>
    <view v-else class="analysis-card">
      <view class="analysis-head">
        <view>
          <view class="analysis-kicker">{{ predictionLabel }}</view>
          <view class="analysis-title">本场核心结论</view>
        </view>
        <view class="risk-badge">风险 {{ displayPrediction.riskLevel }}</view>
      </view>

      <view class="conclusion-grid">
        <view class="conclusion-main">
          <view class="mini-label">推荐方向</view>
          <view class="direction-text">{{ directionText }}</view>
        </view>
        <view
          v-for="candidate in candidateScores"
          :key="candidate.label"
          class="candidate-card"
        >
          <view class="mini-label">{{ candidate.label }}</view>
          <view class="candidate-score">{{ candidate.score }}</view>
        </view>
      </view>

      <view class="factor-row">
        <view>
          <text>信心</text>
          <strong>{{ displayPrediction.confidenceLevel }}</strong>
        </view>
        <view>
          <text>风险</text>
          <strong>{{ displayPrediction.riskLevel }}</strong>
        </view>
        <view>
          <text>结果倾向</text>
          <strong>{{ resultLean }}</strong>
        </view>
        <view>
          <text>总进球</text>
          <strong>{{ totalGoalsLean }}</strong>
        </view>
      </view>

      <view class="logic-note">{{ directionReason }}</view>

      <view class="probability-card">
        <view class="prob-title">胜平负概率</view>
        <view class="prob-grid">
          <view>
            <strong>{{ percentValue(displayPrediction.homeWinProb) }}</strong>
            <text>主胜概率</text>
          </view>
          <view>
            <strong>{{ percentValue(displayPrediction.drawProb) }}</strong>
            <text>平局概率</text>
          </view>
          <view>
            <strong>{{ percentValue(displayPrediction.awayWinProb) }}</strong>
            <text>客胜概率</text>
          </view>
        </view>
      </view>

      <view class="analysis-section">
        <view class="block-title">分析详情</view>
        <view class="content">{{ readableAnalysis }}</view>
      </view>

      <view class="analysis-section">
        <view class="block-title">风险提示</view>
        <view class="safe-note">{{ matchRiskTip }}</view>
      </view>

      <view class="analysis-section">
        <view class="block-title">比分候选说明</view>
        <view class="content">{{ scoreCandidateNote }}</view>
      </view>

      <view class="model-note">
        <view class="block-title">模型依据</view>
        <view>{{ modelBasis }}</view>
      </view>

      <view v-if="prediction?.correctionNote" class="safe-note">
        修正说明：{{ prediction.correctionNote }}
      </view>
      <MemberMask :locked="displayPrediction.locked" :hint="displayPrediction.unlockHint" />
    </view>

    <view v-if="match" class="btn challenge-btn" @tap="goPredict">参与本场挑战</view>
    <view class="archive-entry" @tap="goArchive">查看历史归档表现</view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { AiReport, Match, PredictionArchive } from '../../api/types';
import MemberMask from '../../components/MemberMask.vue';
import TeamFlag from '../../components/media/TeamFlag.vue';
import {
  formatKickoff,
  formatMatchResult,
  directionLabel,
  matchStatusClass,
  matchStatusLabel,
  normalizeMatchStatus,
} from '../../utils/format';
import { subscribeMatchMonitor } from '../../utils/match-monitor';

const matchId = ref('');
const loading = ref(false);
const match = ref<Match | null>(null);
const report = ref<AiReport | null>(null);
const prediction = ref<PredictionArchive | null>(null);
const missingPredictionText = ref('AI预测生成中');
let unsubscribeMonitor: (() => void) | null = null;

const displayPrediction = computed(() => {
  if (report.value) {
    return {
      predictedHome: report.value.predictedHome,
      predictedAway: report.value.predictedAway,
      riskIndex: report.value.riskIndex,
      riskLevel: levelFromIndex(report.value.riskIndex, 'risk'),
      confidenceLevel: levelFromIndex(report.value.confidenceIndex, 'confidence'),
      homeWinProb: report.value.homeWinProb,
      drawProb: report.value.drawProb,
      awayWinProb: report.value.awayWinProb,
      scoreCandidates: [],
      summary: report.value.summary,
      fullContent: report.value.fullContent,
      riskTip: '足球比赛受临场状态、阵容调整和比赛节奏影响，AI分析仅供足球数据参考。',
      locked: report.value.locked,
      unlockHint: report.value.unlockHint,
    };
  }

  const archive = prediction.value || match.value?.aiPrediction || null;
  return {
    predictedHome: archive?.predictedHome ?? 0,
    predictedAway: archive?.predictedAway ?? 0,
    riskIndex: archive?.riskLevel ?? archive?.riskIndex ?? '--',
    riskLevel: levelFromIndex(archive?.riskLevel ?? archive?.riskIndex, 'risk'),
    confidenceLevel: levelFromIndex(archive?.confidenceLevel ?? archive?.confidenceIndex, 'confidence'),
    homeWinProb: archive?.homeWinProbability ?? archive?.homeWinProb ?? '--',
    drawProb: archive?.drawProbability ?? archive?.drawProb ?? '--',
    awayWinProb: archive?.awayWinProbability ?? archive?.awayWinProb ?? '--',
    scoreCandidates: archive?.scoreCandidates || [],
    summary: archive?.shortAnalysis || archive?.recommendationReason || 'AI预测生成中',
    fullContent: archive
      ? archive.fullAnalysis || archive.recommendationReason
      : 'AI预测生成中，请稍后刷新。',
    riskTip: archive?.riskTip || archive?.disclaimer || '足球比赛存在临场不确定性，请结合阵容和赛前状态理性参考。',
    locked: archive?.predictionStage === 'LOCKED' || Boolean(archive?.lockedAt),
    unlockHint: null,
  };
});

const archivePrediction = computed(() => prediction.value || match.value?.aiPrediction || null);
const compactStage = computed(() => {
  if (!match.value) return '世界杯';
  return match.value.groupName || match.value.roundName || match.value.stage || '世界杯';
});
const isFinished = computed(() => normalizeMatchStatus(match.value?.status) === 'FINISHED');
const statusHint = computed(() => {
  if (!match.value) return '';
  if (isFinished.value) return `赛果 ${formatMatchResult(match.value)}`;
  return '开赛前可提交挑战预测';
});
const directionText = computed(() => {
  const archive = archivePrediction.value;
  if (!archive || !match.value) return 'AI预测生成中';
  if (archive.recommendationDirection === 'HOME_WIN') return `${match.value.homeTeam.name}不败`;
  if (archive.recommendationDirection === 'AWAY_WIN') return `${match.value.awayTeam.name}不败`;
  return directionLabel(archive.recommendationDirection);
});
const candidateScores = computed(() => {
  const candidates = displayPrediction.value.scoreCandidates || [];
  const primary = `${displayPrediction.value.predictedHome}:${displayPrediction.value.predictedAway}`;
  const rows = candidates.length
    ? candidates.slice(0, 2).map((item, index) => ({
        label: `候选比分 ${index + 1}`,
        score: (item.text || `${item.home}-${item.away}`).replace('-', ':'),
      }))
    : [{ label: '候选比分 1', score: primary }];

  if (rows.length === 1) {
    rows.push({ label: '候选比分 2', score: secondaryScore(primary) });
  }
  return rows;
});
const readableAnalysis = computed(() => {
  const archive = archivePrediction.value;
  if (archive?.analysisDetails) return archive.analysisDetails;
  const text = displayPrediction.value.summary || displayPrediction.value.fullContent || 'AI预测生成中';
  return compactAnalysis(text);
});
const scoreCandidateNote = computed(() => {
  const archive = archivePrediction.value;
  if (archive?.scoreCandidateNote) return archive.scoreCandidateNote;
  if (archive?.analysisContext?.scoreExplanation) return archive.analysisContext.scoreExplanation;
  const [first, second] = candidateScores.value;
  return `主候选 ${first?.score || '待定'} 对应当前更集中的胜平负方向；次候选 ${second?.score || '待定'} 保留了比赛被拖入拉锯或平局区间的可能。结合双方节奏和防守稳定性，总进球更偏向 ${totalGoalsLean.value}。`;
});
const modelBasis = computed(() => {
  if (!archivePrediction.value && !report.value) return '模型依据生成中。';
  const context = archivePrediction.value?.analysisContext;
  if (context && match.value) {
    const homeTags = context.homeProfile.tags.slice(0, 2).join('、');
    const awayTags = context.awayProfile.tags.slice(0, 2).join('、');
    return `综合${match.value.homeTeam.name}的${homeTags}、${match.value.awayTeam.name}的${awayTags}、近期状态、攻防表现与比分候选分布生成；概率和风险等级会随临场信息变化。`;
  }
  return '综合球队强度、近期状态、攻防表现、赛前信息与比分候选分布生成；概率和风险等级会随临场信息变化，赛前分析仅供足球数据参考。';
});
const resultLean = computed(() => {
  const archive = archivePrediction.value;
  if (!archive || !match.value) return '待评估';
  if (archive.recommendationDirection === 'HOME_WIN') return `${match.value.homeTeam.name}小幅占优`;
  if (archive.recommendationDirection === 'AWAY_WIN') return `${match.value.awayTeam.name}小幅占优`;
  return '平局倾向';
});
const totalGoalsLean = computed(() => {
  const archive = archivePrediction.value;
  if (archive?.totalGoalsRange) return archive.totalGoalsRange.replace('-', '~');
  const total = Number(displayPrediction.value.predictedHome) + Number(displayPrediction.value.predictedAway);
  if (total <= 1) return '0~1球';
  if (total >= 4) return '4球以上';
  return '2~3球';
});
const directionReason = computed(() => {
  if (!match.value) return '';
  const contextReason = archivePrediction.value?.analysisContext?.directionExplanation;
  if (contextReason) return contextReason;
  const home = Number(displayPrediction.value.homeWinProb);
  const draw = Number(displayPrediction.value.drawProb);
  const away = Number(displayPrediction.value.awayWinProb);
  const archive = archivePrediction.value;
  if (archive?.recommendationDirection === 'HOME_WIN') {
    return `主胜概率为 ${percentValue(home)}，但平局概率仍有 ${percentValue(draw)}，因此更稳妥的方向是 ${match.value.homeTeam.name}不败，而不是只看单一胜负。`;
  }
  if (archive?.recommendationDirection === 'AWAY_WIN') {
    return `客胜概率为 ${percentValue(away)}，但平局概率仍有 ${percentValue(draw)}，因此更稳妥的方向是 ${match.value.awayTeam.name}不败，而不是只看单一胜负。`;
  }
  return `平局概率为 ${percentValue(draw)}，双方胜率差距不大，比赛更可能落入拉锯区间。`;
});
const matchRiskTip = computed(() => {
  if (archivePrediction.value?.riskTip) return archivePrediction.value.riskTip;
  if (archivePrediction.value?.analysisContext?.mainRisk) {
    return `${archivePrediction.value.analysisContext.mainRisk}。赛前阵容、轮换和早段进球都可能改变比分候选分布，AI分析仅供足球数据参考。`;
  }
  if (!match.value) return displayPrediction.value.riskTip;
  const draw = Number(displayPrediction.value.drawProb);
  const risk = String(displayPrediction.value.riskLevel);
  const drawText = Number.isFinite(draw) && draw >= 28 ? `平局概率达到 ${percentValue(draw)}，` : '';
  return `${drawText}${match.value.awayTeam.name}的反击和身体对抗可能拉低比赛节奏，若临场轮换或早段进球出现，比分会偏离主候选。当前风险等级为${risk}，建议结合首发和临场状态再看。`;
});

const predictionLabel = computed(() => {
  const archive = prediction.value || match.value?.aiPrediction || null;
  if (!archive) return 'AI预测生成中';
  if (archive.predictionStage === 'FINAL') return '最终版预测';
  if (archive.predictionStage === 'LOCKED' || archive.lockedAt) return '预测已归档';
  return archive.archiveLabel || 'AI预测';
});

onLoad((query) => {
  matchId.value = String(query?.id || '');
  load();
});

onShow(() => {
  unsubscribeMonitor?.();
  unsubscribeMonitor = subscribeMatchMonitor((event) => {
    if (event.payload.matchId === matchId.value) {
      load();
    }
  });
});

onHide(() => {
  unsubscribeMonitor?.();
  unsubscribeMonitor = null;
});

async function load() {
  if (!matchId.value) return;
  loading.value = true;
  try {
    match.value = await api.matchDetail(matchId.value);
    prediction.value = match.value.aiPrediction || null;
    try {
      prediction.value = await api.matchPrediction(matchId.value);
    } catch {
      prediction.value = match.value.aiPrediction || null;
    }
    if (!prediction.value) {
      await checkMissingPrediction();
    }
    try {
      report.value = await api.aiReport(matchId.value);
    } catch {
      report.value = null;
    }
  } catch {
    match.value = null;
    report.value = null;
    prediction.value = null;
  } finally {
    loading.value = false;
  }
}

async function checkMissingPrediction() {
  missingPredictionText.value = 'AI预测生成中';
  try {
    const result = await api.checkMissingPrediction(matchId.value);
    const item = result.results?.[0];
    if (item?.status === 'GENERATED' || item?.status === 'EXISTS') {
      prediction.value = item.prediction || (await api.matchPrediction(matchId.value));
      return;
    }

    if (item?.status === 'NOT_INCLUDED') {
      missingPredictionText.value = item.reason || '本场未纳入预测';
    }
  } catch {
    missingPredictionText.value = 'AI预测生成中';
  }
}

function goPredict() {
  uni.navigateTo({ url: `/pages/prediction-submit/index?matchId=${matchId.value}` });
}

function goArchive() {
  uni.navigateTo({ url: '/pages/archive/index' });
}

function percentValue(value: string | number) {
  if (value === '--') return '--';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${Math.round(numeric)}%`;
}

function levelFromIndex(value: string | number | null | undefined, type: 'confidence' | 'risk') {
  if (typeof value === 'string' && Number.isNaN(Number(value))) {
    return value;
  }
  const numeric = Number(value || 0);
  if (type === 'confidence') {
    if (numeric >= 75) return '高';
    if (numeric >= 60) return '中高';
    if (numeric >= 40) return '中';
    return '谨慎';
  }
  if (numeric >= 75) return '高';
  if (numeric >= 45) return '中';
  return '低';
}

function secondaryScore(primary: string) {
  const [home, away] = primary.split(':').map((item) => Number(item));
  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return '1:1';
  }
  return `${Math.max(0, home - 1)}:${away}`;
}

function compactAnalysis(value: string) {
  const normalized = value
    .replace(/V\\d+\\s*模型[^。]*。?/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
  const text = normalized || value || 'AI赛前分析生成中。';
  const base = text.length > 190 ? `${text.slice(0, 190)}...` : text;
  if (!match.value) return base;
  const context = archivePrediction.value?.analysisContext;
  if (context) {
    return `${context.strongSideEdge}。${context.underdogThreat}。结合胜平负概率、节奏倾向和候选比分分布，本场更适合落在“${directionText.value}”和 ${totalGoalsLean.value} 的区间内。`;
  }
  return `${match.value.homeTeam.name}和${match.value.awayTeam.name}的对位重点不同，模型会结合球队风格、攻防表现和比分候选分布判断方向。本场更适合落在“${directionText.value}”和 ${totalGoalsLean.value} 的区间内。`;
}
</script>

<style scoped>
.match-detail-page {
  min-height: 100vh;
  color: #f4f8ff;
  background:
    radial-gradient(circle at 18% 0%, rgba(76, 126, 255, 0.24), transparent 34%),
    radial-gradient(circle at 92% 10%, rgba(246, 184, 73, 0.18), transparent 26%),
    linear-gradient(180deg, #07152e 0%, #070f22 48%, #040812 100%);
}

.match-hero {
  position: relative;
  overflow: hidden;
  padding: 34rpx 28rpx 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035)),
    radial-gradient(circle at 80% 10%, rgba(255, 216, 130, 0.18), transparent 34%);
}

.teams-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96rpx minmax(0, 1fr);
  align-items: center;
  gap: 14rpx;
  margin-top: 18rpx;
}

.team-side {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 950;
}

.team-side.away {
  flex-direction: row-reverse;
  text-align: right;
}

.vs-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-size: 24rpx;
  font-weight: 950;
}

.status-line {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 12rpx;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 18rpx;
}
.status-tag,
.result-pill {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: #f7fbff;
  background: rgba(255, 255, 255, 0.12);
  font-size: 22rpx;
  font-weight: 900;
}
.result-pill {
  color: #f8dc91;
  background: rgba(248, 213, 109, 0.11);
}

.analysis-card {
  padding: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 26rpx;
  background:
    linear-gradient(145deg, rgba(14, 30, 66, 0.96), rgba(8, 14, 30, 0.96)),
    radial-gradient(circle at 18% 0%, rgba(83, 132, 255, 0.16), transparent 34%);
}

.analysis-head {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  align-items: flex-start;
}

.analysis-kicker,
.mini-label {
  color: rgba(222, 232, 255, 0.58);
  font-size: 21rpx;
  font-weight: 800;
}

.analysis-title {
  margin-top: 6rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 950;
}

.risk-badge {
  flex: 0 0 auto;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  color: #10141e;
  background: #ffd98a;
  font-size: 22rpx;
  font-weight: 900;
}

.conclusion-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 14rpx;
  margin-top: 22rpx;
}

.conclusion-main,
.candidate-card {
  min-height: 116rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.07);
  box-sizing: border-box;
}

.conclusion-main {
  background: linear-gradient(135deg, rgba(45, 101, 255, 0.28), rgba(246, 184, 73, 0.12));
}

.direction-text,
.candidate-score {
  margin-top: 10rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 950;
}

.candidate-score {
  color: #ffd98a;
}

.factor-row,
.prob-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 16rpx;
}

.factor-row view,
.prob-grid view {
  padding: 16rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.065);
}

.factor-row text,
.prob-grid text {
  display: block;
  color: rgba(222, 232, 255, 0.58);
  font-size: 21rpx;
}

.factor-row strong,
.prob-grid strong {
  display: block;
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 950;
}

.logic-note {
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 217, 138, 0.15);
  border-radius: 18rpx;
  color: #e8f1ff;
  background: rgba(255, 217, 138, 0.07);
  font-size: 24rpx;
  line-height: 1.6;
}

.probability-card {
  margin-top: 20rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(0, 0, 0, 0.18);
}

.prob-title {
  color: #f8dc91;
  font-size: 24rpx;
  font-weight: 900;
}

.prob-grid {
  grid-template-columns: repeat(3, 1fr);
}

.analysis-section,
.model-note {
  margin-top: 22rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.055);
}

.block-title {
  color: #ffd98a;
  font-size: 24rpx;
  font-weight: 900;
}

.content {
  margin-top: 12rpx;
  color: #e8f1ff;
  font-size: 27rpx;
  line-height: 1.7;
  white-space: pre-wrap;
}

.safe-note {
  margin-top: 12rpx;
  color: rgba(222, 232, 255, 0.72);
  font-size: 25rpx;
  line-height: 1.65;
}

.model-note {
  color: rgba(222, 232, 255, 0.58);
  font-size: 24rpx;
  line-height: 1.6;
}

.challenge-btn {
  margin-top: 24rpx;
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-weight: 950;
}

.archive-entry {
  margin-top: 18rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 18rpx;
  color: #ffd98a;
  text-align: center;
  background: rgba(255, 255, 255, 0.055);
  font-size: 25rpx;
  font-weight: 850;
}
</style>
