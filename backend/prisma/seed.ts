import {
  AiJobStatus,
  TournamentStage,
  MatchStatus,
  MembershipStatus,
  PredictionDirection,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { seedWorldCupKnowledgeBase } from "./seed-worldcup-kb";

const prisma = new PrismaClient();

const teams = [
  {
    fifaCode: "MEX",
    countryCode: "MX",
    name: "墨西哥",
    nameEn: "Mexico",
    groupName: "A",
    flagUrl: "/static/flags/MX.svg",
  },
  {
    fifaCode: "RSA",
    countryCode: "ZA",
    name: "南非",
    nameEn: "South Africa",
    groupName: "A",
    flagUrl: "/static/flags/ZA.svg",
  },
  {
    fifaCode: "KOR",
    countryCode: "KR",
    name: "韩国",
    nameEn: "South Korea",
    groupName: "A",
    flagUrl: "/static/flags/KR.svg",
  },
  {
    fifaCode: "CZE",
    countryCode: "CZ",
    name: "捷克",
    nameEn: "Czechia",
    groupName: "A",
    flagUrl: "/static/flags/CZ.svg",
  },
];

const sampleMatches = [
  {
    externalId: "WC2026-GA-1",
    home: "MEX",
    away: "RSA",
    stage: TournamentStage.GROUP,
    groupName: "A",
    matchDate: "2026-06-12",
    kickoffTime: "03:00",
    timezone: "Asia/Shanghai",
    kickoffAt: "2026-06-11T19:00:00.000Z",
    venue: "Mexico City Stadium",
  },
  {
    externalId: "WC2026-GA-2",
    home: "KOR",
    away: "CZE",
    stage: TournamentStage.GROUP,
    groupName: "A",
    matchDate: "2026-06-12",
    kickoffTime: "10:00",
    timezone: "Asia/Shanghai",
    kickoffAt: "2026-06-12T02:00:00.000Z",
    venue: "Estadio Guadalajara",
  },
];

async function main() {
  const teamMap = new Map<string, { id: string; name: string }>();

  for (const team of teams) {
    const record = await prisma.team.upsert({
      where: { fifaCode: team.fifaCode },
      update: team,
      create: team,
    });
    teamMap.set(team.fifaCode, record);
  }

  const matches = [];
  for (const item of sampleMatches) {
    const homeTeam = teamMap.get(item.home);
    const awayTeam = teamMap.get(item.away);
    if (!homeTeam || !awayTeam) {
      throw new Error(`Missing seed team for ${item.externalId}`);
    }

    const kickoffAt = new Date(item.kickoffAt);
    const predictionLockAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000);
    const match = await prisma.match.upsert({
      where: { externalId: item.externalId },
      update: {
        stage: item.stage,
        groupName: item.groupName,
        matchDate: new Date(`${item.matchDate}T00:00:00.000Z`),
        kickoffTime: item.kickoffTime,
        timezone: item.timezone,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt,
        lockAt: kickoffAt,
        predictionLockAt,
        venue: item.venue,
        status: MatchStatus.SCHEDULED,
      },
      create: {
        externalId: item.externalId,
        stage: item.stage,
        groupName: item.groupName,
        matchDate: new Date(`${item.matchDate}T00:00:00.000Z`),
        kickoffTime: item.kickoffTime,
        timezone: item.timezone,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt,
        lockAt: kickoffAt,
        predictionLockAt,
        venue: item.venue,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    matches.push(match);
  }

  await prisma.membershipPlan.upsert({
    where: { code: "WORLD_CUP_PASS_59" },
    update: {
      name: "世界杯通行证",
      priceCents: 5900,
      durationDays: 60,
      benefits: [
        "查看完整AI赛前报告",
        "查看每日精选完整推荐理由",
        "查看历史命中率",
        "查看挑战赛高级榜单",
      ],
      isActive: true,
    },
    create: {
      code: "WORLD_CUP_PASS_59",
      name: "世界杯通行证",
      priceCents: 5900,
      durationDays: 60,
      benefits: [
        "查看完整AI赛前报告",
        "查看每日精选完整推荐理由",
        "查看历史命中率",
        "查看挑战赛高级榜单",
      ],
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { openId: "admin_local" },
    update: {
      role: UserRole.ADMIN,
      nickname: "管理员",
      membershipStatus: MembershipStatus.ACTIVE,
      membershipExpireAt: new Date("2026-12-31T23:59:59.000Z"),
    },
    create: {
      openId: "admin_local",
      role: UserRole.ADMIN,
      nickname: "管理员",
      membershipStatus: MembershipStatus.ACTIVE,
      membershipExpireAt: new Date("2026-12-31T23:59:59.000Z"),
    },
  });

  let season = await prisma.challengeSeason.findFirst({
    where: { name: "世界杯挑战赛" },
  });

  if (!season) {
    season = await prisma.challengeSeason.create({
      data: {
        name: "世界杯挑战赛",
        startsAt: new Date("2026-06-11T00:00:00.000Z"),
        endsAt: new Date("2026-07-20T23:59:59.000Z"),
        isActive: true,
      },
    });
  }

  for (const [index, match] of matches.entries()) {
    await prisma.aiMatchReport.upsert({
      where: { matchId: match.id },
      update: buildReport(match, index),
      create: {
        matchId: match.id,
        ...buildReport(match, index),
      },
    });
  }

  const date = new Date(Date.UTC(2026, 5, 11));
  const dailyRecommendation = await prisma.dailyRecommendation.upsert({
    where: { date },
    update: {
      title: "AI每日精选",
      intro: "基于赛程、球队状态和风险控制生成的示例内容",
      status: AiJobStatus.SUCCEEDED,
      promptVersion: "seed-demo-v1",
      model: "seed",
      generatedAt: new Date(),
      matches: {
        deleteMany: {},
      },
    },
    create: {
      date,
      title: "AI每日精选",
      intro: "基于赛程、球队状态和风险控制生成的示例内容",
      status: AiJobStatus.SUCCEEDED,
      promptVersion: "seed-demo-v1",
      model: "seed",
      generatedAt: new Date(),
    },
  });

  for (const [index, match] of matches.entries()) {
    await prisma.dailyRecommendationMatch.create({
      data: {
        dailyRecommendationId: dailyRecommendation.id,
        matchId: match.id,
        recommendationDirection:
          index === 1 ? PredictionDirection.DRAW : PredictionDirection.HOME_WIN,
        predictedHome: index === 1 ? 1 : 2,
        predictedAway: index === 1 ? 1 : 1,
        homeWinProb: index === 1 ? "34.00" : "48.00",
        drawProb: index === 1 ? "33.00" : "28.00",
        awayWinProb: index === 1 ? "33.00" : "24.00",
        riskIndex: 54 + index * 6,
        confidenceIndex: 62 - index * 3,
        freeReason: `${match.homeTeam.name} vs ${match.awayTeam.name}：双方实力接近，建议重点关注阵容和节奏变化。风险提示：赛前信息会影响判断。`,
        memberReason: `${match.homeTeam.name}与${match.awayTeam.name}的对位强度较高，主队在中前场推进效率上略有优势，但客队反击质量稳定。建议结合临场名单、体能消耗和天气因素综合阅读。风险提示：足球比赛存在临场状态、伤停和战术调整等不确定性，本内容仅供数据分析参考。`,
        sortOrder: index + 1,
      },
    });
  }

  await prisma.challengeScore.upsert({
    where: {
      userId_seasonId: {
        userId: admin.id,
        seasonId: season.id,
      },
    },
    update: {
      points: 0,
      title: "新晋挑战者",
    },
    create: {
      userId: admin.id,
      seasonId: season.id,
      points: 0,
      title: "新晋挑战者",
    },
  });

  await seedWorldCupKnowledgeBase(prisma);
}

function buildReport(
  match: {
    homeTeam: { name: string };
    awayTeam: { name: string };
  },
  index: number,
) {
  return {
    summary: `${match.homeTeam.name}对阵${match.awayTeam.name}，双方攻防节奏差异明显，建议重点关注首发阵容与中场控制。`,
    fullContent: [
      `双方状态：${match.homeTeam.name}近期整体压迫更积极，${match.awayTeam.name}转换速度较快，比赛可能在中场争夺中形成分水岭。`,
      "历史交锋：双方过往强强对话节奏通常较紧，先失球一方会明显提高边路推进比例。",
      "关键球员：主队核心负责串联推进，客队前场终结效率值得关注。",
      "伤停影响：示例数据未接入实时伤停，正式环境需结合赛前名单更新。",
      "战术分析：主队倾向通过控球创造禁区前沿机会，客队更依赖快速反击和定位球。",
      "推荐比分：2-1。",
      "风险提示：足球比赛存在临场状态、伤停、天气和战术调整等不确定性，本内容仅供足球数据分析参考。",
    ].join("\n"),
    homeWinProb: index === 1 ? "34.00" : "48.00",
    drawProb: index === 1 ? "33.00" : "28.00",
    awayWinProb: index === 1 ? "33.00" : "24.00",
    predictedHome: index === 1 ? 1 : 2,
    predictedAway: 1,
    riskIndex: 52 + index * 8,
    confidenceIndex: 65 - index * 4,
    promptVersion: "seed-demo-v1",
    model: "seed",
  };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
