const { request } = require('../../utils/api');

Page({
  data: {
    name: wx.getStorageSync('name') || '玩家',
    roomId: wx.getStorageSync('roomId') || '',
    playerId: wx.getStorageSync('playerId') || '',
    apiBase: wx.getStorageSync('apiBase') || 'http://192.168.0.106:8787',
    room: null,
    myCards: [],
    polling: false,
  },

  onLoad(options) {
    const roomId = options.roomId || this.data.roomId;
    if (roomId) {
      this.setData({ roomId });
      this.joinRoom().catch(() => {});
    }
  },

  onShow() {
    if (this.data.roomId) {
      this.startPolling();
    }
  },

  onHide() {
    this.stopPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  onShareAppMessage() {
    return {
      title: '好友德州局，来一起玩',
      path: `/pages/index/index?roomId=${this.data.roomId}`,
    };
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
    wx.setStorageSync('name', e.detail.value);
  },

  onRoomInput(e) {
    this.setData({ roomId: e.detail.value });
    wx.setStorageSync('roomId', e.detail.value);
  },

  onApiBaseInput(e) {
    this.setData({ apiBase: e.detail.value });
  },

  saveApiBase() {
    const apiBase = (this.data.apiBase || '').trim().replace(/\/$/, '');
    if (!apiBase) {
      wx.showToast({ title: '请输入服务器地址', icon: 'none' });
      return;
    }
    wx.setStorageSync('apiBase', apiBase);
    getApp().globalData.apiBase = apiBase;
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  startPolling() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      this.refresh().catch(() => {});
    }, 1500);
  },

  stopPolling() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  async refresh() {
    if (!this.data.roomId) return;
    const res = await request(`/api/rooms/${this.data.roomId}/state?playerId=${encodeURIComponent(this.data.playerId || '')}`);
    this.syncRoom(res.room);
  },

  syncRoom(room) {
    const me = (room.players || []).find((player) => player.id === this.data.playerId);
    this.setData({
      room,
      myCards: me ? (me.hole || []) : [],
    });
    wx.setStorageSync('roomId', room.roomId);
  },

  async createRoom() {
    const name = this.data.name || '房主';
    const res = await request('/api/rooms', {
      method: 'POST',
      data: { name, playerId: this.data.playerId || undefined },
    });
    wx.setStorageSync('playerId', res.playerId);
    this.setData({
      roomId: res.roomId,
      playerId: res.playerId,
    });
    await this.joinRoom();
  },

  async joinRoom() {
    const roomId = (this.data.roomId || '').trim();
    const name = (this.data.name || '').trim() || '玩家';
    if (!roomId) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    const res = await request(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      data: { name, playerId: this.data.playerId || undefined },
    });
    wx.setStorageSync('name', name);
    wx.setStorageSync('roomId', roomId);
    wx.setStorageSync('playerId', res.playerId);
    this.setData({
      roomId,
      playerId: res.playerId,
    });
    this.syncRoom(res.room);
    this.startPolling();
  },

  async startRoom() {
    const res = await request(`/api/rooms/${this.data.roomId}/start`, {
      method: 'POST',
      data: { playerId: this.data.playerId },
    });
    this.syncRoom(res.room);
  },

  async action(action, amount) {
    const res = await request(`/api/rooms/${this.data.roomId}/action`, {
      method: 'POST',
      data: { playerId: this.data.playerId, action, amount },
    });
    this.syncRoom(res.room);
  },

  createRoomTap() {
    this.createRoom().catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  joinRoomTap() {
    this.joinRoom().catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  startRoomTap() {
    this.startRoom().catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  check() {
    this.action('check').catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  call() {
    this.action('call').catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  fold() {
    this.action('fold').catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  raise() {
    this.action('raise', 20).catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  shareRoom() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '可从右上角分享', icon: 'none' });
  }
});
