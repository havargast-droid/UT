/* =========================================================
   Memoria de la investigación · lógica (1 a 3 jugadores)
   ========================================================= */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const {mezclar, guardarProgreso, confeti, confetiCentro, COLORES} = PX;

/* ---------- Estado ---------- */
let n = 1, nombres = [], puntos, aciertos, turno, cartas, abiertas, bloqueado, pares, mazo, jugadorPreg, intentos, subio;
const estilo = j => "--c:" + j.c + ";--soft:" + j.soft;
const solo = () => n === 1;
const textoTurno = () => solo() ? "Encuentra las 10 parejas" : "Turno de " + nombres[turno];

/* ---------- Pantalla de inicio ---------- */
function pintarInicio(){
  const cont = $("cuantos"); cont.innerHTML = "";
  [1, 2, 3].forEach(k => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip-btn"; b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", k === n);
    b.innerHTML = '<span class="num">' + k + '</span><span class="mini">' + JUGADORES.slice(0, k).map(j => '<i style="background:' + j.c + '"></i>').join("") + '</span><strong>' + (k === 1 ? "jugador" : "jugadores") + '</strong>';
    b.onclick = () => { n = k; pintarInicio(); };
    cont.appendChild(b);
  });
  const prev = [...document.querySelectorAll("#nombres input")].map(i => i.value);
  $("nombres").innerHTML = "";
  for(let i = 0; i < n; i++){
    const l = document.createElement("label");
    l.innerHTML = '<i style="background:' + JUGADORES[i].c + '"></i><span class="sr-only">Nombre del jugador ' + (i + 1) + '</span>';
    const inp = document.createElement("input");
    inp.maxLength = CONFIG.maxNombre; inp.placeholder = n === 1 ? "Tu nombre (opcional)" : "Jugador " + (i + 1); inp.value = prev[i] || "";
    inp.autocomplete = "off"; inp.addEventListener("keydown", ev => { if(ev.key === "Enter") empezar(); });
    l.appendChild(inp); $("nombres").appendChild(l);
  }
}
const leerNombres = () => [...document.querySelectorAll("#nombres input")].map((i, k) => i.value.trim() || (n === 1 ? "Jugador" : "Jugador " + (k + 1)));

/* ---------- Partida ---------- */
function empezar(){ nombres = leerNombres(); $("inicio").hidden = true; $("juego").hidden = false; iniciar(); }
function iniciar(){
  puntos = new Array(n).fill(0); aciertos = new Array(n).fill(0);
  turno = 0; abiertas = []; bloqueado = false; pares = 0; intentos = 0; subio = -1;
  mazo = mezclar(PREGUNTAS.slice());
  cartas = mezclar(PARES.concat(PARES));
  $("modalPreg").classList.remove("show"); $("modalFin").classList.remove("show");
  $("prog").style.transform = "scaleX(0)";
  const t = $("tablero"); t.innerHTML = "";
  cartas.forEach((par, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "carta";
    b.setAttribute("aria-label", "Carta " + (i + 1) + ", boca abajo");
    b.innerHTML = '<div class="in"><div class="cara atras" aria-hidden="true">?</div><div class="cara frente" aria-hidden="true"></div></div>';
    b.querySelector(".frente").textContent = par.e;
    b.onclick = () => voltear(i);
    t.appendChild(b);
  });
  pintarMarcador(); $("turno").textContent = textoTurno();
  t.children[0].focus({preventScroll:true});
}

function pintarMarcador(){
  const cont = $("jugadores"); cont.classList.toggle("solo", solo()); cont.innerHTML = "";
  nombres.forEach((nom, i) => {
    const d = document.createElement("div");
    d.className = "player" + (i === turno && !solo() ? " act" : "") + (i === subio ? " sube" : ""); d.setAttribute("style", estilo(JUGADORES[i]));
    d.innerHTML = '<span class="ins">TU TURNO</span><div class="nom"></div><div class="pts">' + puntos[i] + '</div><div class="det"></div>';
    d.querySelector(".nom").textContent = nom;                       // textContent: los nombres nunca se interpretan como HTML
    d.querySelector(".det").textContent = solo() ? "Intentos " + intentos : "Parejas " + aciertos[i];
    cont.appendChild(d);
  });
  $("parejasTxt").textContent = "PAREJAS " + pares + " / " + PARES.length;
  subio = -1;
}

function voltear(i){
  const el = $("tablero").children[i];
  if(bloqueado || el.classList.contains("up") || el.classList.contains("done")) return;
  el.classList.add("up"); el.setAttribute("aria-label", "Carta " + (i + 1) + ": " + cartas[i].n);
  abiertas.push(i);
  if(abiertas.length < 2) return;
  bloqueado = true; intentos++;
  const [a, b] = abiertas;
  if(cartas[a].e === cartas[b].e){
    setTimeout(() => {
      const j = JUGADORES[Math.min(turno, n - 1)];
      [a, b].forEach(k => {
        const c = $("tablero").children[k];
        c.classList.add("done"); c.setAttribute("style", estilo(j));
        confeti(c.getBoundingClientRect().left + c.offsetWidth / 2, c.getBoundingClientRect().top + c.offsetHeight / 2, [j.c, "#FDFAE9", "#F4C95D"], 12);
      });
      pares++; $("prog").style.transform = "scaleX(" + pares / PARES.length + ")";
      abiertas = []; pintarMarcador();
      setTimeout(abrirPregunta, 700);
    }, 600);
  } else {
    setTimeout(() => {
      [a, b].forEach(k => $("tablero").children[k].classList.add("error"));
      setTimeout(() => {
        [a, b].forEach(k => { const c = $("tablero").children[k]; c.classList.remove("error", "up"); c.setAttribute("aria-label", "Carta " + (k + 1) + ", boca abajo"); });
        abiertas = []; siguienteTurno(); bloqueado = false;
      }, 520);
    }, 650);
  }
}

/* ---------- Pregunta ---------- */
function abrirPregunta(){
  const p = mazo.pop(); jugadorPreg = turno;
  $("boxPreg").setAttribute("style", estilo(JUGADORES[turno]));
  $("qNum").textContent = "PREGUNTA " + (PREGUNTAS.length - mazo.length) + " DE " + PREGUNTAS.length;
  $("qQuien").innerHTML = "<i></i><span></span>"; $("qQuien").querySelector("span").textContent = nombres[turno];
  $("qTexto").textContent = p.p;
  $("qResp").textContent = p.r; $("qResp").hidden = true;
  $("btnVer").hidden = false; $("btnBien").hidden = true; $("btnMal").hidden = true;
  $("qPista").textContent = "Piensa tu respuesta y luego pulsa «Ver respuesta».";
  $("modalPreg").classList.add("show"); $("btnVer").focus();
}
$("btnVer").onclick = () => {
  $("qResp").hidden = false; $("btnVer").hidden = true; $("btnBien").hidden = false; $("btnMal").hidden = false;
  $("qPista").textContent = "Marca si la respuesta fue correcta. Suma " + CONFIG.puntosPorPregunta + " puntos.";
  $("btnBien").focus();
};
$("btnBien").onclick = () => evaluar(true);
$("btnMal").onclick = () => evaluar(false);

function evaluar(bien){
  if(bien){ puntos[jugadorPreg] += CONFIG.puntosPorPregunta; aciertos[jugadorPreg]++; subio = jugadorPreg; confetiCentro(70); }
  $("modalPreg").classList.remove("show");
  if(pares === PARES.length){ pintarMarcador(); setTimeout(terminar, 450); return; }
  siguienteTurno();
  setTimeout(() => { bloqueado = false; }, bien ? 500 : 0);
}
function siguienteTurno(){ if(!solo()) turno = (turno + 1) % n; $("turno").textContent = textoTurno(); pintarMarcador(); }

/* ---------- Final: felicitación ---------- */
function terminar(){
  guardarProgreso("memoria");                       // se marca como completado en la sala
  const total = PREGUNTAS.length * CONFIG.puntosPorPregunta;
  const orden = nombres.map((nom, i) => ({nom, i, p:puntos[i]})).sort((a, b) => b.p - a.p);
  const h = $("finTitulo"); let sub;
  h.textContent = "";
  const mk = t => { const m = document.createElement("mark"); m.textContent = t; return m; };
  if(solo()){
    h.append("¡", mk("Felicitaciones"), ", " + nombres[0] + "!");
    sub = "Completaste el juego de memoria con " + puntos[0] + " de " + total + " puntos en " + intentos + " intentos.";
  } else {
    const ganadores = orden.filter(o => o.p === orden[0].p);
    h.append("¡", mk("Felicitaciones"), "!");
    sub = ganadores.length > 1 ? "¡Empate entre " + ganadores.map(g => g.nom).join(" y ") + " con " + orden[0].p + " puntos!" : "¡Ganó " + orden[0].nom + " con " + orden[0].p + " puntos! Todos aprendieron sobre el proceso de investigación.";
  }
  $("finSub").textContent = sub;
  const lista = $("finLista"); lista.innerHTML = "";
  if(!solo()) orden.forEach(o => {
    const f = document.createElement("div"); f.className = "fila"; f.setAttribute("style", estilo(JUGADORES[o.i]).replace("--soft", "--c-soft"));
    const s = document.createElement("span"); s.textContent = o.nom; const b = document.createElement("b"); b.textContent = o.p;
    f.append(s, b); lista.appendChild(f);
  });
  $("modalFin").classList.add("show"); $("btnOtra").focus();
  confetiCentro(130); setTimeout(() => confetiCentro(90), 600);
}

/* ---------- Botones y arranque ---------- */
$("btnEmpezar").onclick = empezar;
$("btnReiniciar").onclick = iniciar;
$("btnOtra").onclick = iniciar;
$("btnCambiar").onclick = () => { $("modalPreg").classList.remove("show"); $("modalFin").classList.remove("show"); $("juego").hidden = true; $("inicio").hidden = false; };
PX.letras("[data-letras]"); PX.logos(); PX.doodles($("doodles"), 10);
pintarInicio();
})();
