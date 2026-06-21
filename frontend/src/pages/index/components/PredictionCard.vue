<template>
  <view class="prediction-card" :class="{ featured, locked }">
    <view class="card-top">
      <view class="card-tags">
        <view class="group-pill">{{ prediction.groupName }}</view>
        <view v-if="locked" class="updated-pill">已更新</view>
      </view>
      <view class="kickoff">{{ prediction.kickoffTime }}</view>
    </view>

    <view class="teams">
      <view class="team">
        <view class="flag-frame">
          <AppImage :src="prediction.homeFlag" :fallback="DEFAULT_FLAG" mode="aspectFill" />
        </view>
        <text>{{ prediction.homeTeam }}</text>
      </view>
      <view class="versus">VS</view>
      <view class="team right">
        <view class="flag-frame">
          <AppImage :src="prediction.awayFlag" :fallback="DEFAULT_FLAG" mode="aspectFill" />
        </view>
        <text>{{ prediction.awayTeam }}</text>
      </view>
    </view>

    <view class="premium-zone">
      <view class="locked-content">
        <view class="score-zone">
          <text class="score">{{ locked ? '--' : prediction.predictedScore }}</text>
          <text class="score-caption">预测比分</text>
          <view v-if="!locked && candidateScoreText" class="candidate-line">
            备选 {{ candidateScoreText }}
          </view>
          <view v-if="!locked && prediction.totalGoalsRange" class="goals-range">
            总进球 {{ prediction.totalGoalsRange }} · {{ prediction.overUnderLean || '均衡' }}
          </view>
        </view>

        <view class="info-grid">
          <view>
            <text class="info-value">{{ locked ? '会员专享' : prediction.direction }}</text>
            <text class="info-label">推荐方向</text>
          </view>
          <view>
            <text class="info-value">{{ locked ? '会员专享' : prediction.confidence }}</text>
            <text class="info-label">信心等级</text>
          </view>
          <view>
            <text class="info-value risk">{{ locked ? '会员专享' : prediction.risk }}</text>
            <text class="info-label">风险等级</text>
          </view>
        </view>

        <view v-if="featured" class="deep-insight">
          <view class="insight-head">
            <text class="archive-badge">赛前预测</text>
            <text>{{ prediction.archiveLabel || '已更新' }}</text>
          </view>
          <view class="summary-text">
            {{ prediction.summary || 'AI已完成赛前综合分析，建议结合阵容、状态与临场信息理性参考。' }}
          </view>
          <view v-if="prediction.probabilities" class="prob-grid">
            <view>
              <text class="prob-value">{{ prediction.probabilities.home }}%</text>
              <text class="prob-label">主胜</text>
            </view>
            <view>
              <text class="prob-value">{{ prediction.probabilities.draw }}%</text>
              <text class="prob-label">平局</text>
            </view>
            <view>
              <text class="prob-value">{{ prediction.probabilities.away }}%</text>
              <text class="prob-label">客胜</text>
            </view>
          </view>
        </view>

        <view class="analysis-btn" @tap.stop="$emit('detail')">查看分析</view>
        <view v-if="featured" class="post-cta-trust">
          <text>近10场方向命中率 86%</text>
          <text>公开归档追踪</text>
        </view>
      </view>

      <view v-if="locked" class="member-cover">
        <view class="member-badge">会员专享</view>
        <view class="lock-icon">
          <view class="lock-shackle" />
          <view class="lock-body" />
        </view>
        <view class="cover-title">解锁完整推荐理由</view>
        <view class="cover-subtitle">查看风险提示与更多比分参考</view>
        <view class="unlock-btn" @tap.stop="$emit('unlock')">立即解锁</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppImage from '../../../components/media/AppImage.vue';
import { DEFAULT_FLAG } from '../../../utils/assets';
import type { PredictionMock } from '../mock';

const props = defineProps<{
  prediction: PredictionMock;
  featured?: boolean;
  locked?: boolean;
  unlockCount?: number;
}>();

defineEmits<{
  detail: [];
  unlock: [];
}>();

const candidateScoreText = computed(() => {
  const candidates = props.prediction.scoreCandidates || [];
  return candidates
    .slice(1, 3)
    .map((candidate) => candidate.text.replace('-', ':'))
    .join(' / ');
});
</script>

<style scoped lang="scss">
.prediction-card {
  position: relative;
  overflow: hidden;
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 82% 0%, rgba(255, 216, 130, 0.16), transparent 28%),
    linear-gradient(145deg, rgba(18, 33, 72, 0.92), rgba(8, 13, 29, 0.92));
  box-shadow: 0 22rpx 54rpx rgba(0, 0, 0, 0.28);
}

.prediction-card.featured {
  min-height: 590rpx;
  padding: 32rpx;
  border-color: rgba(255, 216, 130, 0.32);
  background:
    radial-gradient(circle at 78% 2%, rgba(255, 216, 130, 0.22), transparent 30%),
    radial-gradient(circle at 0% 88%, rgba(64, 134, 255, 0.2), transparent 34%),
    linear-gradient(145deg, rgba(19, 38, 86, 0.96), rgba(8, 13, 29, 0.96));
  box-shadow: 0 34rpx 92rpx rgba(0, 0, 0, 0.42), 0 0 58rpx rgba(255, 216, 130, 0.12);
}

.prediction-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(74, 141, 255, 0.15), transparent 34%, rgba(210, 41, 77, 0.14));
}

.card-top,
.teams,
.premium-zone {
  position: relative;
  z-index: 1;
}

.card-top,
.teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.featured .teams {
  margin-top: 30rpx;
}

.group-pill,
.updated-pill,
.kickoff {
  padding: 12rpx 17rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 800;
}

.group-pill {
  background: rgba(64, 134, 255, 0.18);
  color: #cfe0ff;
}

.updated-pill {
  background: rgba(255, 216, 130, 0.14);
  color: #ffe0a0;
}

.kickoff {
  background: rgba(255, 216, 130, 0.13);
  color: #ffe0a0;
}

.teams {
  gap: 12rpx;
  margin-top: 24rpx;
}

.team {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 12rpx;
  color: #ffffff;
  font-size: 29rpx;
  font-weight: 900;
}

.featured .team {
  flex-direction: column;
  align-items: flex-start;
  gap: 16rpx;
  font-size: 34rpx;
}

.featured .team.right {
  align-items: flex-end;
}

.team.right {
  justify-content: flex-end;
  text-align: right;
}

.flag-frame {
  width: 68rpx;
  height: 48rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 10rpx;
}

.featured .flag-frame {
  width: 96rpx;
  height: 66rpx;
  border-radius: 14rpx;
}

.versus {
  flex-shrink: 0;
  color: #ffd879;
  font-size: 30rpx;
  font-weight: 900;
}

.featured .versus {
  font-size: 38rpx;
}

.score-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24rpx 0 18rpx;
}

.premium-zone {
  margin-top: 22rpx;
}

.premium-zone .score-zone {
  margin-top: 0;
}

.locked .locked-content {
  filter: blur(10rpx);
  opacity: 0.34;
  pointer-events: none;
  user-select: none;
}

.score {
  color: #ffffff;
  font-size: 68rpx;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 28rpx rgba(255, 216, 130, 0.24);
}

.featured .score {
  font-size: 116rpx;
  text-shadow: 0 0 36rpx rgba(255, 216, 130, 0.36);
}

.featured .score-caption {
  font-size: 23rpx;
}

.score-caption {
  margin-top: 8rpx;
  color: rgba(214, 229, 255, 0.58);
  font-size: 21rpx;
}

.candidate-line {
  margin-top: 10rpx;
  color: rgba(255, 224, 160, 0.84);
  font-size: 22rpx;
  font-weight: 900;
}

.goals-range {
  margin-top: 6rpx;
  color: rgba(214, 229, 255, 0.6);
  font-size: 20rpx;
  font-weight: 800;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.info-grid > view {
  padding: 14rpx 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 18rpx;
  background: rgba(0, 0, 0, 0.18);
}

.info-value,
.info-label {
  display: block;
  text-align: center;
}

.info-value {
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
}

.info-value.risk {
  color: #ffd879;
}

.info-label {
  margin-top: 7rpx;
  color: rgba(214, 229, 255, 0.56);
  font-size: 20rpx;
}

.analysis-btn {
  position: relative;
  z-index: 2;
  margin-top: 16rpx;
  padding: 18rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #245cff, #d62a55);
  color: #ffffff;
  text-align: center;
  font-size: 27rpx;
  font-weight: 900;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.analysis-btn:active,
.unlock-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.deep-insight {
  margin-top: 16rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 20rpx;
  background: rgba(0, 0, 0, 0.18);
}

.insight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  color: #ffe0a0;
  font-size: 22rpx;
  font-weight: 900;
}

.insight-head text + text {
  color: rgba(214, 229, 255, 0.58);
  font-size: 20rpx;
  font-weight: 700;
}

.archive-badge {
  padding: 8rpx 14rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffe0a0;
  font-size: 20rpx;
  font-weight: 900;
}

.summary-text {
  margin-top: 14rpx;
  color: rgba(237, 245, 255, 0.78);
  font-size: 23rpx;
  line-height: 1.45;
}

.prob-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 16rpx;
  padding: 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.05);
}

.prob-grid > view {
  padding: 14rpx 8rpx;
  border-radius: 14rpx;
  background: rgba(0, 0, 0, 0.16);
  text-align: center;
}

.prob-value,
.prob-label {
  display: block;
}

.prob-value {
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 900;
}

.prob-label {
  margin-top: 6rpx;
  color: rgba(214, 229, 255, 0.54);
  font-size: 19rpx;
}

.featured .analysis-btn {
  margin-top: 22rpx;
  padding: 24rpx;
  font-size: 30rpx;
  box-shadow: 0 16rpx 44rpx rgba(36, 92, 255, 0.26);
}

.post-cta-trust {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 14rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 18rpx;
  background: linear-gradient(135deg, rgba(255, 216, 130, 0.1), rgba(64, 134, 255, 0.07));
  color: rgba(255, 224, 160, 0.9);
  font-size: 21rpx;
  font-weight: 900;
}

.post-cta-trust text + text {
  color: rgba(214, 229, 255, 0.56);
  font-size: 20rpx;
  font-weight: 800;
}

.member-cover {
  position: absolute;
  inset: -4rpx;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28rpx 22rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.26);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 216, 130, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(6, 13, 30, 0.9), rgba(5, 9, 20, 0.94));
  box-shadow: inset 0 0 36rpx rgba(255, 216, 130, 0.08);
}

.member-badge {
  margin-bottom: 14rpx;
  padding: 8rpx 16rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.34);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffe0a0;
  font-size: 20rpx;
  font-weight: 900;
  box-shadow: 0 0 22rpx rgba(255, 216, 121, 0.12);
}

.lock-icon {
  position: relative;
  width: 58rpx;
  height: 58rpx;
  margin-bottom: 14rpx;
}

.lock-shackle {
  position: absolute;
  top: 1rpx;
  left: 12rpx;
  width: 34rpx;
  height: 30rpx;
  border: 5rpx solid #ffd879;
  border-bottom: 0;
  border-radius: 24rpx 24rpx 0 0;
  box-sizing: border-box;
}

.lock-body {
  position: absolute;
  left: 7rpx;
  bottom: 2rpx;
  width: 44rpx;
  height: 34rpx;
  border-radius: 10rpx;
  background: linear-gradient(135deg, #ffd879, #fff0b6);
  box-shadow: 0 0 24rpx rgba(255, 216, 121, 0.42);
}

.cover-title {
  max-width: 360rpx;
  color: #fff1c2;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.42;
  text-align: center;
}

.cover-subtitle {
  max-width: 390rpx;
  margin-top: 8rpx;
  color: rgba(238, 246, 255, 0.72);
  font-size: 23rpx;
  line-height: 1.42;
  text-align: center;
}

.unlock-btn {
  position: relative;
  z-index: 4;
  min-width: 178rpx;
  margin-top: 16rpx;
  padding: 18rpx 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 24rpx;
  font-weight: 900;
  box-shadow: 0 12rpx 34rpx rgba(255, 216, 121, 0.28);
}

@media (min-width: 900px) {
  .prediction-card.featured {
    min-height: 100%;
    padding: 32px;
  }

  .featured .team {
    font-size: 31px;
  }

  .featured .score {
    font-size: 94px;
  }
}
</style>
