// Motor de audio 100% generado con Web Audio API (sin archivos externos)
export class Sfx {
  constructor() { this.ctx = null; this.heartBpm = 60; this.heartVol = 0; }
  init() {
    if (this.ctx) { this.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.white = this._noise(2, 'white');
    this.brown = this._noise(4, 'brown');
    this._ambient();
    this._ghostLoop();
    this._heartLoop();
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  get t() { return this.ctx.currentTime; }
  _noise(sec, type) {
    const ctx = this.ctx, n = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }
  _ambient() {
    const ctx = this.ctx;
    const g = this.ambGain = ctx.createGain(); g.gain.value = 0; g.connect(this.master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; lp.connect(g);
    [43.65, 46.25, 65.4, 69.3].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = i % 2 ? 0.12 : 0.22;
      o.connect(og); og.connect(lp); o.start();
    });
    const src = ctx.createBufferSource(); src.buffer = this.brown; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.9;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    const wg = ctx.createGain(); wg.gain.value = 0.6;
    src.connect(bp); bp.connect(wg); wg.connect(g); src.start();
    g.gain.setTargetAtTime(0.55, ctx.currentTime, 2.5);
  }
  setAmbient(v) { if (this.ctx) this.ambGain.gain.setTargetAtTime(v, this.t, 0.3); }
  _ghostLoop() {
    // respiración/susurro continuo del fantasma, volumen según cercanía
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.white; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3;
    const trem = ctx.createGain(); trem.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35;
    const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain); lfo.start();
    const g = this.ghostGain = ctx.createGain(); g.gain.value = 0;
    // zumbido grave
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 36;
    const og = ctx.createGain(); og.gain.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 120;
    o.connect(lp); lp.connect(og); og.connect(g); o.start();
    src.connect(bp); bp.connect(trem); trem.connect(g); g.connect(this.master); src.start();
  }
  setGhost(v) { if (this.ctx) this.ghostGain.gain.setTargetAtTime(v * 0.5, this.t, 0.25); }
  _heartLoop() {
    const beat = () => {
      if (this.ctx && this.heartVol > 0.02) { this.thump(0, this.heartVol); this.thump(0.17, this.heartVol * 0.7); }
      setTimeout(beat, 60000 / Math.max(40, this.heartBpm));
    };
    beat();
  }
  setHeart(bpm, vol) { this.heartBpm = bpm; this.heartVol = vol; }
  thump(delay, vol) {
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(75, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.3);
  }
  noise({ dur = 0.1, freq = 500, type = 'lowpass', q = 1, vol = 0.3, delay = 0, attack = 0.004, pan = 0, buf } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = buf || this.white;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    s.connect(f); f.connect(g); out.connect(this.master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  osc({ type = 'sine', f0 = 440, f1 = null, dur = 0.3, vol = 0.3, delay = 0, attack = 0.005 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  step(run) {
    this.noise({ dur: 0.09, freq: run ? 650 : 420, vol: run ? 0.22 : 0.13 });
    this.noise({ dur: 0.06, freq: 140, vol: 0.18, delay: 0.01 });
    if (Math.random() < 0.12) this.creakSmall();
  }
  creakSmall() { this.osc({ type: 'sawtooth', f0: 180 + Math.random() * 80, f1: 120, dur: 0.25, vol: 0.03 }); }
  click() { this.noise({ dur: 0.03, freq: 3000, type: 'highpass', vol: 0.25 }); }
  pickup() { this.osc({ type: 'triangle', f0: 660, f1: 990, dur: 0.18, vol: 0.2 }); }
  bang(vol = 1, pan = 0) {
    this.noise({ dur: 0.7, freq: 260, vol: 0.9 * vol, pan, buf: this.brown, attack: 0.002 });
    this.noise({ dur: 0.25, freq: 900, vol: 0.4 * vol, pan });
    this.osc({ f0: 90, f1: 28, dur: 0.6, vol: 0.8 * vol });
  }
  creak() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t);
    const lfo = ctx.createOscillator(); lfo.frequency.setValueAtTime(18, t); lfo.frequency.linearRampToValueAtTime(7, t + 1.4);
    const lg = ctx.createGain(); lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(bp); bp.connect(g); g.connect(this.master); o.start(t); lfo.start(t); o.stop(t + 1.6); lfo.stop(t + 1.6);
  }
  scream() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = 1.5;
    const ws = ctx.createWaveShaper(); const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6); }
    ws.curve = curve;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.75, t + 0.03); g.gain.setValueAtTime(0.75, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    ws.connect(bp); bp.connect(g); g.connect(this.master);
    const vib = ctx.createOscillator(); vib.frequency.value = 9; const vg = ctx.createGain(); vg.gain.value = 45;
    vib.connect(vg); vib.start(t); vib.stop(t + dur);
    [720, 960, 1330, 1610].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + dur);
      vg.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(ws);
      o.start(t); o.stop(t + dur);
    });
    this.noise({ dur: 1.2, freq: 2600, type: 'bandpass', q: 0.8, vol: 0.5 });
    this.bang(0.9);
  }
  sting() {
    // acorde disonante que crece (aparición)
    [233, 247, 349, 370, 523].forEach((f, i) => this.osc({ type: 'sawtooth', f0: f, dur: 1.4, vol: 0.06, attack: 0.25 }));
    this.noise({ dur: 1.2, freq: 3000, type: 'highpass', vol: 0.12, attack: 0.3 });
  }
  whisper() {
    const pan = Math.random() * 2 - 1;
    for (let i = 0; i < 6; i++) this.noise({ dur: 0.25 + Math.random() * 0.2, freq: 2200 + Math.random() * 1800, type: 'bandpass', q: 6, vol: 0.12, delay: i * 0.22, attack: 0.05, pan });
  }
  buzz() { this.osc({ type: 'square', f0: 98, dur: 0.45, vol: 0.35 }); this.osc({ type: 'square', f0: 104, dur: 0.45, vol: 0.25 }); }
  discord() { [262, 277, 370, 392].forEach(f => this.note(f, { vol: 0.25 })); }
  chime() { [440, 523.25, 659.25, 880].forEach((f, i) => this.note(f, { type: 'box', delay: i * 0.13, vol: 0.25 })); this.osc({ f0: 55, dur: 1.5, vol: 0.3 }); }
  unlock() { this.click(); this.noise({ dur: 0.15, freq: 1500, type: 'bandpass', vol: 0.4, delay: 0.08 }); this.osc({ type: 'square', f0: 220, f1: 110, dur: 0.12, vol: 0.12, delay: 0.1 }); }
  note(freq, { type = 'piano', vol = 0.35, delay = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const dur = type === 'box' ? 1.6 : 2.0;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    const parts = type === 'box' ? [[1, 'sine', 1], [2.01, 'sine', 0.4], [4.2, 'sine', 0.15]] : [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12], [0.5, 'sine', 0.2]];
    parts.forEach(([m, ty, a]) => {
      const o = ctx.createOscillator(); o.type = ty; o.frequency.value = freq * m * (type === 'box' ? 2 : 1) * (1 + (Math.random() - 0.5) * 0.004);
      const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur);
    });
  }
}
