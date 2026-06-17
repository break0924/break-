# CloudBase Database Indexes

Create these indexes before traffic grows:

- `users`: `openId`
- `users`: `inviteCode`
- `matches`: `matchDate`, `kickoffTime`
- `prediction_archives`: `matchId`, `status`, `isPublic`
- `invite_stats`: `userId`
- `result_sync_logs`: `matchId`, `syncedAt`
- `admin_logs`: `createdAt`
- `prediction_stats`: `key`

For the MVP admin function:

- `prediction_archives`: `matchId`
- `matches`: `_id`
