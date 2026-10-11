// Small shared helpers: RNG, noise, easing, springs.

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const remap = (v, a, b, c = 0, d = 1) => c + ((v - a) / (b - a)) * (d - c);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// --- value noise (2D) with fbm -------------------------------------------------
const PERM = (() => {
  const r = mulberry32(1234567);
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  return p;
})();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad2 = (h, x, y) => { const v = h & 7; const u = v < 4 ? x : y; const w = v < 4 ? y : x; return ((v & 1) ? -u : u) + ((v & 2) ? -2 * w : 2 * w); };
export function perlin(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const A = PERM[X] + Y, B = PERM[X + 1] + Y;
  return lerp(
    lerp(grad2(PERM[A], x, y), grad2(PERM[B], x - 1, y), u),
    lerp(grad2(PERM[A + 1], x, y - 1), grad2(PERM[B + 1], x - 1, y - 1), u), v) * 0.5;
}
export function fbm(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * perlin(x * f, y * f); f *= 2; a *= 0.5; }
  return s;
}

// --- critically-damped-ish spring (semi-implicit Euler, stable) -----------------
export class Spring {
  constructor(value = 0, stiffness = 90, damping = 11) {
    this.x = value; this.v = 0; this.target = value; this.k = stiffness; this.d = damping;
  }
  set(t) { this.target = t; }
  snap(t) { this.x = t; this.v = 0; this.target = t; }
  update(dt) {
    dt = Math.min(dt, 1 / 30);
    const n = Math.ceil(dt / (1 / 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -this.k * (this.x - this.target) - this.d * this.v;
      this.v += a * h; this.x += this.v * h;
    }
    return this.x;
  }
  get settled() { return Math.abs(this.x - this.target) < 1e-3 && Math.abs(this.v) < 1e-3; }
}

// simple tween list
export class Tweens {
  constructor() { this.list = []; }
  add(dur, fn, { delay = 0, ease = (t) => t, done } = {}) {
    const tw = { t: -delay, dur, fn, ease, done, dead: false };
    this.list.push(tw);
    return tw;
  }
  update(dt) {
    for (const tw of this.list) {
      if (tw.dead) continue;
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = clamp(tw.t / tw.dur);
      tw.fn(tw.ease(k), k);
      if (k >= 1) { tw.dead = true; tw.done && tw.done(); }
    }
    this.list = this.list.filter((t) => !t.dead);
  }
  clear() { this.list.length = 0; }
}

export const isTouch = () => matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
