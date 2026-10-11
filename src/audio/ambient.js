// Raumklang aus WebAudio (nichts wird geladen): leises Rauschen je Raum, kleine Geräusche, Blättern beim Öffnen von Karten.
// Standardmäßig AUS (Klassenzimmer!). Start erst nach Fingertipp; setEnabled(true) im Einstellungsdialog.
export class Ambient {
  constructor() { this.ctx = null; this.on = false; this.room = 'foyer'; this.master = null; this.timer = 0; this.layers = {}; }
  ensure() {
    if (this.ctx) return true; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination);
    // Rauschpuffer (2 s, Schleife)
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
    this.noise = buf;
    // Grundrauschen (gefiltert, je Raum andere Färbung)
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true; const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = this.ctx.createGain(); g.gain.value = 0.5;
    src.connect(f); f.connect(g); g.connect(this.master); src.start(); this.layers.base = { f, g };
    return true;
  }
  async setEnabled(v) {
    this.on = v; if (!v) { if (this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); clearInterval(this.timer); return; }
    if (!this.ensure()) return; try { await this.ctx.resume(); } catch (e) { /* */ }
    this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.4); this.setRoom(this.room, true);
    clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 1400);
  }
  setRoom(room, force) {
    if (room === this.room && !force) return; this.room = room; if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime, p = { foyer: [420, 0.5], geschichte: [320, 0.55], biologie: [900, 0.35], chemie: [650, 0.45] }[room] || [500, 0.5];
    this.layers.base.f.frequency.setTargetAtTime(p[0], t, 0.6); this.layers.base.g.gain.setTargetAtTime(p[1], t, 0.6);
  }
  blip(freq, dur, type = 'sine', vol = 0.05, sweep = 1.5, pan = 0) {
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(this.master); } else g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  burst(dur, lo, hi, vol = 0.12) { // gefilterter Rauschstoß (Blättern, Rascheln)
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(lo, t); f.frequency.exponentialRampToValueAtTime(hi, t + dur); f.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random() * 1.5, dur + 0.1);
  }
  tick() { // zufällige kleine Raumgeräusche
    if (!this.on || !this.ctx || document.hidden) return; const r = Math.random(), pan = Math.random() * 2 - 1;
    if (this.room === 'biologie' && r < 0.55) { const f = 2400 + Math.random() * 1400; this.blip(f, 0.09, 'sine', 0.035, 1.35, pan); if (Math.random() < 0.6) setTimeout(() => this.blip(f * 1.1, 0.08, 'sine', 0.03, 1.25, pan), 130); }
    else if (this.room === 'chemie' && r < 0.5) { this.blip(300 + Math.random() * 300, 0.12, 'sine', 0.05, 2.2, pan); if (Math.random() < 0.5) setTimeout(() => this.blip(400 + Math.random() * 300, 0.1, 'sine', 0.04, 2, pan), 90); }
    else if (this.room === 'geschichte' && r < 0.3) this.burst(0.35, 900, 2500, 0.05);
    else if (this.room === 'foyer' && r < 0.25) { this.blip(1100, 0.05, 'triangle', 0.018, 0.98, pan); }
  }
  page() { if (this.on && this.ctx) this.burst(0.28, 700, 3200, 0.11); }
  whoosh() { if (this.on && this.ctx) this.burst(0.9, 200, 900, 0.07); }
  meow() { if (!this.on || !this.ctx) return; this.blip(520, 0.28, 'triangle', 0.06, 1.5); setTimeout(() => this.blip(780, 0.22, 'triangle', 0.045, 0.6), 130); }
}
