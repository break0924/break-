<template>
  <view class="challenge-submit-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <template v-if="mode === 'tournament'">
      <view class="hero-card">
        <view class="eyebrow">Tournament Challenge</view>
        <view class="hero-title">赛季预测</view>
        <view class="hero-sub">提交冠军、四强和金靴判断，结果揭晓后自动结算积分。</view>
      </view>

      <section class="section-card">
        <view class="section-title">冠军</view>
        <picker :range="teamNames" :value="championIndex" @change="onChampionChange">
          <view class="picker-card">{{ championTeam?.name || '选择冠军球队' }}</view>
        </picker>

        <view class="section-title spaced">四强</view>
        <picker
          v-for="(_, index) in finalFourIndexes"
          :key="index"
          :range="teamNames"
          :value="finalFourIndexes[index]"
          @change="onFinalFourChange(index, $event)"
        >
          <view class="picker-card">{{ finalFourTeams[index]?.name || `选择第${index + 1}支球队` }}</view>
        </picker>

        <view class="section-title spaced">金靴</view>
        <input v-model="goldenBootName" class="text-input" placeholder="输入球员姓名" placeholder-class="placeholder" />

        <view class="primary-btn submit-wide" @tap="submitTournament">确认提交</view>
      </section>
    </template>

    <template v-else>
      <section v-if="step === 'overview'" class="overview-card">
        <view class="eyebrow">Daily Challenge</view>
        <view class="hero-title">今日挑战</view>
        <view class="hero-sub">逐场完成预测，提交后等待赛果结算积分。</view>

        <view class="overview-grid">
          <view class="overview-stat">
            <text class="overview-value">{{ matches.length }}</text>
            <text class="overview-label">今日比赛</text>
          </view>
          <view class="overview-stat">
            <text class="overview-value">{{ completedCount }}/{{ matches.length }}</text>
            <text class="overview-label">当前已完成</text>
          </view>
          <view class="overview-stat highlight">
            <text class="overview-value">{{ totalPotentialPoints }}</text>
            <text class="overview-label">最高可得积分</text>
          </view>
        </view>

        <view class="auto-save-note">每场选择会自动暂存，提交前可随时返回修改。</view>
        <view class="primary-btn start-btn" @tap="startChallenge">
          {{ matches.length ? '开始挑战' : loading ? '加载比赛中...' : '暂无今日比赛' }}
        </view>
      </section>

      <section v-else-if="step === 'match' && currentMatch" class="match-step">
        <view class="progress-head">
          <view>
            <view class="progress-title">第 {{ currentIndex + 1 }} 场 / 共 {{ matches.length }} 场</view>
            <view class="progress-sub">完成 {{ progressPercent }}% · 本场最高 +13 分</view>
          </view>
          <view class="progress-count">{{ completedCount }}/{{ matches.length }}</view>
        </view>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: `${progressPercent}%` }" />
        </view>

        <view class="match-card">
          <view class="match-meta">
            <text>{{ formatKickoff(currentMatch.kickoffAt) }}</text>
            <text>{{ currentMatch.groupName || currentMatch.roundName || '世界杯' }}</text>
          </view>
          <view class="team-row">
            <view class="team">
              <TeamFlag :team="currentMatch.homeTeam" />
              <text>{{ currentMatch.homeTeam.name }}</text>
            </view>
            <view class="vs">VS</view>
            <view class="team away">
              <TeamFlag :team="currentMatch.awayTeam" />
              <text>{{ currentMatch.awayTeam.name }}</text>
            </view>
          </view>
        </view>

        <view class="section-title">选择赛果方向</view>
        <view class="direction-grid">
          <view
            v-for="option in directionOptions"
            :key="option.value"
            class="direction-card"
            :class="{ selected: currentDraft.direction === option.value }"
            @tap="selectDirection(option.value)"
          >
            <view class="direction-main">{{ option.label }}</view>
            <view class="direction-sub">{{ option.hint }}</view>
          </view>
        </view>

        <view class="score-panel">
          <view>
            <view class="section-title compact">比分参考</view>
            <view class="score-note">可选填写，比分命中额外 +10 分</view>
          </view>
          <view class="score-inputs">
            <input v-model.number="currentDraft.predictedHome" type="number" class="score-input" />
            <view class="score-sep">:</view>
            <input v-model.number="currentDraft.predictedAway" type="number" class="score-input" />
          </view>
        </view>

        <view class="auto-save-note">已自动暂存本场选择，提交前仍可返回修改。</view>

        <view class="step-actions">
          <view class="secondary-btn" :class="{ disabled: currentIndex === 0 }" @tap="prevMatch">上一场</view>
          <view class="primary-btn" @tap="nextMatch">{{ currentIndex === matches.length - 1 ? '进入确认' : '下一场' }}</view>
        </view>
      </section>

      <section v-else-if="step === 'confirm'" class="confirm-card">
        <view class="result-icon">✓</view>
        <view class="hero-title">确认提交挑战</view>
        <view class="hero-sub">已完成 {{ completedCount }} 场预测，本次挑战会保存并等待赛果结算。</view>

        <view class="confirm-grid">
          <view class="overview-stat">
            <text class="overview-value">{{ completedCount }}</text>
            <text class="overview-label">已完成场次</text>
          </view>
          <view class="overview-stat highlight">
            <text class="overview-value">{{ completedCount * 13 }}</text>
            <text class="overview-label">本次最高积分</text>
          </view>
        </view>

        <view class="confirm-note">提交后等待赛果结算，已开赛或锁定的比赛不可修改。</view>
        <view class="step-actions">
          <view class="secondary-btn" @tap="step = 'match'">返回修改</view>
          <view class="primary-btn" @tap="submitMatchChallenge">{{ submitting ? '提交中...' : '确认提交挑战' }}</view>
        </view>
      </section>

      <view v-if="!loading && !matches.length" class="empty-card">
        <view class="section-title">暂无可参与比赛</view>
        <view class="section-sub">今日赛程更新后，可回到这里逐场完成挑战。</view>
      </view>
    </template>

    <view class="safe-note">积分规则：胜平负命中3分，比分完全命中10分；挑战仅计算虚拟积分与称号。</view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import { api } from '../../api';
import type { Match, Team } from '../../api/types';
import TeamFlag from '../../components/media/TeamFlag.vue';
import { requireLogin } from '../../utils/auth';
import { formatKickoff, normalizeMatchStatus } from '../../utils/format';

type SubmitMode = 'match' | 'daily' | 'tournament';
type Step = 'overview' | 'match' | 'confirm';
type Direction = 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
type DraftPrediction = {
  direction?: Direction;
  predictedHome: number;
  predictedAway: number;
};

const mode = ref<SubmitMode>('daily');
const step = ref<Step>('overview');
const matchId = ref('');
const seasonId = ref('');
const matches = ref<Match[]>([]);
const teams = ref<Team[]>([]);
const currentIndex = ref(0);
const loading = ref(false);
const submitting = ref(false);
const drafts = reactive<Record<string, DraftPrediction>>({});
const championIndex = ref(-1);
const finalFourIndexes = ref([-1, -1, -1, -1]);
const goldenBootName = ref('');

const directionOptions: Array<{ label: string; hint: string; value: Direction }> = [
  { label: '主胜', hint: '看好主队取胜', value: 'HOME_WIN' },
  { label: '平局', hint: '双方握手言和', value: 'DRAW' },
  { label: '客胜', hint: '看好客队取胜', value: 'AWAY_WIN' },
];

const teamNames = computed(() => teams.value.map((team) => team.name));
const championTeam = computed(() => teams.value[championIndex.value]);
const finalFourTeams = computed(() =>
  finalFourIndexes.value.map((index) => teams.value[index]),
);
const currentMatch = computed(() => matches.value[currentIndex.value] || null);
const currentDraft = computed(() => {
  const match = currentMatch.value;
  if (!match) {
    return { predictedHome: 1, predictedAway: 0 } as DraftPrediction;
  }
  return ensureDraft(match.id);
});
const completedCount = computed(() =>
  matches.value.filter((match) => Boolean(drafts[match.id]?.direction)).length,
);
const totalPotentialPoints = computed(() => matches.value.length * 13);
const progressPercent = computed(() => {
  if (!matches.value.length) return 0;
  return Math.round((completedCount.value / matches.value.length) * 100);
});

onLoad((query) => {
  const queryMode = String(query?.mode || '');
  matchId.value = String(query?.matchId || '');
  seasonId.value = String(query?.seasonId || '');
  if (queryMode === 'tournament') {
    mode.value = 'tournament';
  } else if (matchId.value) {
    mode.value = 'match';
  } else {
    mode.value = 'daily';
  }
  load();
});

async function load() {
  loading.value = true;
  try {
    if (mode.value === 'tournament') {
      teams.value = await api.teams();
      return;
    }

    if (mode.value === 'match') {
      const match = await api.matchDetail(matchId.value);
      if (!isChallengeOpen(match)) {
        matches.value = [];
        uni.showToast({ title: '本场已开赛，预测已锁定', icon: 'none' });
        return;
      }
      matches.value = [match];
      ensureDraft(match.id);
      return;
    }

    const todayMatches = await api.matches({ date: todayKey() });
    matches.value = todayMatches.filter(isChallengeOpen);
    matches.value.forEach((match) => ensureDraft(match.id));
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function todayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((item) => item.type === 'year')?.value || '2026';
  const month = parts.find((item) => item.type === 'month')?.value || '01';
  const day = parts.find((item) => item.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

function isChallengeOpen(match: Match) {
  return normalizeMatchStatus(match.status) === 'SCHEDULED' &&
    new Date(match.kickoffAt).getTime() > Date.now();
}

function ensureDraft(id: string) {
  if (!drafts[id]) {
    drafts[id] = {
      predictedHome: 1,
      predictedAway: 0,
    };
  }
  return drafts[id];
}

function startChallenge() {
  if (!matches.value.length) return;
  currentIndex.value = 0;
  step.value = 'match';
}

function selectDirection(value: Direction) {
  const match = currentMatch.value;
  if (!match) return;
  ensureDraft(match.id).direction = value;
}

function prevMatch() {
  if (currentIndex.value === 0) return;
  currentIndex.value -= 1;
}

function nextMatch() {
  const match = currentMatch.value;
  if (!match) return;
  if (!drafts[match.id]?.direction) {
    uni.showToast({ title: '请先选择本场方向', icon: 'none' });
    return;
  }
  if (currentIndex.value >= matches.value.length - 1) {
    step.value = 'confirm';
    return;
  }
  currentIndex.value += 1;
}

function onChampionChange(event: unknown) {
  championIndex.value = Number((event as { detail: { value: number } }).detail.value);
}

function onFinalFourChange(index: number, event: unknown) {
  finalFourIndexes.value[index] = Number((event as { detail: { value: number } }).detail.value);
}

async function submitMatchChallenge() {
  if (!requireLogin()) return;
  if (submitting.value) return;
  if (completedCount.value !== matches.value.length) {
    uni.showToast({ title: '请完成全部场次后提交', icon: 'none' });
    step.value = 'match';
    return;
  }

  submitting.value = true;
  try {
    for (const match of matches.value) {
      const draft = drafts[match.id];
      if (!draft.direction) continue;
      await api.submitMatchPrediction({
        matchId: match.id,
        direction: draft.direction,
        predictedHome: Number(draft.predictedHome || 0),
        predictedAway: Number(draft.predictedAway || 0),
      });
    }

    uni.showToast({ title: '挑战已提交', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/challenge/index' }), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function submitTournament() {
  if (!requireLogin()) return;
  try {
    const finalFourTeamIds = finalFourTeams.value
      .filter(Boolean)
      .map((team) => team.id);
    if (!championTeam.value || finalFourTeamIds.length !== 4) {
      uni.showToast({ title: '请选择冠军和四强', icon: 'none' });
      return;
    }
    await api.submitTournamentPick({
      seasonId: seasonId.value,
      championTeamId: championTeam.value.id,
      finalFourTeamIds,
      goldenBootName: goldenBootName.value,
    });

    uni.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/challenge/index' }), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' });
  }
}
</script>

<style scoped lang="scss">
.challenge-submit-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(64, 134, 255, 0.3), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(255, 216, 130, 0.2), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.hero-card,
.overview-card,
.section-card,
.match-step,
.confirm-card,
.empty-card,
.safe-note {
  position: relative;
  z-index: 1;
}

.glow,
.motion-line {
  pointer-events: none;
  position: absolute;
}

.glow {
  border-radius: 50%;
  opacity: 0.72;
}

.glow-gold {
  top: -120rpx;
  right: -80rpx;
  width: 320rpx;
  height: 320rpx;
  background: rgba(255, 216, 130, 0.25);
}

.glow-blue {
  left: -100rpx;
  top: 260rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(64, 134, 255, 0.23);
}

.motion-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 216, 130, 0.5), transparent);
  transform: rotate(-16deg);
}

.line-a {
  top: 220rpx;
  right: -80rpx;
  width: 360rpx;
}

.line-b {
  top: 820rpx;
  left: -120rpx;
  width: 320rpx;
}

.hero-card,
.overview-card,
.section-card,
.match-step,
.confirm-card,
.empty-card {
  padding: 30rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.25);
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 52rpx;
  font-weight: 900;
  line-height: 1.08;
}

.hero-sub,
.section-sub {
  margin-top: 12rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 23rpx;
  line-height: 1.5;
}

.overview-grid,
.confirm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-top: 28rpx;
}

.overview-stat {
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.overview-stat.highlight {
  grid-column: 1 / -1;
  border-color: rgba(255, 216, 130, 0.24);
  background: rgba(255, 216, 130, 0.09);
}

.overview-value,
.overview-label {
  display: block;
}

.overview-value {
  color: #ffd879;
  font-size: 42rpx;
  font-weight: 900;
}

.overview-label {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
}

.auto-save-note,
.confirm-note,
.safe-note {
  margin-top: 22rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  border-radius: 18rpx;
  background: rgba(255, 216, 130, 0.07);
  color: rgba(255, 242, 199, 0.78);
  font-size: 21rpx;
  line-height: 1.45;
}

.primary-btn,
.secondary-btn {
  display: flex;
  min-height: 84rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 900;
}

.primary-btn {
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  box-shadow: 0 18rpx 54rpx rgba(255, 216, 121, 0.28);
}

.secondary-btn {
  border: 1rpx solid rgba(255, 216, 130, 0.2);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 242, 199, 0.86);
}

.secondary-btn.disabled {
  opacity: 0.4;
}

.start-btn,
.submit-wide {
  margin-top: 26rpx;
}

.progress-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.progress-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.progress-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 22rpx;
}

.progress-count {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.11);
  color: #ffd879;
  font-size: 23rpx;
  font-weight: 900;
}

.progress-track {
  overflow: hidden;
  height: 14rpx;
  margin-top: 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background-image: linear-gradient(90deg, #ffd36f, #58d7ff);
  transition: width 0.2s ease;
}

.match-card,
.score-panel {
  margin-top: 24rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.06);
}

.match-meta {
  display: flex;
  justify-content: space-between;
  gap: 14rpx;
  color: rgba(221, 235, 255, 0.6);
  font-size: 21rpx;
  font-weight: 800;
}

.team-row {
  display: grid;
  grid-template-columns: 1fr 70rpx 1fr;
  gap: 12rpx;
  align-items: center;
  margin-top: 22rpx;
}

.team {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
  text-align: center;
}

.team :deep(.team-flag) {
  width: 74rpx;
  height: 50rpx;
}

.vs {
  color: #ffd879;
  font-size: 28rpx;
  font-weight: 900;
  text-align: center;
}

.section-title {
  margin-top: 28rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.section-title.compact {
  margin-top: 0;
}

.direction-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14rpx;
  margin-top: 16rpx;
}

.direction-card {
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.direction-card.selected {
  border-color: rgba(255, 216, 130, 0.32);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.18), transparent 34%),
    rgba(255, 216, 130, 0.1);
}

.direction-main {
  color: #ffffff;
  font-size: 29rpx;
  font-weight: 900;
}

.direction-sub {
  margin-top: 7rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 21rpx;
}

.score-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.score-note {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 21rpx;
}

.score-inputs {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14rpx;
}

.score-input,
.text-input {
  box-sizing: border-box;
  height: 84rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #f4fbf8;
}

.score-input {
  width: 104rpx;
  text-align: center;
  font-size: 38rpx;
  font-weight: 900;
}

.score-sep {
  color: #ffd879;
  font-size: 38rpx;
  font-weight: 900;
}

.step-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 26rpx;
}

.result-icon {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 32rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffd879;
  font-size: 58rpx;
  font-weight: 900;
}

.picker-card,
.text-input {
  margin-top: 16rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 800;
}

.text-input {
  width: 100%;
}

.spaced {
  margin-top: 30rpx;
}

.placeholder {
  color: rgba(221, 235, 255, 0.42);
}

@media (min-width: 900px) {
  .challenge-submit-page {
    padding: 34px max(34px, calc((100vw - 760px) / 2));
  }

  .direction-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
