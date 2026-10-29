/* =========================================================
   Sala de cómputo · pixel art isométrico dibujado en <canvas>
   ---------------------------------------------------------
   1. Constantes y paleta          6. Muebles y objetos fijos
   2. Primitivas de dibujo         7. Pantallas animadas
   3. Fuente de píxeles 3x5        8. Personaje
   4. Proyección isométrica        9. Interacción (contorno, indicadores)
   5. Paredes y piso              10. Bucle y API pública (window.Sala)
   El lienzo es de 320x240 píxeles "lógicos"; el CSS lo amplía sin suavizar.
   ========================================================= */
(function(){
"use strict";

/* ---------- 1. Constantes y paleta ---------- */
const W = 320, H = 240, OX = 160, OY = 80, WALL = 64;
const C = {
  ink:"#14233B", marino:"#203655", marinoL:"#2F4C79", marinoLL:"#4A6C9E", marinoD:"#17283F",
  escarcha:"#A7D6D8", escarchaD:"#6FB0B4", escarchaL:"#D3EBEC",
  miel:"#FDFAE9", mielD:"#F4EBBF", mielDD:"#DCCB8D", mielDDD:"#C5B274",
  algodon:"#E99A99", algodonD:"#C46F70", algodonL:"#F5CFCD",
  ponche:"#E23C48", poncheD:"#A82430", poncheL:"#F07A82",
  oro:"#F6D26B", piel:"#F2C9A4", pielD:"#D9A982", hoja:"#5FA7A3", hojaD:"#3E8B88",
  pisoA:"#CDE8E9", pisoB:"#B7DADC", ladoA:"#7FB4B8", ladoB:"#5E9599"
};
const MAT = {                       // t = cara superior · l = cara +gy · r = cara +gx · o = contorno · h = brillo
  mesa:    {t:C.mielD,    l:C.mielDD,  r:C.mielDDD, o:C.ink, h:"#FFFBEA"},
  carcasa: {t:C.marinoL,  l:C.marino,  r:C.marinoD, o:C.ink},
  silla:   {t:C.poncheL,  l:C.ponche,  r:C.poncheD, o:C.ink},
  arcade:  {t:C.poncheL,  l:C.ponche,  r:C.poncheD, o:C.ink, h:"#F9A3A8"},
  rack:    {t:C.marinoLL, l:C.marinoD, r:C.marinoD, o:C.ink},
  panel:   {t:C.escarchaL,l:C.escarcha,r:C.escarchaD,o:C.ink},
  maceta:  {t:C.poncheL,  l:C.ponche,  r:C.poncheD, o:C.ink},
  papel:   {t:"#FFFFFF",  l:C.mielD,   r:C.mielDD,  o:C.ink},
  teclado: {t:C.escarchaL,l:C.escarcha,r:C.escarchaD,o:C.ink},
  blanco:  {t:"#fff", l:"#fff", r:"#fff"}
};

/* ---------- 2. Primitivas de dibujo (sin suavizado) ---------- */
let g = null;                                   // contexto activo
const R = Math.round;
const flat = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
function en(cv, fn){ const prev = g; g = cv.getContext("2d"); fn(); g = prev; }

function rect(x, y, w, h, c){ g.fillStyle = c; g.fillRect(x, y, w, h); }
function pix(x, y, c){ g.fillStyle = c; g.fillRect(x, y, 1, 1); }
function line(a, b, c){                          // Bresenham
  let x0 = a[0], y0 = a[1]; const x1 = b[0], y1 = b[1];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy; g.fillStyle = c;
  for(;;){
    g.fillRect(x0, y0, 1, 1);
    if(x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if(e2 >= dy){ err += dy; x0 += sx; }
    if(e2 <= dx){ err += dx; y0 += sy; }
  }
}
function poly(p, c, alpha){                      // relleno por líneas de barrido
  let y0 = Infinity, y1 = -Infinity;
  for(const q of p){ if(q[1] < y0) y0 = q[1]; if(q[1] > y1) y1 = q[1]; }
  g.fillStyle = c; if(alpha != null) g.globalAlpha = alpha;
  const n = p.length;
  for(let y = y0; y < y1; y++){
    const yc = y + .5, xs = [];
    for(let i = 0; i < n; i++){
      const A = p[i], B = p[(i + 1) % n];
      if((A[1] <= yc && B[1] > yc) || (B[1] <= yc && A[1] > yc)) xs.push(A[0] + (yc - A[1]) * (B[0] - A[0]) / (B[1] - A[1]));
    }
    xs.sort((m, k) => m - k);
    for(let i = 0; i + 1 < xs.length; i += 2){
      const xa = R(xs[i]), xb = R(xs[i + 1]);
      if(xb > xa) g.fillRect(xa, y, xb - xa, 1);
    }
  }
  if(alpha != null) g.globalAlpha = 1;
}
function polyLine(p, c){ for(let i = 0; i < p.length; i++) line(p[i], p[(i + 1) % p.length], c); }
function disco(cx, cy, r, c){                    // círculo relleno
  g.fillStyle = c;
  for(let y = -r; y <= r; y++) for(let x = -r; x <= r; x++) if(x * x + y * y <= r * r + r * .6) g.fillRect(cx + x, cy + y, 1, 1);
}

/* ---------- 3. Fuente de píxeles 3x5 ---------- */
const F = {
  A:["010","101","111","101","101"], B:["110","101","110","101","110"], C:["011","100","100","100","011"],
  D:["110","101","101","101","110"], E:["111","100","110","100","111"], F:["111","100","110","100","100"],
  G:["011","100","101","101","011"], H:["101","101","111","101","101"], I:["111","010","010","010","111"],
  J:["001","001","001","101","010"], K:["101","101","110","101","101"], L:["100","100","100","100","111"],
  M:["101","111","111","101","101"], N:["110","101","101","101","101"], O:["010","101","101","101","010"],
  P:["110","101","110","100","100"], Q:["010","101","101","111","011"], R:["110","101","110","101","101"],
  S:["011","100","010","001","110"], T:["111","010","010","010","010"], U:["101","101","101","101","111"],
  V:["101","101","101","101","010"], W:["101","101","111","111","101"], X:["101","101","010","101","101"],
  Y:["101","101","010","010","010"], Z:["111","001","010","100","111"],
  "0":["111","101","101","101","111"], "1":["010","110","010","010","111"], "2":["110","001","010","100","111"],
  "3":["110","001","010","001","110"], "4":["101","101","111","001","001"], "5":["111","100","110","001","110"],
  "6":["011","100","111","101","111"], "7":["111","001","010","010","010"], "8":["111","101","111","101","111"],
  "9":["111","101","111","001","110"], "?":["110","001","010","000","010"], "!":["010","010","010","000","010"],
  " ":["000","000","000","000","000"]
};
function txt(s, x, y, c){
  g.fillStyle = c;
  for(const ch of s){
    const gl = F[ch] || F[" "];
    for(let r = 0; r < 5; r++) for(let k = 0; k < 3; k++) if(gl[r][k] === "1") g.fillRect(x + k, y + r, 1, 1);
    x += 4;
  }
}
const txtW = s => s.length * 4 - 1;

/* ---------- 4. Proyección isométrica (2:1) ---------- */
// gx crece hacia abajo-derecha, gy hacia abajo-izquierda, z hacia arriba. 1 casilla = 32x16 px.
const iso = (gx, gy, z = 0) => [R(OX + (gx - gy) * 16), R(OY + (gx + gy) * 8 - z)];

function box(gx, gy, gz, w, d, h, m){
  const T = [iso(gx, gy, gz + h), iso(gx + w, gy, gz + h), iso(gx + w, gy + d, gz + h), iso(gx, gy + d, gz + h)];
  const B1 = iso(gx + w, gy, gz), B2 = iso(gx + w, gy + d, gz), B3 = iso(gx, gy + d, gz);
  poly([T[1], T[2], B2, B1], m.r);                // cara +gx (derecha en pantalla)
  poly([T[3], T[2], B2, B3], m.l);                // cara +gy (izquierda en pantalla)
  poly(T, m.t);
  if(m.o){ polyLine(T, m.o); line(T[3], B3, m.o); line(T[2], B2, m.o); line(T[1], B1, m.o); line(B3, B2, m.o); line(B2, B1, m.o); }
  if(m.h){ line(T[3], T[2], m.h); line(T[2], T[1], m.h); }
}
const wL = (u0, u1, z0, z1, c) => poly([iso(0, u0, z0), iso(0, u1, z0), iso(0, u1, z1), iso(0, u0, z1)], c);   // pared izquierda (gx=0)
const wR = (u0, u1, z0, z1, c) => poly([iso(u0, 0, z0), iso(u1, 0, z0), iso(u1, 0, z1), iso(u0, 0, z1)], c);   // pared derecha (gy=0)

// Pega una imagen plana sobre una cara inclinada (cizalla de media casilla por columna)
function cizalla(src, x0, y0, dir){
  const w = src.width, h = src.height;
  for(let c = 0; c < w; c++) g.drawImage(src, c, 0, 1, h, x0 + c, y0 + dir * ((c + 1) >> 1), 1, h);
}
function caraX(src, gx, gyIzq, zTop){ const p = iso(gx, gyIzq, zTop); cizalla(src, p[0], p[1], -1); }  // cara que mira a +gx
function caraY(src, gxIzq, gy, zTop){ const p = iso(gxIzq, gy, zTop); cizalla(src, p[0], p[1], +1); }  // cara que mira a +gy

function sombra(gx, gy, w, d){
  poly([iso(gx, gy), iso(gx + w, gy), iso(gx + w, gy + d), iso(gx, gy + d)], "#2E5B60", .28);
}

/* ---------- 5. Paredes y piso ---------- */
function dibujarPiso(){
  for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++)
    poly([iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)], (i + j) % 2 ? C.pisoB : C.pisoA);
  poly([iso(0, 8), iso(8, 8), iso(8, 8, -6), iso(0, 8, -6)], C.ladoA);       // grosor del piso
  poly([iso(8, 0), iso(8, 8), iso(8, 8, -6), iso(8, 0, -6)], C.ladoB);
  line(iso(0, 8), iso(8, 8), C.ink); line(iso(8, 8), iso(8, 0), C.ink);
  line(iso(0, 8, -6), iso(8, 8, -6), C.ink); line(iso(8, 8, -6), iso(8, 0, -6), C.ink);
  line(iso(0, 8), iso(0, 8, -6), C.ink); line(iso(8, 8), iso(8, 8, -6), C.ink); line(iso(8, 0), iso(8, 0, -6), C.ink);
}
function dibujarParedes(){
  wL(0, 8, 0, WALL, C.marinoL); wR(0, 8, 0, WALL, C.marino);
  for(let k = 0; k < 8; k++){ wL(k + .5, k + .75, 16, WALL, "#35568A"); wR(k + .5, k + .75, 16, WALL, "#2A4672"); }
  wL(0, 8, 0, 14, C.algodon); wR(0, 8, 0, 14, C.algodonD);                   // zócalo
  wL(0, 8, 14, 16, C.miel);   wR(0, 8, 14, 16, C.mielD);                     // moldura
  wL(0, 8, 0, 3, C.algodonD); wR(0, 8, 0, 3, "#A95B5C");                     // rodapié
  // grosor superior de las paredes
  poly([iso(0, 0, WALL), iso(0, 8, WALL), iso(-.25, 8, WALL), iso(-.25, 0, WALL)], C.marinoLL);
  poly([iso(0, 0, WALL), iso(8, 0, WALL), iso(8, -.25, WALL), iso(0, -.25, WALL)], C.marinoLL);
  poly([iso(-.25, 8, WALL), iso(0, 8, WALL), iso(0, 8, 0), iso(-.25, 8, 0)], C.marinoD);
  poly([iso(8, -.25, WALL), iso(8, 0, WALL), iso(8, 0, 0), iso(8, -.25, 0)], C.marinoD);
  line(iso(0, 0, WALL), iso(0, 8, WALL), C.ink); line(iso(0, 0, WALL), iso(8, 0, WALL), C.ink);
  line(iso(-.25, 0, WALL), iso(-.25, 8, WALL), C.ink); line(iso(0, -.25, WALL), iso(8, -.25, WALL), C.ink);
  line(iso(-.25, 0, WALL), iso(0, 0, WALL), C.ink); line(iso(0, -.25, WALL), iso(0, 0, WALL), C.ink);
  line(iso(-.25, 8, WALL), iso(-.25, 8, 0), C.ink); line(iso(0, 8, WALL), iso(0, 8, 0), C.ink);
  line(iso(8, -.25, WALL), iso(8, -.25, 0), C.ink); line(iso(8, 0, WALL), iso(8, 0, 0), C.ink);
  line(iso(-.25, 8, 0), iso(0, 8, 0), C.ink); line(iso(8, -.25, 0), iso(8, 0, 0), C.ink);
  line(iso(0, 0, 0), iso(0, 0, WALL), C.ink);                                // esquina del fondo
  line(iso(0, 0, 14), iso(0, 8, 14), C.mielDD); line(iso(0, 0, 14), iso(8, 0, 14), C.mielDDD);
}
function dibujarAlfombra(){
  const q = (c, h, col) => poly([iso(c - h, c - h), iso(c + h, c - h), iso(c + h, c + h), iso(c - h, c + h)], col);
  q(4.5, 2.2, C.ink); q(4.5, 2.1, C.ponche); q(4.5, 1.8, C.algodonL); q(4.5, 1.6, C.escarcha); q(4.5, 1.2, C.escarchaL); q(4.5, .8, C.marinoLL); q(4.5, .7, C.marino);
  // franja de rombos en el borde
  for(let k = 0; k < 5; k++){
    const a = 2.6 + k * .8; q2(a, 2.45, .12, C.mielD); q2(2.45, a, .12, C.mielD); q2(a, 6.55, .12, C.mielD); q2(6.55, a, .12, C.mielD);
  }
  function q2(cx, cy, h, col){ poly([iso(cx - h, cy - h), iso(cx + h, cy - h), iso(cx + h, cy + h), iso(cx - h, cy + h)], col); }
  const c = iso(4.5, 4.5); txt("?", c[0] - 1, c[1] - 3, C.miel);
}

/* ---------- 6. Muebles y objetos fijos ---------- */
function planta(gx, gy){
  sombra(gx - .05, gy - .05, .6, .6);
  box(gx, gy, 0, .5, .5, 7, MAT.maceta);
  const c = iso(gx + .25, gy + .25, 7);
  // hojas
  const hojas = [[-1,-5,3,6],[-5,-7,4,3],[3,-8,4,3],[-1,-10,3,6],[-6,-3,4,3],[4,-4,4,3],[0,-14,2,5]];
  for(const h of hojas){ rect(c[0] + h[0], c[1] + h[1], h[2], h[3], C.hoja); rect(c[0] + h[0], c[1] + h[1] + h[3] - 1, h[2], 1, C.hojaD); }
  pix(c[0] + 1, c[1] - 9, C.ink);
}
function silla(gx, gy, mira){                    // mira: "gx-" (hacia la pared izquierda) o "gy-" (hacia la derecha)
  sombra(gx, gy, .8, .8);
  box(gx + .1, gy + .1, 0, .08, .08, 8, MAT.carcasa); box(gx + .62, gy + .1, 0, .08, .08, 8, MAT.carcasa);
  box(gx + .1, gy + .62, 0, .08, .08, 8, MAT.carcasa); box(gx + .62, gy + .62, 0, .08, .08, 8, MAT.carcasa);
  box(gx, gy, 8, .75, .75, 3, MAT.silla);
  if(mira === "gx-") box(gx + .65, gy, 11, .1, .75, 12, MAT.silla);
  else               box(gx, gy + .65, 11, .75, .1, 12, MAT.silla);
}
function escritorioIzq(gy0, gy1){                // pegado a la pared izquierda
  sombra(0, gy0, 1.4, gy1 - gy0 + .15);
  box(0, gy0, 0, 1.1, gy1 - gy0, 14, MAT.mesa);
  for(const a of [gy1 - 1.05, gy0 + .15]){       // cajones
    poly([iso(1.1, a + .9, 11), iso(1.1, a, 11), iso(1.1, a, 3), iso(1.1, a + .9, 3)], C.mielDD);
    polyLine([iso(1.1, a + .9, 11), iso(1.1, a, 11), iso(1.1, a, 3), iso(1.1, a + .9, 3)], C.ink);
    const m = iso(1.1, a + .45, 7); rect(m[0] - 1, m[1], 3, 1, C.ink);
  }
}
function escritorioDer(gx0, gx1){                // pegado a la pared derecha
  sombra(gx0, 0, gx1 - gx0 + .15, 1.4);
  box(gx0, 0, 0, gx1 - gx0, 1.1, 14, MAT.mesa);
  for(const a of [gx0 + .15, gx1 - 1.05]){
    poly([iso(a, 1.1, 11), iso(a + .9, 1.1, 11), iso(a + .9, 1.1, 3), iso(a, 1.1, 3)], C.mielDD);
    polyLine([iso(a, 1.1, 11), iso(a + .9, 1.1, 11), iso(a + .9, 1.1, 3), iso(a, 1.1, 3)], C.ink);
    const m = iso(a + .45, 1.1, 7); rect(m[0] - 1, m[1], 3, 1, C.ink);
  }
}

// Geometría de las máquinas (se reutiliza para dibujar, animar y calcular la zona clicable)
const G = {
  deskL1:  {gy0:.4,  gy1:2.9},
  deskR1:  {gx0:.4,  gx1:3.2},
  deskL2:  {gy0:5.0, gy1:7.4},
  mon1:    {gx:.30,  gxF:.45, gy0:1.0,  gy1:2.25, z0:18, z1:33},   // mira a +gx
  mon2:    {gx0:1.2, gx1:2.45, gy:.30, gyF:.45, z0:18, z1:33},     // mira a +gy
  mon4:    {gx:.30,  gxF:.45, gy0:5.6,  gy1:6.85, z0:18, z1:33},
  arcade:  {gx0:5.0, gx1:6.0, gy0:0, gy1:.9, h:46},
  rack:    {gx0:0, gx1:.9, gy0:3.4, gy1:4.4, h:40},
  mesaC:   {gx0:5.9, gx1:7.5, gy0:4.7, gy1:6.1},
  lap:     {gx:6.3, gy0:5.0, gy1:5.875, z0:13, z1:23},
  pj:      {gx:4.5, gy:4.2}
};
function monitorX(m){                            // monitor que mira a +gx
  box(m.gx - .1, (m.gy0 + m.gy1) / 2 - .2, 14, .3, .4, 4, MAT.carcasa);
  box(m.gx, m.gy0, m.z0, m.gxF - m.gx, m.gy1 - m.gy0, m.z1 - m.z0, MAT.carcasa);
}
function monitorY(m){                            // monitor que mira a +gy
  box((m.gx0 + m.gx1) / 2 - .2, m.gy - .1, 14, .4, .3, 4, MAT.carcasa);
  box(m.gx0, m.gy, m.z0, m.gx1 - m.gx0, m.gyF - m.gy, m.z1 - m.z0, MAT.carcasa);
}
function silueta(kind){                          // dibuja la máquina en blanco (para la zona clicable)
  const B = MAT.blanco;
  if(kind === "pc1"){ box(0, G.deskL1.gy0, 0, 1.1, G.deskL1.gy1 - G.deskL1.gy0, 14, B); box(G.mon1.gx, G.mon1.gy0, G.mon1.z0, G.mon1.gxF - G.mon1.gx, G.mon1.gy1 - G.mon1.gy0, 15, B); box(.2, 1.4, 14, .35, .45, 4, B); }
  if(kind === "pc2"){ box(G.deskR1.gx0, 0, 0, G.deskR1.gx1 - G.deskR1.gx0, 1.1, 14, B); box(G.mon2.gx0, G.mon2.gy, G.mon2.z0, G.mon2.gx1 - G.mon2.gx0, G.mon2.gyF - G.mon2.gy, 15, B); box(1.5, .2, 14, .4, .35, 4, B); }
  if(kind === "arcade"){ const a = G.arcade; box(a.gx0, a.gy0, 0, a.gx1 - a.gx0, a.gy1 - a.gy0, a.h, B); box(a.gx0, a.gy1, 19, a.gx1 - a.gx0, .3, 3, B); }
}

function capaA_muebles(){
  // —— escritorio izquierdo 1 con computador C1 (juego 1)
  escritorioIzq(G.deskL1.gy0, G.deskL1.gy1);
  box(.55, 1.1, 14, .3, 1.05, 1.5, MAT.teclado);                      // teclado
  box(.7, 2.45, 14, .22, .22, 3, MAT.panel);                          // taza
  monitorX(G.mon1);
  // —— escritorio derecho 1 con computador C2 (juego 2)
  escritorioDer(G.deskR1.gx0, G.deskR1.gx1);
  box(1.3, .55, 14, 1.05, .3, 1.5, MAT.teclado);
  box(2.75, .35, 14, .3, .3, 4, MAT.papel); box(.6, .3, 14, .45, .35, 2, MAT.papel);
  monitorY(G.mon2);
  // —— arcade (juego 3): cuerpo
  const a = G.arcade;
  sombra(a.gx0 - .05, a.gy0, 1.2, 1.45);
  box(a.gx0, a.gy0, 0, a.gx1 - a.gx0, a.gy1 - a.gy0, a.h, MAT.arcade);
  poly([iso(a.gx1, 0, 25), iso(a.gx1, a.gy1, 25), iso(a.gx1, a.gy1, 21), iso(a.gx1, 0, 21)], C.escarcha);
  poly([iso(a.gx1, 0, 10), iso(a.gx1, a.gy1, 10), iso(a.gx1, a.gy1, 8), iso(a.gx1, 0, 8)], C.mielD);
  // —— rack de servidores (pared izquierda)
  const k = G.rack;
  sombra(k.gx0, k.gy0 - .05, 1.1, 1.2);
  box(k.gx0, k.gy0, 0, k.gx1 - k.gx0, k.gy1 - k.gy0, k.h, MAT.rack);
  // —— escritorio izquierdo 2 con computador decorativo C4
  escritorioIzq(G.deskL2.gy0, G.deskL2.gy1);
  box(.55, 6.0, 14, .3, 1.0, 1.5, MAT.teclado);
  box(.2, 5.15, 14, .6, .5, 6, MAT.papel); box(.22, 5.17, 20, .56, .46, 1, MAT.mesa);     // impresora
  monitorX(G.mon4);
  // —— estantería esquinera derecha
  sombra(6.7, 0, 1.3, .95);
  box(6.75, 0, 0, 1.15, .75, 40, MAT.mesa);
  // —— marcos y detalles de pared
  marcoPared();
}

function marcoPared(){
  // lámpara de pared (pared izquierda, sobre el rack)
  const p = iso(0, 3.9, 50);
  rect(p[0] - 2, p[1] - 1, 5, 4, C.ink); rect(p[0] - 1, p[1], 3, 2, C.oro); pix(p[0], p[1] - 3, C.ink); pix(p[0], p[1] - 2, C.ink);
  // póster de gráficas (pared izquierda, junto al escritorio 2)
  const cv = flat(28, 22);
  en(cv, () => {
    rect(0, 0, 28, 22, C.ink); rect(1, 1, 26, 20, C.miel); rect(1, 1, 26, 4, C.marino);
    txt("DATOS", 3, 1, C.miel);
    const hs = [5, 9, 7, 12, 9, 14], cols = [C.ponche, C.escarcha, C.algodon, C.ponche, C.escarcha, C.ponche];
    for(let i = 0; i < 6; i++) rect(3 + i * 4, 20 - hs[i], 3, hs[i], cols[i]);
    for(let i = 0; i < 5; i++){ pix(4 + i * 4, 17 - hs[i], C.ink); }
    rect(2, 20, 24, 1, C.ink);
  });
  caraX(cv, 0, 7.25, 58);
}

function capaB_frente(){
  silla(1.55, 1.35, "gx-");                                           // frente al escritorio 1
  silla(1.65, 1.45, "gy-");                                           // frente al escritorio derecho
  silla(1.5, 6.05, "gx-");
  // mesa auxiliar con laptop
  const m = G.mesaC;
  sombra(m.gx0 - .05, m.gy0 - .05, m.gx1 - m.gx0 + .2, m.gy1 - m.gy0 + .2);
  box(m.gx0, m.gy0, 0, m.gx1 - m.gx0, m.gy1 - m.gy0, 12, MAT.mesa);
  box(6.15, 4.95, 12, .55, .95, 1, MAT.carcasa);                       // base de la laptop
  box(G.lap.gx - .1, G.lap.gy0, G.lap.z0, .1, G.lap.gy1 - G.lap.gy0, G.lap.z1 - G.lap.z0, MAT.carcasa);
  box(7.0, 5.4, 12, .3, .3, 3, MAT.panel);                             // taza
  box(6.95, 4.85, 12, .35, .4, 1.5, MAT.papel);
  planta(.45, 7.35); planta(7.2, 7.15);
}

/* ---------- 7. Pantallas animadas ---------- */
const cvMon1 = flat(20, 15), cvMon2 = flat(20, 15), cvMon4 = flat(20, 15), cvLap = flat(14, 10);
const cvArcade = flat(16, 46), cvRack = flat(16, 40), cvBoard = flat(45, 24), cvClock = flat(14, 14), cvMural = flat(14, 14), cvWin = flat(32, 28);

const COLS_PZ = [C.ponche, C.algodon, C.escarcha, C.oro, C.escarchaD];

function pantallaPC1(t, hov){                     // "El reto": piezas que se encienden una a una
  rect(0, 0, 20, 15, C.ink); rect(1, 1, 18, 13, hov ? "#16365B" : C.marinoD);
  rect(1, 1, 18, 3, C.escarcha); pix(2, 2, C.ponche); pix(4, 2, C.oro); pix(6, 2, C.marino);
  const n = (t >> 2) % 7;
  for(let i = 0; i < 5; i++){
    const x = 3 + i * 3 + (i > 2 ? 0 : 0), y = i % 2 ? 8 : 6;
    rect(x, y, 3, 3, i < n ? COLS_PZ[i] : C.marinoLL);
    if(i < n) pix(x + 1, y - 1, COLS_PZ[i]);
  }
  rect(3, 12, 14, 1, C.marinoLL); rect(3, 12, Math.min(14, Math.round(14 * Math.min(n, 5) / 5)), 1, C.oro);
  if((t >> 2) % 2) pix(17, 2, C.miel);
}
function pantallaPC2(t, hov){                     // "Memoria": cartas que se voltean
  rect(0, 0, 20, 15, C.ink); rect(1, 1, 18, 13, hov ? "#16365B" : C.marinoD);
  const flip = (t >> 2) % 8;
  for(let r = 0; r < 2; r++) for(let k = 0; k < 4; k++){
    const i = r * 4 + k, x = 2 + k * 4, y = 3 + r * 5;
    const up = (i === flip || i === (flip + 4) % 8);
    rect(x, y, 3, 4, up ? C.miel : C.ponche);
    if(up) { pix(x + 1, y + 1, COLS_PZ[i % 5]); pix(x + 1, y + 2, COLS_PZ[i % 5]); }
    else   { pix(x + 1, y + 1, C.algodonL); }
  }
}
function pantallaCodigo(t){                       // decorativa: líneas de código que suben
  rect(0, 0, 14, 10, C.ink); rect(1, 1, 12, 8, C.marinoD);
  const off = (t >> 1) % 6;
  for(let i = 0; i < 4; i++){
    const y = 1 + ((i * 3 - off + 12) % 12) % 9;
    const len = [8, 5, 9, 6, 7][(i + (t >> 3)) % 5];
    if(y > 0 && y < 9) rect(2, y, Math.min(len, 10), 1, [C.escarcha, C.algodon, C.oro, C.escarchaL][i % 4]);
  }
}
function pantallaGrafica(t){                      // decorativa: barras que suben y bajan
  rect(0, 0, 20, 15, C.ink); rect(1, 1, 18, 13, C.marinoD);
  for(let i = 0; i < 6; i++){
    const hgt = 2 + Math.round(5 + 4 * Math.sin(t / 5 + i * 1.3));
    rect(3 + i * 2 + (i > 2 ? 0 : 0), 12 - hgt, 2, hgt, i % 2 ? C.escarcha : C.algodon);
  }
  rect(2, 12, 16, 1, C.miel);
}
function pantallaArcade(t, hov){
  const f = cvArcade; const on = (t >> 2) % 2;
  rect(0, 0, 16, 46, C.ponche);
  rect(0, 0, 1, 46, C.poncheD); rect(15, 0, 1, 46, C.poncheD);
  // marquesina
  rect(1, 1, 14, 8, C.marinoD); rect(1, 1, 14, 1, C.ink); rect(1, 8, 14, 1, C.ink);
  const mq = hov ? ((t >> 1) % 2 ? C.oro : C.miel) : (on ? C.oro : C.miel);
  txt("PLAY", 1, 3, mq);
  for(let x = 2; x < 15; x += 3){ pix(x, 1, (x / 3 + (t >> 2)) % 2 < 1 ? C.oro : C.ponche); pix(x, 8, ((x / 3) + (t >> 2)) % 2 < 1 ? C.ponche : C.oro); }
  // pantalla
  rect(2, 11, 12, 14, C.ink); rect(3, 12, 10, 12, "#0B1424");
  const sh = Math.round(2 * Math.sin(t / 4));
  for(let k = 0; k < 3; k++){ const x = 4 + k * 3 + sh; rect(x, 14, 2, 1, C.escarcha); pix(x - (t >> 2) % 2 * 0, 15, C.escarcha); rect(x, 17, 2, 1, C.algodon); }
  const px = 5 + Math.round(3 * Math.sin(t / 6));
  rect(px, 22, 3, 1, C.oro); pix(px + 1, 21, C.oro);
  const by = 21 - ((t >> 1) % 8); if(by > 13) pix(px + 1, by, C.miel);
  // panel de control (parte inferior de la cara)
  rect(1, 27, 14, 5, C.escarcha); rect(1, 27, 14, 1, C.escarchaL); rect(1, 31, 14, 1, C.escarchaD);
  disco(5, 29, 1, C.ponche); pix(5, 27, C.ink);
  rect(9, 29, 2, 2, (t >> 2) % 2 ? C.miel : C.algodon); rect(12, 29, 2, 2, (t >> 2) % 2 ? C.algodon : C.oro);
  // frente inferior
  rect(5, 36, 6, 3, C.ink); rect(6, 37, 4, 1, (t >> 1) % 4 < 2 ? C.oro : C.poncheD);
  rect(2, 42, 12, 1, C.poncheD);
}
function racks(t){
  rect(0, 0, 16, 40, C.ink); rect(1, 1, 14, 38, C.marinoD);
  for(let i = 0; i < 6; i++){
    const y = 2 + i * 6;
    rect(2, y, 12, 5, C.marino); rect(2, y, 12, 1, C.marinoLL);
    rect(3, y + 2, 5, 1, C.ink);
    const ph = (t + i * 5) % 14;
    pix(10, y + 2, ph < 5 ? C.escarcha : C.marinoLL); pix(12, y + 2, ph > 8 ? C.ponche : C.marinoLL); pix(11, y + 3, ph % 4 < 2 ? C.oro : C.marinoLL);
  }
}
function pizarra(t){
  rect(0, 0, 45, 24, C.ink); rect(1, 1, 43, 22, "#F7F3E2"); rect(1, 1, 43, 5, C.marino);
  txt("PROCESO", 3, 1, C.miel);
  const cols = [C.ponche, C.algodon, C.escarcha, C.oro, C.escarchaD], act = (t >> 3) % 5;
  for(let i = 0; i < 5; i++){
    const x = 3 + i * 8, y = 11 + (i % 2 ? 4 : 0) - (i === act ? 1 : 0);
    rect(x, y, 6, 7, i === act ? C.ink : cols[i]); rect(x + (i === act ? 1 : 0), y + (i === act ? 1 : 0), i === act ? 4 : 6, i === act ? 5 : 7, cols[i]);
    txt(String(i + 1), x + 1, y + 1, C.marino);
    if(i < 4){ const yy = (i % 2 ? 15 : 11) + 3; pix(x + 7, yy + (i % 2 ? -2 : 2), C.marinoLL); }
  }
}
function reloj(){
  rect(0, 0, 14, 14, "rgba(0,0,0,0)"); g.clearRect(0, 0, 14, 14);
  for(let y = 0; y < 14; y++) for(let x = 0; x < 14; x++){
    const d = Math.hypot(x - 6.5, y - 6.5);
    if(d <= 6.6) pix(x, y, d > 5.5 ? C.ink : C.miel);
  }
  pix(6, 2, C.ink); pix(6, 11, C.ink); pix(2, 6, C.ink); pix(11, 6, C.ink);
  const d = new Date(), s = d.getSeconds(), mi = d.getMinutes() + s / 60, h = (d.getHours() % 12) + mi / 60;
  const pt = (ang, len) => [R(6 + Math.sin(ang) * len), R(6 - Math.cos(ang) * len)];
  line([6, 6], pt(h / 12 * Math.PI * 2, 2.5), C.ink);
  line([6, 6], pt(mi / 60 * Math.PI * 2, 4), C.marino);
  line([6, 6], pt(s / 60 * Math.PI * 2, 4.5), C.ponche);
  pix(6, 6, C.ink);
}
function muralMarco(t, desbloqueado){
  rect(0, 0, 14, 14, C.ink);
  if(!desbloqueado){
    rect(1, 1, 12, 12, C.marino); txt("?", 6, 4, C.miel);
    const s = (t >> 1) % 12; pix(1 + s, 2 + (s * 5) % 9, C.oro);
  } else {
    rect(1, 1, 12, 12, C.miel);
    for(let y = 2; y < 12; y++) pix(7 + Math.round(3 * Math.sin(y / 1.6)), y, C.ponche);
    pix(4, 3, C.escarcha); pix(10, 6, C.algodon); pix(5, 10, C.escarchaD); pix(9, 11, C.oro);
    if((t >> 1) % 6 === 0) pix(11, 2, C.oro);
  }
}
function ventana(t){
  rect(0, 0, 32, 28, C.ink); rect(1, 1, 30, 26, C.miel);
  rect(2, 2, 28, 10, C.escarcha); rect(2, 12, 28, 6, "#C4E4E5"); rect(2, 18, 28, 8, C.miel);
  disco(24, 8, 3, C.oro);
  for(let x = 2; x < 30; x++){ const h = 4 + Math.round(2 * Math.sin(x / 4) + (x % 9 < 3 ? 2 : 0)); rect(x, 26 - h, 1, h, C.marinoLL); }
  rect(5, 18, 3, 5, C.marino); rect(5, 18, 3, 1, C.algodon); rect(22, 17, 4, 6, C.marino); rect(22, 17, 4, 1, C.algodon);
  pix(6, 20, C.oro); pix(23, 19, C.oro); pix(24, 21, C.oro);
  const nubes = [[(t * .35) % 46 - 12, 5], [(t * .22 + 24) % 46 - 12, 10]];
  for(const n of nubes){ const x = R(n[0]), y = n[1]; rect(x + 1, y, 6, 2, C.miel); rect(x, y + 1, 9, 2, C.miel); rect(x + 3, y - 1, 3, 1, C.miel); }
  const ax = 28 - (t % 40) * .9; if(ax > 2) { pix(R(ax), 14 + (t % 6 < 3 ? 0 : 1), C.ink); pix(R(ax) + 1, 14 + (t % 6 < 3 ? 1 : 0), C.ink); }
  rect(15, 1, 2, 26, C.ink); rect(1, 13, 30, 2, C.ink);
  rect(2, 2, 28, 1, C.miel); rect(2, 2, 1, 24, C.miel);
}

let progreso = {};
function dinamico1(t, hov){
  // pared derecha
  en(cvBoard, () => pizarra(t));        caraY(cvBoard, .625, 0, 60);
  en(cvClock, () => reloj());           caraY(cvClock, 3.75, 0, 56);
  en(cvMural, () => muralMarco(t, !!progreso.reto)); caraY(cvMural, 6.9375, 0, 58);
  // pared izquierda
  en(cvWin, () => ventana(t));          caraX(cvWin, 0, 2.5, 58);
  // monitores y máquinas
  en(cvMon1, () => pantallaPC1(t, hov === "pc1")); caraX(cvMon1, G.mon1.gxF, G.mon1.gy1, G.mon1.z1);
  en(cvMon2, () => pantallaPC2(t, hov === "pc2")); caraY(cvMon2, G.mon2.gx0, G.mon2.gyF, G.mon2.z1);
  en(cvMon4, () => pantallaGrafica(t));            caraX(cvMon4, G.mon4.gxF, G.mon4.gy1, G.mon4.z1);
  en(cvRack, () => racks(t));                      caraX(cvRack, G.rack.gx1, G.rack.gy1, G.rack.h);
  en(cvArcade, () => pantallaArcade(t, hov === "arcade")); caraY(cvArcade, G.arcade.gx0, G.arcade.gy1, G.arcade.h);
  // saliente del panel de control del arcade (queda delante de la cara)
  box(G.arcade.gx0, G.arcade.gy1, 19, G.arcade.gx1 - G.arcade.gx0, .3, 3, MAT.panel);
  const j = iso(G.arcade.gx0 + .35, G.arcade.gy1 + .15, 22);
  rect(j[0], j[1] - 4, 1, 4, C.ink); disco(j[0], j[1] - 5, 1, C.ponche);
}
function dinamico2(t){
  en(cvLap, () => pantallaCodigo(t));   caraX(cvLap, G.lap.gx, G.lap.gy1, G.lap.z1);
}

/* ---------- 8. Personaje ---------- */
function personaje(t, apunta){
  const f = iso(G.pj.gx, G.pj.gy), cx = f[0], fy = f[1];
  const bob = ((t >> 2) % 2) ? 1 : 0, y = fy - bob;
  sombraPj(cx, fy);
  // zapatos y piernas
  rect(cx - 4, y - 2, 3, 2, C.ink); rect(cx + 1, y - 2, 3, 2, C.ink);
  rect(cx - 3, y - 8, 2, 6, C.marino); rect(cx + 1, y - 8, 2, 6, C.marino);
  // bata
  rect(cx - 5, y - 16, 10, 9, C.ink); rect(cx - 4, y - 15, 8, 8, C.miel); rect(cx - 4, y - 8, 8, 1, C.mielDD);
  rect(cx, y - 15, 1, 8, C.mielDD);
  rect(cx - 3, y - 17, 6, 2, C.ponche); pix(cx + 3, y - 15, C.ponche); rect(cx + 3, y - 14, 1, 3, C.poncheD);   // bufanda
  // brazos
  const alza = apunta !== 0 && (t % 60 < 40);
  rect(cx - 7, y - 15, 2, 7, C.ink); rect(cx - 6, y - 14, 1, 5, C.miel);
  rect(cx + 5, y - 15, 2, 7, C.ink); rect(cx + 5, y - 14, 1, 5, C.miel);
  if(alza){
    const sx = apunta < 0 ? cx - 8 : cx + 6;
    rect(sx, y - 22, 2, 8, C.ink); rect(sx + (apunta < 0 ? 0 : 0), y - 21, 1, 6, C.miel); pix(sx, y - 22, C.piel); pix(sx + 1, y - 22, C.piel);
    rect(apunta < 0 ? cx - 7 : cx + 5, y - 15, 2, 2, C.miel);
  } else { pix(cx - 7, y - 8, C.piel); pix(cx - 6, y - 8, C.piel); pix(cx + 5, y - 8, C.piel); pix(cx + 6, y - 8, C.piel); }
  // cabeza
  rect(cx - 5, y - 25, 10, 9, C.ink); rect(cx - 4, y - 24, 8, 8, C.piel); rect(cx - 4, y - 18, 8, 1, C.pielD);
  rect(cx - 5, y - 27, 10, 4, C.ink); rect(cx - 4, y - 26, 8, 3, C.marino); rect(cx - 5, y - 24, 2, 3, C.marino); rect(cx + 3, y - 24, 2, 3, C.marino);
  pix(cx - 4, y - 26, C.marinoLL); pix(cx - 3, y - 27, C.marinoLL);
  // lentes
  const parp = (t % 34) === 0 || (t % 34) === 1;
  rect(cx - 4, y - 22, 3, 3, C.ink); rect(cx + 1, y - 22, 3, 3, C.ink); rect(cx - 1, y - 21, 2, 1, C.ink);
  rect(cx - 3, y - 21, 1, 1, parp ? C.ink : C.miel); rect(cx + 2, y - 21, 1, 1, parp ? C.ink : C.miel);
  if(!parp){ pix(cx - 3, y - 20, C.escarcha); pix(cx + 2, y - 20, C.escarcha); }
  pix(cx - 1, y - 18, C.poncheD); pix(cx, y - 18, C.poncheD);                                                // sonrisa
}
function sombraPj(cx, fy){ for(let i = -5; i <= 5; i++){ g.globalAlpha = .28; g.fillStyle = "#2E5B60"; g.fillRect(cx + i, fy - 1 + (Math.abs(i) > 3 ? 0 : 1), 1, 2 - (Math.abs(i) > 3 ? 1 : 0)); } g.globalAlpha = 1; }

function polvo(t){
  for(let i = 0; i < 9; i++){
    const x = (i * 37 + t * (.4 + (i % 3) * .15)) % 240 + 40;
    const y = 200 - ((t * (.5 + (i % 4) * .2) + i * 41) % 130);
    g.globalAlpha = .55; g.fillStyle = i % 3 ? C.miel : C.oro; g.fillRect(R(x), R(y), 1, 1); g.globalAlpha = 1;
  }
}

/* ---------- 9. Interacción: contorno, flecha, insignias ---------- */
const est = {};       // id → {id, borde1, borde2, bbox, hull, ancla}
function construirEstacion(id){
  const cv = flat(W, H);
  en(cv, () => silueta(id));
  const d = cv.getContext("2d").getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H);
  for(let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  const at = (x, y, arr) => x >= 0 && y >= 0 && x < W && y < H && arr[y * W + x];
  const vec = (x, y, arr) => { for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) if((dx || dy) && at(x + dx, y + dy, arr)) return true; return false; };
  const b1 = new Uint8Array(W * H), borde1 = [], borde2 = [], frontera = [];
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(m[y * W + x]){
      if(x < x0) x0 = x; if(y < y0) y0 = y; if(x > x1) x1 = x; if(y > y1) y1 = y;
      if(!at(x - 1, y, m) || !at(x + 1, y, m) || !at(x, y - 1, m) || !at(x, y + 1, m)) frontera.push([x, y]);
    } else if(vec(x, y, m)){ b1[y * W + x] = 1; borde1.push([x, y]); }
  }
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(!m[y * W + x] && !b1[y * W + x] && vec(x, y, b1)) borde2.push([x, y]);
  est[id] = {id, borde1, borde2, bbox:[x0 - 2, y0 - 2, x1 + 3, y1 + 3], hull: casco(frontera), ancla:[R((x0 + x1) / 2), y0 - 2]};
}
function casco(pts){                              // envolvente convexa (cadena monótona)
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = []; for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = []; for(const q of p.slice().reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}

function contorno(t, id){
  const e = est[id]; if(!e) return;
  g.fillStyle = (t >> 1) % 2 ? C.ponche : C.oro; for(const p of e.borde2) g.fillRect(p[0], p[1], 1, 1);
  g.fillStyle = C.miel; for(const p of e.borde1) g.fillRect(p[0], p[1], 1, 1);
}
function indicadores(t, hov){
  const bob = [0, -1, -2, -1][(t >> 1) % 4];
  for(const id in est){
    const e = est[id], x = e.ancla[0], y = e.ancla[1] - 7 + bob;
    if(progreso[SALA_ESTACION[id]]){                     // juego completado: insignia ✓
      disco(x, y + 1, 5, C.ink); disco(x, y + 1, 4, C.escarcha);
      line([x - 2, y + 1], [x - 1, y + 3], C.ink); line([x - 1, y + 3], [x + 2, y - 1], C.ink);
    } else if(hov !== id){                               // flecha que invita a hacer clic
      const col = SALA_DISPONIBLE[id] ? C.ponche : C.mielDD;
      poly([[x - 4, y - 2], [x + 5, y - 2], [x, y + 4]], C.ink);
      poly([[x - 3, y - 1], [x + 4, y - 1], [x, y + 3]], col);
    }
  }
  if(hov){ const e = est[hov]; if(e){ const x = e.ancla[0], y = e.ancla[1] - 8 + bob; poly([[x - 5, y - 3], [x + 6, y - 3], [x, y + 5]], C.ink); poly([[x - 4, y - 2], [x + 5, y - 2], [x, y + 3]], C.oro); } }
}
const SALA_ESTACION = {}, SALA_DISPONIBLE = {};     // id de estación → id de juego / disponibilidad (se llena en iniciar)

/* ---------- 10. Bucle y API pública ---------- */
let ctx = null, capaA = null, capaB = null, t = 0, ultimo = 0, hover = null, raf = 0, reducido = false;

function construirCapas(){
  capaA = flat(W, H); capaB = flat(W, H);
  en(capaA, () => { dibujarPiso(); dibujarParedes(); dibujarAlfombra(); capaA_muebles(); });
  en(capaB, () => { capaB_frente(); });
  ["pc1", "pc2", "arcade"].forEach(construirEstacion);
}
function dibujar(){
  g = ctx; ctx.clearRect(0, 0, W, H);
  ctx.drawImage(capaA, 0, 0);
  dinamico1(t, hover);
  ctx.drawImage(capaB, 0, 0);
  dinamico2(t);
  const e = hover && est[hover];
  let apunta = 0;
  if(e){ apunta = e.ancla[0] < OX - 6 ? -1 : 1; }
  personaje(t, apunta);
  polvo(t);
  if(hover) contorno(t, hover);
  indicadores(t, hover);
}
function bucle(ts){
  raf = requestAnimationFrame(bucle);
  if(ts - ultimo >= 100){ ultimo = ts; t++; dibujar(); }
}

window.Sala = {
  W, H,
  iniciar(canvas, opciones){
    opciones = opciones || {};
    ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false;
    (opciones.juegos || []).forEach(j => { SALA_ESTACION[j.estacion] = j.id; SALA_DISPONIBLE[j.estacion] = j.disponible; });
    progreso = opciones.progreso || {};
    reducido = !!opciones.reducido;
    construirCapas();
    dibujar();
    if(!reducido) raf = requestAnimationFrame(bucle);
    return Object.values(est).map(e => ({id:e.id, bbox:e.bbox, hull:e.hull, ancla:e.ancla}));
  },
  hover(id){ hover = id || null; if(ctx){ g = ctx; dibujar(); } },
  setProgreso(p){ progreso = p || {}; if(ctx){ g = ctx; dibujar(); } },
  personajeAncla(){ const f = iso(G.pj.gx, G.pj.gy); return [f[0], f[1] - 29]; },
  pausar(){ cancelAnimationFrame(raf); },
  reanudar(){ if(!reducido){ cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); } }
};
})();
