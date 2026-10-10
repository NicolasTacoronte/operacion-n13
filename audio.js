/* Operación Número 13 — efectos de sonido sintetizados (sin archivos de audio ni música). */
(function (root) {
  'use strict';
  let ac = null, master = null, sfxOn = true;

  function ctx() {
    if (ac) return ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    } catch (e) { ac = null; }
    return ac;
  }
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ---------- Efectos ---------- */
  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!sfxOn || !ctx()) return;
    const t0 = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, delay, hp) {
    if (!sfxOn || !ctx()) return;
    const t0 = ac.currentTime + (delay || 0), n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 1500; g.gain.value = vol || 0.1;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const SFX = {
    click: () => tone(420, .05, 'square', .04),
    gain: () => { tone(660, .1, 'square', .07); tone(880, .16, 'square', .07, .09); },
    fail: () => { tone(300, .18, 'sawtooth', .07); tone(200, .3, 'sawtooth', .07, .15); },
    magic: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'sine', .08, i * .07)),
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'triangle', .1, i * .12)),
    tick: () => tone(900, .04, 'square', .03),
    open: () => { tone(300, .08, 'triangle', .07); tone(450, .12, 'triangle', .07, .07); },
    flip: () => { noise(.12, .08, 0, 2500); tone(700, .06, 'triangle', .04, .06); },
    shuffle: () => { for (let i = 0; i < 5; i++) noise(.06, .06, i * .05, 3000); },
    door: () => { tone(120, .12, 'square', .08); noise(.1, .06, .05, 800); },
    creak: () => tone(220, .5, 'sawtooth', .04, 0, 150),
    meow: () => { tone(500, .35, 'triangle', .07, 0, 900); tone(900, .25, 'triangle', .05, .3, 600); },
    ding: () => { tone(1320, .5, 'sine', .08); tone(1760, .6, 'sine', .05, .05); },
    ach: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, .22, 'triangle', .09, i * .09)),
  };
  function sfx(name) { (SFX[name] || SFX.click)(); }
  // notas de piano para el gag del «chan-chán»
  const PIANO = [60, 64, 67, 72];
  let pianoI = 0;
  function piano() { const n = PIANO[pianoI++ % PIANO.length]; tone(mtof(n), 1.2, 'triangle', .14); tone(mtof(n) * 2, .8, 'sine', .04); }

  function unlock() { if (ctx() && ac.state === 'suspended') ac.resume(); } // llamar tras un gesto del usuario
  function setSfx(on) { sfxOn = on; }
  root.Aud = { sfx, piano, unlock, setSfx, isSfx: () => sfxOn };
})(window);
