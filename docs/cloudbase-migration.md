# CloudBase MVP Migration

This step only migrates the data and API layer. It does not change the existing UI.

## Modified Frontend Files

- `frontend/src/utils/cloudbase.ts`
- `frontend/src/api/http.ts`
- `frontend/src/api/index.ts`
- `frontend/src/api/types.ts`

## Added CloudBase Files

- `cloudbaserc.json`
- `cloudfunctions/common/db.js`
- `cloudfunctions/common/home.js`
- `cloudfunctions/common/response.js`
- `cloudfunctions/homeData/index.js`
- `cloudfunctions/predictions/index.js`
- `cloudfunctions/matches/index.js`
- `cloudfunctions/member/index.js`
- `cloudfunctions/invite/index.js`
- `cloudbase/database/init-data.json`
- `cloudbase/database/indexes.md`

## Cloud Functions

- `homeData`: homepage aggregate data
- `predictions`: today predictions and historical stats
- `matches`: today match schedule
- `member`: membership status
- `invite`: invite code and invite statistics
- `admin`: minimal admin actions
- `resultSync`: hourly result sync and settlement

## Frontend Switch

Default local development still uses the existing HTTP API.

To switch to CloudBase:

```bash
VITE_DATA_SOURCE=cloudbase
VITE_CLOUDBASE_ENV=your-cloudbase-env-id
```

## Test Module 1: Frontend API Layer

1. Keep `VITE_DATA_SOURCE` empty.
2. Run the existing frontend.
3. Confirm pages still use the old HTTP API.
4. Set `VITE_DATA_SOURCE=cloudbase`.
5. In WeChat mini program runtime, call `api.homeData('2026-06-13')`.
6. Confirm it calls the `homeData` cloud function.

## Test Module 2: Cloud Functions

Deploy the functions:

```bash
tcb fn deploy homeData
tcb fn deploy predictions
tcb fn deploy matches
tcb fn deploy member
tcb fn deploy invite
```

Call `homeData` with:

```json
{
  "date": "2026-06-13"
}
```

Expected response:

- `predictions`
- `matches`
- `stats`
- `membership`
- `invite`

## Test Module 3: Database

Create collections:

- `users`
- `teams`
- `matches`
- `prediction_archives`
- `memberships`
- `invite_stats`
- `result_sync_logs`
- `admin_logs`

Import sample data from:

```text
cloudbase/database/init-data.json
```

## MVP Notes

- Payment is not migrated in this step.
- Existing NestJS backend is kept as fallback/reference.
- Existing UI and routes are unchanged.

## Step 3: Minimal Admin Capability

The admin cloud function keeps only four MVP actions:

- `generatePredictionsByDate`
- `publishPredictionsByDate`
- `syncMatchResult`
- `inviteStats`

Deploy:

```bash
tcb fn deploy admin
```

Recommended production auth:

```text
ADMIN_TOKEN=your-private-admin-token
ADMIN_OPENIDS=openid1,openid2
ALLOW_DEV_ADMIN=false
```

### Test: Generate Predictions

```json
{
  "action": "generatePredictionsByDate",
  "date": "2026-06-13",
  "adminToken": "your-private-admin-token"
}
```

Expected:

- Generates draft predictions for matches without predictions
- Skips existing predictions

### Test: Publish Predictions

```json
{
  "action": "publishPredictionsByDate",
  "date": "2026-06-13",
  "adminToken": "your-private-admin-token"
}
```

Expected:

- Draft predictions become `PUBLISHED`
- `isPublic` becomes `true`

### Test: Sync Match Result

```json
{
  "action": "syncMatchResult",
  "matchId": "match_20260613_can_bih",
  "homeScore": 1,
  "awayScore": 1,
  "adminToken": "your-private-admin-token"
}
```

Expected:

- Updates `matches`
- Writes `result_sync_logs`
- Settles related `prediction_archives`

### Test: Invite Stats

```json
{
  "action": "inviteStats",
  "adminToken": "your-private-admin-token"
}
```

Expected:

- Returns total invited count
- Returns total paid invited count
- Returns rows by user

## Step 4: Minimal Scheduled Result Sync

The `resultSync` cloud function keeps only the MVP operations:

- Hourly result sync
- Match status update
- AI prediction settlement
- Historical hit-rate stats update

It intentionally does not include:

- Complex monitoring
- Multiple data source failover
- Advanced operations dashboards

Deploy:

```bash
tcb fn deploy resultSync
```

Timer trigger in `cloudbaserc.json`:

```text
0 0 * * * * *
```

This means once every hour.

### Result Feed Contract

If `RESULT_SYNC_API_URL` is configured, the function calls:

```text
RESULT_SYNC_API_URL?date=YYYY-MM-DD
```

Expected response can be either an array or an object with `matches` / `results`:

```json
[
  {
    "matchId": "match_20260613_can_bih",
    "status": "FINISHED",
    "homeScore": 1,
    "awayScore": 1
  }
]
```

If `RESULT_SYNC_API_URL` is empty, the function still scans CloudBase `matches`.
Any match already marked `FINISHED` with `homeScore` and `awayScore` will be settled.

### Test: Run Result Sync

```json
{
  "date": "2026-06-13"
}
```

Expected:

- Updates `matches.lastSyncedAt`
- Writes `result_sync_logs`
- Updates `prediction_archives.settlement`
- Updates / creates `prediction_stats` with key `global`
