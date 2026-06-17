import { request } from './api';
import type { MatchItem, PageResult } from './types';

const demoMatches: MatchItem[] = [
  {
    id: 'demo-match-1',
    matchNo: 'WC-001',
    stage: 'GROUP',
    groupName: 'A',
    kickoffAt: '2026-06-12T00:00:00.000Z',
    venue: '示例球场',
    status: 'SCHEDULED',
    homeTeam: { id: 'demo-team-1', name: '阿根廷', nameEn: 'Argentina' },
    awayTeam: { id: 'demo-team-2', name: '巴西', nameEn: 'Brazil' },
    oddsSnapshots: [
      {
        id: 'demo-odds-1',
        market: 'WIN_DRAW_LOSE',
        selection: 'HOME_WIN',
        odds: '2.1000',
        isLatest: true
      },
      {
        id: 'demo-odds-2',
        market: 'WIN_DRAW_LOSE',
        selection: 'DRAW',
        odds: '3.2000',
        isLatest: true
      },
      {
        id: 'demo-odds-3',
        market: 'WIN_DRAW_LOSE',
        selection: 'AWAY_WIN',
        odds: '3.3500',
        isLatest: true
      }
    ],
    aiAnalyses: [
      {
        id: 'demo-analysis-1',
        title: '赛前信息分析',
        summary: '演示数据：双方实力接近，建议重点关注阵容轮换、关键球员状态和临场赔率变化。',
        riskLevel: 'MEDIUM',
        confidence: '0.6000'
      }
    ]
  },
  {
    id: 'demo-match-2',
    matchNo: 'WC-002',
    stage: 'GROUP',
    groupName: 'B',
    kickoffAt: '2026-06-13T03:00:00.000Z',
    venue: '示例体育场',
    status: 'SCHEDULED',
    homeTeam: { id: 'demo-team-3', name: '法国', nameEn: 'France' },
    awayTeam: { id: 'demo-team-4', name: '德国', nameEn: 'Germany' },
    oddsSnapshots: [
      {
        id: 'demo-odds-4',
        market: 'WIN_DRAW_LOSE',
        selection: 'HOME_WIN',
        odds: '2.4500',
        isLatest: true
      }
    ],
    aiAnalyses: []
  }
];

export function getMatches() {
  return request<PageResult<MatchItem>>('/matches').catch(() => ({
    items: demoMatches,
    page: 1,
    pageSize: demoMatches.length,
    total: demoMatches.length
  }));
}

export function getMatchDetail(id: string) {
  return request<MatchItem>(`/matches/${id}`).catch(() => {
    const match = demoMatches.find((item) => item.id === id);
    if (match) {
      return match;
    }
    throw new Error('Match not found');
  });
}
