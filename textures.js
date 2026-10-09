// Texturas y dibujos procedurales (canvas). Nada de imágenes externas.
export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d', { willReadFrequently: true }); return c; }
const rnd = (a, b) => a + Math.random() * (b - a);
function grain(x, w, h, amt) {
  const im = x.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
}
function stains(x, w, h, n, col) {
  for (let i = 0; i < n; i++) {
    const cx = rnd(0, w), cy = rnd(0, h), r = rnd(15, 90);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
}
export function wallpaper() {
  const c = makeCanvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#b9a88f'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 512; i += 64) { x.fillStyle = 'rgba(70,45,30,0.16)'; x.fillRect(i, 0, 26, 360); }
  x.strokeStyle = 'rgba(80,50,35,0.4)'; x.lineWidth = 3;
  for (let yy = 30, r = 0; yy < 350; yy += 70, r++) for (let xx = -32; xx <= 544; xx += 64) {
    const ox = xx + (r % 2) * 32;
    x.beginPath(); x.moveTo(ox, yy - 20); x.quadraticCurveTo(ox + 16, yy, ox, yy + 20); x.quadraticCurveTo(ox - 16, yy, ox, yy - 20); x.stroke();
    x.beginPath(); x.arc(ox, yy, 4, 0, 7); x.stroke();
  }
  x.fillStyle = '#4a3020'; x.fillRect(0, 360, 512, 152);
  x.fillStyle = '#6a4a30'; x.fillRect(0, 352, 512, 12);
  x.strokeStyle = 'rgba(20,10,5,0.6)'; x.lineWidth = 4;
  for (let i = 0; i < 4; i++) x.strokeRect(i * 128 + 14, 382, 100, 110);
  stains(x, 512, 512, 16, 'rgba(25,15,8,0.4)');
  for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(30,18,10,0.25)'; x.fillRect(rnd(0, 512), rnd(0, 120), rnd(2, 5), rnd(60, 300)); }
  grain(x, 512, 512, 34);
  return c;
}
export function stone() {
  const c = makeCanvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#5a5a58'; x.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let i = -1; i < 5; i++) {
    const ox = i * 128 + (r % 2) * 64;
    x.fillStyle = `rgb(${rnd(70, 105) | 0},${rnd(70, 100) | 0},${rnd(65, 95) | 0})`;
    x.fillRect(ox + 3, r * 64 + 3, 122, 58);
  }
  stains(x, 512, 512, 20, 'rgba(20,30,20,0.45)');
  grain(x, 512, 512, 40);
  return c;
}
export function woodFloor() {
  const c = makeCanvas(512, 512), x = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    const v = rnd(0.8, 1.15);
    x.fillStyle = `rgb(${92 * v | 0},${60 * v | 0},${38 * v | 0})`; x.fillRect(0, i * 64, 512, 64);
    x.strokeStyle = 'rgba(30,18,10,0.35)'; x.lineWidth = 1;
    for (let k = 0; k < 7; k++) { x.beginPath(); const y = i * 64 + rnd(5, 60); x.moveTo(0, y); x.bezierCurveTo(170, y + rnd(-6, 6), 340, y + rnd(-6, 6), 512, y); x.stroke(); }
    x.fillStyle = '#140b06'; x.fillRect(0, i * 64, 512, 3);
    const cut = rnd(50, 460); x.fillRect(cut, i * 64, 3, 64);
  }
  stains(x, 512, 512, 10, 'rgba(15,8,4,0.5)');
  grain(x, 512, 512, 26);
  return c;
}
export function ceiling() {
  const c = makeCanvas(256, 256), x = c.getContext('2d');
  x.fillStyle = '#4c4642'; x.fillRect(0, 0, 256, 256);
  stains(x, 256, 256, 10, 'rgba(30,25,15,0.5)');
  x.strokeStyle = 'rgba(20,15,10,0.6)';
  for (let i = 0; i < 5; i++) { x.beginPath(); let px = rnd(0, 256), py = rnd(0, 256); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += rnd(-30, 30); py += rnd(-30, 30); x.lineTo(px, py); } x.stroke(); }
  grain(x, 256, 256, 24);
  return c;
}
export function doorTex() {
  const c = makeCanvas(256, 512), x = c.getContext('2d');
  x.fillStyle = '#3b2414'; x.fillRect(0, 0, 256, 512);
  x.strokeStyle = 'rgba(15,8,3,0.8)'; x.lineWidth = 8;
  x.strokeRect(30, 30, 196, 200); x.strokeRect(30, 270, 196, 210);
  x.fillStyle = 'rgba(255,230,180,0.07)'; x.fillRect(40, 40, 176, 180); x.fillRect(40, 280, 176, 190);
  stains(x, 256, 512, 8, 'rgba(10,5,2,0.5)');
  for (let i = 0; i < 30; i++) { x.strokeStyle = 'rgba(15,8,3,0.25)'; x.lineWidth = 1; x.beginPath(); const xx = rnd(0, 256); x.moveTo(xx, 0); x.lineTo(xx + rnd(-10, 10), 512); x.stroke(); }
  // arañazos
  x.strokeStyle = 'rgba(200,170,140,0.25)'; x.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const sx = 90 + i * 14; x.beginPath(); x.moveTo(sx, 300); x.lineTo(sx + 10, 420); x.stroke(); }
  grain(x, 256, 512, 24);
  return c;
}
export function books() {
  const c = makeCanvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#21140a'; x.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 4; r++) {
    let px = 6; const base = (r + 1) * 128 - 12;
    while (px < 500) {
      const w = rnd(10, 26), h = rnd(70, 108);
      if (Math.random() < 0.06) { px += w; continue; }
      const cols = ['#5a1a14', '#1e3a24', '#2a2448', '#6a5020', '#3a2a1a', '#4a1030'];
      x.fillStyle = cols[(Math.random() * cols.length) | 0]; x.fillRect(px, base - h, w - 2, h);
      x.fillStyle = 'rgba(220,180,90,0.5)'; x.fillRect(px + 2, base - h + 10, w - 6, 3); x.fillRect(px + 2, base - 18, w - 6, 3);
      px += w;
    }
    x.fillStyle = '#3e2614'; x.fillRect(0, base, 512, 12);
  }
  stains(x, 512, 512, 6, 'rgba(0,0,0,0.5)');
  grain(x, 512, 512, 22);
  return c;
}
export function paper() {
  const c = makeCanvas(256, 320), x = c.getContext('2d');
  x.fillStyle = '#d8ccae'; x.fillRect(0, 0, 256, 320);
  stains(x, 256, 320, 8, 'rgba(120,80,30,0.35)');
  x.strokeStyle = 'rgba(40,25,15,0.75)'; x.lineWidth = 2;
  for (let y = 40; y < 290; y += 22) { x.beginPath(); x.moveTo(24, y); let px = 24; while (px < 230) { px += rnd(6, 14); x.lineTo(px, y + rnd(-3, 3)); } x.stroke(); }
  grain(x, 256, 320, 20);
  return c;
}
export function scrawl(text, color = 'rgba(120,10,10,0.9)') {
  const c = makeCanvas(1024, 256), x = c.getContext('2d');
  x.font = 'bold 110px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = color; x.save(); x.translate(512, 110); x.rotate(-0.04); x.fillText(text, 0, 0); x.restore();
  for (let i = 0; i < 26; i++) { x.fillStyle = color; const dx = rnd(120, 900); x.fillRect(dx, rnd(120, 160), rnd(2, 6), rnd(20, 90)); }
  return c;
}
export function mirror(symbols) {
  const c = makeCanvas(256, 384), x = c.getContext('2d');
  x.fillStyle = '#6b5420'; x.fillRect(0, 0, 256, 384);
  x.strokeStyle = '#c9a04a'; x.lineWidth = 6; x.strokeRect(10, 10, 236, 364);
  const g = x.createLinearGradient(0, 0, 256, 384); g.addColorStop(0, '#46525a'); g.addColorStop(0.5, '#20282e'); g.addColorStop(1, '#3a464c');
  x.fillStyle = g; x.fillRect(22, 22, 212, 340);
  // figura tenue en el reflejo
  x.fillStyle = 'rgba(200,200,190,0.10)'; x.beginPath(); x.ellipse(170, 120, 18, 24, 0, 0, 7); x.fill();
  x.fillRect(150, 140, 40, 120);
  // símbolos al revés (reflejados)
  x.save(); x.translate(256, 0); x.scale(-1, 1);
  x.font = 'bold 44px "DejaVu Sans", "Segoe UI Symbol", serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(230,220,200,0.92)';
  symbols.forEach((s, i) => x.fillText(s, 50 + i * 52, 300));
  x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(40, 40); x.lineTo(120, 200); x.lineTo(90, 340); x.stroke();
  grain(x, 256, 384, 18);
  return c;
}
export function ghostSprite() {
  const c = makeCanvas(256, 512), x = c.getContext('2d');
  // túnica
  const g = x.createLinearGradient(0, 120, 0, 512); g.addColorStop(0, 'rgba(8,8,10,1)'); g.addColorStop(0.75, 'rgba(10,10,14,0.85)'); g.addColorStop(1, 'rgba(10,10,14,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(96, 135); x.lineTo(160, 135); x.quadraticCurveTo(205, 170, 200, 260);
  for (let i = 0; i <= 10; i++) x.lineTo(210 - i * 16 + rnd(-8, 8), 470 + rnd(-30, 30));
  x.quadraticCurveTo(50, 170, 96, 135); x.fill();
  // brazos largos
  x.strokeStyle = '#b9b7ae'; x.lineWidth = 7; x.lineCap = 'round';
  [[70, 170, 40, 360], [186, 170, 214, 360]].forEach(([a, b, cc, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + cc) / 2 + (a < 128 ? -12 : 12), 260, cc, d); x.stroke();
    x.lineWidth = 3; for (let f = -2; f <= 2; f++) { x.beginPath(); x.moveTo(cc, d); x.lineTo(cc + f * 5, d + 30); x.stroke(); } x.lineWidth = 7; });
  // cara
  const fg = x.createRadialGradient(128, 90, 5, 128, 95, 50); fg.addColorStop(0, '#f2efe6'); fg.addColorStop(1, '#8f8e86');
  x.fillStyle = fg; x.beginPath(); x.ellipse(128, 95, 34, 48, 0, 0, 7); x.fill();
  x.fillStyle = '#000'; x.beginPath(); x.ellipse(114, 85, 9, 12, 0.2, 0, 7); x.fill(); x.beginPath(); x.ellipse(142, 85, 9, 12, -0.2, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.fillRect(113, 85, 2, 2); x.fillRect(141, 85, 2, 2);
  x.fillStyle = '#000'; x.beginPath(); x.ellipse(128, 122, 8, 16, 0, 0, 7); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(112, 96); x.lineTo(110, 125); x.moveTo(144, 96); x.lineTo(147, 128); x.stroke();
  // pelo
  x.strokeStyle = '#050505';
  for (let i = 0; i < 60; i++) { x.lineWidth = rnd(1.5, 4); const sx = rnd(92, 164); x.beginPath(); x.moveTo(sx, 45); x.quadraticCurveTo(sx + (sx < 128 ? -30 : 30), 120, sx + rnd(-50, 50) * (sx < 128 ? 1 : 1), rnd(180, 300)); x.stroke(); }
  x.fillStyle = '#050505'; x.beginPath(); x.ellipse(128, 58, 38, 22, 0, Math.PI, 0); x.fill();
  return c;
}
// Cara para los sustos (jumpscare)
export function drawFace(x, w, h, variant = 'morana') {
  const V = {
    morana: { skin: ['#f1eee6', '#8c8a84'], eyes: 'hollow', hair: true, mouth: 1.0 },
    cadaver: { skin: ['#c8d0c0', '#5c6a5a'], eyes: 'white', hair: false, mouth: 0.8 },
    muneca: { skin: ['#fbf3ea', '#b9a89a'], eyes: 'button', hair: true, mouth: 0.6, doll: true },
    retrato: { skin: ['#e6d3b0', '#6a5030'], eyes: 'hollow', hair: true, mouth: 1.1 },
  }[variant] || {};
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.52, s = Math.min(w, h * 1.1);
  if (V.hair) {
    x.fillStyle = V.doll ? '#2a1608' : '#030303';
    x.beginPath(); x.ellipse(cx, cy - s * 0.12, s * 0.36, s * 0.42, 0, 0, 7); x.fill();
  }
  const g = x.createRadialGradient(cx, cy - s * 0.05, s * 0.02, cx, cy, s * 0.36);
  g.addColorStop(0, V.skin[0]); g.addColorStop(0.75, V.skin[1]); g.addColorStop(1, '#111');
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, s * 0.27, s * 0.37, 0, 0, 7); x.fill();
  // venas / grietas
  x.strokeStyle = V.doll ? 'rgba(40,20,10,0.8)' : 'rgba(60,40,70,0.45)'; x.lineWidth = Math.max(1, s * 0.003);
  for (let i = 0; i < 16; i++) { let px = cx + rnd(-0.2, 0.2) * s, py = cy + rnd(-0.3, 0.3) * s; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += rnd(-0.03, 0.03) * s; py += rnd(-0.03, 0.03) * s; x.lineTo(px, py); } x.stroke(); }
  // ojos
  [-1, 1].forEach(sd => {
    const ex = cx + sd * s * 0.105, ey = cy - s * 0.07;
    const eg = x.createRadialGradient(ex, ey, 0, ex, ey, s * 0.09);
    eg.addColorStop(0, '#000'); eg.addColorStop(0.7, '#000'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = eg; x.beginPath(); x.ellipse(ex, ey, s * 0.085, s * 0.075, sd * 0.25, 0, 7); x.fill();
    if (V.eyes === 'white') { x.fillStyle = '#e8eee0'; x.beginPath(); x.ellipse(ex, ey, s * 0.05, s * 0.04, 0, 0, 7); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(ex, ey, s * 0.008, 0, 7); x.fill(); }
    else if (V.eyes === 'button') { x.fillStyle = '#111'; x.beginPath(); x.arc(ex, ey, s * 0.055, 0, 7); x.fill(); x.fillStyle = '#5a0000'; x.beginPath(); x.arc(ex, ey, s * 0.012, 0, 7); x.fill(); }
    else { x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + sd * s * 0.006, ey, s * 0.007, 0, 7); x.fill(); }
    // lágrimas negras
    x.fillStyle = 'rgba(0,0,0,0.85)'; x.fillRect(ex - s * 0.006, ey + s * 0.05, s * 0.012, s * 0.18 + rnd(0, s * 0.05));
  });
  // boca enorme
  const my = cy + s * 0.17, mw = s * 0.07 * V.mouth, mh = s * 0.15 * V.mouth;
  x.fillStyle = '#000'; x.beginPath(); x.ellipse(cx, my, mw, mh, 0, 0, 7); x.fill();
  x.fillStyle = '#bdb6a0';
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI;
    const tx = cx - Math.cos(a) * mw * 0.9, ty = my - Math.sin(a) * mh * 0.85;
    x.beginPath(); x.moveTo(tx - s * 0.008, ty); x.lineTo(tx + s * 0.008, ty); x.lineTo(tx, ty + s * 0.03); x.fill();
    const by = my + Math.sin(a) * mh * 0.85;
    x.beginPath(); x.moveTo(tx - s * 0.008, by); x.lineTo(tx + s * 0.008, by); x.lineTo(tx, by - s * 0.03); x.fill();
  }
  if (V.hair && !V.doll) {
    x.strokeStyle = '#020202';
    for (let i = 0; i < 90; i++) { x.lineWidth = rnd(1, 5); const sx = cx + rnd(-0.3, 0.3) * s; x.beginPath(); x.moveTo(sx, cy - s * 0.38); x.quadraticCurveTo(sx + rnd(-0.1, 0.1) * s, cy, sx + (sx < cx ? -1 : 1) * rnd(0.02, 0.12) * s, cy + s * rnd(0.2, 0.5)); x.stroke(); }
  }
  const vg = x.createRadialGradient(cx, cy, s * 0.25, cx, cy, Math.max(w, h) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,0,0,0.85)');
  x.fillStyle = vg; x.fillRect(0, 0, w, h);
}
export const PEOPLE = [
  { id: 'ignacio', name: 'Ignacio', role: 'El padre', skin: '#d9b896', hair: '#2a1a10', coat: '#1a1a22', beard: true },
  { id: 'lucia', name: 'Lucía', role: 'La niña', skin: '#f0d6c0', hair: '#c8a050', coat: '#d8d0e8', bow: true, small: true },
  { id: 'remedios', name: 'Remedios', role: 'La abuela', skin: '#e0c8b0', hair: '#c8c8c8', coat: '#3a2a3a', bun: true },
  { id: 'tomas', name: 'Tomás', role: 'El mayordomo', skin: '#d0b090', hair: '#d0b090', coat: '#101010', bald: true, tie: true },
  { id: 'elena', name: 'Elena', role: 'La madre', skin: '#f0d8c4', hair: '#3a1a0a', coat: '#6a0d14', long: true },
];
export function drawPortrait(x, w, h, p, dead = false) {
  x.fillStyle = '#7a5a1a'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#c9a04a'; x.fillRect(4, 4, w - 8, h - 8);
  x.fillStyle = '#7a5a1a'; x.fillRect(10, 10, w - 20, h - 20);
  const bg = x.createRadialGradient(w / 2, h * 0.4, 5, w / 2, h * 0.4, w * 0.7); bg.addColorStop(0, '#3a3024'); bg.addColorStop(1, '#0e0a06');
  x.fillStyle = bg; x.fillRect(14, 14, w - 28, h - 28);
  const cx = w / 2, sc = p.small ? 0.8 : 1, fy = h * (p.small ? 0.42 : 0.38), fr = w * 0.16 * sc;
  x.fillStyle = p.coat; x.beginPath(); x.ellipse(cx, h * 0.86, w * 0.36 * sc, h * 0.3, 0, Math.PI, 0); x.fill(); x.fillRect(cx - w * 0.36 * sc, h * 0.86, w * 0.72 * sc, h * 0.1);
  if (p.long) { x.fillStyle = p.hair; x.beginPath(); x.ellipse(cx, fy + fr * 0.8, fr * 1.4, fr * 2.2, 0, 0, 7); x.fill(); }
  x.fillStyle = p.skin; x.fillRect(cx - fr * 0.35, fy + fr * 0.8, fr * 0.7, fr * 0.8);
  x.beginPath(); x.ellipse(cx, fy, fr, fr * 1.25, 0, 0, 7); x.fill();
  if (!p.bald) { x.fillStyle = p.hair; x.beginPath(); x.ellipse(cx, fy - fr * 0.55, fr * 1.05, fr * 0.75, 0, Math.PI, 0); x.fill(); }
  if (p.bun) { x.beginPath(); x.arc(cx, fy - fr * 1.3, fr * 0.45, 0, 7); x.fill(); }
  if (p.bow) { x.fillStyle = '#a01020'; x.beginPath(); x.moveTo(cx + fr * 0.6, fy - fr); x.lineTo(cx + fr * 1.3, fy - fr * 1.4); x.lineTo(cx + fr * 1.3, fy - fr * 0.6); x.fill(); }
  if (p.beard) { x.fillStyle = p.hair; x.fillRect(cx - fr * 0.45, fy + fr * 0.35, fr * 0.9, fr * 0.18); }
  if (p.tie) { x.fillStyle = '#eee'; x.fillRect(cx - fr * 0.4, fy + fr * 1.55, fr * 0.8, fr * 0.25); x.fillStyle = '#000'; x.fillRect(cx - fr * 0.25, fy + fr * 1.58, fr * 0.5, fr * 0.18); }
  if (dead) {
    x.fillStyle = '#000';
    [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * fr * 0.38, fy - fr * 0.1, fr * 0.24, fr * 0.3, 0, 0, 7); x.fill(); x.fillRect(cx + s * fr * 0.38 - 1.5, fy, 3, fr * 1.2); });
    x.beginPath(); x.ellipse(cx, fy + fr * 0.6, fr * 0.22, fr * 0.4, 0, 0, 7); x.fill();
  } else {
    x.fillStyle = '#1a1008'; [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * fr * 0.38, fy - fr * 0.1, fr * 0.1, 0, 7); x.fill(); });
    x.strokeStyle = '#5a2a20'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - fr * 0.3, fy + fr * 0.6); x.lineTo(cx + fr * 0.3, fy + fr * 0.6); x.stroke();
  }
  x.fillStyle = '#c9a04a'; x.fillRect(w * 0.2, h - 34, w * 0.6, 20);
  x.fillStyle = '#2a1a05'; x.font = `bold ${Math.round(w * 0.085)}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(p.name, w / 2, h - 24);
  grain(x, w, h, 18);
}
export const OUIJA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export function drawOuija(x, w, h) {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a07a44'); g.addColorStop(1, '#6e4e26');
  x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(4, 4, w - 8, h - 8, 40) : x.rect(4, 4, w - 8, h - 8); x.fill();
  x.strokeStyle = '#2a1a08'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#1c1006'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold ${w * 0.045}px Georgia, serif`;
  x.fillText('SÍ', w * 0.12, h * 0.12); x.fillText('NO', w * 0.88, h * 0.12);
  x.fillText('ADIÓS', w * 0.5, h * 0.9);
  const pos = {};
  x.font = `bold ${w * 0.05}px Georgia, serif`;
  const row1 = OUIJA_LETTERS.slice(0, 13), row2 = OUIJA_LETTERS.slice(13);
  [[row1, 0.3, 0.42], [row2, 0.52, 0.38]].forEach(([row, cyf, rf]) => {
    row.forEach((L, i) => {
      const a = Math.PI * (0.82 - 0.64 * i / (row.length - 1));
      const px = w / 2 + Math.cos(a) * w * rf, py = h * cyf + h * 0.25 * (1 - Math.sin(a));
      x.fillText(L, px, py); pos[L] = [px, py];
    });
  });
  x.font = `${w * 0.035}px Georgia, serif`;
  x.fillText('1 2 3 4 5 6 7 8 9 0', w / 2, h * 0.78);
  x.fillStyle = 'rgba(30,15,5,0.8)'; x.beginPath(); x.arc(w * 0.12, h * 0.25, w * 0.03, 0, 7); x.fill();
  x.beginPath(); x.arc(w * 0.88, h * 0.25, w * 0.03, 0, 7); x.fill();
  return pos;
}
export function ritualCircle() {
  const c = makeCanvas(512, 512), x = c.getContext('2d');
  x.strokeStyle = 'rgba(130,15,15,0.85)'; x.lineWidth = 8;
  x.beginPath(); x.arc(256, 256, 230, 0, 7); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(256, 256, 190, 0, 7); x.stroke();
  x.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const px = 256 + Math.cos(a) * 190, py = 256 + Math.sin(a) * 190; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  x.fillStyle = 'rgba(130,15,15,0.85)'; x.font = 'bold 30px "DejaVu Sans", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  'MORANA☾✝☠☥'.split('').forEach((ch, i, arr) => { const a = i / arr.length * Math.PI * 2; x.fillText(ch, 256 + Math.cos(a) * 210, 256 + Math.sin(a) * 210); });
  return c;
}
export function drawCadaver(x, w, h, eyesOpen) {
  const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2b3034'); bg.addColorStop(1, '#14181a');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < w; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  const skin = x.createRadialGradient(400, 260, 40, 400, 260, 260); skin.addColorStop(0, '#b7c0ae'); skin.addColorStop(1, '#6d7866');
  x.fillStyle = skin;
  x.beginPath(); x.ellipse(170, 250, 45, 170, 0.12, 0, 7); x.fill();
  x.beginPath(); x.ellipse(630, 250, 45, 170, -0.12, 0, 7); x.fill();
  x.beginPath(); x.ellipse(400, 270, 220, 200, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(400, 40, 60, 62, 0, 0, 7); x.fill();
  x.fillStyle = '#4a4038'; x.beginPath(); x.ellipse(400, 10, 62, 30, 0, 0, 7); x.fill();
  if (eyesOpen) { x.fillStyle = '#eef2e6'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(400 + s * 22, 40, 12, 9, 0, 0, 7); x.fill(); }); x.fillStyle = '#000'; [-1, 1].forEach(s => { x.beginPath(); x.arc(400 + s * 22, 42, 3, 0, 7); x.fill(); }); x.beginPath(); x.ellipse(400, 75, 10, 14, 0, 0, 7); x.fill(); }
  else { x.strokeStyle = '#2a2a24'; x.lineWidth = 3; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(388 + s * 22 - 10, 40); x.lineTo(388 + s * 22 + 14, 42); x.stroke(); }); x.beginPath(); x.moveTo(390, 74); x.lineTo(410, 74); x.stroke(); }
  // sábana
  x.fillStyle = '#c9c7bd'; x.fillRect(150, 420, 500, 80);
  x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(170 + i * 85, 425); x.lineTo(200 + i * 80, 500); x.stroke(); }
  // costuras
  x.strokeStyle = '#2a2018'; x.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const yy = 400 + (i % 2) * 6; x.beginPath(); x.moveTo(260 + i * 20, 395); x.lineTo(270 + i * 20, 410); x.stroke(); }
}
export function drawDoll(x, w, h, eyesOpen) {
  x.fillStyle = '#20160e'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i += 50) { x.fillStyle = i % 100 ? '#2a1c12' : '#251810'; x.fillRect(0, i, w, 48); }
  x.fillStyle = '#e4dccd'; x.beginPath(); x.ellipse(400, 290, 230, 200, 0, 0, 7); x.fill();
  x.fillStyle = '#7a1424'; x.beginPath(); x.ellipse(400, 430, 260, 90, 0, 0, Math.PI); x.fill();
  x.strokeStyle = 'rgba(80,20,30,0.5)'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(160 + i * 60, 260); x.lineTo(150 + i * 62, 480); x.stroke(); }
  x.fillStyle = '#f5ece2'; x.beginPath(); x.arc(400, 45, 70, 0, 7); x.fill();
  x.fillStyle = '#5a3010'; x.beginPath(); x.arc(400, 10, 72, Math.PI, 0); x.fill();
  if (eyesOpen) { x.fillStyle = '#000'; [-1, 1].forEach(s => { x.beginPath(); x.arc(400 + s * 26, 45, 16, 0, 7); x.fill(); }); x.fillStyle = '#c00'; [-1, 1].forEach(s => { x.beginPath(); x.arc(400 + s * 26, 45, 3, 0, 7); x.fill(); }); }
  else { x.fillStyle = '#111'; [-1, 1].forEach(s => { x.beginPath(); x.arc(400 + s * 26, 45, 9, 0, 7); x.fill(); }); }
  x.strokeStyle = '#8a1020'; x.lineWidth = 3; x.beginPath(); x.arc(400, 70, 18, 0.2, Math.PI - 0.2); x.stroke();
  x.strokeStyle = '#3a2a20'; x.lineWidth = 2; x.beginPath(); x.moveTo(440, 10); x.lineTo(430, 40); x.lineTo(445, 60); x.stroke();
  x.strokeStyle = 'rgba(60,40,30,0.6)'; x.beginPath(); x.moveTo(250, 200); x.lineTo(300, 260); x.lineTo(280, 330); x.stroke();
}
