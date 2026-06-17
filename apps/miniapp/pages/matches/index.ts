import { getMatches } from '../../services/match.service';

Page({
  data: {
    loading: true,
    matches: []
  },
  onLoad() {
    void this.load();
  },
  async load() {
    this.setData({ loading: true });
    try {
      const data = await getMatches() as { items: unknown[] };
      this.setData({ matches: data.items });
    } finally {
      this.setData({ loading: false });
    }
  }
});
