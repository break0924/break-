import {
  MatchStatus,
  PrismaClient,
  TournamentStage,
} from "@prisma/client";

export type GroupStageSeedMatch = {
  groupName: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  timezone: "Asia/Shanghai";
  stage: "GROUP_STAGE";
  status: "SCHEDULED";
  TODO?: string;
};

export const seedMatchesByDate: Record<string, GroupStageSeedMatch[]> = {
  "2026-06-12": [
    groupMatch("A", "墨西哥", "南非", "03:00"),
    groupMatch("A", "韩国", "捷克", "10:00"),
  ],
  "2026-06-13": [
    groupMatch("B", "加拿大", "波黑", "03:00"),
    groupMatch("D", "美国", "巴拉圭", "09:00"),
  ],
  "2026-06-14": [
    groupMatch("B", "卡塔尔", "瑞士", "03:00"),
    groupMatch("C", "巴西", "摩洛哥", "06:00"),
    groupMatch("C", "海地", "苏格兰", "09:00"),
    groupMatch("D", "澳大利亚", "土耳其", "12:00"),
  ],
  "2026-06-15": [
    groupMatch("E", "德国", "库拉索", "01:00"),
    groupMatch("F", "荷兰", "日本", "04:00"),
    groupMatch("E", "科特迪瓦", "厄瓜多尔", "07:00"),
    groupMatch("F", "瑞典", "突尼斯", "10:00"),
  ],
  "2026-06-16": [
    groupMatch("H", "西班牙", "佛得角", "00:00"),
    groupMatch("G", "比利时", "埃及", "03:00"),
    groupMatch("H", "沙特阿拉伯", "乌拉圭", "06:00"),
    groupMatch("G", "伊朗", "新西兰", "09:00"),
  ],
  "2026-06-17": [
    groupMatch("I", "法国", "塞内加尔", "03:00"),
    groupMatch("I", "伊拉克", "挪威", "06:00"),
    groupMatch("J", "阿根廷", "阿尔及利亚", "09:00"),
    groupMatch("J", "奥地利", "约旦", "12:00"),
  ],
  "2026-06-18": [
    groupMatch("K", "葡萄牙", "刚果民主共和国", "01:00"),
    groupMatch("L", "英格兰", "克罗地亚", "04:00"),
    groupMatch("L", "加纳", "巴拿马", "07:00"),
    groupMatch("K", "乌兹别克斯坦", "哥伦比亚", "10:00"),
  ],
  "2026-06-19": [
    groupMatch("A", "捷克", "南非", "00:00"),
    groupMatch("B", "瑞士", "波黑", "03:00"),
    groupMatch("B", "加拿大", "卡塔尔", "06:00"),
    groupMatch("A", "墨西哥", "韩国", "09:00"),
  ],
  "2026-06-20": [
    groupMatch("D", "美国", "澳大利亚", "03:00"),
    groupMatch("C", "苏格兰", "摩洛哥", "06:00"),
    groupMatch("C", "巴西", "海地", "09:00"),
    groupMatch("D", "土耳其", "巴拉圭", "12:00"),
  ],
  "2026-06-21": [
    groupMatch("F", "荷兰", "瑞典", "01:00"),
    groupMatch("E", "德国", "科特迪瓦", "04:00"),
    groupMatch("E", "厄瓜多尔", "库拉索", "08:00"),
    groupMatch("F", "突尼斯", "日本", "12:00"),
  ],
  "2026-06-22": [
    groupMatch("H", "西班牙", "沙特阿拉伯", "00:00"),
    groupMatch("G", "比利时", "伊朗", "03:00"),
    groupMatch("H", "乌拉圭", "佛得角", "06:00"),
    groupMatch("G", "新西兰", "埃及", "09:00"),
  ],
  "2026-06-23": [
    groupMatch("J", "阿根廷", "奥地利", "01:00"),
    groupMatch("I", "法国", "伊拉克", "05:00"),
    groupMatch("I", "挪威", "塞内加尔", "08:00"),
    groupMatch("J", "约旦", "阿尔及利亚", "11:00"),
  ],
  "2026-06-24": [
    groupMatch("K", "葡萄牙", "乌兹别克斯坦", "01:00"),
    groupMatch("L", "英格兰", "加纳", "04:00"),
    groupMatch("L", "巴拿马", "克罗地亚", "07:00"),
    groupMatch("K", "哥伦比亚", "刚果民主共和国", "10:00"),
  ],
  "2026-06-25": [
    groupMatch("B", "瑞士", "加拿大", "03:00"),
    groupMatch("B", "波黑", "卡塔尔", "03:00"),
    groupMatch("C", "苏格兰", "巴西", "06:00"),
    groupMatch("C", "摩洛哥", "海地", "06:00"),
    groupMatch("A", "捷克", "墨西哥", "09:00"),
    groupMatch("A", "南非", "韩国", "09:00"),
  ],
  "2026-06-26": [
    groupMatch("E", "库拉索", "科特迪瓦", "04:00"),
    groupMatch("E", "厄瓜多尔", "德国", "04:00"),
    groupMatch("F", "日本", "瑞典", "07:00"),
    groupMatch("F", "突尼斯", "荷兰", "07:00"),
    groupMatch("D", "土耳其", "美国", "10:00"),
    groupMatch("D", "巴拉圭", "澳大利亚", "10:00"),
  ],
  "2026-06-27": [
    groupMatch("I", "挪威", "法国", "03:00"),
    groupMatch("I", "塞内加尔", "伊拉克", "03:00"),
    groupMatch("H", "佛得角", "沙特阿拉伯", "08:00"),
    groupMatch("H", "乌拉圭", "西班牙", "08:00"),
    groupMatch("G", "埃及", "伊朗", "11:00"),
    groupMatch("G", "新西兰", "比利时", "11:00"),
  ],
  "2026-06-28": [
    groupMatch("L", "巴拿马", "英格兰", "05:00"),
    groupMatch("L", "克罗地亚", "加纳", "05:00"),
    groupMatch("K", "哥伦比亚", "葡萄牙", "07:30"),
    groupMatch("K", "刚果民主共和国", "乌兹别克斯坦", "07:30"),
    groupMatch("J", "阿尔及利亚", "奥地利", "10:00"),
    groupMatch("J", "约旦", "阿根廷", "10:00"),
  ],
};

export const seedMatches = Object.entries(seedMatchesByDate).flatMap(
  ([matchDate, matches]) =>
    matches.map((match, index) => ({
      ...match,
      matchDate,
      matchNoOfDay: index + 1,
    })),
);

const teamFifaCodeByName: Record<string, string> = {
  墨西哥: "MEX",
  南非: "RSA",
  韩国: "KOR",
  捷克: "CZE",
  加拿大: "CAN",
  波黑: "BIH",
  卡塔尔: "QAT",
  瑞士: "SUI",
  巴西: "BRA",
  海地: "HAI",
  摩洛哥: "MAR",
  苏格兰: "SCO",
  美国: "USA",
  澳大利亚: "AUS",
  巴拉圭: "PAR",
  土耳其: "TUR",
  德国: "GER",
  库拉索: "CUW",
  科特迪瓦: "CIV",
  厄瓜多尔: "ECU",
  荷兰: "NED",
  日本: "JPN",
  瑞典: "SWE",
  突尼斯: "TUN",
  比利时: "BEL",
  埃及: "EGY",
  伊朗: "IRN",
  新西兰: "NZL",
  西班牙: "ESP",
  佛得角: "CPV",
  沙特阿拉伯: "KSA",
  乌拉圭: "URU",
  法国: "FRA",
  伊拉克: "IRQ",
  挪威: "NOR",
  塞内加尔: "SEN",
  阿根廷: "ARG",
  阿尔及利亚: "ALG",
  奥地利: "AUT",
  约旦: "JOR",
  哥伦比亚: "COL",
  刚果民主共和国: "COD",
  葡萄牙: "POR",
  乌兹别克斯坦: "UZB",
  英格兰: "ENG",
  克罗地亚: "CRO",
  加纳: "GHA",
  巴拿马: "PAN",
};

function groupMatch(
  groupName: string,
  homeTeam: string,
  awayTeam: string,
  kickoffTime: string,
  TODO?: string,
): GroupStageSeedMatch {
  return {
    groupName,
    homeTeam,
    awayTeam,
    kickoffTime,
    timezone: "Asia/Shanghai",
    stage: "GROUP_STAGE",
    status: "SCHEDULED",
    ...(TODO ? { TODO } : {}),
  };
}

export async function importGroupStageMatches(prisma: PrismaClient) {
  let imported = 0;

  for (const match of seedMatches) {
    const homeFifaCode = teamFifaCodeByName[match.homeTeam];
    const awayFifaCode = teamFifaCodeByName[match.awayTeam];

    if (!homeFifaCode || !awayFifaCode) {
      throw new Error(
        `Missing team fifa code for ${match.homeTeam} vs ${match.awayTeam}`,
      );
    }

    const [homeTeam, awayTeam, group] = await Promise.all([
      prisma.team.findUnique({ where: { fifaCode: homeFifaCode } }),
      prisma.team.findUnique({ where: { fifaCode: awayFifaCode } }),
      prisma.worldCupGroup.upsert({
        where: { code: match.groupName },
        update: {
          name: `${match.groupName}组`,
          sortOrder: groupSortOrder(match.groupName),
        },
        create: {
          code: match.groupName,
          name: `${match.groupName}组`,
          sortOrder: groupSortOrder(match.groupName),
        },
      }),
    ]);

    if (!homeTeam || !awayTeam) {
      throw new Error(
        `Missing seed team before importing match: ${match.homeTeam} vs ${match.awayTeam}`,
      );
    }

    const kickoffAt = new Date(
      `${match.matchDate}T${match.kickoffTime}:00+08:00`,
    );
    const predictionLockAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000);
    const matchDate = new Date(`${match.matchDate}T00:00:00.000Z`);
    const externalId = `WC2026-GS-${match.matchDate.replaceAll(
      "-",
      "",
    )}-${String(match.matchNoOfDay).padStart(2, "0")}`;

    await prisma.match.upsert({
      where: { externalId },
      update: {
        stage: TournamentStage.GROUP,
        groupId: group.id,
        groupName: match.groupName,
        matchDate,
        kickoffTime: match.kickoffTime,
        timezone: match.timezone,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt,
        lockAt: kickoffAt,
        predictionLockAt,
        roundName: "小组赛",
        status: MatchStatus.SCHEDULED,
      },
      create: {
        externalId,
        stage: TournamentStage.GROUP,
        groupId: group.id,
        groupName: match.groupName,
        matchDate,
        kickoffTime: match.kickoffTime,
        timezone: match.timezone,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt,
        lockAt: kickoffAt,
        predictionLockAt,
        roundName: "小组赛",
        status: MatchStatus.SCHEDULED,
      },
    });

    imported += 1;
  }

  return {
    imported,
    dates: Object.keys(seedMatchesByDate).length,
    matches: seedMatches.length,
  };
}

function groupSortOrder(groupName: string) {
  return groupName.charCodeAt(0) - "A".charCodeAt(0) + 1;
}

if (require.main === module) {
  const prisma = new PrismaClient();

  importGroupStageMatches(prisma)
    .then(async (result) => {
      console.log(result);
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
