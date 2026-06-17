import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashPassword } from '../src/common/security/password';

const prisma = new PrismaClient();
const kbDir = join(__dirname, 'knowledge-base');

type KbFile<T> = {
  metadata: Record<string, unknown>;
  items: T[];
};

function readKb<T>(file: string) {
  return JSON.parse(readFileSync(join(kbDir, file), 'utf8')) as KbFile<T>;
}

function date(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

async function seedAdmin() {
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: await hashPassword('admin12345')
    },
    create: {
      username: 'admin',
      passwordHash: await hashPassword('admin12345'),
      displayName: '管理员',
      role: 'SUPER_ADMIN'
    }
  });
}

async function seedKnowledgeBase() {
  const hostCities = readKb<any>('host_cities.json').items;
  const stadiums = readKb<any>('stadiums.json').items;
  const groups = readKb<any>('groups.json').items;
  const teams = readKb<any>('teams.json').items;
  const players = readKb<any>('players.json').items;
  const matches = readKb<any>('matches.json').items;
  const history = readKb<any>('world_cup_history.json').items;
  const facts = readKb<any>('facts.json').items;

  for (const item of hostCities) {
    await prisma.worldCupHostCity.upsert({
      where: { id: item.id },
      update: hostCityData(item),
      create: hostCityData(item)
    });
  }

  for (const item of stadiums) {
    await prisma.worldCupStadium.upsert({
      where: { id: item.id },
      update: stadiumData(item),
      create: stadiumData(item)
    });
  }

  for (const item of groups) {
    await prisma.worldCupGroup.upsert({
      where: { id: item.id },
      update: groupData(item),
      create: groupData(item)
    });
  }

  for (const item of teams) {
    await prisma.worldCupTeam.upsert({
      where: { id: item.id },
      update: teamData(item),
      create: teamData(item)
    });
  }

  for (const item of players) {
    await prisma.worldCupPlayer.upsert({
      where: { id: item.id },
      update: playerData(item),
      create: playerData(item)
    });
  }

  for (const item of matches) {
    await prisma.worldCupMatch.upsert({
      where: { id: item.id },
      update: matchData(item),
      create: matchData(item)
    });
  }

  for (const item of history) {
    await prisma.worldCupHistory.upsert({
      where: { id: item.id },
      update: historyData(item),
      create: historyData(item)
    });
  }

  for (const item of facts) {
    await prisma.worldCupFact.upsert({
      where: { id: item.id },
      update: factData(item),
      create: factData(item)
    });
  }
}

function hostCityData(item: any) {
  return {
    id: item.id,
    name: item.name,
    country: item.country,
    countryCode: item.country_code,
    region: item.region,
    timezone: item.timezone,
    latitude: item.latitude,
    longitude: item.longitude,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function stadiumData(item: any) {
  return {
    id: item.id,
    name: item.name,
    fifaName: item.fifa_name,
    hostCityId: item.host_city_id,
    countryCode: item.country_code,
    capacity: item.capacity,
    latitude: item.latitude,
    longitude: item.longitude,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function groupData(item: any) {
  return {
    id: item.id,
    name: item.name,
    groupCode: item.group_code,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function teamData(item: any) {
  return {
    id: item.id,
    fifaCode: item.fifa_code,
    name: item.name,
    nameEn: item.name_en,
    countryCode: item.country_code,
    confederation: item.confederation,
    qualification: item.qualification,
    groupId: item.group_id,
    seedSlot: item.seed_slot,
    flagUrl: item.flag_url,
    imageUrl: item.image_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function playerData(item: any) {
  return {
    id: item.id,
    teamId: item.team_id,
    name: item.name,
    nameEn: item.name_en,
    shirtNumber: item.shirt_number,
    position: item.position,
    club: item.club,
    birthDate: date(item.birth_date),
    nationality: item.nationality,
    flagUrl: item.flag_url,
    imageUrl: item.image_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function matchData(item: any) {
  return {
    id: item.id,
    matchNo: item.match_no,
    stage: item.stage,
    groupId: item.group_id,
    homeTeamId: item.home_team_id,
    awayTeamId: item.away_team_id,
    homeSlot: item.home_slot,
    awaySlot: item.away_slot,
    kickoffAt: date(item.kickoff_at),
    stadiumId: item.stadium_id,
    hostCityId: item.host_city_id,
    status: item.status,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function historyData(item: any) {
  return {
    id: item.id,
    year: item.year,
    host: item.host,
    champion: item.champion,
    runnerUp: item.runner_up,
    thirdPlace: item.third_place,
    teamsCount: item.teams_count,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

function factData(item: any) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    content: item.content,
    imageUrl: item.image_url,
    flagUrl: item.flag_url,
    introduction: item.introduction,
    sourceUrl: item.source_url,
    isOfficial: item.is_official,
    lastVerifiedAt: new Date(item.last_verified_at),
    raw: item.raw,
    rag: item.rag
  };
}

async function main() {
  await seedAdmin();
  await seedKnowledgeBase();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
