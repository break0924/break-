import { getApiBaseUrl } from '../api/http';

export type MatchMonitorEvent = {
  type:
    | 'match.status.changed'
    | 'match.settlement.updated'
    | 'match.result.corrected'
    | 'match.monitor.connected';
  payload: {
    matchId?: string;
    previousStatus?: string | null;
    status?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    syncedAt?: string;
    settlement?: {
      predictionSettled?: boolean;
      challengeSettled?: boolean;
    };
  };
};

type Listener = (event: MatchMonitorEvent) => void;

const listeners = new Set<Listener>();
let socketTask: UniApp.SocketTask | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyClosed = false;

export function connectMatchMonitor() {
  if (socketTask) {
    return;
  }

  manuallyClosed = false;
  const url = toWebSocketUrl(getApiBaseUrl());

  socketTask = uni.connectSocket({
    url,
    complete: () => undefined,
  });

  socketTask.onOpen(() => {
    clearReconnectTimer();
  });

  socketTask.onMessage((message) => {
    const event = parseMessage(message.data);
    if (!event) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  });

  socketTask.onClose(() => {
    socketTask = null;
    scheduleReconnect();
  });

  socketTask.onError(() => {
    socketTask = null;
    scheduleReconnect();
  });
}

export function disconnectMatchMonitor() {
  manuallyClosed = true;
  clearReconnectTimer();
  socketTask?.close({});
  socketTask = null;
}

export function subscribeMatchMonitor(listener: Listener) {
  listeners.add(listener);
  connectMatchMonitor();

  return () => {
    listeners.delete(listener);
  };
}

function scheduleReconnect() {
  if (manuallyClosed || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectMatchMonitor();
  }, 3000);
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function parseMessage(data: string | ArrayBuffer) {
  try {
    const text =
      typeof data === 'string'
        ? data
        : String.fromCharCode(...new Uint8Array(data));
    return JSON.parse(text) as MatchMonitorEvent;
  } catch {
    return null;
  }
}

function toWebSocketUrl(apiBaseUrl: string) {
  const url = apiBaseUrl.replace(/\/$/, '');
  return `${url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/match-monitor/ws`;
}
