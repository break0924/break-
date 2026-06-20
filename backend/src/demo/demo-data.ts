import { TournamentStage, MatchStatus, PredictionDirection } from "@prisma/client";
import { seedMatches } from "../../prisma/seedMatches";

const today = "2026-06-11T";

export const demoTeams = [
  {
    id: "team_mex",
    fifaCode: "MEX",
    countryCode: "MX",
    name: "墨西哥",
    nameEn: "Mexico",
    groupName: "A",
    flagUrl: "/static/flags/MX.svg",
  },
  {
    id: "team_rsa",
    fifaCode: "RSA",
    countryCode: "ZA",
    name: "南非",
    nameEn: "South Africa",
    groupName: "A",
    flagUrl: "/static/flags/ZA.svg",
  },
  {
    id: "team_kor",
    fifaCode: "KOR",
    countryCode: "KR",
    name: "韩国",
    nameEn: "South Korea",
    groupName: "A",
    flagUrl: "/static/flags/KR.svg",
  },
  {
    id: "team_cze",
    fifaCode: "CZE",
    countryCode: "CZ",
    name: "捷克",
    nameEn: "Czechia",
    groupName: "A",
    flagUrl: "/static/flags/CZ.svg",
  },
  team("CAN", "CA", "加拿大", "Canada", "B"),
  team("BIH", "BA", "波黑", "Bosnia and Herzegovina", "B"),
  team("QAT", "QA", "卡塔尔", "Qatar", "B"),
  team("SUI", "CH", "瑞士", "Switzerland", "B"),
  team("BRA", "BR", "巴西", "Brazil", "C"),
  team("HAI", "HT", "海地", "Haiti", "C"),
  team("MAR", "MA", "摩洛哥", "Morocco", "C"),
  team("SCO", "GB-SCT", "苏格兰", "Scotland", "C"),
  team("USA", "US", "美国", "United States", "D"),
  team("AUS", "AU", "澳大利亚", "Australia", "D"),
  team("PAR", "PY", "巴拉圭", "Paraguay", "D"),
  team("TUR", "TR", "土耳其", "Turkiye", "D"),
  team("GER", "DE", "德国", "Germany", "E"),
  team("CUW", "CW", "库拉索", "Curacao", "E"),
  team("CIV", "CI", "科特迪瓦", "Cote d'Ivoire", "E"),
  team("ECU", "EC", "厄瓜多尔", "Ecuador", "E"),
  team("NED", "NL", "荷兰", "Netherlands", "F"),
  team("JPN", "JP", "日本", "Japan", "F"),
  team("SWE", "SE", "瑞典", "Sweden", "F"),
  team("TUN", "TN", "突尼斯", "Tunisia", "F"),
  team("BEL", "BE", "比利时", "Belgium", "G"),
  team("EGY", "EG", "埃及", "Egypt", "G"),
  team("IRN", "IR", "伊朗", "Iran", "G"),
  team("NZL", "NZ", "新西兰", "New Zealand", "G"),
  team("ESP", "ES", "西班牙", "Spain", "H"),
  team("CPV", "CV", "佛得角", "Cape Verde", "H"),
  team("KSA", "SA", "沙特阿拉伯", "Saudi Arabia", "H"),
  team("URU", "UY", "乌拉圭", "Uruguay", "H"),
  team("FRA", "FR", "法国", "France", "I"),
  team("IRQ", "IQ", "伊拉克", "Iraq", "I"),
  team("NOR", "NO", "挪威", "Norway", "I"),
  team("SEN", "SN", "塞内加尔", "Senegal", "I"),
  team("ARG", "AR", "阿根廷", "Argentina", "J"),
  team("ALG", "DZ", "阿尔及利亚", "Algeria", "J"),
  team("AUT", "AT", "奥地利", "Austria", "J"),
  team("JOR", "JO", "约旦", "Jordan", "J"),
  team("COL", "CO", "哥伦比亚", "Colombia", "K"),
  team("COD", "CD", "刚果民主共和国", "DR Congo", "K"),
  team("POR", "PT", "葡萄牙", "Portugal", "K"),
  team("UZB", "UZ", "乌兹别克斯坦", "Uzbekistan", "K"),
  team("ENG", "GB-ENG", "英格兰", "England", "L"),
  team("CRO", "HR", "克罗地亚", "Croatia", "L"),
  team("GHA", "GH", "加纳", "Ghana", "L"),
  team("PAN", "PA", "巴拿马", "Panama", "L"),
];

const teamById = new Map(demoTeams.map((team) => [team.id, team]));
const teamByName = new Map(demoTeams.map((team) => [team.name, team]));

export const demoResultByExternalId: Record<
  string,
  { homeScore: number; awayScore: number; winnerTeamId: string }
> = {
  "WC2026-GS-20260612-01": {
    homeScore: 2,
    awayScore: 0,
    winnerTeamId: "team_mex",
  },
  "WC2026-GS-20260612-02": {
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: "team_kor",
  },
  "WC2026-GS-20260613-01": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260613-02": {
    homeScore: 4,
    awayScore: 1,
    winnerTeamId: "team_usa",
  },
  "WC2026-GS-20260614-01": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260614-02": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260614-03": {
    homeScore: 0,
    awayScore: 1,
    winnerTeamId: "team_sco",
  },
  "WC2026-GS-20260614-04": {
    homeScore: 2,
    awayScore: 0,
    winnerTeamId: "team_aus",
  },
  "WC2026-GS-20260615-01": {
    homeScore: 7,
    awayScore: 1,
    winnerTeamId: "team_ger",
  },
  "WC2026-GS-20260615-02": {
    homeScore: 2,
    awayScore: 2,
    winnerTeamId: "",
  },
  "WC2026-GS-20260615-03": {
    homeScore: 1,
    awayScore: 0,
    winnerTeamId: "team_civ",
  },
  "WC2026-GS-20260615-04": {
    homeScore: 5,
    awayScore: 1,
    winnerTeamId: "team_swe",
  },
  "WC2026-GS-20260616-01": {
    homeScore: 0,
    awayScore: 0,
    winnerTeamId: "",
  },
  "WC2026-GS-20260616-02": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260616-03": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260616-04": {
    homeScore: 2,
    awayScore: 2,
    winnerTeamId: "",
  },
  "WC2026-GS-20260617-01": {
    homeScore: 3,
    awayScore: 1,
    winnerTeamId: "team_fra",
  },
  "WC2026-GS-20260617-02": {
    homeScore: 1,
    awayScore: 4,
    winnerTeamId: "team_nor",
  },
  "WC2026-GS-20260617-03": {
    homeScore: 3,
    awayScore: 0,
    winnerTeamId: "team_arg",
  },
  "WC2026-GS-20260617-04": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260618-01": {
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: "team_por",
  },
  "WC2026-GS-20260618-02": {
    homeScore: 1,
    awayScore: 0,
    winnerTeamId: "team_eng",
  },
  "WC2026-GS-20260618-03": {
    homeScore: 2,
    awayScore: 2,
    winnerTeamId: "",
  },
  "WC2026-GS-20260618-04": {
    homeScore: 0,
    awayScore: 1,
    winnerTeamId: "team_col",
  },
  "WC2026-GS-20260619-01": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260619-02": {
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: "team_sui",
  },
  "WC2026-GS-20260619-03": {
    homeScore: 1,
    awayScore: 0,
    winnerTeamId: "team_can",
  },
  "WC2026-GS-20260619-04": {
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: "team_mex",
  },
  "WC2026-GS-20260620-01": {
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: "",
  },
  "WC2026-GS-20260620-02": {
    homeScore: 0,
    awayScore: 2,
    winnerTeamId: "team_mar",
  },
};

const demoPredictionOverrideByExternalId: Record<
  string,
  {
    direction: PredictionDirection;
    score: [number, number];
    probs: [number, number, number];
    risk: number;
    confidence: number;
    angle: string;
    promptVersion: string;
    publishedAt: string;
  }
> = {
  "WC2026-GS-20260613-01": {
    direction: PredictionDirection.DRAW,
    score: [1, 1],
    probs: [34, 31, 35],
    risk: 62,
    confidence: 58,
    angle:
      "加拿大主场推进和边路冲击更主动，波黑定位球与高点冲击威胁明显；双方都具备制造机会的能力，但终结效率和临场调整会放大不确定性。",
    promptVersion: "demo-20260613-v1",
    publishedAt: "2026-06-13T00:45:00.000+08:00",
  },
};

export const demoScheduleMatches = seedMatches.map((match) => {
  const homeTeam = teamByName.get(match.homeTeam)!;
  const awayTeam = teamByName.get(match.awayTeam)!;
  const kickoffAt = new Date(`${match.matchDate}T${match.kickoffTime}:00+08:00`);
  const matchDate = new Date(`${match.matchDate}T00:00:00.000Z`);
  const externalId = `WC2026-GS-${match.matchDate.replaceAll(
    "-",
    "",
  )}-${String(match.matchNoOfDay).padStart(2, "0")}`;

  const result = demoResultByExternalId[externalId];

  return {
    id: `demo_${externalId.toLowerCase()}`,
    externalId,
    stage: TournamentStage.GROUP,
    groupId: null,
    groupName: match.groupName,
    matchDate,
    kickoffTime: match.kickoffTime,
    timezone: match.timezone,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    kickoffAt,
    venue: "场地待定",
    city: null,
    roundName: "小组赛",
    status: result ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
    homeScore: result?.homeScore ?? null,
    awayScore: result?.awayScore ?? null,
    winnerTeamId: result?.winnerTeamId ?? null,
    lockAt: kickoffAt,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    homeTeam,
    awayTeam,
    aiReport: null,
  };
});

export const demoMatches = [
  {
    id: "match_20260611_mex_rsa",
    externalId: "WC2026-GA-1",
    stage: TournamentStage.GROUP,
    groupName: "A",
    homeTeamId: "team_mex",
    awayTeamId: "team_rsa",
    kickoffAt: new Date(`${today}19:00:00.000Z`),
    venue: "Mexico City Stadium",
    status: MatchStatus.FINISHED,
    homeScore: 2,
    awayScore: 0,
    lockAt: new Date(`${today}19:00:00.000Z`),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "match_20260611_kor_cze",
    externalId: "WC2026-GA-2",
    stage: TournamentStage.GROUP,
    groupName: "A",
    homeTeamId: "team_kor",
    awayTeamId: "team_cze",
    kickoffAt: new Date(`2026-06-12T02:00:00.000Z`),
    venue: "Estadio Guadalajara",
    status: MatchStatus.FINISHED,
    homeScore: 2,
    awayScore: 1,
    lockAt: new Date(`2026-06-12T02:00:00.000Z`),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
].map((match) => ({
  ...match,
  homeTeam: teamById.get(match.homeTeamId)!,
  awayTeam: teamById.get(match.awayTeamId)!,
}));

export const demoReports = new Map(
  [...demoScheduleMatches.slice(0, 3), ...demoMatches].map((match, index) => {
    const normalizedIndex = index % 2;
    const defaultVariant = [
      {
        direction: PredictionDirection.HOME_WIN,
        score: [2, 0],
        probs: [52, 27, 21],
        risk: 49,
        confidence: 70,
        angle:
          "墨西哥把主场节奏和前场压迫转化为优势，整体推进效率更稳定；南非反击有速度，但持续威胁不足。",
      },
      {
        direction: PredictionDirection.HOME_WIN,
        score: [2, 1],
        probs: [44, 28, 28],
        risk: 55,
        confidence: 66,
        angle:
          "韩国边路推进和转换速度更积极，捷克依靠身体对抗与定位球制造压力，比赛呈现拉锯走势。",
      },
    ][normalizedIndex];
    const variants =
      demoPredictionOverrideByExternalId[match.externalId] ?? defaultVariant;

    const [homeWinProb, drawProb, awayWinProb] = variants.probs;
    const [predictedHome, predictedAway] = variants.score;
    const actualScore =
      match.homeScore !== null && match.awayScore !== null
        ? `赛果 ${match.homeScore}-${match.awayScore}`
        : "赛果待定";

    return [
      match.id,
      {
        id: `report_${match.id}`,
        matchId: match.id,
        summary: `${match.homeTeam.name} vs ${match.awayTeam.name}：${variants.angle}`,
        fullContent: [
          `赛果更新：${actualScore}。`,
          `双方状态：${variants.angle}`,
          `关键观察：${match.homeTeam.name}在节奏控制、压迫强度和禁区前处理上更占主动，${match.awayTeam.name}的机会更多来自转换和定位球。`,
          "伤停影响：当前为演示数据，正式上线需接入赛前名单和伤停信息；若关键球员缺阵，应同步调整信心指数。",
          `战术分析：${match.homeTeam.name}倾向主动推进并压缩对手出球空间，${match.awayTeam.name}需要提升反击后的最后一传质量。`,
          `胜平负概率：主胜 ${homeWinProb}%，平局 ${drawProb}%，客胜 ${awayWinProb}%。`,
          `推荐比分：${predictedHome}-${predictedAway}。`,
          "风险提示：足球比赛受临场状态、阵容调整、天气和裁判尺度等因素影响，本内容仅供足球数据分析参考。",
        ].join("\n\n"),
        homeWinProb,
        drawProb,
        awayWinProb,
        predictedHome,
        predictedAway,
        riskIndex: variants.risk,
        confidenceIndex: variants.confidence,
        promptVersion:
          "promptVersion" in variants
            ? variants.promptVersion
            : "demo-20260611-v1",
        model: "local-demo",
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        match,
        recommendationDirection: variants.direction,
      },
    ];
  }),
);

export const demoPredictionArchives = demoScheduleMatches.slice(0, 3).map(
  (match, index) => {
    const report = demoReports.get(match.id)!;
    const resultDirection = directionFromScore(match.homeScore!, match.awayScore!);
    const hitResult = report.recommendationDirection === resultDirection;
    const hitScore =
      report.predictedHome === match.homeScore &&
      report.predictedAway === match.awayScore;
    const hitTotalGoals =
      report.predictedHome + report.predictedAway ===
      (match.homeScore || 0) + (match.awayScore || 0);
    const override = demoPredictionOverrideByExternalId[match.externalId];
    const publishedAt = new Date(
      override?.publishedAt ?? "2026-06-12T00:30:00.000+08:00",
    );
    const settledAt = new Date(
      override
        ? "2026-06-13T05:20:00.000+08:00"
        : "2026-06-12T13:30:00.000+08:00",
    );

    return {
      id: `archive_${match.id}`,
      matchId: match.id,
      status: "PUBLISHED",
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      kickoffAt: match.kickoffAt,
      publishedAt,
      generatedAt: publishedAt,
      recommendationDirection: report.recommendationDirection,
      homeWinProb: report.homeWinProb,
      drawProb: report.drawProb,
      awayWinProb: report.awayWinProb,
      predictedHome: report.predictedHome,
      predictedAway: report.predictedAway,
      totalGoalsPrediction: report.predictedHome + report.predictedAway,
      confidenceIndex: report.confidenceIndex,
      riskIndex: report.riskIndex,
      recommendationReason: report.summary,
      riskTip:
        "风险提示：足球比赛受临场状态、阵容调整、天气和裁判尺度等因素影响，本内容仅供足球数据分析参考。",
      model: "local-demo",
      promptVersion: report.promptVersion,
      isMemberContent: false,
      isPublic: true,
      originalContent: {
        source: "demo",
        matchId: match.id,
      },
      contentHash: `demo-${match.externalId}-${index + 1}`,
      createdAt: publishedAt,
      updatedAt: settledAt,
      archiveLabel: "预测已归档",
      resultStatus: "SETTLED",
      resultText: undefined,
      match,
      settlement: {
        id: `settlement_${match.id}`,
        predictionArchiveId: `archive_${match.id}`,
        matchId: match.id,
        homeScore: match.homeScore!,
        awayScore: match.awayScore!,
        resultDirection,
        hitResult,
        hitScore,
        hitTotalGoals,
        settledAt,
        settledByUserId: null,
        createdAt: settledAt,
        updatedAt: settledAt,
      },
      corrections: [],
    };
  },
);

export function getDemoMatch(id: string) {
  return (
    demoScheduleMatches.find((match) => match.id === id) ??
    demoMatches.find((match) => match.id === id) ??
    null
  );
}

export function previewContent(text: string, ratio = 0.3) {
  return text.slice(0, Math.max(80, Math.floor(text.length * ratio))) + "...";
}

function team(
  fifaCode: string,
  countryCode: string,
  name: string,
  nameEn: string,
  groupName: string,
) {
  return {
    id: `team_${fifaCode.toLowerCase()}`,
    fifaCode,
    countryCode,
    name,
    nameEn,
    groupName,
    flagUrl: `/static/flags/${countryCode}.svg`,
  };
}

function directionFromScore(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) {
    return PredictionDirection.HOME_WIN;
  }

  if (awayScore > homeScore) {
    return PredictionDirection.AWAY_WIN;
  }

  return PredictionDirection.DRAW;
}
