class MiniEmitter {
  constructor() { this._ev = {}; }
  on(e, fn)  { (this._ev[e] ??= []).push(fn); return this; }
  off(e, fn) { if (this._ev[e]) this._ev[e] = this._ev[e].filter(f => f !== fn); return this; }
  once(e, fn) { const w = (...a) => { fn(...a); this.off(e, w); }; return this.on(e, w); }
  emit(e, ...a) { (this._ev[e] || []).slice().forEach(fn => fn(...a)); return this; }
}

export const EventBus = new MiniEmitter();
