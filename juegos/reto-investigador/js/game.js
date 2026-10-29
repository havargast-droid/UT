/* =========================================================
   Lógica del juego (requiere data.js cargado antes)
   Secciones: estado · utilidades · rotación de preguntas ·
              pregunta · respuestas · flujo · rompecabezas ·
              mural · arranque
   ========================================================= */

/* ---------- Estado ---------- */
const letters = ["A","B","C","D"];
const clueTexts = stages.map(s => s.hint);

let ronda = null;   // preguntas sorteadas para la partida actual: {etapas:[[q],..], lab:[q,..]}
let stageIndex = 0, qIndex = 0, unlocked = 0, answered = false;
let labMode = false, labCompleted = false;
let pieceOrder = [0,1,2,3,4], selectedSlot = null, puzzleSolved = false, piezaNueva = -1;

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove("hide");
const hide = id => $(id).classList.add("hide");

function shuffleArray(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------- Animaciones y efectos ---------- */
const sinMovimiento = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORES_CONFETI = ["#E23C48", "#E99A99", "#203655", "#A7D6D8", "#F4C95D", "#C22A37"];

// Confeti: partículas que salen de (x, y) y caen con la gravedad
function confeti(x, y, n = 36){
  if(sinMovimiento) return;
  const cont = $("confeti");
  for(let i = 0; i < n; i++){
    const p = document.createElement("i");
    const w = 6 + Math.random() * 8, h = 8 + Math.random() * 10;
    p.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${COLORES_CONFETI[i % COLORES_CONFETI.length]};border-radius:${Math.random() < .4 ? "50%" : "2px"}`;
    cont.appendChild(p);
    const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 240;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 70;
    const anim = p.animate([
      {transform:"translate(0,0) rotate(0deg)", opacity:1},
      {transform:`translate(${dx}px,${dy}px) rotate(${Math.random() * 360}deg)`, opacity:1, offset:.45},
      {transform:`translate(${dx * 1.15}px,${dy + 260}px) rotate(${Math.random() * 720 - 360}deg)`, opacity:0}
    ], {duration:1300 + Math.random() * 900, easing:"cubic-bezier(.2,.7,.4,1)"});
    anim.onfinish = () => p.remove();
  }
}
function confetiDe(el, n){
  if(!el) return;
  const r = el.getBoundingClientRect();
  confeti(r.left + r.width / 2, r.top + r.height / 2, n);
}

// Título: cada letra sube con un pequeño retraso (data-inicio = letras ya animadas antes)
function dividirLetras(){
  document.querySelectorAll("[data-letras]").forEach(el => {
    const texto = el.textContent, base = Number(el.dataset.inicio || 0);
    el.textContent = "";
    el.style.setProperty("--d", ".1s");
    [...texto].forEach((c, i) => {
      if(c === " "){ el.appendChild(document.createTextNode(" ")); return; }
      const s = document.createElement("span");
      s.className = "ch"; s.textContent = c; s.style.setProperty("--i", base + i);
      el.appendChild(s);
    });
  });
}

// Garabatos de fondo (círculos, cruces, puntos) que derivan lentamente
function crearDoodles(){
  if(sinMovimiento) return;
  const tipos = ["dd-ring","dd-plus","dd-dot","dd-sq","dd-ring","dd-plus"];
  const colores = ["#A7D6D8","#E99A99","#E23C48","#203655","#A7D6D8","#E99A99"];
  const cont = $("doodles");
  for(let i = 0; i < 10; i++){
    const d = document.createElement("span");
    const tipo = tipos[i % tipos.length];
    const s = tipo === "dd-dot" ? 10 + Math.random() * 14 : 22 + Math.random() * 40;
    d.className = "dd " + tipo;
    d.style.cssText = `--x:${Math.random() * 96}%;--y:${Math.random() * 94}%;--s:${s}px;--c:${colores[(i * 5) % colores.length]};--o:${.28 + Math.random() * .3};` +
      `--t:${14 + Math.random() * 16}s;--dx:${(Math.random() - .5) * 90}px;--dy:${(Math.random() - .5) * 110}px;--rot:${(Math.random() - .5) * 200}deg`;
    cont.appendChild(d);
  }
}

// Reinicia la animación de entrada de la pregunta
function animarEntrada(){
  const q = $("quiz");
  q.classList.remove("anim"); void q.offsetWidth; q.classList.add("anim");
}

// Tarjeta que muestra la pista de la pieza recién ganada
function mostrarPiezaGanada(contenedorId, i){
  const c = $(contenedorId);
  c.innerHTML = `<div class="win-card p${i}"><span class="back-label">Pieza ${i + 1} de 5 · Pista</span>“${clueTexts[i]}”</div>`;
}

/* ---------- Progreso compartido con la sala principal ---------- */
function guardarProgreso(id){
  try{
    const clave = "investigadores-en-accion:progreso";
    const p = JSON.parse(localStorage.getItem(clave)) || {};
    p[id] = true;
    localStorage.setItem(clave, JSON.stringify(p));
  }catch(e){}
}

/* ---------- Rotación de preguntas ---------- */
// Memoria de preguntas ya vistas (localStorage; si no está disponible, solo dura mientras la página siga abierta)
let memoriaRespaldo = {};
const memoria = {
  leer(){
    try { return JSON.parse(localStorage.getItem(CONFIG.claveAlmacenamiento)) || {}; }
    catch(e){ return memoriaRespaldo; }
  },
  guardar(obj){
    memoriaRespaldo = obj;
    try { localStorage.setItem(CONFIG.claveAlmacenamiento, JSON.stringify(obj)); } catch(e){}
  }
};

// Elige n preguntas de un banco sin repetir las ya vistas hasta agotarlo.
// Al empezar un ciclo nuevo evita repetir de inmediato las últimas vistas.
function sortearDelBanco(clave, banco, n){
  n = Math.min(n, banco.length);
  if(n <= 0) return [];
  const mem = memoria.leer();
  let vistas = (mem[clave] || []).filter(i => i < banco.length);
  const todas = banco.map((_, i) => i);

  let elegidas = shuffleArray(todas.filter(i => !vistas.includes(i))).slice(0, n);

  if(elegidas.length < n){                       // el banco se agotó: ciclo nuevo
    const recientes = vistas.slice(-Math.min(n, banco.length - n));
    let resto = shuffleArray(todas.filter(i => !elegidas.includes(i) && !recientes.includes(i)));
    if(resto.length < n - elegidas.length){       // por si faltan, completa con cualquiera
      resto = resto.concat(shuffleArray(todas.filter(i => !elegidas.includes(i) && !resto.includes(i))));
    }
    elegidas = elegidas.concat(resto.slice(0, n - elegidas.length));
    vistas = [];
  }

  mem[clave] = vistas.concat(elegidas);
  memoria.guardar(mem);
  return shuffleArray(elegidas).map(i => banco[i]);
}

// Copia la pregunta mezclando sus opciones (verdadero/falso y abiertas conservan su orden)
function prepararPregunta(q){
  if(q.type === "tf" || q.type === "open" || !q.a) return {...q};
  const orden = shuffleArray(q.a.map((_, i) => i));
  return {...q, a: orden.map(i => q.a[i]), c: orden.indexOf(q.c)};
}

function armarRonda(){
  ronda = {
    etapas: stages.map((s, i) => sortearDelBanco("etapa" + i, s.qs, CONFIG.preguntasPorEtapa).map(prepararPregunta)),
    lab:    sortearDelBanco("lab", labQuestions, CONFIG.casosLaboratorio).map(prepararPregunta)
  };
}

const currentSet      = () => labMode ? ronda.lab : ronda.etapas[stageIndex];
const currentQuestion = () => currentSet()[qIndex];
const totalPreguntas  = () => ronda.etapas.reduce((n, e) => n + e.length, 0) + ronda.lab.length;
const preguntasEtapas = () => ronda.etapas.reduce((n, e) => n + e.length, 0);
const esUltimaDelSet  = () => qIndex === currentSet().length - 1;

function numeroActual(){
  if(labMode) return preguntasEtapas() + qIndex + 1;
  let n = 0;
  for(let i = 0; i < stageIndex; i++) n += ronda.etapas[i].length;
  return n + qIndex + 1;
}

function continueLabel(){
  if(!esUltimaDelSet()) return "Continuar →";
  if(labMode) return "Finalizar laboratorio →";
  if(stageIndex === stages.length - 1) return ronda.lab.length ? "Ir al laboratorio final →" : "Ver mis pistas →";
  return "Completar etapa →";
}

// Rellena los números del texto (total de preguntas) sin dejarlos fijos en el HTML
function pintarTotales(){
  const total = ronda ? totalPreguntas()
    : stages.length * CONFIG.preguntasPorEtapa + CONFIG.casosLaboratorio;
  document.querySelectorAll("[data-total]").forEach(el => el.textContent = total);
}

function cargarImagenes(){
  document.querySelectorAll("[data-logo]").forEach(img => {
    img.src = RUTAS[img.dataset.logo];
    img.onerror = () => { img.style.display = "none"; };
  });
  // el mural es pesado y solo se ve al final: se descarga cuando el navegador está libre
  (window.requestIdleCallback || (f => setTimeout(f, 800)))(() => { $("muralImg").decoding = "async"; $("muralImg").src = RUTAS.mural; });
}

/* ---------- Mensajes y retroalimentación ---------- */
// kind: "ok" | "bad" | "warn" | "info"
function setStatus(kind, text){
  const s = $("answerStatus");
  s.className = `answer-status show ${kind}`;
  s.textContent = text;
}

// kind: "ok" | "bad" | "info"
function showFeedback(kind, html){
  const fb = $("feedback"), toggle = $("feedbackToggleBtn");
  fb.innerHTML = html;
  fb.className = `feedback show ${kind}`;
  toggle.classList.add("show");
  toggle.textContent = "Ocultar retroalimentación";
  toggle.setAttribute("aria-expanded", "true");
}

function enableContinue(){
  $("continueBtn").disabled = false;
  $("continueBtn").textContent = continueLabel();
}

function toggleFeedback(){
  const fb = $("feedback"), btn = $("feedbackToggleBtn");
  if(!fb.textContent.trim()) return;
  const shown = fb.classList.toggle("show");
  btn.textContent = shown ? "Ocultar retroalimentación" : "Mostrar retroalimentación";
  btn.setAttribute("aria-expanded", String(shown));
}

/* ---------- Pregunta actual ---------- */
function render(){
  answered = false;
  const s = stages[stageIndex], q = currentQuestion(), total = totalPreguntas();

  show("quiz"); hide("stageWin"); hide("labIntro"); hide("finalWin");

  $("levelLabel").textContent = labMode
    ? (ronda.lab.length === 1 ? "LABORATORIO FINAL · 1 CASO" : `LABORATORIO FINAL · ${ronda.lab.length} CASOS`)
    : `ETAPA ${stageIndex + 1} DE ${stages.length}`;
  const number = numeroActual();
  $("questionLabel").textContent = `Pregunta ${number} de ${total}`;
  $("progressBar").style.width = `${((number - 1) / total) * 100}%`;
  $("qtopic").textContent = labMode ? "LABORATORIO DE DECISIONES METODOLÓGICAS" : s.title.toUpperCase();

  $("questionInstruction").textContent = q.type === "tf"
    ? "Lee el enunciado y decide si es verdadero o falso."
    : (labMode ? "Analiza el caso y elige la decisión metodológica más adecuada."
               : "Lee la situación y selecciona la alternativa más adecuada.");

  // Quita el prefijo "N. Dificultad · Tipo." del enunciado
  $("question").textContent = q.q.replace(
    /^\d+\.\s*(?:(?:Fácil(?:-media)?|Media(?:-alta)?|Media|Alta)\s*·\s*)?(?:(?:Verdadero o falso|Selección múltiple|Tipo ICFES)\.\s*)?/i, "");

  $("feedback").className = "feedback"; $("feedback").textContent = "";
  $("answerStatus").className = "answer-status"; $("answerStatus").textContent = "";
  const toggle = $("feedbackToggleBtn");
  toggle.className = "secondary feedback-toggle";
  toggle.textContent = "Mostrar retroalimentación";
  toggle.setAttribute("aria-expanded", "false");

  $("continueBtn").disabled = true;
  $("continueBtn").textContent = continueLabel();

  const answers = $("answers");
  if(q.type === "open"){
    answers.innerHTML = `<label class="open-label" for="openAnswer">Escribe tu respuesta para que el facilitador la revise:</label>
      <textarea class="open-answer" id="openAnswer" rows="4" placeholder="Escribe aquí tu respuesta…"></textarea>
      <button class="answer open-send" id="btnOpen">Mostrar respuesta orientadora</button>`;
    $("btnOpen").addEventListener("click", submitOpen);
  } else {
    answers.innerHTML = q.a.map((a, i) =>
      `<button class="answer" data-i="${i}" id="ans${i}" style="--i:${i}"><span class="letter">${q.type === "tf" ? (i === 0 ? "V" : "F") : letters[i]}</span><span>${a}</span></button>`).join("");
  }

  stages.forEach((_, i) => {
    const el = $("stage" + i);
    el.classList.toggle("active", !labMode && i === stageIndex);
    el.classList.toggle("done", i < unlocked);
  });
  animarEntrada();
}

/* ---------- Respuestas ---------- */
function choose(i){
  if(answered) return;
  const q = currentQuestion(), chosen = $("ans" + i);

  if(i !== q.c){
    chosen.classList.add("wrong");
    if(q.type === "tf"){
      answered = true;
      document.querySelectorAll(".answer").forEach(b => b.disabled = true);
      setStatus("bad", "Respuesta incorrecta. En verdadero o falso no hay rebote; revisemos la explicación.");
      showFeedback("bad", `<b>Respuesta incorrecta.</b><br>${q.e}`);
      enableContinue();
    } else {
      chosen.disabled = true;
      setStatus("warn", "Respuesta incorrecta. ¡Rebote! Otro compañero puede intentarlo con una opción diferente.");
    }
    return;
  }

  answered = true;
  chosen.classList.add("correct");
  document.querySelectorAll(".answer").forEach(b => b.disabled = true);
  setStatus("ok", "¡Respuesta correcta!");
  showFeedback("ok", `<b>¡Respuesta correcta!</b><br>${q.e}`);
  enableContinue();
  confetiDe(chosen, 30);
}

function submitOpen(){
  if(answered) return;
  const box = $("openAnswer");
  if(!box.value.trim()){ box.focus(); return; }
  answered = true; box.disabled = true;
  const q = currentQuestion();
  showFeedback("info", `<b>Respuesta orientadora para comparar:</b><br>${q.model}<br><br>${q.e}<br><br>El facilitador puede valorar la respuesta.`);
  setStatus("info", "Respuesta registrada. El facilitador puede revisarla.");
  enableContinue();
  $("btnOpen").disabled = true;
}

/* ---------- Flujo del juego ---------- */
// Cada vez que se pulsa "Comenzar" se sortea una ronda nueva
function begin(){
  armarRonda();
  stageIndex = 0; qIndex = 0; unlocked = 0;
  labMode = false; labCompleted = ronda.lab.length === 0;
  selectedSlot = null; puzzleSolved = false;
  pieceOrder = shuffleArray([0,1,2,3,4]);
  stages.forEach((_, i) => $("stage" + i).classList.remove("done", "active"));
  $("reveal").classList.remove("show");
  $("finalImage").classList.remove("show");
  setPuzzleMessage("");
  renderPuzzle();
  pintarTotales();
  hide("start"); show("game");
  render();
}

function beginLab(){ labMode = true; qIndex = 0; render(); }
function nextStage(){ stageIndex++; qIndex = 0; render(); }

function mostrarFinal(){
  labCompleted = true;
  hide("quiz"); hide("labIntro"); hide("stageWin"); show("finalWin");
  $("progressBar").style.width = "100%";
  renderPuzzle();
  setPuzzleMessage(ronda.lab.length
    ? "¡Laboratorio completado! Ya puedes ordenar las cinco pistas para revelar la imagen."
    : "¡Conseguiste las cinco pistas! Ya puedes ordenarlas para revelar la imagen.");
  setTimeout(() => confetiDe(document.querySelector("#finalWin .big-icon"), 90), 300);
}

function continueGame(){
  if(!answered) return;
  if(!esUltimaDelSet()){ qIndex++; render(); return; }

  if(labMode){ mostrarFinal(); return; }

  unlockPiece(stageIndex);
  if(stageIndex === stages.length - 1){
    if(!ronda.lab.length){ mostrarFinal(); return; }
    hide("quiz"); show("labIntro");
    mostrarPiezaGanada("labPiece", stageIndex);
    $("progressBar").style.width = `${preguntasEtapas() / totalPreguntas() * 100}%`;
    setTimeout(() => confetiDe($("labPiece"), 70), 500);
  } else {
    hide("quiz"); show("stageWin");
    $("winTitle").textContent = `¡Etapa ${stageIndex + 1} completada!`;
    $("winText").textContent = `Has ganado la pieza ${stageIndex + 1} del rompecabezas. Esta es su pista:`;
    mostrarPiezaGanada("winPiece", stageIndex);
    setTimeout(() => confetiDe($("winPiece"), 55), 500);
  }
}

function restart(){
  ronda = null;
  stageIndex = 0; qIndex = 0; unlocked = 0;
  labMode = false; labCompleted = false; selectedSlot = null; puzzleSolved = false;
  pieceOrder = shuffleArray([0,1,2,3,4]);

  show("start"); hide("game");
  $("reveal").classList.remove("show");
  $("finalImage").classList.remove("show");
  setPuzzleMessage("");
  stages.forEach((_, i) => $("stage" + i).classList.remove("done", "active"));
  renderPuzzle();
  pintarTotales();
  $("progressBar").style.width = "0%";
  show("quiz"); hide("stageWin"); hide("labIntro"); hide("finalWin");
}

/* ---------- Rompecabezas ---------- */
function setPuzzleMessage(text){
  const msg = $("puzzleMessage");
  msg.textContent = text;
  msg.classList.toggle("show", !!text);
}

function renderPuzzle(){
  const canArrange = unlocked === 5 && labCompleted && !puzzleSolved;
  $("puzzle").innerHTML = pieceOrder.map((clueIndex, slot) => {
    const isUnlocked = clueIndex < unlocked;
    const selected = selectedSlot === slot;
    const interactive = isUnlocked && canArrange;
    const attrs = interactive
      ? `data-slot="${slot}" aria-label="Pista: ${clueTexts[clueIndex].replace(/"/g, "&quot;")}; posición ${slot + 1}"`
      : "disabled";
    const body = isUnlocked
      ? `<span><span class="back-label">Reverso · Pista</span><span class="clue">“${clueTexts[clueIndex]}”</span></span>`
      : `<span><span class="lock">🔒</span><br><small>Etapa pendiente</small></span>`;
    return `<button type="button" class="piece ${isUnlocked ? "unlocked" : "locked"} ${unlocked === 5 && labCompleted ? "arrangeable" : ""} ${selected ? "selected" : ""} ${slot === piezaNueva ? "nueva" : ""}" id="pieceSlot${slot}" ${attrs}>${body}</button>`;
  }).join("");
  piezaNueva = -1;

  $("pieceCount").textContent = `${unlocked} / 5 piezas`;
  $("puzzleStatus").textContent = `${unlocked} de 5`;
  $("checkOrderBtn").disabled = unlocked < 5 || !labCompleted || puzzleSolved;
  $("shuffleBtn").disabled = unlocked < 5 || !labCompleted || puzzleSolved;
  $("puzzleInstruction").textContent = unlocked < 5
    ? `Las piezas están mezcladas y muestran únicamente el reverso. Supera las etapas para descubrir las cinco pistas (${unlocked}/5).`
    : (puzzleSolved ? "¡Las pistas están en orden! La imagen completa ya fue revelada."
      : (!labCompleted ? "Las cinco pistas están descubiertas. Completa el laboratorio final para poder organizarlas."
        : "Ya están las cinco pistas. Toca una pieza y después otra para intercambiar sus posiciones; ordénalas desde el inicio del proceso hasta los resultados."));
}

function unlockPiece(i){
  unlocked = Math.max(unlocked, i + 1);
  selectedSlot = null;
  piezaNueva = pieceOrder.indexOf(i);   // esa pieza se anima al aparecer
  $("stage" + i).classList.add("done");
  setPuzzleMessage("");
  renderPuzzle();
  if(unlocked === 5 && !labCompleted){
    $("puzzleInstruction").textContent = "¡Las cinco pistas están descubiertas! Completa el laboratorio final para organizarlas.";
    setPuzzleMessage("¡Has conseguido las cinco piezas! Ahora completa el laboratorio final para desbloquear la organización del rompecabezas.");
  }
}

function selectPuzzlePiece(slot){
  if(unlocked < 5 || !labCompleted || puzzleSolved) return;
  if(selectedSlot === null){ selectedSlot = slot; renderPuzzle(); return; }
  if(selectedSlot === slot){ selectedSlot = null; renderPuzzle(); return; }
  const otra = selectedSlot;
  [pieceOrder[selectedSlot], pieceOrder[slot]] = [pieceOrder[slot], pieceOrder[selectedSlot]];
  selectedSlot = null;
  renderPuzzle();
  [otra, slot].forEach(s => $("pieceSlot" + s).classList.add("pop"));   // las dos piezas "saltan"
}

function checkPuzzleOrder(){
  if(unlocked < 5 || !labCompleted || puzzleSolved) return;
  if(pieceOrder.every((n, i) => n === i)){
    puzzleSolved = true; selectedSlot = null;
    guardarProgreso("reto");
    renderPuzzle();
    $("finalImage").classList.add("show");
    $("reveal").classList.add("show");
    setPuzzleMessage("¡Correcto! Ordenaste las pistas y revelaste la imagen final.");
    $("finalImage").scrollIntoView({behavior: "smooth", block: "center"});
    // celebración: tres ráfagas de confeti
    const w = innerWidth, h = innerHeight;
    confeti(w * .5, h * .35, 110);
    setTimeout(() => confeti(w * .2, h * .45, 70), 350);
    setTimeout(() => confeti(w * .8, h * .45, 70), 650);
  } else {
    setPuzzleMessage("Todavía no están en el orden correcto. Recuerda: primero se identifica qué investigar, luego qué se quiere alcanzar, después se revisa el conocimiento previo, se define cómo investigar y finalmente se interpretan las evidencias.");
    const pz = $("puzzle");
    pz.classList.add("shake");
    setTimeout(() => pz.classList.remove("shake"), 600);
  }
}

function shufflePuzzle(){
  if(unlocked < 5 || !labCompleted || puzzleSolved) return;
  pieceOrder = shuffleArray([0,1,2,3,4]);
  selectedSlot = null;
  setPuzzleMessage("Las piezas se han mezclado de nuevo. ¡Intenta ordenarlas!");
  renderPuzzle();
}

/* ---------- Mural en pantalla completa ---------- */
function openFinalMuralFullscreen(){
  const mural = $("finalImage");
  if(!mural.classList.contains("show")) return;
  if(mural.requestFullscreen){ mural.requestFullscreen().catch(() => {}); }
  else if(mural.webkitRequestFullscreen){ mural.webkitRequestFullscreen(); }
}

/* ---------- Arranque ---------- */
function setup(){
  dividirLetras();
  crearDoodles();
  $("stageRow").innerHTML = stages.map((s, i) =>
    `<div class="stage" id="stage${i}"><span class="num">${i + 1}</span><strong>${s.short}</strong></div>`).join("");
  pieceOrder = shuffleArray([0,1,2,3,4]);
  renderPuzzle();
  cargarImagenes();
  pintarTotales();

  // Eventos (sin onclick en el HTML)
  $("btnBegin").addEventListener("click", begin);
  $("btnBeginLab").addEventListener("click", beginLab);
  $("btnNextStage").addEventListener("click", nextStage);
  $("continueBtn").addEventListener("click", continueGame);
  $("feedbackToggleBtn").addEventListener("click", toggleFeedback);
  $("checkOrderBtn").addEventListener("click", checkPuzzleOrder);
  $("shuffleBtn").addEventListener("click", shufflePuzzle);
  document.querySelectorAll("[data-restart]").forEach(b => b.addEventListener("click", restart));

  $("answers").addEventListener("click", e => {
    const b = e.target.closest("button.answer[data-i]");
    if(b) choose(Number(b.dataset.i));
  });
  $("puzzle").addEventListener("click", e => {
    const b = e.target.closest("button.piece[data-slot]");
    if(b) selectPuzzlePiece(Number(b.dataset.slot));
  });
  $("finalImage").addEventListener("click", e => {
    if(e.target.closest("figcaption")) return;
    openFinalMuralFullscreen();
  });
}

setup();
