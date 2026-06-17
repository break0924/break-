import { getMatches } from '../../services/match.service';
import { createSimulationPlan } from '../../services/simulator.service';

Page({
  data: {
    matches: [] as Array<{
      id: string;
      label: string;
      homeTeam: { name: string };
      awayTeam: { name: string };
    }>,
    selectionLabels: ['主胜', '平', '客胜'],
    selectedMatchIndex: 0,
    selectedSelectionIndex: 0,
    stake: '20.00',
    odds: '2.10',
    selection: 'HOME_WIN',
    result: ''
  },
  onLoad() {
    void this.loadMatches();
  },
  async loadMatches() {
    const data = await getMatches() as {
      items: Array<{
        id: string;
        homeTeam: { name: string };
        awayTeam: { name: string };
      }>;
    };
    this.setData({
      matches: data.items.map((match) => ({
        ...match,
        label: `${match.homeTeam.name} vs ${match.awayTeam.name}`
      }))
    });
  },
  onMatchChange(event: WechatMiniprogram.PickerChange) {
    this.setData({ selectedMatchIndex: Number(event.detail.value) });
  },
  onStakeInput(event: WechatMiniprogram.Input) {
    this.setData({ stake: event.detail.value });
  },
  onOddsInput(event: WechatMiniprogram.Input) {
    this.setData({ odds: event.detail.value });
  },
  onSelectionChange(event: WechatMiniprogram.PickerChange) {
    const selections = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];
    const index = Number(event.detail.value);
    this.setData({
      selectedSelectionIndex: index,
      selection: selections[index]
    });
  },
  async createPlan() {
    const match = this.data.matches[this.data.selectedMatchIndex];
    if (!match) {
      wx.showToast({ title: '暂无赛程数据', icon: 'none' });
      return;
    }

    const data = await createSimulationPlan({
      name: '小程序模拟方案',
      stake: this.data.stake,
      multiple: 1,
      mode: 'SINGLE',
      riskNoticeAccepted: true,
      selections: [
        {
          matchId: match.id,
          market: 'WIN_DRAW_LOSE',
          selection: this.data.selection,
          odds: this.data.odds
        }
      ]
    }) as { estimatedPrizeMax: string };

    this.setData({ result: data.estimatedPrizeMax });
  }
});
