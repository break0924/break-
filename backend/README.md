# AI World Cup Predictor Backend

个人级“AI世界杯预测官”后端，定位为足球数据分析、AI预测、挑战赛积分和会员内容解锁。

合规边界：

- 只提供足球数据分析、AI 内容和挑战赛积分
- 支付仅用于购买会员内容权益
- 不提供资金账户、交易撮合、票据处理、收益返还或推广收益能力
- 不提供确定性结果承诺

## Local Development

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run start:dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## MVP APIs

Authenticated endpoints use `Authorization: Bearer <accessToken>`.

- `POST /api/auth/wechat-login`
- `GET /api/me`
- `POST /api/teams`
- `GET /api/teams`
- `POST /api/matches`
- `GET /api/matches`
- `GET /api/matches/:id`
- `PATCH /api/matches/:id/result`
- `POST /api/matches/:id/ai-report`
- `POST /api/matches/:id/ai-report/generate`
- `GET /api/matches/:id/ai-report`
- `GET /api/recommendations/today`
- `POST /api/recommendations/daily/generate`
- `POST /api/admin/ai/reports/:matchId/regenerate`
- `POST /api/admin/ai/daily-recommendations/regenerate`
- `POST /api/membership/plans`
- `GET /api/membership/plans`
- `GET /api/membership/status`
- `POST /api/membership/orders`
- `GET /api/membership/orders/:id/status`
- `POST /api/wechat-pay/notify`
- `POST /api/challenge/seasons`
- `POST /api/challenge/seasons/:id/results`
- `GET /api/challenge`
- `POST /api/challenge/match-predictions`
- `POST /api/challenge/match-predictions/lock-due`
- `POST /api/challenge/tournament-pick`
- `GET /api/challenge/leaderboard`
- `GET /api/challenge/my-score`

## Challenge Scoring

- Match direction: 3 points
- Exact match score: 10 points
- Champion pick: 50 points
- Final four pick: 20 points per team
- Golden boot pick: 30 points

## AI Generation

Default local mode uses mock AI output:

```env
AI_MOCK_MODE=true
OPENAI_MODEL=gpt-4o-mini
```

To use OpenAI, set:

```env
AI_MOCK_MODE=false
OPENAI_API_KEY=your_api_key
```

Prompt files:

- `src/ai/ai.prompts.ts`
- `src/ai/ai.service.ts`

The prompt requires JSON output and rejects transaction guidance, account-fund
features, ticket-like fulfillment, reward-return mechanics, promotion-income
mechanics, and deterministic-result wording.

## Prediction Engine V1

`src/prediction-engine` contains an extendable probability engine. It does not
hide logic in a single fixed formula. Each factor is a small class implementing
the `PredictionFactor` interface, returning its own probability evidence and
reason.

Default V1 factor layer:

- ELO: 35%
- Form: 25%, combining recent 5 matches 60% and recent 10 matches 40%
- HeadToHead: 15%
- Goals: 20%, combining attacking strength and defensive strength
- AI: 5%

Output fields:

```ts
{
  homeWinProbability: number,
  drawProbability: number,
  awayWinProbability: number,
  recommendationDirection: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN',
  recommendedScore: { home: number, away: number, text: string },
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  confidenceScore: number,
  riskScore: number,
  total: 100,
  factors: FactorContribution[]
}
```

The engine combines available factor evidence by configurable weights, skips
missing factors with warnings, and uses deterministic rounding so the three
probabilities always sum to exactly `100`. The recommended score is derived from
attack, defense, recent form, and the final probability edge.

Prediction archive traceability:

- `prediction_archives.predictionTime`: exact prediction generation time.
- `prediction_archives.engineModelVersion`: prediction engine version used.
- `prediction_archives.engineWeightConfig`: factor weight configuration used.
- `prediction_archives.engineFactorScores`: all factor probabilities, weighted
  evidence, availability, and reasons.
- `prediction_archives.finalProbability`: final home/draw/away probabilities.
- `prediction_archives.originalContent`: complete immutable snapshot, including
  AI report input and prediction engine output.

This makes historical predictions reproducible even after future model changes.

## Elo Rating

`src/elo` contains the team Elo module.

- `Team.eloRating` defaults to `1500`.
- `EloCalculator` implements standard expected-score Elo updates.
- `EloUpdateService.updateTeamElo(matchResult)` updates both teams after a
  finished match.
- Updates are idempotent through `team_elo_history` unique key
  `[teamId, matchId]`.
- Manual score correction can force recalculation: existing history is reverted
  to old ratings, deleted, then recalculated from the corrected result.
- Match result sync, manual result correction, and direct match result update all
  trigger Elo updates.

## Form And Head-To-Head Engines

`src/form-engine` calculates recent form metrics from finished matches:

- recent 5 matches
- recent 10 matches
- win rate
- average goals for
- average goals against
- goal difference
- `formScore` in the `0-100` range

`src/head-to-head-engine` calculates the latest 10 meetings between the two
teams from the current fixture perspective:

- home team win rate
- draw rate
- away team win rate
- `h2hScore` in the `0-100` range

The prediction engine can consume `formScore` and `h2hScore` directly, while
still accepting raw wins/draws/losses for compatibility.

## Daily Recommendation Job

`RecommendationsService` runs every day at `04:00 Asia/Shanghai` for daily
recommendation content. `PredictionsService` stores append-only prediction
versions at `09:00 Asia/Shanghai`, `18:00 Asia/Shanghai`, and once per match
inside the 90-minute pre-match window.

Flow:

1. Select matches in the next 24 hours.
2. If fewer than 3 matches exist, expand to 48 hours.
3. Ask AI to choose up to 3 picks.
4. Store `DailyRecommendation` and `DailyRecommendationMatch`.
5. Write status to `AiGenerationLog`.

Manual trigger:

```bash
curl -X POST http://localhost:3000/api/recommendations/daily/generate \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-11"}'
```

## Prediction Version Jobs

Prediction versions are stored in `prediction_versions` and never overwrite older
records.

- Daily version: `09:00 Asia/Shanghai`, type `DAILY`.
- Evening version: `18:00 Asia/Shanghai`, type `EVENING`, focused on injuries,
  odds, news, and standings changes.
- Pre-match version: scanned every 5 minutes, type `PRE_MATCH`, generated once
  when a scheduled match is within 90 minutes of kickoff.
- Once kickoff has passed or match status is no longer `SCHEDULED`, generation is
  skipped for that match.
- Result settlement updates `actualResult`, `hitStatus`, `hitResult`,
  `hitScore`, and `hitTotalGoals`.

Manual trigger:

```bash
curl -X POST http://localhost:3000/api/admin/predictions/refresh-versions \
  -H 'Content-Type: application/json' \
  -d '{"predictionType":"DAILY","date":"2026-06-12"}'
```

Inspect versions:

```bash
curl "http://localhost:3000/api/admin/predictions/versions?type=PRE_MATCH"
```

## Match Result Sync Jobs

`ScheduleModule.forRoot()` is enabled in `src/app.module.ts`.

Current match result sync strategy:

- Low-cost hourly sync: every hour at minute 0. User-facing cron: `0 * * * *`; Nest converts this to `0 0 * * * *`.
- Scope: today's matches, live matches, and local finished matches that still need prediction or challenge settlement.
- Configure with `RESULT_SYNC_CRON=0 * * * *` and `RESULT_SYNC_ENABLE=true`.

Flow:

```text
sync external result
update Match
save MatchResult
settle AI prediction archives
settle challenge points
refresh leaderboard scores
```

Operational notes:

- Logs are stored in `result_sync_logs`.
- Per-match last sync time is stored in `match_results.syncedAt`.
- Latest local match sync time is stored in `Match.lastSyncedAt`.
- Dashboard last sync time is resolved from latest `result_sync_logs.finishedAt`.
- Non-forced sync is idempotent: prediction settlements skip existing rows and challenge points skip predictions with `scoredAt`.
- Manual correction writes a `MANUAL` match result and can force re-settlement.
- Provider timeout defaults to `FOOTBALL_DATA_TIMEOUT_MS=10000`.
- Provider retry count defaults to `FOOTBALL_DATA_RETRIES=3`.
- Provider fallback order is controlled by `FOOTBALL_DATA_PROVIDERS=API_FOOTBALL,SPORTMONKS,MANUAL`.

## Pre-Match Team Context

The football data adapter also exposes `FootballDataService.getPreMatchContext(externalMatchId)` for richer AI reports.

Low-cost V1 data inputs:

- API-Football `fixtures` for fixture and external team ids.
- API-Football `teams/statistics` for form, wins, draws, losses, goals for and goals against.
- API-Football `fixtures/lineups` and `injuries` for confirmed lineup and missing-player risk.
- API-Football `odds` for home/draw/away odds and normalized implied probabilities.

Use this context as prediction features and report input. Odds are calibration signals, not final conclusions. The `MANUAL` provider returns local match/team identity only, so the app can keep running when external keys are not configured.
