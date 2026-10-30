/* =========================================================
   Casino del saber · reglas y banco de preguntas
   Para cambiar las reglas o agregar preguntas, edita solo este archivo.

   Cada pregunta se responde con UNA palabra que el jugador escribe.
   Campos:
     etapa = tema que se muestra antes de apostar
     n     = dificultad 1 (fácil) a 3 (difícil)
     q     = enunciado (el hueco se marca con ______)
     r     = respuestas válidas (la primera es la que se muestra como correcta)
     e     = explicación que se muestra después de responder
   Al comparar se ignoran mayúsculas, minúsculas, espacios y tildes
   («Ejecucion», «EJECUCIÓN» y « ejecución » son la misma respuesta).
   Las preguntas no se repiten hasta agotar el banco.
   ========================================================= */

const REGLAS = {
  inicio: 100,        // puntos con los que se empieza
  meta: 1000,         // al llegar (o superar) este valor, se gana
  apuestaMin: 10,     // apuesta mínima
  paso: 10            // las apuestas van de 10 en 10
};

const PREGUNTAS = [
  // ---- Nivel 1 ----
  {etapa:"Problema", n:1, q:"Toda investigación comienza con un ______ que necesitamos comprender.",
   r:["problema"], e:"La 1ª fase de la planificación es el problema y el objetivo: define QUÉ se investigará."},
  {etapa:"Objetivos", n:1, q:"Lo que queremos alcanzar con la investigación se expresa en los ______.",
   r:["objetivos"], e:"Los objetivos se formulan en la 1ª fase, junto con el problema."},
  {etapa:"Marco teórico", n:1, q:"El marco ______ reúne el conocimiento previo sobre el tema.",
   r:["teórico"], e:"El marco teórico responde: ¿cuál es la base teórica del problema?"},
  {etapa:"Metodología", n:1, q:"El diseño ______ define cómo se investigará.",
   r:["metodológico"], e:"El diseño metodológico responde: ¿cómo se investigará?"},
  {etapa:"General", n:1, q:"El documento que resulta de la planificación se llama ______.",
   r:["protocolo"], e:"Planificar produce el protocolo, que guía la ejecución."},
  {etapa:"General", n:1, q:"Después de planificar, la investigación pasa a la etapa de ______.",
   r:["ejecución"], e:"Primero se planifica y luego se ejecuta el protocolo."},
  {etapa:"Resultados", n:1, q:"El último paso de la ejecución es el informe ______.",
   r:["final"], e:"La ejecución termina con el informe final."},
  {etapa:"General", n:1, q:"La pregunta del diseño metodológico es: ¿______ se investigará?",
   r:["cómo"], e:"El diseño metodológico define CÓMO se hará la investigación."},

  // ---- Nivel 2 ----
  {etapa:"Marco teórico", n:2, q:"De la teoría se derivan las hipótesis y las ______.",
   r:["variables", "variable"], e:"Hipótesis y variables se derivan del marco teórico."},
  {etapa:"Problema", n:2, q:"Antes de definir el problema se hace una primera ______ del problema (qué se conoce, qué falta por investigar).",
   r:["caracterización"], e:"La primera caracterización reúne lo que se conoce, lo no investigado y los procedimientos y técnicas."},
  {etapa:"Metodología", n:2, q:"Elegir si el estudio es descriptivo, correlacional o experimental es definir el tipo de ______.",
   r:["estudio"], e:"El tipo de estudio es un componente del diseño metodológico."},
  {etapa:"Metodología", n:2, q:"«Población y ______» define a quiénes se estudiará en la investigación.",
   r:["muestra"], e:"Población y muestra es uno de los componentes del diseño metodológico."},
  {etapa:"Resultados", n:2, q:"En la ejecución, después de la recolección viene la ______ de datos (tablas y gráficos).",
   r:["presentación"], e:"Orden: recolección → presentación → análisis e interpretación → conclusiones → informe."},
  {etapa:"Resultados", n:2, q:"Después de presentar los datos se hace su análisis e ______.",
   r:["interpretación"], e:"Las conclusiones salen del análisis e interpretación de los datos."},
  {etapa:"General", n:2, q:"La revisión de ______ acompaña las tres fases de la planificación.",
   r:["literatura"], e:"La revisión de literatura acompaña todo el proceso de planificación."},
  {etapa:"Objetivos", n:2, q:"El objetivo ______ resume lo que se quiere lograr en toda la investigación; los específicos lo desglosan.",
   r:["general"], e:"El objetivo general se desglosa en objetivos específicos."},
  {etapa:"Marco teórico", n:2, q:"Una suposición que se plantea para ponerla a prueba en la investigación se llama ______.",
   r:["hipótesis"], e:"Las hipótesis se derivan de la teoría y se contrastan con los datos."},
  {etapa:"Metodología", n:2, q:"El plan de ______ y análisis define cómo se organizarán los datos (conteos, tablas) antes de analizarlos.",
   r:["tabulación"], e:"El plan de tabulación y análisis hace parte del diseño metodológico."},

  // ---- Nivel 3 ----
  {etapa:"Resultados", n:3, q:"Las ______ y recomendaciones se apoyan en el análisis e interpretación de los datos.",
   r:["conclusiones"], e:"Las conclusiones se sustentan en la evidencia analizada."},
  {etapa:"Problema", n:3, q:"Acotar un tema amplio para poder investigarlo se llama ______ del problema.",
   r:["delimitación"], e:"Después de la caracterización se delimita y define el problema."},
  {etapa:"Metodología", n:3, q:"Entrevistas, encuestas y observación son métodos de ______ de datos.",
   r:["recolección"], e:"El método de recolección de datos es un componente del diseño metodológico."},
  {etapa:"Marco teórico", n:3, q:"Los ______ son los estudios previos sobre el tema que se reúnen en el marco teórico.",
   r:["antecedentes"], e:"Los antecedentes y conocimientos sobre el tema alimentan el marco teórico."},
  {etapa:"Problema", n:3, q:"Un problema de investigación suele formularse como una ______ clara.",
   r:["pregunta"], e:"Formular el problema como pregunta delimita lo que se va a investigar."},
  {etapa:"Marco teórico", n:3, q:"Una característica que puede cambiar y medirse en un estudio (edad, tiempo, rendimiento) se llama ______.",
   r:["variable", "variables"], e:"Las variables se derivan de la teoría y se miden durante la ejecución."},
  {etapa:"Objetivos", n:3, q:"Los objetivos ______ desglosan el objetivo general en pasos concretos.",
   r:["específicos"], e:"Los objetivos específicos concretan lo que se hará para lograr el objetivo general."},
  {etapa:"General", n:3, q:"¿Cuántas fases tiene la planificación? (escribe el número en letras)",
   r:["tres", "3"], e:"Son tres: problema y objetivo, marco teórico y diseño metodológico."}
];
