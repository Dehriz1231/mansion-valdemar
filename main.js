import * as THREE from './lib/three.module.min.js';
import { Sfx } from './audio.js';
import * as TX from './textures.js';
import { PuzzleUI, MIRROR_SHOWN } from './puzzles.js';

// ---------------------------------------------------------------- MAPA
const CELL = 4, WALL_H = 3.2, GW = 31, GH = 25;
const ROOMS = {
  vestibulo: { name: 'Vestíbulo', x0: 9, z0: 9, x1: 17, z1: 15, tint: 0xb09080 },
  biblioteca: { name: 'Biblioteca', x0: 1, z0: 9, x1: 7, z1: 15, tint: 0x80907a },
  cocina: { name: 'Cocina', x0: 1, z0: 1, x1: 7, z1: 7, tint: 0x9a9a88 },
  musica: { name: 'Salón de música', x0: 9, z0: 1, x1: 17, z1: 7, tint: 0x8a6c96 },
  galeria: { name: 'Galería de retratos', x0: 19, z0: 1, x1: 29, z1: 7, tint: 0xa06a58 },
  atico: { name: 'Ático', x0: 19, z0: 9, x1: 29, z1: 15, tint: 0x7a6a56 },
  sotano: { name: 'Sótano', x0: 19, z0: 17, x1: 29, z1: 23, tint: 0x8a9298, stone: true },
};
// Puertas: id = número de puzzle que la abre
const DOORS = [
  { id: 1, x: 8, z: 12, thin: 'x', name: 'la biblioteca' },
  { id: 2, x: 4, z: 8, thin: 'z', name: 'la cocina' },
  { id: 3, x: 8, z: 4, thin: 'x', name: 'el salón de música' },
  { id: 4, x: 18, z: 4, thin: 'x', name: 'la galería' },
  { id: 5, x: 24, z: 8, thin: 'z', name: 'el ático' },
  { id: 6, x: 24, z: 16, thin: 'z', name: 'el sótano' },
  { id: 7, x: 18, z: 12, thin: 'x', name: 'un pasadizo secreto', secret: true },
  { id: 7, x: 13, z: 16, thin: 'z', name: 'la salida', exit: true },
];
const SPAWNS = [[13, 14, 0], [5, 12, Math.PI / 2], [4, 6, Math.PI], [12, 5, -Math.PI / 2], [21, 4, -Math.PI / 2], [24, 10, 0], [24, 18, 0], [24, 18, 0]];
const OBJECTIVES = [
  'Abre el candado de la puerta de la biblioteca (lado oeste del vestíbulo).',
  'Descubre el secreto del espejo y abre el cofre de la biblioteca.',
  'En la cocina hay un cadáver... algo brilla en su corazón.',
  'Toca la canción de cuna en el piano del salón de música.',
  'Ordena los retratos de la galería.',
  'La llave del sótano está en el ático, dentro de la muñeca.',
  'Habla con ella a través de la tabla ouija del sótano.',
  '¡CORRE A LA PUERTA PRINCIPAL DEL VESTÍBULO!',
];
const grid = [];
for (let z = 0; z < GH; z++) grid.push(new Array(GW).fill(1));
for (const r of Object.values(ROOMS)) for (let z = r.z0; z <= r.z1; z++) for (let x = r.x0; x <= r.x1; x++) grid[z][x] = 0;
const SHELVES = [[2, 11], [3, 11], [5, 13], [6, 13]];
const PILLARS = [[22, 19], [26, 19], [22, 21], [26, 21]];
const CRATES = [[20, 10], [28, 14], [28, 10]];
SHELVES.concat(PILLARS).forEach(([x, z]) => grid[z][x] = 1);
CRATES.forEach(([x, z]) => grid[z][x] = 3);
const PROPCELLS = [[1, 15], [4, 4], [13, 1], [24, 12], [24, 20]];
PROPCELLS.forEach(([x, z]) => grid[z][x] = 3);
const doorAt = {};
DOORS.forEach(d => { grid[d.z][d.x] = 2; doorAt[d.x + ',' + d.z] = d; d.open = false; });
const roomOf = (cx, cz) => { for (const k in ROOMS) { const r = ROOMS[k]; if (cx >= r.x0 && cx <= r.x1 && cz >= r.z0 && cz <= r.z1) return k; } return null; };
const blocked = (cx, cz) => { if (cx < 0 || cz < 0 || cx >= GW || cz >= GH) return true; const v = grid[cz][cx]; if (v === 2) return !doorAt[cx + ',' + cz].open; return v !== 0; };
const cc = c => (c + 0.5) * CELL;

// ---------------------------------------------------------------- RENDER
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x030203, 0.085);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 80);
camera.rotation.order = 'YXZ';
scene.add(camera);
const hemi = new THREE.HemisphereLight(0x405070, 0x100804, 0.35); scene.add(hemi);

const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
const lam = (o) => new THREE.MeshLambertMaterial(o);
const M = {
  wall: lam({ map: tex(TX.wallpaper()) }),
  stone: lam({ map: tex(TX.stone()) }),
  floor: lam({ map: tex(TX.woodFloor(), GW, GH) }),
  ceil: lam({ map: tex(TX.ceiling(), GW, GH) }),
  door: lam({ map: tex(TX.doorTex()) }),
  books: lam({ map: tex(TX.books()) }),
  wood: lam({ color: 0x3a2414 }), dark: lam({ color: 0x0c0a0a }), metal: lam({ color: 0x777b80 }),
  skin: lam({ color: 0x9aa490 }), sheet: lam({ color: 0xb8b4a8 }), cloth: lam({ color: 0x5a1020 }), porcelain: lam({ color: 0xf0e6da }),
  white: lam({ color: 0xddd8cc }), crate: lam({ color: 0x5a4028 }), gold: lam({ color: 0xa08030 }),
  paper: lam({ map: tex(TX.paper()), emissive: 0x2a2618 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffb050 }),
  battery: lam({ color: 0x228844, emissive: 0x0a5520 }),
};
// suelo y techo
const floor = new THREE.Mesh(new THREE.PlaneGeometry(GW * CELL, GH * CELL), M.floor);
floor.rotation.x = -Math.PI / 2; floor.position.set(GW * CELL / 2, 0, GH * CELL / 2); scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(GW * CELL, GH * CELL), M.ceil);
ceil.rotation.x = Math.PI / 2; ceil.position.set(GW * CELL / 2, WALL_H, GH * CELL / 2); scene.add(ceil);
// paredes (instanced)
{
  const cells = { wall: [], stone: [], books: [] };
  const shelfSet = new Set(SHELVES.map(a => a.join(',')));
  for (let z = 0; z < GH; z++) for (let x = 0; x < GW; x++) {
    if (grid[z][x] !== 1) continue;
    let room = null;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = x + dx, nz = z + dz; if (nx >= 0 && nz >= 0 && nx < GW && nz < GH && grid[nz][nx] !== 1) { room = roomOf(nx, nz) || room; } }
    if (!room) continue;
    const kind = shelfSet.has(x + ',' + z) ? 'books' : ROOMS[room].stone ? 'stone' : 'wall';
    cells[kind].push([x, z, ROOMS[room].tint]);
  }
  const geo = new THREE.BoxGeometry(CELL, WALL_H, CELL); geo.translate(0, WALL_H / 2, 0);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (const k in cells) {
    const list = cells[k]; if (!list.length) continue;
    const im = new THREE.InstancedMesh(geo, M[k], list.length);
    list.forEach(([x, z, t], i) => { m4.makeTranslation(cc(x), 0, cc(z)); im.setMatrixAt(i, m4); col.set(k === 'books' ? 0xffffff : t); im.setColorAt(i, col); });
    scene.add(im);
  }
}
// utilidades de props
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function cyl(r, h, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), mat); m.position.set(x, y, z); parent.add(m); return m; }
// objeto plano pegado a una pared de una celda de suelo. side: n,s,e,w
function onWall(cx, cz, side, w, h, mat, y = 1.6, along = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const X = cc(cx), Z = cc(cz), e = 0.02;
  if (side === 'n') { m.position.set(X + along, y, cz * CELL + e); }
  if (side === 's') { m.position.set(X + along, y, (cz + 1) * CELL - e); m.rotation.y = Math.PI; }
  if (side === 'w') { m.position.set(cx * CELL + e, y, Z + along); m.rotation.y = Math.PI / 2; }
  if (side === 'e') { m.position.set((cx + 1) * CELL - e, y, Z + along); m.rotation.y = -Math.PI / 2; }
  scene.add(m); return m;
}
const interactables = [];
function addInteract(obj, label, fn) { obj.traverse ? obj.traverse(o => { if (o.isMesh) o.userData.inter = { label, fn, root: obj }; }) : null; interactables.push(obj); return obj; }
function candle(x, y, z) { cyl(0.04, 0.22, M.white, x, y + 0.11, z); const f = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), M.flame); f.position.set(x, y + 0.26, z); scene.add(f); flames.push(f); }
const flames = [];
function table(x, z, w = 1.6, d = 0.9, h = 0.85) { box(w, 0.08, d, M.wood, x, h, z); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.08, h, 0.08, M.wood, x + a * (w / 2 - 0.08), h / 2, z + b * (d / 2 - 0.08))); }

// luces de habitación
const roomLights = [];
for (const k in ROOMS) {
  const r = ROOMS[k];
  const L = new THREE.PointLight(k === 'sotano' ? 0xff4020 : 0xff9a50, 12, 20, 1.5);
  L.position.set((r.x0 + r.x1 + 1) / 2 * CELL, 2.7, (r.z0 + r.z1 + 1) / 2 * CELL);
  L.userData.base = 12; scene.add(L); roomLights.push(L);
  // candelabro colgante
  const g = new THREE.Group(); g.position.copy(L.position);
  box(0.9, 0.04, 0.04, M.gold, 0, 0, 0, g); box(0.04, 0.04, 0.9, M.gold, 0, 0, 0, g); cyl(0.015, 0.5, M.gold, 0, 0.25, 0, g);
  scene.add(g);
}

// ---------------------------------------------------------------- PUERTAS
const doorMeshes = [];
DOORS.forEach(d => {
  const g = new THREE.Group(); g.position.set(cc(d.x), 0, cc(d.z));
  if (d.thin === 'x') g.rotation.y = Math.PI / 2;
  const leaves = [];
  [-1, 1].forEach(s => {
    const pivot = new THREE.Group(); pivot.position.set(s * 1.85, 0, 0); g.add(pivot);
    const leaf = box(1.85, 2.9, 0.18, d.secret ? M.books : M.door, -s * 0.925, 1.45, 0, pivot);
    box(0.08, 0.08, 0.3, M.gold, -s * 1.6, 1.3, 0, pivot);
    pivot.userData.side = s; leaves.push(pivot);
  });
  box(4, WALL_H - 2.9, 0.4, M.wood, 0, 2.9 + (WALL_H - 2.9) / 2, 0, g);
  // marco a los lados de la pared (4 de grosor): revestimiento del túnel
  [-1, 1].forEach(s => box(0.15, WALL_H, CELL, d.secret ? M.books : M.wall, s * 1.93, WALL_H / 2, 0, g));
  if (d.id === 1) { const lock = box(0.22, 0.3, 0.12, M.metal, 0, 1.2, 0, g); lock.position.z = d.thin === 'x' ? 0.15 : 0.15; d.lock = lock; }
  g.userData.door = d; d.group = g; d.leaves = leaves; d.anim = 0;
  scene.add(g);
  addInteract(g, d.exit ? 'Puerta principal' : d.secret ? 'Estantería extraña' : (d.id === 1 ? 'Puerta con candado' : 'Puerta cerrada'), () => doorInteract(d));
  doorMeshes.push(d);
});
function setDoor(d, open, instant) {
  d.open = open; d.target = open ? 1 : 0; if (instant) { d.anim = d.target; applyDoor(d); }
  if (d.lock) d.lock.visible = !open;
}
function applyDoor(d) { d.leaves.forEach(p => p.rotation.y = p.userData.side * d.anim * 1.75); }

// ---------------------------------------------------------------- PROPS + NOTAS
const NOTES = [
  { cx: 11, cz: 9, side: 'n', title: 'Diario de Elena — 13 de octubre de 1887', text: 'Hoy llegamos a la mansión Valdemar. Ignacio dice que aquí seremos felices. Lucía no quiere entrar: dice que una señora alta la mira desde la ventana del ático.\n\nIgnacio cerró la biblioteca con un candado nuevo y usó como clave <b>el año en que llegamos</b>, para que nunca lo olvidemos.' },
  { cx: 16, cz: 15, side: 's', title: 'Nota arrugada', text: 'Si oyes su respiración, NO corras hacia la oscuridad.\nApúntale con la luz. Odia la luz. Pero la luz no dura para siempre...\n\nY si la caja de música suena sola... no te des la vuelta.' },
  { cx: 6, cz: 9, side: 'n', title: 'Diario de Elena — marzo de 1888', text: 'Contratamos a una institutriz para Lucía: <b>Morana</b>. Tiene los ojos demasiado negros. Por las noches la oigo rezar en el sótano, en un idioma que no existe.\n\nEscondió algo en el cofre y dijo: <i>«El espejo no miente, solo habla al revés. Lee lo que muestra de derecha a izquierda.»</i>' },
  { cx: 1, cz: 2, side: 'w', title: 'Informe del doctor Salcedo', text: 'El mayordomo Tomás murió en la cocina. Al examinarlo encontré algo metálico DENTRO de su corazón: una llave.\n\nNo pude sacarla. Cada vez que mis pinzas rozaban la carne, juro que sus párpados se movían.\nMano firme. Nunca toques los bordes.' },
  { cx: 16, cz: 1, side: 'n', title: 'Partitura rota', text: 'La canción de cuna de Lucía. Morana se la cantaba cada noche.\n\nEmpieza en <b>Mi</b>... el resto se borró con agua. La caja de música del piano aún la recuerda.\n\n«Duerme, niña, duerme ya... que Morana vendrá.»' },
  { cx: 19, cz: 6, side: 'w', title: 'Diario de Elena — última página', text: 'Uno a uno, se los llevó.\nPrimero fue <b>Ignacio</b>, en la escalera. Luego mi pequeña <b>Lucía</b>... nunca encontramos su cuerpo. Después la abuela <b>Remedios</b>, de miedo, en su cama. Después <b>Tomás</b>, en la cocina.\n\nAhora me toca a mí. Ella cuelga nuestros retratos en el orden en que morimos.' },
  { cx: 19, cz: 9, side: 'n', title: 'Dibujo de Lucía', text: '(Un dibujo infantil: una mujer alta sin ojos sostiene una muñeca.)\n\n«La señora Morana metió la llave del sótano dentro de mi muñeca. Dice que si la toco mal, la muñeca grita.»' },
  { cx: 28, cz: 23, side: 's', title: 'Escrito en la pared del sótano', text: 'SU NOMBRE LA ATA A ESTA CASA.\nESCRÍBELO EN LA TABLA Y LAS PUERTAS SE ABRIRÁN.\n\nPERO CUANDO LA LLAMES... VENDRÁ POR TI.\nCORRE.' },
];
NOTES.forEach((n, i) => { const m = onWall(n.cx, n.cz, n.side, 0.5, 0.65, M.paper, 1.5); addInteract(m, 'Leer nota', () => readNote(i)); n.mesh = m; });
// pintadas
onWall(9, 15, 'w', 3.2, 0.8, new THREE.MeshLambertMaterial({ map: tex(TX.scrawl('NO MIRES ATRÁS')), transparent: true }), 2.3);
onWall(25, 1, 'n', 3.2, 0.8, new THREE.MeshLambertMaterial({ map: tex(TX.scrawl('ELLA TE VE')), transparent: true }), 2.6);
onWall(21, 23, 's', 3.2, 0.8, new THREE.MeshLambertMaterial({ map: tex(TX.scrawl('DI SU NOMBRE')), transparent: true }), 2.2);
onWall(7, 1, 'e', 3.2, 0.8, new THREE.MeshLambertMaterial({ map: tex(TX.scrawl('TIENE HAMBRE')), transparent: true }), 2.4);
// Vestíbulo: reloj, alfombra, mesa
box(0.8, 2.4, 0.5, M.wood, cc(9) - 1.4, 1.2, cc(9) - 1.6); box(0.5, 0.5, 0.05, M.white, cc(9) - 1.4, 1.9, cc(9) - 1.33);
{ const rug = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), lam({ color: 0x4a0a10 })); rug.rotation.x = -Math.PI / 2; rug.position.set(cc(13), 0.01, cc(12)); scene.add(rug); }
table(cc(16), cc(10)); candle(cc(16) - 0.3, 0.89, cc(10)); candle(cc(16) + 0.4, 0.89, cc(10) + 0.2);
// Biblioteca: espejo + cofre + libros en paredes
{ const mirr = onWall(1, 10, 'w', 1.3, 1.95, lam({ map: tex(TX.mirror(MIRROR_SHOWN)), emissive: 0x111418 }), 1.6); addInteract(mirr, 'Mirar el espejo', () => toast('En el espejo hay símbolos grabados... y algo se movió detrás de ti.', 4)); }
[[1, 13, 'w'], [7, 15, 'e'], [2, 15, 's'], [7, 9, 'e'], [1, 12, 'w']].forEach(([x, z, s]) => onWall(x, z, s, 3.6, 2.8, M.books, 1.45));
{ const g = new THREE.Group(); g.position.set(cc(1), 0, cc(15)); box(1.4, 0.7, 0.9, M.wood, 0, 0.35, 0, g); box(1.45, 0.12, 0.95, M.gold, 0, 0.74, 0, g); box(0.5, 0.25, 0.05, M.metal, 0, 0.45, 0.47, g); g.rotation.y = Math.PI / 4; scene.add(g); addInteract(g, 'Cofre con ruedas de símbolos', () => openPuzzle(2, 'simbolos')); }
table(cc(4), cc(12) + 1); candle(cc(4), 0.89, cc(12) + 1);
// Cocina: cadáver en la mesa
{ const g = new THREE.Group(); g.position.set(cc(4), 0, cc(4));
  box(1.3, 0.1, 2.5, M.metal, 0, 0.9, 0, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.08, 0.9, 0.08, M.metal, a * 0.55, 0.45, b * 1.1, g));
  box(0.55, 0.22, 0.9, M.skin, 0, 1.06, -0.25, g); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), M.skin); hd.position.set(0, 1.12, -0.9); g.add(hd);
  box(0.6, 0.25, 1.1, M.sheet, 0, 1.06, 0.6, g); box(0.12, 0.12, 0.7, M.skin, -0.36, 1.02, -0.2, g); box(0.12, 0.12, 0.7, M.skin, 0.36, 1.02, -0.2, g);
  box(0.25, 0.02, 0.3, lam({ color: 0x3a0a10 }), 0, 1.18, -0.3, g);
  scene.add(g); addInteract(g, 'Examinar el cadáver', () => openPuzzle(3, 'cadaver')); }
box(1.8, 0.9, 0.7, M.dark, cc(1), 0.45, cc(1) - 1.4); box(3.6, 0.9, 0.7, M.wood, cc(5), 0.45, cc(1) - 1.5); box(3.6, 0.8, 0.4, M.wood, cc(5), 2.2, cc(1) - 1.7);
[0, 1, 2].forEach(i => { const p = cyl(0.18, 0.25, M.metal, cc(3) + i * 0.7, 2.6, cc(7) + 1.4); });
// Salón de música: piano
{ const g = new THREE.Group(); g.position.set(cc(13), 0, cc(1));
  box(2.2, 1.0, 1.4, lam({ color: 0x080606 }), 0, 0.75, -0.3, g); box(2.0, 0.06, 0.25, M.white, 0, 0.98, 0.5, g); box(2.2, 0.05, 1.3, lam({ color: 0x080606 }), 0, 1.5, -0.6, g).rotation.x = -0.6;
  box(0.25, 0.18, 0.18, M.gold, 0.8, 1.35, -0.2, g); box(1.0, 0.5, 0.4, M.wood, 0, 0.25, 1.4, g);
  scene.add(g); addInteract(g, 'Tocar el piano', () => openPuzzle(4, 'piano')); }
[[10, 6], [16, 6], [10, 3]].forEach(([x, z]) => { box(0.5, 0.05, 0.5, M.wood, cc(x), 0.5, cc(z)); box(0.5, 0.6, 0.05, M.wood, cc(x), 0.8, cc(z) - 0.25); });
// Galería: retratos
{ const order = ['tomas', 'elena', 'ignacio', 'remedios', 'lucia'];
  order.forEach((id, i) => { const c = TX.makeCanvas(150, 190); TX.drawPortrait(c.getContext('2d'), 150, 190, TX.PEOPLE.find(p => p.id === id)); const m = onWall(22 + i, 1, 'n', 1.3, 1.65, lam({ map: tex(c) }), 1.7); addInteract(m, 'Reordenar retratos', () => openPuzzle(5, 'retratos')); });
  const mc = TX.makeCanvas(256, 340); const mx = mc.getContext('2d'); TX.drawFace(mx, 256, 340, 'retrato'); onWall(29, 4, 'e', 1.6, 2.1, lam({ map: tex(mc) }), 1.7);
  [[23, 5], [26, 5]].forEach(([x, z]) => box(1.8, 0.45, 0.5, M.wood, cc(x), 0.22, cc(z))); }
// Ático: muñeca en silla
{ const g = new THREE.Group(); g.position.set(cc(24), 0, cc(12));
  box(0.8, 0.08, 0.8, M.wood, 0, 0.5, 0, g); box(0.8, 1.0, 0.08, M.wood, 0, 1.0, -0.38, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.06, 0.5, 0.06, M.wood, a * 0.35, 0.25, b * 0.35, g));
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 10), M.cloth); body.position.set(0, 0.84, 0); g.add(body);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), M.porcelain); hd.position.set(0, 1.25, 0); g.add(hd);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.dark); e.position.set(s * 0.06, 1.28, 0.15); g.add(e); });
  g.rotation.y = 0; scene.add(g); addInteract(g, 'Examinar la muñeca', () => openPuzzle(6, 'muneca')); dollGroup = g; }
var dollGroup;
CRATES.forEach(([x, z]) => { box(2.4, 1.6, 2.4, M.crate, cc(x), 0.8, cc(z)); box(1.6, 1.0, 1.6, M.crate, cc(x) + 0.2, 2.1, cc(z) - 0.1); });
[[21, 14], [27, 11]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.9, 8), M.sheet); s.position.set(cc(x), 0.95, cc(z)); scene.add(s); });
// Sótano: tabla ouija + círculo ritual
{ const circ = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({ map: tex(TX.ritualCircle()), transparent: true })); circ.rotation.x = -Math.PI / 2; circ.position.set(cc(24), 0.015, cc(20)); scene.add(circ);
  const t = new THREE.Group(); t.position.set(cc(24), 0, cc(20)); scene.add(t);
  box(1.4, 0.08, 1.0, M.wood, 0, 0.75, 0, t); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.07, 0.75, 0.07, M.wood, a * 0.6, 0.37, b * 0.42, t));
  const oc = TX.makeCanvas(400, 250); TX.drawOuija(oc.getContext('2d'), 400, 250);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), lam({ map: tex(oc), emissive: 0x1a1008 })); board.rotation.x = -Math.PI / 2; board.position.set(0, 0.8, 0); t.add(board);
  addInteract(t, 'Usar la tabla ouija', () => openPuzzle(7, 'ouija'));
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; candle(cc(24) + Math.cos(a) * 3.3, 0, cc(20) + Math.sin(a) * 3.3); } }
// Pilas para la linterna
const BATTERIES = [[16, 13], [1, 9], [7, 7], [9, 7], [29, 1], [29, 15], [19, 23], [10, 14]].map(([x, z]) => {
  const m = cyl(0.07, 0.24, M.battery, cc(x) + (Math.random() - 0.5), 0.15, cc(z) + (Math.random() - 0.5)); m.rotation.z = Math.PI / 2;
  addInteract(m, 'Coger pila', () => { m.visible = false; m.userData.taken = true; state.battery = Math.min(100, state.battery + 45); sfx.pickup(); toast('Pila recogida (+45% de batería).'); });
  return m;
});

// ---------------------------------------------------------------- LINTERNA / FANTASMA
const flash = new THREE.SpotLight(0xfff0d8, 130, 28, 0.5, 0.55, 1.3);
flash.position.set(0.18, -0.15, 0.1); camera.add(flash); flash.target.position.set(0, -0.12, -1); camera.add(flash.target);
const ghostTex = tex(TX.ghostSprite());
const ghostMat = new THREE.SpriteMaterial({ map: ghostTex, transparent: true, fog: true, color: 0x9a9a9a, depthWrite: false });
const ghostSprite = new THREE.Sprite(ghostMat); ghostSprite.scale.set(1.35, 2.75, 1); ghostSprite.visible = false; scene.add(ghostSprite);
const ghostLight = new THREE.PointLight(0x6080ff, 0, 6, 2); scene.add(ghostLight);
const ghost = { x: 0, z: 0, active: false, path: [], repath: 0, mode: 'wander', modeT: 10, exposure: 0, cooldown: 0, target: null };

// ---------------------------------------------------------------- ESTADO
const sfx = new Sfx();
const puzzles = new PuzzleUI(document.getElementById('puzzle'), sfx);
const state = { playing: false, paused: true, solved: 0, battery: 100, flashOn: true, stamina: 100, sanity: 5, time: 0, room: null, visited: new Set(), notesRead: new Set(), scareT: 40, over: false, blackout: 0, apparition: 0, firstScare: false };
const player = { x: 0, z: 0, yaw: 0, pitch: 0, bob: 0, stepDist: 0 };
const keys = {};
const $ = id => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

function toast(t, sec = 3) { const m = $('msg'); m.innerHTML = t; m.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => m.classList.remove('show'), sec * 1000); }
function setObjective() { $('objective').textContent = OBJECTIVES[Math.min(state.solved, 7)]; $('progress').textContent = `Puzzles: ${Math.min(state.solved, 7)}/7`; }
function save() { try { localStorage.setItem('valdemar_cp', String(state.solved)); } catch (e) { } }
function loadCp() { try { return parseInt(localStorage.getItem('valdemar_cp') || '0') || 0; } catch (e) { return 0; } }

function startRun(fromCp) {
  sfx.init();
  state.solved = fromCp ? loadCp() : 0; if (!fromCp) save();
  DOORS.forEach(d => setDoor(d, d.id <= state.solved, true));
  const [sx, sz, yaw] = SPAWNS[Math.min(state.solved, 7)];
  player.x = cc(sx); player.z = cc(sz); player.yaw = yaw; player.pitch = 0;
  Object.assign(state, { battery: 100, stamina: 100, sanity: 5, flashOn: true, over: false, blackout: 0, scareT: 35, room: null, firstScare: state.solved > 0 });
  BATTERIES.forEach(b => { b.visible = true; b.userData.taken = false; });
  ghost.active = false; ghostSprite.visible = false;
  if (state.solved >= 1) activateGhost(state.solved >= 7);
  ['start', 'gameover', 'victory'].forEach(i => $(i).classList.remove('show'));
  $('hud').classList.add('show'); if (isTouch) $('touch').classList.add('show');
  state.playing = true; setObjective(); resume();
}
function resume() { if (!state.playing || state.over) return; state.paused = false; $('pause').classList.remove('show'); if (!isTouch && document.pointerLockElement !== canvas) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { if (!window.__noPause) pauseGame(true); }); } catch (e) { } } }
function pauseGame(showMenu) { state.paused = true; if (showMenu && state.playing && !state.over) $('pause').classList.add('show'); }

// ---------------------------------------------------------------- INTERACCIÓN
function doorInteract(d) {
  if (d.open) return;
  if (d.id === 1 && state.solved < 1) return openPuzzle(1, 'candado');
  sfx.noise({ dur: 0.3, freq: 300, vol: 0.4 });
  if (d.exit) return toast('La puerta principal está sellada por algo antiguo. Las cerraduras no sirven aquí.');
  if (d.secret) return toast('Una estantería... detrás se oye viento.');
  toast('Cerrada. ' + ['', '', 'La llave debe estar en el cofre de la biblioteca.', 'Dicen que la llave está en el corazón del mayordomo...', 'Un mecanismo... quizás el piano.', 'Algo en la galería la mantiene cerrada.', 'Necesitas la llave del sótano.', ''][d.id]);
}
function openPuzzle(n, id) {
  if (state.solved >= n) return toast('Ya resolviste esto. Aquí no queda nada... salvo ella.');
  if (state.solved < n - 1) return toast('Todavía no entiendes esto. Sigue explorando.');
  pauseGame(false); if (document.pointerLockElement) document.exitPointerLock();
  puzzles.open(id, {
    solve: () => solvePuzzle(n),
    fail: (variant, after) => puzzleFail(variant, after),
    exit: () => resume(),
  });
}
function puzzleFail(variant, after) {
  state.sanity--; updateHud();
  jumpscare(variant, () => {
    if (state.sanity <= 0) { puzzles.close(); gameOver('cordura'); }
    else { toast(`Has perdido cordura (${state.sanity}/5).`); after(); }
  });
}
const SOLVE_MSG = ['', '¡Clic! El candado cae. La biblioteca está abierta... y algo despertó en la casa.', 'Dentro del cofre: una llave de la cocina.', 'Sacaste el corazón: dentro había una llave. La puerta del salón de música se abre.', 'La última nota resuena... un mecanismo abre la puerta de la galería.', 'Los retratos sonríen. La puerta del ático se abre con un crujido.', 'Tienes la llave del sótano. Se oye a alguien llorar abajo.', 'La tabla escribe sola: «Y A  V O Y». La puerta principal se ha abierto. ¡CORRE!'];
function solvePuzzle(n) {
  if (state.solved >= n) return;
  state.solved = n; save(); sfx.chime();
  DOORS.filter(d => d.id === n).forEach(d => setDoor(d, true));
  setTimeout(() => sfx.creak(), 400);
  toast(SOLVE_MSG[n], 6); setObjective();
  if (n === 1) setTimeout(() => { activateGhost(false); sfx.bang(1); flicker(1.5); }, 3500);
  if (n === 7) { activateGhost(true); sfx.scream(); flicker(2); }
  else if (ghost.active) teleportGhost(8, 16);
  resume();
}
function readNote(i) {
  const n = NOTES[i]; state.notesRead.add(i); pauseGame(false); if (document.pointerLockElement) document.exitPointerLock();
  $('noteTitle').textContent = n.title; $('noteText').innerHTML = n.text.replace(/\n/g, '<br>');
  $('note').classList.add('show'); sfx.noise({ dur: 0.3, freq: 2500, type: 'bandpass', vol: 0.2 });
  if (i === 0 && !state.firstScare) state.pendingApparition = true;
}
function closeNote() { if (!$('note').classList.contains('show')) return; $('note').classList.remove('show'); resume(); if (state.pendingApparition) { state.pendingApparition = false; state.firstScare = true; setTimeout(apparition, 1500); } }
$('noteClose').onclick = closeNote;
function showDiary() {
  pauseGame(false); if (document.pointerLockElement) document.exitPointerLock();
  const list = [...state.notesRead].sort((a, b) => a - b);
  $('noteTitle').textContent = 'Diario (notas encontradas)';
  $('noteText').innerHTML = list.length ? list.map(i => `<h4>${NOTES[i].title}</h4><p>${NOTES[i].text.replace(/\n/g, '<br>')}</p>`).join('') : 'Aún no has encontrado notas.';
  $('note').classList.add('show');
}
function currentTarget() {
  const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), camera); rc.far = 3.6;
  const hits = rc.intersectObjects(interactables, true);
  for (const h of hits) { const u = h.object.userData.inter; if (u && h.object.visible && !u.root.userData.taken && !(u.root.userData.door && u.root.userData.door.open)) return u; }
  return null;
}
function interact() { if (state.paused || state.over) return; const t = currentTarget(); if (t) t.fn(); }

// ---------------------------------------------------------------- FANTASMA
function bfs(sx, sz, tx, tz) {
  const key = (x, z) => z * GW + x, prev = new Map([[key(sx, sz), -1]]), q = [[sx, sz]];
  while (q.length) {
    const [x, z] = q.shift();
    if (x === tx && z === tz) { const path = []; let k = key(x, z); while (k !== -1) { path.unshift([k % GW, (k / GW) | 0]); k = prev.get(k); } return path; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!blocked(nx, nz) && !prev.has(key(nx, nz))) { prev.set(key(nx, nz), key(x, z)); q.push([nx, nz]); } }
  }
  return null;
}
function reachable(sx, sz) {
  const seen = new Map([[sz * GW + sx, 0]]), q = [[sx, sz]], out = [];
  while (q.length) { const [x, z] = q.shift(); const d = seen.get(z * GW + x); out.push([x, z, d]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = nz * GW + nx; if (!blocked(nx, nz) && !seen.has(k) ) { seen.set(k, d + 1); q.push([nx, nz]); } } }
  return out;
}
function teleportGhost(minD, maxD) {
  const pc = [Math.floor(player.x / CELL), Math.floor(player.z / CELL)];
  const cells = reachable(...pc); let cand = cells.filter(c => c[2] >= minD && c[2] <= maxD);
  if (ghost.final) { // en la huida final, siempre reaparece DETRÁS del jugador (más lejos de la salida)
    const ex = new Map(reachable(13, 15).map(c => [c[1] * GW + c[0], c[2]]));
    const pd = ex.get(pc[1] * GW + pc[0]) ?? 0;
    const behind = cells.filter(c => c[2] >= 5 && (ex.get(c[1] * GW + c[0]) ?? 0) > pd + 4);
    if (behind.length) cand = behind;
  }
  if (!cand.length) { const md = Math.max(...cells.map(c => c[2])); cand = cells.filter(c => c[2] >= md - 1); }
  const c = cand[(Math.random() * cand.length) | 0];
  ghost.x = cc(c[0]); ghost.z = cc(c[1]); ghost.path = []; ghost.repath = 0;
}
function activateGhost(final) {
  ghost.active = true; ghostSprite.visible = true; ghost.final = final;
  ghost.mode = final ? 'hunt' : 'wander'; ghost.modeT = final ? 999 : 15; ghost.cooldown = 0; ghost.exposure = 0;
  if (final) { ghost.x = cc(28); ghost.z = cc(23); if (state.solved < 7) teleportGhost(8, 14); }
  else teleportGhost(7, 14);
}
function los(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.3);
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (blocked(Math.floor(x / CELL), Math.floor(z / CELL))) return false; }
  return true;
}
function updateGhost(dt) {
  if (!ghost.active) { sfx.setGhost(0); sfx.setHeart(60, 0); return 99; }
  const dx = player.x - ghost.x, dz = player.z - ghost.z, dist = Math.hypot(dx, dz);
  const sees = dist < 15 && los(ghost.x, ghost.z, player.x, player.z);
  ghost.modeT -= dt; ghost.cooldown -= dt;
  if (ghost.modeT <= 0 && !ghost.final) { ghost.mode = ghost.mode === 'hunt' ? 'wander' : 'hunt'; ghost.modeT = ghost.mode === 'hunt' ? 12 + state.solved : 20 - state.solved; if (ghost.mode === 'hunt') { sfx.whisper(); } }
  const hunting = ghost.final || ghost.mode === 'hunt' || (sees && ghost.cooldown <= 0);
  const speed = ghost.final ? 3.4 : hunting ? 1.9 + state.solved * 0.2 : 1.3;
  const gc = [Math.floor(ghost.x / CELL), Math.floor(ghost.z / CELL)], pc = [Math.floor(player.x / CELL), Math.floor(player.z / CELL)];
  let tx, tz;
  if (hunting && sees && dist < 6) { tx = player.x; tz = player.z; ghost.path = []; }
  else {
    ghost.repath -= dt;
    if (ghost.repath <= 0 || !ghost.path.length) {
      ghost.repath = 0.5;
      let tgt = hunting ? pc : ghost.target;
      if (!hunting && (!tgt || (tgt[0] === gc[0] && tgt[1] === gc[1]))) { const cells = reachable(...gc); const c = cells[(Math.random() * cells.length) | 0]; tgt = ghost.target = [c[0], c[1]]; }
      const p = bfs(gc[0], gc[1], tgt[0], tgt[1]);
      if (!p) { teleportGhost(8, 16); return dist; }
      ghost.path = p.slice(1);
    }
    if (ghost.path.length) { const [nx, nz] = ghost.path[0]; tx = cc(nx); tz = cc(nz); if (Math.hypot(tx - ghost.x, tz - ghost.z) < 0.3) ghost.path.shift(); }
    else { tx = player.x; tz = player.z; }
  }
  const mx = tx - ghost.x, mz = tz - ghost.z, ml = Math.hypot(mx, mz);
  if (ml > 0.01) { const s = Math.min(ml, speed * dt); ghost.x += mx / ml * s; ghost.z += mz / ml * s; }
  // luz de la linterna la repele
  const lit = state.flashOn && state.battery > 0 && state.blackout <= 0;
  if (lit && dist < 11 && sees) {
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const ang = Math.acos(Math.max(-1, Math.min(1, (fwd.x * -dx + fwd.z * -dz) / (Math.hypot(fwd.x, fwd.z) * dist + 1e-6))));
    if (ang < 0.25) ghost.exposure += dt; else ghost.exposure = Math.max(0, ghost.exposure - dt);
  } else ghost.exposure = Math.max(0, ghost.exposure - dt);
  if (ghost.exposure > (ghost.final ? 1.6 : 1.2)) {
    ghost.exposure = 0; sfx.scream(); flicker(0.6); state.battery = Math.max(0, state.battery - 12);
    teleportGhost(ghost.final ? 6 : 9, 18); ghost.mode = 'wander'; ghost.modeT = ghost.final ? 999 : 14; ghost.cooldown = 8;
    toast(ghost.final ? '¡La luz la frenó! ¡Sigue corriendo!' : 'Chilló y se desvaneció con la luz... por ahora.');
  }
  if (dist < 1.05 && !state.over) { gameOver('fantasma'); }
  // visual
  ghostSprite.position.set(ghost.x, 1.42 + Math.sin(state.time * 2) * 0.05, ghost.z);
  ghostMat.opacity = 0.75 + Math.random() * 0.25 - (ghost.exposure * 0.3);
  const litG = lit && dist < 12 ? 1.0 : 0.5; ghostMat.color.setScalar(litG);
  ghostSprite.position.x += (Math.random() - 0.5) * 0.04;
  ghostLight.position.set(ghost.x, 1.8, ghost.z); ghostLight.intensity = 1.5;
  return dist;
}

// ---------------------------------------------------------------- SUSTOS
let scareCb = null;
function jumpscare(variant, cb) {
  const c = $('scare'), x = c.getContext('2d'); c.width = 900; c.height = 1000;
  TX.drawFace(x, 900, 1000, variant || 'morana');
  c.classList.add('show'); sfx.scream(); state.scaring = 1.3; state.scareStart = performance.now(); scareCb = cb;
  if (navigator.vibrate) try { navigator.vibrate([200, 50, 300]); } catch (e) { }
}
function updateScare(dt) {
  if (!state.scaring) return;
  state.scaring = 1.3 - (performance.now() - state.scareStart) / 1000; const c = $('scare'), k = Math.min(1.3, 1.3 - state.scaring);
  const s = 1 + k * 0.45, sh = 30 * (1 - k / 1.3);
  c.style.transform = `translate(${(Math.random() - 0.5) * sh}px,${(Math.random() - 0.5) * sh}px) scale(${s})`;
  c.style.filter = Math.random() < 0.15 ? 'invert(1) contrast(2)' : `contrast(${1.3 + Math.random() * 0.4}) brightness(${0.9 + Math.random() * 0.5})`;
  if (state.scaring <= 0) { state.scaring = 0; c.classList.remove('show'); c.style.transform = ''; const f = scareCb; scareCb = null; f && f(); }
}
function flicker(sec) { state.blackout = Math.max(state.blackout, sec); }
function apparition() {
  // la figura aparece un instante al fondo de donde miras
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  for (let d = 9; d >= 4; d -= 1) {
    const x = player.x + fx * d, z = player.z + fz * d;
    if (!blocked(Math.floor(x / CELL), Math.floor(z / CELL)) && los(player.x, player.z, x, z)) {
      state.apparition = 0.9; state.appPos = [x, z]; sfx.sting(); setTimeout(() => sfx.bang(0.6), 700); return;
    }
  }
  sfx.whisper();
}
function randomScare() {
  const r = Math.random();
  if (r < 0.25) { sfx.bang(0.8, Math.random() * 2 - 1); state.shake = 0.5; toast('¿Qué fue eso?', 2); }
  else if (r < 0.45) sfx.whisper();
  else if (r < 0.6) { [2, 1, 0, 1].forEach((n, i) => sfx.note([261.63, 293.66, 329.63][n], { type: 'box', delay: i * 0.55, vol: 0.08 })); toast('Una caja de música suena a lo lejos...', 3); }
  else if (r < 0.8) { flicker(1.6); sfx.osc({ type: 'sawtooth', f0: 50, f1: 30, dur: 1.5, vol: 0.2 }); }
  else if (!ghost.active || Math.hypot(ghost.x - player.x, ghost.z - player.z) > 14) apparition();
  else sfx.creak();
}

// ---------------------------------------------------------------- FIN
function gameOver(reason) {
  if (state.over) return; state.over = true; state.paused = true;
  if (document.pointerLockElement) document.exitPointerLock();
  jumpscare(reason === 'fantasma' ? 'morana' : 'morana', () => {
    $('goText').textContent = reason === 'fantasma' ? 'Morana te atrapó. Ahora tu retrato cuelga en la galería.' : 'Perdiste la cordura. Ahora eres parte de la mansión.';
    $('gameover').classList.add('show'); $('hud').classList.remove('show'); $('touch').classList.remove('show');
    $('btnCp').textContent = `Reintentar desde el último punto (${loadCp()}/7 puzzles)`;
  });
}
function victory() {
  state.over = true; state.paused = true; if (document.pointerLockElement) document.exitPointerLock();
  const m = Math.floor(state.time / 60), s = Math.floor(state.time % 60);
  $('vicText').innerHTML = `Saliste a la noche fría. Detrás de ti, la puerta se cierra sola.<br>Tiempo: ${m} min ${s} s · Cordura restante: ${state.sanity}/5 · Notas: ${state.notesRead.size}/${NOTES.length}<br><br><i>Arriba, en la ventana del ático, una figura alta te dice adiós.</i>`;
  $('victory').classList.add('show'); $('hud').classList.remove('show'); $('touch').classList.remove('show');
  sfx.chime(); save(); try { localStorage.setItem('valdemar_cp', '0'); } catch (e) { }
}

// ---------------------------------------------------------------- BUCLE
function collide(x, z) { const r = 0.32; for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (blocked(Math.floor((x + a) / CELL), Math.floor((z + b) / CELL))) return true; return false; }
const touchMove = { x: 0, y: 0 }; let touchRun = false;
function updatePlayer(dt) {
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  mx += touchMove.x; mz += touchMove.y;
  const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
  const moving = len > 0.1;
  const wantRun = (keys.ShiftLeft || keys.ShiftRight || touchRun) && moving;
  const run = wantRun && state.stamina > 1;
  state.stamina = Math.max(0, Math.min(100, state.stamina + (run ? -28 : 14) * dt));
  const sp = (run ? 5.2 : 2.7) * dt;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const dx = (fx * mz + rx * mx) * sp, dz = (fz * mz + rz * mx) * sp;
  if (!collide(player.x + dx, player.z)) player.x += dx;
  if (!collide(player.x, player.z + dz)) player.z += dz;
  if (moving) { player.bob += dt * (run ? 13 : 8); player.stepDist += Math.hypot(dx, dz); if (player.stepDist > (run ? 2.4 : 1.9)) { player.stepDist = 0; sfx.step(run); } }
  const shake = state.shake > 0 ? (state.shake -= dt, state.shake * 0.08) : 0;
  camera.position.set(player.x + (Math.random() - 0.5) * shake, 1.6 + Math.sin(player.bob) * 0.045 + (Math.random() - 0.5) * shake, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  // habitación
  const room = roomOf(Math.floor(player.x / CELL), Math.floor(player.z / CELL));
  if (room && room !== state.room) {
    state.room = room; $('room').textContent = ROOMS[room].name;
    if (!state.visited.has(room)) { state.visited.add(room); toast(ROOMS[room].name, 2.5); if (state.visited.size > 1) { sfx.bang(0.5, 0.6); flicker(0.4); } }
  }
  // victoria
  const ex = DOORS.find(d => d.exit);
  if (ex.open && player.z > ex.z * CELL + 0.6 && Math.abs(player.x - cc(ex.x)) < 2.2) victory();
}
function updateHud() {
  $('batt').style.width = state.battery + '%';
  $('batt').style.background = state.battery < 20 ? '#c33' : '#8c6';
  $('stam').style.width = state.stamina + '%';
  $('sanity').textContent = '👁'.repeat(Math.max(0, state.sanity)) + '·'.repeat(5 - Math.max(0, state.sanity));
}
let last = performance.now(), hudT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  updateScare(dt);
  doorMeshes.forEach(d => { if (d.anim !== d.target && d.target != null) { d.anim += Math.sign(d.target - d.anim) * Math.min(Math.abs(d.target - d.anim), dt * 0.8); applyDoor(d); } });
  flames.forEach(f => f.scale.y = 0.8 + Math.random() * 0.5);
  BATTERIES.forEach(b => b.rotation.y += dt);
  if (state.playing && !state.paused && !state.over) {
    state.time += dt;
    updatePlayer(dt);
    const gd = updateGhost(dt);
    // batería
    if (state.flashOn && state.battery > 0) state.battery = Math.max(0, state.battery - dt * (ghost.final ? 0.6 : 1.0));
    // sustos aleatorios
    state.scareT -= dt; if (state.scareT <= 0) { state.scareT = 30 + Math.random() * 35; randomScare(); }
    // miedo según cercanía
    const fear = ghost.active ? Math.max(0, 1 - gd / 14) : 0;
    sfx.setHeart(62 + fear * 100, ghost.active ? 0.05 + fear * 0.65 : 0);
    sfx.setGhost(fear);
    $('vignette').style.opacity = 0.45 + fear * 0.55;
    // luces
    state.blackout -= dt;
    const flickerNow = state.blackout > 0 ? Math.random() < 0.85 : Math.random() < fear * 0.25;
    roomLights.forEach(L => L.intensity = flickerNow ? (Math.random() < 0.5 ? 0 : L.userData.base * 0.2) : L.userData.base * (0.85 + Math.random() * 0.15));
    let fi = state.flashOn && state.battery > 0 ? 130 : 0;
    if (state.battery < 15 && Math.random() < 0.15) fi *= 0.2;
    if (flickerNow && Math.random() < 0.6) fi *= 0.05;
    flash.intensity = fi * Math.min(1, 0.4 + state.battery / 40);
    // aparición
    if (state.apparition > 0) { state.apparition -= dt; ghostSprite.visible = state.apparition > 0 || ghost.active; if (state.apparition > 0) { ghostSprite.position.set(state.appPos[0], 1.42, state.appPos[1]); ghostMat.opacity = 1; } }
    else ghostSprite.visible = ghost.active;
    // indicación
    const t = currentTarget(); $('prompt').innerHTML = t ? `<b>${isTouch ? 'USAR' : 'E'}</b> · ${t.label}` : '';
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
    // muñeca mira al jugador
    if (dollGroup) dollGroup.rotation.y = Math.atan2(player.x - dollGroup.position.x, player.z - dollGroup.position.z) * (state.solved >= 5 ? 1 : 0);
  }
  $('grain').style.backgroundPosition = `${(Math.random() * 200) | 0}px ${(Math.random() * 200) | 0}px`;
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- ENTRADA
addEventListener('keydown', e => {
  keys[e.code] = true;
  if ($('note').classList.contains('show')) { if (['KeyE', 'Escape', 'Space', 'Enter', 'Tab', 'KeyN'].includes(e.code)) { e.preventDefault(); closeNote(); } return; }
  if (puzzles.isOpen) { if (e.code === 'Escape') puzzles.exit(); return; }
  if (!state.playing || state.over) return;
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyF') { state.flashOn = !state.flashOn; sfx.click(); }
  if (e.code === 'Tab' || e.code === 'KeyN') { e.preventDefault(); showDiary(); }
  if (e.code === 'KeyP') pauseGame(true);
});
addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('mousedown', e => {
  if (!state.playing || state.over || puzzles.isOpen) return;
  if (document.pointerLockElement !== canvas && !isTouch) { resume(); return; }
  if (e.button === 0) interact();
  if (e.button === 2) { state.flashOn = !state.flashOn; sfx.click(); }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas || state.paused) return;
  player.yaw -= e.movementX * 0.0022; player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - e.movementY * 0.0022));
});
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== canvas && state.playing && !state.over && !puzzles.isOpen && !$('note').classList.contains('show') && !state.scaring) pauseGame(true); });
$('pause').onclick = () => resume();
$('btnStart').onclick = () => startRun(false);
$('btnContinue').onclick = () => startRun(true);
$('btnCp').onclick = () => startRun(true);
$('btnRestart').onclick = () => startRun(false);
$('btnAgain').onclick = () => startRun(false);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
if (loadCp() > 0) { $('btnContinue').style.display = ''; $('btnContinue').textContent = `Continuar (${loadCp()}/7 puzzles)`; }
// táctil
if (isTouch) {
  const stick = $('stick'), knob = $('knob'); let sid = null, lid = null, lx = 0, ly = 0, cx0 = 0, cy0 = 0;
  stick.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sid = t.identifier; const r = stick.getBoundingClientRect(); cx0 = r.left + r.width / 2; cy0 = r.top + r.height / 2; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (lid === null) { lid = t.identifier; lx = t.clientX; ly = t.clientY; } e.preventDefault(); }, { passive: false });
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === sid) { let dx = (t.clientX - cx0) / 50, dy = (t.clientY - cy0) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } touchMove.x = dx; touchMove.y = -dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; }
      if (t.identifier === lid && !state.paused) { player.yaw -= (t.clientX - lx) * 0.006; player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - (t.clientY - ly) * 0.006)); lx = t.clientX; ly = t.clientY; }
    }
  }, { passive: false });
  addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === sid) { sid = null; touchMove.x = touchMove.y = 0; knob.style.transform = ''; } if (t.identifier === lid) lid = null; } });
  $('tUse').onclick = () => interact();
  $('tLight').onclick = () => { state.flashOn = !state.flashOn; sfx.click(); };
  $('tRun').onclick = () => { touchRun = !touchRun; $('tRun').classList.toggle('on', touchRun); };
  $('tDiary').onclick = () => showDiary();
}
{ // grano de película
  const g = TX.makeCanvas(160, 160), x = g.getContext('2d'), im = x.createImageData(160, 160);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 40; }
  x.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${g.toDataURL()})`;
}
// vista de fondo en el menú
player.x = cc(13); player.z = cc(14); camera.position.set(player.x, 1.6, player.z);
requestAnimationFrame(loop);

// gancho para pruebas automáticas
window.__game = { state, ghost, player, puzzles, DOORS, solvePuzzle, startRun, cc, gameOver, interact, currentTarget, openPuzzle, teleport: (x, z, yaw = 0) => { player.x = cc(x); player.z = cc(z); player.yaw = yaw; }, jumpscare, readNote, closeNote };
