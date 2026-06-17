Component({
  properties: {
    match: {
      type: Object,
      value: {}
    }
  },
  methods: {
    openDetail() {
      const id = this.data.match?.id;
      if (!id) return;
      wx.navigateTo({ url: `/pages/match-detail/index?id=${id}` });
    }
  }
});
