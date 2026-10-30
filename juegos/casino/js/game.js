/* =========================================================
   Casino del saber · lógica
   Reglas: empiezas con REGLAS.inicio puntos y apuestas antes de cada
   pregunta; si aciertas ganas lo apostado (tu apuesta se duplica) y si
   fallas lo pierdes. Se gana al llegar a REGLAS.meta y se pierde en 0.
   La respuesta se escribe (una palabra) y se compara sin importar
   mayúsculas, espacios ni tildes.
   ========================================================= */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const {mezclar, guardarProgreso, confeti, confetiCentro, confetiDe} = PX;
const {inicio, meta, apuestaMin, paso} = REGLAS;

/* ---------- Estado ---------- */
let puntos, ronda, mazo, preg, apuesta, fase, historial, aciertos, mayorApuesta, animando = 0;
const redondea = v => Math.max(apuestaMin, Math.round(v / paso) * paso);

/* Quita tildes, espacios y signos y pasa a minúsculas: «  Ejecución » → «ejecucion» */
const normaliza = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const esCorrecta = (dicho, p) => { const d = normaliza(dicho); return d !== "" && p.r.some(r => normaliza(r) === d); };

function nuevoMazo(){ return mezclar(PREGUNTAS.map((_, i) => i)); }
function siguientePregunta(){ if(!mazo.length) mazo = nuevoMazo(); return PREGUNTAS[mazo.pop()]; }

function mostrar(f){
  fase = f;
  $("faseApuesta").hidden = f !== "apuesta"; $("fasePreg").hidden = f !== "pregunta"; $("faseRes").hidden = f !== "resultado";
}
function pintarNivel(el, n){
  el.innerHTML = ""; for(let i = 1; i <= 3; i++){ const s = document.createElement("i"); if(i <= n) s.className = "on"; el.appendChild(s); }
  el.setAttribute("role", "img"); el.setAttribute("aria-label", "Dificultad " + n + " de 3");
}
function pintarMarcador(){
  $("puntos").textContent = puntos; $("rondaTxt").textContent = "RONDA " + ronda;
  $("metaBarra").style.transform = "scaleX(" + Math.min(1, Math.max(.02, puntos / meta)) + ")";
  const h = $("historial"); h.innerHTML = "";
  historial.slice(-16).forEach(ok => { const i = document.createElement("i"); i.className = ok ? "si" : "no"; h.appendChild(i); });
}
/* El contador sube o baja de a poco */
function animarPuntos(desde, hasta){
  const id = ++animando, pasos = 14; let k = 0;
  if(PX.reducido){ $("puntos").textContent = hasta; return; }
  (function tick(){
    if(id !== animando) return;
    k++; $("puntos").textContent = Math.round(desde + (hasta - desde) * k / pasos);
    if(k < pasos) setTimeout(tick, 40);
  })();
}

/* ---------- Fase 1: apuesta ---------- */
function nuevaRonda(){
  preg = siguientePregunta();
  $("chipEtapa").textContent = preg.etapa; pintarNivel($("chipNivel"), preg.n);
  const rng = $("apuesta"); rng.min = apuestaMin; rng.max = puntos; rng.step = paso;
  fijarApuesta(Math.min(puntos, redondea(puntos / 4)));
  pintarMarcador(); mostrar("apuesta");
  rng.focus({preventScroll:true});
}
function fijarApuesta(v){
  apuesta = Math.min(puntos, Math.max(apuestaMin, redondea(v)));
  $("apuesta").value = apuesta; $("apuestaTxt").textContent = apuesta;
  $("pvGana").textContent = "+" + apuesta + " (tendrías " + (puntos + apuesta) + ")";
  $("pvPierde").textContent = "-" + apuesta + " (te quedarían " + (puntos - apuesta) + ")";
  $("btnMenos").disabled = apuesta <= apuestaMin; $("btnMas").disabled = apuesta >= puntos;
}
$("apuesta").addEventListener("input", e => fijarApuesta(+e.target.value));
$("btnMenos").onclick = () => fijarApuesta(apuesta - paso);
$("btnMas").onclick = () => fijarApuesta(apuesta + paso);
$("rapidas").addEventListener("click", ev => {
  const q = ev.target.closest("[data-q]"); if(!q) return;
  fijarApuesta({min:apuestaMin, cuarto:puntos / 4, mitad:puntos / 2, todo:puntos}[q.dataset.q]);
});

/* ---------- Fase 2: pregunta (se escribe la respuesta) ---------- */
$("btnApostar").onclick = () => {
  mayorApuesta = Math.max(mayorApuesta, apuesta);
  $("qApuesta").textContent = apuesta; $("qEtapa").textContent = preg.etapa; pintarNivel($("qNivel"), preg.n);
  $("qTexto").textContent = preg.q;
  const r = $("resp"); r.value = ""; r.disabled = false; r.classList.remove("mal");
  $("btnResp").disabled = false;
  $("pistaLetras").textContent = "Pista: la palabra tiene " + normaliza(preg.r[0]).length + " letras. Da igual si usas mayúsculas, minúsculas o espacios.";
  mostrar("pregunta"); r.focus({preventScroll:true});
};
$("formResp").addEventListener("submit", ev => {
  ev.preventDefault();
  if(fase !== "pregunta") return;
  const dicho = $("resp").value;
  if(normaliza(dicho) === ""){ $("pistaLetras").textContent = "Escribe tu respuesta antes de enviarla."; $("resp").focus(); return; }
  responder(dicho);
});

/* ---------- Fase 3: resultado ---------- */
function responder(dicho){
  fase = "bloqueo";
  const bien = esCorrecta(dicho, preg), antes = puntos;
  $("resp").disabled = true; $("btnResp").disabled = true;
  if(!bien) $("resp").classList.add("mal");
  puntos += bien ? apuesta : -apuesta;
  historial.push(bien); if(bien) aciertos++;
  if(bien) confetiDe($("resp"), 36);
  animarPuntos(antes, puntos);
  setTimeout(() => {
    pintarMarcador();
    if(puntos >= meta || puntos <= 0) return terminar();
    $("faseRes").className = "panel fase resultado " + (bien ? "bien" : "mal");
    const est = $("resEstado"); est.className = "answer-status show " + (bien ? "ok" : "bad");
    est.textContent = bien ? "¡Respuesta correcta!" : "Respuesta incorrecta";
    $("resDelta").textContent = (bien ? "+" : "−") + apuesta;
    const f = $("resFeed"); f.className = "feedback " + (bien ? "ok" : "bad"); f.innerHTML = "";
    const linea = (t, v) => { const p = document.createElement("p"); p.style.margin = "0 0 6px"; const b = document.createElement("b"); b.textContent = t + " "; p.append(b, v); f.appendChild(p); };
    if(!bien) linea("Tu respuesta:", dicho.trim());
    linea("Respuesta correcta:", preg.r[0].toUpperCase());
    linea("Explicación:", preg.e);
    ronda++; mostrar("resultado"); est.focus({preventScroll:true});
  }, PX.reducido ? 600 : 1300);
}
$("btnSig").onclick = nuevaRonda;

/* ---------- Final: felicitación con los logos ---------- */
function terminar(){
  const gano = puntos >= meta;
  if(gano) guardarProgreso("casino");               // se marca como completado en la sala
  const h = $("finTitulo"); h.textContent = "";
  const mk = t => { const m = document.createElement("mark"); m.textContent = t; return m; };
  if(gano) h.append("¡", mk("Felicitaciones"), "!"); else h.append("¡", mk("Buen intento"), "!");
  $("finIcono").textContent = gano ? "🏆" : "💪";
  $("finSub").textContent = gano
    ? "¡Rompiste la banca! Llegaste a " + puntos + " puntos: excelente manejo del riesgo y del conocimiento."
    : "Te quedaste sin puntos, pero cada pregunta te acercó más al proceso de investigación. ¡Inténtalo de nuevo!";
  const rondas = historial.length;
  $("finStats").innerHTML = "";
  [["Rondas", rondas], ["Aciertos", aciertos + "/" + rondas], ["Mayor apuesta", mayorApuesta]].forEach(([t, v]) => {
    const d = document.createElement("div"), b = document.createElement("b"), s = document.createElement("span");
    b.textContent = v; s.textContent = t; d.append(b, s); $("finStats").appendChild(d);
  });
  $("modalFin").classList.add("show"); $("btnOtra").focus();
  if(gano){ confetiCentro(140); setTimeout(() => confetiCentro(100), 600); }
}

/* ---------- Arranque ---------- */
function jugar(){
  puntos = inicio; ronda = 1; mazo = nuevoMazo(); historial = []; aciertos = 0; mayorApuesta = 0;
  $("modalFin").classList.remove("show");
  $("reglas").hidden = true; $("mesa").hidden = false;
  nuevaRonda();
}
document.querySelectorAll("[data-pts-inicio]").forEach(e => e.textContent = inicio);
document.querySelectorAll("[data-pts-meta]").forEach(e => e.textContent = meta);
$("metaTxt").textContent = "META " + meta;
$("btnEntrar").onclick = jugar;
$("btnOtra").onclick = jugar;
PX.letras("[data-letras]"); PX.logos(); PX.doodles($("doodles"), 10);
})();
