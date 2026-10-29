/* =========================================================
   Sala de cómputo · lógica de la página principal
   Une SALA (hub-data.js) con el lienzo (sala.js) y los paneles.
   ========================================================= */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
let abierta = false, ultimoFoco = null;   // ventana de juego abierta

/* ---------- Progreso compartido con los juegos ---------- */
function leerProgreso(){ try{ return JSON.parse(localStorage.getItem(SALA.claveProgreso)) || {}; }catch(e){ return {}; } }

/* ---------- Iconos de 8x8 píxeles ---------- */
const ICONOS = {
  puzzle:["..####..",".#....#.","##.##.##","#..##..#","#..##..#","##.##.##",".#....#.","..####.."],
  cartas:[".####...","#....#..","#.##.###","#.##.#.#","#....#.#",".####.##","....#..#","....####"],
  joystick:["...##...","..####..","..####..","...##...","...##...","..####..",".######.","########"]
};
function icono(nombre){
  const c = document.createElement("canvas"); c.width = 8; c.height = 8; c.className = "ic";
  const g = c.getContext("2d");
  ICONOS[nombre].forEach((fila, y) => [...fila].forEach((ch, x) => {
    if(ch === "#"){ g.fillStyle = "#14233B"; g.fillRect(x, y, 1, 1); }
  }));
  c.setAttribute("aria-hidden", "true");
  return c;
}

/* ---------- Textos fijos ---------- */
$("etiqueta").textContent = SALA.etiqueta;
$("titulo").textContent = SALA.titulo;
$("slogan").textContent = SALA.slogan;

/* ---------- Panel: proceso ---------- */
const liProc = SALA.proceso.map(p => {
  const li = document.createElement("li");
  li.innerHTML = '<b>' + p.n + '</b><span>' + p.corto + '</span> <small>· ' + p.pista + '</small>';
  $("proceso").appendChild(li); return li;
});
let pAct = 0;
function rotarProceso(){ if(abierta) return; liProc.forEach((l, i) => l.classList.toggle("act", i === pAct)); pAct = (pAct + 1) % liProc.length; }
rotarProceso();
if(!reducido) setInterval(rotarProceso, 2600);

/* ---------- Panel: lista de juegos y detalle ---------- */
const porEst = {}; SALA.juegos.forEach(j => porEst[j.estacion] = j);
const filas = {};
let prog = leerProgreso(), seleccion = SALA.juegos[0].estacion;

SALA.juegos.forEach(j => {
  const li = document.createElement("li"), a = document.createElement("a");
  a.href = j.url; a.dataset.est = j.estacion;
  a.appendChild(icono(j.icono));
  const s = document.createElement("span"); s.textContent = j.nombre; a.appendChild(s);
  const e = document.createElement("em"); e.className = "est"; e.style.fontStyle = "normal"; a.appendChild(e);
  a.addEventListener("click", ev => { ev.preventDefault(); entrar(j); });
  a.addEventListener("mouseenter", () => enfocar(j.estacion));
  a.addEventListener("focus", () => enfocar(j.estacion));
  li.appendChild(a); $("lista").appendChild(li); filas[j.estacion] = a;
});
function pintarEstado(){
  let hechos = 0;
  SALA.juegos.forEach(j => {
    const a = filas[j.estacion], e = a.querySelector(".est");
    const ok = !!prog[j.id]; if(ok) hechos++;
    a.classList.toggle("hecho", ok); a.classList.toggle("pronto", !j.disponible);
    e.textContent = ok ? "LISTO" : (j.disponible ? "JUGAR" : "PRONTO");
  });
  const barra = $("barra"); barra.innerHTML = "";
  SALA.juegos.forEach(j => { const i = document.createElement("i"); if(prog[j.id]) i.className = "ok"; barra.appendChild(i); });
  $("progNum").textContent = hechos + "/" + SALA.juegos.length;
  barra.setAttribute("aria-label", hechos + " de " + SALA.juegos.length + " juegos completados");
}
function detalle(est){
  const j = porEst[est]; if(!j) return;
  $("dTipo").textContent = j.tipo;
  $("dNombre").textContent = j.nombre;
  $("dDesc").textContent = j.desc;
  $("dChips").innerHTML = "";
  j.chips.concat(j.disponible ? [] : ["Próximamente"]).forEach(c => { const s = document.createElement("span"); s.textContent = c; $("dChips").appendChild(s); });
  const b = $("dJugar"); b.href = j.url; b.textContent = j.disponible ? "JUGAR" : "VER AVISO"; b.classList.toggle("off", !j.disponible);
  b.onclick = ev => { ev.preventDefault(); entrar(j); };
}
function enfocar(est){
  seleccion = est; detalle(est); Sala.hover(est);
  for(const k in filas) filas[k].classList.toggle("act", k === est);
  diga(frasePara(est));
}
function frasePara(est){
  const j = porEst[est];
  return j.disponible ? "¡Este es! " + j.nombre + "." : j.nombre + ": muy pronto.";
}

/* ---------- Burbuja del investigador ---------- */
const bur = $("burbuja"), burTxt = $("burbujaTxt");
let fi = 0, bloqueada = 0;
function diga(t){
  burTxt.textContent = t; bur.classList.remove("cambia"); void bur.offsetWidth; bur.classList.add("cambia");
  bloqueada = Date.now() + 3500;
}
function ubicarBurbuja(){
  // La burbuja va debajo del personaje, sobre el piso libre del frente, para no tapar las máquinas
  const a = Sala.personajeAncla(), pies = a[1] + 29 + 5;
  bur.style.left = ((a[0] + 5) / Sala.W * 100) + "%"; bur.style.top = (pies / Sala.H * 100) + "%";
}
setInterval(() => {
  if(Date.now() < bloqueada || abierta) return;
  fi = (fi + 1) % SALA.frases.length; diga(SALA.frases[fi]); bloqueada = 0;
}, 4500);

/* ---------- Zonas clicables sobre el lienzo ---------- */
function crearZonas(zonas){
  const cont = $("zonas");
  zonas.forEach(z => {
    const j = porEst[z.id], a = document.createElement("a");
    a.href = j.url; a.setAttribute("aria-label", j.nombre + (j.disponible ? "" : " (próximamente)"));
    const [x0, y0, x1, y1] = z.bbox, w = x1 - x0, h = y1 - y0;
    Object.assign(a.style, {left:(x0 / Sala.W * 100) + "%", top:(y0 / Sala.H * 100) + "%", width:(w / Sala.W * 100) + "%", height:(h / Sala.H * 100) + "%"});
    a.style.clipPath = "polygon(" + z.hull.map(p => ((p[0] - x0) / w * 100).toFixed(1) + "% " + ((p[1] - y0) / h * 100).toFixed(1) + "%").join(",") + ")";
    a.addEventListener("mouseenter", () => enfocar(z.id));
    a.addEventListener("focus", () => enfocar(z.id));
    a.addEventListener("click", ev => { ev.preventDefault(); entrar(j); });
    cont.appendChild(a);
  });
  // al salir de la escena se quita el resalte pero se conserva la selección
  $("escena").addEventListener("mouseleave", () => Sala.hover(null));
}

/* ---------- Ventana emergente: el juego se abre dentro de la página ---------- */
const vFondo = $("ventanaFondo"), vMarco = $("ventanaMarco"), vCarga = $("ventanaCarga"), vCerrar = $("ventanaCerrar");
function entrar(j){
  if(abierta) return; abierta = true;
  ultimoFoco = document.activeElement;
  $("ventanaTitulo").textContent = "investigadores-en-accion / " + j.nombre.toLowerCase().replace(/\s+/g, "-");
  vMarco.title = j.nombre;
  vCarga.hidden = false;
  vMarco.onload = () => { vCarga.hidden = true; };
  vMarco.src = j.url;
  vFondo.hidden = false; document.body.classList.add("con-ventana");
  Sala.pausar();                                  // la sala se detiene mientras se juega (ahorra CPU)
  vCerrar.focus();
}
function cerrar(){
  if(!abierta) return; abierta = false;
  vFondo.hidden = true; document.body.classList.remove("con-ventana");
  vMarco.onload = null; vMarco.src = "about:blank";   // libera la memoria del juego
  prog = leerProgreso(); pintarEstado(); Sala.setProgreso(prog);
  if(!document.hidden) Sala.reanudar();
  if(ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}
vCerrar.addEventListener("click", cerrar);
vFondo.addEventListener("mousedown", ev => { if(ev.target === vFondo) cerrar(); });
addEventListener("keydown", ev => { if(ev.key === "Escape") cerrar(); });
addEventListener("message", ev => {               // el juego pide volver a la sala
  if(ev.source === vMarco.contentWindow && ev.data && ev.data.tipo === "cerrar-ventana") cerrar();
});
addEventListener("pageshow", () => { prog = leerProgreso(); pintarEstado(); Sala.setProgreso(prog); });

/* ---------- Arranque ---------- */
const zonas = Sala.iniciar($("sala"), {juegos:SALA.juegos, progreso:prog, reducido});
crearZonas(zonas); pintarEstado(); detalle(seleccion); ubicarBurbuja();
diga(SALA.frases[0]);
document.addEventListener("visibilitychange", () => (document.hidden || abierta) ? Sala.pausar() : Sala.reanudar());

/* Precarga los juegos disponibles cuando el navegador está libre, para que abran al instante */
(window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => {
  SALA.juegos.filter(j => j.disponible).forEach(j => { const l = document.createElement("link"); l.rel = "prefetch"; l.href = j.url; document.head.appendChild(l); });
});
})();
