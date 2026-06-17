import { getMatchDetail } from '../../services/match.service';

Page({
  data: {
    match: null as unknown,
    loading: true
  },
  onLoad(options: { id?: string }) {
    if (options.id) {
      void this.load(options.id);
    }
  },
  async load(id: string) {
    this.setData({ loading: true });
    try {
      const match = await getMatchDetail(id);
      this.setData({ match });
    } finally {
      this.setData({ loading: false });
    }
  }
});
