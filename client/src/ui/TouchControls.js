// Virtual on-screen D-pad and action buttons for touch/mobile devices.
// Only renders when the primary pointer is coarse (phone / tablet).
// Movement state is exported as `touchState` for CityScene to OR into velocity.
// Action buttons call callbacks directly so one-shot actions (E, chat, gift) work cleanly.

const _TOUCH_PRIMARY =
  window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
  navigator.maxTouchPoints > 1;

export const touchState = { up: false, down: false, left: false, right: false };

const S = 60; // button diameter px

const BASE = [
  `width:${S}px`, `height:${S}px`,
  'position:fixed', 'z-index:9996',
  'border-radius:50%',
  'background:rgba(255,255,255,0.12)',
  'border:2px solid rgba(255,255,255,0.28)',
  'color:#fff', 'font-size:22px',
  'display:flex', 'align-items:center', 'justify-content:center',
  'user-select:none', '-webkit-user-select:none',
  'touch-action:none', 'cursor:pointer', 'opacity:0.55',
].join(';');

function mkBtn(label, pos) {
  const el = document.createElement('div');
  el.textContent = label;
  el.style.cssText = `${BASE};${Object.entries(pos).map(([k, v]) => `${k}:${v}px`).join(';')}`;
  document.body.appendChild(el);
  return el;
}

function holdBtn(label, pos, key) {
  const el = mkBtn(label, pos);
  const on  = (e) => { e.preventDefault(); touchState[key] = true;  el.style.opacity = '0.92'; };
  const off = (e) => { e.preventDefault(); touchState[key] = false; el.style.opacity = '0.55'; };
  el.addEventListener('touchstart',  on,  { passive: false });
  el.addEventListener('touchend',    off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
}

function tapBtn(label, pos, cb) {
  if (!cb) return;
  const el = mkBtn(label, pos);
  const on  = (e) => { e.preventDefault(); el.style.opacity = '0.92'; cb(); };
  const off = (e) => { e.preventDefault(); el.style.opacity = '0.55'; };
  el.addEventListener('touchstart',  on,  { passive: false });
  el.addEventListener('touchend',    off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
}

export function initTouchControls(callbacks = {}) {
  if (!_TOUCH_PRIMARY) return;

  // ── D-pad (bottom-left) ─── center anchor: left=100, bottom=116
  holdBtn('↑', { bottom: 180, left: 100 }, 'up');
  holdBtn('↓', { bottom:  52, left: 100 }, 'down');
  holdBtn('←', { bottom: 116, left:  36 }, 'left');
  holdBtn('→', { bottom: 116, left: 164 }, 'right');

  // ── Action buttons (bottom-right) ───────────────────────────────
  tapBtn('E',  { bottom: 116, right: 164 }, callbacks.interact);
  tapBtn('💬', { bottom: 116, right: 100 }, callbacks.chat);
  tapBtn('🎁', { bottom: 116, right:  36 }, callbacks.gift);
  tapBtn('✕',  { bottom:  52, right: 100 }, callbacks.esc);
}
