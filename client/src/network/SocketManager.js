import { io as socketIO } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const MOVE_THROTTLE_MS = 50; // 20fps sync

export class SocketManager {
  constructor() {
    this._socket = null;
    this._connected = false;
    this._handlers = {};
    this._lastMoveAt = 0;
    this._tryConnect();
  }

  _tryConnect() {
    try {
      this._socket = socketIO(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 4000,
        reconnectionAttempts: 5,
      });
      this._socket.on('connect', () => {
        this._connected = true;
        console.log('[MP] Connected');
        // Send deferred join now that the connection is live
        if (this._joinData) this._emit('join', this._joinData);
      });
      this._socket.on('reconnect', () => {
        // Re-register after a reconnect
        if (this._joinData) this._emit('join', this._joinData);
      });
      this._socket.on('disconnect', () => { this._connected = false; console.log('[MP] Disconnected'); });
      this._socket.on('connect_error', (e) => console.warn('[MP] connect_error:', e.message));
      this._socket.onAny((event, data) => {
        (this._handlers[event] || []).forEach(fn => fn(data));
      });
    } catch (e) {
      console.warn('[MP] Multiplayer unavailable — running solo.');
    }
  }

  // Store join data; send immediately if already connected, otherwise sent on connect
  join(playerData) {
    this._joinData = playerData;
    if (this._connected) this._emit('join', playerData);
  }
  sendChat(text)             { this._emit('chatMessage', { text: String(text).slice(0, 120) }); }
  sendGift(targetId, amount) { this._emit('tradeGift', { targetId, amount }); }
  sendStats(totalEarned, level = 1, prestige = 0) {
    this._emit('updateStats', { totalEarned, level, prestige });
  }
  getSocketId()              { return this._socket?.id || null; }

  sendMove(x, y) {
    const now = Date.now();
    if (now - this._lastMoveAt < MOVE_THROTTLE_MS) return;
    this._lastMoveAt = now;
    this._emit('move', { x: Math.round(x), y: Math.round(y) });
  }

  on(event, callback) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(callback);
  }

  _emit(event, data) {
    if (this._socket && this._connected) this._socket.emit(event, data);
  }

  isConnected() { return this._connected; }
}
