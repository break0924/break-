export const DEFAULT_IMAGE = '/static/icons/placeholder.svg';
export const DEFAULT_FLAG = '/static/flags/default.svg';

export type StaticAssetKind = 'image' | 'flag' | 'icon';

export type StaticAssetMeta = {
  key: string;
  kind: StaticAssetKind;
  path: string;
  usage: string;
  format: 'svg' | 'webp' | 'png' | 'jpg';
  width: number;
  height: number;
  lazy: boolean;
};

const TEAM_COUNTRY_CODE: Record<string, string> = {
  MEX: 'MX',
  RSA: 'ZA',
  KOR: 'KR',
  CZE: 'CZ',
  CAN: 'CA',
  BIH: 'BA',
  QAT: 'QA',
  SUI: 'CH',
  BRA: 'BR',
  MAR: 'MA',
  HAI: 'HT',
  SCO: 'GB-SCT',
  USA: 'US',
  PAR: 'PY',
  AUS: 'AU',
  TUR: 'TR',
  GER: 'DE',
  CUW: 'CW',
  CIV: 'CI',
  ECU: 'EC',
  NED: 'NL',
  JPN: 'JP',
  SWE: 'SE',
  TUN: 'TN',
  BEL: 'BE',
  EGY: 'EG',
  IRN: 'IR',
  NZL: 'NZ',
  ESP: 'ES',
  CPV: 'CV',
  KSA: 'SA',
  URU: 'UY',
  FRA: 'FR',
  SEN: 'SN',
  IRQ: 'IQ',
  NOR: 'NO',
  ARG: 'AR',
  ALG: 'DZ',
  AUT: 'AT',
  JOR: 'JO',
  POR: 'PT',
  COD: 'CD',
  UZB: 'UZ',
  COL: 'CO',
  ENG: 'GB-ENG',
  CRO: 'HR',
  GHA: 'GH',
  PAN: 'PA',
};

export function countryCodeFromTeam(team?: {
  countryCode?: string | null;
  fifaCode?: string | null;
  flagCode?: string | null;
  code?: string | null;
  name?: string | null;
}) {
  if (!team) {
    return '';
  }

  const countryCode = normalizeFlagCode(team.countryCode || team.flagCode);
  if (countryCode) {
    return countryCode;
  }

  const fifaCode = normalizeFlagCode(team.fifaCode || team.code);
  if (fifaCode && TEAM_COUNTRY_CODE[fifaCode]) {
    return TEAM_COUNTRY_CODE[fifaCode];
  }

  return team.name ? TEAM_NAME_COUNTRY_CODE[team.name] || '' : '';
}

export function flagSrc(countryCode?: string | null) {
  return countryCode ? `/static/flags/${countryCode}.svg` : DEFAULT_FLAG;
}

export function flagSrcForTeam(team?: {
  flagUrl?: string | null;
  countryCode?: string | null;
  fifaCode?: string | null;
  flagCode?: string | null;
  code?: string | null;
  name?: string | null;
}) {
  if (team?.flagUrl) {
    return team.flagUrl;
  }

  return flagSrc(countryCodeFromTeam(team));
}

function normalizeFlagCode(code?: string | null) {
  return code ? code.trim().toUpperCase() : '';
}

export const IMAGE_ASSETS = {
  heroStadium: '/static/images/hero-stadium.svg',
  scheduleFlow: '/static/images/schedule-flow.svg',
  sharePosterBg: '/static/images/share-poster-bg.svg',
  memberCard: '/static/images/member-card.svg',
} as const;

export const ICON_ASSETS = {
  trophy: '/static/icons/trophy.svg',
  pointsBadge: '/static/icons/badge-points.svg',
  levelBadge: '/static/icons/badge-level.svg',
  aiReport: '/static/icons/ai-report.svg',
  dailyPick: '/static/icons/daily-pick.svg',
  hitRate: '/static/icons/hit-rate.svg',
  ranking: '/static/icons/ranking.svg',
} as const;

export const FLAG_MAPPING = [
  { fifaCode: 'MEX', countryCode: 'MX', name: '墨西哥' },
  { fifaCode: 'RSA', countryCode: 'ZA', name: '南非' },
  { fifaCode: 'KOR', countryCode: 'KR', name: '韩国' },
  { fifaCode: 'CZE', countryCode: 'CZ', name: '捷克' },
  { fifaCode: 'CAN', countryCode: 'CA', name: '加拿大' },
  { fifaCode: 'BIH', countryCode: 'BA', name: '波黑' },
  { fifaCode: 'QAT', countryCode: 'QA', name: '卡塔尔' },
  { fifaCode: 'SUI', countryCode: 'CH', name: '瑞士' },
  { fifaCode: 'BRA', countryCode: 'BR', name: '巴西' },
  { fifaCode: 'MAR', countryCode: 'MA', name: '摩洛哥' },
  { fifaCode: 'HAI', countryCode: 'HT', name: '海地' },
  { fifaCode: 'SCO', countryCode: 'GB-SCT', name: '苏格兰' },
  { fifaCode: 'USA', countryCode: 'US', name: '美国' },
  { fifaCode: 'PAR', countryCode: 'PY', name: '巴拉圭' },
  { fifaCode: 'AUS', countryCode: 'AU', name: '澳大利亚' },
  { fifaCode: 'TUR', countryCode: 'TR', name: '土耳其' },
  { fifaCode: 'GER', countryCode: 'DE', name: '德国' },
  { fifaCode: 'CUW', countryCode: 'CW', name: '库拉索' },
  { fifaCode: 'CIV', countryCode: 'CI', name: '科特迪瓦' },
  { fifaCode: 'ECU', countryCode: 'EC', name: '厄瓜多尔' },
  { fifaCode: 'NED', countryCode: 'NL', name: '荷兰' },
  { fifaCode: 'JPN', countryCode: 'JP', name: '日本' },
  { fifaCode: 'SWE', countryCode: 'SE', name: '瑞典' },
  { fifaCode: 'TUN', countryCode: 'TN', name: '突尼斯' },
  { fifaCode: 'BEL', countryCode: 'BE', name: '比利时' },
  { fifaCode: 'EGY', countryCode: 'EG', name: '埃及' },
  { fifaCode: 'IRN', countryCode: 'IR', name: '伊朗' },
  { fifaCode: 'NZL', countryCode: 'NZ', name: '新西兰' },
  { fifaCode: 'ESP', countryCode: 'ES', name: '西班牙' },
  { fifaCode: 'CPV', countryCode: 'CV', name: '佛得角' },
  { fifaCode: 'KSA', countryCode: 'SA', name: '沙特阿拉伯' },
  { fifaCode: 'URU', countryCode: 'UY', name: '乌拉圭' },
  { fifaCode: 'FRA', countryCode: 'FR', name: '法国' },
  { fifaCode: 'SEN', countryCode: 'SN', name: '塞内加尔' },
  { fifaCode: 'IRQ', countryCode: 'IQ', name: '伊拉克' },
  { fifaCode: 'NOR', countryCode: 'NO', name: '挪威' },
  { fifaCode: 'ARG', countryCode: 'AR', name: '阿根廷' },
  { fifaCode: 'ALG', countryCode: 'DZ', name: '阿尔及利亚' },
  { fifaCode: 'AUT', countryCode: 'AT', name: '奥地利' },
  { fifaCode: 'JOR', countryCode: 'JO', name: '约旦' },
  { fifaCode: 'POR', countryCode: 'PT', name: '葡萄牙' },
  { fifaCode: 'COD', countryCode: 'CD', name: '刚果民主共和国' },
  { fifaCode: 'UZB', countryCode: 'UZ', name: '乌兹别克斯坦' },
  { fifaCode: 'COL', countryCode: 'CO', name: '哥伦比亚' },
  { fifaCode: 'ENG', countryCode: 'GB-ENG', name: '英格兰' },
  { fifaCode: 'CRO', countryCode: 'HR', name: '克罗地亚' },
  { fifaCode: 'GHA', countryCode: 'GH', name: '加纳' },
  { fifaCode: 'PAN', countryCode: 'PA', name: '巴拿马' },
];

const TEAM_NAME_COUNTRY_CODE = FLAG_MAPPING.reduce<Record<string, string>>(
  (map, item) => {
    map[item.name] = item.countryCode;
    return map;
  },
  {},
);

export const IMAGE_RESOURCE_LIST: StaticAssetMeta[] = [
  {
    key: 'heroStadium',
    kind: 'image',
    path: IMAGE_ASSETS.heroStadium,
    usage: '首页世界杯主题 Banner',
    format: 'svg',
    width: 1200,
    height: 520,
    lazy: false,
  },
  {
    key: 'scheduleFlow',
    kind: 'image',
    path: IMAGE_ASSETS.scheduleFlow,
    usage: '赛程安排流程图',
    format: 'svg',
    width: 1100,
    height: 360,
    lazy: true,
  },
  {
    key: 'sharePosterBg',
    kind: 'image',
    path: IMAGE_ASSETS.sharePosterBg,
    usage: '挑战赛分享海报背景',
    format: 'svg',
    width: 900,
    height: 1200,
    lazy: true,
  },
  {
    key: 'memberCard',
    kind: 'image',
    path: IMAGE_ASSETS.memberCard,
    usage: '会员权益卡片背景',
    format: 'svg',
    width: 900,
    height: 360,
    lazy: true,
  },
];

export const FLAG_RESOURCE_LIST: StaticAssetMeta[] = [
  {
    key: 'default',
    kind: 'flag',
    path: DEFAULT_FLAG,
    usage: '国旗缺失兜底',
    format: 'svg',
    width: 96,
    height: 64,
    lazy: true,
  },
  ...FLAG_MAPPING.map((item) => ({
    key: item.countryCode,
    kind: 'flag' as const,
    path: flagSrc(item.countryCode),
    usage: `${item.name}国旗`,
    format: 'svg' as const,
    width: 96,
    height: 64,
    lazy: true,
  })),
];

export const ICON_RESOURCE_LIST: StaticAssetMeta[] = [
  {
    key: 'placeholder',
    kind: 'icon',
    path: DEFAULT_IMAGE,
    usage: '通用图片加载失败兜底',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'trophy',
    kind: 'icon',
    path: ICON_ASSETS.trophy,
    usage: '排行榜和挑战赛视觉入口',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'pointsBadge',
    kind: 'icon',
    path: ICON_ASSETS.pointsBadge,
    usage: '挑战赛积分徽章',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'levelBadge',
    kind: 'icon',
    path: ICON_ASSETS.levelBadge,
    usage: '用户等级徽章',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'aiReport',
    kind: 'icon',
    path: ICON_ASSETS.aiReport,
    usage: '会员权益：高级AI报告',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'dailyPick',
    kind: 'icon',
    path: ICON_ASSETS.dailyPick,
    usage: '会员权益：每日精选',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'hitRate',
    kind: 'icon',
    path: ICON_ASSETS.hitRate,
    usage: '会员权益：历史命中率',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
  {
    key: 'ranking',
    kind: 'icon',
    path: ICON_ASSETS.ranking,
    usage: '会员权益：排行榜',
    format: 'svg',
    width: 96,
    height: 96,
    lazy: true,
  },
];

export const STATIC_RESOURCE_LIST = [
  ...IMAGE_RESOURCE_LIST,
  ...FLAG_RESOURCE_LIST,
  ...ICON_RESOURCE_LIST,
];

export function assetByKey(key: string) {
  return STATIC_RESOURCE_LIST.find((asset) => asset.key === key);
}

export function assetPathByKey(key: string, fallback = DEFAULT_IMAGE) {
  return assetByKey(key)?.path || fallback;
}
