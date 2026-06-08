const state = {
  roomId: localStorage.getItem('roomId') || '',
  playerId: localStorage.getItem('playerId') || '',
  name: localStorage.getItem('name') || '',
  room: null,
  seatOrder: JSON.parse(localStorage.getItem('seatOrder') || '[]'),
  lastHandNo: null,
  lastCommunityCount: 0,
  lastHoleCount: 0,
  lastDealerId: null,
  lastPot: 0,
  lastResultKey: '',
  lastPhase: '',
  shareLink: '',
};

const els = {
  name: document.querySelector('#name'),
  roomId: document.querySelector('#roomId'),
  createBtn: document.querySelector('#createBtn'),
  joinBtn: document.querySelector('#joinBtn'),
  startBtn: document.querySelector('#startBtn'),
  raiseBtn: document.querySelector('#raiseBtn'),
  raiseAmount: document.querySelector('#raiseAmount'),
  copyLinkBtn: document.querySelector('#copyLinkBtn'),
  message: document.querySelector('#message'),
  community: document.querySelector('#community'),
  hole: document.querySelector('#hole'),
  players: document.querySelector('#players'),
  seats: document.querySelector('#seats'),
  roomLabel: document.querySelector('#roomLabel'),
  shareHint: document.querySelector('#shareHint'),
  shareUrl: document.querySelector('#shareUrl'),
  roomQr: document.querySelector('#roomQr'),
  pot: document.querySelector('#pot'),
  phase: document.querySelector('#phase'),
  turnPlayer: document.querySelector('#turnPlayer'),
  statusBadge: document.querySelector('#statusBadge'),
  tableCore: document.querySelector('.table-core'),
  potBadge: document.querySelector('.pot-badge'),
};

els.name.value = state.name;
els.roomId.value = state.roomId;

function saveProfile(name, roomId, playerId) {
  if (name) localStorage.setItem('name', name);
  if (roomId) localStorage.setItem('roomId', roomId);
  if (playerId) localStorage.setItem('playerId', playerId);
}

function saveSeatOrder() {
  localStorage.setItem('seatOrder', JSON.stringify(state.seatOrder));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}

function currentShareLink(roomId = state.roomId) {
  if (!roomId) return '';
  const base = `${location.origin}${location.pathname}`.replace(/\/$/, '');
  return `${base}?roomId=${encodeURIComponent(roomId)}`;
}

function refreshShareCard() {
  const link = currentShareLink();
  state.shareLink = link;
  if (!link) {
    els.shareUrl.textContent = '';
    els.roomQr.removeAttribute('src');
    return;
  }
  els.shareUrl.textContent = link;
  els.roomQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(link)}`;
}

function suitSymbol(suit) {
  if (suit === 'H') return '♥';
  if (suit === 'D') return '♦';
  if (suit === 'C') return '♣';
  if (suit === 'S') return '♠';
  return suit || '';
}

function parseCard(card) {
  if (!card) return { rank: '', suit: '', color: '' };
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  const color = suit === 'H' || suit === 'D' || suit === '♥' || suit === '♦' ? 'red' : 'black';
  return { rank, suit: suitSymbol(suit), color };
}

function renderCard(target, card, hidden = false, animate = false) {
  const el = document.createElement('div');
  el.className = `card-face ${hidden ? 'back' : ''} ${parseCard(card).color} ${animate ? 'deal-in' : ''}`;
  if (hidden) {
    el.innerHTML = '<span class="card-back-pattern">Texas</span>';
  } else {
    const { rank, suit } = parseCard(card);
    el.innerHTML = `<span class="card-rank">${rank}</span><span class="card-suit">${suit}</span>`;
  }
  target.appendChild(el);
}

function renderCards(target, cards, hidden = false, animateFrom = null) {
  target.innerHTML = '';
  cards.forEach((card, index) => renderCard(target, card, hidden, animateFrom !== null && index >= animateFrom));
  if (!cards.length) {
    const empty = document.createElement('div');
    empty.className = 'small';
    empty.textContent = '暂无';
    target.appendChild(empty);
  }
}

function initials(name) {
  if (!name) return 'P';
  const trimmed = String(name).trim();
  return trimmed.slice(0, 1).toUpperCase();
}

function avatarColor(id) {
  const palette = ['#38bdf8', '#34d399', '#f59e0b', '#fb7185', '#a78bfa', '#22c55e', '#f97316', '#60a5fa'];
  let hash = 0;
  String(id || '').split('').forEach((ch) => { hash = (hash * 31 + ch.charCodeAt(0)) >>> 0; });
  return palette[hash % palette.length];
}

function orderedPlayers(players) {
  if (!state.seatOrder.length) return players.slice();
  const map = new Map(players.map((player) => [player.id, player]));
  const ordered = state.seatOrder.map((id) => map.get(id)).filter(Boolean);
  players.forEach((player) => {
    if (!state.seatOrder.includes(player.id)) ordered.push(player);
  });
  return ordered;
}

function syncSeatOrder(players) {
  const ids = players.map((player) => player.id);
  const current = state.seatOrder.filter((id) => ids.includes(id));
  ids.forEach((id) => {
    if (!current.includes(id)) current.push(id);
  });
  state.seatOrder = current;
  saveSeatOrder();
}

function dealerPlayer(room) {
  if (!room || room.dealerIndex == null || room.dealerIndex < 0) return null;
  return room.players?.[room.dealerIndex] || null;
}

function seatClass(index, count) {
  if (count <= 1) return 'seat seat-0';
  if (count === 2) return index === 0 ? 'seat seat-top' : 'seat seat-bottom';
  if (count === 3) return ['seat seat-top', 'seat seat-right', 'seat seat-left'][index] || 'seat';
  if (count === 4) return ['seat seat-top', 'seat seat-right', 'seat seat-bottom', 'seat seat-left'][index] || 'seat';
  if (count === 5) return ['seat seat-top', 'seat seat-top-right', 'seat seat-right', 'seat seat-bottom-right', 'seat seat-bottom-left'][index] || 'seat';
  if (count === 6) return ['seat seat-top', 'seat seat-top-right', 'seat seat-right', 'seat seat-bottom-right', 'seat seat-bottom-left', 'seat seat-left'][index] || 'seat';
  if (count === 7) return ['seat seat-top', 'seat seat-top-right', 'seat seat-right', 'seat seat-bottom-right', 'seat seat-bottom', 'seat seat-bottom-left', 'seat seat-left'][index] || 'seat';
  return ['seat seat-top', 'seat seat-top-right', 'seat seat-right', 'seat seat-bottom-right', 'seat seat-bottom', 'seat seat-bottom-left', 'seat seat-left', 'seat seat-top-left'][index] || 'seat';
}

function chipDots(chips) {
  if (chips >= 3000) return '●●●';
  if (chips >= 1500) return '●●';
  if (chips >= 500) return '●';
  return '';
}

function reorderSeats(fromId, toId, players) {
  if (!fromId || !toId || fromId === toId) return;
  const existing = state.seatOrder.slice();
  const fromIndex = existing.indexOf(fromId);
  const toIndex = existing.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) return;
  existing.splice(fromIndex, 1);
  existing.splice(toIndex, 0, fromId);
  state.seatOrder = existing.filter((id) => players.some((player) => player.id === id));
  saveSeatOrder();
  if (state.room) renderSeats(state.room.players || [], state.room.turnIndex, state.room);
}

function renderSeats(players, turnIndex, room) {
  els.seats.innerHTML = '';
  const ordered = orderedPlayers(players);
  const count = ordered.length;
  const dealer = dealerPlayer(room);
  syncSeatOrder(players);
  ordered.forEach((player, index) => {
    const seat = document.createElement('div');
    seat.className = `${seatClass(index, count)} ${turnIndex === players.findIndex((p) => p.id === player.id) ? 'turn' : ''} ${player.id === state.playerId ? 'self' : ''}`;
    seat.draggable = true;
    seat.dataset.playerId = player.id;
    seat.innerHTML = `
      <div class="seat-header">
        <div class="avatar" style="background:${avatarColor(player.id)}">${initials(player.name)}</div>
        <div class="seat-badges">
          ${dealer && dealer.id === player.id ? '<span class="badge dealer-badge">D</span>' : ''}
          ${player.id === state.playerId ? '<span class="badge self-badge">我</span>' : ''}
        </div>
      </div>
      <div class="seat-name">${player.name}${player.id === state.playerId ? '（你）' : ''}</div>
      <div class="seat-meta">${player.folded ? '弃牌' : `下注 ${player.bet}`}</div>
      <div class="seat-chips">${player.chips}</div>
      <div class="chip-stack" aria-hidden="true">${chipDots(player.chips)}</div>
      <div class="seat-action">${player.lastAction || '等待中'}</div>
    `;
    seat.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', player.id);
      seat.classList.add('dragging');
    });
    seat.addEventListener('dragend', () => seat.classList.remove('dragging'));
    seat.addEventListener('dragover', (event) => event.preventDefault());
    seat.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromId = event.dataTransfer.getData('text/plain');
      reorderSeats(fromId, player.id, players);
    });
    els.seats.appendChild(seat);
  });
}

function renderPlayers(players, turnIndex) {
  els.players.innerHTML = '';
  players.forEach((player, index) => {
    const row = document.createElement('div');
    row.className = `player ${player.active ? 'active' : ''} ${turnIndex === index ? 'turn' : ''}`;
    row.innerHTML = `
      <div class="player-left">
        <div class="avatar tiny" style="background:${avatarColor(player.id)}">${initials(player.name)}</div>
        <div>
          <div>${player.name}${player.id === state.playerId ? '（你）' : ''}</div>
          <div class="small">${player.lastAction || '等待中'}</div>
        </div>
      </div>
      <div>
        <div>${player.chips} 筹码</div>
        <div class="small">${player.folded ? '已弃牌' : `下注 ${player.bet}`}</div>
      </div>
    `;
    els.players.appendChild(row);
  });
}

function animateTableCore(kind = 'deal') {
  if (!els.tableCore) return;
  els.tableCore.classList.remove('pulse', 'deal-flash');
  void els.tableCore.offsetWidth;
  els.tableCore.classList.add(kind === 'deal' ? 'deal-flash' : 'pulse');
  window.setTimeout(() => els.tableCore?.classList.remove('pulse', 'deal-flash'), 650);
}

function animatePotFly(amount) {
  if (!els.potBadge || !amount) return;
  const chip = document.createElement('div');
  chip.className = 'pot-fly';
  chip.textContent = `+${amount}`;
  els.potBadge.appendChild(chip);
  setTimeout(() => chip.remove(), 900);
}

function syncView(room) {
  const prevHandNo = state.lastHandNo;
  const prevCommunityCount = state.lastCommunityCount;
  const prevHoleCount = state.lastHoleCount;
  const prevDealerId = state.lastDealerId;
  const prevPot = state.lastPot;
  const prevResultKey = state.lastResultKey;
  state.room = room;
  const dealer = dealerPlayer(room);
  els.roomLabel.textContent = `房间 ${room.roomId}`;
  els.shareHint.textContent = `把这个房间号发给朋友：${room.roomId}`;
  els.message.textContent = room.message || '——';
  els.pot.textContent = room.pot;
  els.phase.textContent = room.phaseLabel || room.phase || '等待';
  els.turnPlayer.textContent = room.turnPlayer || '-';
  els.statusBadge.textContent = room.status === 'playing' ? '进行中' : '等待中';
  const communityCards = room.community || [];
  const communityAnimateFrom = communityCards.length > prevCommunityCount ? prevCommunityCount : null;
  renderCards(els.community, communityCards, false, communityAnimateFrom);
  const me = (room.players || []).find((player) => player.id === state.playerId);
  const myCards = me ? me.hole || [] : [];
  const holeAnimateFrom = myCards.length > prevHoleCount ? prevHoleCount : null;
  renderCards(els.hole, myCards, false, holeAnimateFrom);
  renderPlayers(room.players || [], room.turnIndex);
  renderSeats(room.players || [], room.turnIndex, room);
  els.roomId.value = room.roomId || els.roomId.value;
  refreshShareCard();

  const newHand = prevHandNo !== null && room.handNo !== prevHandNo;
  const communityGrew = (room.community || []).length > prevCommunityCount;
  const holeGrew = me && (me.hole || []).length > prevHoleCount;
  const dealerChanged = dealer && dealer.id !== prevDealerId;
  const potChanged = room.pot !== prevPot;
  const resultKey = JSON.stringify(room.lastResult || {});
  const phaseChanged = room.phase !== state.lastPhase;
  if (newHand || communityGrew || holeGrew) animateTableCore('deal');
  if (dealerChanged || phaseChanged) animateTableCore('pulse');
  if (potChanged && room.pot > prevPot) animatePotFly(room.pot - prevPot);
  if (resultKey && resultKey !== prevResultKey && room.lastResult?.payout?.length) {
    const total = room.lastResult.potBefore || 0;
    animatePotFly(total);
    animateTableCore('pulse');
  }

  state.lastHandNo = room.handNo;
  state.lastCommunityCount = (room.community || []).length;
  state.lastHoleCount = me && me.hole ? me.hole.length : 0;
  state.lastDealerId = dealer ? dealer.id : null;
  state.lastPot = room.pot;
  state.lastResultKey = resultKey;
  state.lastPhase = room.phase;
}

async function refresh() {
  if (!state.roomId) return;
  const res = await api(`/api/rooms/${state.roomId}/state?playerId=${encodeURIComponent(state.playerId || '')}`);
  syncView(res.room);
}

async function createRoom() {
  const name = els.name.value.trim() || '房主';
  const res = await api('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, playerId: state.playerId || undefined }),
  });
  state.roomId = res.roomId;
  state.playerId = res.playerId;
  state.name = name;
  saveProfile(name, state.roomId, state.playerId);
  els.roomId.value = state.roomId;
  refreshShareCard();
  await joinRoom();
}

async function joinRoom() {
  const roomId = (els.roomId.value || '').trim();
  const name = (els.name.value || '').trim() || '玩家';
  if (!roomId) throw new Error('请输入房间号');
  const res = await api(`/api/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ name, playerId: state.playerId || undefined }),
  });
  state.roomId = roomId;
  state.playerId = res.playerId;
  state.name = name;
  saveProfile(name, state.roomId, state.playerId);
  syncView(res.room);
  startPolling();
}

async function startRoom() {
  if (!state.roomId) return;
  const res = await api(`/api/rooms/${state.roomId}/start`, {
    method: 'POST',
    body: JSON.stringify({ playerId: state.playerId }),
  });
  syncView(res.room);
}

async function doAction(action) {
  if (!state.roomId) return;
  const amount = action === 'raise' ? Number(els.raiseAmount?.value || 20) : undefined;
  const res = await api(`/api/rooms/${state.roomId}/action`, {
    method: 'POST',
    body: JSON.stringify({ playerId: state.playerId, action, amount }),
  });
  syncView(res.room);
}

async function copyLink() {
  const link = state.shareLink || currentShareLink();
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    alert('已复制分享链接');
  } catch {
    alert(link);
  }
}

let pollTimer = null;
function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    refresh().catch(() => {});
  }, 1200);
}

els.createBtn.addEventListener('click', () => createRoom().catch((err) => alert(err.message)));
els.joinBtn.addEventListener('click', () => joinRoom().catch((err) => alert(err.message)));
els.startBtn.addEventListener('click', () => startRoom().catch((err) => alert(err.message)));
els.raiseBtn.addEventListener('click', () => doAction('raise').catch((err) => alert(err.message)));
els.copyLinkBtn?.addEventListener('click', () => copyLink());

document.querySelectorAll('button[data-action]').forEach((button) => {
  button.addEventListener('click', () => doAction(button.dataset.action).catch((err) => alert(err.message)));
});

if (state.roomId) {
  refreshShareCard();
  refresh().catch(() => {});
  startPolling();
}

refreshShareCard();
