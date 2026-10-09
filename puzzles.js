// Interfaces de los puzzles (DOM + canvas). Funcionan con ratón y con toque.
import { drawPortrait, PEOPLE, drawOuija, drawCadaver, drawDoll } from './textures.js';

export const SYMBOLS = ['☾', '✝', '☠', '☥', '♆', '⚶'];
export const MIRROR_SHOWN = ['☠', '✝', '☾', '☥'];           // lo que muestra el espejo (de izq. a der.)
export const SYMBOL_SOLUTION = [...MIRROR_SHOWN].reverse(); // la verdad: al revés
export const LOCK_CODE = '1887';
export const NOTES7 = [['Do', 261.63], ['Re', 293.66], ['Mi', 329.63], ['Fa', 349.23], ['Sol', 392.0], ['La', 440.0], ['Si', 493.88]];
export const MELODY = [2, 1, 0, 1, 2, 2, 2]; // Mi Re Do Re Mi Mi Mi
export const PORTRAIT_ORDER = ['ignacio', 'lucia', 'remedios', 'tomas', 'elena'];
export const OUIJA_NAME = 'MORANA';

const OPS = {
  cadaver: {
    title: 'Operación: el corazón del mayordomo',
    hint: 'Algo metálico brilla dentro de su corazón. Arrástralo con las pinzas hasta la incisión del cuello SIN tocar los bordes. Si lo tocas... despertará.',
    path: [[400, 112], [400, 170], [300, 182], [290, 262], [420, 272], [505, 240], [512, 332], [420, 362]],
    width: 40, rim: '#d9c6b3', inner: '#3d0c12', item: 'heart', draw: drawCadaver, scare: 'cadaver',
  },
  muneca: {
    title: 'Operación: la muñeca de Lucía',
    hint: 'La llave del sótano está dentro del relleno de la muñeca. Sácala hasta el cuello sin rozar la porcelana. Ella odia que la toquen.',
    path: [[400, 112], [400, 150], [300, 158], [282, 222], [382, 232], [482, 212], [522, 284], [432, 312], [332, 302], [300, 372], [420, 402]],
    width: 30, rim: '#efe4d2', inner: '#140b06', item: 'key', draw: drawDoll, scare: 'muneca',
  },
};

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px, qy = ay + t * dy - py; return Math.sqrt(qx * qx + qy * qy);
}
function distPath(p, path) { let m = 1e9; for (let i = 0; i < path.length - 1; i++) m = Math.min(m, distSeg(p[0], p[1], ...path[i], ...path[i + 1])); return m; }
function canvasPos(cv, e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }

export class PuzzleUI {
  constructor(root, sfx) { this.root = root; this.sfx = sfx; this.id = null; this.keyHandler = null; this.busy = false; }
  get isOpen() { return !!this.id; }
  open(id, cb) {
    this.close(true);
    this.id = id; this.cb = cb; this.busy = false;
    this.root.innerHTML = ''; this.root.classList.add('show');
    const box = el('div', 'pz-box'); this.root.appendChild(box);
    const x = el('button', 'pz-close', '✕ Salir'); x.onclick = () => this.exit(); box.appendChild(x);
    this.box = box;
    if (OPS[id]) this.buildOperation(box, OPS[id]); else this['build_' + id](box);
  }
  exit() { if (this.busy) return; this.close(); this.cb && this.cb.exit && this.cb.exit(); }
  close() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null; this.id = null; this.root.classList.remove('show'); this.root.innerHTML = '';
  }
  onKey(fn) { this.keyHandler = fn; window.addEventListener('keydown', fn); }
  head(box, title, hint) { box.appendChild(el('h2', null, title)); if (hint) box.appendChild(el('p', 'pz-hint', hint)); }
  fail(variant, after) { this.busy = true; this.cb.fail(variant, () => { this.busy = false; after && after(); }); }
  solve() { const cb = this.cb; this.close(); cb.solve(); }

  wheels(box, values, count, check, variant, btnText) {
    const st = Array(count).fill(0), row = el('div', 'wheels'), vals = [];
    for (let i = 0; i < count; i++) {
      const w = el('div', 'wheel'), up = el('button', null, '▲'), v = el('div', 'wval', values[0]), dn = el('button', null, '▼');
      up.onclick = () => { st[i] = (st[i] + 1) % values.length; v.textContent = values[st[i]]; this.sfx.click(); };
      dn.onclick = () => { st[i] = (st[i] + values.length - 1) % values.length; v.textContent = values[st[i]]; this.sfx.click(); };
      w.append(up, v, dn); row.appendChild(w); vals.push(v);
    }
    box.appendChild(row);
    const b = el('button', 'pz-go', btnText); box.appendChild(b);
    b.onclick = () => {
      if (this.busy) return;
      if (check(st.map(i => values[i]))) { this.sfx.unlock(); setTimeout(() => this.solve(), 350); }
      else this.fail(variant);
    };
    this.wheelState = st; this.wheelVals = vals; this.wheelValues = values;
  }
  build_candado(box) {
    this.head(box, 'Candado oxidado', 'Cuatro ruedas con números. Alguien rayó en el metal: <i>«el año en que llegamos»</i>.');
    this.wheels(box, '0123456789'.split(''), 4, v => v.join('') === LOCK_CODE, 'morana', 'Abrir candado');
  }
  build_simbolos(box) {
    this.head(box, 'Cofre de los símbolos', 'Cuatro ruedas con símbolos grabados. La tapa dice: <i>«Solo la verdad lo abre»</i>.');
    this.wheels(box, SYMBOLS, 4, v => v.join('') === SYMBOL_SOLUTION.join(''), 'morana', 'Abrir cofre');
  }
  build_piano(box) {
    this.head(box, 'El piano de Lucía', 'Escucha la caja de música y toca la misma canción. Teclas 1–7 o toca las teclas. Una nota equivocada... y ella lo sabrá.');
    const listen = el('button', 'pz-go', '▶ Escuchar la caja de música'); box.appendChild(listen);
    const prog = el('div', 'pz-prog'); box.appendChild(prog);
    const keys = el('div', 'piano'); box.appendChild(keys);
    let pos = 0;
    const render = () => { prog.textContent = MELODY.map((_, i) => i < pos ? '●' : '○').join(' '); };
    render();
    listen.onclick = () => MELODY.forEach((n, i) => this.sfx.note(NOTES7[n][1], { type: 'box', delay: i * 0.5, vol: 0.35 }));
    const press = i => {
      if (this.busy) return;
      this.sfx.note(NOTES7[i][1]);
      const k = keys.children[i]; k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 150);
      if (i === MELODY[pos]) { pos++; render(); if (pos === MELODY.length) { this.busy = true; setTimeout(() => { this.busy = false; this.solve(); }, 700); } }
      else { pos = 0; render(); this.sfx.discord(); this.fail('morana'); }
    };
    NOTES7.forEach(([n], i) => { const k = el('button', 'pkey', `<span>${n}</span><small>${i + 1}</small>`); k.onpointerdown = e => { e.preventDefault(); press(i); }; keys.appendChild(k); });
    this.onKey(e => { const n = parseInt(e.key); if (n >= 1 && n <= 7) press(n - 1); });
    this.pianoPress = press;
  }
  build_retratos(box) {
    this.head(box, 'Galería de retratos', 'Cuelga los retratos en el orden en que murieron (de izquierda a derecha). Toca uno y luego otro para intercambiarlos.');
    const order = ['tomas', 'elena', 'ignacio', 'remedios', 'lucia'];
    const row = el('div', 'portraits'); box.appendChild(row);
    let sel = -1;
    const cvs = order.map(() => { const c = document.createElement('canvas'); c.width = 150; c.height = 190; row.appendChild(c); return c; });
    const render = (dead = false) => cvs.forEach((c, i) => { const p = PEOPLE.find(q => q.id === order[i]); drawPortrait(c.getContext('2d'), 150, 190, p, dead); c.classList.toggle('sel', i === sel); });
    render();
    cvs.forEach((c, i) => c.onclick = () => {
      if (this.busy) return;
      if (sel < 0) { sel = i; } else { [order[sel], order[i]] = [order[i], order[sel]]; sel = -1; this.sfx.click(); }
      render();
    });
    const b = el('button', 'pz-go', 'Colgar en este orden'); box.appendChild(b);
    b.onclick = () => {
      if (this.busy) return;
      if (order.join() === PORTRAIT_ORDER.join()) { this.sfx.unlock(); setTimeout(() => this.solve(), 400); }
      else { render(true); this.sfx.sting(); setTimeout(() => this.fail('retrato', () => render(false)), 700); }
    };
    this.portraitOrder = order;
  }
  build_ouija(box) {
    this.head(box, 'La tabla ouija', 'Escribe su nombre con la tabla. Una letra equivocada la enfurecerá.');
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 500; cv.className = 'pz-canvas'; box.appendChild(cv);
    const prog = el('div', 'pz-prog'); box.appendChild(prog);
    const ctx = cv.getContext('2d');
    let pos = 0, last = null, shake = 0;
    const render = () => {
      ctx.clearRect(0, 0, 800, 500);
      ctx.save(); if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      this.ouijaPos = drawOuija(ctx, 800, 500);
      if (last) { const [px, py] = last; ctx.fillStyle = 'rgba(240,230,210,0.55)'; ctx.strokeStyle = '#1a0e04'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py - 45); ctx.lineTo(px + 38, py + 30); ctx.lineTo(px - 38, py + 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, 14, 0, 7); ctx.stroke(); }
      ctx.restore();
      prog.textContent = OUIJA_NAME.split('').map((L, i) => i < pos ? L : '_').join(' ');
    };
    render();
    const pick = L => {
      if (this.busy) return;
      last = this.ouijaPos[L]; this.sfx.noise({ dur: 0.35, freq: 300, vol: 0.2 });
      if (L === OUIJA_NAME[pos]) { pos++; this.sfx.whisper(); render(); if (pos === OUIJA_NAME.length) { this.busy = true; setTimeout(() => { this.busy = false; this.solve(); }, 900); } }
      else { pos = 0; shake = 20; render(); const iv = setInterval(render, 40); setTimeout(() => { clearInterval(iv); shake = 0; this.fail('morana', render); }, 500); }
    };
    cv.addEventListener('pointerdown', e => {
      const [x, y] = canvasPos(cv, e); let best = null, bd = 34;
      for (const L in this.ouijaPos) { const [px, py] = this.ouijaPos[L]; const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = L; } }
      if (best) pick(best);
    });
    this.onKey(e => { const L = e.key.toUpperCase(); if (L.length === 1 && L >= 'A' && L <= 'Z') pick(L); });
    this.ouijaPick = pick;
  }
  buildOperation(box, cfg) {
    this.head(box, cfg.title, cfg.hint);
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 500; cv.className = 'pz-canvas op'; box.appendChild(cv);
    const ctx = cv.getContext('2d'), path = cfg.path, W = cfg.width, R = 7;
    const end = path[path.length - 1], exit = path[0];
    let item = [...end], grabbed = false, off = [0, 0], eyes = false, ptr = null, done = false;
    const render = () => {
      ctx.clearRect(0, 0, 800, 500);
      cfg.draw(ctx, 800, 500, eyes);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const stroke = (wd, col) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
      stroke(W + 12, cfg.rim); stroke(W + 4, 'rgba(0,0,0,0.6)'); stroke(W, cfg.inner);
      ctx.fillStyle = cfg.inner; ctx.beginPath(); ctx.arc(end[0], end[1], W * 0.9, 0, 7); ctx.fill();
      // salida
      ctx.strokeStyle = 'rgba(120,255,160,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(exit[0], exit[1], 15, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // objeto
      const [ix, iy] = item;
      if (cfg.item === 'heart') {
        ctx.fillStyle = '#8a0f1a'; ctx.beginPath(); ctx.moveTo(ix, iy + 9); ctx.bezierCurveTo(ix - 16, iy - 2, ix - 8, iy - 14, ix, iy - 5); ctx.bezierCurveTo(ix + 8, iy - 14, ix + 16, iy - 2, ix, iy + 9); ctx.fill();
        ctx.fillStyle = '#d8b040'; ctx.fillRect(ix - 2, iy - 3, 4, 4);
      } else {
        ctx.strokeStyle = '#d8b040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ix - 5, iy, 4, 0, 7); ctx.moveTo(ix - 1, iy); ctx.lineTo(ix + 9, iy); ctx.lineTo(ix + 9, iy + 4); ctx.stroke();
      }
      // pinzas
      if (ptr) { ctx.strokeStyle = '#c8ccd0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ptr[0] + 3, ptr[1] - 3); ctx.lineTo(ptr[0] + 60, ptr[1] - 70); ctx.moveTo(ptr[0] - 3, ptr[1] - 1); ctx.lineTo(ptr[0] + 50, ptr[1] - 76); ctx.stroke(); }
      if (eyes) { ctx.fillStyle = 'rgba(160,0,0,0.25)'; ctx.fillRect(0, 0, 800, 500); }
    };
    render();
    const touch = () => {
      grabbed = false; eyes = true; render(); this.sfx.buzz();
      this.fail(cfg.scare, () => { eyes = false; item = [...end]; render(); });
    };
    const moveTo = p => {
      const target = [p[0] + off[0], p[1] + off[1]];
      const steps = Math.ceil(Math.hypot(target[0] - item[0], target[1] - item[1]) / 2) || 1;
      for (let s = 1; s <= steps; s++) {
        const q = [item[0] + (target[0] - item[0]) * s / steps, item[1] + (target[1] - item[1]) * s / steps];
        const inEnd = Math.hypot(q[0] - end[0], q[1] - end[1]) < W * 0.9 - R;
        if (distPath(q, path) > W / 2 - R && !inEnd) { item = q; return touch(); }
        if (Math.hypot(q[0] - exit[0], q[1] - exit[1]) < 12) { item = q; done = true; grabbed = false; render(); this.sfx.unlock(); setTimeout(() => this.solve(), 500); return; }
      }
      item = target;
    };
    cv.addEventListener('pointerdown', e => {
      if (this.busy || done) return; const p = canvasPos(cv, e); ptr = p;
      if (Math.hypot(p[0] - item[0], p[1] - item[1]) < 26) { grabbed = true; off = [item[0] - p[0], item[1] - p[1]]; cv.setPointerCapture(e.pointerId); this.sfx.click(); }
      render();
    });
    cv.addEventListener('pointermove', e => { if (this.busy || done) return; const p = canvasPos(cv, e); ptr = p; if (grabbed) moveTo(p); render(); });
    const up = () => { grabbed = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    this.opInfo = { path, get item() { return item; } };
  }
}
