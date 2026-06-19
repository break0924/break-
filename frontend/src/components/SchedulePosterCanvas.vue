<template>
  <view v-if="visible" class="poster-mask">
    <view class="poster-panel">
      <view class="panel-head">
        <view>
          <view class="panel-title">世界杯分享海报</view>
          <view class="panel-sub">统一品牌视觉，可保存分享</view>
        </view>
        <view class="close" @tap="close">关闭</view>
      </view>

      <view class="canvas-wrap">
        <view class="poster-frame" :style="posterFrameStyle">
          <image
            v-if="posterPath"
            class="poster-preview"
            :src="posterPath"
            mode="aspectFit"
            show-menu-by-longpress
          />
          <canvas
            v-show="!posterPath"
            :canvas-id="canvasId"
            :id="canvasId"
            class="poster-canvas"
            :width="POSTER_WIDTH"
            :height="POSTER_HEIGHT"
          />
        </view>
      </view>

      <view v-if="error" class="error-text">{{ error }}</view>

      <view class="actions">
        <view class="btn secondary" @tap="generatePoster">
          {{ generating ? '生成中...' : '重新生成' }}
        </view>
        <button class="share-mini" open-type="share">分享页面</button>
        <view class="btn" @tap="savePoster">
          {{ saving ? '保存中...' : '保存图片' }}
        </view>
      </view>

      <view class="fallback-tip">保存失败时，可长按预览图手动保存。</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue';
import type { Match } from '../api/types';
import { DEFAULT_FLAG, getTeamFlag } from '../utils/assets';

type PosterMode = 'today' | 'date' | 'group-overview';

type PosterGroup = {
  name: string;
  teams: Match['homeTeam'][];
};

const props = defineProps<{
  visible: boolean;
  mode: PosterMode;
  title: string;
  dateLabel: string;
  matches: Match[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const instance = getCurrentInstance();
const canvasId = `schedule-poster-${Math.random().toString(36).slice(2, 8)}`;
const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1920;
const POSTER_RATIO = POSTER_WIDTH / POSTER_HEIGHT;
const posterPath = ref('');
const generating = ref(false);
const saving = ref(false);
const error = ref('');
const previewWidth = ref(320);
const previewHeight = ref(569);

const posterFrameStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  height: `${previewHeight.value}px`,
}));

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      posterPath.value = '';
      error.value = '';
      updatePreviewSize();
      await nextTick();
      generatePoster();
    }
  },
);

function updatePreviewSize() {
  const systemInfo = uni.getSystemInfoSync();
  const runtime = globalThis as typeof globalThis & {
    document?: { documentElement?: { clientWidth?: number; clientHeight?: number } };
    innerWidth?: number;
    innerHeight?: number;
    window?: { innerWidth?: number; innerHeight?: number };
  };
  const browserWidth =
    runtime.window?.innerWidth ||
    runtime.document?.documentElement?.clientWidth ||
    runtime.innerWidth;
  const browserHeight =
    runtime.window?.innerHeight ||
    runtime.document?.documentElement?.clientHeight ||
    runtime.innerHeight;
  const windowWidth = Number(browserWidth || systemInfo.windowWidth || 375);
  const windowHeight = Number(browserHeight || systemInfo.windowHeight || 667);
  const maxWidth = Math.max(240, windowWidth - 48);
  const maxHeight = Math.max(220, windowHeight * 0.68 - 28);
  const widthByHeight = maxHeight * POSTER_RATIO;
  const width = Math.min(maxWidth, widthByHeight, 380);

  previewWidth.value = Math.round(width);
  previewHeight.value = Math.round(width / POSTER_RATIO);
}

async function generatePoster() {
  if (generating.value) {
    return;
  }

  generating.value = true;
  error.value = '';
  posterPath.value = '';
  updatePreviewSize();

  try {
    await nextTick();
    await drawPoster();
    posterPath.value = await canvasToImage();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '海报生成失败，请稍后重试';
    uni.showToast({ title: '海报生成失败', icon: 'none' });
  } finally {
    generating.value = false;
  }
}

async function savePoster() {
  if (saving.value) {
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    if (!posterPath.value) {
      await generatePoster();
    }

    if (!posterPath.value) {
      throw new Error('暂无可保存的海报');
    }

    await saveImage(posterPath.value);
    uni.showToast({ title: '已保存', icon: 'success' });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '保存失败，可长按预览图手动保存';
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

function close() {
  emit('close');
}

async function drawPoster() {
  const ctx = uni.createCanvasContext(canvasId, instance?.proxy);
  drawPosterShell(ctx);
  drawPosterHeader(ctx, posterHeader());

  if (props.mode === 'today') {
    await drawTodayPosterBody(ctx);
  } else if (props.mode === 'date') {
    await drawGroupPosterBody(ctx);
  } else {
    await drawGroupOverviewBody(ctx);
  }

  drawPosterFooter(ctx, posterFooterText());

  await new Promise<void>((resolve) => ctx.draw(false, resolve));
}

function drawPosterShell(ctx: UniApp.CanvasContext) {
  ctx.setFillStyle('#07152e');
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, '#17346f');
  gradient.addColorStop(0.45, '#0a1632');
  gradient.addColorStop(1, '#050913');
  ctx.setFillStyle(gradient);
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  drawPosterAtmosphere(ctx);
}

function drawPosterHeader(
  ctx: UniApp.CanvasContext,
  header: { eyebrow: string; title: string; subtitle: string; tag: string },
) {
  drawText(ctx, 'AI世界杯预测官', 72, 102, 34, '#ffd98a', 'bold');
  drawText(ctx, header.eyebrow, 72, 166, 30, '#8fb4ff', 'bold');
  drawText(ctx, header.title, 72, 258, 64, '#ffffff', 'bold');
  drawText(ctx, header.subtitle, 72, 326, 36, '#dbe7ff', 'normal');
  drawText(ctx, header.tag, 760, 112, 30, '#10141e', 'bold', '#ffd98a');
}

async function drawTodayPosterBody(ctx: UniApp.CanvasContext) {
  const listTop = 430;
  const visibleMatches = props.matches.slice(0, 4);
  drawSectionCard(ctx, listTop, 860, '今日重点比赛', `${props.matches.length} 场`);

  if (visibleMatches.length === 0) {
    drawEmptyState(ctx, 90, listTop + 120);
  } else {
    for (let index = 0; index < visibleMatches.length; index += 1) {
      await drawMatchRow(ctx, visibleMatches[index], 90, listTop + 108 + index * 172);
    }
  }

  drawInfoStrip(ctx, [`今日共 ${props.matches.length} 场`, '赛前预测已更新', '查看完整分析'], 1360);
}

async function drawGroupPosterBody(ctx: UniApp.CanvasContext) {
  const groups = buildGroups().slice(0, 12);
  drawSectionCard(ctx, 430, 850, 'A-L 组球队分布', `${groups.length} 组`);

  for (let index = 0; index < groups.length; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    await drawGroupCard(ctx, groups[index], 90 + column * 310, 540 + row * 170, 286, 145);
  }

  drawInfoStrip(ctx, ['48 支球队', '12 个小组', '小组赛全面开启'], 1360);
}

async function drawGroupOverviewBody(ctx: UniApp.CanvasContext) {
  const groups = buildGroups().slice(0, 12);
  drawSectionCard(ctx, 430, 760, '分组概览', 'A-L 组');

  for (let index = 0; index < groups.length; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    await drawCompactGroupCard(ctx, groups[index], 86 + column * 238, 540 + row * 145);
  }

  drawTimeline(ctx, 1060);
  drawInfoStrip(ctx, ['分组信息', '赛程阶段', '关键节点'], 1360);
}

function drawPosterAtmosphere(ctx: UniApp.CanvasContext) {
  ctx.save();
  ctx.setGlobalAlpha(0.11);
  ctx.setFillStyle('#4a7dff');
  ctx.beginPath();
  ctx.arc(90, 118, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.setFillStyle('#f7ba3e');
  ctx.beginPath();
  ctx.arc(1060, 70, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.setGlobalAlpha(0.16);
  ctx.setStrokeStyle('#ffffff');
  ctx.setLineWidth(3);
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.moveTo(60 + index * 180, 370);
    ctx.lineTo(230 + index * 180, 245);
    ctx.stroke();
  }
  ctx.restore();
}

async function drawMatchRow(
  ctx: UniApp.CanvasContext,
  match: Match,
  x: number,
  y: number,
) {
  drawRoundRect(ctx, x, y, 900, 142, 26, 'rgba(8,18,42,0.9)');
  drawRoundRect(ctx, x + 18, y + 24, 126, 94, 20, 'rgba(255,217,138,0.1)');
  drawText(ctx, matchTime(match), x + 38, y + 68, 40, '#ffd98a', 'bold');
  drawText(ctx, compactStageLabel(match), x + 38, y + 105, 22, '#8798c4', 'normal');

  await drawFlag(ctx, match.homeTeam, x + 204, y + 46, 62, 42);
  drawText(ctx, truncateText(match.homeTeam.name, 7), x + 282, y + 78, 34, '#ffffff', 'bold');
  drawText(ctx, matchCenterText(match), x + 474, y + 82, 36, '#ffd98a', 'bold');
  await drawFlag(ctx, match.awayTeam, x + 582, y + 46, 62, 42);
  drawText(ctx, truncateText(match.awayTeam.name, 7), x + 660, y + 78, 34, '#ffffff', 'bold');

  drawText(ctx, statusText(match), x + 704, y + 116, 22, '#10141e', 'bold', statusColor(match));
}

function drawSectionCard(
  ctx: UniApp.CanvasContext,
  y: number,
  height: number,
  title: string,
  badge: string,
) {
  drawRoundRect(ctx, 54, y - 30, 972, height, 36, 'rgba(255,255,255,0.075)');
  drawText(ctx, title, 90, y + 22, 40, '#ffffff', 'bold');
  drawText(ctx, badge, 828, y + 22, 30, '#ffd98a', 'bold');
}

function drawEmptyState(ctx: UniApp.CanvasContext, x: number, y: number) {
  drawRoundRect(ctx, x, y, 900, 240, 30, 'rgba(255,255,255,0.08)');
  drawText(ctx, '暂无赛程数据', x + 46, y + 106, 46, '#ffffff', 'bold');
  drawText(ctx, '请稍后重试或切换日期生成海报', x + 46, y + 166, 32, '#aebce0', 'normal');
}

async function drawGroupCard(
  ctx: UniApp.CanvasContext,
  group: PosterGroup,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawRoundRect(ctx, x, y, width, height, 18, 'rgba(8,18,42,0.88)');
  drawText(ctx, normalizeGroupName(group.name), x + 20, y + 36, 28, '#ffd98a', 'bold');

  for (let index = 0; index < group.teams.slice(0, 4).length; index += 1) {
    const team = group.teams[index];
    const teamY = y + 66 + index * 28;
    await drawFlag(ctx, team, x + 20, teamY - 19, 32, 22);
    drawText(ctx, truncateText(team.name, 6), x + 64, teamY, 21, '#f7fbff', 'bold');
  }
}

async function drawCompactGroupCard(
  ctx: UniApp.CanvasContext,
  group: PosterGroup,
  x: number,
  y: number,
) {
  drawRoundRect(ctx, x, y, 215, 118, 20, 'rgba(8,18,42,0.88)');
  drawText(ctx, normalizeGroupName(group.name), x + 16, y + 34, 24, '#ffd98a', 'bold');
  const names = group.teams
    .slice(0, 4)
    .map((team) => truncateText(team.name, 4))
    .join(' / ');
  drawText(ctx, names, x + 16, y + 76, 18, '#dbe7ff', 'normal');
}

function drawTimeline(ctx: UniApp.CanvasContext, y: number) {
  const steps = ['小组赛', '32强', '16强', '8强', '半决赛', '决赛'];
  drawRoundRect(ctx, 54, y - 42, 972, 154, 34, 'rgba(255,255,255,0.075)');
  drawText(ctx, '赛事阶段时间轴', 90, y + 8, 34, '#ffffff', 'bold');

  for (let index = 0; index < steps.length; index += 1) {
    const x = 105 + index * 150;
    drawRoundRect(ctx, x, y + 44, 108, 48, 999, index === 0 ? '#ffd98a' : 'rgba(255,255,255,0.11)');
    drawText(ctx, steps[index], x + 14, y + 78, 22, index === 0 ? '#10141e' : '#dbe7ff', 'bold');
    if (index < steps.length - 1) {
      ctx.setStrokeStyle('rgba(255,255,255,0.2)');
      ctx.setLineWidth(3);
      ctx.beginPath();
      ctx.moveTo(x + 116, y + 68);
      ctx.lineTo(x + 144, y + 68);
      ctx.stroke();
    }
  }
}

async function drawFlag(
  ctx: UniApp.CanvasContext,
  team: Match['homeTeam'],
  x: number,
  y: number,
  width = 40,
  height = 28,
) {
  const src = getTeamFlag(team) || DEFAULT_FLAG;
  try {
    const image = await getImageInfo(src);
    ctx.drawImage(image.path, x, y, width, height);
  } catch {
    drawRoundRect(ctx, x, y, width, height, 4, 'rgba(255,255,255,0.14)');
    drawText(ctx, team.countryCode || team.fifaCode, x + 4, y + height - 5, 11, '#f4fbf8', 'bold');
  }
}

function drawInfoStrip(ctx: UniApp.CanvasContext, items: string[], y: number) {
  drawRoundRect(ctx, 72, y, 936, 122, 28, 'rgba(255,255,255,0.08)');
  const positions = [112, 414, 730];
  items.slice(0, 3).forEach((item, index) => {
    drawInfoItem(ctx, item, positions[index], y + 74);
  });
}

function drawInfoItem(
  ctx: UniApp.CanvasContext,
  text: string,
  x: number,
  y: number,
) {
  ctx.setFillStyle('#ffd98a');
  ctx.fillRect(x, y - 24, 10, 10);
  drawText(ctx, text, x + 24, y, 30, '#dbe7ff', 'bold');
}

function drawMiniProgramCode(ctx: UniApp.CanvasContext) {
  drawRoundRect(ctx, 72, 1570, 190, 190, 24, '#f4fbf8');
  ctx.setStrokeStyle('#071814');
  ctx.setLineWidth(8);
  ctx.strokeRect(106, 1604, 42, 42);
  ctx.strokeRect(190, 1604, 42, 42);
  ctx.strokeRect(106, 1688, 42, 42);
  ctx.setFillStyle('#071814');
  ctx.fillRect(160, 1658, 24, 24);
  ctx.fillRect(194, 1676, 20, 20);
  ctx.fillRect(158, 1710, 22, 22);
  ctx.fillRect(228, 1718, 18, 18);
}

function drawPosterFooter(ctx: UniApp.CanvasContext, guide: string) {
  drawRoundRect(ctx, 54, 1510, 972, 320, 36, 'rgba(255,255,255,0.055)');
  drawMiniProgramCode(ctx);
  drawText(ctx, 'AI世界杯预测官', 318, 1616, 42, '#ffffff', 'bold');
  drawText(ctx, guide, 318, 1670, 30, '#aebce0', 'normal');
  drawText(ctx, '长按保存海报，进入小程序查看完整内容', 318, 1720, 28, '#ffd98a', 'bold');
  drawText(ctx, 'AI分析仅供参考', 72, 1840, 26, 'rgba(219,231,255,0.62)', 'normal');
  drawText(ctx, '足球比赛存在临场不确定性，不承诺结果。', 72, 1878, 24, 'rgba(219,231,255,0.5)', 'normal');
}

function drawRoundRect(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.setFillStyle(fillStyle);
  ctx.fill();
}

function drawText(
  ctx: UniApp.CanvasContext,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight: 'normal' | 'bold',
  background?: string,
) {
  const value = text || '';
  if (background) {
    const backgroundWidth = Math.min(value.length * size * 0.9 + 28, 340);
    drawRoundRect(ctx, x - 14, y - size - 10, backgroundWidth, size + 26, 999, background);
  }
  ctx.setFillStyle(color);
  ctx.setFontSize(size);
  ctx.setTextBaseline('normal');
  ctx.font = `${weight === 'bold' ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillText(value, x, y);
}

function matchTime(match: Match) {
  if (match.kickoffTime) {
    return match.kickoffTime;
  }

  const date = new Date(match.kickoffAt);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function posterHeader() {
  if (props.mode === 'date') {
    return {
      eyebrow: 'GROUP DRAW',
      title: '2026 世界杯当前分组',
      subtitle: 'A-L 组球队分布总览',
      tag: '48支球队',
    };
  }

  if (props.mode === 'group-overview') {
    return {
      eyebrow: 'GROUP STAGE',
      title: '2026 世界杯小组赛总览',
      subtitle: '分组信息、赛程阶段与关键节点',
      tag: '阶段总览',
    };
  }

  return {
    eyebrow: 'TODAY MATCHES',
    title: '2026 世界杯今日赛程',
    subtitle: '北京时间 / 今日重点比赛安排',
    tag: '预测已更新',
  };
}

function posterFooterText() {
  if (props.mode === 'date') {
    return '进入小程序查看完整分组与赛程';
  }

  if (props.mode === 'group-overview') {
    return '进入小程序查看赛程、预测与挑战';
  }

  return '进入小程序查看完整分析';
}

function buildGroups(): PosterGroup[] {
  const groupMap = new Map<string, Map<string, Match['homeTeam']>>();

  for (const match of props.matches) {
    const groupName = normalizeGroupName(match.groupName || match.homeTeam.groupName || '其他');
    const teams = groupMap.get(groupName) || new Map<string, Match['homeTeam']>();
    teams.set(match.homeTeam.id, match.homeTeam);
    teams.set(match.awayTeam.id, match.awayTeam);
    groupMap.set(groupName, teams);
  }

  return Array.from(groupMap.entries())
    .map(([name, teams]) => ({
      name,
      teams: Array.from(teams.values()).slice(0, 4),
    }))
    .sort((a, b) => groupOrder(a.name) - groupOrder(b.name));
}

function groupOrder(name: string) {
  const letter = name.replace('组', '').trim().charAt(0);
  const index = 'ABCDEFGHIJKL'.indexOf(letter);
  return index >= 0 ? index : 99;
}

function compactStageLabel(match: Match) {
  const stage = stageLabel(match.stage);
  return match.groupName ? `${normalizeGroupName(match.groupName)} / ${stage}` : stage;
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    GROUP: '小组赛',
    ROUND_OF_32: '32强',
    ROUND_OF_16: '16强',
    QUARTER_FINAL: '8强',
    SEMI_FINAL: '半决赛',
    THIRD_PLACE: '三四名决赛',
    FINAL: '决赛',
  };
  return map[stage] || stage;
}

function normalizeGroupName(value: string) {
  return value.endsWith('组') ? value : `${value}组`;
}

function matchCenterText(match: Match) {
  if (
    match.status === 'FINISHED' &&
    match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined
  ) {
    return `${match.homeScore}-${match.awayScore}`;
  }
  return 'VS';
}

function statusText(match: Match) {
  const map: Record<string, string> = {
    SCHEDULED: '未开始',
    LIVE: '进行中',
    FINISHED: '已结束',
    POSTPONED: '已延期',
    CANCELLED: '已取消',
  };
  return map[String(match.status)] || String(match.status || '待定');
}

function statusColor(match: Match) {
  if (match.status === 'LIVE') {
    return '#7bd9ff';
  }
  if (match.status === 'FINISHED') {
    return '#d7deef';
  }
  return '#ffd98a';
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}

function getImageInfo(src: string) {
  return new Promise<UniApp.GetImageInfoSuccessData>((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject,
    });
  });
}

function canvasToImage() {
  return new Promise<string>((resolve, reject) => {
    uni.canvasToTempFilePath(
      {
        canvasId,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        destWidth: POSTER_WIDTH,
        destHeight: POSTER_HEIGHT,
        success: (res) => resolve(res.tempFilePath),
        fail: reject,
      },
      instance?.proxy,
    );
  });
}

function saveImage(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: reject,
    });
  });
}
</script>

<style scoped>
.poster-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.62);
}

.poster-panel {
  width: 100%;
  max-height: 92vh;
  padding: 24rpx;
  border-radius: 24rpx 24rpx 0 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(74, 125, 255, 0.18), transparent 34%),
    linear-gradient(180deg, #081631 0%, #050b18 100%);
  box-sizing: border-box;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.panel-title {
  color: #f7fbff;
  font-size: 32rpx;
  font-weight: 850;
}

.panel-sub,
.fallback-tip,
.error-text {
  margin-top: 8rpx;
  color: #9fb2ad;
  font-size: 23rpx;
}

.error-text {
  color: #ffd0a6;
}

.close {
  flex: 0 0 auto;
  color: #ffd98a;
  font-size: 26rpx;
  font-weight: 760;
}

.canvas-wrap {
  height: min(68vh, 1180rpx);
  min-height: 220px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 22rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.055);
  box-sizing: border-box;
}

.poster-frame {
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 18rpx;
  box-shadow: 0 18rpx 54rpx rgba(0, 0, 0, 0.32);
  background: #07152e;
}

.poster-canvas,
.poster-preview {
  width: 100%;
  height: 100%;
  display: block;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
  margin-top: 22rpx;
}

.btn {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-size: 26rpx;
  font-weight: 850;
}

.btn.secondary {
  color: #e7efff;
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.1);
}

.share-mini {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  border-radius: 16rpx;
  color: #e7efff;
  background: rgba(255, 255, 255, 0.1);
  font-size: 26rpx;
  font-weight: 760;
  line-height: 76rpx;
}

.share-mini::after {
  border: 0;
}
</style>
