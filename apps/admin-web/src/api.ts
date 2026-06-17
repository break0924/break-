import type {
  AiAnalysis,
  MatchForm,
  MatchItem,
  OddsForm,
  TeamForm,
  TeamItem,
  UpdateResultForm
} from './types/domain';

const API_BASE = 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'wc_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const body = (await response.json()) as { code: number; message: string; data: T };

  if (!response.ok || body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }

  return body.data;
}

const demoTeams: TeamItem[] = [
  { id: 'team-arg', name: '阿根廷', nameEn: 'Argentina', fifaCode: 'ARG', groupName: 'A' },
  { id: 'team-bra', name: '巴西', nameEn: 'Brazil', fifaCode: 'BRA', groupName: 'A' },
  { id: 'team-fra', name: '法国', nameEn: 'France', fifaCode: 'FRA', groupName: 'B' },
  { id: 'team-ger', name: '德国', nameEn: 'Germany', fifaCode: 'GER', groupName: 'B' }
];

const demoMatches: MatchItem[] = [
  {
    id: 'match-001',
    matchNo: 'WC-001',
    stage: 'GROUP',
    groupName: 'A',
    kickoffAt: '2026-06-12T00:00:00.000Z',
    venue: '示例球场',
    status: 'SCHEDULED',
    homeTeamId: 'team-arg',
    awayTeamId: 'team-bra',
    homeTeam: demoTeams[0],
    awayTeam: demoTeams[1]
  },
  {
    id: 'match-002',
    matchNo: 'WC-002',
    stage: 'GROUP',
    groupName: 'B',
    kickoffAt: '2026-06-13T03:00:00.000Z',
    venue: '示例体育场',
    status: 'SCHEDULED',
    homeTeamId: 'team-fra',
    awayTeamId: 'team-ger',
    homeTeam: demoTeams[2],
    awayTeam: demoTeams[3]
  }
];

let demoAnalyses: AiAnalysis[] = [
  {
    id: 'analysis-001',
    matchId: 'match-001',
    status: 'PENDING_REVIEW',
    title: '赛前信息分析',
    summary: '演示内容：双方实力接近，建议关注阵容轮换、关键球员状态和临场赔率变化。',
    tacticalNotes: '中场控制权可能影响比赛节奏。',
    injuryNotes: '伤停信息需后台确认。',
    riskLevel: 'MEDIUM',
    confidence: '0.6000'
  }
];

const demoOdds = new Map<string, Array<Record<string, unknown>>>([
  [
    'match-001',
    [
      {
        id: 'odds-001',
        market: 'WIN_DRAW_LOSE',
        selection: 'HOME_WIN',
        odds: '2.1000',
        source: 'demo',
        isLatest: true,
        capturedAt: new Date().toISOString()
      },
      {
        id: 'odds-002',
        market: 'WIN_DRAW_LOSE',
        selection: 'DRAW',
        odds: '3.2000',
        source: 'demo',
        isLatest: true,
        capturedAt: new Date().toISOString()
      }
    ]
  ]
]);

export async function login(username: string, password: string) {
  try {
    return await apiRequest<{ accessToken: string }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  } catch {
    if (username === 'admin' && password === 'admin12345') {
      return { accessToken: 'demo-token' };
    }
    throw new Error('账号或密码错误');
  }
}

export async function listTeams() {
  return apiRequest<TeamItem[]>('/teams').catch(() => demoTeams);
}

export async function createTeam(data: TeamForm) {
  return apiRequest<TeamItem>('/admin/teams', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => {
    const team = { id: `team-${Date.now()}`, ...data };
    demoTeams.unshift(team);
    return team;
  });
}

export async function listMatches() {
  return apiRequest<MatchItem[]>('/admin/matches').catch(() => demoMatches);
}

export async function createMatch(data: MatchForm) {
  return apiRequest<MatchItem>('/admin/matches', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => {
    const homeTeam = demoTeams.find((team) => team.id === data.homeTeamId) ?? demoTeams[0];
    const awayTeam = demoTeams.find((team) => team.id === data.awayTeamId) ?? demoTeams[1];
    const match: MatchItem = {
      id: `match-${Date.now()}`,
      status: 'SCHEDULED',
      ...data,
      homeTeam,
      awayTeam
    };
    demoMatches.unshift(match);
    return match;
  });
}

export async function updateMatchResult(matchId: string, data: UpdateResultForm) {
  return apiRequest<MatchItem>(`/admin/matches/${matchId}/result`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }).catch(() => {
    const match = demoMatches.find((item) => item.id === matchId);
    if (!match) throw new Error('比赛不存在');
    Object.assign(match, data, { status: 'FINISHED' });
    return match;
  });
}

export async function listOdds(matchId: string) {
  return apiRequest<Array<Record<string, unknown>>>(`/admin/matches/${matchId}/odds`).catch(
    () => demoOdds.get(matchId) ?? []
  );
}

export async function createOdds(matchId: string, data: OddsForm) {
  return apiRequest<Record<string, unknown>>(`/admin/matches/${matchId}/odds`, {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => {
    const odds = {
      id: `odds-${Date.now()}`,
      ...data,
      capturedAt: new Date().toISOString(),
      isLatest: true
    };
    demoOdds.set(matchId, [odds, ...(demoOdds.get(matchId) ?? [])]);
    return odds;
  });
}

export async function listAnalyses(matchId: string) {
  return apiRequest<AiAnalysis[]>(`/admin/matches/${matchId}/analysis`).catch(() =>
    demoAnalyses.filter((analysis) => analysis.matchId === matchId)
  );
}

export async function generateAnalysis(matchId: string) {
  return apiRequest<AiAnalysis>(`/admin/matches/${matchId}/analysis/generate`, {
    method: 'POST'
  }).catch(() => {
    const analysis: AiAnalysis = {
      id: `analysis-${Date.now()}`,
      matchId,
      status: 'PENDING_REVIEW',
      title: 'AI 赛前分析草稿',
      summary: '演示草稿：当前为本地生成内容，真实环境会调用后端 AI 服务并进入人工审核。',
      tacticalNotes: '关注双方阵型、近期赛程密度和关键球员状态。',
      injuryNotes: '伤停信息需要接入可信数据源或后台录入。',
      riskLevel: 'MEDIUM',
      confidence: '0.6000'
    };
    demoAnalyses.unshift(analysis);
    return analysis;
  });
}

export async function updateAnalysis(id: string, data: Partial<AiAnalysis>) {
  return apiRequest<AiAnalysis>(`/admin/analysis/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }).catch(() => {
    const analysis = demoAnalyses.find((item) => item.id === id);
    if (!analysis) throw new Error('分析不存在');
    Object.assign(analysis, data);
    return analysis;
  });
}

export async function publishAnalysis(id: string) {
  return apiRequest<AiAnalysis>(`/admin/analysis/${id}/publish`, { method: 'PATCH' }).catch(() => {
    const analysis = demoAnalyses.find((item) => item.id === id);
    if (!analysis) throw new Error('分析不存在');
    analysis.status = 'PUBLISHED';
    analysis.publishedAt = new Date().toISOString();
    return analysis;
  });
}

export async function rejectAnalysis(id: string, reviewerNote = '后台人工驳回') {
  return apiRequest<AiAnalysis>(`/admin/analysis/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewerNote })
  }).catch(() => {
    const analysis = demoAnalyses.find((item) => item.id === id);
    if (!analysis) throw new Error('分析不存在');
    analysis.status = 'REJECTED';
    analysis.reviewerNote = reviewerNote;
    return analysis;
  });
}
