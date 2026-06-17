import { calculatePrize } from '../../services/calculator.service';

Page({
  data: {
    stake: '20.00',
    odds: '2.10',
    result: ''
  },
  onStakeInput(event: WechatMiniprogram.Input) {
    this.setData({ stake: event.detail.value });
  },
  onOddsInput(event: WechatMiniprogram.Input) {
    this.setData({ odds: event.detail.value });
  },
  async calculate() {
    const data = await calculatePrize({
      stake: this.data.stake,
      multiple: 1,
      mode: 'SINGLE',
      selections: [
        {
          market: 'WIN_DRAW_LOSE',
          selection: 'HOME_WIN',
          odds: this.data.odds
        }
      ]
    }) as { estimatedPrizeMax: string };

    this.setData({ result: data.estimatedPrizeMax });
  }
});
