/* =========================================================
   Memoria de la investigación · datos del juego
   Para cambiar preguntas, cartas o puntos, edita solo este archivo.
   ========================================================= */

const CONFIG = {
  puntosPorPregunta: 100,     // lo que suma una pregunta correcta
  maxNombre: 14               // largo máximo del nombre de cada jugador
};

/* Colores de cada jugador (de la paleta del proyecto) */
const JUGADORES = [
  {c:"#E23C48", soft:"#F5CFCD"},   // ponche
  {c:"#203655", soft:"#D3EBEC"},   // marino
  {c:"#F4C95D", soft:"#FBEFC4"}    // miel dorada
];

/* Los 10 pares del tablero (20 cartas): e = emoji · n = nombre (para lectores de pantalla) */
const PARES = [
  {e:"✏️", n:"lápiz"}, {e:"📚", n:"libros"}, {e:"🎓", n:"birrete"}, {e:"📖", n:"libro abierto"}, {e:"🔬", n:"microscopio"},
  {e:"📐", n:"escuadra"}, {e:"🖊️", n:"bolígrafo"}, {e:"📝", n:"nota"}, {e:"🔭", n:"telescopio"}, {e:"🧮", n:"ábaco"}
];

/* 10 preguntas del esquema «El proceso de investigación» (Canales, Alvarado y Pineda, 1986).
   p = pregunta · r = respuesta que se muestra al jugador */
const PREGUNTAS = [
  {p:"¿Cuáles son las 3 fases de la planificación en el proceso de investigación?",
   r:"1ª Problema y objetivo · 2ª Marco teórico · 3ª Diseño metodológico."},
  {p:"¿Qué pregunta responde la 1ª fase (Problema y objetivo)?", r:"¿Qué se investigará?"},
  {p:"¿Qué pregunta responde el Marco teórico?", r:"¿Cuál es la base teórica del problema?"},
  {p:"¿Qué pregunta responde el Diseño metodológico?", r:"¿Cómo se investigará?"},
  {p:"Menciona los tres puntos de la «primera caracterización del problema».",
   r:"Qué se conoce del problema · Aspectos no investigados · Procedimientos y técnicas."},
  {p:"En la 1ª fase, después de caracterizar el problema, ¿qué tres cosas se hacen?",
   r:"Delimitación y definición del problema · Formulación del problema · Formulación de objetivos."},
  {p:"En el Marco teórico, ¿de qué parte la teoría y qué dos elementos se derivan de ella?",
   r:"De la teoría se derivan las hipótesis y las variables (junto con los antecedentes y conocimientos sobre el tema)."},
  {p:"Menciona al menos 4 componentes del Diseño metodológico.",
   r:"Población y muestra · Tipo de estudio · Método de recolección de datos · Procedimientos de recolección · Plan de tabulación y análisis."},
  {p:"¿Qué documento resulta de la planificación y qué etapa viene después?",
   r:"La planificación da como resultado el PROTOCOLO; luego viene la EJECUCIÓN."},
  {p:"Nombra, en orden, las etapas de la ejecución. ¿Qué actividad acompaña a las 3 fases de planificación?",
   r:"Recolección de datos → Presentación de datos → Análisis e interpretación → Conclusiones y recomendaciones → Informe final. Acompaña la REVISIÓN DE LITERATURA."}
];
