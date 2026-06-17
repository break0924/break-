import type {
  ChallengeHome,
  DailyRecommendation,
  InviteStatus,
  LeaderboardItem,
  Match,
  MatchAnalysisContext,
  MatchListQuery,
  MembershipPlan,
  MembershipStatus,
  MyChallengeScore,
  PredictionArchive,
  PredictionArchiveResponse,
  PredictionStats,
  Team,
} from '../api/types';

export const DEMO_TODAY = '2026-06-17';
const tz = 'Asia/Shanghai';

type TeamSeed = {
  fifaCode: string;
  countryCode: string;
  name: string;
  nameEn: string;
  groupName: string;
};

type MatchSeed = {
  date: string;
  time: string;
  group: string;
  home: string;
  away: string;
  status?: Match['status'];
  score?: [number, number];
};

type PredictionSeed = {
  direction: PredictionArchive['recommendationDirection'];
  score: [number, number];
  probs: [number, number, number];
  confidence: number;
  risk: number;
  summary: string;
  full: string;
  publishedAt: string;
};

type TeamProfileSeed = {
  tags: string[];
  strengths: string[];
  risks: string[];
  styleSummary: string;
};

const teamSeeds: TeamSeed[] = [
  team('MEX', 'MX', '墨西哥', 'Mexico', 'A'),
  team('RSA', 'ZA', '南非', 'South Africa', 'A'),
  team('KOR', 'KR', '韩国', 'South Korea', 'A'),
  team('CZE', 'CZ', '捷克', 'Czechia', 'A'),
  team('CAN', 'CA', '加拿大', 'Canada', 'B'),
  team('BIH', 'BA', '波黑', 'Bosnia and Herzegovina', 'B'),
  team('QAT', 'QA', '卡塔尔', 'Qatar', 'B'),
  team('SUI', 'CH', '瑞士', 'Switzerland', 'B'),
  team('BRA', 'BR', '巴西', 'Brazil', 'C'),
  team('HAI', 'HT', '海地', 'Haiti', 'C'),
  team('MAR', 'MA', '摩洛哥', 'Morocco', 'C'),
  team('SCO', 'GB-SCT', '苏格兰', 'Scotland', 'C'),
  team('USA', 'US', '美国', 'United States', 'D'),
  team('AUS', 'AU', '澳大利亚', 'Australia', 'D'),
  team('PAR', 'PY', '巴拉圭', 'Paraguay', 'D'),
  team('TUR', 'TR', '土耳其', 'Turkiye', 'D'),
  team('GER', 'DE', '德国', 'Germany', 'E'),
  team('CUW', 'CW', '库拉索', 'Curacao', 'E'),
  team('CIV', 'CI', '科特迪瓦', "Cote d'Ivoire", 'E'),
  team('ECU', 'EC', '厄瓜多尔', 'Ecuador', 'E'),
  team('NED', 'NL', '荷兰', 'Netherlands', 'F'),
  team('JPN', 'JP', '日本', 'Japan', 'F'),
  team('SWE', 'SE', '瑞典', 'Sweden', 'F'),
  team('TUN', 'TN', '突尼斯', 'Tunisia', 'F'),
  team('BEL', 'BE', '比利时', 'Belgium', 'G'),
  team('EGY', 'EG', '埃及', 'Egypt', 'G'),
  team('IRN', 'IR', '伊朗', 'Iran', 'G'),
  team('NZL', 'NZ', '新西兰', 'New Zealand', 'G'),
  team('ESP', 'ES', '西班牙', 'Spain', 'H'),
  team('CPV', 'CV', '佛得角', 'Cape Verde', 'H'),
  team('KSA', 'SA', '沙特阿拉伯', 'Saudi Arabia', 'H'),
  team('URU', 'UY', '乌拉圭', 'Uruguay', 'H'),
  team('FRA', 'FR', '法国', 'France', 'I'),
  team('IRQ', 'IQ', '伊拉克', 'Iraq', 'I'),
  team('NOR', 'NO', '挪威', 'Norway', 'I'),
  team('SEN', 'SN', '塞内加尔', 'Senegal', 'I'),
  team('ARG', 'AR', '阿根廷', 'Argentina', 'J'),
  team('ALG', 'DZ', '阿尔及利亚', 'Algeria', 'J'),
  team('AUT', 'AT', '奥地利', 'Austria', 'J'),
  team('JOR', 'JO', '约旦', 'Jordan', 'J'),
  team('COL', 'CO', '哥伦比亚', 'Colombia', 'K'),
  team('COD', 'CD', '刚果民主共和国', 'DR Congo', 'K'),
  team('POR', 'PT', '葡萄牙', 'Portugal', 'K'),
  team('UZB', 'UZ', '乌兹别克斯坦', 'Uzbekistan', 'K'),
  team('ENG', 'GB-ENG', '英格兰', 'England', 'L'),
  team('CRO', 'HR', '克罗地亚', 'Croatia', 'L'),
  team('GHA', 'GH', '加纳', 'Ghana', 'L'),
  team('PAN', 'PA', '巴拿马', 'Panama', 'L'),
];

const teamProfiles: Record<string, TeamProfileSeed> = {
  MEX: profile(['边路推进', '高位压迫', '主场节奏'], ['边路宽度和中前场压迫能持续制造二点球机会'], ['压上后身后空间容易被反击利用'], '墨西哥更擅长用宽度和节奏压迫对手。'),
  RSA: profile(['反击速度', '身体对抗', '定位球威胁'], ['转换进攻速度快，定位球落点有冲击力'], ['阵地防守连续性不足'], '南非更依赖反击和身体对抗打开局面。'),
  KOR: profile(['回防速度', '边路冲刺', '前场逼抢'], ['攻守转换速度快，边路推进有持续威胁'], ['面对高点冲击时禁区保护会承压'], '韩国适合把比赛拉快，用边路和逼抢制造优势。'),
  CZE: profile(['身体对抗', '高点冲击', '定位球威胁'], ['禁区高点和定位球质量较稳定'], ['横向移动速度偏慢'], '捷克更适合消耗战和定位球场景。'),
  CAN: profile(['边路推进', '主场强度', '反击效率'], ['边路速度和纵深冲击能快速推进到前场'], ['防线回收后保护层次容易波动'], '加拿大依靠速度和主场节奏提升进攻效率。'),
  BIH: profile(['中路组织', '定位球威胁', '老练节奏'], ['中场出球和定位球能制造稳定机会'], ['防线转身速度和持续压迫不足'], '波黑更偏经验型打法，适合把节奏压慢。'),
  QAT: profile(['低位防守', '短传衔接', '转换推进'], ['低位阵型保持较紧，反击第一脚有质量'], ['被持续压迫时出球容易变形'], '卡塔尔更适合守住空间后寻找转换机会。'),
  SUI: profile(['阵型纪律', '中场控制', '防守稳定'], ['攻守结构均衡，比赛管理能力强'], ['打不开局面时终结效率会被放大检验'], '瑞士胜在结构稳定和中场控制。'),
  BRA: profile(['前场终结', '个人突破', '边路创造'], ['前场个人能力和禁区前创造力突出'], ['领先后节奏松动会给对手反击空间'], '巴西更容易通过个人能力打破僵局。'),
  HAI: profile(['反击速度', '身体对抗', '纵深冲刺'], ['前场纵深冲击可以制造突然性'], ['控球阶段稳定性不足'], '海地更适合利用空间打快速转换。'),
  MAR: profile(['低位防守', '反击效率', '边路速度'], ['防守纪律和转换速度都具备比赛韧性'], ['主动控球时创造力不够稳定'], '摩洛哥擅长用纪律性防守拖住强队。'),
  SCO: profile(['身体对抗', '定位球威胁', '低比分韧性'], ['高点争夺和定位球是主要得分手段'], ['阵地推进缺少持续变化'], '苏格兰适合把比赛变成对抗强的低比分局。'),
  USA: profile(['主场节奏', '边路冲击', '前场压迫'], ['主场推进强度和前场跑动能制造压迫'], ['防线身后空间可能被反打'], '美国更依赖速度、宽度和主场能量。'),
  AUS: profile(['身体对抗', '高点冲击', '防守韧性'], ['空中球和身体对抗稳定，防守韧性较好'], ['中前场细腻配合不足'], '澳大利亚更适合强对抗和定位球比赛。'),
  PAR: profile(['低位防守', '反击偷点', '身体对抗'], ['防线压缩空间能力强，反击落点直接'], ['落后时主动进攻办法有限'], '巴拉圭擅长低位防守和突然反击。'),
  TUR: profile(['中前场变化', '远射威胁', '节奏切换'], ['中前场脚下变化多，能通过远射和肋部配合制造机会'], ['攻防转换时稳定性不足'], '土耳其更具创造性，但波动也更明显。'),
  GER: profile(['阵容厚度', '中场控制', '高位压迫'], ['阵容深度和中场压制力明显'], ['防线前压后需要警惕反击'], '德国依靠体系和阵容厚度掌控比赛。'),
  CUW: profile(['低位防守', '反击速度', '身体对抗'], ['防守收缩后能利用速度打身后'], ['持续控球和禁区保护压力较大'], '库拉索更适合低位防守和快速反击。'),
  CIV: profile(['身体对抗', '边路推进', '前场终结'], ['身体优势和边路推进能带来禁区冲击'], ['阵型前后距离偶有拉大'], '科特迪瓦依靠身体条件和边路冲击制造威胁。'),
  ECU: profile(['高原体能', '反抢强度', '中场覆盖'], ['中场覆盖面积大，反抢后推进效率较高'], ['面对密集防守时终结不够稳定'], '厄瓜多尔强在对抗和中场覆盖。'),
  NED: profile(['边翼推进', '中场控制', '防线出球'], ['边翼推进和后场出球能形成持续压迫'], ['被快速反击时中卫身后有风险'], '荷兰更依赖边翼宽度和体系推进。'),
  JPN: profile(['脚下传控', '回防速度', '团队压迫'], ['脚下连接和整体跑动能保持节奏'], ['面对强身体对抗时禁区冲击不足'], '日本适合用传控和跑动消耗对手。'),
  SWE: profile(['高点冲击', '低位防守', '定位球威胁'], ['定位球和空中对抗是稳定得分来源'], ['地面推进速度偏慢'], '瑞典更偏高点和防守纪律。'),
  TUN: profile(['低位防守', '反击速度', '中场缠斗'], ['防守韧性和中场对抗能拖慢比赛'], ['进攻端连续创造机会不足'], '突尼斯适合把比赛拖成拉锯战。'),
  BEL: profile(['中场创造', '前场终结', '阵容厚度'], ['中前场创造力和终结点更多'], ['防线回追速度存在隐患'], '比利时更依赖中前场创造力。'),
  EGY: profile(['边路反击', '前场终结', '转换速度'], ['边路反击和关键球能力有突然性'], ['中场被压制时防线承压明显'], '埃及擅长通过边路反击制造威胁。'),
  IRN: profile(['低位防守', '身体对抗', '定位球威胁'], ['防线压缩和定位球冲击较稳定'], ['主动压上后回防速度受考验'], '伊朗更适合稳守后找定位球。'),
  NZL: profile(['身体对抗', '高点冲击', '防守韧性'], ['空中球和对抗不吃亏'], ['地面组织和前场细节不足'], '新西兰更依赖高点和防守韧性。'),
  ESP: profile(['中场控制', '节奏压制', '肋部渗透'], ['控球和肋部渗透能持续消耗对手'], ['禁区终结效率会影响优势兑现'], '西班牙通过控球和节奏压制建立优势。'),
  CPV: profile(['身体对抗', '边路冲刺', '反击效率'], ['边路冲刺和身体对抗能制造转换机会'], ['阵地防守被连续调动时容易变形'], '佛得角更适合利用空间和身体条件反击。'),
  KSA: profile(['短传衔接', '前场逼抢', '节奏变化'], ['短传推进和前场逼抢有组织性'], ['身体对抗和定位球防守需要保护'], '沙特阿拉伯更依赖短传和节奏变化。'),
  URU: profile(['身体对抗', '前场终结', '压迫强度'], ['对抗强度和前场终结都具备硬度'], ['高强度下犯规和牌面风险上升'], '乌拉圭擅长用压迫和对抗改变比赛节奏。'),
  FRA: profile(['阵容厚度', '前场终结', '反击效率'], ['阵容深度和前场终结点多，转换进攻质量高'], ['领先后节奏管理和轮换会影响稳定性'], '法国强在阵容厚度、速度和终结质量。'),
  IRQ: profile(['低位防守', '中场缠斗', '反击落点'], ['防线韧性和中场对抗能拖慢比赛'], ['前场终结效率偏依赖机会质量'], '伊拉克适合把比赛压成低比分拉锯。'),
  NOR: profile(['高点冲击', '前场终结', '直线推进'], ['锋线终结和直线推进效率较高'], ['阵地控场稳定性不如顶级强队'], '挪威依靠锋线冲击和终结质量。'),
  SEN: profile(['身体对抗', '反击推进', '低位防守'], ['身体对抗强，反击推进能持续给强队压力'], ['阵地进攻细节和最后一传稳定性不足'], '塞内加尔强在对抗、速度和防守韧性。'),
  ARG: profile(['中场控制', '前场终结', '比赛管理'], ['中场控制和比赛管理能力强'], ['被高强度逼抢时需要提高出球速度'], '阿根廷擅长控节奏并把机会转化为进球。'),
  ALG: profile(['边路推进', '反击速度', '身体对抗'], ['边路推进和反击速度可以制造突然性'], ['防线面对连续压迫时稳定性不足'], '阿尔及利亚依赖边路和转换进攻。'),
  AUT: profile(['高位压迫', '中场覆盖', '节奏压制'], ['压迫强度和中场覆盖能限制对手出球'], ['被打身后时需要防线补位'], '奥地利更适合用压迫和组织性掌控比赛。'),
  JOR: profile(['低位防守', '反击落点', '比赛韧性'], ['防守韧性和反击落点有威胁'], ['持续控球能力有限'], '约旦适合稳守后寻找反击机会。'),
  COL: profile(['边路推进', '身体对抗', '前场创造'], ['边路推进和前场个人能力能制造机会'], ['中后场衔接偶有波动'], '哥伦比亚攻守转换和边路推进有冲击力。'),
  COD: profile(['身体对抗', '反击速度', '高点冲击'], ['身体条件和纵深冲击很直接'], ['阵地组织和防线纪律需要稳定'], '刚果民主共和国依靠身体和速度制造混乱。'),
  POR: profile(['阵容厚度', '边路创造', '前场终结'], ['阵容厚度和边路创造力突出'], ['面对低位密集时需要提高节奏变化'], '葡萄牙通过边路创造和多点终结建立优势。'),
  UZB: profile(['防守纪律', '反击落点', '中场覆盖'], ['阵型纪律和中场覆盖较好'], ['面对高压时出球质量受考验'], '乌兹别克斯坦更偏纪律型和反击型打法。'),
  ENG: profile(['阵容厚度', '定位球威胁', '边路推进'], ['阵容厚度和定位球质量稳定'], ['节奏偏慢时创造力会被质疑'], '英格兰依靠阵容深度和定位球形成优势。'),
  CRO: profile(['中场控制', '比赛管理', '经验优势'], ['中场控节奏和比赛管理经验突出'], ['高龄化带来的回追速度是风险'], '克罗地亚更擅长把比赛带入自己节奏。'),
  GHA: profile(['身体对抗', '反击速度', '前场冲击'], ['身体和速度能制造快速冲击'], ['防守站位和出球稳定性波动'], '加纳依靠速度和身体对抗制造威胁。'),
  PAN: profile(['低位防守', '身体对抗', '反击落点'], ['防守压缩和反击落点具备突然性'], ['被持续压迫时犯错风险上升'], '巴拿马更适合低位防守后反击。'),
};

const matchSeeds: MatchSeed[] = [
  match('2026-06-12', '03:00', 'A', 'MEX', 'RSA', 'FINISHED', [2, 0]),
  match('2026-06-12', '10:00', 'A', 'KOR', 'CZE', 'FINISHED', [2, 1]),
  match('2026-06-13', '03:00', 'B', 'CAN', 'BIH', 'FINISHED', [1, 1]),
  match('2026-06-13', '09:00', 'D', 'USA', 'PAR', 'FINISHED', [4, 1]),
  match('2026-06-14', '03:00', 'B', 'QAT', 'SUI', 'FINISHED', [1, 1]),
  match('2026-06-14', '06:00', 'C', 'BRA', 'MAR', 'FINISHED', [1, 1]),
  match('2026-06-14', '09:00', 'C', 'HAI', 'SCO', 'FINISHED', [0, 1]),
  match('2026-06-14', '12:00', 'D', 'AUS', 'TUR', 'FINISHED', [2, 0]),
  match('2026-06-15', '01:00', 'E', 'GER', 'CUW', 'FINISHED', [7, 1]),
  match('2026-06-15', '04:00', 'F', 'NED', 'JPN', 'FINISHED', [2, 2]),
  match('2026-06-15', '07:00', 'E', 'CIV', 'ECU', 'FINISHED', [1, 0]),
  match('2026-06-15', '10:00', 'F', 'SWE', 'TUN', 'FINISHED', [5, 1]),
  match('2026-06-16', '00:00', 'H', 'ESP', 'CPV', 'FINISHED', [0, 0]),
  match('2026-06-16', '03:00', 'G', 'BEL', 'EGY', 'FINISHED', [1, 1]),
  match('2026-06-16', '06:00', 'H', 'KSA', 'URU', 'FINISHED', [1, 1]),
  match('2026-06-16', '09:00', 'G', 'IRN', 'NZL', 'FINISHED', [2, 2]),
  match('2026-06-17', '03:00', 'I', 'FRA', 'SEN', 'FINISHED', [3, 1]),
  match('2026-06-17', '06:00', 'I', 'IRQ', 'NOR', 'FINISHED', [1, 4]),
  match('2026-06-17', '09:00', 'J', 'ARG', 'ALG', 'FINISHED', [3, 0]),
  match('2026-06-17', '12:00', 'J', 'AUT', 'JOR'),
  match('2026-06-18', '01:00', 'K', 'POR', 'COD'),
  match('2026-06-18', '04:00', 'L', 'ENG', 'CRO'),
  match('2026-06-18', '07:00', 'L', 'GHA', 'PAN'),
  match('2026-06-18', '10:00', 'K', 'UZB', 'COL'),
  match('2026-06-19', '00:00', 'A', 'CZE', 'RSA'),
  match('2026-06-19', '03:00', 'B', 'SUI', 'BIH'),
  match('2026-06-19', '06:00', 'B', 'CAN', 'QAT'),
  match('2026-06-19', '09:00', 'A', 'MEX', 'KOR'),
  match('2026-06-20', '03:00', 'D', 'USA', 'AUS'),
  match('2026-06-20', '06:00', 'C', 'SCO', 'MAR'),
  match('2026-06-20', '09:00', 'C', 'BRA', 'HAI'),
  match('2026-06-20', '12:00', 'D', 'TUR', 'PAR'),
  match('2026-06-21', '01:00', 'F', 'NED', 'SWE'),
  match('2026-06-21', '04:00', 'E', 'GER', 'CIV'),
  match('2026-06-21', '08:00', 'E', 'ECU', 'CUW'),
  match('2026-06-21', '12:00', 'F', 'TUN', 'JPN'),
  match('2026-06-22', '00:00', 'H', 'ESP', 'KSA'),
  match('2026-06-22', '03:00', 'G', 'BEL', 'IRN'),
  match('2026-06-22', '06:00', 'H', 'URU', 'CPV'),
  match('2026-06-22', '09:00', 'G', 'NZL', 'EGY'),
  match('2026-06-23', '01:00', 'J', 'ARG', 'AUT'),
  match('2026-06-23', '05:00', 'I', 'FRA', 'IRQ'),
  match('2026-06-23', '08:00', 'I', 'NOR', 'SEN'),
  match('2026-06-23', '11:00', 'J', 'JOR', 'ALG'),
  match('2026-06-24', '01:00', 'K', 'POR', 'UZB'),
  match('2026-06-24', '04:00', 'L', 'ENG', 'GHA'),
  match('2026-06-24', '07:00', 'L', 'PAN', 'CRO'),
  match('2026-06-24', '10:00', 'K', 'COL', 'COD'),
  match('2026-06-25', '03:00', 'B', 'SUI', 'CAN'),
  match('2026-06-25', '03:00', 'B', 'BIH', 'QAT'),
  match('2026-06-25', '06:00', 'C', 'SCO', 'BRA'),
  match('2026-06-25', '06:00', 'C', 'MAR', 'HAI'),
  match('2026-06-25', '09:00', 'A', 'CZE', 'MEX'),
  match('2026-06-25', '09:00', 'A', 'RSA', 'KOR'),
  match('2026-06-26', '04:00', 'E', 'CUW', 'CIV'),
  match('2026-06-26', '04:00', 'E', 'ECU', 'GER'),
  match('2026-06-26', '07:00', 'F', 'JPN', 'SWE'),
  match('2026-06-26', '07:00', 'F', 'TUN', 'NED'),
  match('2026-06-26', '10:00', 'D', 'TUR', 'USA'),
  match('2026-06-26', '10:00', 'D', 'PAR', 'AUS'),
  match('2026-06-27', '03:00', 'I', 'NOR', 'FRA'),
  match('2026-06-27', '03:00', 'I', 'SEN', 'IRQ'),
  match('2026-06-27', '08:00', 'H', 'CPV', 'KSA'),
  match('2026-06-27', '08:00', 'H', 'URU', 'ESP'),
  match('2026-06-27', '11:00', 'G', 'EGY', 'IRN'),
  match('2026-06-27', '11:00', 'G', 'NZL', 'BEL'),
  match('2026-06-28', '05:00', 'L', 'PAN', 'ENG'),
  match('2026-06-28', '05:00', 'L', 'CRO', 'GHA'),
  match('2026-06-28', '07:30', 'K', 'COL', 'POR'),
  match('2026-06-28', '07:30', 'K', 'COD', 'UZB'),
  match('2026-06-28', '10:00', 'J', 'ALG', 'AUT'),
  match('2026-06-28', '10:00', 'J', 'JOR', 'ARG'),
];

const predictionSeeds: Record<string, PredictionSeed> = {
  [matchId('2026-06-12', 'MEX', 'RSA')]: prediction('HOME_WIN', [2, 0], [54, 27, 19], 72, 41, '墨西哥主场节奏更稳定，南非反击速度有威胁但持续压迫不足。', '墨西哥在控球与前场压迫上优势明显，南非需要依靠转换与定位球制造机会。', '2026-06-11T20:00:00+08:00'),
  [matchId('2026-06-12', 'KOR', 'CZE')]: prediction('HOME_WIN', [2, 1], [43, 30, 27], 64, 55, '韩国转换速度更积极，捷克身体对抗和定位球会带来不确定性。', '韩国更依赖边路推进，捷克的高点冲击可能影响比赛节奏。', '2026-06-11T20:00:00+08:00'),
  [matchId('2026-06-13', 'CAN', 'BIH')]: prediction('DRAW', [1, 1], [32, 39, 29], 61, 58, '加拿大整体推进更稳，波黑防线波动较大，AI判断平局概率偏高。', '双方中场对抗接近，加拿大主场环境有优势，波黑反击与定位球仍需重点关注。', '2026-06-12T20:00:00+08:00'),
  [matchId('2026-06-13', 'USA', 'PAR')]: prediction('HOME_WIN', [2, 1], [50, 27, 23], 69, 52, '美国主场推进和前场冲击更主动，巴拉圭防守反击存在威胁。', '美国在节奏和宽度上更占优，但巴拉圭低位防守会提升比赛波动。', '2026-06-12T20:00:00+08:00'),
  [matchId('2026-06-14', 'QAT', 'SUI')]: prediction('AWAY_WIN', [0, 2], [22, 29, 49], 67, 43, '瑞士整体结构和防守稳定性更好，卡塔尔需要依靠转换制造机会。', '瑞士在攻守均衡和阵地推进上更成熟，卡塔尔若早段守住比分，比赛风险会上升。', '2026-06-13T20:00:00+08:00'),
  [matchId('2026-06-14', 'BRA', 'MAR')]: prediction('HOME_WIN', [2, 1], [45, 31, 24], 63, 57, '巴西个人能力与前场压迫更强，摩洛哥防守组织会让比赛更胶着。', '巴西在边路与禁区前创造力更突出，摩洛哥的反击速度和防线纪律会影响最终走势。', '2026-06-13T20:00:00+08:00'),
  [matchId('2026-06-14', 'HAI', 'SCO')]: prediction('AWAY_WIN', [0, 1], [24, 33, 43], 60, 50, '苏格兰对抗和定位球质量更有优势，海地需要提高前场终结效率。', '苏格兰更适合打低比分消耗战，海地若能提升反击效率，平局概率会被拉高。', '2026-06-13T20:00:00+08:00'),
  [matchId('2026-06-14', 'AUS', 'TUR')]: prediction('DRAW', [1, 1], [33, 35, 32], 58, 61, '澳大利亚身体对抗稳定，土耳其中前场变化更多，双方存在拉锯空间。', '两队风格差异明显，比赛节奏可能被中场对抗切碎，临场阵容会影响方向判断。', '2026-06-13T20:00:00+08:00'),
  [matchId('2026-06-17', 'FRA', 'SEN')]: prediction('HOME_WIN', [2, 1], [49, 29, 22], 68, 53, '法国阵容厚度和前场终结更占优，但塞内加尔的对抗强度会把比赛拉回低比分区间。', 'V3 模型综合 Elo、近况、候选比分分布和最新校准逻辑后，法国方向仍然领先；不过塞内加尔在反击推进和身体对抗上具备持续施压能力，参考比分以 2:1 和 1:1 为主，风险等级维持中档。', '2026-06-16T18:20:00+08:00'),
  [matchId('2026-06-17', 'IRQ', 'NOR')]: prediction('AWAY_WIN', [0, 1], [25, 31, 44], 63, 49, '挪威在推进效率和终结质量上更稳，伊拉克若能把节奏拖慢，平局空间仍在。', 'V3 模型在低比分修正后，更倾向这场落在 0:1 或 1:1 区间。挪威的中前场衔接更完整，但伊拉克的防守韧性会压低总进球预期，因此更适合客队不败思路，谨防低比分平局。', '2026-06-16T18:32:00+08:00'),
  [matchId('2026-06-17', 'ARG', 'ALG')]: prediction('HOME_WIN', [2, 0], [57, 24, 19], 76, 41, '阿根廷整体强度、控场能力和前场兑现率都更高，是当天相对更清晰的一场主胜方向。', 'V3 模型在球队强度、近期状态和候选比分分布上都明显偏向阿根廷，低比分修正后 2:0、2:1 仍是最集中区间。阿尔及利亚若前段顶住压力，比赛可能短暂胶着，但整体更看好阿根廷掌控走势。', '2026-06-16T18:48:00+08:00'),
  [matchId('2026-06-17', 'AUT', 'JOR')]: prediction('HOME_WIN', [2, 1], [45, 30, 25], 61, 56, '奥地利整体组织更顺，但约旦的反击落点和比赛韧性会让这场保留波动空间。', 'V3 模型给出奥地利方向小幅领先，候选比分集中在 2:1、1:1 和 1:0。奥地利中前场推进更完整，约旦若能把转换质量打出来，平局风险会明显上升，因此这场更适合中等信心参考。', '2026-06-16T19:05:00+08:00'),
};

export const DEMO_TEAMS: Team[] = teamSeeds.map((item) => ({
  id: teamId(item.fifaCode),
  name: item.name,
  nameEn: item.nameEn,
  fifaCode: item.fifaCode,
  countryCode: item.countryCode,
  groupName: item.groupName,
  flagUrl: `/static/flags/${item.countryCode}.svg`,
}));

const teamByCode = Object.fromEntries(DEMO_TEAMS.map((item) => [item.fifaCode, item]));

export const DEMO_MATCHES: Match[] = matchSeeds.map((item) => {
  const homeTeam = teamByCode[item.home];
  const awayTeam = teamByCode[item.away];
  const id = matchId(item.date, item.home, item.away);
  const [homeScore, awayScore] = item.score || [null, null];
  return {
    id,
    stage: 'GROUP',
    groupName: `${item.group}组`,
    matchDate: item.date,
    kickoffTime: item.time,
    timezone: tz,
    kickoffAt: `${item.date}T${item.time}:00+08:00`,
    venue: '赛场待定',
    city: '',
    roundName: '小组赛',
    status: item.status || 'SCHEDULED',
    homeScore,
    awayScore,
    winnerTeamId: winnerId(homeTeam, awayTeam, item.score),
    homeTeam,
    awayTeam,
  };
});

export const DEMO_PREDICTIONS: PredictionArchive[] = DEMO_MATCHES
  .filter((item) => predictionSeeds[item.id] || item.matchDate === DEMO_TODAY)
  .map((matchItem) => buildPrediction(matchItem, predictionSeeds[matchItem.id]));

export const DEMO_PREDICTION_STATS: PredictionStats = buildDemoPredictionStats();

export const DEMO_MEMBERSHIP_STATUS: MembershipStatus = {
  userId: 'demo_user',
  membershipStatus: 'NONE',
  membershipExpireAt: null,
  isMember: false,
  benefits: ['今日全部比赛预测', '完整推荐理由', '历史命中率详情', '高级榜单'],
};

export const DEMO_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan_weekly',
    code: 'WEEKLY_PASS',
    name: '体验周卡',
    priceCents: 1290,
    durationDays: 7,
    benefits: ['7天内全部比赛预测', '完整推荐理由', '更多比分参考'],
  },
  {
    id: 'plan_worldcup_pass',
    code: 'WORLD_CUP_PASS',
    name: '世界杯通行证',
    priceCents: 2990,
    durationDays: 39,
    benefits: ['世界杯期间全部比赛预测', '完整AI报告', '历史命中率详情', '高级榜单'],
  },
];

export const DEMO_INVITE_STATUS: InviteStatus = {
  inviteCode: 'WC2026-AI88',
  inviterId: 'demo_user',
  invitedCount: 18,
  invitedPaidCount: 5,
};

export const DEMO_CHALLENGE_HOME: ChallengeHome = {
  season: {
    id: 'season_2026_worldcup',
    name: '2026世界杯挑战赛',
    startsAt: '2026-06-12T00:00:00+08:00',
    endsAt: '2026-07-20T00:00:00+08:00',
  },
  myScore: {
    points: 186,
    title: '赛前情报官',
    rank: 36,
  },
};

export const DEMO_MY_CHALLENGE_SCORE: MyChallengeScore = {
  season: DEMO_CHALLENGE_HOME.season!,
  score: DEMO_CHALLENGE_HOME.myScore!,
};

export const DEMO_LEADERBOARD: LeaderboardItem[] = [
  leaderboard('u_01', 1, '北境战术师', 268, '世界杯冠军预言家'),
  leaderboard('u_02', 2, '蓝色看台', 254, '世界杯战术大师'),
  leaderboard('u_03', 3, '赛前雷达', 239, '世界杯情报官'),
  leaderboard('u_04', 4, '黄金边路', 226, 'Top 5 精英挑战者'),
  leaderboard('u_05', 5, '绿茵观察员', 219, 'Top 5 精英挑战者'),
  leaderboard('u_06', 6, '半场风向', 211, 'Top 10 荣誉挑战者'),
  leaderboard('u_07', 7, '数据前腰', 207, 'Top 10 荣誉挑战者'),
  leaderboard('u_08', 8, '夜赛守望者', 201, 'Top 10 荣誉挑战者'),
  leaderboard('u_09', 9, '禁区指南针', 197, 'Top 10 荣誉挑战者'),
  leaderboard('u_10', 10, '战报收藏家', 192, 'Top 10 荣誉挑战者'),
  leaderboard('demo_user', 36, '世界杯体验官', 186, '赛前情报官'),
];

export function demoMatches(params?: MatchListQuery): Match[] {
  let rows = [...DEMO_MATCHES];
  if (params?.date) rows = rows.filter((item) => item.matchDate === params.date);
  if (params?.groupName) rows = rows.filter((item) => item.groupName === params.groupName || item.groupName === `${params.groupName}组`);
  if (params?.stage) rows = rows.filter((item) => item.stage === params.stage);
  if (params?.status) rows = rows.filter((item) => item.status === params.status);
  return rows.sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}

export function demoUpcomingMatches(limit = 4, now = new Date()): Match[] {
  const currentTime = now.getTime();
  return DEMO_MATCHES
    .filter((item) => isUpcomingMatch(item, currentTime))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, limit);
}

export function demoTodayRecommendation(date = DEMO_TODAY): DailyRecommendation {
  const matches = demoMatches({ date });
  return {
    id: `daily_${date}`,
    title: '今日AI赛前情报',
    intro: `今日共 ${matches.length} 场比赛，已更新 ${matches.length} 场赛前分析`,
    generatedAt: `${date}T00:30:00+08:00`,
    isMember: false,
    matches: matches.map((matchItem, index) => {
      const archive = demoPredictionByMatch(matchItem.id);
      return {
        id: `rec_${matchItem.id}`,
        recommendationDirection: archive.recommendationDirection,
        predictedHome: archive.predictedHome,
        predictedAway: archive.predictedAway,
        homeWinProb: archive.homeWinProb,
        drawProb: archive.drawProb,
        awayWinProb: archive.awayWinProb,
        riskIndex: archive.riskIndex,
        confidenceIndex: archive.confidenceIndex,
        scoreCandidates: archive.scoreCandidates || demoScoreCandidates(archive),
        totalGoalsRange: archive.totalGoalsRange || demoTotalGoalsRange(archive),
        overUnderLean: archive.overUnderLean || '均衡',
        totalGoalsDistribution: archive.totalGoalsDistribution || null,
        freeReason: archive.shortAnalysis || archive.recommendationReason,
        memberReason: archive.fullAnalysis || archive.recommendationReason,
        locked: index > 0,
        unlockHint: index > 0 ? '开通会员查看今日全部比赛分析' : null,
        match: { ...matchItem, aiPrediction: archive },
      };
    }),
  };
}

export function demoUpcomingRecommendation(limit = 4, now = new Date()): DailyRecommendation {
  const matches = demoUpcomingMatches(limit, now);
  const firstDate = matches[0]?.matchDate || '';
  return {
    id: `upcoming_${firstDate || 'next'}`,
    title: '近期AI赛前情报',
    intro: `接下来 ${matches.length} 场重点比赛，赛前分析已更新`,
    generatedAt: `${firstDate || DEMO_TODAY}T00:30:00+08:00`,
    isMember: false,
    matches: matches.map((matchItem, index) => {
      const archive = demoPredictionByMatch(matchItem.id);
      return {
        id: `rec_${matchItem.id}`,
        recommendationDirection: archive.recommendationDirection,
        predictedHome: archive.predictedHome,
        predictedAway: archive.predictedAway,
        homeWinProb: archive.homeWinProb,
        drawProb: archive.drawProb,
        awayWinProb: archive.awayWinProb,
        riskIndex: archive.riskIndex,
        confidenceIndex: archive.confidenceIndex,
        scoreCandidates: archive.scoreCandidates || demoScoreCandidates(archive),
        totalGoalsRange: archive.totalGoalsRange || demoTotalGoalsRange(archive),
        overUnderLean: archive.overUnderLean || '均衡',
        totalGoalsDistribution: archive.totalGoalsDistribution || null,
        freeReason: archive.shortAnalysis || archive.recommendationReason,
        memberReason: archive.fullAnalysis || archive.recommendationReason,
        locked: index > 0,
        unlockHint: index > 0 ? '开通会员查看更多完整赛前分析' : null,
        match: { ...matchItem, aiPrediction: archive },
      };
    }),
  };
}

export function demoPredictionToday(date = DEMO_TODAY): PredictionArchiveResponse {
  return {
    source: 'demo',
    date,
    predictions: demoMatches({ date }).map((item) => demoPredictionByMatch(item.id)),
  };
}

export function demoUpcomingPredictionToday(limit = 4, now = new Date()): PredictionArchiveResponse {
  const matches = demoUpcomingMatches(limit, now);
  return {
    source: 'demo',
    date: matches[0]?.matchDate || '',
    predictions: matches.map((item) => demoPredictionByMatch(item.id)),
  };
}

export function demoPredictionArchive(params?: { date?: string; hit?: 'hit' | 'miss' | 'pending' }): PredictionArchiveResponse {
  let predictions = params?.date
    ? demoPredictionToday(params.date).predictions
    : [...DEMO_PREDICTIONS];
  if (params?.hit) {
    predictions = predictions.filter((item) => {
      if (params.hit === 'pending') return !item.settlement;
      return params.hit === 'hit' ? item.settlement?.hitResult : item.settlement && !item.settlement.hitResult;
    });
  }
  return { source: 'demo', date: params?.date, predictions };
}

export function demoHomePredictions() {
  return demoUpcomingPredictionToday(4).predictions.map((item) => ({
    id: item.id,
    matchId: item.matchId,
    kickoffTime: item.match?.kickoffTime || '',
    groupName: item.match?.groupName || '',
    homeTeam: item.homeTeamName,
    homeFlag: item.match?.homeTeam.flagUrl || '',
    awayTeam: item.awayTeamName,
    awayFlag: item.match?.awayTeam.flagUrl || '',
    predictedScore: `${item.predictedHome}-${item.predictedAway}`,
    scoreCandidates: item.scoreCandidates || demoScoreCandidates(item),
    totalGoalsRange: item.totalGoalsRange || demoTotalGoalsRange(item),
    overUnderLean: item.overUnderLean || '均衡',
    direction: directionLabel(item.recommendationDirection, item.match!),
    confidence: levelFromIndex(item.confidenceIndex, 'confidence'),
    risk: levelFromIndex(item.riskIndex, 'risk'),
    summary: item.shortAnalysis || item.recommendationReason,
    archiveLabel: item.publishedAt ? `已更新 ${formatMonthDayTime(item.publishedAt)}` : '已更新',
    probabilities: {
      home: Number(item.homeWinProbability ?? item.homeWinProb),
      draw: Number(item.drawProbability ?? item.drawProb),
      away: Number(item.awayWinProbability ?? item.awayWinProb),
    },
  }));
}

function buildPrediction(matchItem: Match, seed?: PredictionSeed): PredictionArchive {
  const fallback = seed || defaultPrediction(matchItem);
  const [predictedHome, predictedAway] = fallback.score;
  const [homeWinProb, drawProb, awayWinProb] = fallback.probs;
  const settlement = buildSettlement(matchItem, fallback);
  const analysisContext = buildMatchAnalysisContext(matchItem, fallback);
  const customAnalysis = buildMatchAnalysisCopy(matchItem, fallback, analysisContext);
  return {
    id: `pred_${matchItem.id}`,
    matchId: matchItem.id,
    status: 'PUBLISHED',
    predictionStage: matchItem.status === 'FINISHED' ? 'LOCKED' : 'PUBLISHED',
    homeTeamName: matchItem.homeTeam.name,
    awayTeamName: matchItem.awayTeam.name,
    kickoffAt: matchItem.kickoffAt,
    publishedAt: fallback.publishedAt,
    generatedAt: fallback.publishedAt.replace('20:00', '18:00'),
    lockedAt: matchItem.status === 'FINISHED' ? matchItem.kickoffAt : null,
    recommendationDirection: fallback.direction,
    homeWinProb,
    drawProb,
    awayWinProb,
    homeWinProbability: homeWinProb,
    drawProbability: drawProb,
    awayWinProbability: awayWinProb,
    predictedHome,
    predictedAway,
    predictedScore: `${predictedHome}-${predictedAway}`,
    scoreCandidates: demoScoreCandidates({
      predictedHome,
      predictedAway,
    }),
    totalGoalsRange: demoTotalGoalsRange({
      predictedHome,
      predictedAway,
    }),
    overUnderLean: predictedHome + predictedAway >= 3 ? '偏大' : '均衡',
    totalGoalsDistribution: null,
    totalGoalsPrediction: predictedHome + predictedAway,
    predictedTotalGoals: predictedHome + predictedAway,
    confidenceIndex: fallback.confidence,
    riskIndex: fallback.risk,
    confidenceLevel: levelFromIndex(fallback.confidence, 'confidence'),
    riskLevel: levelFromIndex(fallback.risk, 'risk'),
    isHighConfidence: fallback.confidence >= 70 && fallback.risk <= 55,
    isCautious: fallback.risk >= 70 || fallback.confidence < 55,
    recommendationReason: fallback.summary,
    riskTip: customAnalysis.riskTip,
    shortAnalysis: customAnalysis.shortAnalysis,
    fullAnalysis: customAnalysis.fullAnalysis,
    analysisDetails: customAnalysis.analysisDetails,
    scoreCandidateNote: customAnalysis.scoreCandidateNote,
    analysisContext,
    disclaimer: 'AI分析仅供足球数据参考，不承诺结果；挑战赛仅计算虚拟积分与称号。',
    correctionNote: null,
    model: 'demo-prediction-engine-v3-calibrated',
    modelVersion: 'demo-v3-20260617',
    promptVersion: 'worldcup-demo-20260617-v3',
    isMemberContent: true,
    isPublic: true,
    contentHash: `demo-${matchItem.id}`,
    archiveLabel: matchItem.status === 'FINISHED' ? '预测已归档' : '已发布',
    resultStatus: settlement ? 'SETTLED' : 'PENDING_RESULT',
    resultText: settlement ? `赛果 ${settlement.homeScore}-${settlement.awayScore}` : '待赛果',
    match: matchItem,
    settlement,
    corrections: [],
  };
}

function buildSettlement(matchItem: Match, seed: PredictionSeed): PredictionArchive['settlement'] {
  if (matchItem.homeScore == null || matchItem.awayScore == null) return null;
  const resultDirection = directionFromScore(matchItem.homeScore, matchItem.awayScore);
  const candidates = demoScoreCandidates({
    predictedHome: seed.score[0],
    predictedAway: seed.score[1],
  });
  const hitScore = matchItem.homeScore === seed.score[0] && matchItem.awayScore === seed.score[1];
  const hitScoreCandidate = candidates.some(
    (candidate) => candidate.home === matchItem.homeScore && candidate.away === matchItem.awayScore,
  );
  return {
    homeScore: matchItem.homeScore,
    awayScore: matchItem.awayScore,
    resultDirection,
    hitResult: resultDirection === seed.direction,
    hitScore,
    hitUnbeaten: isUnbeatenHit(seed.direction, resultDirection),
    hitScoreCandidate,
    hitScoreReference: hitScore || hitScoreCandidate,
    hitTotalGoals: matchItem.homeScore + matchItem.awayScore === seed.score[0] + seed.score[1],
    settledAt: `${matchItem.matchDate}T14:00:00+08:00`,
  };
}

function buildDemoPredictionStats(): PredictionStats {
  const settled = DEMO_PREDICTIONS.filter((item) => item.settlement);
  const highConfidenceSettled = settled.filter(
    (item) => item.isHighConfidence || Number(item.confidenceIndex) >= 70,
  );
  const resultHits = settled.filter((item) => item.settlement?.hitResult).length;
  const currentHitStreak = calculateCurrentHitStreak(settled);
  const bestHitStreak = calculateBestHitStreak(settled);

  return {
    source: 'demo',
    totalPredictions: DEMO_PREDICTIONS.length,
    settledPredictions: settled.length,
    archivedMatchCount: settled.length,
    last7DaysHitRate: rate(resultHits, settled.length),
    last30MatchesHitRate: rate(resultHits, settled.length),
    resultHitRate: rate(resultHits, settled.length),
    unbeatenHitRate: rate(settled.filter((item) => item.settlement?.hitUnbeaten).length, settled.length),
    scoreHitRate: rate(settled.filter((item) => item.settlement?.hitScore).length, settled.length),
    scoreCandidateHitRate: rate(
      settled.filter((item) => item.settlement?.hitScoreCandidate).length,
      settled.length,
    ),
    scoreReferenceHitRate: rate(
      settled.filter((item) => item.settlement?.hitScoreReference).length,
      settled.length,
    ),
    highConfidenceHitRate: rate(
      highConfidenceSettled.filter((item) => item.settlement?.hitResult).length,
      highConfidenceSettled.length,
    ),
    highConfidenceSettledCount: highConfidenceSettled.length,
    totalGoalsHitRate: rate(settled.filter((item) => item.settlement?.hitTotalGoals).length, settled.length),
    currentHitStreak,
    bestHitStreak,
    highConfidenceStats: {
      count: highConfidenceSettled.length,
      resultHitRate: rate(
        highConfidenceSettled.filter((item) => item.settlement?.hitResult).length,
        highConfidenceSettled.length,
      ),
      scoreHitRate: rate(
        highConfidenceSettled.filter((item) => item.settlement?.hitScore).length,
        highConfidenceSettled.length,
      ),
      scoreCandidateHitRate: rate(
        highConfidenceSettled.filter((item) => item.settlement?.hitScoreCandidate).length,
        highConfidenceSettled.length,
      ),
    },
    cautiousStats: {
      count: settled.filter((item) => item.isCautious || Number(item.riskIndex) >= 70).length,
      resultHitRate: rate(
        settled.filter((item) => (item.isCautious || Number(item.riskIndex) >= 70) && item.settlement?.hitResult).length,
        settled.filter((item) => item.isCautious || Number(item.riskIndex) >= 70).length,
      ),
      scoreHitRate: rate(
        settled.filter((item) => (item.isCautious || Number(item.riskIndex) >= 70) && item.settlement?.hitScore).length,
        settled.filter((item) => item.isCautious || Number(item.riskIndex) >= 70).length,
      ),
      scoreCandidateHitRate: rate(
        settled.filter((item) => (item.isCautious || Number(item.riskIndex) >= 70) && item.settlement?.hitScoreCandidate).length,
        settled.filter((item) => item.isCautious || Number(item.riskIndex) >= 70).length,
      ),
    },
    recentPredictions: DEMO_PREDICTIONS.slice(0, 10),
  };
}

function demoPredictionByMatch(id: string) {
  return DEMO_PREDICTIONS.find((item) => item.matchId === id) || buildPrediction(DEMO_MATCHES.find((item) => item.id === id)!);
}

function isUpcomingMatch(matchItem: Match, currentTime: number) {
  if (['FINISHED', 'LIVE', 'POSTPONED', 'CANCELLED'].includes(String(matchItem.status))) {
    return false;
  }

  return new Date(matchItem.kickoffAt).getTime() > currentTime;
}

function buildMatchAnalysisContext(matchItem: Match, seed: PredictionSeed): MatchAnalysisContext {
  const homeProfile = teamProfiles[matchItem.homeTeam.fifaCode] || defaultTeamProfile(matchItem.homeTeam.name);
  const awayProfile = teamProfiles[matchItem.awayTeam.fifaCode] || defaultTeamProfile(matchItem.awayTeam.name);
  const [homeWinProb, drawProb, awayWinProb] = seed.probs;
  const totalGoals = seed.score[0] + seed.score[1];
  const leadingTeam = homeWinProb >= awayWinProb ? matchItem.homeTeam.name : matchItem.awayTeam.name;
  const trailingTeam = homeWinProb >= awayWinProb ? matchItem.awayTeam.name : matchItem.homeTeam.name;
  const leadingProfile = homeWinProb >= awayWinProb ? homeProfile : awayProfile;
  const trailingProfile = homeWinProb >= awayWinProb ? awayProfile : homeProfile;
  const tempoLean = totalGoals <= 1
    ? '低比分消耗战'
    : totalGoals >= 4
      ? '开放对攻'
      : drawProb >= 30
        ? '中场拉锯'
        : '稳态推进';
  const strongSideEdge = `${leadingTeam}的${leadingProfile.tags[0]}和${leadingProfile.tags[1]}是主要优势，${leadingProfile.strengths[0]}`;
  const underdogThreat = `${trailingTeam}最可能通过${trailingProfile.tags[0]}和${trailingProfile.tags[1]}制造麻烦，${trailingProfile.strengths[0]}`;
  const mainRisk = drawProb >= 30
    ? `平局概率达到${drawProb}%，比赛容易被${trailingTeam}拖入${tempoLean}`
    : `${trailingTeam}的${trailingProfile.tags[0]}一旦打出效率，主候选比分会被改写`;
  const directionExplanation = directionExplanationText(matchItem, seed, drawProb);
  const scoreExplanation = scoreExplanationText(matchItem, seed, tempoLean, homeProfile, awayProfile);

  return {
    homeProfile,
    awayProfile,
    tempoLean,
    strongSideEdge,
    underdogThreat,
    mainRisk,
    directionExplanation,
    scoreExplanation,
  };
}

function buildMatchAnalysisCopy(matchItem: Match, seed: PredictionSeed, context: MatchAnalysisContext) {
  const home = matchItem.homeTeam.name;
  const away = matchItem.awayTeam.name;
  const [homeScore, awayScore] = seed.score;
  const candidates = demoScoreCandidates({ predictedHome: homeScore, predictedAway: awayScore });
  const candidateText = candidates.slice(0, 2).map((item) => item.text.replace('-', ':')).join(' / ');
  const homeTags = context.homeProfile.tags.slice(0, 2).join('、');
  const awayTags = context.awayProfile.tags.slice(0, 2).join('、');

  const shortAnalysis = `${home}侧重点在${homeTags}，${away}则更依赖${awayTags}。本场节奏倾向${context.tempoLean}，参考方向为${directionLabel(seed.direction, matchItem)}。`;
  const analysisDetails = [
    `${context.strongSideEdge}，这是本场模型给出方向倾斜的基础。`,
    `${context.underdogThreat}，因此比赛并不适合只看单一胜负。`,
    `结合胜平负概率、双方风格标签和比分候选分布，模型更倾向${directionLabel(seed.direction, matchItem)}，比分区间集中在${candidateText}。`,
  ].join('');
  const riskTip = `${context.mainRisk}。此外，${context.homeProfile.risks[0]}、${context.awayProfile.risks[0]}都会影响临场节奏，赛前分析仅供足球数据参考。`;
  const scoreCandidateNote = context.scoreExplanation;
  const fullAnalysis = `${analysisDetails}\n\n风险提示：${riskTip}`;

  return {
    shortAnalysis,
    analysisDetails,
    riskTip,
    scoreCandidateNote,
    fullAnalysis,
  };
}

function directionExplanationText(matchItem: Match, seed: PredictionSeed, drawProb: number) {
  if (seed.direction === 'HOME_WIN') {
    return `${matchItem.homeTeam.name}胜面更高，但平局概率仍有${drawProb}%，所以对外表达为${matchItem.homeTeam.name}不败更合理。`;
  }
  if (seed.direction === 'AWAY_WIN') {
    return `${matchItem.awayTeam.name}胜面更高，但平局概率仍有${drawProb}%，所以对外表达为${matchItem.awayTeam.name}不败更稳妥。`;
  }
  return `双方胜负概率接近，平局概率达到${drawProb}%，因此更适合归为平局倾向。`;
}

function scoreExplanationText(
  matchItem: Match,
  seed: PredictionSeed,
  tempoLean: string,
  homeProfile: TeamProfileSeed,
  awayProfile: TeamProfileSeed,
) {
  const [homeScore, awayScore] = seed.score;
  const candidates = demoScoreCandidates({ predictedHome: homeScore, predictedAway: awayScore });
  const first = candidates[0]?.text.replace('-', ':') || `${homeScore}:${awayScore}`;
  const second = candidates[1]?.text.replace('-', ':') || secondaryDemoScore(homeScore, awayScore);
  const totalRange = demoTotalGoalsRange({ predictedHome: homeScore, predictedAway: awayScore });
  return `主候选${first}来自${matchItem.homeTeam.name}的${homeProfile.tags[0]}与${matchItem.awayTeam.name}的${awayProfile.risks[0]}之间的对位；次候选${second}保留了${awayProfile.tags[0]}制造变数的空间。由于本场节奏更偏${tempoLean}，总进球倾向落在${totalRange.replace('-', '~')}。`;
}

function defaultPrediction(matchItem: Match): PredictionSeed {
  const homeStrong = ['BRA', 'GER', 'NED', 'BEL', 'ESP', 'FRA', 'ARG', 'POR', 'ENG', 'USA'].includes(matchItem.homeTeam.fifaCode);
  const awayStrong = ['BRA', 'GER', 'NED', 'BEL', 'ESP', 'FRA', 'ARG', 'POR', 'ENG', 'SUI', 'SCO'].includes(matchItem.awayTeam.fifaCode);
  if (homeStrong && !awayStrong) {
    return prediction('HOME_WIN', [2, 1], [48, 29, 23], 65, 52, `${matchItem.homeTeam.name}整体实力和控场能力更占优，${matchItem.awayTeam.name}需要依靠反击制造机会。`, '主队在阵容深度和进攻推进上更稳定，但仍需关注临场阵容与比赛节奏变化。', `${matchItem.matchDate}T20:00:00+08:00`);
  }
  if (awayStrong && !homeStrong) {
    return prediction('AWAY_WIN', [0, 1], [25, 32, 43], 61, 54, `${matchItem.awayTeam.name}防守结构更稳，${matchItem.homeTeam.name}需要提高前场终结效率。`, '客队综合稳定性略高，若主队早段顶住压力，平局空间会增加。', `${matchItem.matchDate}T20:00:00+08:00`);
  }
  return prediction('DRAW', [1, 1], [33, 35, 32], 58, 60, '双方实力接近，比赛预计进入中场拉锯，平局倾向更明显。', '两队风格互有克制，临场阵容和早段进球会明显改变比赛走向。', `${matchItem.matchDate}T20:00:00+08:00`);
}

function team(fifaCode: string, countryCode: string, name: string, nameEn: string, groupName: string): TeamSeed {
  return { fifaCode, countryCode, name, nameEn, groupName };
}

function profile(tags: string[], strengths: string[], risks: string[], styleSummary: string): TeamProfileSeed {
  return { tags, strengths, risks, styleSummary };
}

function defaultTeamProfile(teamName: string): TeamProfileSeed {
  return profile(
    ['中场控制', '反击效率', '防守纪律'],
    [`${teamName}具备基础攻防平衡，能根据比赛阶段调整节奏`],
    ['临场阵容和早段进球会放大波动'],
    `${teamName}整体风格偏均衡，需要结合临场状态判断。`,
  );
}

function match(date: string, time: string, group: string, home: string, away: string, status: Match['status'] = 'SCHEDULED', score?: [number, number]): MatchSeed {
  return { date, time, group, home, away, status, score };
}

function prediction(
  direction: PredictionSeed['direction'],
  score: [number, number],
  probs: [number, number, number],
  confidence: number,
  risk: number,
  summary: string,
  full: string,
  publishedAt: string,
): PredictionSeed {
  return { direction, score, probs, confidence, risk, summary, full, publishedAt };
}

function teamId(fifaCode: string) {
  return `team_${fifaCode.toLowerCase()}`;
}

function matchId(date: string, home: string, away: string) {
  return `match_${date.replace(/-/g, '')}_${home.toLowerCase()}_${away.toLowerCase()}`;
}

function winnerId(homeTeam: Team, awayTeam: Team, score?: [number, number]) {
  if (!score || score[0] === score[1]) return null;
  return score[0] > score[1] ? homeTeam.id : awayTeam.id;
}

function directionFromScore(homeScore: number, awayScore: number): PredictionArchive['recommendationDirection'] {
  if (homeScore > awayScore) return 'HOME_WIN';
  if (awayScore > homeScore) return 'AWAY_WIN';
  return 'DRAW';
}

function isUnbeatenHit(
  predicted: PredictionArchive['recommendationDirection'],
  actual: PredictionArchive['recommendationDirection'],
) {
  if (predicted === 'HOME_WIN') {
    return actual === 'HOME_WIN' || actual === 'DRAW';
  }
  if (predicted === 'AWAY_WIN') {
    return actual === 'AWAY_WIN' || actual === 'DRAW';
  }
  return actual === 'DRAW';
}

function rate(hitCount: number, totalCount: number) {
  if (!totalCount) return 0;
  return Math.round((hitCount / totalCount) * 100);
}

function calculateCurrentHitStreak(items: PredictionArchive[]) {
  let count = 0;
  for (const item of [...items].reverse()) {
    if (!item.settlement?.hitResult) {
      break;
    }
    count += 1;
  }
  return count;
}

function calculateBestHitStreak(items: PredictionArchive[]) {
  let current = 0;
  let best = 0;
  for (const item of items) {
    if (item.settlement?.hitResult) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function directionLabel(direction: PredictionArchive['recommendationDirection'], matchItem: Match) {
  if (direction === 'HOME_WIN') return `${matchItem.homeTeam.name}不败`;
  if (direction === 'AWAY_WIN') return `${matchItem.awayTeam.name}不败`;
  return '平局倾向';
}

function demoScoreCandidates(item: { predictedHome: number; predictedAway: number }) {
  const primary = {
    home: item.predictedHome,
    away: item.predictedAway,
  };
  const secondary = {
    home: Math.max(0, item.predictedHome - 1),
    away: item.predictedAway,
  };
  const third = {
    home: item.predictedHome,
    away: Math.max(0, item.predictedAway - 1),
  };

  const uniqueScores = [primary, secondary, third].filter(
    (score, index, rows) =>
      rows.findIndex((item) => item.home === score.home && item.away === score.away) === index,
  );

  return uniqueScores.map((score, index) => ({
    ...score,
    text: `${score.home}-${score.away}`,
    probability: Number((13 - index * 2.1).toFixed(2)),
    totalGoals: score.home + score.away,
    rank: index + 1,
  }));
}

function demoTotalGoalsRange(item: { predictedHome: number; predictedAway: number }) {
  const total = item.predictedHome + item.predictedAway;
  if (total <= 1) return '0-1球';
  if (total >= 4) return '4球以上';
  return '2-3球';
}

function secondaryDemoScore(home: number, away: number) {
  return `${Math.max(0, home - 1)}:${away}`;
}

function formatMonthDayTime(value: string) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function levelFromIndex(value: number, type: 'confidence' | 'risk') {
  if (type === 'confidence') {
    if (value >= 75) return '高';
    if (value >= 60) return '中高';
    return '中';
  }
  if (value >= 75) return '高';
  if (value >= 45) return '中';
  return '低';
}

function leaderboard(id: string, rank: number, nickname: string, points: number, title: string): LeaderboardItem {
  return {
    id: `lb_${id}`,
    points,
    title,
    rank,
    user: {
      id,
      nickname,
      avatarUrl: '',
    },
  };
}
