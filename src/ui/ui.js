// HTML-Oberfläche über der 3D-Ansicht: Raumleiste, Karten, Buchansicht, Sprechblase, Einstellungen. Alle Texte per textContent (kein innerHTML mit Daten).
import { coverTexture } from '../world/books.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const DEPT_LABEL = { geschichte: 'Geschichte', biologie: 'Biologie', chemie: 'Chemie', foyer: 'Foyer' };

export class UI {
  constructor({ onGo, onStep, onSettings, getBookCover }) {
    this.onGo = onGo; this.onStep = onStep; this.onSettings = onSettings; this.coverCache = new Map();
    this.hud = $('#hud'); this.card = $('#card'); this.viewer = $('#viewer'); this.menu = $('#menu'); this.intro = $('#intro');
    this.bubbleTimer = 0; this.cardOpen = false; this.viewerOpen = false; this.onCardClose = null; this.onViewerChange = null;
    for (const b of document.querySelectorAll('#roombar [data-go]')) b.addEventListener('click', () => this.onGo(b.dataset.go));
    $('#prev').addEventListener('click', () => this.onStep(-1)); $('#next').addEventListener('click', () => this.onStep(1));
    $('#b-help').addEventListener('click', () => this.help());
    $('#b-menu').addEventListener('click', () => { this.menu.hidden = false; });
    for (const ov of [this.card, this.menu]) {
      $('.x', ov).addEventListener('click', () => this.close(ov));
      ov.addEventListener('pointerdown', (e) => { if (e.target === ov) this.close(ov); });
    }
    $('#v-back').addEventListener('click', () => this.closeViewer());
    addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (this.viewerOpen) this.closeViewer(); else if (!this.menu.hidden) this.close(this.menu); else if (this.cardOpen) this.close(this.card); } });
    $('#o-calm').addEventListener('change', (e) => this.onSettings({ calm: e.target.checked }));
    $('#o-sound').addEventListener('change', (e) => this.setSound(e.target.checked));
    $('#b-sound').addEventListener('click', () => this.setSound(!this.sound));
    $('#o-q').addEventListener('change', (e) => this.onSettings({ quality: e.target.value }));
  }
  setSound(v) { this.sound = v; $('#o-sound').checked = v; const b = $('#b-sound'); b.classList.toggle('off', !v); b.setAttribute('aria-pressed', String(v)); this.onSettings({ sound: v }); }
  close(ov) { ov.hidden = true; if (ov === this.card) { this.cardOpen = false; const cb = this.onCardClose; this.onCardClose = null; cb?.(); } }
  ready(onStart) { const b = $('#go'); b.disabled = false; b.textContent = 'Bibliothek betreten'; b.addEventListener('click', () => { this.intro.classList.add('out'); this.hud.hidden = false; setTimeout(() => { this.intro.hidden = true; }, 700); onStart?.(); }, { once: true }); }
  setWhere(roomId, stationName) {
    $('#where').textContent = DEPT_LABEL[roomId] || roomId;
    for (const b of document.querySelectorAll('#roombar [data-go]')) b.classList.toggle('on', b.dataset.go === roomId);
    $('#stname').textContent = stationName || '';
  }
  get blocking() { return this.cardOpen || this.viewerOpen || !this.menu.hidden || !this.intro.hidden; }

  // ---- Sprechblase
  say(text, { who = 'Archimedes', ms = 7000 } = {}) {
    const b = $('#bubble'); $('#bubble-who').textContent = who; $('#bubble-text').textContent = text; b.hidden = false;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(this.bubbleTimer); this.bubbleTimer = setTimeout(() => { b.hidden = true; }, ms);
  }
  hush() { clearTimeout(this.bubbleTimer); $('#bubble').hidden = true; }

  // ---- Tooltip über Hotspots (Desktop)
  tip(text, x, y) { const t = $('#tip'); if (!text) { t.hidden = true; return; } t.textContent = text; t.style.left = x + 'px'; t.style.top = y + 'px'; t.hidden = false; }

  // ---- Karten
  coverURL(def) { if (!this.coverCache.has(def.id)) { const t = coverTexture(def, { w: 360, h: 506, soon: def.status === 'bald' }); this.coverCache.set(def.id, t.image.toDataURL('image/jpeg', 0.88)); t.dispose(); } return this.coverCache.get(def.id); }
  imgFrom(src, alt) { const i = new Image(); i.alt = alt || ''; i.decoding = 'async'; i.src = typeof src === 'string' ? src : src.toDataURL('image/png'); return i; }

  openCard(d, { onClose } = {}) {
    const body = $('.body', this.card); body.replaceChildren(); this.onCardClose = onClose || null; this.hush();
    if (d.kind === 'book') this.fillBook(body, d.book);
    else this.fillInfo(body, d);
    this.card.hidden = false; this.cardOpen = true; $('.sheet', this.card).scrollTop = 0; this.onCardOpen?.();
  }
  fillBook(body, def) {
    const cols = el('div', 'cols'); const pic = el('div', 'pic'); pic.append(this.imgFrom(this.coverURL(def), 'Buchdeckel: ' + def.title)); cols.append(pic);
    const tx = el('div', 'tx'); tx.append(el('span', 'tag ' + def.department, DEPT_LABEL[def.department] || ''), el('h2', '', def.title), el('p', 'sub', def.subtitle && def.status !== 'bald' ? def.subtitle + (def.grades ? ' · ' + def.grades : '') : ''));
    if (def.status === 'bald') { tx.append(el('p', 'soon', 'Dieses Buch ist noch in Arbeit und steht bald hier im Regal.')); }
    else { if (def.blurb) tx.append(el('p', '', def.blurb)); const acts = el('div', 'acts'); const open = el('button', 'primary', def.url ? 'Buch öffnen' : 'Buch öffnen'); open.addEventListener('click', () => this.openBook(def)); acts.append(open); tx.append(acts);
      if (!def.url) tx.append(el('p', 'soon', 'Die Adresse dieses Buches ist noch nicht eingetragen. Es ist fertig, aber noch nicht online.')); }
    cols.append(tx); body.append(cols);
  }
  fillInfo(body, d) {
    if (d.image) { const img = this.imgFrom(d.image, d.alt || d.title); const pic = el('div', d.wide ? 'pic wide' : 'pic'); pic.append(img); if (d.wide) body.append(pic); else { var cols = el('div', 'cols'); cols.append(pic); } }
    const tx = d.wide || !d.image ? body : el('div', 'tx');
    if (d.tag) tx.append(el('span', 'tag ' + (d.dept || ''), d.tag));
    tx.append(el('h2', '', d.title)); if (d.sub) tx.append(el('p', 'sub', d.sub));
    for (const p of d.paras || []) tx.append(el('p', '', p));
    if (d.fact) { const f = el('div', 'fact'); f.append(el('b', '', (d.factLabel || 'Wusstest du? ') ), document.createTextNode(d.fact)); tx.append(f); }
    if (d.map) { const m = el('div', 'map'); for (const r of ['geschichte', 'biologie', 'chemie']) { const b = el('button', '', DEPT_LABEL[r]); b.style.background = `var(--${r})`; b.addEventListener('click', () => { this.close(this.card); this.onGo(r); }); m.append(b); } tx.append(m); }
    if (d.links?.length || d.actions?.length) { const acts = el('div', 'acts'); for (const l of d.links || []) { const a = el('a', 'ghost', l.label); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; acts.append(a); } for (const a of d.actions || []) { const b = el('button', 'primary', a.label); b.addEventListener('click', () => { this.close(this.card); a.fn(); }); acts.append(b); } tx.append(acts); }
    if (d.src) tx.append(el('p', 'src', d.src));
    if (tx !== body) { cols.append(tx); body.append(cols); }
  }
  help() {
    this.openCard({ title: 'So geht’s', paras: ['Zum Umschauen ziehst du mit dem Finger oder der Maus. Mit zwei Fingern oder dem Mausrad zoomst du.', 'Tippe auf Türen, Regale oder die Knöpfe unten, dann fährt die Kamera dorthin. Mit den Pfeilen ‹ › gehst du zur nächsten Station im Raum.', 'Tippe auf ein Buch, ein Bild oder ein Ausstellungsstück, um mehr zu erfahren. Mit „Buch öffnen“ schlägst du ein Popup-Buch auf.', 'Archimedes, die Hauskatze, begleitet dich. Tippe sie an, dann verrät sie dir etwas.'] });
  }

  // ---- Buchansicht (iframe), Bibliothek wird währenddessen angehalten
  openBook(def) {
    if (!def.url) { this.openCard({ kind: 'book', book: def }); return; }
    this.close(this.card); $('#v-title').textContent = def.title; const a = $('#v-new'); a.href = def.url;
    const fr = $('#v-frame'); fr.allow = 'fullscreen; autoplay'; fr.src = def.url; this.viewer.hidden = false; this.viewerOpen = true; this.onViewerChange?.(true);
  }
  closeViewer() { $('#v-frame').src = 'about:blank'; this.viewer.hidden = true; this.viewerOpen = false; this.onViewerChange?.(false); }
}
