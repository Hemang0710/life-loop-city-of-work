// Procedural Web Audio — no audio files needed.
//
// Browser autoplay policy: AudioContext starts "suspended" until a user gesture.
// We attach persistent listeners so the context is resumed on every click/keypress,
// keeping it alive even after the browser auto-suspends it.

let _ctx = null;

function _getCtx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { return null; }
  }
  return _ctx;
}

function _resume() {
  const c = _getCtx();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}

// Wake the context on every user interaction (covers initial unlock + browser re-suspends)
['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt =>
  document.addEventListener(evt, _resume, { passive: true }),
);

function _schedule(freq, dur, type, vol) {
  const c = _getCtx();
  if (!c || c.state !== 'running') return;
  try {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.02);
  } catch (_) {}
}

function tone(freq, dur, type = 'sine', vol = 0.22) {
  const c = _getCtx();
  if (!c) return;
  if (c.state === 'running') {
    _schedule(freq, dur, type, vol);
  } else {
    // Context was suspended — resume then play
    c.resume().then(() => _schedule(freq, dur, type, vol)).catch(() => {});
  }
}

function seq(notes, gapMs = 90) {
  notes.forEach(([f, d, t = 'sine', v = 0.22], i) =>
    setTimeout(() => tone(f, d, t, v), i * gapMs),
  );
}

export const SoundSystem = {
  correct:   () => seq([[523, 0.07], [659, 0.11]]),
  wrong:     () => tone(180, 0.22, 'sawtooth', 0.14),
  money:     () => seq([[659, 0.07], [784, 0.07], [1046, 0.13]], 80),
  levelUp:   () => seq([[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.17]], 100),
  click:     () => tone(800, 0.05, 'square', 0.07),
  notify:    () => seq([[440, 0.07], [554, 0.11]]),
  cityEvent: () => seq([[330, 0.1], [415, 0.1], [523, 0.14]], 110),
  dayEnd:    () => seq([[392, 0.09], [494, 0.09], [587, 0.09], [740, 0.17]], 110),
};
