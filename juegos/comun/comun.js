/* =========================================================
   Utilidades compartidas por los juegos de la sala
   ========================================================= */
(function(){
"use strict";
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
const CLAVE = "investigadores-en-accion:progreso";   // la misma que usa la sala (hub-data.js)
const COLORES = ["#E23C48", "#E99A99", "#203655", "#A7D6D8", "#F4C95D", "#C22A37"];

/* Baraja Fisher-Yates (devuelve el mismo arreglo) */
function mezclar(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* Marca un juego como completado en la sala */
function guardarProgreso(id){
  try{ const p = JSON.parse(localStorage.getItem(CLAVE)) || {}; p[id] = true; localStorage.setItem(CLAVE, JSON.stringify(p)); }catch(e){}
}

/* Confeti: partículas que salen de (x, y) y caen (mismo efecto que El reto del investigador) */
function confeti(x, y, colores, n){
  if(reducido) return;
  const cont = document.getElementById("confeti"); if(!cont) return;
  colores = colores || COLORES; n = n || 40;
  for(let i = 0; i < n; i++){
    const p = document.createElement("i"), w = 6 + Math.random() * 8, h = 8 + Math.random() * 10;
    p.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px;background:" + colores[i % colores.length] + ";border-radius:" + (Math.random() < .4 ? "50%" : "2px");
    cont.appendChild(p);
    const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 240, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 70;
    p.animate([
      {transform:"translate(0,0) rotate(0deg)", opacity:1},
      {transform:"translate(" + dx + "px," + dy + "px) rotate(" + Math.random() * 360 + "deg)", opacity:1, offset:.45},
      {transform:"translate(" + dx * 1.15 + "px," + (dy + 260) + "px) rotate(" + (Math.random() * 720 - 360) + "deg)", opacity:0}
    ], {duration:1300 + Math.random() * 900, easing:"cubic-bezier(.2,.7,.4,1)"}).onfinish = () => p.remove();
  }
}
const confetiCentro = n => confeti(innerWidth / 2, innerHeight / 3, COLORES, n);
function confetiDe(el, n){ if(!el) return; const r = el.getBoundingClientRect(); confeti(r.left + r.width / 2, r.top + r.height / 2, COLORES, n); }

/* Garabatos de fondo que derivan lentamente */
function doodles(cont, cantidad){
  if(reducido || !cont) return;
  const tipos = ["dd-ring", "dd-plus", "dd-dot", "dd-sq", "dd-ring", "dd-plus"], colores = ["#A7D6D8", "#E99A99", "#E23C48", "#203655", "#A7D6D8", "#E99A99"];
  for(let i = 0; i < (cantidad || 10); i++){
    const d = document.createElement("span"), tipo = tipos[i % tipos.length], s = tipo === "dd-dot" ? 10 + Math.random() * 14 : 22 + Math.random() * 40;
    d.className = "dd " + tipo;
    d.style.cssText = "--x:" + Math.random() * 96 + "%;--y:" + Math.random() * 94 + "%;--s:" + s + "px;--c:" + colores[(i * 5) % colores.length] + ";--o:" + (.28 + Math.random() * .3) +
      ";--t:" + (14 + Math.random() * 16) + "s;--dx:" + (Math.random() - .5) * 90 + "px;--dy:" + (Math.random() - .5) * 110 + "px;--rot:" + (Math.random() - .5) * 200 + "deg";
    cont.appendChild(d);
  }
}

/* Título: cada letra sube con un pequeño retraso */
function letras(sel){
  document.querySelectorAll(sel).forEach(el => {
    const ini = +(el.dataset.inicio || 0), t = el.textContent; el.textContent = "";
    [...t].forEach((c, i) => { const s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", i + ini); s.textContent = c === " " ? " " : c; el.appendChild(s); });
  });
}

/* Logos (los mismos de la sala) */
function logos(){
  document.querySelectorAll("img[data-logo]").forEach(img => {
    img.src = {conocimiento:"../../assets/logo-conocimiento.webp", idead:"../../assets/logo-idead.webp"}[img.dataset.logo];
    img.onerror = () => { img.style.display = "none"; };
  });
}

/* Dentro de la ventana de la sala, "Volver" cierra la ventana en vez de recargar la sala */
const embebido = window.parent !== window;
if(embebido) document.documentElement.classList.add("embebido");
document.addEventListener("click", ev => {
  const a = ev.target.closest && ev.target.closest("[data-volver]");
  if(a && embebido){ ev.preventDefault(); parent.postMessage({tipo:"cerrar-ventana"}, "*"); }
});

window.PX = {mezclar, guardarProgreso, confeti, confetiCentro, confetiDe, doodles, letras, logos, COLORES, reducido, embebido};
})();
