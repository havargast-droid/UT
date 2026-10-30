/* =========================================================
   Investigadores en acción · Formación 1
   Datos de la página principal (sala de cómputo)
   Para cambiar nombres, textos o enlaces de los juegos, edita solo este archivo.
   ========================================================= */

const SALA = {
  titulo:   "Investigadores en acción",
  etiqueta: "Formación 1",
  slogan:   "Dale play a tu curiosidad",
  claveProgreso: "investigadores-en-accion:progreso",   // la comparten la sala y los juegos

  // Información del proyecto: las 5 etapas del proceso (cada una guarda una pista del rompecabezas)
  proceso: [
    {n:1, corto:"Problema",     pista:"Toda investigación comienza con algo que necesitamos comprender."},
    {n:2, corto:"Objetivos",    pista:"Para avanzar, debemos saber qué queremos alcanzar."},
    {n:3, corto:"Marco teórico",pista:"El conocimiento previo ilumina el camino."},
    {n:4, corto:"Metodología",  pista:"Una pregunta necesita un camino para encontrar su respuesta."},
    {n:5, corto:"Resultados",   pista:"Las evidencias permiten descubrir qué aprendimos."}
  ],

  // Frases que rota el investigador de la sala (burbuja de diálogo)
  frases: [
    "¡Bienvenidos, equipo! Elijan una estación.",
    "¿Qué se investigará?",
    "¿Cuál es la base teórica del problema?",
    "¿Cómo se investigará?",
    "Cada pregunta es una pista.",
    "Primero se planifica, luego se ejecuta."
  ],

  // Los tres juegos. "estacion" enlaza con la máquina de la sala: pc1 · pc2 · arcade (la máquina del fondo, hoy el casino)
  juegos: [
    { id:"reto", estacion:"pc1", nombre:"El reto del investigador", tipo:"Quiz + rompecabezas", icono:"puzzle",
      desc:"Responde una pregunta en cada etapa, gana las piezas del rompecabezas y ordena las pistas para revelar el mural del proceso de investigación.",
      chips:["5 etapas","Rompecabezas"], url:"juegos/reto-investigador/index.html", disponible:true },

    { id:"memoria", estacion:"pc2", nombre:"Memoria de la investigación", tipo:"Parejas + preguntas", icono:"cartas",
      desc:"Voltea las cartas y encuentra las parejas. Cada pareja abre una pregunta sobre el proceso de investigación. Juega solo, en dúo o en trío.",
      chips:["1 a 3 jugadores","Parejas"], url:"juegos/memoria/index.html", disponible:true },

    { id:"casino", estacion:"arcade", nombre:"Casino del saber", tipo:"Apuestas + respuesta escrita", icono:"casino",
      desc:"Empiezas con 100 puntos. Apuesta antes de cada pregunta y responde escribiendo una sola palabra: si aciertas, duplicas tu apuesta; si fallas, la pierdes. ¡Llega a 1000!",
      chips:["1 jugador","Apuestas"], url:"juegos/casino/index.html", disponible:true }
  ]
};
