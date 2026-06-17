# Local npm

This workspace ships a local npm wrapper because the Codex app runtime exposes
`node` but not `npm`.

From the repository root:

```bash
.tools/bin/npm --version
```

For backend commands:

```bash
cd backend
../.tools/bin/npm install
../.tools/bin/npm run prisma:generate
../.tools/bin/npm run build
```
