import { Prisma, PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

type KbEntity = {
  id: string;
  name?: string;
  title?: string;
  summary?: string;
  imageUrl?: string | null;
  flagUrl?: string | null;
  worldCupIntro?: string;
  ragText?: string;
  tags?: string[];
  [key: string]: unknown;
};

const kbDir = join(__dirname, "worldcup-kb");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(kbDir, file), "utf8")) as T;
}

function titleOf(entity: KbEntity) {
  return entity.title || entity.name || entity.id;
}

function embeddingTextOf(entity: KbEntity) {
  return [
    titleOf(entity),
    entity.worldCupIntro,
    entity.ragText,
    Array.isArray(entity.tags) ? entity.tags.join(" ") : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function upsertKbDocument(
  prisma: PrismaClient,
  type: string,
  entity: KbEntity,
) {
  await prisma.knowledgeBaseDocument.upsert({
    where: { sourceKey: entity.id },
    update: {
      type,
      title: titleOf(entity),
      summary: entity.summary || entity.worldCupIntro || null,
      content: entity as Prisma.InputJsonValue,
      imageUrl: entity.imageUrl || null,
      flagUrl: entity.flagUrl || null,
      embeddingText: embeddingTextOf(entity),
      tags: entity.tags || [],
    },
    create: {
      sourceKey: entity.id,
      type,
      title: titleOf(entity),
      summary: entity.summary || entity.worldCupIntro || null,
      content: entity as Prisma.InputJsonValue,
      imageUrl: entity.imageUrl || null,
      flagUrl: entity.flagUrl || null,
      embeddingText: embeddingTextOf(entity),
      tags: entity.tags || [],
    },
  });
}

export async function seedWorldCupKnowledgeBase(prisma: PrismaClient) {
  const groups = loadJson<
    Array<
      KbEntity & {
        code: string;
        name: string;
      }
    >
  >("groups.json");
  const teams = loadJson<
    Array<
      KbEntity & {
        fifaCode: string;
        countryCode: string;
        name: string;
        nameEn?: string;
        groupName?: string;
        flagUrl?: string;
      }
    >
  >("teams.json");
  const players = loadJson<
    Array<
      KbEntity & {
        teamFifaCode: string;
        name: string;
        nameEn?: string;
        position?: string;
        isKey?: boolean;
      }
    >
  >("players.json");
  const matches = loadJson<
    Array<
      KbEntity & {
        externalId: string;
        stage: string;
        groupCode?: string | null;
        homeTeamFifaCode?: string | null;
        awayTeamFifaCode?: string | null;
        kickoffAt?: string | null;
        venue?: string | null;
        hostCityId?: string | null;
      }
    >
  >("matches.json");
  const hostCities = loadJson<
    Array<
      KbEntity & {
        id: string;
        name: string;
      }
    >
  >("host_cities.json");

  const cityById = new Map(hostCities.map((city) => [city.id, city.name]));
  const groupByCode = new Map<string, { id: string; code: string; name: string }>();

  for (const [index, group] of groups.entries()) {
    const record = await prisma.worldCupGroup.upsert({
      where: { code: group.code },
      update: {
        name: group.name,
        sortOrder: index + 1,
      },
      create: {
        code: group.code,
        name: group.name,
        sortOrder: index + 1,
      },
    });
    groupByCode.set(record.code, record);
  }

  for (const team of teams) {
    const groupCode = team.groupName || String(team.groupCode || "");
    const group = groupByCode.get(groupCode);
    await prisma.team.upsert({
      where: { fifaCode: team.fifaCode },
      update: {
        countryCode: team.countryCode,
        name: team.name,
        nameEn: team.nameEn,
        groupId: group?.id,
        groupName: team.groupName,
        flagUrl: team.flagUrl,
      },
      create: {
        fifaCode: team.fifaCode,
        countryCode: team.countryCode,
        name: team.name,
        nameEn: team.nameEn,
        groupId: group?.id,
        groupName: team.groupName,
        flagUrl: team.flagUrl,
      },
    });
    await upsertKbDocument(prisma, "team", team);
  }

  const teamRecords = await prisma.team.findMany();
  const teamByFifa = new Map(teamRecords.map((team) => [team.fifaCode, team]));

  for (const player of players) {
    const team = teamByFifa.get(player.teamFifaCode);
    if (!team) {
      continue;
    }

    await prisma.player.upsert({
      where: {
        teamId_name: {
          teamId: team.id,
          name: player.name,
        },
      },
      update: {
        nameEn: player.nameEn,
        position: player.position,
        isKey: player.isKey ?? true,
      },
      create: {
        teamId: team.id,
        name: player.name,
        nameEn: player.nameEn,
        position: player.position,
        isKey: player.isKey ?? true,
      },
    });
    await upsertKbDocument(prisma, "player", player);
  }

  for (const match of matches) {
    if (match.homeTeamFifaCode && match.awayTeamFifaCode && match.kickoffAt) {
      const homeTeam = teamByFifa.get(match.homeTeamFifaCode);
      const awayTeam = teamByFifa.get(match.awayTeamFifaCode);
      if (homeTeam && awayTeam) {
        const kickoffAt = new Date(match.kickoffAt);
        const matchDate = new Date(
          Date.UTC(
            kickoffAt.getUTCFullYear(),
            kickoffAt.getUTCMonth(),
            kickoffAt.getUTCDate(),
          ),
        );
        const kickoffTime = `${String(kickoffAt.getUTCHours()).padStart(
          2,
          "0",
        )}:${String(kickoffAt.getUTCMinutes()).padStart(2, "0")}`;
        const group = match.groupCode
          ? groupByCode.get(match.groupCode)
          : undefined;
        const scheduleFields = {
          stage: match.stage as never,
          groupId: group?.id,
          groupName: match.groupCode || undefined,
          matchDate,
          kickoffTime,
          timezone: "UTC",
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          kickoffAt,
          lockAt: kickoffAt,
          venue: match.venue || undefined,
          city: match.hostCityId
            ? cityById.get(match.hostCityId) || undefined
            : undefined,
          roundName: roundNameOf(match.stage),
        };
        await prisma.match.upsert({
          where: { externalId: match.externalId },
          update: scheduleFields,
          create: {
            externalId: match.externalId,
            ...scheduleFields,
          },
        });
      }
    }
    await upsertKbDocument(prisma, "match", match);
  }

  const documentFiles: Array<[string, string]> = [
    ["groups.json", "group"],
    ["stadiums.json", "stadium"],
    ["host_cities.json", "host-city"],
    ["world_cup_history.json", "history"],
    ["facts.json", "fact"],
  ];

  for (const [file, type] of documentFiles) {
    const entities = loadJson<KbEntity[]>(file);
    for (const entity of entities) {
      await upsertKbDocument(prisma, type, entity);
    }
  }
}

function roundNameOf(stage: string) {
  const names: Record<string, string> = {
    GROUP: "小组赛",
    ROUND_OF_32: "32强赛",
    ROUND_OF_16: "16强赛",
    QUARTER_FINAL: "1/4决赛",
    SEMI_FINAL: "半决赛",
    THIRD_PLACE: "三四名决赛",
    FINAL: "决赛",
  };

  return names[stage] || stage;
}

if (require.main === module) {
  const prisma = new PrismaClient();

  seedWorldCupKnowledgeBase(prisma)
    .then(async () => {
      await prisma.$disconnect();
      console.log("World Cup knowledge base seed completed.");
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
