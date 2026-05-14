// ═══════════════════════════════════════════════════════════════════════
// Protocolos clínicos de urgencias — Índice por especialidad
// ═══════════════════════════════════════════════════════════════════════
// 24 áreas clínicas y sus protocolos de manejo en urgencias. Diseñado
// como índice navegable: el contenido detallado de cada protocolo se
// encuentra en el Vademécum Clínico del Área II Cartagena, el
// MegaCuaderno IA del HGU Santa Lucía y las guías locales del Servicio
// Murciano de Salud.
//
// Uso EXCLUSIVAMENTE docente. Verificar siempre con protocolos
// actualizados del centro y ficha técnica AEMPS antes de aplicar.
//
// Estructura: cada categoría tiene 'especialidad', 'icon', 'protocolos[]'
// y opcionalmente 'pendiente=true' si está pendiente de ampliar con
// sub-protocolos.
// ═══════════════════════════════════════════════════════════════════════

var VD_PROTOCOLOS_URGENCIAS = [
  {
    id: 'p-adenopatias', especialidad: 'Adenopatías / Bx temporal', icon: '🔬',
    protocolos: ['Criterios de biopsia'],
  },
  {
    id: 'p-alergias', especialidad: 'Alergias', icon: '🤧',
    protocolos: ['Anafilaxia', 'Angioedema'],
  },
  {
    id: 'p-cardiologia', especialidad: 'Cardiología', icon: '🫀',
    protocolos: [
      'Bradicardia',
      'Crisis hipertensiva',
      'Fibrilación auricular',
      'Flutter auricular',
      'Insuficiencia cardíaca',
      'Marcapasos',
      'Pericarditis',
      'Síncope',
      'Síndrome aórtico agudo',
      'Síndrome coronario agudo',
      'Taquicardia paroxística supraventricular',
      'Taquicardia ventricular',
    ],
  },
  {
    id: 'p-cirugia-digestivo', especialidad: 'Cirugía / Digestivo', icon: '🩻',
    protocolos: [
      'Colangitis aguda',
      'Colecistitis aguda',
      'Colitis ulcerosa',
      'Colitis isquémica',
      'Diarrea',
      'Hemorragia digestiva alta',
      'Oclusión intestinal',
      'Pancreatitis',
    ],
  },
  {
    id: 'p-dermatologia', especialidad: 'Dermatología', icon: '🩹',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-endocrinologia', especialidad: 'Endocrinología', icon: '🧪',
    protocolos: [
      'Cetoacidosis diabética',
      'Crisis tirotóxica',
      'Diabetes (manejo agudo)',
      'Insuficiencia suprarrenal',
    ],
  },
  {
    id: 'p-enfermo-terminal', especialidad: 'Enfermo terminal', icon: '🕊️',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-ginecologia', especialidad: 'Ginecología', icon: '🌸',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-hematologia', especialidad: 'Hematología', icon: '🩸',
    protocolos: ['Ferroterapia'],
  },
  {
    id: 'p-hepatologia', especialidad: 'Hepatología', icon: '🟤',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-infecciosas', especialidad: 'Infecciosas', icon: '🦠',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-intoxicaciones', especialidad: 'Intoxicaciones', icon: '☠️',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-neumologia', especialidad: 'Neumología', icon: '🫁',
    protocolos: [
      'Asma (agudización)',
      'Derrame pleural',
      'EPOC (agudización)',
      'Espirometría (interpretación)',
      'Hemoptisis',
      'Oxigenoterapia',
      'Tromboembolismo pulmonar (TEP)',
      'Ventilación mecánica no invasiva (VMNI)',
    ],
  },
  {
    id: 'p-neurologia', especialidad: 'Neurología', icon: '🧠',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-nefrologia', especialidad: 'Nefrología', icon: '💧',
    protocolos: [
      'Fracaso renal agudo',
      'Trastorno fósforo-calcio',
      'Nefroprotección',
    ],
  },
  {
    id: 'p-oftalmologia', especialidad: 'Oftalmología', icon: '👁️',
    protocolos: ['Neuritis óptica', 'Pérdida aguda de agudeza visual'],
  },
  {
    id: 'p-procedimientos', especialidad: 'Procedimientos', icon: '🧰',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-psiquiatria', especialidad: 'Psiquiatría', icon: '🧩',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-radiologia', especialidad: 'Radiología', icon: '🩻',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-reanimacion', especialidad: 'Reanimación', icon: '❤️‍🩹',
    protocolos: [
      'RCP (adulto)',
      'RCP en paciente COVID',
      'Sedación e intubación orotraqueal (IOT)',
      'Ventilación mecánica invasiva',
    ],
  },
  {
    id: 'p-sueroterapia', especialidad: 'Sueroterapia', icon: '💉',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-trastornos-hidroelectroliticos', especialidad: 'Trastornos hidroelectrolíticos', icon: '⚗️',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-urologia', especialidad: 'Urología', icon: '🫧',
    protocolos: [], pendiente: true,
  },
  {
    id: 'p-otros', especialidad: 'Otros', icon: '📂',
    protocolos: ['Valoración geriátrica básica', 'Fibromialgia'],
  },
];

if (typeof window !== 'undefined') {
  window.VD_PROTOCOLOS_URGENCIAS = VD_PROTOCOLOS_URGENCIAS;
}
