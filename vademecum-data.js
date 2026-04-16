// ═══════════════════════════════════════════════════════════
// VADEMÉCUM CLÍNICO — Área II Cartagena
// Datos clínicos docentes basados en:
//   - Protocolos HGU Santa Lucía
//   - Guías SEMES 2022
//   - Manual de Urgencias pediátricas SEUP 2024
//   - ERC 2021, ESC 2024, ATLS 11th Ed. 2025
//   - AEP 2024, SEMFyC
//
// Todas las dosis son ORIENTATIVAS y deben verificarse con la
// ficha técnica del fármaco y el protocolo local antes de
// prescribir. Responsabilidad del prescriptor.
// ═══════════════════════════════════════════════════════════

var VD_SYSTEMS = [
  { id: 'cardio',    icon: '❤️', name: 'Cardiovascular' },
  { id: 'resp',      icon: '🫁', name: 'Respiratorio' },
  { id: 'neuro',     icon: '🧠', name: 'Neurológico' },
  { id: 'digest',    icon: '🍽️', name: 'Digestivo' },
  { id: 'infect',    icon: '🦠', name: 'Infeccioso' },
  { id: 'metab',     icon: '⚗️', name: 'Metabólico / Endocrino' },
  { id: 'renal',     icon: '💧', name: 'Nefro-urinario' },
  { id: 'trauma',    icon: '🚑', name: 'Trauma' },
  { id: 'tox',       icon: '☠️', name: 'Toxicología' },
  { id: 'alergia',   icon: '🌸', name: 'Alergia / Anafilaxia' },
  { id: 'psiq',      icon: '💬', name: 'Psiquiatría' },
  { id: 'ob',        icon: '🤰', name: 'Obstetricia' },
];

// ═══════════════════════════════════════════════════════════
//  CONDITIONS
// ═══════════════════════════════════════════════════════════
var VD_CONDITIONS = [

  // ── CARDIOVASCULAR ──
  {
    id: 'sca',
    system: 'cardio',
    env: 'adult',
    name: 'Síndrome Coronario Agudo (SCA)',
    subtitle: 'Dolor torácico con sospecha isquémica · Código Infarto',
    summary: 'Dolor torácico opresivo retroesternal, irradiado, con cortejo vegetativo. ECG en <10 min. Clasificar en SCACEST (ascenso ST) o SCASEST.',
    diagnosis: [
      '<strong>ECG 12 derivaciones en <10 min</strong> de llegada',
      'Troponina ultrasensible: basal y a las 1-3h',
      'SCACEST: ascenso ST ≥1 mm en ≥2 derivaciones contiguas',
      'SCASEST: descenso ST, inversión onda T, troponina +'
    ],
    treatment: [
      'Monitorización + oxígeno si SatO₂ <90%',
      'AAS 300 mg masticado',
      'Segundo antiagregante: Clopidogrel 300-600 mg / Ticagrelor 180 mg / Prasugrel 60 mg',
      'Anticoagulación: HBPM (enoxaparina) o HNF',
      'Nitroglicerina SL si dolor (no si TAS<90 o VD)',
      'Morfina IV si dolor persistente',
      'SCACEST: <strong>activar Código Infarto</strong> → ICP primaria <120 min o fibrinolisis <30 min'
    ],
    drugs: [
      { name: 'AAS', route: 'VO', dose: '300 mg dosis de carga → 100 mg/24h', note: 'Masticado al inicio' },
      { name: 'Clopidogrel', route: 'VO', dose: '300-600 mg carga → 75 mg/24h' },
      { name: 'Ticagrelor', route: 'VO', dose: '180 mg carga → 90 mg/12h' },
      { name: 'Enoxaparina', route: 'SC/IV', dose: '1 mg/kg/12h SC o 30 mg IV bolo', perKg: [1, 1], unit: 'mg', cap: 100, note: 'Ajustar a función renal' },
      { name: 'Nitroglicerina', route: 'SL/IV', dose: 'SL: 0,4 mg c/5 min (máx 3). IV: 5-200 μg/min' },
      { name: 'Morfina', route: 'IV', dose: '2-4 mg IV; repetir c/5-15 min', perKg: [0.05, 0.1], unit: 'mg', note: 'Titular por dolor' },
      { name: 'Atorvastatina', route: 'VO', dose: '80 mg dosis alta precoz' }
    ],
    scales: [
      { id: 'grace', name: 'GRACE Score' },
      { id: 'timi', name: 'TIMI SCASEST' },
      { id: 'heart', name: 'HEART Score' }
    ],
    redFlags: [
      'Dolor >20 min que no cede con nitritos',
      'Hipotensión, bradicardia, shock',
      'Arritmias malignas (TV/FV)',
      'Edema agudo de pulmón',
      'Dolor + déficit neurológico (considerar disección)'
    ],
    sources: 'ESC 2023 NSTEMI · ESC 2023 STEMI · Código Infarto Murcia 2018.'
  },

  {
    id: 'icc-aguda',
    system: 'cardio',
    env: 'adult',
    name: 'Insuficiencia Cardíaca Aguda · EAP',
    subtitle: 'Disnea, ortopnea, crepitantes, congestión',
    summary: 'Descompensación aguda (de novo o sobre crónica). Clasificación por perfil de congestión (húmedo/seco) y perfusión (frío/caliente).',
    diagnosis: [
      'Clínica: disnea brusca, ortopnea, DPN, edemas',
      'Exploración: crepitantes, 3R, ingurgitación yugular, edemas',
      'Rx tórax: redistribución, líneas B, derrame pleural, cardiomegalia',
      'BNP/NT-proBNP: >400/450 pg/mL confirma IC',
      'ECG: buscar causa precipitante (FA, SCA)',
      'Ecografía pulmonar: líneas B múltiples bilaterales'
    ],
    treatment: [
      '<strong>Posición Fowler</strong> (sentado)',
      'O₂ para SatO₂ >90-94%',
      'VMNI (CPAP/BiPAP) si insuficiencia respiratoria o hipercapnia',
      'Furosemida IV bolo',
      'Nitroglicerina IV si TAS>110 mmHg',
      'Si shock cardiogénico: noradrenalina + dobutamina; considerar UCI',
      'Morfina 2-4 mg IV si ansiedad/disnea refractaria',
      'Tratar precipitante: FA, isquemia, HTA, infección'
    ],
    drugs: [
      { name: 'Furosemida', route: 'IV', dose: '20-40 mg IV bolo; luego 40-80 mg c/6-8h', perKg: [0.5, 1], unit: 'mg', cap: 80, note: 'Doble de dosis habitual en crónicos' },
      { name: 'Nitroglicerina', route: 'IV', dose: '10-20 μg/min inicio → 5-200 μg/min' },
      { name: 'Morfina', route: 'IV', dose: '2-4 mg IV', perKg: [0.05, 0.1], unit: 'mg' },
      { name: 'Noradrenalina', route: 'IV', dose: '0,05-0,5 μg/kg/min', perKg: [0.05, 0.5], unit: 'μg/min', note: 'Primera elección en shock cardiogénico' },
      { name: 'Dobutamina', route: 'IV', dose: '2-20 μg/kg/min', perKg: [2, 20], unit: 'μg/min' }
    ],
    scales: [
      { id: 'news2', name: 'NEWS2' }
    ],
    redFlags: [
      'SatO₂ <90% pese a O₂',
      'TAS <90 mmHg (shock cardiogénico)',
      'Anuria',
      'Acidosis láctica',
      'Alteración de la conciencia'
    ],
    sources: 'ESC 2021 HF Guidelines · Protocolo IC aguda HGUSL.'
  },

  {
    id: 'fa',
    system: 'cardio',
    env: 'adult',
    name: 'Fibrilación Auricular',
    subtitle: 'Arritmia supraventricular irregular',
    summary: 'FA con respuesta ventricular rápida. Decidir: control de frecuencia vs control de ritmo; y anticoagulación según CHA₂DS₂-VASc.',
    diagnosis: [
      'ECG: irregular irregular, sin onda P',
      'Evaluar estabilidad hemodinámica',
      'Buscar causa: tirotoxicosis, sepsis, IC, OH, SCA',
      'Ecocardiograma (no urgente salvo sospecha trombo AI)'
    ],
    treatment: [
      '<strong>Si inestabilidad</strong> → cardioversión eléctrica sincronizada (100-200 J)',
      'Control de FC: betabloqueante, calcioantagonista o digoxina',
      'Control de ritmo: flecainida, amiodarona, o CVE si <48h',
      'Anticoagulación según CHA₂DS₂-VASc (≥2 hombres / ≥3 mujeres)',
      'Si FA >48h: anticoagular 3 sem antes de CVE o ETE',
      'Tratar factor precipitante'
    ],
    drugs: [
      { name: 'Metoprolol', route: 'IV', dose: '2,5-5 mg IV lento c/5 min (máx 15 mg)' },
      { name: 'Bisoprolol', route: 'VO', dose: '2,5-10 mg/24h' },
      { name: 'Diltiazem', route: 'IV', dose: '0,25 mg/kg IV en 2 min', perKg: [0.25, 0.25], unit: 'mg' },
      { name: 'Digoxina', route: 'IV', dose: '0,25 mg IV c/2h (máx 1,5 mg)' },
      { name: 'Flecainida', route: 'VO/IV', dose: '2 mg/kg IV en 10 min (máx 150 mg) o 200-300 mg VO', perKg: [2, 2], unit: 'mg', cap: 150, note: 'Contraindicada si cardiopatía estructural' },
      { name: 'Amiodarona', route: 'IV', dose: '5 mg/kg IV en 20 min → 1200 mg/24h', perKg: [5, 5], unit: 'mg', cap: 300 }
    ],
    scales: [
      { id: 'chads-vasc', name: 'CHA₂DS₂-VASc' },
      { id: 'hasbled', name: 'HAS-BLED' }
    ],
    redFlags: [
      'Inestabilidad hemodinámica',
      'Dolor torácico anginoso',
      'Signos de bajo gasto',
      'FV/TV asociada'
    ],
    sources: 'ESC 2024 AF Guidelines.'
  },

  // ── RESPIRATORIO ──
  {
    id: 'asma-agudo',
    system: 'resp',
    env: 'both',
    name: 'Crisis Asmática',
    subtitle: 'Agudización del asma bronquial',
    summary: 'Disnea, sibilancias, opresión torácica con reducción del flujo espiratorio. Clasificar gravedad por clínica + FEV1/PEF + SatO₂.',
    diagnosis: [
      'Clínica: disnea, sibilancias, tos, opresión',
      'Medir PEF / FEV1 si posible',
      'SatO₂ y gasometría si grave',
      '<strong>Leve</strong>: PEF >70%, FR<25, SatO₂>95%',
      '<strong>Moderada</strong>: PEF 50-70%, FR 25-30, SatO₂ 92-95%',
      '<strong>Grave</strong>: PEF <50%, FR>30, SatO₂<92%, uso musculatura accesoria',
      '<strong>Vital</strong>: tórax silente, bradicardia, cianosis, coma'
    ],
    treatment: [
      'O₂ para SatO₂ ≥93% (94-98% en niños)',
      'Salbutamol + ipratropio nebulizado cada 20 min × 3',
      'Corticoide sistémico (VO si tolera)',
      'Sulfato de magnesio IV si grave',
      'Considerar adrenalina IM si riesgo vital',
      'UCI si: PCR, agotamiento, alteración de conciencia, PaCO₂ normal o elevada'
    ],
    drugs: [
      { name: 'Salbutamol nebulizado', route: 'Neb', dose: 'Adulto: 2,5-5 mg (0,5-1 ml de 5 mg/ml) c/20 min × 3. Niños: 0,15 mg/kg (mín 2,5 mg, máx 5 mg)', perKg: [0.15, 0.15], unit: 'mg', cap: 5 },
      { name: 'Salbutamol MDI + cámara', route: 'Inh', dose: '4-10 pulsaciones c/20 min × 3 (niños: 2-4 pulsaciones/c 20 min)' },
      { name: 'Ipratropio nebulizado', route: 'Neb', dose: 'Adulto: 500 μg. Niños: 250 μg. Asociar al salbutamol' },
      { name: 'Metilprednisolona', route: 'IV', dose: '1-2 mg/kg (máx 125 mg)', perKg: [1, 2], unit: 'mg', cap: 125 },
      { name: 'Prednisona', route: 'VO', dose: '1 mg/kg/24h × 5-7 días (máx 60 mg)', perKg: [1, 1], unit: 'mg', cap: 60 },
      { name: 'Sulfato de magnesio', route: 'IV', dose: '40 mg/kg en 20 min (máx 2 g)', perKg: [40, 40], unit: 'mg', cap: 2000, note: 'Solo en crisis graves refractarias' },
      { name: 'Adrenalina', route: 'IM', dose: '0,01 mg/kg IM cara lateral muslo (máx 0,5 mg)', perKg: [0.01, 0.01], unit: 'mg', cap: 0.5, note: 'Solo si riesgo vital o anafilaxia' }
    ],
    scales: [
      { id: 'news2', name: 'NEWS2' }
    ],
    redFlags: [
      '<strong>Tórax silente</strong>',
      'Bradicardia, hipotensión',
      'Cianosis',
      'Alteración de la conciencia',
      'SatO₂ <90% pese a O₂',
      'PaCO₂ normal o elevada'
    ],
    sources: 'GEMA 5.5 (2024) · GINA 2024 · SEPAR.'
  },

  {
    id: 'epoc-agudo',
    system: 'resp',
    env: 'adult',
    name: 'Agudización EPOC',
    subtitle: 'Exacerbación aguda de la EPOC',
    summary: 'Empeoramiento agudo de síntomas respiratorios con cambio de tratamiento. Causas: infección, contaminación, TEP, ICC.',
    diagnosis: [
      'Criterios de Anthonisen: disnea, esputo, purulencia',
      'Rx tórax: descartar neumonía, neumotórax',
      'ECG, analítica con PCR',
      'Gasometría arterial si SatO₂<92%',
      'Valorar comorbilidades: ICC, TEP, neumonía'
    ],
    treatment: [
      'O₂ controlado (objetivo SatO₂ 88-92%)',
      'Broncodilatadores nebulizados (salbutamol + ipratropio)',
      'Corticoides sistémicos 5 días',
      'Antibiótico si ≥2 criterios Anthonisen o ventilación mecánica',
      'VMNI si acidosis respiratoria (pH<7,35 + PaCO₂>45)',
      'Tratar comorbilidad'
    ],
    drugs: [
      { name: 'Salbutamol nebulizado', route: 'Neb', dose: '2,5-5 mg c/4-6h' },
      { name: 'Ipratropio nebulizado', route: 'Neb', dose: '500 μg c/6h' },
      { name: 'Metilprednisolona', route: 'IV', dose: '40 mg IV c/24h' },
      { name: 'Prednisona', route: 'VO', dose: '40 mg/24h × 5 días' },
      { name: 'Amoxicilina/clavulánico', route: 'VO/IV', dose: '875/125 mg c/8h VO o 1-2 g/200 mg c/8h IV' },
      { name: 'Levofloxacino', route: 'VO/IV', dose: '500 mg/24h × 5 días' }
    ],
    scales: [
      { id: 'decaf', name: 'DECAF' },
      { id: 'bap65', name: 'BAP-65' },
      { id: 'news2', name: 'NEWS2' }
    ],
    redFlags: [
      'Acidosis respiratoria (pH<7,25)',
      'Alteración de la conciencia',
      'Shock',
      'Inestabilidad hemodinámica'
    ],
    sources: 'GOLD 2024 · GesEPOC 2021.'
  },

  {
    id: 'nac',
    system: 'resp',
    env: 'both',
    name: 'Neumonía Adquirida en la Comunidad',
    subtitle: 'Infección del parénquima pulmonar',
    summary: 'Fiebre, tos, expectoración purulenta, disnea, dolor pleurítico. Valorar gravedad con CURB-65 (adulto) o criterios pediátricos.',
    diagnosis: [
      'Clínica compatible + <strong>Rx tórax con infiltrado</strong>',
      'Analítica: hemograma, PCR, procalcitonina',
      'Gasometría si SatO₂<92%',
      'Hemocultivos si grave',
      'Antígeno neumococo y legionella en orina si grave'
    ],
    treatment: [
      'Adulto leve (CURB-65 0-1): tratamiento ambulatorio',
      'Adulto moderado (CURB-65 2): ingreso planta',
      'Adulto grave (CURB-65 ≥3 o PSI V): UCI',
      'Niños: ingreso si <6m, SatO₂<92%, rechazo VO, afectación importante',
      'O₂, fluidoterapia, antibiótico empírico precoz (<4h)'
    ],
    drugs: [
      { name: 'Amoxicilina', route: 'VO', dose: 'Adulto: 1 g c/8h × 7 días. Niños: 80-90 mg/kg/día dividido en 3 dosis (máx 3 g/día)', perKg: [25, 30], unit: 'mg', cap: 1000, note: 'Primera línea en niños y adultos jóvenes sin factores de riesgo' },
      { name: 'Amoxicilina/clavulánico', route: 'VO/IV', dose: 'Adulto: 875/125 mg c/8h VO o 1-2 g IV c/8h. Niños: 80-90 mg/kg/día de amoxicilina', perKg: [25, 30], unit: 'mg', cap: 875 },
      { name: 'Azitromicina', route: 'VO', dose: 'Adulto: 500 mg/24h × 3 días. Niños: 10 mg/kg/24h (máx 500 mg)', perKg: [10, 10], unit: 'mg', cap: 500, note: 'Asociar a beta-lactámico en NAC grave' },
      { name: 'Levofloxacino', route: 'VO/IV', dose: '500-750 mg/24h × 5-7 días', note: 'Si alergia a beta-lactámicos' },
      { name: 'Ceftriaxona', route: 'IV', dose: 'Adulto: 1-2 g/24h. Niños: 50-75 mg/kg/24h (máx 2 g)', perKg: [50, 75], unit: 'mg', cap: 2000 }
    ],
    scales: [
      { id: 'curb65', name: 'CURB-65' },
      { id: 'psi', name: 'Fine/PORT' },
      { id: 'news2', name: 'NEWS2' }
    ],
    redFlags: [
      'SatO₂ <90% pese a O₂',
      'TAS<90 / confusión',
      'FR >30 rpm',
      'Sepsis',
      'Derrame pleural significativo'
    ],
    sources: 'SEPAR 2021 · AEP 2024 · Protocolo HGUSL.'
  },

  {
    id: 'bronquiolitis',
    system: 'resp',
    env: 'ped',
    name: 'Bronquiolitis',
    subtitle: 'Lactante <24m con sibilancias',
    summary: 'Primer episodio de sibilancias en lactante menor de 24 meses en contexto de catarro. Agente más frecuente: VRS.',
    diagnosis: [
      'Lactante <24m, primer episodio',
      'Clínica: rinorrea, tos, taquipnea, sibilancias, crepitantes',
      'SatO₂ (no requiere otras pruebas en leve)',
      'Rx tórax NO rutinaria (solo si mala evolución)',
      'Test VRS solo si decisión de ingreso cohortizado'
    ],
    treatment: [
      '<strong>Soporte</strong>: hidratación, desobstrucción nasal',
      'O₂ si SatO₂ <92%',
      'SatO₂ objetivo: ≥92% despierto, ≥90% dormido',
      'NO broncodilatadores de forma rutinaria',
      'NO corticoides',
      'NO antibióticos salvo sobreinfección',
      'Prueba terapéutica con salbutamol solo si >6m y antecedentes atópicos',
      'Ingreso si: <3m con FR>60, SatO₂<92%, apneas, rechazo VO, distress'
    ],
    drugs: [
      { name: 'Suero salino hipertónico 3%', route: 'Neb', dose: '3-4 ml nebulizado c/4-6h', note: 'Considerar en ingresados' },
      { name: 'Salbutamol', route: 'Neb', dose: '0,15 mg/kg (mín 2,5 mg)', perKg: [0.15, 0.15], unit: 'mg', cap: 5, note: 'Solo prueba terapéutica; suspender si no mejoría' },
      { name: 'Oxígeno', route: 'Inh', dose: 'Gafas nasales 0,5-2 L/min o mascarilla' }
    ],
    scales: [
      { id: 'wood-downes', name: 'Wood-Downes-Ferrés' }
    ],
    redFlags: [
      'Apneas (especialmente <3m)',
      'FR >70 rpm',
      'Tiraje severo',
      'SatO₂ <90% pese a O₂',
      'Rechazo alimentación, signos deshidratación',
      'Alteración de conciencia, cianosis'
    ],
    sources: 'AEP Guía Bronquiolitis 2024 · NICE NG9.'
  },

  {
    id: 'laringitis',
    system: 'resp',
    env: 'ped',
    name: 'Laringitis Aguda / Crup',
    subtitle: 'Estridor inspiratorio + tos perruna',
    summary: 'Niño 6m-6a con tos perruna, disfonía, estridor inspiratorio. Etiología vírica (parainfluenza).',
    diagnosis: [
      'Clínica: tos perruna, estridor, disfonía, fiebre',
      'Score de Taussig o Westley',
      'Leve (T≤5): disfonía y tos',
      'Moderado (T 6-8): estridor en reposo, tiraje moderado',
      'Grave (T 9-11): estridor marcado, tiraje intenso, agitación',
      'Vital (T≥12): cianosis, obnubilación'
    ],
    treatment: [
      'Ambiente tranquilo (evitar agitación)',
      '<strong>Dexametasona</strong> dosis única (VO si tolera)',
      'L-adrenalina nebulizada si moderado/grave',
      'O₂ si SatO₂<92%',
      'Observación 2-4h tras adrenalina (efecto rebote)',
      'Ingreso si: grave, mala respuesta a adrenalina, <6m'
    ],
    drugs: [
      { name: 'Dexametasona', route: 'VO/IM', dose: '0,15-0,6 mg/kg dosis única (máx 10 mg). Habitual: 0,15 mg/kg si leve, 0,6 mg/kg si mod-grave', perKg: [0.15, 0.6], unit: 'mg', cap: 10, note: 'VO igual de eficaz que IM' },
      { name: 'L-Adrenalina nebulizada', route: 'Neb', dose: '0,5 ml/kg al 1‰ (1 mg/ml) diluido en 3 ml de SSF (máx 5 ml)', perKg: [0.5, 0.5], unit: 'ml', cap: 5, note: 'Efecto 30 min, rebote a las 2-4h' },
      { name: 'Budesonida nebulizada', route: 'Neb', dose: '2 mg dosis única', note: 'Alternativa a dexametasona si no tolera VO' }
    ],
    scales: [
      { id: 'taussig', name: 'Taussig Score' }
    ],
    redFlags: [
      'Estridor en reposo',
      'Cianosis / palidez',
      'Alteración de conciencia',
      'Babeo (sospechar epiglotitis)',
      'Hipersalivación + trismus',
      'Mala respuesta a adrenalina'
    ],
    sources: 'SEUP 2024 · AEP · NICE.'
  },

  // ── NEUROLÓGICO ──
  {
    id: 'ictus',
    system: 'neuro',
    env: 'adult',
    name: 'Ictus Isquémico Agudo',
    subtitle: 'Código Ictus',
    summary: 'Déficit neurológico focal de inicio brusco. Tiempo = cerebro. Ventana fibrinolisis 4,5h; trombectomía hasta 24h en casos seleccionados.',
    diagnosis: [
      '<strong>Código Ictus</strong> si <4,5-24h y déficit',
      'NIHSS al ingreso',
      'Glucemia capilar (descartar hipoglucemia)',
      '<strong>TAC craneal sin contraste urgente</strong>',
      'Si candidato a trombectomía: AngioTC + TC perfusión',
      'Analítica con coagulación'
    ],
    treatment: [
      'Vía aérea + O₂ para SatO₂>94%',
      'NO bajar TA salvo >220/120 o si va a trombolisis (>185/110)',
      'NO aspirina ni HBPM hasta completar evaluación',
      'Tratar hipoglucemia/hiperglucemia',
      '<strong>Fibrinolisis IV</strong> (alteplasa 0,9 mg/kg) si <4,5h y sin contraindicaciones',
      '<strong>Trombectomía</strong> si oclusión gran vaso (ASPECTS ≥6)',
      'Ingreso en Unidad de Ictus'
    ],
    drugs: [
      { name: 'Alteplasa (rtPA)', route: 'IV', dose: '0,9 mg/kg IV (10% bolo, 90% en 60 min). Máx 90 mg', perKg: [0.9, 0.9], unit: 'mg', cap: 90, note: 'Solo en centros habilitados. Ventana <4,5h' },
      { name: 'Labetalol', route: 'IV', dose: '10-20 mg IV lento. Repetir c/10 min (máx 300 mg)' },
      { name: 'Urapidil', route: 'IV', dose: '12,5-25 mg IV bolo → perfusión 9-30 mg/h' }
    ],
    scales: [
      { id: 'nihss', name: 'NIHSS' },
      { id: 'glasgow', name: 'Glasgow' }
    ],
    redFlags: [
      'Deterioro progresivo del nivel de conciencia',
      'Crisis comiciales',
      'Vómitos, cefalea intensa (sospechar hemorragia)',
      'TAS>220 / TAD>120',
      'PA descontrolada tras fibrinolisis'
    ],
    sources: 'GPC Ictus SMS · ESO 2021 · AHA/ASA 2019.'
  },

  {
    id: 'convulsion-adulto',
    system: 'neuro',
    env: 'adult',
    name: 'Crisis Convulsiva / Status Epiléptico',
    subtitle: 'Actividad convulsiva >5 min o crisis recurrentes sin recuperación',
    summary: 'Status epiléptico = crisis >5 min o crisis recurrentes sin recuperar conciencia entre ellas.',
    diagnosis: [
      'Vía aérea + lateralización si vomita',
      'Glucemia capilar URGENTE',
      'Acceso venoso + analítica con iones',
      'Monitorización',
      'Temperatura (descartar fiebre)',
      'Valorar TAC si primera crisis o déficit focal'
    ],
    treatment: [
      '<strong>0-5 min</strong>: ABC, O₂, glucemia',
      '<strong>5-20 min</strong>: BZD (diazepam IV, midazolam IM/bucal)',
      '<strong>20-40 min</strong>: FAE IV (levetiracetam, valproico, fenitoína)',
      '<strong>>40 min</strong>: UCI → propofol, midazolam perfusión, anestesia',
      'Tratar causa: hipoglucemia (glucosa IV), hiponatremia, intoxicación'
    ],
    drugs: [
      { name: 'Diazepam', route: 'IV', dose: '10 mg IV lento (máx 20 mg). Repetir a los 10 min si necesario', perKg: [0.15, 0.2], unit: 'mg', cap: 10 },
      { name: 'Midazolam', route: 'IM/IN/Bucal', dose: '10 mg IM o 0,2 mg/kg bucal/IN', perKg: [0.2, 0.3], unit: 'mg', cap: 10, note: 'Si no hay acceso venoso' },
      { name: 'Lorazepam', route: 'IV', dose: '4 mg IV lento. Repetir a los 10 min', note: 'Mayor duración que diazepam' },
      { name: 'Levetiracetam', route: 'IV', dose: '60 mg/kg IV en 5 min (máx 4500 mg)', perKg: [60, 60], unit: 'mg', cap: 4500, note: 'Primera línea tras BZD' },
      { name: 'Valproico', route: 'IV', dose: '40 mg/kg IV en 10 min (máx 3000 mg)', perKg: [40, 40], unit: 'mg', cap: 3000 },
      { name: 'Fenitoína', route: 'IV', dose: '20 mg/kg IV a 50 mg/min (máx 1500 mg)', perKg: [20, 20], unit: 'mg', cap: 1500, note: 'Monitorizar ECG' }
    ],
    scales: [
      { id: 'glasgow', name: 'Glasgow' }
    ],
    redFlags: [
      'Status refractario (>40 min)',
      'Hipoxia pese a O₂',
      'Aspiración',
      'Traumatismo craneal asociado',
      'Fiebre alta (sospechar meningoencefalitis)'
    ],
    sources: 'SEN 2023 · NICE.'
  },

  {
    id: 'convulsion-febril',
    system: 'neuro',
    env: 'ped',
    name: 'Convulsión Febril',
    subtitle: 'Crisis + fiebre en niño 6m-5a sin infección SNC',
    summary: 'Crisis convulsiva en niño 6m-5a con fiebre, sin infección del SNC ni antecedentes de crisis afebriles. Típica: <15 min, tónico-clónica generalizada.',
    diagnosis: [
      '<strong>Típica</strong>: <15 min, generalizada, un episodio en 24h',
      '<strong>Atípica</strong>: >15 min, focal, o >1 episodio/24h',
      'Buscar foco infeccioso (ORL, urinaria, meníngea)',
      'NO requiere EEG, TAC ni PL de rutina',
      'PL si <12m con fiebre + crisis o signos meníngeos'
    ],
    treatment: [
      'Tranquilizar a los padres',
      'Si crisis activa >5 min: BZD (midazolam bucal o diazepam rectal)',
      'Antipirético (paracetamol/ibuprofeno) — no previene recurrencia',
      'Tratar foco infeccioso',
      'NO requiere anticomicial de mantenimiento'
    ],
    drugs: [
      { name: 'Midazolam bucal', route: 'Bucal', dose: '0,2-0,3 mg/kg (máx 10 mg)', perKg: [0.2, 0.3], unit: 'mg', cap: 10, note: 'Vía preferente si crisis >5 min' },
      { name: 'Diazepam rectal', route: 'Rectal', dose: '0,5 mg/kg (máx 10 mg). 5 mg si <3a, 10 mg si >3a', perKg: [0.5, 0.5], unit: 'mg', cap: 10 },
      { name: 'Paracetamol', route: 'VO/Rectal', dose: '15 mg/kg c/6h (máx 60 mg/kg/día)', perKg: [15, 15], unit: 'mg', cap: 1000 },
      { name: 'Ibuprofeno', route: 'VO', dose: '10 mg/kg c/8h (>6m)', perKg: [10, 10], unit: 'mg', cap: 600 }
    ],
    redFlags: [
      '<strong>Crisis prolongada (>15 min) o recurrente en 24h</strong>',
      'Focalidad neurológica',
      'Alteración de conciencia prolongada tras la crisis',
      'Signos meníngeos',
      '<12 meses',
      'Fontanela abombada'
    ],
    sources: 'AEP 2023 · SEUP 2024 · AAP.'
  },

  // ── DIGESTIVO ──
  {
    id: 'hda',
    system: 'digest',
    env: 'adult',
    name: 'Hemorragia Digestiva Alta',
    subtitle: 'Hematemesis, melena, inestabilidad',
    summary: 'Sangrado por encima del ángulo de Treitz. Causas: úlcera péptica (50%), varices esofágicas (10-20%).',
    diagnosis: [
      'Clínica: hematemesis (fresca o en posos), melena, hematoquecia si masiva',
      'Constantes, sonda nasogástrica si duda',
      'Analítica: Hb, plaquetas, coagulación, cruzar sangre',
      'Glasgow-Blatchford en triaje; Rockall tras endoscopia',
      'Endoscopia en <24h (<12h si inestable o cirrótico)'
    ],
    treatment: [
      '<strong>2 vías periféricas calibre grueso</strong>',
      'Cristaloides; transfusión si Hb<7 (Hb<8 cardiópatas)',
      'Inhibidor bomba protones en perfusión IV',
      'Somatostatina/terlipresina si sospecha varicosa',
      'Antibiótico profiláctico si cirrótico (ceftriaxona)',
      'Endoscopia precoz (terapéutica si úlcera Forrest Ia-IIb o varices)',
      'Ingreso planta o UCI según Glasgow-Blatchford'
    ],
    drugs: [
      { name: 'Omeprazol', route: 'IV', dose: '80 mg IV bolo → 8 mg/h perfusión × 72h' },
      { name: 'Pantoprazol', route: 'IV', dose: '80 mg IV bolo → 8 mg/h perfusión' },
      { name: 'Somatostatina', route: 'IV', dose: '250 μg IV bolo → 250 μg/h perfusión × 5 días', note: 'Hemorragia varicosa' },
      { name: 'Terlipresina', route: 'IV', dose: '2 mg IV c/4h × 48h → 1 mg c/4h × 3 días', note: 'Hemorragia varicosa' },
      { name: 'Ceftriaxona', route: 'IV', dose: '1 g/24h × 5-7 días', note: 'Profilaxis PBE en cirrótico' }
    ],
    scales: [
      { id: 'blatchford', name: 'Glasgow-Blatchford' },
      { id: 'rockall', name: 'Rockall' },
      { id: 'child-pugh', name: 'Child-Pugh' }
    ],
    redFlags: [
      'TAS <90 / FC >100',
      'Hb <7 g/dL',
      'Resangrado tras endoscopia',
      'Hematemesis masiva',
      'Alteración de conciencia',
      'Acidosis láctica'
    ],
    sources: 'ACG 2021 · Baveno VII (varicosa) · Protocolo HGUSL.'
  },

  {
    id: 'pancreatitis',
    system: 'digest',
    env: 'adult',
    name: 'Pancreatitis Aguda',
    subtitle: 'Dolor abdominal + elevación lipasa',
    summary: 'Inflamación aguda del páncreas. Causas: litiásica (40%), alcohólica (30%), idiopática, fármacos, hipertrigliceridemia.',
    diagnosis: [
      '<strong>Criterios de Atlanta</strong> (2 de 3):',
      '  1. Dolor abdominal típico (epigástrico irradiado en cinturón)',
      '  2. Amilasa/lipasa ×3 veces valor normal',
      '  3. Hallazgos en imagen',
      'Analítica: amilasa, lipasa, GGT, bilirrubina, PCR, calcio, TG, gluc',
      'Ecografía: descartar litiasis vesicular y dilatación vía biliar',
      'TC abdomen a las 72h si grave o mala evolución'
    ],
    treatment: [
      '<strong>Fluidoterapia agresiva precoz</strong>: Ringer lactato 5-10 ml/kg/h las primeras 12h',
      'Analgesia: paracetamol, metamizol, tramadol, morfina si severo',
      'Dieta absoluta inicialmente; reintroducir VO cuando dolor controlado',
      'Antibióticos NO profilácticos (solo si infección demostrada)',
      'CPRE urgente si pancreatitis litiásica con colangitis',
      'UCI si BISAP ≥3 o APACHE II ≥8 o SIRS persistente'
    ],
    drugs: [
      { name: 'Ringer Lactato', route: 'IV', dose: '5-10 ml/kg/h primeras 12h → ajustar por diuresis', perKg: [5, 10], unit: 'ml/h', note: 'Mejor que suero fisiológico' },
      { name: 'Metamizol', route: 'IV', dose: '2 g IV c/6-8h' },
      { name: 'Tramadol', route: 'IV', dose: '100 mg IV c/6h' },
      { name: 'Morfina', route: 'IV', dose: '2-4 mg IV c/4h', perKg: [0.05, 0.1], unit: 'mg' }
    ],
    scales: [
      { id: 'bisap', name: 'BISAP' },
      { id: 'ranson', name: 'Ranson' },
      { id: 'apache', name: 'APACHE II' }
    ],
    redFlags: [
      'Hipotensión mantenida',
      'Oliguria / insuficiencia renal',
      'Insuficiencia respiratoria',
      'Hipocalcemia grave',
      'Fracaso orgánico persistente >48h'
    ],
    sources: 'AGA 2018 · Atlanta 2012 · Protocolo HGUSL.'
  },

  // ── INFECCIOSO ──
  {
    id: 'sepsis',
    system: 'infect',
    env: 'both',
    name: 'Sepsis y Shock Séptico',
    subtitle: 'Código Sepsis',
    summary: 'Disfunción orgánica por respuesta desregulada a infección. Shock séptico = sepsis + vasopresores para TAM≥65 + lactato>2.',
    diagnosis: [
      'qSOFA ≥2 → alta sospecha (TAS≤100, FR≥22, alt. conciencia)',
      'SOFA para diagnóstico confirmatorio',
      'Buscar foco: urinario, respiratorio, abdominal, piel, SNC, endocarditis',
      'Analítica: hemograma, bioquímica, PCR, procalcitonina, lactato, gasometría',
      '<strong>2 hemocultivos + cultivos del foco ANTES de antibiótico</strong>'
    ],
    treatment: [
      '<strong>Bundle 1 hora (Surviving Sepsis 2021)</strong>:',
      '  1. Medir lactato',
      '  2. Hemocultivos',
      '  3. Antibiótico empírico de amplio espectro IV',
      '  4. Cristaloides 30 ml/kg si hipotensión o lactato≥4',
      '  5. Vasopresores si TAM<65 tras fluidos',
      'Control del foco (drenaje, cirugía)',
      'Noradrenalina primera línea; añadir vasopresina si refractario',
      'Corticoides (hidrocortisona) si shock refractario'
    ],
    drugs: [
      { name: 'Ringer Lactato', route: 'IV', dose: '30 ml/kg inicial', perKg: [30, 30], unit: 'ml', note: 'Revaloración tras cada 10-15 ml/kg' },
      { name: 'Noradrenalina', route: 'IV', dose: '0,05-0,5 μg/kg/min, titular para TAM≥65', perKg: [0.05, 0.5], unit: 'μg/min' },
      { name: 'Vasopresina', route: 'IV', dose: '0,03 U/min fijo', note: 'Si refractario a noradrenalina' },
      { name: 'Hidrocortisona', route: 'IV', dose: '200 mg/día (50 mg c/6h o perfusión)' },
      // Antibiotics empirical
      { name: 'Piperacilina/Tazobactam', route: 'IV', dose: 'Adulto: 4/0,5 g c/8h. Niños: 80 mg/kg c/8h', perKg: [80, 100], unit: 'mg', cap: 4000 },
      { name: 'Meropenem', route: 'IV', dose: 'Adulto: 1 g c/8h (2 g si grave). Niños: 20-40 mg/kg c/8h', perKg: [20, 40], unit: 'mg', cap: 2000 },
      { name: 'Cefepima', route: 'IV', dose: 'Adulto: 2 g c/8-12h. Niños: 50 mg/kg c/8h', perKg: [50, 50], unit: 'mg', cap: 2000 },
      { name: 'Vancomicina', route: 'IV', dose: '15-20 mg/kg c/8-12h (máx 2 g/dosis)', perKg: [15, 20], unit: 'mg', cap: 2000, note: 'Asociar si sospecha SARM o catéter' }
    ],
    scales: [
      { id: 'qsofa', name: 'qSOFA' },
      { id: 'sofa', name: 'SOFA' },
      { id: 'sirs', name: 'SIRS' },
      { id: 'news2', name: 'NEWS2' }
    ],
    redFlags: [
      'Lactato >4 mmol/L',
      'TAM <65 pese a fluidos',
      'Oliguria <0,5 ml/kg/h',
      'Alteración de conciencia',
      'Hipoxia',
      'Acidosis metabólica grave'
    ],
    sources: 'Surviving Sepsis Campaign 2021 · Sepsis-3 (JAMA 2016).'
  },

  {
    id: 'meningitis',
    system: 'infect',
    env: 'both',
    name: 'Meningitis Bacteriana',
    subtitle: 'Fiebre + cefalea + signos meníngeos',
    summary: 'Infección del SNC. Tríada clásica: fiebre + cefalea + rigidez de nuca. Confusión en >75%. Púrpura sugiere meningococo.',
    diagnosis: [
      '<strong>PL urgente</strong> (previa al antibiótico si no hay contraindicación)',
      'Contraindicaciones PL: focalidad, edema papila, coagulopatía, infección en el sitio',
      'TC previo si: inmunosupresión, convulsión, focalidad, edema papila',
      'LCR: presión, celularidad, glucosa, proteínas, Gram, cultivo, PCR',
      'Bacteriana: >1000 PMN, glucosa <40% sérica, proteínas altas, Gram+',
      'Hemocultivos antes de antibiótico'
    ],
    treatment: [
      '<strong>NO retrasar antibiótico</strong> (iniciar tras hemocultivos; si PL se demora, antes de PL)',
      'Corticoides (dexametasona) 15 min antes o con primera dosis ATB',
      'Antibiótico empírico: ceftriaxona + vancomicina + ampicilina si >50a/inmunosup',
      'Aciclovir empírico si sospecha encefalitis vírica',
      'UCI si inestabilidad o Glasgow<12'
    ],
    drugs: [
      { name: 'Ceftriaxona', route: 'IV', dose: 'Adulto: 2 g c/12h. Niños: 100 mg/kg/día en 2 dosis (máx 4 g)', perKg: [50, 50], unit: 'mg', cap: 2000 },
      { name: 'Vancomicina', route: 'IV', dose: 'Adulto: 15-20 mg/kg c/8-12h. Niños: 15 mg/kg c/6h (máx 60 mg/kg/día)', perKg: [15, 20], unit: 'mg', cap: 2000 },
      { name: 'Ampicilina', route: 'IV', dose: 'Adulto: 2 g c/4h. Niños: 300 mg/kg/día en 6 dosis (máx 12 g)', perKg: [50, 50], unit: 'mg', cap: 2000, note: 'Añadir si >50a, inmunosup, embarazo (Listeria)' },
      { name: 'Dexametasona', route: 'IV', dose: 'Adulto: 10 mg c/6h × 4 días. Niños: 0,15 mg/kg c/6h (máx 10 mg)', perKg: [0.15, 0.15], unit: 'mg', cap: 10, note: 'Administrar antes o con primera dosis antibiótico' },
      { name: 'Aciclovir', route: 'IV', dose: '10 mg/kg c/8h (niños: 20 mg/kg c/8h)', perKg: [10, 20], unit: 'mg', note: 'Si sospecha encefalitis herpética' }
    ],
    scales: [
      { id: 'glasgow', name: 'Glasgow' }
    ],
    redFlags: [
      'Alteración de conciencia',
      'Convulsiones',
      'Focalidad neurológica',
      'Púrpura (meningococemia)',
      'Shock',
      'Edema papila'
    ],
    sources: 'IDSA 2017 · ESCMID 2016 · SEIMC.'
  },

  // ── METABÓLICO ──
  {
    id: 'cad',
    system: 'metab',
    env: 'both',
    name: 'Cetoacidosis Diabética',
    subtitle: 'Hiperglucemia + acidosis + cetosis',
    summary: 'Déficit absoluto o relativo de insulina. Criterios: glucosa >250, pH<7,3 o HCO₃<18, cetonuria/cetonemia positiva.',
    diagnosis: [
      'Glucemia >250 mg/dL',
      'pH <7,3 o HCO₃ <18 mEq/L',
      'Cetonemia β-OH-butirato >3 mmol/L o cetonuria fuerte',
      'Anion gap aumentado',
      'Buscar desencadenante: infección (40%), incumplimiento, SCA, debut'
    ],
    treatment: [
      '<strong>Fluidoterapia</strong>: SSF 0,9% 1-1,5 L la 1ª h → 250-500 ml/h',
      'Si Na corregido ≥135: SSF 0,45%',
      'Glucosado al 5% cuando glucemia <200 (para mantener insulina)',
      '<strong>Insulina</strong>: 0,1 UI/kg/h perfusión (NO bolo en pediatría)',
      'Potasio: reponer SIEMPRE salvo K>5,2 o anuria',
      'Bicarbonato SOLO si pH<6,9',
      'Tratar factor desencadenante'
    ],
    drugs: [
      { name: 'SSF 0,9%', route: 'IV', dose: '15-20 ml/kg primera hora → 250-500 ml/h', perKg: [15, 20], unit: 'ml', note: 'Primera hora' },
      { name: 'Insulina regular (Actrapid)', route: 'IV', dose: '0,1 UI/kg/h perfusión continua', perKg: [0.1, 0.1], unit: 'UI/h', note: 'NO bolo en pediatría (riesgo edema cerebral)' },
      { name: 'ClK', route: 'IV', dose: 'K<3,3: reponer 20-30 mEq/h antes de insulina. K 3,3-5,2: 20-30 mEq en cada litro. K>5,2: no reponer', note: 'Medir K antes de iniciar insulina' },
      { name: 'Bicarbonato sódico 1M', route: 'IV', dose: '100 mEq en 400 ml SSF 0,45% en 2h', note: 'Solo si pH<6,9' },
      { name: 'Glucosado 5%', route: 'IV', dose: 'Cambiar a G5% cuando glucemia <200 mg/dL' }
    ],
    scales: [],
    redFlags: [
      'Alteración de conciencia / coma',
      'Shock',
      'Edema cerebral (sobre todo pediatría)',
      'pH <7,0',
      'K <3,3 mEq/L al inicio',
      'Anuria'
    ],
    sources: 'ADA 2024 · ISPAD 2022 (pediatría) · Protocolo HGUSL.'
  },

  {
    id: 'hipoglucemia',
    system: 'metab',
    env: 'both',
    name: 'Hipoglucemia',
    subtitle: 'Glucemia <70 mg/dL',
    summary: 'Tríada de Whipple: síntomas + glucemia baja + mejoría con aporte. Causas: sobredosis insulina/sulfonilurea, ayuno, OH, insulinoma.',
    diagnosis: [
      'Glucemia capilar <70 mg/dL',
      'Síntomas adrenérgicos: temblor, sudoración, palpitaciones, hambre',
      'Síntomas neuroglucopénicos: confusión, alteración conducta, focalidad, convulsiones, coma',
      'Buscar causa: insulina, sulfonilurea, OH, insuficiencia renal, sepsis, ejercicio'
    ],
    treatment: [
      'CONSCIENTE: 15-20 g HC de absorción rápida VO (zumo, azúcar) → repetir glucemia en 15 min',
      'INCONSCIENTE: glucosa IV en bolo',
      'Si no hay acceso venoso: glucagón IM',
      'Infusión mantenimiento si hipoglucemia por sulfonilurea (efecto largo)',
      'Buscar causa tratable',
      'Valorar ingreso si sulfonilurea, nueva insulina, anciano, inconsciente'
    ],
    drugs: [
      { name: 'Glucosa 50% (Glucosmon)', route: 'IV', dose: 'Adulto: 10-25 g (20-50 ml de sol. 50%). Niños: 0,25 g/kg (0,5 ml/kg de sol 50% o 2 ml/kg de sol 25%)', perKg: [0.25, 0.5], unit: 'g', note: 'Administrar lento por acceso central preferible' },
      { name: 'Glucagón', route: 'IM/SC', dose: 'Adulto: 1 mg. Niño <25 kg: 0,5 mg. Niños >25 kg: 1 mg', perKg: [0.02, 0.03], unit: 'mg', cap: 1, note: 'Si no hay acceso venoso' },
      { name: 'Glucosado 10%', route: 'IV', dose: 'Perfusión 2-4 mg/kg/min tras bolo (especialmente si sulfonilurea)' },
      { name: 'Octreotida', route: 'SC', dose: '50-100 μg SC c/8h', note: 'Hipoglucemia por sulfonilurea refractaria' }
    ],
    redFlags: [
      'Alteración prolongada de conciencia tras corrección',
      'Hipoglucemia por sulfonilurea (efecto 24-48h)',
      'Hipoglucemia en insuficiencia renal/hepática',
      'Focalidad neurológica persistente',
      'Convulsiones'
    ],
    sources: 'ADA 2024 · Ferri Clinical Advisor.'
  },

  // ── TRAUMA ──
  {
    id: 'politrauma',
    system: 'trauma',
    env: 'both',
    name: 'Politraumatismo',
    subtitle: 'Evaluación ATLS XABCDE',
    summary: 'Paciente con lesión grave de más de un sistema. Aplicar ATLS sistemático: X-ABCDE. Ver manual ATLS 11ª Ed. 2025 completo.',
    diagnosis: [
      '<strong>X — Control de hemorragia exanguinante</strong> (torniquete, compresión)',
      '<strong>A — Vía aérea + control cervical</strong> (collarín)',
      '<strong>B — Ventilación</strong> (neumotórax, volet)',
      '<strong>C — Circulación</strong> (2 vías gruesas, control sangrado, eFAST)',
      '<strong>D — Déficit neurológico</strong> (Glasgow, pupilas, glucemia)',
      '<strong>E — Exposición</strong> + prevención hipotermia'
    ],
    treatment: [
      'O₂ alto flujo',
      '2 vías periféricas 14-16G',
      'Fluidoterapia: cristaloides 1-2 L inicialmente; hipotensión permisiva (TAS 80-90) salvo TCE',
      'Transfusión precoz (1:1:1 plasma:plaquetas:concentrados) si hemorragia masiva',
      'Ácido tranexámico 1g IV en <3h desde el trauma',
      'Analgesia (fentanilo IV, ketamina)',
      'Evaluar necesidad de cirugía urgente (FAST+, inestable → quirófano)',
      'TC body si estable'
    ],
    drugs: [
      { name: 'Ácido tranexámico', route: 'IV', dose: '1 g IV en 10 min → 1 g en 8h', note: '<3h desde el trauma (CRASH-2)' },
      { name: 'Fentanilo', route: 'IV', dose: '1-2 μg/kg IV bolo; repetir c/10-15 min', perKg: [1, 2], unit: 'μg' },
      { name: 'Ketamina', route: 'IV/IM', dose: 'Analgesia: 0,1-0,3 mg/kg IV. Sedación: 1-2 mg/kg IV', perKg: [0.1, 0.3], unit: 'mg' },
      { name: 'Cloruro cálcico 10%', route: 'IV', dose: '10 ml IV lento', note: 'En hemorragia masiva, hipocalcemia por citrato' },
      { name: 'Adrenalina', route: 'IV', dose: '1 mg IV c/3-5 min en PCR' }
    ],
    scales: [
      { id: 'rts', name: 'RTS' },
      { id: 'glasgow', name: 'Glasgow' }
    ],
    redFlags: [
      'Hemorragia exanguinante',
      'Obstrucción vía aérea',
      'Neumotórax a tensión',
      'Taponamiento cardíaco',
      'Shock (TAS<90, taquicardia)',
      'Glasgow <9',
      'Fractura pelvis inestable'
    ],
    sources: 'ATLS 11ª Ed. (2025) · ETC European Trauma Course.'
  },

  {
    id: 'tce',
    system: 'trauma',
    env: 'both',
    name: 'Traumatismo Craneoencefálico',
    subtitle: 'TCE · Clasificación Glasgow',
    summary: 'Lesión cerebral traumática. Clasificar según Glasgow: leve (13-15), moderado (9-12), grave (≤8).',
    diagnosis: [
      'Glasgow al ingreso',
      '<strong>Canadian CT Head Rule</strong> (adulto)',
      '<strong>PECARN Rules</strong> (pediátrico)',
      'TC craneal si: Glasgow <15 a las 2h, fractura base cráneo, vómitos repetidos, amnesia, >65a, coagulación, convulsión',
      'Mantener TAM>80 y evitar hipoxia'
    ],
    treatment: [
      'O₂ para SatO₂>95%',
      'Cabecera 30°',
      'Evitar hipotensión (TAM>80 adultos)',
      'Glasgow ≤8 → IOT',
      'Si HTIC: manitol 0,5-1 g/kg o SSH 3%',
      'Corticoides NO recomendados',
      'Fenitoína/levetiracetam si convulsión',
      'Ingreso neurocirugía si hallazgos TC o Glasgow <15',
      'Alta si TCE leve, TC normal, observador domiciliario'
    ],
    drugs: [
      { name: 'Manitol 20%', route: 'IV', dose: '0,5-1 g/kg en 15 min (2,5-5 ml/kg)', perKg: [0.5, 1], unit: 'g', note: 'HTIC; repetir c/6h si necesario' },
      { name: 'Suero salino hipertónico 3%', route: 'IV', dose: '3-5 ml/kg en 10-20 min', perKg: [3, 5], unit: 'ml', note: 'Alternativa al manitol' },
      { name: 'Fenitoína', route: 'IV', dose: '15-20 mg/kg en 30 min (máx 1500 mg)', perKg: [15, 20], unit: 'mg', cap: 1500, note: 'Profilaxis convulsiones primera semana' },
      { name: 'Levetiracetam', route: 'IV', dose: '20-30 mg/kg (máx 3000 mg)', perKg: [20, 30], unit: 'mg', cap: 3000 }
    ],
    scales: [
      { id: 'glasgow', name: 'Glasgow' }
    ],
    redFlags: [
      'Glasgow <13 o descenso >2 puntos',
      'Anisocoria',
      'Cefalea intensa progresiva',
      'Vómitos repetidos',
      'Convulsiones',
      'Salida de LCR por oído/nariz',
      'Fractura deprimida o de base de cráneo'
    ],
    sources: 'NICE CG176 · Canadian CT Head Rule · PECARN · ATLS 11ª Ed.'
  },

  // ── ALERGIA ──
  {
    id: 'anafilaxia',
    system: 'alergia',
    env: 'both',
    name: 'Anafilaxia',
    subtitle: 'Reacción alérgica sistémica grave',
    summary: 'Inicio brusco multisistémico (piel + respiratorio/cardiovascular/GI). <strong>Adrenalina IM es la 1ª línea</strong>. NO retrasar por otros tratamientos.',
    diagnosis: [
      '<strong>Criterios diagnósticos NIAID/FAAN</strong>:',
      '  1. Inicio brusco piel/mucosas + (respiratorio o hipotensión)',
      '  2. Tras alérgeno probable: 2 de 4 sistemas',
      '  3. Tras alérgeno conocido: hipotensión',
      'Clínica: urticaria, edema facial/glotis, disnea, hipotensión, síncope, vómitos, diarrea',
      'Causas: fármacos (beta-lactámicos, AINE), alimentos (frutos secos, mariscos), veneno himenópteros, látex'
    ],
    treatment: [
      '<strong>1. ADRENALINA IM inmediata</strong> (cara lateral muslo), repetir c/5-15 min',
      '2. Decúbito supino con piernas elevadas (NO levantar)',
      '3. O₂ alto flujo',
      '4. Fluidoterapia IV cristaloides',
      '5. Broncodilatador si broncoespasmo',
      '6. Antihistamínicos + corticoides (coadyuvantes, no sustituyen adrenalina)',
      'Observación mínima 6-8h (reacción bifásica)',
      'Al alta: prescribir 2 autoinyectores de adrenalina y derivar a alergología'
    ],
    drugs: [
      { name: 'Adrenalina', route: 'IM', dose: 'Adulto: 0,3-0,5 mg IM (0,3-0,5 ml de 1 mg/ml). Niños: 0,01 mg/kg (máx 0,5 mg)', perKg: [0.01, 0.01], unit: 'mg', cap: 0.5, note: 'Cara lateral muslo. Repetir c/5-15 min. 1ª línea.' },
      { name: 'SSF', route: 'IV', dose: 'Adulto: 500-1000 ml en bolo si hipotensión. Niños: 20 ml/kg', perKg: [20, 20], unit: 'ml' },
      { name: 'Dexclorfeniramina', route: 'IV/IM', dose: 'Adulto: 5 mg IV/IM c/8h. Niños: 0,1-0,2 mg/kg', perKg: [0.1, 0.2], unit: 'mg', cap: 5 },
      { name: 'Metilprednisolona', route: 'IV', dose: 'Adulto: 1-2 mg/kg (máx 125 mg). Niños: 1-2 mg/kg', perKg: [1, 2], unit: 'mg', cap: 125 },
      { name: 'Salbutamol nebulizado', route: 'Neb', dose: 'Adulto: 2,5-5 mg. Niños: 0,15 mg/kg (mín 2,5 mg)', perKg: [0.15, 0.15], unit: 'mg', cap: 5 },
      { name: 'Glucagón', route: 'IV', dose: '1-5 mg IV seguido de perfusión 5-15 μg/min', note: 'Si paciente en tratamiento con betabloqueante no responde a adrenalina' }
    ],
    redFlags: [
      '<strong>Hipotensión / shock</strong>',
      'Broncoespasmo grave',
      'Estridor / edema glotis',
      'Alteración de la conciencia',
      'PCR (RCP + adrenalina IV)',
      'Reacción bifásica (hasta 72h después)'
    ],
    sources: 'WAO 2020 · EAACI 2021 · Galaxia 2.0 (SEAIC).'
  },

  // ── TOXICOLOGÍA ──
  {
    id: 'intox-paracetamol',
    system: 'tox',
    env: 'both',
    name: 'Intoxicación por Paracetamol',
    subtitle: 'Sobredosis acetaminofén',
    summary: 'Dosis tóxica: >7,5 g adulto (>150 mg/kg) o >200 mg/kg niños. Hepatotoxicidad máxima a las 72-96h.',
    diagnosis: [
      'Historia: dosis, tiempo desde ingesta, formulación',
      '<strong>Paracetamolemia a las 4h</strong> post-ingesta',
      'Nomograma Rumack-Matthew (adulto)',
      'Transaminasas, coagulación, función renal, lactato',
      'Gasometría si sospecha acidosis',
      'Screening tóxicos (otras sustancias)'
    ],
    treatment: [
      'Si <1-2h: carbón activado 1 g/kg',
      '<strong>N-acetilcisteína IV</strong> si paracetamolemia por encima de línea de riesgo o intoxicación masiva/tiempo desconocido',
      'Protocolo NAC 21h (3 bolos) o 20h (2 bolos)',
      'Vigilancia función hepática cada 12-24h',
      'Derivar a trasplante hepático si criterios King\'s College'
    ],
    drugs: [
      { name: 'N-acetilcisteína', route: 'IV', dose: '150 mg/kg en 60 min → 50 mg/kg en 4h → 100 mg/kg en 16h (total 21h)', perKg: [150, 150], unit: 'mg', note: 'Alternativa VO: 140 mg/kg → 70 mg/kg c/4h × 17 dosis' },
      { name: 'Carbón activado', route: 'VO', dose: '1 g/kg (máx 50 g) si <1-2h desde ingesta', perKg: [1, 1], unit: 'g', cap: 50 }
    ],
    redFlags: [
      'Coagulopatía (INR>2)',
      'Encefalopatía',
      'Acidosis (pH<7,3) tras resucitación',
      'Creatinina >3,4 mg/dL',
      'Criterios King\'s College para trasplante'
    ],
    sources: 'AAPCC 2018 · Nomograma Rumack-Matthew · UpToDate.'
  },

  // ── PSIQUIATRÍA ──
  {
    id: 'agitacion',
    system: 'psiq',
    env: 'adult',
    name: 'Agitación Psicomotriz',
    subtitle: 'Escalada terapéutica',
    summary: 'Estado de hiperactividad motora y psíquica. Primer paso: contención verbal. Escalada: contención farmacológica → mecánica si peligro.',
    diagnosis: [
      'Valorar causa orgánica: glucemia, intoxicación, infección, abstinencia, hipoxia, TCE',
      'Historia: patología psiquiátrica previa, tóxicos, medicación',
      'Exploración básica (si permite)',
      'ECG si se va a usar haloperidol IV'
    ],
    treatment: [
      '<strong>1. Contención verbal</strong>: ambiente tranquilo, empatía, establecer límites',
      '2. Si insuficiente: farmacológica VO si acepta, IM si rehúsa',
      '3. Contención mecánica: último recurso, reevaluación c/15-30 min, nunca >8h',
      'Esquema según causa:',
      '  - Psicótico: haloperidol ± BZD',
      '  - Ansiedad: BZD sola',
      '  - Agitación etílica: haloperidol (BZD con precaución)',
      '  - Abstinencia OH: BZD',
      '  - Anciano: evitar BZD; preferir risperidona/quetiapina',
      '  - Embarazo: haloperidol de elección'
    ],
    drugs: [
      { name: 'Haloperidol', route: 'VO/IM', dose: '5-10 mg VO o 2,5-5 mg IM. Repetir c/30 min. Anciano: 0,5-1 mg' },
      { name: 'Midazolam', route: 'IM', dose: '5-10 mg IM', note: 'Inicio rápido, corta duración' },
      { name: 'Lorazepam', route: 'VO/SL', dose: '1-2 mg VO/SL' },
      { name: 'Olanzapina', route: 'IM/VO', dose: '5-10 mg VO o 10 mg IM velotab' },
      { name: 'Risperidona', route: 'VO', dose: '1-2 mg VO', note: 'Preferida en anciano' },
      { name: 'Levomepromazina', route: 'IM', dose: '25-50 mg IM' }
    ],
    redFlags: [
      'Causa orgánica no identificada',
      'Inestabilidad hemodinámica',
      'Alteración de conciencia',
      'QT largo (evitar haloperidol)',
      'Riesgo de heteroagresividad/autolesión',
      'Embarazo (ajustar fármacos)'
    ],
    sources: 'Protocolo agitación SESCAM · APA 2020 · SEPB.'
  },

  // ── OBSTETRICIA ──
  {
    id: 'preeclampsia',
    system: 'ob',
    env: 'adult',
    name: 'Preeclampsia / Eclampsia',
    subtitle: 'HTA + proteinuria en embarazo >20 SG',
    summary: 'HTA de novo en >20 SG + proteinuria o disfunción orgánica. Eclampsia = preeclampsia + convulsiones.',
    diagnosis: [
      'TA ≥140/90 en ≥2 ocasiones',
      'Proteinuria ≥300 mg/24h o cociente proteína/creatinina ≥0,3',
      'O bien disfunción orgánica: trombopenia, creatinina, transaminasas, clínica neurológica, EAP',
      '<strong>Grave</strong>: TA≥160/110, clínica, HELLP, EAP, IR, eclampsia',
      'Analítica: hemograma, LDH, transaminasas, creatinina, proteinuria',
      'Monitorización fetal'
    ],
    treatment: [
      '<strong>Sulfato de magnesio IV</strong>: prevención convulsiones en grave',
      'Antihipertensivos: labetalol IV, hidralazina IV, nifedipino VO',
      '<strong>Finalización gestación</strong> (único tratamiento curativo)',
      '  - ≥37 SG: parto',
      '  - 34-37 SG: individualizar',
      '  - <34 SG: corticoides + valorar terminación según gravedad',
      'NO IECA, NO ARA-II, NO diuréticos'
    ],
    drugs: [
      { name: 'Sulfato de magnesio', route: 'IV', dose: '4-6 g IV en 15-20 min (diluido) → 1-2 g/h perfusión', note: 'Monitorizar reflejos y FR; antídoto: gluconato cálcico' },
      { name: 'Labetalol', route: 'IV', dose: '20 mg IV → duplicar c/10 min (máx 300 mg)', note: 'Evitar en asma' },
      { name: 'Hidralazina', route: 'IV', dose: '5-10 mg IV c/20 min (máx 30 mg)' },
      { name: 'Nifedipino', route: 'VO', dose: '10 mg VO (no sublingual); repetir c/20 min (máx 50 mg)' },
      { name: 'Betametasona', route: 'IM', dose: '12 mg IM c/24h × 2 dosis', note: 'Maduración pulmonar <34 SG' }
    ],
    redFlags: [
      'TA ≥160/110',
      'Convulsiones (eclampsia)',
      'HELLP (hemólisis, transaminasas, plaquetopenia)',
      'EAP',
      'Cefalea intensa / alteraciones visuales',
      'Dolor epigástrico / hipocondrio derecho'
    ],
    sources: 'ACOG 2020 · ISSHP 2018 · NICE NG133.'
  },

  // ── NEFRO ──
  {
    id: 'hiperK',
    system: 'renal',
    env: 'both',
    name: 'Hiperpotasemia',
    subtitle: 'K >5,5 mEq/L',
    summary: 'Potasio elevado. Riesgo de arritmias ventriculares mortales si >6,5 o cambios ECG. Causas: IR, fármacos (IECA, ARA, AINE, diuréticos K+), acidosis, destrucción celular.',
    diagnosis: [
      '<strong>Confirmar con muestra no hemolizada</strong>',
      'ECG: T picuda, PR alargado, QRS ancho, desaparición P',
      'Gasometría venosa (pH, HCO₃)',
      'Creatinina, urea',
      'Revisar medicación'
    ],
    treatment: [
      'K >6,5 o cambios ECG → <strong>URGENCIA</strong>',
      '1. <strong>Estabilización membrana</strong>: gluconato cálcico IV (si cambios ECG)',
      '2. <strong>Redistribución intracelular</strong>: insulina + glucosa, salbutamol, bicarbonato si acidosis',
      '3. <strong>Eliminación</strong>: furosemida si función renal, resinas (Resincalcio), hemodiálisis si refractario',
      'Suspender fármacos hiperkalemiantes',
      'Monitorización ECG continua'
    ],
    drugs: [
      { name: 'Gluconato cálcico 10%', route: 'IV', dose: '10 ml (1 g) en 2-3 min. Repetir si persiste ECG alterado', note: 'Estabiliza miocardio, NO baja K' },
      { name: 'Insulina rápida + Glucosa', route: 'IV', dose: '10 UI insulina + 50 g glucosa (250 ml SG 20%)', note: 'Reduce K 0,5-1 mEq/L en 30 min' },
      { name: 'Salbutamol nebulizado', route: 'Neb', dose: '10-20 mg nebulizado en 15 min', note: 'Reduce K 0,5-1 mEq/L' },
      { name: 'Bicarbonato sódico 1M', route: 'IV', dose: '50-100 mEq IV en 30 min', note: 'Solo si acidosis metabólica' },
      { name: 'Furosemida', route: 'IV', dose: '40-80 mg IV', note: 'Si función renal preservada' },
      { name: 'Resincalcio', route: 'VO/Enema', dose: '15-60 g VO c/6h o enema 30-50 g', note: 'Efecto lento; descartar necrosis intestinal' },
      { name: 'Patiromer', route: 'VO', dose: '8,4-25,2 g/24h', note: 'Mantenimiento crónico' }
    ],
    scales: [],
    redFlags: [
      'K >6,5 mEq/L',
      'Cambios ECG (T picuda, QRS ancho)',
      'Bradicardia',
      'Arritmias ventriculares',
      'Refractario a tratamiento médico (→ diálisis)'
    ],
    sources: 'KDIGO · UpToDate · Protocolo HGUSL.'
  }

];

// ═══════════════════════════════════════════════════════════
//  PROCEDURES
// ═══════════════════════════════════════════════════════════
var VD_PROCEDURES = [
  {
    id: 'iot',
    name: 'Intubación Orotraqueal (Secuencia Rápida)',
    indication: 'Vía aérea comprometida, Glasgow ≤8, insuficiencia respiratoria refractaria, shock, preparación para traslado.',
    material: [
      'Monitor con SatO₂, TA, ECG, capnografía',
      'Bolsa-mascarilla + reservorio',
      'Laringoscopio (pala Macintosh 3-4 en adulto)',
      'Tubos: adulto varón 8-8,5; mujer 7-7,5; niños (edad/4)+4',
      'Fiador, jeringa de 10 ml, aspirador, bougie',
      'Fármacos: preoxigenación, sedación, relajación'
    ],
    steps: [
      'Preparar material y fármacos antes de empezar',
      'Preoxigenar 3-5 min con FiO₂ 100%',
      'Monitorización y vía IV',
      'Pretratamiento si aplica: lidocaína, atropina, fentanilo',
      'Inducción: etomidato, propofol, ketamina o midazolam (según hemodinamia)',
      'Relajación: rocuronio 1 mg/kg o succinilcolina 1-1,5 mg/kg',
      'Esperar 45-60 seg (rocuronio) o 60 seg (succinilcolina)',
      'Laringoscopia: visualizar cuerdas, introducir tubo',
      'Comprobar: capnografía (onda característica), auscultación bilateral',
      'Fijar tubo, conectar a ventilador, Rx tórax'
    ],
    complications: [
      'Hipoxia por intubación prolongada',
      'Intubación esofágica',
      'Intubación selectiva (derecha)',
      'Hipotensión (especialmente propofol + shock)',
      'Broncoaspiración',
      'Traumatismo dental/laríngeo',
      'Hipertermia maligna (succinilcolina)'
    ],
    notes: 'Si intubación fallida: ventilar con bolsa-mascarilla. Si no ventila: dispositivos supraglóticos. Plan C: cricotiroidotomía.'
  },
  {
    id: 'drenaje-toracico',
    name: 'Drenaje Torácico',
    indication: 'Neumotórax a tensión, neumotórax >30%, hemotórax, derrame pleural masivo sintomático, empiema.',
    material: [
      'Campo estéril, guantes, bata',
      'Antiséptico, lidocaína 1% con jeringa',
      'Bisturí, pinza de Kelly',
      'Tubo torácico: 28-32F adultos, 20-24F niños, 14-20F neumotórax',
      'Sistema de drenaje con sello de agua',
      'Seda 0 para fijación'
    ],
    steps: [
      'Paciente en decúbito 45° con brazo sobre cabeza',
      'Localizar: 5º EI, línea axilar media (triángulo de seguridad)',
      'Asepsia y campo estéril',
      'Infiltrar lidocaína en piel, subcutáneo y pleura parietal',
      'Incisión paralela a la costilla 2-3 cm',
      'Disección roma con pinza por borde superior costilla',
      'Penetrar pleura (entrada de aire o líquido)',
      'Introducir tubo con guía digital',
      'Conectar a sistema de drenaje con sello de agua',
      'Fijar con sutura, apósito oclusivo',
      'Rx tórax control'
    ],
    complications: [
      'Lesión intercostal (bordes inferiores costillas)',
      'Lesión pulmonar',
      'Infección (empiema tardío)',
      'Mal posicionamiento del tubo',
      'Edema pulmonar por reexpansión (evacuar lentamente, <1-1,5 L iniciales)'
    ],
    notes: 'En neumotórax a tensión, descompresión inmediata con angiocatéter 14G en 2º EI línea medioclavicular antes de colocar tubo definitivo.'
  },
  {
    id: 'puncion-lumbar',
    name: 'Punción Lumbar',
    indication: 'Sospecha meningitis/encefalitis, HSA con TC normal, diagnóstico esclerosis múltiple, administración terapéutica.',
    material: [
      'Aguja espinal 20-22G (Quincke o punta de lápiz)',
      'Antiséptico, campo estéril',
      'Lidocaína 1% para anestesia local',
      'Tubos para LCR (3-4 tubos)',
      'Manómetro si se quiere medir presión'
    ],
    steps: [
      'CONTRAINDICACIONES: focalidad, edema papila, infección local, coagulopatía (plaquetas <50.000 o INR >1,5)',
      'TAC previo si inmunosupresión, focalidad, crisis',
      'Consentimiento informado',
      'Posición: decúbito lateral fetal o sentado',
      'Localizar L3-L4 o L4-L5 (línea intercrestal de Jacoby)',
      'Asepsia, campo estéril',
      'Anestesiar con lidocaína',
      'Introducir aguja con bisel hacia cefálico, paralelo a ligamento interespinoso',
      'Avanzar hasta "click" del ligamento amarillo',
      'Retirar estilete, observar salida LCR',
      'Medir presión si indicado',
      'Recoger 1-3 ml en cada tubo',
      'Reposicionar estilete antes de retirar (prevención cefalea)',
      'Apósito'
    ],
    complications: [
      'Cefalea postpunción (más frecuente, 10-30%)',
      'Hematoma epidural/subdural espinal',
      'Infección (meningitis iatrogénica)',
      'Herniación cerebral (si HTIC no detectada)',
      'Parestesias transitorias',
      'Punción seca'
    ],
    notes: 'Recomendar decúbito no es obligatorio; aguja atraumática reduce cefalea. Hidratación abundante. Parche hemático si cefalea persistente >72h.'
  },
  {
    id: 'cardioversion',
    name: 'Cardioversión Eléctrica Sincronizada',
    indication: 'FA/flutter con inestabilidad hemodinámica, TSV refractaria a fármacos, TV monomórfica con pulso inestable.',
    material: [
      'Desfibrilador con modo sincronizado',
      'Parches adhesivos o palas',
      'Monitorización continua',
      'Acceso venoso',
      'Material de soporte vital (intubación por si acaso)',
      'Sedación: midazolam, propofol, etomidato'
    ],
    steps: [
      'Informar al paciente si consciente, consentimiento',
      'Ayunas ≥6h ideal (salvo urgencia)',
      'Monitorización completa',
      'Oxígeno',
      'Sedación: propofol 1-1,5 mg/kg o etomidato 0,15-0,3 mg/kg IV',
      'Colocar parches: ápex-esternal o anteroposterior',
      'Activar <strong>MODO SINCRONIZADO</strong> (SYNC)',
      'Verificar marcadores sobre complejos QRS',
      'Seleccionar energía según arritmia',
      'FA: 120-200 J bifásico; flutter: 50-100 J; TSV: 50-100 J; TV: 100 J',
      'Anunciar "despejar", cargar, descarga',
      'Reevaluar ritmo tras descarga',
      'Escalar energía si no resuelve'
    ],
    complications: [
      'Arritmias post-cardioversión',
      'Tromboembolismo (si FA >48h sin anticoagular)',
      'Depresión respiratoria por sedación',
      'Quemaduras cutáneas',
      'Elevación troponina'
    ],
    notes: 'En FA >48h o desconocida: anticoagular 3 sem antes o hacer ETE previa. Si urgencia, cardiovertir con anticoagulación y continuar 4 sem.'
  },
  {
    id: 'cric-emergencia',
    name: 'Cricotiroidotomía de Emergencia',
    indication: '"Can\'t intubate, can\'t oxygenate" — situación de vía aérea imposible con saturación crítica.',
    material: [
      'Bisturí nº 20 (mango rígido)',
      'Bougie (dilatador traqueal)',
      'Tubo endotraqueal 6-6,5',
      'Set de cricotiroidotomía comercial (si disponible)',
      'Material de ventilación'
    ],
    steps: [
      'Extender cuello (almohada bajo hombros)',
      'Localizar membrana cricotiroidea (entre cartílago tiroides y cricoides)',
      'Fijar laringe con mano no dominante',
      'Incisión vertical 3-4 cm sobre la piel',
      'Incisión transversal horizontal de la membrana cricotiroidea',
      'Introducir bougie por el orificio',
      'Deslizar tubo endotraqueal (ballonet fuera de la tráquea) sobre el bougie',
      'Retirar bougie, hinchar ballonet',
      'Confirmar con capnografía',
      'Fijar tubo'
    ],
    complications: [
      'Hemorragia',
      'Creación falso trayecto',
      'Lesión de cuerdas vocales (si posición alta)',
      'Enfisema subcutáneo',
      'Estenosis traqueal tardía'
    ],
    notes: 'Técnica "scalpel-bougie-tube" es la recomendada (DAS 2015). Requiere entrenamiento previo en maniquíes. Tiempo objetivo: <60 segundos.'
  }
];
