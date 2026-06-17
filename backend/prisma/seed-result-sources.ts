import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resultSources = [
  {
    code: 'football-data-api',
    name: 'Football Data API',
    provider: 'football-data',
    baseUrl: 'https://api.football-data.org/v4',
    apiKeyEnv: 'FOOTBALL_DATA_API_KEY',
    isActive: false,
    priority: 100,
    pollingCron: '0 */10 * * * *',
    requestTimeoutMs: 10000,
    config: {
      competitionCode: 'WC',
      season: 2026,
      note: 'Enable after confirming provider World Cup 2026 coverage and terms.',
    },
  },
  {
    code: 'api-football',
    name: 'API-Football',
    provider: 'api-football',
    baseUrl: 'https://v3.football.api-sports.io',
    apiKeyEnv: 'API_FOOTBALL_KEY',
    isActive: false,
    priority: 200,
    pollingCron: '0 */10 * * * *',
    requestTimeoutMs: 10000,
    config: {
      leagueId: null,
      season: 2026,
      note: 'Set leagueId after provider publishes the 2026 World Cup competition id.',
    },
  },
];

export async function seedResultDataSources(client = prisma) {
  for (const source of resultSources) {
    await client.resultDataSourceConfig.upsert({
      where: { code: source.code },
      update: source,
      create: source,
    });
  }
}

if (require.main === module) {
  seedResultDataSources()
    .then(async () => {
      console.log({ seeded: resultSources.length });
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
