import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const outDir = __dirname;

const flag = (countryCode) => `/static/flags/${countryCode}.svg`;
const image = (name) => `/static/images/worldcup-kb/${name}.webp`;

const groupDefinitions = [
  [
    "A",
    [
      ["MEX", "MX", "Mexico", "墨西哥"],
      ["RSA", "ZA", "South Africa", "南非"],
      ["KOR", "KR", "South Korea", "韩国"],
      ["CZE", "CZ", "Czechia", "捷克"],
    ],
  ],
  [
    "B",
    [
      ["CAN", "CA", "Canada", "加拿大"],
      ["BIH", "BA", "Bosnia and Herzegovina", "波黑"],
      ["QAT", "QA", "Qatar", "卡塔尔"],
      ["SUI", "CH", "Switzerland", "瑞士"],
    ],
  ],
  [
    "C",
    [
      ["BRA", "BR", "Brazil", "巴西"],
      ["HAI", "HT", "Haiti", "海地"],
      ["MAR", "MA", "Morocco", "摩洛哥"],
      ["SCO", "GB-SCT", "Scotland", "苏格兰"],
    ],
  ],
  [
    "D",
    [
      ["USA", "US", "United States", "美国"],
      ["AUS", "AU", "Australia", "澳大利亚"],
      ["PAR", "PY", "Paraguay", "巴拉圭"],
      ["TUR", "TR", "Turkey", "土耳其"],
    ],
  ],
  [
    "E",
    [
      ["GER", "DE", "Germany", "德国"],
      ["CUW", "CW", "Curaçao", "库拉索"],
      ["CIV", "CI", "Ivory Coast", "科特迪瓦"],
      ["ECU", "EC", "Ecuador", "厄瓜多尔"],
    ],
  ],
  [
    "F",
    [
      ["NED", "NL", "Netherlands", "荷兰"],
      ["JPN", "JP", "Japan", "日本"],
      ["SWE", "SE", "Sweden", "瑞典"],
      ["TUN", "TN", "Tunisia", "突尼斯"],
    ],
  ],
  [
    "G",
    [
      ["BEL", "BE", "Belgium", "比利时"],
      ["EGY", "EG", "Egypt", "埃及"],
      ["IRN", "IR", "Iran", "伊朗"],
      ["NZL", "NZ", "New Zealand", "新西兰"],
    ],
  ],
  [
    "H",
    [
      ["ESP", "ES", "Spain", "西班牙"],
      ["CPV", "CV", "Cape Verde", "佛得角"],
      ["KSA", "SA", "Saudi Arabia", "沙特阿拉伯"],
      ["URU", "UY", "Uruguay", "乌拉圭"],
    ],
  ],
  [
    "I",
    [
      ["FRA", "FR", "France", "法国"],
      ["IRQ", "IQ", "Iraq", "伊拉克"],
      ["NOR", "NO", "Norway", "挪威"],
      ["SEN", "SN", "Senegal", "塞内加尔"],
    ],
  ],
  [
    "J",
    [
      ["ARG", "AR", "Argentina", "阿根廷"],
      ["ALG", "DZ", "Algeria", "阿尔及利亚"],
      ["AUT", "AT", "Austria", "奥地利"],
      ["JOR", "JO", "Jordan", "约旦"],
    ],
  ],
  [
    "K",
    [
      ["COL", "CO", "Colombia", "哥伦比亚"],
      ["COD", "CD", "DR Congo", "刚果民主共和国"],
      ["POR", "PT", "Portugal", "葡萄牙"],
      ["UZB", "UZ", "Uzbekistan", "乌兹别克斯坦"],
    ],
  ],
  [
    "L",
    [
      ["ENG", "GB-ENG", "England", "英格兰"],
      ["CRO", "HR", "Croatia", "克罗地亚"],
      ["GHA", "GH", "Ghana", "加纳"],
      ["PAN", "PA", "Panama", "巴拿马"],
    ],
  ],
];

const confederationByFifa = {
  MEX: "CONCACAF",
  CAN: "CONCACAF",
  USA: "CONCACAF",
  HAI: "CONCACAF",
  PAN: "CONCACAF",
  RSA: "CAF",
  MAR: "CAF",
  CIV: "CAF",
  TUN: "CAF",
  EGY: "CAF",
  CPV: "CAF",
  SEN: "CAF",
  ALG: "CAF",
  COD: "CAF",
  GHA: "CAF",
  KOR: "AFC",
  QAT: "AFC",
  AUS: "AFC",
  JPN: "AFC",
  IRN: "AFC",
  KSA: "AFC",
  IRQ: "AFC",
  JOR: "AFC",
  UZB: "AFC",
  CZE: "UEFA",
  BIH: "UEFA",
  SUI: "UEFA",
  SCO: "UEFA",
  TUR: "UEFA",
  GER: "UEFA",
  NED: "UEFA",
  SWE: "UEFA",
  BEL: "UEFA",
  ESP: "UEFA",
  FRA: "UEFA",
  NOR: "UEFA",
  AUT: "UEFA",
  POR: "UEFA",
  ENG: "UEFA",
  CRO: "UEFA",
  BRA: "CONMEBOL",
  PAR: "CONMEBOL",
  ECU: "CONMEBOL",
  URU: "CONMEBOL",
  ARG: "CONMEBOL",
  COL: "CONMEBOL",
  NZL: "OFC",
  CUW: "CONCACAF",
};

const introByFifa = {
  ARG: "传统强队，技术细腻、锋线选择丰富，适合作为AI赛前分析中的控球与终结效率样本。",
  BRA: "进攻天赋充足，边路与个人突破能力突出，是世界杯内容中最受关注的球队之一。",
  FRA: "阵容纵深强，转换速度快，适合重点分析攻防转换和关键球员状态。",
  ENG: "阵容厚度和前场火力出色，定位球与高位压迫是常见分析重点。",
};

const teams = groupDefinitions.flatMap(([groupCode, members], index) =>
  members.map(([fifaCode, countryCode, nameEn, name], seed) => ({
    id: `team_${fifaCode.toLowerCase()}`,
    fifaCode,
    countryCode,
    name,
    nameEn,
    groupCode,
    groupName: groupCode,
    confederation: confederationByFifa[fifaCode] || "UNKNOWN",
    seedOrder: index * 4 + seed + 1,
    flagUrl: flag(countryCode),
    imageUrl: image(`teams/${fifaCode.toLowerCase()}`),
    badgeUrl: null,
    officialAssetPolicy:
      "No official team crest is used. Use national flag and original graphics only.",
    worldCupIntro:
      introByFifa[fifaCode] ||
      `${name}进入2026年世界杯知识库，可用于赛程、分组、赛前AI分析和挑战赛预测。`,
    ragText: `${name} (${nameEn})，FIFA code ${fifaCode}，country code ${countryCode}，Group ${groupCode}，confederation ${confederationByFifa[fifaCode] || "UNKNOWN"}。`,
    tags: ["team", `group-${groupCode}`, countryCode, fifaCode],
  })),
);

const playersByTeam = {
  ARG: [
    ["Lionel Messi", "前锋", true],
    ["Julián Álvarez", "前锋", true],
    ["Emiliano Martínez", "门将", true],
  ],
  MEX: [
    ["Edson Álvarez", "中场", true],
    ["Hirving Lozano", "前锋", true],
  ],
  RSA: [
    ["Ronwen Williams", "门将", true],
    ["Teboho Mokoena", "中场", true],
  ],
  KOR: [
    ["Son Heung-min", "前锋", true],
    ["Kim Min-jae", "后卫", true],
  ],
  CZE: [
    ["Patrik Schick", "前锋", true],
    ["Tomáš Souček", "中场", true],
  ],
  CAN: [
    ["Alphonso Davies", "后卫", true],
    ["Jonathan David", "前锋", true],
  ],
  BIH: [
    ["Edin Džeko", "前锋", true],
    ["Miralem Pjanić", "中场", true],
  ],
  QAT: [
    ["Akram Afif", "前锋", true],
    ["Almoez Ali", "前锋", true],
  ],
  SUI: [
    ["Granit Xhaka", "中场", true],
    ["Manuel Akanji", "后卫", true],
  ],
  BRA: [
    ["Vinícius Júnior", "前锋", true],
    ["Rodrygo", "前锋", true],
    ["Alisson", "门将", true],
  ],
  MAR: [
    ["Achraf Hakimi", "后卫", true],
    ["Brahim Díaz", "中场", true],
    ["Yassine Bounou", "门将", true],
  ],
  HAI: [
    ["Duckens Nazon", "前锋", true],
    ["Frantzdy Pierrot", "前锋", true],
  ],
  SCO: [
    ["Andrew Robertson", "后卫", true],
    ["Scott McTominay", "中场", true],
  ],
  USA: [
    ["Christian Pulisic", "前锋", true],
    ["Folarin Balogun", "前锋", true],
    ["Tyler Adams", "中场", true],
  ],
  PAR: [
    ["Miguel Almirón", "中场", true],
    ["Julio Enciso", "前锋", true],
  ],
  AUS: [
    ["Harry Souttar", "后卫", true],
    ["Jackson Irvine", "中场", true],
  ],
  TUR: [
    ["Arda Güler", "中场", true],
    ["Hakan Çalhanoğlu", "中场", true],
  ],
  GER: [
    ["Florian Wirtz", "中场", true],
    ["Jamal Musiala", "中场", true],
    ["Joshua Kimmich", "中场", true],
  ],
  CUW: [
    ["Tahith Chong", "前锋", true],
    ["Leandro Bacuna", "中场", true],
  ],
  CIV: [
    ["Franck Kessié", "中场", true],
    ["Simon Adingra", "前锋", true],
  ],
  ECU: [
    ["Moisés Caicedo", "中场", true],
    ["Willian Pacho", "后卫", true],
  ],
  NED: [
    ["Virgil van Dijk", "后卫", true],
    ["Frenkie de Jong", "中场", true],
    ["Cody Gakpo", "前锋", true],
  ],
  JPN: [
    ["Kaoru Mitoma", "前锋", true],
    ["Takefusa Kubo", "中场", true],
    ["Wataru Endo", "中场", true],
  ],
  SWE: [
    ["Alexander Isak", "前锋", true],
    ["Dejan Kulusevski", "前锋", true],
  ],
  TUN: [
    ["Youssef Msakni", "前锋", true],
    ["Aïssa Laïdouni", "中场", true],
  ],
  BEL: [
    ["Kevin De Bruyne", "中场", true],
    ["Romelu Lukaku", "前锋", true],
    ["Thibaut Courtois", "门将", true],
  ],
  EGY: [
    ["Mohamed Salah", "前锋", true],
    ["Omar Marmoush", "前锋", true],
  ],
  IRN: [
    ["Mehdi Taremi", "前锋", true],
    ["Sardar Azmoun", "前锋", true],
  ],
  NZL: [
    ["Chris Wood", "前锋", true],
    ["Liberato Cacace", "后卫", true],
  ],
  ESP: [
    ["Lamine Yamal", "前锋", true],
    ["Pedri", "中场", true],
    ["Rodri", "中场", true],
  ],
  CPV: [
    ["Ryan Mendes", "前锋", true],
    ["Bebé", "前锋", true],
  ],
  KSA: [
    ["Salem Al-Dawsari", "前锋", true],
    ["Ali Al-Bulaihi", "后卫", true],
  ],
  URU: [
    ["Federico Valverde", "中场", true],
    ["Darwin Núñez", "前锋", true],
    ["Ronald Araújo", "后卫", true],
  ],
  FRA: [
    ["Kylian Mbappé", "前锋", true],
    ["Antoine Griezmann", "前锋", true],
    ["Aurélien Tchouaméni", "中场", true],
  ],
  SEN: [
    ["Sadio Mané", "前锋", true],
    ["Kalidou Koulibaly", "后卫", true],
  ],
  IRQ: [
    ["Aymen Hussein", "前锋", true],
    ["Zidane Iqbal", "中场", true],
  ],
  NOR: [
    ["Erling Haaland", "前锋", true],
    ["Martin Ødegaard", "中场", true],
  ],
  ALG: [
    ["Riyad Mahrez", "前锋", true],
    ["Ismaël Bennacer", "中场", true],
  ],
  AUT: [
    ["David Alaba", "后卫", true],
    ["Marcel Sabitzer", "中场", true],
  ],
  JOR: [
    ["Musa Al-Taamari", "前锋", true],
    ["Yazan Al-Naimat", "前锋", true],
  ],
  POR: [
    ["Cristiano Ronaldo", "前锋", true],
    ["Bruno Fernandes", "中场", true],
    ["Rafael Leão", "前锋", true],
  ],
  COD: [
    ["Chancel Mbemba", "后卫", true],
    ["Yoane Wissa", "前锋", true],
  ],
  UZB: [
    ["Eldor Shomurodov", "前锋", true],
    ["Abbosbek Fayzullaev", "中场", true],
  ],
  COL: [
    ["Luis Díaz", "前锋", true],
    ["James Rodríguez", "中场", true],
  ],
  ENG: [
    ["Jude Bellingham", "中场", true],
    ["Harry Kane", "前锋", true],
    ["Bukayo Saka", "前锋", true],
  ],
  CRO: [
    ["Luka Modrić", "中场", true],
    ["Joško Gvardiol", "后卫", true],
  ],
  GHA: [
    ["Mohammed Kudus", "中场", true],
    ["Thomas Partey", "中场", true],
  ],
  PAN: [
    ["Adalberto Carrasquilla", "中场", true],
    ["Michael Murillo", "后卫", true],
  ],
};

const teamByCode = Object.fromEntries(
  teams.map((team) => [team.fifaCode, team]),
);

const players = Object.entries(playersByTeam).flatMap(([fifaCode, list]) => {
  const team = teamByCode[fifaCode];
  return list.map(([name, position, isKey], index) => ({
    id: `player_${fifaCode.toLowerCase()}_${index + 1}`,
    teamId: team.id,
    teamFifaCode: fifaCode,
    teamName: team.name,
    name,
    nameEn: name,
    position,
    isKey,
    imageUrl: null,
    imagePolicy:
      "No unauthorized player photo is used. Use silhouette or licensed image only.",
    flagUrl: team.flagUrl,
    worldCupIntro: `${name} 是 ${team.name} 知识库中的重点球员，可用于AI赛前分析、关键球员段落和风险解释。`,
    ragText: `${name}, ${position}, ${team.name} (${team.nameEn}), key player ${isKey}.`,
    tags: ["player", fifaCode, team.countryCode, position],
  }));
});

const groups = groupDefinitions.map(([code, members]) => ({
  id: `group_${code.toLowerCase()}`,
  code,
  name: `${code}组`,
  imageUrl: image(`groups/group-${code.toLowerCase()}`),
  flagUrl: null,
  teams: members.map(([fifaCode]) => fifaCode),
  teamNames: members.map(([fifaCode]) => teamByCode[fifaCode].name),
  worldCupIntro: `${code}组包含 ${members.map(([fifaCode]) => teamByCode[fifaCode].name).join("、")}，用于小组赛赛程、积分榜和AI赛前推荐。`,
  ragText: `Group ${code}: ${members.map(([fifaCode]) => `${teamByCode[fifaCode].name} ${teamByCode[fifaCode].nameEn}`).join(", ")}.`,
  tags: ["group", `group-${code}`],
}));

const stadiums = [
  ["estadio-azteca", "Estadio Azteca", "Mexico City", "Mexico", "MX", 87523],
  ["estadio-akron", "Estadio Akron", "Guadalajara", "Mexico", "MX", 49850],
  ["estadio-bbva", "Estadio BBVA", "Monterrey", "Mexico", "MX", 53500],
  ["bmo-field", "BMO Field", "Toronto", "Canada", "CA", 45000],
  ["bc-place", "BC Place", "Vancouver", "Canada", "CA", 54500],
  [
    "mercedes-benz-stadium",
    "Mercedes-Benz Stadium",
    "Atlanta",
    "United States",
    "US",
    71000,
  ],
  [
    "gillette-stadium",
    "Gillette Stadium",
    "Boston",
    "United States",
    "US",
    65878,
  ],
  ["att-stadium", "AT&T Stadium", "Dallas", "United States", "US", 80000],
  ["nrg-stadium", "NRG Stadium", "Houston", "United States", "US", 72220],
  [
    "arrowhead-stadium",
    "Arrowhead Stadium",
    "Kansas City",
    "United States",
    "US",
    76416,
  ],
  ["sofi-stadium", "SoFi Stadium", "Los Angeles", "United States", "US", 70240],
  [
    "hard-rock-stadium",
    "Hard Rock Stadium",
    "Miami",
    "United States",
    "US",
    64767,
  ],
  [
    "metlife-stadium",
    "MetLife Stadium",
    "New York New Jersey",
    "United States",
    "US",
    82500,
  ],
  [
    "lincoln-financial-field",
    "Lincoln Financial Field",
    "Philadelphia",
    "United States",
    "US",
    67594,
  ],
  [
    "levis-stadium",
    "Levi's Stadium",
    "San Francisco Bay Area",
    "United States",
    "US",
    68500,
  ],
  ["lumen-field", "Lumen Field", "Seattle", "United States", "US", 68740],
].map(([id, name, city, country, countryCode, capacity]) => ({
  id: `stadium_${id}`,
  slug: id,
  name,
  city,
  country,
  countryCode,
  capacity,
  imageUrl: image(`stadiums/${id}`),
  flagUrl: flag(countryCode),
  worldCupIntro: `${name} 是2026世界杯承办场馆之一，位于 ${city}，可用于赛程地点、城市介绍和比赛详情展示。`,
  ragText: `${name}, ${city}, ${country}, capacity ${capacity}, 2026 World Cup stadium.`,
  tags: ["stadium", countryCode, city],
}));

const hostCities = Object.values(
  stadiums.reduce((acc, stadium) => {
    const key = `${stadium.city}-${stadium.countryCode}`;
    acc[key] ||= {
      id: `city_${stadium.city.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      name: stadium.city,
      country: stadium.country,
      countryCode: stadium.countryCode,
      timezone:
        stadium.countryCode === "MX"
          ? "America/Mexico_City"
          : stadium.countryCode === "CA"
            ? "America/Toronto"
            : "America/New_York",
      imageUrl: image(`cities/${stadium.slug}`),
      flagUrl: flag(stadium.countryCode),
      stadiumIds: [],
      worldCupIntro: `${stadium.city} 是2026世界杯主办城市，可用于城市导览、场馆说明和赛程展示。`,
      ragText: `${stadium.city}, ${stadium.country}, 2026 World Cup host city.`,
      tags: ["host-city", stadium.countryCode],
    };
    acc[key].stadiumIds.push(stadium.id);
    return acc;
  }, {}),
);

const stadiumByVenue = {
  "Mexico City Stadium": stadiums.find(
    (stadium) => stadium.slug === "estadio-azteca",
  ),
  "Estadio Guadalajara": stadiums.find(
    (stadium) => stadium.slug === "estadio-akron",
  ),
  "Estadio Monterrey": stadiums.find(
    (stadium) => stadium.slug === "estadio-bbva",
  ),
  "Toronto Stadium": stadiums.find((stadium) => stadium.slug === "bmo-field"),
  "BC Place Vancouver": stadiums.find((stadium) => stadium.slug === "bc-place"),
  "Atlanta Stadium": stadiums.find(
    (stadium) => stadium.slug === "mercedes-benz-stadium",
  ),
  "Boston Stadium": stadiums.find(
    (stadium) => stadium.slug === "gillette-stadium",
  ),
  "Dallas Stadium": stadiums.find((stadium) => stadium.slug === "att-stadium"),
  "Houston Stadium": stadiums.find((stadium) => stadium.slug === "nrg-stadium"),
  "Kansas City Stadium": stadiums.find(
    (stadium) => stadium.slug === "arrowhead-stadium",
  ),
  "Los Angeles Stadium": stadiums.find(
    (stadium) => stadium.slug === "sofi-stadium",
  ),
  "Miami Stadium": stadiums.find(
    (stadium) => stadium.slug === "hard-rock-stadium",
  ),
  "New York New Jersey Stadium": stadiums.find(
    (stadium) => stadium.slug === "metlife-stadium",
  ),
  "Philadelphia Stadium": stadiums.find(
    (stadium) => stadium.slug === "lincoln-financial-field",
  ),
  "San Francisco Bay Area Stadium": stadiums.find(
    (stadium) => stadium.slug === "levis-stadium",
  ),
  "Seattle Stadium": stadiums.find((stadium) => stadium.slug === "lumen-field"),
};
const hostCityIdByStadiumId = Object.fromEntries(
  hostCities.flatMap((city) =>
    city.stadiumIds.map((stadiumId) => [stadiumId, city.id]),
  ),
);
const schedule = [
  ["2026-06-11", "A", "MEX", "RSA", "Mexico City Stadium"],
  ["2026-06-11", "A", "KOR", "CZE", "Estadio Guadalajara"],
  ["2026-06-12", "B", "CAN", "BIH", "Toronto Stadium"],
  ["2026-06-12", "D", "USA", "PAR", "Los Angeles Stadium"],
  ["2026-06-13", "C", "HAI", "SCO", "Boston Stadium"],
  ["2026-06-13", "D", "AUS", "TUR", "BC Place Vancouver"],
  ["2026-06-13", "C", "BRA", "MAR", "New York New Jersey Stadium"],
  ["2026-06-13", "B", "QAT", "SUI", "San Francisco Bay Area Stadium"],
  ["2026-06-14", "E", "CIV", "ECU", "Philadelphia Stadium"],
  ["2026-06-14", "E", "GER", "CUW", "Houston Stadium"],
  ["2026-06-14", "F", "NED", "JPN", "Dallas Stadium"],
  ["2026-06-14", "F", "SWE", "TUN", "Estadio Monterrey"],
  ["2026-06-15", "H", "KSA", "URU", "Miami Stadium"],
  ["2026-06-15", "H", "ESP", "CPV", "Atlanta Stadium"],
  ["2026-06-15", "G", "IRN", "NZL", "Los Angeles Stadium"],
  ["2026-06-15", "G", "BEL", "EGY", "Seattle Stadium"],
  ["2026-06-16", "I", "FRA", "SEN", "New York New Jersey Stadium"],
  ["2026-06-16", "I", "IRQ", "NOR", "Philadelphia Stadium"],
  ["2026-06-16", "J", "ARG", "ALG", "Dallas Stadium"],
  ["2026-06-16", "J", "AUT", "JOR", "San Francisco Bay Area Stadium"],
  ["2026-06-17", "L", "ENG", "CRO", "Dallas Stadium"],
  ["2026-06-17", "L", "GHA", "PAN", "Toronto Stadium"],
  ["2026-06-17", "K", "POR", "COD", "Houston Stadium"],
  ["2026-06-17", "K", "UZB", "COL", "Mexico City Stadium"],
  ["2026-06-18", "A", "CZE", "RSA", "Atlanta Stadium"],
  ["2026-06-18", "B", "SUI", "BIH", "Los Angeles Stadium"],
  ["2026-06-18", "B", "CAN", "QAT", "BC Place Vancouver"],
  ["2026-06-18", "A", "MEX", "KOR", "Estadio Guadalajara"],
  ["2026-06-19", "C", "BRA", "HAI", "Philadelphia Stadium"],
  ["2026-06-19", "C", "SCO", "MAR", "Boston Stadium"],
  ["2026-06-19", "D", "TUR", "PAR", "San Francisco Bay Area Stadium"],
  ["2026-06-19", "D", "USA", "AUS", "Seattle Stadium"],
  ["2026-06-20", "E", "GER", "CIV", "Toronto Stadium"],
  ["2026-06-20", "E", "ECU", "CUW", "Kansas City Stadium"],
  ["2026-06-20", "F", "NED", "SWE", "Houston Stadium"],
  ["2026-06-20", "F", "TUN", "JPN", "Estadio Monterrey"],
  ["2026-06-21", "H", "URU", "CPV", "Miami Stadium"],
  ["2026-06-21", "H", "ESP", "KSA", "Atlanta Stadium"],
  ["2026-06-21", "G", "BEL", "IRN", "Los Angeles Stadium"],
  ["2026-06-21", "G", "NZL", "EGY", "BC Place Vancouver"],
  ["2026-06-22", "I", "NOR", "SEN", "New York New Jersey Stadium"],
  ["2026-06-22", "I", "FRA", "IRQ", "Philadelphia Stadium"],
  ["2026-06-22", "J", "ARG", "AUT", "Dallas Stadium"],
  ["2026-06-22", "J", "JOR", "ALG", "San Francisco Bay Area Stadium"],
  ["2026-06-23", "L", "ENG", "GHA", "Boston Stadium"],
  ["2026-06-23", "L", "PAN", "CRO", "Toronto Stadium"],
  ["2026-06-23", "K", "POR", "UZB", "Houston Stadium"],
  ["2026-06-23", "K", "COL", "COD", "Estadio Guadalajara"],
  ["2026-06-24", "B", "SUI", "CAN", "BC Place Vancouver"],
  ["2026-06-24", "B", "BIH", "QAT", "Seattle Stadium"],
  ["2026-06-24", "A", "CZE", "MEX", "Mexico City Stadium"],
  ["2026-06-24", "A", "RSA", "KOR", "Estadio Monterrey"],
  ["2026-06-24", "C", "SCO", "BRA", "Miami Stadium"],
  ["2026-06-24", "C", "MAR", "HAI", "Atlanta Stadium"],
  ["2026-06-25", "E", "CUW", "CIV", "Philadelphia Stadium"],
  ["2026-06-25", "E", "ECU", "GER", "New York New Jersey Stadium"],
  ["2026-06-25", "F", "JPN", "SWE", "Dallas Stadium"],
  ["2026-06-25", "F", "TUN", "NED", "Kansas City Stadium"],
  ["2026-06-25", "D", "TUR", "USA", "Los Angeles Stadium"],
  ["2026-06-25", "D", "PAR", "AUS", "San Francisco Bay Area Stadium"],
  ["2026-06-26", "I", "NOR", "FRA", "Boston Stadium"],
  ["2026-06-26", "I", "SEN", "IRQ", "Toronto Stadium"],
  ["2026-06-26", "G", "EGY", "IRN", "Seattle Stadium"],
  ["2026-06-26", "G", "NZL", "BEL", "BC Place Vancouver"],
  ["2026-06-26", "H", "CPV", "KSA", "Houston Stadium"],
  ["2026-06-26", "H", "URU", "ESP", "Estadio Guadalajara"],
  ["2026-06-27", "L", "PAN", "ENG", "New York New Jersey Stadium"],
  ["2026-06-27", "L", "CRO", "GHA", "Philadelphia Stadium"],
  ["2026-06-27", "J", "ALG", "AUT", "Kansas City Stadium"],
  ["2026-06-27", "J", "JOR", "ARG", "Dallas Stadium"],
  ["2026-06-27", "K", "COL", "POR", "Miami Stadium"],
  ["2026-06-27", "K", "COD", "UZB", "Atlanta Stadium"],
];
const matches = [];
let matchNo = 1;
for (const [date, groupCode, homeCode, awayCode, venue] of schedule) {
  const home = teamByCode[homeCode];
  const away = teamByCode[awayCode];
  const stadium = stadiumByVenue[venue];
  matches.push({
    id: `match_${String(matchNo).padStart(3, "0")}`,
    matchNo,
    externalId: `WC2026-G${groupCode}-${matchNo}`,
    stage: "GROUP",
    groupCode,
    homeTeamFifaCode: home.fifaCode,
    awayTeamFifaCode: away.fifaCode,
    homeTeamName: home.name,
    awayTeamName: away.name,
    kickoffAt: `${date}T20:00:00.000Z`,
    kickoffNote:
      "Kickoff time is normalized for seed data. Sync official kickoff time before production use.",
    venue,
    stadiumId: stadium?.id || null,
    hostCityId: stadium ? hostCityIdByStadiumId[stadium.id] : null,
    status: "SCHEDULED",
    imageUrl: image(`matches/${String(matchNo).padStart(3, "0")}`),
    flagUrl: null,
    worldCupIntro: `${home.name} vs ${away.name}，${groupCode}组小组赛，可用于赛前AI分析、每日推荐和挑战赛预测。`,
    ragText: `Match ${matchNo}, Group ${groupCode}, ${home.name} (${home.fifaCode}) vs ${away.name} (${away.fifaCode}), kickoff ${date}.`,
    tags: [
      "match",
      "group-stage",
      `group-${groupCode}`,
      home.fifaCode,
      away.fifaCode,
    ],
  });
  matchNo += 1;
}

const knockoutStages = [
  ["ROUND_OF_32", 16],
  ["ROUND_OF_16", 8],
  ["QUARTER_FINAL", 4],
  ["SEMI_FINAL", 2],
  ["THIRD_PLACE", 1],
  ["FINAL", 1],
];
for (const [stage, count] of knockoutStages) {
  for (let i = 1; i <= count; i += 1) {
    matches.push({
      id: `match_${String(matchNo).padStart(3, "0")}`,
      matchNo,
      externalId: `WC2026-${stage}-${i}`,
      stage,
      groupCode: null,
      homeTeamFifaCode: null,
      awayTeamFifaCode: null,
      homeTeamName: "TBD",
      awayTeamName: "TBD",
      kickoffAt: null,
      venue: null,
      stadiumId: null,
      hostCityId: null,
      status: "SCHEDULED",
      imageUrl: image(`matches/${String(matchNo).padStart(3, "0")}`),
      flagUrl: null,
      worldCupIntro: `2026世界杯${stage}阶段第${i}场，待小组赛排名确定后更新对阵。`,
      ragText: `Match ${matchNo}, ${stage}, teams to be determined.`,
      tags: ["match", "knockout", stage],
    });
    matchNo += 1;
  }
}

const historyRows = [
  [1930, "Uruguay", "Uruguay", "Argentina"],
  [1934, "Italy", "Italy", "Czechoslovakia"],
  [1938, "France", "Italy", "Hungary"],
  [1950, "Brazil", "Uruguay", "Brazil"],
  [1954, "Switzerland", "West Germany", "Hungary"],
  [1958, "Sweden", "Brazil", "Sweden"],
  [1962, "Chile", "Brazil", "Czechoslovakia"],
  [1966, "England", "England", "West Germany"],
  [1970, "Mexico", "Brazil", "Italy"],
  [1974, "West Germany", "West Germany", "Netherlands"],
  [1978, "Argentina", "Argentina", "Netherlands"],
  [1982, "Spain", "Italy", "West Germany"],
  [1986, "Mexico", "Argentina", "West Germany"],
  [1990, "Italy", "West Germany", "Argentina"],
  [1994, "United States", "Brazil", "Italy"],
  [1998, "France", "France", "Brazil"],
  [2002, "Japan/Korea Republic", "Brazil", "Germany"],
  [2006, "Germany", "Italy", "France"],
  [2010, "South Africa", "Spain", "Netherlands"],
  [2014, "Brazil", "Germany", "Argentina"],
  [2018, "Russia", "France", "Croatia"],
  [2022, "Qatar", "Argentina", "France"],
];

const worldCupHistory = historyRows.map(([year, host, winner, runnerUp]) => ({
  id: `world_cup_${year}`,
  year,
  host,
  winner,
  runnerUp,
  imageUrl: image(`history/${year}`),
  flagUrl: null,
  worldCupIntro: `${year}年世界杯由 ${host} 主办，冠军为 ${winner}，亚军为 ${runnerUp}。`,
  ragText: `${year} FIFA World Cup, host ${host}, winner ${winner}, runner-up ${runnerUp}.`,
  tags: ["history", String(year), winner],
}));

const facts = [
  ["format", "2026世界杯首次扩军至48支球队，分为12个小组。"],
  ["hosts", "2026世界杯由加拿大、墨西哥和美国联合举办。"],
  ["groups", "小组赛阶段包括A到L共12个小组，每组4队。"],
  [
    "visual_policy",
    "产品视觉系统只使用国旗、原创插画、原创图标和授权素材，不使用官方赛事标识、吉祥物、奖杯照片、队徽或未经授权球员照片。",
  ],
  [
    "ai_usage",
    "AI报告应结合球队、球员、赛程、场馆、历史事实和风险提示生成，输出仅用于足球数据分析参考。",
  ],
  [
    "rag",
    "RAG检索建议按team、player、group、match、stadium、host-city、history、fact等type过滤。",
  ],
].map(([id, text]) => ({
  id: `fact_${id}`,
  title: id,
  content: text,
  imageUrl: image(`facts/${id}`),
  flagUrl: null,
  worldCupIntro: text,
  ragText: text,
  tags: ["fact", id],
}));

const files = {
  "teams.json": teams,
  "players.json": players,
  "groups.json": groups,
  "matches.json": matches,
  "stadiums.json": stadiums,
  "host_cities.json": hostCities,
  "world_cup_history.json": worldCupHistory,
  "facts.json": facts,
};

mkdirSync(outDir, { recursive: true });
for (const [file, data] of Object.entries(files)) {
  writeFileSync(join(outDir, file), `${JSON.stringify(data, null, 2)}\n`);
}

console.log(
  `Generated ${Object.keys(files).length} World Cup KB files in ${outDir}`,
);
