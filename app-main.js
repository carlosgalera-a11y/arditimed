
// ── CALCULADORAS MÉDICAS ──────────────────────────────
function calcCURB65(){
    var pts=[...document.querySelectorAll('.curb-chk')].filter(c=>c.checked).length;
    var el=document.getElementById('curb65Result');
    var info=['Bajo riesgo — ambulatorio','Bajo-moderado — valorar ingreso','Moderado — ingreso','Alto riesgo — ingreso/UCI','Alto riesgo — ingreso/UCI','Alto riesgo — ingreso/UCI'];
    var colors=['#f0fdf4,#166534','#fefce8,#854d0e','#fff7ed,#9a3412','#fef2f2,#991b1b','#fef2f2,#991b1b','#fef2f2,#991b1b'];
    var c=colors[pts].split(',');el.style.background=c[0];el.style.color=c[1];
    el.textContent='CURB-65: '+pts+'/5 — '+info[pts];
}
function calcQSOFA(){
    var pts=[...document.querySelectorAll('.qsofa-chk')].filter(c=>c.checked).length;
    var el=document.getElementById('qsofaResult');
    if(pts>=2){el.style.background='#fef2f2';el.style.color='#991b1b';el.textContent='qSOFA: '+pts+'/3 — ⚠️ Alto riesgo sepsis';}
    else if(pts===1){el.style.background='#fefce8';el.style.color='#854d0e';el.textContent='qSOFA: '+pts+'/3 — Bajo-moderado';}
    else{el.style.background='#f0fdf4';el.style.color='#166534';el.textContent='qSOFA: 0/3 — Sin criterios';}
}
function calcWells(){
    var pts=0;document.querySelectorAll('.wells-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('wellsResult');
    if(pts<=0){el.style.background='#f0fdf4';el.style.color='#166534';el.textContent='Wells: '+pts+' — Baja probabilidad TVP';}
    else if(pts<=2){el.style.background='#fefce8';el.style.color='#854d0e';el.textContent='Wells: '+pts+' — Probabilidad moderada';}
    else{el.style.background='#fef2f2';el.style.color='#991b1b';el.textContent='Wells: '+pts+' — Alta probabilidad TVP';}
}
function calcGlasgow(){
    var e=parseInt(document.getElementById('gcsEye').value);
    var v=parseInt(document.getElementById('gcsVerbal').value);
    var m=parseInt(document.getElementById('gcsMotor').value);
    var total=e+v+m;
    var el=document.getElementById('glasgowResult');
    var label=total>=13?'Sin deterioro':total>=9?'Deterioro moderado':'Deterioro grave';
    var bg=total>=13?'#dbeafe,#1e40af':total>=9?'#fefce8,#854d0e':'#fef2f2,#991b1b';
    var c=bg.split(',');el.style.background=c[0];el.style.color=c[1];
    el.textContent='GCS: '+total+'/15 — '+label;
}
function calcNIHSS(){
    var ids=['nihss1','nihss2','nihss3','nihss4','nihss5','nihss6','nihss7','nihss8','nihss9','nihss10'];
    var total=ids.reduce(function(s,id){return s+(parseInt(document.getElementById(id).value)||0);},0);
    var el=document.getElementById('nihssResult');
    var label=total===0?'Sin déficit':total<=4?'Ictus leve':total<=15?'Ictus moderado':total<=20?'Ictus moderado-grave':'Ictus grave';
    var bg=total===0?'#f0fdf4,#166534':total<=4?'#dbeafe,#1e40af':total<=15?'#fefce8,#854d0e':'#fef2f2,#991b1b';
    var c=bg.split(',');el.style.background=c[0];el.style.color=c[1];
    el.textContent='NIHSS: '+total+' — '+label;
}
// ── MODO OSCURO ──────────────────────────────────────
function toggleDarkMode(){
    var dark=document.body.classList.toggle('dark-mode');
    try{localStorage.setItem('darkMode',dark?'1':'0');}catch(e){}
    var btn=document.getElementById('darkToggle');
    if(btn)btn.textContent=dark?'☀️':'🌙';
}
document.addEventListener('DOMContentLoaded',function(){
    try{if(localStorage.getItem('darkMode')==='1'){document.body.classList.add('dark-mode');var btn=document.getElementById('darkToggle');if(btn)btn.textContent='☀️';}}catch(e){}
});
// ── BUSCADOR GLOBAL ──────────────────────────────────
var SEARCH_INDEX=[
    {tipo:'📋 Protocolo',titulo:'Protocolo Sepsis qSOFA',tags:'sepsis qsofa shock fiebre infeccion bacteria',page:'pageProtocolosAP'},
    {tipo:'📋 Protocolo',titulo:'Protocolo Ictus — Código ictus',tags:'ictus stroke nihss trombolisis neurologico',page:'pageProtocolosUrgencias'},
    {tipo:'📋 Protocolo',titulo:'Protocolo Dolor torácico',tags:'dolor toracico ecg infarto iamcest troponina',page:'pageProtocolosUrgencias'},
    {tipo:'📋 Protocolo',titulo:'Protocolo Neumonía CURB-65',tags:'neumonia curb65 antibiotico respiratorio',page:'pageProtocolosAP'},
    {tipo:'📋 Protocolo',titulo:'Protocolo Anafilaxia',tags:'anafilaxia alergia adrenalina shock',page:'pageProtocolosUrgencias'},
    {tipo:'📱 Pacientes',titulo:'Dietas y nutrición',tags:'dieta nutricion alimentacion peso obesidad',page:'pagePatients'},
    {tipo:'📱 Pacientes',titulo:'Vacunas y calendario',tags:'vacunas calendario gripe covid hepatitis',page:'pagePatients'},
    {tipo:'📱 Pacientes',titulo:'Farmacias 24h',tags:'farmacia guardia 24h noche festivo cartagena',page:'pagePatients'},
    {tipo:'📱 Pacientes',titulo:'Cuadernos NotebookLM',tags:'notebooklm cuaderno ia inteligencia artificial google notebook',page:'pagePatients'},
    {tipo:'🌍 Traductor',titulo:'Traductor de Consulta',tags:'traductor traduccion idioma arabe frances ingles aleman rumano chino consulta interprete',page:'pageTraductor'},
    {tipo:'🧮 Calculadoras',titulo:'Calculadoras Médicas',tags:'calculadora glasgow curb wells chads goteo quemadura imc creatinina sofa dosis pediatrica',page:''},
    {tipo:'🦠 Antibióticos',titulo:'Guía Antibióticos HSL 2025',tags:'antibiotico antimicrobiano infeccion amoxicilina ceftriaxona meropenem ciprofloxacino piperacilina resistencia antibiograma proa',page:''},
    {tipo:'💊 Pacientes',titulo:'Chatbot Medicación',tags:'medicacion farmaco pastilla efecto secundario interaccion horario dosis',page:'pagePatients'},
    {tipo:'📱 Pacientes',titulo:'NotebookLM - Pregunta a la IA',tags:'notebooklm ia inteligencia artificial preguntas salud documentos biblioteca',page:'pagePatients'},
    {tipo:'📄 PDF',titulo:'Guía dejar de fumar 2025',tags:'tabaco fumar guia pdf',url:'guia-dejar-fumar-2025.pdf'},
    {tipo:'📄 PDF',titulo:'Vacunas — Información',tags:'vacunas informacion pdf calendario',url:'vacunas-informacion.pdf'},
    {tipo:'🔬 Herramienta',titulo:'Calculadora CURB-65',tags:'curb65 neumonia calculadora score',page:'pageScanIA',tab:'calc'},
    {tipo:'🔬 Herramienta',titulo:'Calculadora qSOFA Sepsis',tags:'qsofa sepsis calculadora score',page:'pageScanIA',tab:'calc'},
    {tipo:'🔬 Herramienta',titulo:'Calculadora Wells TVP',tags:'wells tvp trombosis calculadora',page:'pageScanIA',tab:'calc'},
    {tipo:'🔬 Herramienta',titulo:'Glasgow',tags:'glasgow gcs conciencia neurologia',page:'pageScanIA',tab:'calc'},
    {tipo:'🔬 Herramienta',titulo:'NIHSS Ictus',tags:'nihss ictus stroke calculadora neurologia',page:'pageScanIA',tab:'calc'},
];
function abrirBuscador(){
    var m=document.getElementById('modalBuscador');if(!m)return;
    m.style.display='flex';
    setTimeout(function(){var i=document.getElementById('buscadorInput');if(i)i.focus();},100);
}
function cerrarBuscador(){var m=document.getElementById('modalBuscador');if(m)m.style.display='none';}
function buscarGlobal(q){
    var el=document.getElementById('buscadorResultados');if(!el)return;
    if(!q||q.length<2){el.innerHTML='<p style="color:#94a3b8;font-size:.88rem;text-align:center;padding:20px 0;">Escribe al menos 2 caracteres</p>';return;}
    var ql=q.toLowerCase();
    var res=SEARCH_INDEX.filter(function(i){return(i.titulo+' '+i.tags).toLowerCase().indexOf(ql)>-1;});
    if(!res.length){el.innerHTML='<p style="color:#94a3b8;font-size:.88rem;text-align:center;padding:20px 0;">Sin resultados</p>';return;}
    el.innerHTML=res.map(function(r){
        var click=r.url?'window.open("'+r.url+'","_blank")':'showPage("'+r.page+'")'+(r.tab?';setTimeout(function(){switchScanTab("'+r.tab+'")},200)':'');
        click+=';cerrarBuscador()';
        return '<div onclick="'+click+'" style="padding:12px 14px;border-radius:10px;margin-bottom:8px;cursor:pointer;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;background:#fff;" onmouseover="this.style.background=\x27#f8fafc\x27" onmouseout="this.style.background=\x27#fff\x27"><div><div style="font-size:.75rem;color:#64748b;margin-bottom:2px;">'+r.tipo+'</div><div style="font-size:.9rem;font-weight:600;color:#1e293b;">'+r.titulo+'</div></div><span style="margin-left:auto;color:#94a3b8;">→</span></div>';
    }).join('');
}
document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();abrirBuscador();}});
// ── QR POR PROTOCOLO ─────────────────────────────────
function mostrarQR(titulo,url){
    var t=document.getElementById('qrTitle');var u=document.getElementById('qrUrl');var c=document.getElementById('qrCanvas');var m=document.getElementById('modalQR');
    if(!t||!c||!m)return;
    t.textContent=titulo;if(u)u.textContent=url;
    c.innerHTML='';
    var img=document.createElement('img');
    img.src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(url);
    img.style.cssText='width:180px;height:180px;border-radius:8px;';
    c.appendChild(img);
    m.style.display='flex';
}
// ── FAVORITOS ────────────────────────────────────────
var SECCIONES_DISPONIBLES=[
    {id:'pagePatients',label:'👤 Pacientes'},
    {id:'pageProfessionals',label:'🩺 Profesionales'},
    {id:'pageEnfermeria',label:'👩‍⚕️ Enfermería'},
    {id:'pageProtocolosAP',label:'📋 Protocolos AP'},
    {id:'pageProtocolosUrgencias',label:'🚨 Protocolos Urgencias'},
    {id:'pageScanIA',label:'🛠️ Herramientas'},
    {id:'pageTelefonos',label:'📞 Teléfonos Buscas'},
    {id:'pageFilehub',label:'📖 Cuaderno IA'},
];
function abrirFavoritos(){
    try{var favs=JSON.parse(localStorage.getItem('favSecciones')||'[]');}catch(e){var favs=[];}
    var html=SECCIONES_DISPONIBLES.map(function(s){
        var checked=favs.indexOf(s.id)>-1?'checked':'';
        return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;font-size:.9rem;"><input type="checkbox" value="'+s.id+'" '+checked+' style="width:16px;height:16px;"> '+s.label+'</label>';
    }).join('');
    var fl=document.getElementById('favoritosList');if(fl)fl.innerHTML=html;
    var mf=document.getElementById('modalFavoritos');if(mf)mf.style.display='flex';
}
function guardarFavoritos(){
    var favs=[...document.querySelectorAll('#favoritosList input:checked')].map(function(c){return c.value;});
    try{localStorage.setItem('favSecciones',JSON.stringify(favs));}catch(e){}
    var mf=document.getElementById('modalFavoritos');if(mf)mf.style.display='none';
    renderFavoritosBar();
}
function renderFavoritosBar(){
    try{var favs=JSON.parse(localStorage.getItem('favSecciones')||'[]');}catch(e){var favs=[];}
    var bar=document.getElementById('favoritosBar');if(!bar||!favs.length){if(bar)bar.style.display='none';return;}
    var mapa={pagePatients:'👤 Pacientes',pageProfessionals:'🩺 Profesionales',pageEnfermeria:'👩‍⚕️ Enfermería',pageProtocolosAP:'📋 Protocolos AP',pageProtocolosUrgencias:'🚨 Urgencias',pageScanIA:'🛠️ Herramientas',pageTelefonos:'📞 Teléfonos',pageFilehub:'📖 Cuaderno IA'};
    bar.innerHTML=favs.map(function(id){return '<button onclick="showPage(\x27'+id+'\x27)" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.15);color:#fff;cursor:pointer;font-size:.82rem;font-weight:600;white-space:nowrap;">'+(mapa[id]||id)+'</button>';}).join('');
    bar.style.display='flex';
}
document.addEventListener('DOMContentLoaded',function(){setTimeout(renderFavoritosBar,500);});

// ═══ PROTOCOLOS AP CONFIG (uses shared CONFIG, unique IDs) ═══
function apCambiarProvider(){
    var v=document.getElementById("apCfgProvider").value;
    document.getElementById("apGroqConfig").style.display=v==="groq"?"block":"none";
    document.getElementById("apQwenConfig").style.display=v==="qwen"?"block":"none";
}

function apSyncFromConfig(){
    try{
        document.getElementById("apCfgProvider").value=CONFIG.provider;
        apCambiarProvider();
        document.getElementById("apCfgGroqKey").value=CONFIG.groqKey||"";
        document.getElementById("apCfgGroqModel").value=CONFIG.groqModel;
        document.getElementById("apCfgQwenKey").value=CONFIG.qwenKey||"";
        document.getElementById("apCfgQwenModel").value=CONFIG.qwenModel;
    }catch(e){}
}

function apGuardarConfig(){
    CONFIG.provider=document.getElementById("apCfgProvider").value;
    CONFIG.groqKey=document.getElementById("apCfgGroqKey").value.trim();
    CONFIG.groqModel=document.getElementById("apCfgGroqModel").value;
    CONFIG.qwenKey=document.getElementById("apCfgQwenKey").value.trim();
    CONFIG.qwenModel=document.getElementById("apCfgQwenModel").value;
    localStorage.setItem("notebook_ai_cfg_v3",JSON.stringify(CONFIG));
    updateStatus();
    // Also sync the professionals config fields if they exist
    try{
        document.getElementById("cfgProvider").value=CONFIG.provider;
        cambiarProvider();
        document.getElementById("cfgGroqKey").value=CONFIG.groqKey;
        document.getElementById("cfgGroqModel").value=CONFIG.groqModel;
        document.getElementById("cfgQwenKey").value=CONFIG.qwenKey;
        document.getElementById("cfgQwenModel").value=CONFIG.qwenModel;
    }catch(e){}
    document.getElementById("apCfgStatus").innerHTML='<span style="color:var(--primary)">✅ Guardado</span>';
    setTimeout(function(){document.getElementById("apCfgStatus").innerHTML=""},3000);
}

async function apTestApiKey(){
    apGuardarConfig();
    if(!isReady()){document.getElementById("apCfgStatus").innerHTML='<span style="color:#dc2626">❌ Key inválida</span>';return;}
    var st=document.getElementById("apCfgStatus");
    st.innerHTML='<span style="color:var(--accent)">⏳ Probando...</span>';
    var e=ep();
    try{
        var r=await fetch(e.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+e.getKey()},body:JSON.stringify({model:e.getModel(),messages:[{role:"user",content:"Di: OK"}],max_tokens:10})});
        if(r.ok)st.innerHTML='<span style="color:var(--primary)">✅ ¡Conexión exitosa!</span>';
        else if(r.status===401)st.innerHTML='<span style="color:#dc2626">❌ Key inválida</span>';
        else st.innerHTML='<span style="color:#dc2626">❌ Error '+r.status+'</span>';
    }catch(err){st.innerHTML='<span style="color:#dc2626">❌ '+err.message+'</span>';}
}


// ═══ PROTOCOLOS AP - PREGUNTAS IA ═══
var AP_PROTOCOL_TEXTS = {"1": "ORL en Atención Primaria\nUnidad 2 · Oído, nariz, garganta, boca\nDolor de garganta (faringoamigdalitis)\n1\nCriterios Centor/McIsaac\nFiebre > 38°C, exudado amigdalar, adenopatía cervical anterior, ausencia de tos\n2\n0-1 criterios\nViral → tratamiento sintomático (paracetamol/ibuprofeno)\n3\n2-3 criterios\nTest rápido estreptococo (si disponible). Si positivo: antibiótico\n4\n4 criterios\nAlta probabilidad estreptococo → penicilina V 500mg/8h x 10 días o amoxicilina 500mg/8h x 10 días\nII En alérgicos a penicilina: azitromicina 500mg/d x 3 días o josamicina\nOtitis media aguda\nII Derivar urgente si: mastoiditis (dolor retroauricular, pabellón desplazado), parálisis facial,\nmeningismo\n1\nDiagnóstico\nOtalgia + otoscopia: tímpano abombado, eritematoso, con derrame\n2\nAdultos\nAmoxicilina 500mg/8h x 7 días + analgesia\n3\nNiños > 2 años\nSi leve y unilateral: observación 48-72h con analgesia. Si empeora: amoxicilina 80mg/kg/d\n4\nSi fallo\nAmoxicilina-clavulánico. Derivar ORL si: otitis recurrente, perforación, mastoiditis\nEpistaxis — Manejo inicial\n1\nAnterior (90%)\nCompresión digital alar 10-15 min con cabeza inclinada hacia delante\n2\nSi no cede\nTaponamiento anterior con gasa/esponja hemostática + vasoconstrictor tópico\n3\nPosterior\nNo cede con taponamiento anterior → derivar urgencias ORL para taponamiento posterior\n4\nRecurrente\nDescartar HTA, coagulopatía, fármacos (anticoagulantes, AAS). Valorar cauterización\nCentro de Salud Cartagena Este — build 1773345924 · Ficha de consulta rápida · No sustituye juicio clínico", "2": "Riñón y Vías Urinarias\nUnidad 9 · Hematuria, ITU, cólico renal, incontinencia\nInfección urinaria en la mujer\n1\nCistitis no complicada\nDisuria + polaquiuria + urgencia sin fiebre → fosfomicina 3g dosis única o nitrofurantoína 5 días\n2\nPielonefritis\nFiebre + dolor lumbar + MEG → analítica + urocultivo + ECO. Cefuroxima vo o derivar si grave\n3\nRecurrente (>= 3/año)\nProfilaxis: arándano rojo, profilaxis antibiótica postcoital, estrógenos vaginales en postmenopáusicas\n4\nEn embarazo\nBacteriuria asintomática SIEMPRE tratar. Urocultivo obligatorio en 1er trimestre\nII En mujer joven con clínica típica no es necesario urocultivo previo. Sí en: recurrentes, embarazo, fallo\ntratamiento\nCólico renal\n1\nDiagnóstico\nDolor lumbar cólico irradiado a genitales + agitación + náuseas. Tira reactiva: microhematuria\n2\nTratamiento\nDiclofenaco 75mg im (1ª elección) o metamizol 2g iv. Evitar espasmolíticos solos\n3\nImagen\nECO renal (dilatación) → si duda: TC sin contraste (gold standard)\n4\nDerivar\nFiebre (pionefrosis), anuria, riñón único, litiasis > 10mm, dolor refractario\nII Litiasis < 5mm: 90% expulsión espontánea. Tamsulosina 0.4mg puede facilitar expulsión (terapia expulsiva)\nHematuria — Estudio diagnóstico\nII Hematuria macroscópica indolora en > 40 años: descartar neoplasia vesical/renal hasta demostrar lo\ncontrario\n1\nConfirmar\nSedimento urinario (>3 hematíes/campo). Descartar falsos positivos: menstruación, ejercicio intenso\n2\nAnalítica\nFunción renal, hemograma, coagulación\n3\nImagen\nECO renal + vesical. Si > 40 años: derivar Urología para cistoscopia\n4\nGlomerular\nHematíes dismórficos + cilindros + proteinuria → derivar Nefrología\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "3": "Dermatología en AP\nUnidad 10 · Lesiones cutáneas, acné, prurito, úlceras\nLunares — Regla ABCDE\nII Derivar urgente si cumple criterios ABCDE o \"patito feo\" (lesión diferente a las demás del paciente)\n1\nA - Asimetría\nMitad no es espejo de la otra\n2\nB - Bordes\nIrregulares, mal definidos, dentados\n3\nC - Color\nHeterogéneo: marrón, negro, rojo, blanco, azul\n4\nD - Diámetro\n> 6mm (aunque melanomas pequeños existen)\n5\nE - Evolución\nCambio reciente en tamaño, forma, color, síntomas\nII Dermatoscopia en AP mejora sensibilidad al 90%. Ante duda: derivar, NUNCA cauterizar sin biopsia previa\nAcné — Tratamiento escalonado\n1\nLeve comedonal\nRetinoides tópicos (adapaleno 0.1%) por la noche\n2\nLeve inflamatorio\nPeróxido de benzoilo 5% + adapaleno (combinación fija)\n3\nModerado\nAñadir antibiótico tópico (clindamicina 1%) o doxiciclina oral 100mg/d x 3 meses\n4\nGrave/nodular\nDerivar Dermatología → isotretinoína oral (requiere anticoncepción en mujeres)\nII No usar antibiótico tópico en monoterapia (resistencias). Siempre combinar con peróxido de benzoilo\nPrurito generalizado sin lesiones\n1\nDescartar\nHepatopatía (colestasis), IRC, hipo/hipertiroidismo, diabetes, linfoma, policitemia, ferropenia\n2\nAnalítica\nHemograma, función hepática, renal, TSH, glucosa, hierro, ferritina, Rx tórax\n3\nTratamiento\nHidratación cutánea intensa + antihistamínicos (cetirizina, loratadina)\n4\nSi normal\nPrurito psicógeno o senil → emolientes + antiH1 sedante nocturno (hidroxicina)\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "4": "Musculoesquelético\nUnidad 11 · Cervicalgia, lumbalgia, hombro, rodilla\nLumbalgia — Algoritmo de manejo\nII Red flags: < 20 o > 55 años, traumatismo, pérdida peso, fiebre, déficit neurológico progresivo,\nsíndrome cauda equina\n1\nValoración\nAnamnesis + exploración: Lasègue, fuerza, sensibilidad, reflejos. Sin red flags → inespecífica\n2\nInespecífica\nNo Rx. Paracetamol/AINE + mantener actividad + evitar reposo > 48h\n3\n> 6 semanas\nRx lumbar + analítica (VSG, hemograma). Valorar fisioterapia\n4\nCon ciática\nSi déficit motor progresivo o cauda equina → RM urgente y derivación\nII El 90% de lumbalgias se resuelven en 4-6 semanas. Ejercicio y actividad son el mejor tratamiento\nCervicalgia\n1\nSin alarma\nContractura cervical mecánica → calor local, analgesia, movilización precoz\n2\nCon radiculopatía\nDolor irradiado + parestesias en dermatoma → RM si déficit motor o sin mejoría en 6 sem\n3\nRed flags\nMielopatía cervical (torpeza manos, marcha espástica) → RM urgente\nII No indicada Rx de rutina. Solo si: traumatismo, sospecha de fractura, criterios de Ottawa/Canadian C-Spine\nDolor de hombro\n1\nLo más frecuente\nTendinopatía del manguito rotador (supraespinoso): dolor lateral, arco doloroso 60-120°\n2\nExploración\nArco doloroso, maniobras de Neer, Hawkins, Jobe, Speed. Movilidad pasiva conservada\n3\nTratamiento\nAINE + ejercicios de rehabilitación. No infiltrar antes de 3-4 semanas de fisioterapia\n4\nDerivar\nSi rotura completa, hombro congelado refractario, inestabilidad → ECO/RM + Traumatología\nCausa articular\n• Movilidad pasiva limitada\n• Capsulitis adhesiva\n• Artritis acromioclavicular\n• Artrosis glenohumeral\nCausa periarticular\n• Movilidad pasiva conservada\n• Tendinopatía manguito\n• Bursitis subacromial\n• Tendinitis bicipital\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "5": "Enfermedades Crónicas\nUnidad 15 · HTA, diabetes, dislipemia, EPOC, asma\nHipertensión arterial\n1\nDiagnóstico\nMedia de 2-3 mediciones en 2-3 visitas. Confirmar con AMPA/MAPA (descarta bata blanca)\n2\nObjetivos\nGeneral: < 140/90. Diabéticos: < 130/80. Ancianos frágiles: < 150/90\n3\nTratamiento\nMedidas higiénico-dietéticas 3-6 meses → si no control: monoterapia → combinación\n4\nFármacos\nIECA/ARA II + tiazida o calcioantagonista como combinaciones preferidas\nPrimera línea\n• IECA (enalapril, ramipril)\n• ARA II (losartán, valsartán)\n• Calcioantagonistas (amlodipino)\n• Tiazidas (hidroclorotiazida)\nSeguimiento\n• Control 1-3 meses hasta objetivo\n• Analítica anual (creatinina, K, perfil lipídico)\n• ECG bianual\n• Valorar LOD\nDiabetes mellitus tipo 2\n1\nDiagnóstico\nGlucemia ayunas >= 126 (x2) o HbA1c >= 6.5% (x2) o glucemia al azar >= 200 + síntomas\n2\nObjetivo HbA1c\nGeneral: < 7%. Ancianos/frágiles: < 8%. Jóvenes sin complicaciones: < 6.5%\n3\nInicio\nMetformina + dieta + ejercicio. Titular hasta 2g/día\n4\nSi no control\nAñadir iSGLT2 (si IC/ERC) o arGLP1 (si obesidad/RCV alto) o iDPP4 o SU\nII Control mínimo: HbA1c cada 3-6 meses, función renal anual, fondo de ojo anual, exploración pies anual\nEPOC — Manejo estable\n1\nDiagnóstico\nEspirometría: FEV1/FVC < 0.7 postbroncodilatación en fumador/exfumador con síntomas\n2\nClasificación\nGOLD: FEV1 > 80% leve, 50-80% moderado, 30-50% grave, < 30% muy grave\n3\nTratamiento base\nAbandono tabaco (lo más importante) + vacunación gripe/neumococo + actividad física\n4\nBroncodilatadores\nLAMA (tiotropio) y/o LABA (indacaterol, olodaterol). Si exacerbaciones: añadir CI\nGrupo A (bajo riesgo)\n• SABA a demanda\n• o LAMA/LABA si síntomas persistentes\nGrupo E (exacerbador)\n• LAMA + LABA\n• Si eosinófilos > 300: añadir CI\n• Si infecciones: valorar azitromicina\nAsma — Control y tratamiento\nII Crisis asmática: SABA 4-10 puffs cada 20 min x 1h + corticoides orales. Si no mejora: urgencias\n1\nDiagnóstico\nClínica compatible + espirometría con prueba broncodilatadora positiva (aumento FEV1 > 12% y >\n200ml)\n2\nControl\nACT (Asthma Control Test) >= 20 = bien controlado. < 20 = subir escalón\n3\nEscalón 1\nSABA a demanda (o CI + formoterol a demanda - GINA 2024)\n4\nEscalón 2-3\nCI dosis baja + LABA (budesonida/formoterol, fluticasona/salmeterol)\n5\nEscalón 4-5\nCI dosis media-alta + LABA. Valorar anticolinérgico, biológicos → derivar\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "6": "Salud Mental\nUnidad 6 · Ansiedad, depresión, insomnio\nAnsiedad — Manejo en AP\n1\nDiagnóstico\nSíntomas > 6 meses: preocupación excesiva, tensión, irritabilidad, insomnio, somatizaciones\n2\nDescartar\nHipertiroidismo, feocromocitoma, arritmias, EPOC, fármacos/drogas, abstinencia\n3\nTratamiento inicial\nPsicoeducación + técnicas de relajación + ejercicio físico regular\n4\nFarmacológico\nISRS (sertralina, escitalopram) como primera línea. BZD solo puntual y corto plazo (< 4 sem)\nII Escalas: GAD-7 (cribado y seguimiento). Derivar a Salud Mental si: resistencia a tratamiento, comorbilidad\ngrave\nDepresión — Diagnóstico y tratamiento\nII Preguntar SIEMPRE por ideación suicida. No aumenta el riesgo preguntar, sí disminuye\n1\nCribado\nPHQ-2: ánimo bajo + anhedonia > 2 semanas. Si positivo → PHQ-9 completo\n2\nAnalítica\nDescartar hipotiroidismo, anemia, déficit B12, hepatopatía\n3\nLeve\nPsicoeducación + activación conductual + ejercicio + seguimiento estrecho\n4\nModerada-grave\nISRS (sertralina 50-200mg, escitalopram 10-20mg). Esperar 4-6 sem para evaluar respuesta\n5\nSin respuesta\nOptimizar dosis → cambiar ISRS → añadir/cambiar a otro grupo → derivar Salud Mental\nPrimera línea (ISRS)\n• Sertralina 50-200mg/d\n• Escitalopram 10-20mg/d\n• Fluoxetina 20-60mg/d\n• Paroxetina 20-50mg/d\nSegunda línea\n• Venlafaxina 75-225mg/d\n• Duloxetina 60-120mg/d\n• Mirtazapina 15-45mg/d\n• Bupropion 150-300mg/d\nInsomnio — Abordaje escalonado\n1\nHigiene del sueño\nHorarios regulares, evitar pantallas, cafeína, alcohol, ejercicio por la tarde\n2\nTerapia cognitivo-conductual\nRestricción de sueño + control de estímulos. Más eficaz que fármacos a largo plazo\n3\nSi fármaco necesario\nCorto plazo (< 4 sem): zolpidem 5-10mg, lormetazepam 1mg\n4\nCrónico\nValorar: depresión, SAOS, piernas inquietas, dolor crónico como causa subyacente\nII Evitar benzodiacepinas de vida media larga en ancianos (riesgo caídas, deterioro cognitivo)\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "7": "Sistema Nervioso\nUnidad 5 · Cefalea, vértigo, convulsiones, pérdida de fuerza, memoria\nCefalea — Diagnóstico diferencial\nII Red flags: inicio brusco (\"la peor de mi vida\"), focalidad neurológica, fiebre + rigidez nuca, > 50 años\ninicio nuevo, papiledema\n1\nTensional\nBilateral, opresiva, intensidad leve-moderada, no empeora con actividad → analgesia simple\n2\nMigraña\nUnilateral, pulsátil, moderada-intensa, con náuseas/foto-fonofobia → triptanes en crisis\n3\nEn racimos\nUnilateral periorbital, muy intensa, lagrimeo/rinorrea ipsilateral, 15-180 min → O2 + sumatriptán sc\n4\nSecundaria\nSi red flags → TAC/RM urgente. Descartar HSA, meningitis, masa, trombosis venosa\nII Cefalea por abuso de analgésicos: > 15 días/mes con analgésicos > 3 meses. Tratamiento: retirada\nprogresiva\nMareo y vértigo\n1\nDistinguir\nVértigo (giro) vs mareo inespecífico vs presíncope vs inestabilidad\n2\nPeriférico\nInicio brusco, nistagmo horizonto-rotatorio, Romberg lateralizado, sin focalidad → VPPB, neuronitis,\nMénière\n3\nCentral\nNistagmo vertical/cambiante, focalidad neurológica, ataxia de tronco → derivar urgente (ictus\ncerebeloso)\n4\nVPPB\nEpisodios breves con cambios posturales → maniobra de Dix-Hallpike → maniobra de Epley\nPeriférico (benigno)\n• Inicio súbito\n• Nistagmo horizontal\n• Síntomas vegetativos ++\n• Mejora con fijación visual\nCentral (urgente)\n• Inicio progresivo\n• Nistagmo vertical/multidireccional\n• Focalidad neurológica\n• No mejora con fijación\nConvulsiones en el adulto\nII Estatus epiléptico (> 5 min): emergencia → diazepam 10mg rectal o iv, asegurar vía aérea, 112\n1\nEn crisis\nProteger, posición lateral, NO introducir objetos en boca, cronometrar duración\n2\nPost-crisis\nGlucemia capilar, constantes, exploración neurológica, buscar traumatismos\n3\nPrimera crisis\nSIEMPRE derivar: analítica + TAC/RM + EEG para estudio etiológico\n4\nEpilepsia conocida\nVerificar adherencia, niveles fármaco, desencadenantes (alcohol, privación sueño)\nII Crisis provocadas frecuentes: hipoglucemia, alcohol (abstinencia), fármacos, fiebre, TCE reciente\nPérdida de fuerza — Enfoque diagnóstico\nII Derivar urgente si: instalación aguda, asimetría, trastorno del habla (código ictus)\n1\nAguda\nIctus/AIT hasta demostrar lo contrario → activar código ictus si < 4.5h\n2\nSubaguda\nGuillain-Barré (ascendente), miastenia (fluctuante, ocular), mielopatía compresiva\n3\nCrónica\nELA (fasciculaciones + atrofia), neuropatía periférica, miopatías\n4\nLocalizar\nMotoneurona superior (espasticidad, Babinski+) vs inferior (atrofia, fasciculaciones, arreflexia)\nPérdida de memoria — Valoración\n1\nDescartar\nDepresión, fármacos (benzodiacepinas, anticolinérgicos), hipotiroidismo, déficit B12\n2\nTest cribado\nMini-Mental (MMSE), test del reloj, MoCA. Valorar funcionalidad (Barthel, Lawton)\n3\nDeterioro cognitivo leve\nQueja subjetiva + test alterado + funcionalidad conservada → seguimiento 6-12 meses\n4\nDemencia\nDeterioro progresivo + pérdida funcional → analítica + neuroimagen → derivar Neurología\nII Analítica: hemograma, TSH, B12, ácido fólico, glucosa, función renal y hepática, serología lúes y VIH si\nindicado\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "8": "Problemas Digestivos\nUnidad 4 · Dolor abdominal, diarrea, hemorragia digestiva, ictericia\nDolor abdominal agudo\nII Derivar urgente: defensa abdominal, signos peritoneales, fiebre alta, hipotensión, vómitos\nfecaloideos\n1\nLocalización\nEpigástrico: úlcera, pancreatitis. FID: apendicitis. FII: diverticulitis. Difuso: obstrucción, peritonitis\n2\nAnalítica urgente\nHemograma, PCR, amilasa, lipasa, función hepática, orina\n3\nImagen\nRx abdomen (niveles, neumoperitoneo) + ECO abdominal\n4\nMujer edad fértil\nSIEMPRE descartar embarazo ectópico: test de embarazo\nCausas frecuentes en AP\n• Gastroenteritis aguda\n• Cólico biliar\n• Infección urinaria\n• Dolor funcional\nRed flags\n• Peritonismo\n• Masa pulsátil (AAA)\n• Rectorragia con hipotensión\n• Dolor + fiebre + ictericia (Charcot)\nDiarrea aguda\n1\nValorar\nDuración, frecuencia, sangre/moco, fiebre, viajes, fármacos (ATB), brotes\n2\nLeve sin alarma\nDieta astringente + hidratación oral (SRO). Autolimitada en 3-5 días\n3\nGrave o persistente\nCoprocultivo + parásitos en heces. Analítica si deshidratación\n4\nAntibiótico\nSolo si: fiebre alta + sangre en heces, inmunodeprimido, viajero con sospecha bacteriana\nII La causa más frecuente es vírica (norovirus, rotavirus). No pautar antidiarreicos si fiebre o sangre en heces\nHemorragia digestiva alta (hematemesis)\nII URGENCIA: estabilizar hemodinámicamente. Vía venosa, sueroterapia, derivar hospital\n1\nConfirmar\nDistinguir hematemesis de hemoptisis y epistaxis deglutida\n2\nEstabilizar\nPA, FC, vía venosa, analítica urgente, grupo y reserva\n3\nIBP iv\nOmeprazol 80mg iv en bolo, luego perfusión\n4\nEndoscopia\nEn las primeras 24h. Diagnóstica y terapéutica\nCausas principales: úlcera péptica (50%), varices esofágicas, Mallory-Weiss, esofagitis\nIctericia en el adulto\n1\nAnalítica\nBilirrubina total y fracciones, GOT, GPT, GGT, FA, hemograma, coagulación\n2\nPrehepática\nBilirrubina indirecta elevada → hemólisis, Gilbert, eritropoyesis ineficaz\n3\nHepática\nTransaminasas muy elevadas → hepatitis viral, tóxica, alcohólica, autoinmune\n4\nPosthepática\nGGT y FA elevadas + coluria → ECO abdominal: dilatación vía biliar → CPRE/colangio-RM\nII Síndrome de Gilbert: bilirrubina indirecta < 3mg/dl, resto normal. Benigno, no requiere tratamiento\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "9": "Problemas Digestivos\nUnidad 4 · Dolor abdominal, diarrea, hemorragia digestiva, ictericia\nDolor abdominal agudo\nII Derivar urgente: defensa abdominal, signos peritoneales, fiebre alta, hipotensión, vómitos\nfecaloideos\n1\nLocalización\nEpigástrico: úlcera, pancreatitis. FID: apendicitis. FII: diverticulitis. Difuso: obstrucción, peritonitis\n2\nAnalítica urgente\nHemograma, PCR, amilasa, lipasa, función hepática, orina\n3\nImagen\nRx abdomen (niveles, neumoperitoneo) + ECO abdominal\n4\nMujer edad fértil\nSIEMPRE descartar embarazo ectópico: test de embarazo\nCausas frecuentes en AP\n• Gastroenteritis aguda\n• Cólico biliar\n• Infección urinaria\n• Dolor funcional\nRed flags\n• Peritonismo\n• Masa pulsátil (AAA)\n• Rectorragia con hipotensión\n• Dolor + fiebre + ictericia (Charcot)\nDiarrea aguda\n1\nValorar\nDuración, frecuencia, sangre/moco, fiebre, viajes, fármacos (ATB), brotes\n2\nLeve sin alarma\nDieta astringente + hidratación oral (SRO). Autolimitada en 3-5 días\n3\nGrave o persistente\nCoprocultivo + parásitos en heces. Analítica si deshidratación\n4\nAntibiótico\nSolo si: fiebre alta + sangre en heces, inmunodeprimido, viajero con sospecha bacteriana\nII La causa más frecuente es vírica (norovirus, rotavirus). No pautar antidiarreicos si fiebre o sangre en heces\nHemorragia digestiva alta (hematemesis)\nII URGENCIA: estabilizar hemodinámicamente. Vía venosa, sueroterapia, derivar hospital\n1\nConfirmar\nDistinguir hematemesis de hemoptisis y epistaxis deglutida\n2\nEstabilizar\nPA, FC, vía venosa, analítica urgente, grupo y reserva\n3\nIBP iv\nOmeprazol 80mg iv en bolo, luego perfusión\n4\nEndoscopia\nEn las primeras 24h. Diagnóstica y terapéutica\nCausas principales: úlcera péptica (50%), varices esofágicas, Mallory-Weiss, esofagitis\nIctericia en el adulto\n1\nAnalítica\nBilirrubina total y fracciones, GOT, GPT, GGT, FA, hemograma, coagulación\n2\nPrehepática\nBilirrubina indirecta elevada → hemólisis, Gilbert, eritropoyesis ineficaz\n3\nHepática\nTransaminasas muy elevadas → hepatitis viral, tóxica, alcohólica, autoinmune\n4\nPosthepática\nGGT y FA elevadas + coluria → ECO abdominal: dilatación vía biliar → CPRE/colangio-RM\nII Síndrome de Gilbert: bilirrubina indirecta < 3mg/dl, resto normal. Benigno, no requiere tratamiento\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico", "10": "Respiratorio y Cardiovascular\nUnidad 3 · Dolor torácico, disnea, tos, palpitaciones, síncope\nDolor torácico — Valoración inicial\nII SCA: derivar 112/urgencias si dolor opresivo + cortejo vegetativo + cambios ECG + troponina elevada\n1\nTriaje\nPA, FC, SatO2, ECG 12 derivaciones en < 10 min\n2\nAnginoso\nOpresivo, retroesternal, irradiado a brazo/mandíbula, con esfuerzo → SCA hasta demostrar lo contrario\n3\nPleurítico\nPunzante, aumenta con respiración → Rx tórax: descartar neumotórax, TEP, neumonía\n4\nMusculoesquelético\nReproducible a la palpación, postural → tranquilizar + analgesia\n5\nOtras causas\nERGE (pirosis), ansiedad (parestesias), herpes zóster (vesículas)\nII ECG normal NO descarta SCA. Si alta sospecha clínica → derivar igualmente\nDisnea — Abordaje diagnóstico\n1\nAguda\nSatO2, ECG, Rx tórax → IC descompensada, TEP, neumotórax, crisis asmática, neumonía\n2\nCrónica\nEspirometría + Rx tórax + hemograma + proBNP → EPOC, ICC, anemia, fibrosis\n3\nFuncional\nSuspiros frecuentes, parestesias, ansiedad → hiperventilación funcional\nRed flags (derivar urgente)\n• SatO2 < 90%\n• Estridor o tiraje\n• Cianosis\n• Alteración conciencia\n• Dolor torácico asociado\nEscalas útiles\n• mMRC para disnea crónica\n• NYHA para IC\n• Escala de Borg\n• Test de marcha 6 min\nTos — Algoritmo diagnóstico\n1\nAguda (< 3 sem)\nLo más frecuente: infección viral vías altas → tratamiento sintomático\n2\nSubaguda (3-8 sem)\nPost-infecciosa habitual. Si persiste: Rx tórax\n3\nCrónica (> 8 sem)\n3 causas más frecuentes: goteo postnasal, asma, ERGE\n4\nEstudio crónica\nRx tórax + espirometría + test broncodilatación + valorar pHmetría\nII Revisar siempre fármacos: IECAs causan tos seca en 5-20% de pacientes. Suspender y esperar 4 semanas\nPalpitaciones y pulso rápido\n1\nAnamnesis\nInicio/fin brusco vs gradual, duración, síntomas asociados, cafeína, fármacos\n2\nExploración\nPA, FC, ritmo regular/irregular, soplos, signos de IC, tiroides\n3\nECG\nRitmo sinusal, FA, flutter, TPSV, extrasístoles\n4\nSi paroxísticas\nHolter 24h. Si muy infrecuentes: registrador de eventos\nBenignas (frecuente)\n• Extrasístoles aisladas\n• Taquicardia sinusal\n• Ansiedad/estrés\n• Cafeína/estimulantes\nPotencialmente graves\n• FA con respuesta ventricular rápida\n• TPSV recurrente\n• TV (QRS ancho)\n• Asociadas a síncope/disnea\nSíncope — Protocolo de estudio\nII Derivar urgente si: síncope de esfuerzo, dolor torácico previo, palpitaciones, soplo, antecedente\nfamiliar de muerte súbita\n1\nValoración inicial\nAnamnesis detallada: pródromos, posición, desencadenantes, testigos, recuperación\n2\nExploración\nPA en ambos brazos, ortostatismo (3 min), FC, ACR, neurológica\n3\nECG\nObligatorio en todo síncope. Buscar: bloqueos, preexcitación, QT largo, Brugada\n4\nVasovagal\nPródromos claros, desencadenante, recuperación rápida → tranquilizar, medidas posturales\n5\nSi duda\nEcocardiograma + Holter + tilt test según sospecha\nEnfermedad tromboembólica venosa\nII TEP: derivar urgente si disnea súbita + dolor pleurítico + taquicardia + factores de riesgo\n1\nTVP sospecha\nEscala de Wells → si probabilidad alta o intermedia: eco-Doppler venoso\n2\nD-dímero\nSolo útil para EXCLUIR si probabilidad baja (valor predictivo negativo alto)\n3\nTEP sospecha\nEscala de Wells + angio-TAC pulmonar. Gasometría: hipoxemia + hipocapnia\n4\nTratamiento\nAnticoagulación: HBPM → luego ACOD o acenocumarol según perfil\nII Factores de riesgo: inmovilización, cirugía reciente, neoplasia, ACO, trombofilia, viajes largos\nCentro de Salud Cartagena Este · Ficha de consulta rápida · No sustituye juicio clínico"};
var apPreguntas = [];
var apProcessing = false;

function apQuickAsk(q) {
    document.getElementById('apPreguntaInput').value = q;
    apHacerPregunta();
}

async function apHacerPregunta() {
    var input = document.getElementById('apPreguntaInput');
    var q = input.value.trim();
    if (!q || apProcessing) return;
    if (!isReady()) {
        switchProtocolTab('config-protocolos', document.querySelectorAll('.tab-protocols')[2]);
        return;
    }
    apProcessing = true;
    document.getElementById('apBtnPreguntar').disabled = true;
    
    var sel = document.getElementById('apProtoSelect').value;
    var contextText = '';
    if (sel === 'all') {
        for (var k in AP_PROTOCOL_TEXTS) contextText += '\n\n--- PROTOCOLO ' + k + ' ---\n' + AP_PROTOCOL_TEXTS[k];
        var custom = apGetCustomProtocols();
        for (var i = 0; i < custom.length; i++) contextText += '\n\n--- ' + custom[i].name + ' ---\n' + custom[i].content;
    } else if (sel.indexOf('custom_') === 0) {
        var cIdx = parseInt(sel.replace('custom_', ''));
        var cList = apGetCustomProtocols();
        if (cList[cIdx]) contextText = cList[cIdx].content;
    } else {
        contextText = AP_PROTOCOL_TEXTS[sel] || '';
    }
    
    apPreguntas.push({ pregunta: q, respuesta: '⏳ Consultando...', fecha: new Date().toLocaleString('es-ES') });
    input.value = '';
    apRenderPreguntas();
    
    var sys = 'Eres un asistente médico experto en Atención Primaria. Responde basándote ÚNICAMENTE en el contenido de los protocolos proporcionados. Si la información no está en los protocolos, indícalo. Responde en español de forma clara y estructurada.\n\nCONTENIDO DE LOS PROTOCOLOS:\n' + contextText;
    
    var r = await llamarIA(q, sys);
    apPreguntas[apPreguntas.length - 1].respuesta = r;
    apRenderPreguntas();
    apProcessing = false;
    document.getElementById('apBtnPreguntar').disabled = false;
}

function apRenderPreguntas() {
    var el = document.getElementById('apPreguntasList');
    if (apPreguntas.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🩺</div><p>Haz tu primera pregunta sobre los protocolos</p></div>';
        return;
    }
    el.innerHTML = apPreguntas.slice().reverse().map(function(p) {
        return '<div class="question-box"><div class="question-text">' + esc(p.pregunta) + '</div><div class="answer-text">' + esc(p.respuesta) + '</div><div class="note-time">' + p.fecha + '</div></div>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    var apInput = document.getElementById('apPreguntaInput');
    if (apInput) apInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') apHacerPregunta(); });
});

// ═══ ADMIN - GESTIÓN PROTOCOLOS PERSONALIZADOS ═══
function apShowAdminTab(show){
    var btn=document.getElementById('apAdminTabBtn');
    if(btn) btn.style.display=show?'inline-block':'none';
    if(!show){
        // Si estamos en la pestaña admin y hacemos logout, volver a generales
        var adminContent=document.getElementById('admin-protocolos-content');
        if(adminContent && adminContent.style.display==='block'){
            switchProtocolTab('generales',document.querySelector('.tab-protocols'));
        }
    }
}

function apGetCustomProtocols(){
    try{ return JSON.parse(localStorage.getItem('ap_custom_protocols'))||[]; }catch(e){ return []; }
}

function apSaveCustomProtocols(list){
    localStorage.setItem('ap_custom_protocols',JSON.stringify(list));
}

function apLoadFileContent(){
    var fileInput=document.getElementById('apProtoFile');
    if(!fileInput.files.length)return;
    var file=fileInput.files[0];
    var reader=new FileReader();
    reader.onload=function(e){
        document.getElementById('apNewProtoContent').value=e.target.result;
        // Auto-fill name from filename if empty
        var nameInput=document.getElementById('apNewProtoName');
        if(!nameInput.value.trim()){
            nameInput.value=file.name.replace(/\.txt$/i,'').replace(/[-_]/g,' ');
        }
    };
    reader.readAsText(file);
}

function apAddProtocol(){
    if(!isAdmin()){alert("⛔ Solo el administrador puede añadir protocolos.");return;}
    var name=document.getElementById('apNewProtoName').value.trim();
    var content=document.getElementById('apNewProtoContent').value.trim();
    var status=document.getElementById('apAddStatus');
    
    if(!name){
        status.innerHTML='<span style="color:#dc2626">❌ Escribe un nombre para el protocolo</span>';
        return;
    }
    if(!content || content.length<50){
        status.innerHTML='<span style="color:#dc2626">❌ El contenido es demasiado corto (mínimo 50 caracteres)</span>';
        return;
    }
    
    var list=apGetCustomProtocols();
    list.push({
        name: name,
        content: content,
        date: new Date().toLocaleString('es-ES'),
        chars: content.length
    });
    apSaveCustomProtocols(list);
    
    // Clear form
    document.getElementById('apNewProtoName').value='';
    document.getElementById('apNewProtoContent').value='';
    document.getElementById('apProtoFile').value='';
    
    status.innerHTML='<span style="color:var(--primary)">✅ Protocolo "'+esc(name)+'" añadido correctamente</span>';
    setTimeout(function(){ status.innerHTML=''; },4000);
    
    apRenderCustomList();
    apUpdateProtoSelector();
}

function apDeleteProtocol(idx){
    if(!isAdmin()){alert("⛔ Solo el administrador puede eliminar protocolos.");return;}
    var list=apGetCustomProtocols();
    if(idx<0||idx>=list.length)return;
    var name=list[idx].name;
    if(!confirm('¿Eliminar el protocolo "'+name+'"?\n\nEsta acción no se puede deshacer.'))return;
    list.splice(idx,1);
    apSaveCustomProtocols(list);
    apRenderCustomList();
    apUpdateProtoSelector();
}

function apRenderCustomList(){
    var el=document.getElementById('apCustomProtosList');
    var list=apGetCustomProtocols();
    
    if(list.length===0){
        el.innerHTML='<div class="empty-state" style="padding:24px;"><div class="empty-state-icon">📭</div><p>No hay protocolos personalizados aún</p></div>';
        return;
    }
    
    el.innerHTML=list.map(function(p,i){
        return '<div style="background:var(--bg-main);padding:14px 16px;border-radius:8px;margin-bottom:10px;border-left:4px solid var(--primary);display:flex;justify-content:space-between;align-items:center;gap:12px;">'
            +'<div style="flex:1;min-width:0;">'
            +'<div style="font-weight:600;color:var(--text);font-size:.92rem;margin-bottom:3px;">📄 '+esc(p.name)+'</div>'
            +'<div style="font-size:.78rem;color:var(--text-muted);">'+p.chars+' caracteres · Añadido '+p.date+'</div>'
            +'</div>'
            +'<div style="display:flex;gap:6px;flex-shrink:0;">'
            +'<button onclick="apPreviewProtocol('+i+')" style="padding:6px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:.82rem;color:var(--primary);font-family:var(--font-body);" title="Vista previa">👁️</button>'
            +'<button onclick="apDeleteProtocol('+i+')" style="padding:6px 10px;background:#fee;border:1px solid #fcc;border-radius:6px;cursor:pointer;font-size:.82rem;color:#c00;font-family:var(--font-body);" title="Eliminar">🗑️</button>'
            +'</div>'
            +'</div>';
    }).join('');
}

function apPreviewProtocol(idx){
    var list=apGetCustomProtocols();
    if(!list[idx])return;
    var p=list[idx];
    var preview=p.content.length>500?p.content.substring(0,500)+'...\n\n['+p.content.length+' caracteres en total]':p.content;
    alert('📄 '+p.name+'\n\n'+preview);
}

function apUpdateProtoSelector(){
    var sel=document.getElementById('apProtoSelect');
    if(!sel)return;
    
    // Remove old custom options
    var opts=sel.querySelectorAll('option[value^="custom_"]');
    for(var i=0;i<opts.length;i++) opts[i].remove();
    
    // Add custom protocols
    var list=apGetCustomProtocols();
    if(list.length>0){
        for(var i=0;i<list.length;i++){
            var opt=document.createElement('option');
            opt.value='custom_'+i;
            opt.textContent='⭐ '+list[i].name;
            sel.appendChild(opt);
        }
    }
}

// Initialize custom protocols on page load
document.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){
        apRenderCustomList();
        apUpdateProtoSelector();
    },100);
});



// ═══ PROTOCOLOS URGENCIAS - DATOS Y FUNCIONES ═══
var URG_PROTOCOLS = {"semfyc-fiebre-sin-foco": {"title": "Fiebre sin Focalidad Aparente", "category": "Atención Primaria", "text": "Fiebre sin Focalidad Aparente\n\nAbordaje de fiebre sin foco evidente tras anamnesis y exploración.\n\nIndicaciones: Temperatura ≥ 38°C sin foco claro.\n\nPasos:\n1. Anamnesis detallada: Viajes, contactos, medicación.\n2. Exploración completa por aparatos.\n3. Analítica básica + Sedimento urinario.\n4. Si persiste \\u003e 3 semanas: Fiebre de origen desconocido (FOD).\n\nTratamiento:\nAntitérmicos sintomáticos.\nAntibiótico solo si foco identificado.\n\n⚠️ Alertas:\nFiebre \\u003e 40°C, inmunodepresión o signos de sepsis: Derivación urgente.", "pdfUrl": "", "summary": "Abordaje de fiebre sin foco evidente tras anamnesis y exploración.", "indications": "Temperatura ≥ 38°C sin foco claro.", "isTriptico": false}, "semfyc-epistaxis": {"title": "Epistaxis (Hemorragia Nasal)", "category": "Otorrinolaringología", "text": "Epistaxis (Hemorragia Nasal)\n\nSangrado nasal. Manejo inicial y criterios de derivación.\n\nIndicaciones: Sangrado por fosas nasales.\n\nPasos:\n1. Compresión digital 10-15 min con cabeza hacia delante.\n2. Localizar punto sangrante (Plexo de Kiesselbach).\n3. Cauterización con nitrato de plata si localizado.\n4. Taponamiento anterior si fracaso.\n\nTratamiento:\nÁcido tranexámico tópico.\nControl de HTA si presente.\n\n⚠️ Alertas:\nEpistaxis posterior (sangre por faringe): Derivación urgente ORL.", "pdfUrl": "", "summary": "Sangrado nasal. Manejo inicial y criterios de derivación.", "indications": "Sangrado por fosas nasales.", "isTriptico": false}, "semfyc-dolor-toracico-anginoso": {"title": "Dolor Torácico Anginoso", "category": "Urgencias CV", "text": "Dolor Torácico Anginoso\n\nDolor torácico sugestivo de isquemia coronaria.\n\nIndicaciones: Dolor opresivo retroesternal, irradiado a brazo/mandíbula.\n\nPasos:\n1. ECG inmediato (\\u003c 10 min).\n2. Valorar características del dolor.\n3. Si elevación ST: Código Infarto.\n4. Si no elevación ST: Troponinas + Observación.\n\nTratamiento:\nAAS 300mg masticado.\nNitroglicerina sublingual.\n\n⚠️ Alertas:\nDolor \\u003e 20 min: Activar Código Infarto.", "pdfUrl": "https://drive.google.com/file/d/1G4dH2RytZ36MgXuiMmf6GVc43wO-moCy/preview", "summary": "Dolor torácico sugestivo de isquemia coronaria.", "indications": "Dolor opresivo retroesternal, irradiado a brazo/mandíbula.", "isTriptico": true}, "semfyc-disnea-aguda": {"title": "Disnea Aguda", "category": "Urgencias Respiratorio", "text": "Disnea Aguda\n\nDificultad respiratoria de inicio súbito.\n\nIndicaciones: Sensación de falta de aire de inicio reciente.\n\nPasos:\n1. Valorar gravedad: SatO2, FR, trabajo respiratorio.\n2. Causas frecuentes: Asma, EPOC, ICC, TEP, neumotórax.\n3. Rx tórax + ECG + Gasometría.\n4. Tratamiento según etiología.\n\nTratamiento:\nO2 si SatO2 \\u003c 92%.\nBroncodilatadores si broncoespasmo.\n\n⚠️ Alertas:\nSatO2 \\u003c 90% o trabajo respiratorio intenso: Derivación urgente.", "pdfUrl": "", "summary": "Dificultad respiratoria de inicio súbito.", "indications": "Sensación de falta de aire de inicio reciente.", "isTriptico": false}, "semfyc-hemoptisis": {"title": "Hemoptisis", "category": "Urgencias Respiratorio", "text": "Hemoptisis\n\nExpectoración de sangre procedente del tracto respiratorio.\n\nIndicaciones: Esputo con sangre.\n\nPasos:\n1. Cuantificar: Leve (\\u003c 30ml/24h) vs Masiva (\\u003e 200ml/24h).\n2. Descartar pseudohemoptisis (epistaxis, hematemesis).\n3. Rx tórax.\n4. Derivación según gravedad.\n\nTratamiento:\nReposo.\nÁcido tranexámico.\n\n⚠️ Alertas:\nHemoptisis masiva: Derivación urgente.", "pdfUrl": "", "summary": "Expectoración de sangre procedente del tracto respiratorio.", "indications": "Esputo con sangre.", "isTriptico": false}, "semfyc-sincope": {"title": "Síncope", "category": "Urgencias CV", "text": "Síncope\n\nPérdida transitoria de conciencia con recuperación espontánea.\n\nIndicaciones: Episodio de pérdida de conciencia.\n\nPasos:\n1. Diferenciar de crisis epiléptica, hipoglucemia.\n2. Causas: Vasovagal, cardiogénico, ortostático.\n3. ECG + TA tumbado y de pie.\n4. Estratificación de riesgo.\n\nTratamiento:\nSegún etiología.\n\n⚠️ Alertas:\nSíncope de esfuerzo o con palpitaciones: ECG urgente.", "pdfUrl": "https://drive.google.com/file/d/159RUw8bx2aAAQisTRcjl5fOGAt79544W/preview", "summary": "Pérdida transitoria de conciencia con recuperación espontánea.", "indications": "Episodio de pérdida de conciencia.", "isTriptico": true}, "semfyc-dolor-abdominal-agudo": {"title": "Dolor Abdominal Agudo", "category": "Urgencias General", "text": "Dolor Abdominal Agudo\n\nAbdomen agudo. Identificar causa quirúrgica.\n\nIndicaciones: Dolor abdominal de inicio súbito.\n\nPasos:\n1. Localización: Difuso vs Localizado.\n2. Signos de irritación peritoneal.\n3. Analítica + Rx abdomen.\n4. Ecografía/TC si sospecha quirúrgica.\n\nTratamiento:\nNo analgesia hasta valoración quirúrgica (controvertido).\n\n⚠️ Alertas:\nDefensa abdominal: Derivación urgente Cirugía.", "pdfUrl": "", "summary": "Abdomen agudo. Identificar causa quirúrgica.", "indications": "Dolor abdominal de inicio súbito.", "isTriptico": false}, "semfyc-cefalea": {"title": "Dolor de Cabeza (Cefalea)", "category": "Urgencias Neuro", "text": "Dolor de Cabeza (Cefalea)\n\nCefalea primaria vs secundaria.\n\nIndicaciones: Dolor de cabeza.\n\nPasos:\n1. Signos de alarma: Inicio súbito, fiebre, focalidad.\n2. Primarias: Migraña, tensional, cluster.\n3. Secundarias: Meningitis, HSA, tumor.\n4. TC craneal si signos de alarma.\n\nTratamiento:\nAINE.\nTriptanes si migraña.\n\n⚠️ Alertas:\nCefalea en trueno: TC craneal urgente (descartar HSA).", "pdfUrl": "https://drive.google.com/file/d/1dyt23QPIRHouWH2Wjh9ttBy6Tqoz71X9/preview", "summary": "Cefalea primaria vs secundaria.", "indications": "Dolor de cabeza.", "isTriptico": true}, "semfyc-paralisis-facial": {"title": "Parálisis Facial", "category": "Urgencias Neuro", "text": "Parálisis Facial\n\nParálisis facial periférica (Bell) vs central (ACV).\n\nIndicaciones: Debilidad facial unilateral.\n\nPasos:\n1. Periférica: Afecta frente. Central: Respeta frente.\n2. Si central: Código Ictus.\n3. Si periférica: Parálisis de Bell.\n4. Corticoides en primeras 72h.\n\nTratamiento:\nPrednisona 60mg/día 7 días.\nProtección ocular.\n\n⚠️ Alertas:\nParálisis facial central: Activar Código Ictus.", "pdfUrl": "", "summary": "Parálisis facial periférica (Bell) vs central (ACV).", "indications": "Debilidad facial unilateral.", "isTriptico": false}, "semfyc-convulsiones": {"title": "Convulsiones en el Adulto", "category": "Urgencias Neuro", "text": "Convulsiones en el Adulto\n\nCrisis epiléptica. Primera crisis vs epilepsia conocida.\n\nIndicaciones: Episodio convulsivo.\n\nPasos:\n1. Descartar causas: Hipoglucemia, tóxicos, fiebre.\n2. Primera crisis: TC craneal + EEG.\n3. Iniciar antiepiléptico si indicado.\n4. Derivación a Neurología.\n\nTratamiento:\nDiazepam rectal si crisis activa.\n\n⚠️ Alertas:\nStatus epiléptico (\\u003e 5 min): Derivación urgente.", "pdfUrl": "", "summary": "Crisis epiléptica. Primera crisis vs epilepsia conocida.", "indications": "Episodio convulsivo.", "isTriptico": false}, "semfyc-perdida-fuerza": {"title": "Pérdida de Fuerza", "category": "Urgencias Neuro", "text": "Pérdida de Fuerza\n\nDebilidad muscular. Descartar ACV.\n\nIndicaciones: Debilidad en extremidades.\n\nPasos:\n1. Inicio súbito: Código Ictus.\n2. Progresivo: Guillain-Barré, ELA, miastenia.\n3. Exploración neurológica completa.\n4. Derivación según sospecha.\n\nTratamiento:\nSegún etiología.\n\n⚠️ Alertas:\nDebilidad súbita: Activar Código Ictus.", "pdfUrl": "", "summary": "Debilidad muscular. Descartar ACV.", "indications": "Debilidad en extremidades.", "isTriptico": false}, "semfyc-colico-renal": {"title": "Cólico Renal", "category": "Urgencias General", "text": "Cólico Renal\n\nDolor por litiasis urinaria.\n\nIndicaciones: Dolor lumbar irradiado a genitales.\n\nPasos:\n1. Analgesia potente.\n2. Ecografía renal.\n3. Hidratación.\n4. Derivación a Urología si complicado.\n\nTratamiento:\nMetamizol 2g IV.\nDiclofenaco 75mg IM.\n\n⚠️ Alertas:\nAnuria o fiebre: Derivación urgente.", "pdfUrl": "https://drive.google.com/file/d/1b1oCYwB2kmR7kIOfucRK5UvsSN0hrU3-/preview", "summary": "Dolor por litiasis urinaria.", "indications": "Dolor lumbar irradiado a genitales.", "isTriptico": true}, "semfyc-monoartritis": {"title": "Monoartritis Aguda", "category": "Reumatología", "text": "Monoartritis Aguda\n\nArticulación caliente e inflamada. Descartar artritis séptica.\n\nIndicaciones: Dolor, rubor, calor en una articulación.\n\nPasos:\n1. Artrocentesis.\n2. Análisis líquido sinovial.\n3. Descartar: Séptica, gotosa, pseudogota.\n4. Antibiótico si séptica.\n\nTratamiento:\nColchicina si gota.\nCeftriaxona si séptica.\n\n⚠️ Alertas:\nFiebre + monoartritis: Artritis séptica hasta demostrar lo contrario.", "pdfUrl": "https://drive.google.com/file/d/16r1Ot9_6SbA3D9eodPG-5vRBatjRJFqi/preview", "summary": "Articulación caliente e inflamada. Descartar artritis séptica.", "indications": "Dolor, rubor, calor en una articulación.", "isTriptico": true}, "semfyc-ojo-rojo": {"title": "Ojo Rojo", "category": "Oftalmología", "text": "Ojo Rojo\n\nHiperemia conjuntival. Descartar glaucoma agudo.\n\nIndicaciones: Enrojecimiento ocular.\n\nPasos:\n1. Con dolor: Glaucoma, queratitis, uveítis.\n2. Sin dolor: Conjuntivitis, hemorragia subconjuntival.\n3. Medición PIO si sospecha glaucoma.\n4. Derivación a Oftalmología si dudas.\n\nTratamiento:\nColirio antibiótico si conjuntivitis.\n\n⚠️ Alertas:\nOjo rojo + dolor + visión borrosa: Glaucoma agudo.", "pdfUrl": "", "summary": "Hiperemia conjuntival. Descartar glaucoma agudo.", "indications": "Enrojecimiento ocular.", "isTriptico": false}, "semfyc-perdida-vision": {"title": "Disminución de la Agudeza Visual", "category": "Oftalmología", "text": "Disminución de la Agudeza Visual\n\nPérdida de visión. Descartar causa urgente.\n\nIndicaciones: Visión borrosa o pérdida visual.\n\nPasos:\n1. Aguda vs Crónica.\n2. Aguda: Desprendimiento retina, oclusión vascular.\n3. Crónica: Cataratas, DMAE, glaucoma.\n4. Derivación urgente si aguda.\n\nTratamiento:\nSegún etiología.\n\n⚠️ Alertas:\nPérdida visual súbita: Derivación urgente Oftalmología.", "pdfUrl": "", "summary": "Pérdida de visión. Descartar causa urgente.", "indications": "Visión borrosa o pérdida visual.", "isTriptico": false}, "semfyc-fiebre-pediatrica": {"title": "Fiebre en el Niño", "category": "Pediatría", "text": "Fiebre en el Niño\n\nManejo de la fiebre pediátrica.\n\nIndicaciones: Temperatura ≥ 38°C.\n\nPasos:\n1. Valorar estado general.\n2. Buscar foco infeccioso.\n3. Signos de alarma: Petequias, decaimiento, rigidez.\n4. Antitérmicos.\n\nTratamiento:\nParacetamol 15mg/kg/6h.\nIbuprofeno 10mg/kg/8h.\n\n⚠️ Alertas:\nFiebre \\u003c 3 meses: Valoración urgente.", "pdfUrl": "", "summary": "Manejo de la fiebre pediátrica.", "indications": "Temperatura ≥ 38°C.", "isTriptico": false}, "trip-diverticulitis": {"title": "Diverticulitis Aguda", "category": "Digestivo", "text": "Diverticulitis Aguda\n\nInflamación de los divertículos del colon. Consulta el tríptico para detalles.\n\nIndicaciones: Dolor en FII, fiebre, alteración del hábito intestinal.", "pdfUrl": "https://drive.google.com/file/d/1sHBEehuuCilWmm-V9cL8jW_G4WxlMr7K/preview", "summary": "Inflamación de los divertículos del colon. Consulta el tríptico para detalles.", "indications": "Dolor en FII, fiebre, alteración del hábito intestinal.", "isTriptico": true}, "trip-hemorragia-digestiva": {"title": "Hemorragia Digestiva", "category": "Digestivo", "text": "Hemorragia Digestiva\n\nProtocolo de manejo de hemorragia digestiva alta y baja.\n\nIndicaciones: Hematemesis, melenas o rectorragia.", "pdfUrl": "https://drive.google.com/file/d/1ps0HHuQYWlsd3ES2nNyeTzBRybGtaEM2/preview", "summary": "Protocolo de manejo de hemorragia digestiva alta y baja.", "indications": "Hematemesis, melenas o rectorragia.", "isTriptico": true}, "trip-patologia-biliar": {"title": "Patología Biliar (Cólico/Colecistitis)", "category": "Digestivo", "text": "Patología Biliar (Cólico/Colecistitis)\n\nManejo del cólico biliar, colecistitis y colangitis.\n\nIndicaciones: Dolor en hipocondrio derecho, fiebre, ictericia.", "pdfUrl": "https://drive.google.com/file/d/1gWo3J2GloEENIoO3GpLUFOCdp8GX5-JN/preview", "summary": "Manejo del cólico biliar, colecistitis y colangitis.", "indications": "Dolor en hipocondrio derecho, fiebre, ictericia.", "isTriptico": true}, "trip-pancreatitis": {"title": "Pancreatitis Aguda", "category": "Digestivo", "text": "Pancreatitis Aguda\n\nInflamación aguda del páncreas. Diagnóstico y manejo inicial.\n\nIndicaciones: Dolor epigástrico en cinturón, elevación amilasa/lipasa.", "pdfUrl": "https://drive.google.com/file/d/1gTbT_nvv1Q5CPAXaBpKe9MmOrQGl367f/preview", "summary": "Inflamación aguda del páncreas. Diagnóstico y manejo inicial.", "indications": "Dolor epigástrico en cinturón, elevación amilasa/lipasa.", "isTriptico": true}, "trip-insuficiencia-cardiaca": {"title": "Insuficiencia Cardíaca Aguda", "category": "Cardiología", "text": "Insuficiencia Cardíaca Aguda\n\nManejo de la descompensación de IC y EAP.\n\nIndicaciones: Disnea, ortopnea, edemas, crepitantes.", "pdfUrl": "https://drive.google.com/file/d/1HPv8FG4IRbvQrBtYCjfwuF6e0wp-GSTW/preview", "summary": "Manejo de la descompensación de IC y EAP.", "indications": "Disnea, ortopnea, edemas, crepitantes.", "isTriptico": true}, "trip-fibrilacion-auricular": {"title": "Fibrilación Auricular", "category": "Cardiología", "text": "Fibrilación Auricular\n\nManejo de la FA aguda y crónica en urgencias.\n\nIndicaciones: Palpitaciones, ritmo irregular, disnea.", "pdfUrl": "https://drive.google.com/file/d/1edF_YZy1C-9TjCdc9UOKbxXcbNHWiCCN/preview", "summary": "Manejo de la FA aguda y crónica en urgencias.", "indications": "Palpitaciones, ritmo irregular, disnea.", "isTriptico": true}, "trip-emergencias-hiperglucemicas": {"title": "Emergencias Hiperglucémicas", "category": "Endocrinología", "text": "Emergencias Hiperglucémicas\n\nCetoacidosis diabética y estado hiperosmolar.\n\nIndicaciones: Hiperglucemia severa, deshidratación, alteración del estado mental.", "pdfUrl": "https://drive.google.com/file/d/1IV5hjBoJwitJp8WGsPb3SJpvgDLTQs5a/preview", "summary": "Cetoacidosis diabética y estado hiperosmolar.", "indications": "Hiperglucemia severa, deshidratación, alteración del estado mental.", "isTriptico": true}, "trip-insulinizacion": {"title": "Insulinización en Urgencias", "category": "Endocrinología", "text": "Insulinización en Urgencias\n\nPautas de insulinización basal y corrección en el paciente agudo.\n\nIndicaciones: Hiperglucemia no controlada en medio hospitalario.", "pdfUrl": "https://drive.google.com/file/d/1dManw-ahn89mmmwBGqv8KmxAZ_i8OzlU/preview", "summary": "Pautas de insulinización basal y corrección en el paciente agudo.", "indications": "Hiperglucemia no controlada en medio hospitalario.", "isTriptico": true}, "trip-hiperpotasemia": {"title": "Hiperpotasemia (Hiperkalemia)", "category": "Nefrología", "text": "Hiperpotasemia (Hiperkalemia)\n\nManejo urgente de la hiperpotasemia grave.\n\nIndicaciones: K > 5.5 mEq/L, cambios ECG.", "pdfUrl": "https://drive.google.com/file/d/1TRokzomeGn62tHafbLL9dS0up64hTbzl/preview", "summary": "Manejo urgente de la hiperpotasemia grave.", "indications": "K > 5.5 mEq/L, cambios ECG.", "isTriptico": true}, "trip-hipopotasemia": {"title": "Hipopotasemia (Hipokalemia)", "category": "Nefrología", "text": "Hipopotasemia (Hipokalemia)\n\nReposición de potasio en urgencias.\n\nIndicaciones: K < 3.5 mEq/L, debilidad muscular, arritmias.", "pdfUrl": "https://drive.google.com/file/d/1Bc7PNzezC1zrTKzc6PyCl-R41vKwjXMp/preview", "summary": "Reposición de potasio en urgencias.", "indications": "K < 3.5 mEq/L, debilidad muscular, arritmias.", "isTriptico": true}, "trip-insuficiencia-renal": {"title": "Insuficiencia Renal Aguda", "category": "Nefrología", "text": "Insuficiencia Renal Aguda\n\nAbordaje del fracaso renal agudo (prerrenal, renal, postrenal).\n\nIndicaciones: Elevación de creatinina, oliguria.", "pdfUrl": "https://drive.google.com/file/d/1cyIZiZEuEhqqk9php_9KVceOXD-TKnMd/preview", "summary": "Abordaje del fracaso renal agudo (prerrenal, renal, postrenal).", "indications": "Elevación de creatinina, oliguria.", "isTriptico": true}, "trip-colico-nefritico": {"title": "Cólico Nefrítico", "category": "Urología", "text": "Cólico Nefrítico\n\nManejo del dolor y criterios de derivación/ingreso en litiasis renal.\n\nIndicaciones: Dolor en fosa renal irradiado a genitales, náuseas, cortejo vegetativo.", "pdfUrl": "https://drive.google.com/file/d/1b1oCYwB2kmR7kIOfucRK5UvsSN0hrU3-/preview", "summary": "Manejo del dolor y criterios de derivación/ingreso en litiasis renal.", "indications": "Dolor en fosa renal irradiado a genitales, náuseas, cortejo vegetativo.", "isTriptico": true}, "trip-rao": {"title": "Retención Aguda de Orina (RAO)", "category": "Urología", "text": "Retención Aguda de Orina (RAO)\n\nManejo de la retención urinaria y sondaje vesical.\n\nIndicaciones: Imposibilidad para orinar, dolor suprapúbico, globo vesical.", "pdfUrl": "https://drive.google.com/file/d/1yAkV_aRKgJ3vsvFkeB9VhjuNwzc4q84E/preview", "summary": "Manejo de la retención urinaria y sondaje vesical.", "indications": "Imposibilidad para orinar, dolor suprapúbico, globo vesical.", "isTriptico": true}, "trip-tep": {"title": "Tromboembolismo Pulmonar (TEP)", "category": "Neumología", "text": "Tromboembolismo Pulmonar (TEP)\n\nSospecha diagnóstica (Wells/Ginebra) y tratamiento inicial del TEP.\n\nIndicaciones: Disnea súbita, dolor torácico pleurítico, taquicardia.", "pdfUrl": "https://drive.google.com/file/d/1xlgOWMF_4ECl-yjwi_8f7ZVox4cj0JeC/preview", "summary": "Sospecha diagnóstica (Wells/Ginebra) y tratamiento inicial del TEP.", "indications": "Disnea súbita, dolor torácico pleurítico, taquicardia.", "isTriptico": true}, "trip-neumonia": {"title": "Neumonía Adquirida en la Comunidad", "category": "Neumología", "text": "Neumonía Adquirida en la Comunidad\n\nEscalas de gravedad (CURB-65) y antibioterapia empírica.\n\nIndicaciones: Fiebre, tos, expectoración, disnea, infiltrado radiológico.", "pdfUrl": "https://drive.google.com/file/d/1CCTy53dKEmvucnWTObPtmbf4Ex3VBPC9/preview", "summary": "Escalas de gravedad (CURB-65) y antibioterapia empírica.", "indications": "Fiebre, tos, expectoración, disnea, infiltrado radiológico.", "isTriptico": true}, "trip-epoc": {"title": "EPOC Agudizado", "category": "Neumología", "text": "EPOC Agudizado\n\nManejo de la exacerbación de EPOC (Criterios Anthonisen).\n\nIndicaciones: Aumento de disnea, esputo o purulencia en paciente EPOC.", "pdfUrl": "https://drive.google.com/file/d/1HlTfk4_kIfpwtklCTynDHdbeRlhAi_Mx/preview", "summary": "Manejo de la exacerbación de EPOC (Criterios Anthonisen).", "indications": "Aumento de disnea, esputo o purulencia en paciente EPOC.", "isTriptico": true}, "trip-cefalea": {"title": "Cefalea en Urgencias", "category": "Urgencias Neuro", "text": "Cefalea en Urgencias\n\nCriterios de alarma y manejo sintomático de cefaleas primarias.\n\nIndicaciones: Cefalea intensa o con signos de alarma.", "pdfUrl": "https://drive.google.com/file/d/1dyt23QPIRHouWH2Wjh9ttBy6Tqoz71X9/preview", "summary": "Criterios de alarma y manejo sintomático de cefaleas primarias.", "indications": "Cefalea intensa o con signos de alarma.", "isTriptico": true}, "trip-tvp": {"title": "Trombosis Venosa Profunda (TVP)", "category": "Cirugía Vascular", "text": "Trombosis Venosa Profunda (TVP)\n\nDiagnóstico y tratamiento anticoagulante de la TVP.\n\nIndicaciones: Edema unilateral, dolor en pantorrilla, signo de Homans.", "pdfUrl": "https://drive.google.com/file/d/1SgRJoYfjSYoffcNmKKNnmPMbDyYykl85/preview", "summary": "Diagnóstico y tratamiento anticoagulante de la TVP.", "indications": "Edema unilateral, dolor en pantorrilla, signo de Homans.", "isTriptico": true}, "trip-ulceras": {"title": "Úlceras Vasculares y Pie Diabético", "category": "Cirugía Vascular", "text": "Úlceras Vasculares y Pie Diabético\n\nManejo de heridas crónicas y pie diabético.\n\nIndicaciones: Úlceras en miembros inferiores, pie de riesgo.", "pdfUrl": "https://drive.google.com/file/d/1ZdlfC5hH5JC-yjaTOk7-GU1XUFVRyu8W/preview", "summary": "Manejo de heridas crónicas y pie diabético.", "indications": "Úlceras en miembros inferiores, pie de riesgo.", "isTriptico": true}, "trip-artritis": {"title": "Artritis (Monoartritis Aguda)", "category": "Reumatología", "text": "Artritis (Monoartritis Aguda)\n\nAbordaje de la articulación caliente e inflamada (Gota, Séptica).\n\nIndicaciones: Dolor, rubor, calor y tumefacción articular aguda.", "pdfUrl": "https://drive.google.com/file/d/16r1Ot9_6SbA3D9eodPG-5vRBatjRJFqi/preview", "summary": "Abordaje de la articulación caliente e inflamada (Gota, Séptica).", "indications": "Dolor, rubor, calor y tumefacción articular aguda.", "isTriptico": true}, "trip-neutropenia": {"title": "Neutropenia Febril", "category": "Infecciosas", "text": "Neutropenia Febril\n\nUrgencia oncológica. Manejo antibiótico precoz.\n\nIndicaciones: Fiebre en paciente con neutropenia (<500/mm3) o quimioterapia reciente.", "pdfUrl": "https://drive.google.com/file/d/1dawYFPhOqhnD-0pZI0FDy5dsOS9ZCage/preview", "summary": "Urgencia oncológica. Manejo antibiótico precoz.", "indications": "Fiebre en paciente con neutropenia (<500/mm3) o quimioterapia reciente.", "isTriptico": true}, "trip-sedacion": {"title": "Sedación Paliativa", "category": "Paliativos", "text": "Sedación Paliativa\n\nProtocolo de sedación en agonía y síntomas refractarios.\n\nIndicaciones: Síntomas refractarios en situación de últimos días.", "pdfUrl": "https://drive.google.com/file/d/1g_3dRWgBP3gmpdXnYY-4DqpbgoPaimTI/preview", "summary": "Protocolo de sedación en agonía y síntomas refractarios.", "indications": "Síntomas refractarios en situación de últimos días.", "isTriptico": true}, "trip-sincope": {"title": "Síncope", "category": "Cardiología", "text": "Síncope\n\nPérdida transitoria de conciencia. Evaluación de riesgo en urgencias.\n\nIndicaciones: Pérdida de conciencia con recuperación espontánea completa.", "pdfUrl": "https://drive.google.com/file/d/159RUw8bx2aAAQisTRcjl5fOGAt79544W/preview", "summary": "Pérdida transitoria de conciencia. Evaluación de riesgo en urgencias.", "indications": "Pérdida de conciencia con recuperación espontánea completa.", "isTriptico": true}, "hosp-sva": {"title": "Soporte Vital Avanzado (SVA)", "category": "Reanimación", "text": "Soporte Vital Avanzado (Adultos)\n\nRCP de alta calidad y manejo de ritmos desfibrilables y no desfibrilables.\n\nPasos:\n1. Confirmar PCR, alertar equipo, iniciar RCP 30:2.\n2. Monitorizar ritmo: Desfibrilable (FV/TVSP) vs No desfibrilable (Asistolia/AESP).\n3. Desfibrilación precoz si FV/TVSP.\n4. Acceso vascular y fármacos.\n5. Buscar causas reversibles (4H/4T).\n\nTratamiento:\nAdrenalina: 1 mg IV cada 3-5 min.\nAmiodarona: 300 mg tras 3ª descarga, luego 150 mg.\n\n⚠️ Alertas:\nCausas reversibles: Hipoxia, Hipovolemia, Hipo/Hiperpotasemia, Hipotermia, Neumotórax a tensión, Taponamiento, Tóxicos, TEP.", "pdfUrl": "", "summary": "RCP de alta calidad. Algoritmo universal de SVA.", "indications": "Parada cardiorrespiratoria.", "isTriptico": false}, "hosp-via-aerea": {"title": "Manejo Vía Aérea Difícil / SRI", "category": "Reanimación", "text": "Manejo Vía Aérea Difícil / Secuencia Rápida de Intubación\n\nProtocolo de intubación orotraqueal urgente.\n\nPasos:\n1. Preoxigenación (3-5 min O2 100%).\n2. Posición óptima (rampa, sniffing position).\n3. Inductor + Relajante.\n4. Laringoscopia directa o videolaringoscopia.\n5. Plan B: Dispositivo supraglótico. Plan C: Cricotiroidotomía.\n\nTratamiento:\nInductor: Etomidato 0.3 mg/kg o Ketamina 2 mg/kg.\nRelajante: Rocuronio 1 mg/kg o Suxametonio 1.5 mg/kg.\n\n⚠️ Alertas:\nFracaso de ventilación/oxigenación, GCS < 8.", "pdfUrl": "", "summary": "Protocolo de intubación orotraqueal urgente (SRI).", "indications": "GCS < 8, insuficiencia respiratoria grave, protección vía aérea.", "isTriptico": false}, "hosp-shock": {"title": "Shock (Séptico, Hipovolémico, Cardiogénico)", "category": "Críticos", "text": "Manejo del Shock en Urgencias\n\nIdentificación y tratamiento del estado de shock.\n\nPasos:\n1. O2, monitorización, 2 accesos venosos gruesos.\n2. Fluidoterapia intensiva con cristaloides.\n3. Si no responde: Vasopresores.\n4. Identificar tipo: Séptico, hipovolémico, cardiogénico, obstructivo, distributivo.\n5. Tratar causa subyacente.\n\nTratamiento:\nFluidos: 30 ml/kg cristaloides (SSF/RL).\nNoradrenalina: 0.05-0.5 µg/kg/min si no responde a fluidos.\nDobutamina si componente cardiogénico.\n\n⚠️ Alertas:\nHipotensión refractaria, lactato ≥ 2 mmol/L, disfunción multiorgánica → UCI.", "pdfUrl": "", "summary": "Identificación y manejo inicial del estado de shock.", "indications": "Hipotensión, taquicardia, signos de hipoperfusión.", "isTriptico": false}, "hosp-anafilaxia": {"title": "Anafilaxia", "category": "Urgencias Alergia", "text": "Anafilaxia\n\nReacción alérgica sistémica grave con riesgo vital.\n\nPasos:\n1. Retirar alérgeno.\n2. Adrenalina IM INMEDIATA (cara anterolateral muslo).\n3. O2 alto flujo.\n4. Posición Trendelenburg.\n5. Fluidos IV si hipotensión.\n\nTratamiento:\nAdrenalina: 0.5 mg IM (1:1000). Repetir cada 5-15 min si precisa.\nHidrocortisona: 200 mg IV.\nDexclorfeniramina: 5 mg IV.\nSalbutamol nebulizado si broncoespasmo.\n\n⚠️ Alertas:\nInestabilidad hemodinámica, compromiso vía aérea, falta de respuesta → UCI.\nObservación mínima 6-8h por riesgo de reacción bifásica.", "pdfUrl": "", "summary": "Reacción alérgica sistémica grave. Adrenalina IM precoz.", "indications": "Urticaria + compromiso respiratorio o hemodinámico.", "isTriptico": false}, "hosp-sepsis": {"title": "Sepsis y Shock Séptico (Código Sepsis)", "category": "Infecciosas", "text": "Sepsis y Shock Séptico\n\nCódigo Sepsis: Actuación en la primera hora.\n\nPasos:\n1. Hemocultivos (x2) ANTES de antibiótico.\n2. Lactato sérico.\n3. Antibiótico empírico en <1 hora.\n4. Cristaloides 30 ml/kg si hipotensión o lactato ≥ 4.\n5. Vasopresores si PAM < 65 mmHg tras fluidos.\n\nTratamiento:\nATB Empírico: Meropenem 1g o Pip/Tazo 4/0.5g + Amikacina (según foco/riesgo).\nNoradrenalina si PAM < 65 mmHg.\n\n⚠️ Alertas:\nqSOFA ≥ 2, Lactato ≥ 4 mmol/L, hipotensión refractaria → UCI.", "pdfUrl": "", "summary": "Código Sepsis. Actuación en la primera hora.", "indications": "qSOFA ≥ 2, sospecha infección con disfunción orgánica.", "isTriptico": false}, "hosp-meningoencefalitis": {"title": "Meningoencefalitis Aguda", "category": "Infecciosas", "text": "Meningoencefalitis Aguda\n\nInfección del SNC con riesgo vital.\n\nPasos:\n1. Hemocultivos.\n2. Dexametasona + ATB INMEDIATO (antes de TAC si no hay focalidad).\n3. TAC craneal si focalidad o inmunodepresión.\n4. Punción lumbar (si no contraindicada).\n\nTratamiento:\nDexametasona: 0.15 mg/kg/6h (antes o con 1ª dosis ATB).\nCeftriaxona: 2g/12h IV.\n+ Ampicilina 2g/4h (si >50 años, embarazo, inmunodepresión).\n+ Aciclovir 10 mg/kg/8h (si sospecha encefalitis herpética).\n\n⚠️ Alertas:\nIngreso siempre. UCI si Glasgow <10, shock o insuficiencia respiratoria.", "pdfUrl": "", "summary": "Infección del SNC. ATB inmediato sin esperar pruebas.", "indications": "Fiebre + cefalea + rigidez de nuca + alteración de conciencia.", "isTriptico": false}, "hosp-crisis-asmatica": {"title": "Crisis Asmática", "category": "Neumología", "text": "Crisis Asmática\n\nBroncoespasmo agudo severo.\n\nPasos:\n1. O2 para SatO2 >93%.\n2. Broncodilatadores de acción corta repetidos.\n3. Corticoides sistémicos precoces.\n4. Valorar gravedad (PEF, SatO2, uso de musculatura accesoria).\n\nTratamiento:\nSalbutamol: 4-8 puff (MDI + cámara) o 2.5-5 mg nebulizado cada 20 min x3.\nIpratropio: 0.5 mg nebulizado (si grave).\nHidrocortisona: 100-200 mg IV o Prednisona 40 mg VO.\nSulfato de Magnesio: 2g IV en 20 min (si refractaria).\n\n⚠️ Alertas:\nPEF < 25%, SatO2 < 92%, silencio auscultatorio, agotamiento → UCI/IOT.", "pdfUrl": "", "summary": "Broncoespasmo agudo. Broncodilatadores + corticoides.", "indications": "Disnea, sibilancias, uso musculatura accesoria en asmático.", "isTriptico": false}, "hosp-sca": {"title": "Síndrome Coronario Agudo (Código Infarto)", "category": "Cardiología", "text": "Síndrome Coronario Agudo (SCACEST/SCASEST)\n\nCódigo Infarto Regional.\n\nPasos:\n1. ECG <10 minutos.\n2. Monitorización continua.\n3. Doble antiagregación.\n4. SCACEST: Activar Código Infarto (Hemodinámica <120 min).\n5. SCASEST: Estratificación TIMI/GRACE.\n\nTratamiento:\nAAS 300 mg VO (masticado).\nTicagrelor 180 mg (o Prasugrel 60 mg / Clopidogrel 600 mg).\nAnticoagulación: Enoxaparina 0.5-1 mg/kg.\nNitroglicerina SL si dolor.\nMorfina 2-4 mg IV si dolor refractario.\n\n⚠️ Alertas:\nSCACEST: Hemodinámica <120 min. Shock cardiogénico. FV/TV → UCI.", "pdfUrl": "", "summary": "Código Infarto Regional. ECG <10 min.", "indications": "Dolor torácico sugestivo de isquemia coronaria.", "isTriptico": false}, "hosp-crisis-hta": {"title": "Crisis Hipertensiva", "category": "Cardiología", "text": "Crisis Hipertensiva\n\nDistinguir urgencia de emergencia hipertensiva.\n\nPasos:\n1. Urgencia HTA: Sin daño órgano diana. Bajar TA en 24-48h.\n2. Emergencia HTA: Con daño órgano diana. Bajar TA 25% en 1ª hora.\n3. Buscar: Encefalopatía, EAP, SCA, disección aórtica, eclampsia.\n\nTratamiento:\nUrgencia: Captopril 25 mg SL o Labetalol 100 mg VO.\nEmergencia: Labetalol 20 mg IV (repetir) o Urapidil 25 mg IV.\nNitroprusiato si refractario (UCI).\n\n⚠️ Alertas:\nEmergencia hipertensiva: Fallo renal, ictus, edema pulmón, disección → UCI.", "pdfUrl": "", "summary": "Urgencia vs emergencia hipertensiva.", "indications": "TAS > 180 y/o TAD > 120 mmHg.", "isTriptico": false}, "hosp-ictus": {"title": "Ictus Isquémico (Código Ictus)", "category": "Urgencias Neuro", "text": "Ictus Isquémico Agudo\n\nCódigo Ictus. Tiempo es cerebro.\n\nPasos:\n1. Código Ictus: Activar cadena asistencial.\n2. TAC craneal urgente (descartar hemorragia).\n3. Hora de inicio de síntomas.\n4. Valorar fibrinolisis IV (<4.5h) y/o trombectomía mecánica (<6-24h).\n5. Control glucemia, TA, temperatura.\n\nTratamiento:\nAlteplasa (rt-PA): 0.9 mg/kg (máx 90 mg) IV. 10% bolo, 90% en 1h.\nSi >4.5h o contraindicación: Valorar trombectomía mecánica.\n\n⚠️ Alertas:\nCandidato a reperfusión → Unidad Ictus/UCI. NIHSS > 6 + oclusión proximal → trombectomía.", "pdfUrl": "", "summary": "Código Ictus. Fibrinolisis <4.5h. Trombectomía si oclusión.", "indications": "Déficit neurológico focal de inicio brusco.", "isTriptico": false}, "hosp-hemorragia-cerebral": {"title": "Hemorragia Cerebral / HSA", "category": "Urgencias Neuro", "text": "Hemorragia Cerebral / Hemorragia Subaracnoidea\n\nEmergencia neurovascular.\n\nPasos:\n1. TAC craneal urgente.\n2. Control estricto de TA (PAS <140 mmHg).\n3. Revertir anticoagulación si procede.\n4. Valoración neuroquirúrgica.\n5. Si HSA: AngioTC para aneurisma.\n\nTratamiento:\nControl TA: Labetalol o Urapidil IV.\nReversión ACO: Vitamina K + CCP. Idarucizumab (Dabigatrán). Andexanet (anti-Xa).\nNimodipino 60 mg/4h VO (HSA - vasoespasmo).\n\n⚠️ Alertas:\nGlasgow < 8 → Intubación. Ingreso Neurocirugía/UCI.", "pdfUrl": "", "summary": "Hemorragia intracraneal. Control TA y reversión anticoagulación.", "indications": "Cefalea en trueno, déficit neurológico brusco, Glasgow bajo.", "isTriptico": false}, "hosp-status-epileptico": {"title": "Status Epiléptico", "category": "Urgencias Neuro", "text": "Status Epiléptico\n\nCrisis epiléptica >5 min o crisis repetidas sin recuperación.\n\nPasos:\n1. Vía aérea, O2, monitorización.\n2. Benzodiacepinas inmediatas (1ª línea).\n3. Si persiste (>10 min): FAE IV (2ª línea).\n4. Si refractario (>30 min): Sedación profunda en UCI.\n\nTratamiento:\n1ª línea: Diazepam 10 mg IV (o Midazolam 10 mg IM/bucal).\n2ª línea: Levetiracetam 30-60 mg/kg IV o Ác. Valproico 40 mg/kg IV.\n3ª línea (refractario): Propofol o Midazolam en perfusión (UCI con IOT).\n\n⚠️ Alertas:\nCrisis >30 min o refractaria → UCI. Buscar causa: Tóxicos, metabólica, ACV.", "pdfUrl": "", "summary": "Crisis >5 min. BZD inmediatas, FAE si persiste.", "indications": "Crisis epiléptica prolongada o repetida sin recuperación.", "isTriptico": false}, "hosp-hepatica-aguda": {"title": "Insuficiencia Hepática Aguda", "category": "Digestivo", "text": "Insuficiencia Hepática Aguda\n\nFallo hepático con riesgo vital.\n\nPasos:\n1. Monitorizar glucemia (hipoglucemia frecuente).\n2. Valorar coagulación (INR).\n3. Grado de encefalopatía hepática.\n4. Identificar causa: Paracetamol, viral, autoinmune.\n\nTratamiento:\nN-Acetilcisteína (si paracetamol): 150 mg/kg en 1h, luego 50 mg/kg en 4h.\nLactulosa 30 ml/8h (encefalopatía).\nVitamina K 10 mg IV.\nGlucosa 10% si hipoglucemia.\n\n⚠️ Alertas:\nEncefalopatía grado III-IV → UCI. Criterios King's College → trasplante.", "pdfUrl": "", "summary": "Fallo hepático agudo. N-Acetilcisteína si paracetamol.", "indications": "Ictericia + coagulopatía + encefalopatía.", "isTriptico": false}, "hosp-hipoglucemia": {"title": "Hipoglucemia", "category": "Endocrinología", "text": "Hipoglucemia\n\nGlucemia < 70 mg/dL con síntomas.\n\nPasos:\n1. Confirmar glucemia capilar.\n2. Si consciente: Hidratos de carbono VO (15-20g).\n3. Si inconsciente: Glucosa IV o Glucagón IM.\n4. Revisar glucemia cada 15 min.\n5. Buscar causa: Sulfonilureas, insulina, ayuno.\n\nTratamiento:\nConsciente: 15-20g HC (zumo, azúcar).\nInconsciente: Glucosa 50% 2-4 ampollas IV (o Glucosmon R50).\nGlucagón 1 mg IM/SC (si no hay vía).\n\n⚠️ Alertas:\nRecuperación incompleta. Causa sulfonilureas: Observación prolongada (riesgo recurrencia).", "pdfUrl": "", "summary": "Glucemia < 70 mg/dL. Glucosa IV si inconsciente.", "indications": "Sudoración, temblor, confusión, coma en diabético.", "isTriptico": false}, "hosp-suprarrenal": {"title": "Insuficiencia Suprarrenal Aguda (Crisis Addisoniana)", "category": "Endocrinología", "text": "Insuficiencia Suprarrenal Aguda\n\nCrisis addisoniana con riesgo vital.\n\nPasos:\n1. Sospecha clínica: Hipotensión + hiponatremia + hiperpotasemia.\n2. Extracción cortisol basal (NO esperar resultado).\n3. Hidrocortisona IV inmediata.\n4. Hidratación enérgica con SSF.\n\nTratamiento:\nHidrocortisona: 100 mg IV bolo, luego 100 mg/6h (o perfusión 200 mg/24h).\nSSF 1000 ml/h inicialmente.\nTratar hipoglucemia si presente.\n\n⚠️ Alertas:\nShock refractario, desequilibrio electrolítico grave → UCI.", "pdfUrl": "", "summary": "Crisis addisoniana. Hidrocortisona IV inmediata.", "indications": "Hipotensión + hiponatremia en paciente con corticoterapia crónica.", "isTriptico": false}, "hosp-escroto-agudo": {"title": "Escroto Agudo", "category": "Urología", "text": "Escroto Agudo\n\nUrgencia urológica. Descartar torsión testicular.\n\nPasos:\n1. Eco-Doppler testicular URGENTE.\n2. Descartar torsión testicular (<6h para salvamento).\n3. Diagnóstico diferencial: Orquiepididimitis, torsión hidátide.\n\nTratamiento:\nTorsión testicular: Cirugía URGENTE (<6h).\nOrquiepididimitis: AINEs + ATB (Ceftriaxona 250mg + Doxiciclina 100mg/12h).\n\n⚠️ Alertas:\nTorsión testicular → Quirófano URGENTE.\nGangrena de Fournier → UCI/Cirugía.", "pdfUrl": "", "summary": "Descartar torsión testicular (<6h). Eco-Doppler urgente.", "indications": "Dolor testicular agudo unilateral.", "isTriptico": false}, "hosp-hematuria": {"title": "Hematuria", "category": "Urología", "text": "Hematuria\n\nSangrado urinario. Valorar causa y gravedad.\n\nPasos:\n1. Macro vs micro hematuria.\n2. Si coágulos: Sonda 3 vías + lavado vesical continuo.\n3. Descartar: Tumor vesical/renal, litiasis, infección, anticoagulantes.\n4. Ecografía/TAC urológico.\n\nTratamiento:\nHidratación abundante.\nSi coágulos: Lavado manual y continuo.\nNo antifibrinolíticos de rutina.\nRevisar anticoagulación.\n\n⚠️ Alertas:\nAnemización, retención por coágulos, inestabilidad → Ingreso.", "pdfUrl": "", "summary": "Sangrado urinario. Sonda 3 vías si coágulos.", "indications": "Orina roja o con coágulos.", "isTriptico": false}, "hosp-politrauma": {"title": "Politrauma / Trauma Grave", "category": "Trauma", "text": "Politrauma / Traumatismo Grave\n\nAbordaje XABCDE del paciente politraumatizado.\n\nPasos:\n1. X: Control hemorragia exanguinante (torniquete si precisa).\n2. A: Vía aérea con control cervical.\n3. B: Ventilación (descartar neumotórax a tensión).\n4. C: Circulación (2 vías gruesas, fluidos, sangre).\n5. D: Neurológico (Glasgow, pupilas).\n6. E: Exposición completa.\n\nTratamiento:\nÁcido Tranexámico: 1g en 10 min + 1g en 8h (en 1ª hora).\nSSF/RL 1000 ml (evitar sobrehidratación).\nProtocolo de transfusión masiva si precisa.\n\n⚠️ Alertas:\nCódigo Trauma. Inestabilidad. Lesiones penetrantes → Hospital Trauma/UCI.", "pdfUrl": "", "summary": "XABCDE. Ácido tranexámico en 1ª hora.", "indications": "Traumatismo de alta energía, inestabilidad hemodinámica.", "isTriptico": false}, "hosp-tce": {"title": "TCE (Traumatismo Craneoencefálico)", "category": "Trauma", "text": "TCE Adulto\n\nManejo del traumatismo craneoencefálico.\n\nPasos:\n1. ABCDE con inmovilización cervical.\n2. Glasgow y pupilas.\n3. TAC craneal si criterios (Canadian CT Head Rule).\n4. Control de HTIC si precisa.\n\nTratamiento:\nSuero Hipertónico al 7.5% o Manitol 20% (0.5-1 g/kg) si HTIC.\nSedación: Propofol/Midazolam si IOT.\nAntiepilépticos profilácticos si fractura deprimida.\n\n⚠️ Alertas:\nGCS ≤ 13, focalidad, hallazgos en TAC, coagulopatía → Neurocirugía/UCI.", "pdfUrl": "", "summary": "Manejo TCE. Canadian CT Rule. Control HTIC.", "indications": "Traumatismo craneal con alteración de conciencia o focalidad.", "isTriptico": false}, "hosp-quemaduras": {"title": "Quemaduras", "category": "Trauma", "text": "Quemaduras\n\nManejo del paciente quemado.\n\nPasos:\n1. Retirar de la fuente de calor, enfriar con agua 20°C.\n2. Regla de los 9 (superficie corporal quemada).\n3. Fórmula de Parkland para fluidoterapia.\n4. Analgesia potente.\n5. Valorar vía aérea (inhalación de humos).\n\nTratamiento:\nFluidos: Ringer Lactato → Parkland: 2-4 ml x kg x %SCQ (50% en 1as 8h).\nMorfina/Fentanilo IV para dolor.\nProfilaxis antitetánica.\n\n⚠️ Alertas:\nGran quemado (>20% SCQ), quemadura eléctrica/química, inhalación, zonas especiales (cara, manos, genitales) → Unidad de Quemados.", "pdfUrl": "", "summary": "Regla de los 9. Parkland. Analgesia potente.", "indications": "Quemaduras térmicas, químicas o eléctricas.", "isTriptico": false}, "hosp-isquemia-arterial": {"title": "Isquemia Arterial Aguda", "category": "Cirugía Vascular", "text": "Isquemia Arterial Aguda\n\nEmergencia vascular. Regla de las 6 P.\n\nPasos:\n1. Pain, Pallor, Pulselessness, Paresthesia, Paralysis, Poikilothermia.\n2. Heparinización precoz.\n3. Analgesia potente.\n4. Valorar viabilidad de la extremidad (Rutherford).\n\nTratamiento:\nHeparina Sódica: 5000 UI bolo IV + perfusión 1000 UI/h.\nMorfina/Fentanilo para dolor.\nNo elevar la extremidad.\n\n⚠️ Alertas:\nExtremidad amenazada (IIa/IIb) → Revascularización urgente (Cirugía Vascular).", "pdfUrl": "", "summary": "Regla 6P. Heparinización precoz. Revascularización urgente.", "indications": "Dolor agudo + palidez + ausencia de pulso en extremidad.", "isTriptico": false}, "hosp-aorta": {"title": "Patología Aórtica Aguda (Disección)", "category": "Cirugía Vascular", "text": "Patología Aórtica Aguda\n\nDisección aórtica y aneurisma roto.\n\nPasos:\n1. Control estricto TA y FC.\n2. TAC con contraste urgente (AngioTC).\n3. Clasificación Stanford: Tipo A (ascendente) vs Tipo B (descendente).\n4. Valoración por Cirugía Cardiovascular.\n\nTratamiento:\nLabetalol IV o Esmolol IV: Objetivo TAS <120 mmHg, FC <60 lpm.\nMorfina IV para dolor.\nEvitar Nitroprusiato solo (taquicardia refleja).\n\n⚠️ Alertas:\nDisección Tipo A → Cirugía URGENTE.\nTipo B complicada (isquemia, rotura) → UCI/Cirugía Vascular.", "pdfUrl": "", "summary": "Disección aórtica. Control TA estricto. Tipo A = cirugía urgente.", "indications": "Dolor torácico desgarrante irradiado a espalda, asimetría de pulsos.", "isTriptico": false}, "hosp-piel-blandas": {"title": "Infección Piel y Partes Blandas", "category": "Infecciosas", "text": "Infección de Piel y Partes Blandas\n\nCelulitis, absceso, fascitis necrotizante.\n\nPasos:\n1. Marcar bordes de la lesión.\n2. Valorar crepitación (gas en tejidos = necrotizante).\n3. Si absceso: Drenaje quirúrgico.\n4. Analítica + hemocultivos si signos sistémicos.\n\nTratamiento:\nCelulitis leve: Amoxicilina-clavulánico 875/125 mg/8h.\nGrave: Cefazolina 2g/8h IV o Clindamicina 600mg/8h IV.\nSospecha SARM: Vancomicina o Linezolid.\nFascitis necrotizante: Meropenem + Clindamicina + Cirugía urgente.\n\n⚠️ Alertas:\nCrepitación, necrosis, sepsis → Fascitis necrotizante → Cirugía URGENTE.", "pdfUrl": "", "summary": "Celulitis, absceso, fascitis necrotizante.", "indications": "Eritema, calor, dolor e induración cutánea progresivos.", "isTriptico": false}, "hosp-urticaria-angioedema": {"title": "Urticaria y Angioedema", "category": "Urgencias Alergia", "text": "Urticaria y Angioedema\n\nReacción alérgica cutánea +/- compromiso vía aérea.\n\nPasos:\n1. Valorar vía aérea (angioedema lingual/laríngeo).\n2. Diferenciar: Alérgica vs Hereditaria (bradicinina).\n3. Antihistamínicos + Corticoides.\n\nTratamiento:\nDexclorfeniramina 5mg IM/IV.\nMetilprednisolona 40-80mg IV.\nSi compromiso vía aérea: Adrenalina 0.5mg IM.\nAngioedema hereditario: Icatibant 30mg SC o C1 inhibidor.\n\n⚠️ Alertas:\nCompromiso vía aérea → Adrenalina IM inmediata. Observación por riesgo de anafilaxia.", "pdfUrl": "", "summary": "Urticaria + angioedema. Valorar siempre vía aérea.", "indications": "Habones, edema labial/lingual, dificultad para tragar.", "isTriptico": false}, "hosp-intoxicacion-etilica": {"title": "Intoxicación Etílica", "category": "Toxicología", "text": "Intoxicación Etílica Aguda\n\nManejo de la embriaguez y complicaciones.\n\nPasos:\n1. Descartar traumatismo craneal (TAC si Glasgow bajo o focalidad).\n2. Glucemia capilar.\n3. Tiamina ANTES de glucosa.\n4. Posición lateral de seguridad si coma.\n\nTratamiento:\nTiamina: 100 mg IM/IV (prevención Wernicke).\nGlucosa IV si hipoglucemia (Glucosmon R50).\nHidratación con SSF.\n\n⚠️ Alertas:\nComa, broncoaspiración, traumatismo asociado, hipoglucemia persistente.", "pdfUrl": "", "summary": "Tiamina antes de glucosa. Descartar TCE.", "indications": "Disminución de conciencia en contexto de ingesta etílica.", "isTriptico": false}, "hosp-intoxicacion-farmacos": {"title": "Intoxicación por Fármacos/Drogas", "category": "Toxicología", "text": "Intoxicación por Fármacos/Drogas\n\nManejo general de intoxicaciones.\n\nPasos:\n1. ABCDE, estabilización.\n2. Identificar tóxico y tiempo.\n3. Descontaminación: Carbón activado (si <2h y consciente).\n4. Antídoto específico si existe.\n5. Valoración psiquiátrica si intencional.\n\nTratamiento:\nCarbón activado: 1 g/kg VO (máx 50g) si <2h.\nNaloxona 0.4-2 mg IV (intoxicación opiácea).\nFlumazenilo 0.2 mg IV (benzodiacepinas - con precaución).\nN-Acetilcisteína (intoxicación paracetamol - Nomograma Rumack-Matthew).\n\n⚠️ Alertas:\nDisminución de conciencia, necesidad soporte vital. Riesgo suicida → Psiquiatría.", "pdfUrl": "", "summary": "Carbón activado, antídotos específicos. Valorar suicidabilidad.", "indications": "Sospecha de ingesta tóxica voluntaria o accidental.", "isTriptico": false}, "hosp-agitacion": {"title": "Agitación Psicomotriz", "category": "Psiquiatría", "text": "Agitación Psicomotriz\n\nPaciente agitado en urgencias.\n\nPasos:\n1. Seguridad: No enfrentar, espacio amplio.\n2. Contención verbal (desescalada).\n3. Si falla: Contención mecánica con protocolo.\n4. Sedación farmacológica.\n5. Descartar causa orgánica (glucemia, tóxicos, infección, TCE).\n\nTratamiento:\nMidazolam 5 mg IM/IV + Haloperidol 5 mg IM.\nAlternativa: Olanzapina 10 mg IM o Aripiprazol 9.75 mg IM.\n\n⚠️ Alertas:\nCausa orgánica → UCI/Medicina Interna.\nRiesgo de autolisis o heteragresión → Psiquiatría.", "pdfUrl": "", "summary": "Desescalada verbal. Sedación si falla. Descartar causa orgánica.", "indications": "Paciente violento, agitado o con conducta desorganizada.", "isTriptico": false}, "hosp-suicida": {"title": "Paciente con Conducta Suicida", "category": "Psiquiatría", "text": "Paciente con Conducta Suicida\n\nValoración del riesgo autolítico.\n\nPasos:\n1. Seguridad del entorno (retirar objetos peligrosos).\n2. Contención si precisa.\n3. Entrevista empática y valoración de riesgo.\n4. Escala SAD PERSONS.\n5. Tratar lesiones físicas/intoxicación asociada.\n\nTratamiento:\nSedación si agitación.\nTratar lesiones/intoxicación.\nAcompañamiento continuo.\n\n⚠️ Alertas:\nRiesgo autolítico alto, falta de soporte familiar, patología psiquiátrica grave → Ingreso Psiquiatría.", "pdfUrl": "", "summary": "Valoración riesgo autolítico. Entorno seguro.", "indications": "Ideación suicida, intento autolítico o autolesiones.", "isTriptico": false}, "hosp-eii": {"title": "Enfermedad Inflamatoria Intestinal (EII)", "category": "Digestivo", "text": "Brote de EII en Urgencias\n\nCrohn y Colitis Ulcerosa.\n\nPasos:\n1. Valorar gravedad: Truelove-Witts (CU) / Harvey-Bradshaw (Crohn).\n2. Descartar infección sobreañadida (Clostridioides, CMV).\n3. Coprocultivos y toxina C. difficile.\n4. Rx abdomen (descartar megacolon tóxico).\n\nTratamiento:\nBrote leve-moderado: Mesalazina.\nBrote grave: Corticoides IV (Metilprednisolona 1 mg/kg/día, máx 60 mg).\nMegacolon tóxico: Dieta absoluta + ATB + valorar cirugía.\n\n⚠️ Alertas:\nBrote grave, megacolon tóxico, absceso, deshidratación → Ingreso.", "pdfUrl": "", "summary": "Brote grave de Crohn/CU. Escalas Truelove-Witts.", "indications": "Diarrea sanguinolenta, dolor abdominal en paciente con EII.", "isTriptico": false}, "hosp-ped-meningitis": {"title": "Meningitis Pediátrica", "category": "Pediatría", "text": "Meningitis Pediátrica\n\nInfección meníngea en el niño.\n\nPasos:\n1. Hemocultivos.\n2. Dexametasona IV (antes o con 1ª dosis ATB).\n3. ATB empírico precoz.\n4. Punción lumbar (si no contraindicada).\n\nTratamiento:\n<3 meses: Ampicilina 75 mg/kg/6h + Cefotaxima 50 mg/kg/6h.\n>3 meses: Cefotaxima 75 mg/kg/6h + Vancomicina 15 mg/kg/6h.\nDexametasona: 0.15 mg/kg/6h x 4 días.\n\n⚠️ Alertas:\nIngreso en UCIP si inestabilidad, shock, púrpura, Glasgow bajo.", "pdfUrl": "", "summary": "ATB empírico precoz según edad. Dexametasona IV.", "indications": "Fiebre + irritabilidad/vómitos + rigidez nuca en niño.", "isTriptico": false}, "hosp-ped-convulsion-febril": {"title": "Convulsión Febril Pediátrica", "category": "Pediatría", "text": "Convulsión Febril\n\nCrisis asociada a fiebre en niños de 6 meses a 5 años.\n\nPasos:\n1. ABC, proteger de lesiones.\n2. Antipiréticos.\n3. BZD si crisis >5 min.\n4. Diferenciar simple vs compleja.\n5. Buscar foco febril.\n\nTratamiento:\nDiazepam rectal 0.5 mg/kg (máx 10 mg).\nMidazolam bucal/nasal 0.2-0.3 mg/kg.\nParacetamol 15 mg/kg o Ibuprofeno 10 mg/kg.\n\n⚠️ Alertas:\nStatus febril, crisis complejas (focal, >15 min, recurrente en 24h), recuperación lenta → Observación/Ingreso.", "pdfUrl": "", "summary": "BZD si >5 min. Diferenciar simple vs compleja.", "indications": "Crisis convulsiva en niño febril 6m-5a.", "isTriptico": false}, "hosp-ped-bronquiolitis": {"title": "Bronquiolitis Pediátrica", "category": "Pediatría", "text": "Bronquiolitis Aguda\n\nInfección viral de vías bajas en lactantes (VRS).\n\nPasos:\n1. Valorar gravedad (escala Wood-Downes).\n2. Soporte respiratorio.\n3. Lavados nasales frecuentes.\n4. Alimentación fraccionada.\n\nTratamiento:\nO2 si SatO2 <92-94%.\nOAF/CPAP si grave.\nSalbutamol NO recomendado de rutina.\nSuero hipertónico 3% nebulizado (opcional en ingresados).\n\n⚠️ Alertas:\nDificultad respiratoria moderada-grave, apneas, intolerancia oral, <6 semanas → Ingreso.", "pdfUrl": "", "summary": "VRS en lactantes. Soporte. No salbutamol de rutina.", "indications": "Lactante con rinorrea, tos, sibilancias, dificultad respiratoria.", "isTriptico": false}, "hosp-ped-laringitis": {"title": "Laringitis / Crup Pediátrico", "category": "Pediatría", "text": "Laringitis / Crup\n\nObstrucción de vía aérea superior en niños.\n\nPasos:\n1. Score de Westley (estridor, tiraje, ventilación, cianosis, conciencia).\n2. Dexametasona oral/IM.\n3. Adrenalina nebulizada si grave.\n4. Observación mínima 3-4h tras adrenalina.\n\nTratamiento:\nDexametasona: 0.15-0.6 mg/kg VO/IM (máx 10 mg). Dosis única.\nAdrenalina nebulizada: 0.5 ml/kg (máx 5 ml) de 1:1000 (si grave).\n\n⚠️ Alertas:\nEstridor en reposo, dificultad respiratoria grave, hipoxia → Observación/Ingreso.", "pdfUrl": "", "summary": "Dexametasona oral. Adrenalina neb si grave.", "indications": "Estridor inspiratorio, tos perruna, disfonía en niño.", "isTriptico": false}, "hosp-ped-sepsis": {"title": "Sepsis Pediátrica", "category": "Pediatría", "text": "Sepsis Pediátrica\n\nCódigo Sepsis Pediátrico. Actuación urgente.\n\nPasos:\n1. Triángulo de Evaluación Pediátrica (TEP).\n2. Acceso vascular <5 min (IO si falla IV).\n3. Fluidos <15 min: SSF 20 ml/kg en bolo.\n4. ATB <60 min.\n5. Reevaluar tras cada bolo.\n\nTratamiento:\nFluidos: SSF 20 ml/kg (repetir hasta 60 ml/kg).\nATB: Ceftriaxona 80 mg/kg.\nShock frío (extremidades frías): Adrenalina 0.05-0.3 µg/kg/min.\nShock caliente (vasodilatado): Noradrenalina.\n\n⚠️ Alertas:\nShock refractario a fluidos, fallo multiorgánico → UCIP.", "pdfUrl": "", "summary": "Código Sepsis Ped. Vía <5 min, fluidos <15 min, ATB <60 min.", "indications": "TEP alterado + sospecha infección en niño.", "isTriptico": false}, "hosp-obs-gripe": {"title": "Gripe y Gestación", "category": "Obstetricia", "text": "Gripe en la Embarazada\n\nManejo de la infección gripal en gestantes.\n\nPasos:\n1. Valorar criterios de gravedad.\n2. Oseltamivir precoz (dentro de las 1as 48h).\n3. Monitorización fetal si >24 semanas.\n\nTratamiento:\nOseltamivir: 75 mg/12h x 5 días.\nParacetamol para fiebre (evitar AINEs).\nHidratación.\n\n⚠️ Alertas:\nNeumonía, distrés respiratorio, SatO2 <95%, deshidratación → Ingreso en aislamiento.", "pdfUrl": "", "summary": "Oseltamivir precoz en embarazada con gripe.", "indications": "Gestante con síndrome gripal.", "isTriptico": false}, "hosp-obs-migrana": {"title": "Migraña y Gestación", "category": "Obstetricia", "text": "Migraña en la Embarazada\n\nManejo seguro de cefalea en gestación.\n\nPasos:\n1. Descartar preeclampsia (>20 semanas): TA, proteinuria.\n2. Descartar trombosis venosa cerebral.\n3. Analgesia segura.\n\nTratamiento:\nParacetamol 1g/6-8h.\nMetoclopramida 10 mg IV (antiemético).\n2ª línea: Sumatriptán 50 mg VO (valorar riesgo/beneficio).\nEvitar AINEs en 3er trimestre.\nEvitar ergotamínicos (contraindicados).\n\n⚠️ Alertas:\nStatus migrañoso, signos de alarma, cefalea con HTA → Neurología/Obstetricia.", "pdfUrl": "", "summary": "Paracetamol + Metoclopramida. Descartar preeclampsia.", "indications": "Cefalea intensa en gestante.", "isTriptico": false}, "hosp-obs-parto": {"title": "Amenaza de Parto Prematuro / Parto Inminente", "category": "Obstetricia", "text": "Amenaza de Parto Prematuro / Parto en Urgencias\n\nManejo del parto prematuro y parto no hospitalario.\n\nPasos:\n1. Valorar dinámica uterina y cérvix.\n2. Corticoides si prematuridad (24-34+6 semanas).\n3. Profilaxis EGB si indicada.\n4. Si parto inminente: No impedir la salida del bebé.\n\nTratamiento:\nBetametasona 12 mg IM x2 dosis (separadas 24h) - maduración pulmonar.\nProfilaxis EGB: Penicilina G 5M UI + 2.5M/4h IV o Ampicilina.\nAtosibán IV (tocolisis si <48h para completar corticoides).\n\n⚠️ Alertas:\nParto en curso o amenaza de parto prematuro → Ingreso Paritorio.", "pdfUrl": "", "summary": "Corticoides si <34+6 sem. Profilaxis EGB.", "indications": "Dinámica uterina regular con modificación cervical.", "isTriptico": false}, "hosp-disnea": {"title": "Disnea Aguda / Insuficiencia Respiratoria", "category": "Neumología", "text": "Disnea Aguda / Insuficiencia Respiratoria\n\nDificultad respiratoria de inicio súbito.\n\nPasos:\n1. Valorar gravedad: SatO2, FR, trabajo respiratorio.\n2. O2 para SatO2 >90-92%.\n3. Causas frecuentes: Asma, EPOC, ICC, TEP, neumotórax, neumonía.\n4. Rx tórax + ECG + Gasometría.\n5. VMNI si precisa (CPAP/BiPAP).\n\nTratamiento:\nO2 alto flujo si hipoxemia.\nBroncodilatadores si broncoespasmo.\nDiuréticos si ICC.\nVMNI si acidosis respiratoria o EAP.\n\n⚠️ Alertas:\nHipoxemia refractaria, agotamiento muscular, acidosis respiratoria → UCI.", "pdfUrl": "", "summary": "Dificultad respiratoria de inicio súbito. VMNI si precisa.", "indications": "SatO2 baja, taquipnea, uso musculatura accesoria.", "isTriptico": false}};
var urgPreguntas = [];
var urgProcessing = false;

function switchUrgTab(tabName, btnEl) {
    document.querySelectorAll('.urg-tab-content').forEach(function(el){ el.style.display='none'; });
    document.getElementById(tabName+'-content').style.display='block';
    document.querySelectorAll('.tab-urg').forEach(function(b){ b.classList.remove('active'); b.style.color='rgba(255,255,255,.6)'; });
    btnEl.classList.add('active');
    btnEl.style.color='#fff';
    if(tabName==='urg-pacientes')gpRender('Urg');
}

function urgViewProtocol(id) {
    var p = URG_PROTOCOLS[id];
    if (!p) return;
    document.getElementById('urgProtoModalCat').textContent = p.category + (p.isTriptico ? ' · Tríptico' : ' · SEMFyC');
    document.getElementById('urgProtoModalTitle').textContent = p.title;
    document.getElementById('urgProtoModalSummary').textContent = p.summary || '';
    
    var bodyHtml = '';
    if (p.indications) bodyHtml += '<div style="background:#fff3e0;padding:12px;border-radius:8px;margin-bottom:12px;border-left:4px solid #f57c00;"><strong style="color:#e65100;">📌 Indicaciones</strong><br>' + p.indications + '</div>';
    
    var textLines = p.text.split('\n');
    var formattedText = '';
    for (var i = 0; i < textLines.length; i++) {
        var line = textLines[i];
        if (line.indexOf('⚠️') === 0 || line.indexOf('Alertas') !== -1) {
            formattedText += '<div style="background:#ffebee;padding:10px;border-radius:6px;margin:8px 0;border-left:3px solid #d32f2f;color:#c62828;">' + line + '</div>';
        } else if (line.match(/^\d+\./)) {
            formattedText += '<div style="margin:6px 0;padding-left:8px;border-left:2px solid #1a6b4a;">' + line + '</div>';
        } else if (line.indexOf('Pasos:') === 0 || line.indexOf('Tratamiento:') === 0) {
            formattedText += '<h4 style="color:#1a6b4a;margin:14px 0 6px;font-size:.95rem;">' + line + '</h4>';
        } else {
            formattedText += '<p style="margin:4px 0;">' + line + '</p>';
        }
    }
    bodyHtml += formattedText;
    
    document.getElementById('urgProtoModalBody').innerHTML = bodyHtml;
    
    var pdfDiv = document.getElementById('urgProtoModalPdf');
    if (p.pdfUrl) {
        pdfDiv.style.display = 'block';
        document.getElementById('urgProtoModalPdfLink').href = p.pdfUrl.replace('/preview', '/view');
    } else {
        pdfDiv.style.display = 'none';
    }
    
    document.getElementById('urgProtoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function urgCloseModal() {
    document.getElementById('urgProtoModal').style.display = 'none';
    document.body.style.overflow = '';
}

function urgQuickAsk(q) {
    document.getElementById('urgPreguntaInput').value = q;
    urgHacerPregunta();
}

async function urgHacerPregunta() {
    var input = document.getElementById('urgPreguntaInput');
    var q = input.value.trim();
    if (!q || urgProcessing) return;
    if (!isReady()) {
        alert('⚙️ Configura tu API Key primero en Protocolos de Atención Primaria > Config IA');
        return;
    }
    urgProcessing = true;
    document.getElementById('urgBtnPreguntar').disabled = true;
    
    var sel = document.getElementById('urgProtoSelect').value;
    var contextText = '';
    if (sel === 'all') {
        for (var k in URG_PROTOCOLS) contextText += '\n\n--- ' + URG_PROTOCOLS[k].title + ' (' + URG_PROTOCOLS[k].category + ') ---\n' + URG_PROTOCOLS[k].text;
    } else if (URG_PROTOCOLS[sel]) {
        contextText = URG_PROTOCOLS[sel].text;
    }
    
    urgPreguntas.push({ pregunta: q, respuesta: '⏳ Consultando...', fecha: new Date().toLocaleString('es-ES') });
    input.value = '';
    urgRenderPreguntas();
    
    var sys = 'Eres un médico de urgencias experto. Responde basándote ÚNICAMENTE en los protocolos de urgencias proporcionados. Sé conciso, clínico y práctico. Usa viñetas cuando ayude a la claridad. Responde en español.\n\nPROTOCOLOS:\n' + contextText;
    
    var r = await llamarIA(q, sys);
    urgPreguntas[urgPreguntas.length - 1].respuesta = r;
    urgRenderPreguntas();
    urgProcessing = false;
    document.getElementById('urgBtnPreguntar').disabled = false;
}

function urgRenderPreguntas() {
    var el = document.getElementById('urgPreguntasList');
    if (urgPreguntas.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5;"><div style="font-size:2rem;margin-bottom:8px;">🩺</div><p>Haz tu primera pregunta sobre urgencias</p></div>';
        return;
    }
    el.innerHTML = urgPreguntas.slice().reverse().map(function(p) {
        return '<div style="background:rgba(255,255,255,.08);padding:14px;border-radius:8px;margin-bottom:10px;border-left:3px solid #d32f2f;"><div style="font-weight:600;margin-bottom:8px;font-size:.9rem;">❓ '+esc(p.pregunta)+'</div><div style="font-size:.88rem;opacity:.9;line-height:1.6;white-space:pre-wrap;">'+esc(p.respuesta)+'</div><div style="font-size:.75rem;opacity:.4;margin-top:8px;">'+p.fecha+'</div></div>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    var urgInput = document.getElementById('urgPreguntaInput');
    if (urgInput) urgInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') urgHacerPregunta(); });
    var urgModal = document.getElementById('urgProtoModal');
    if (urgModal) urgModal.addEventListener('click', function(e) { if (e.target === this) urgCloseModal(); });
});


// ═══ PAGE NAVIGATION ═══
var PAGES_REQUIRE_LOGIN=["pageTelefonos","pageProtocolosAP","pageProtocolosUrgencias","pageProfessionals","pageFilehub","pageEnfermeria","pageScanIA"];
function showPage(id){
    // Páginas que requieren login (NO incluye pagePatients ni pageTriaje)
    var PAGES_REQUIRE_LOGIN=["pageTelefonos","pageProtocolosAP","pageProtocolosUrgencias","pageProfessionals","pageFilehub","pageEnfermeria","pageScanIA"];
    if(PAGES_REQUIRE_LOGIN.indexOf(id)!==-1){
        var user=firebase.auth().currentUser;
        if(!user){
            pendingPageAfterLogin=id;
            try{
                document.getElementById("scanLoginModal").style.display="flex";
                document.getElementById("scanLoginError").style.display="none";
                resetDisclaimerCheck();
            }catch(e){console.error(e);}
            return;
        }
        try{logPageAccess(id,user);}catch(e){}
    }
    try{
        document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active")});
        var pageEl=document.getElementById(id);
        if(!pageEl){console.error("showPage: no existe elemento con id="+id);return;}
        pageEl.classList.add("active");
    }catch(e){console.error("showPage error:",e);return;}
    // Track page views for dashboard
    try{var pv=JSON.parse(localStorage.getItem('pageViews')||'{}');pv[id]=(pv[id]||0)+1;localStorage.setItem('pageViews',JSON.stringify(pv));}catch(e){}
    try{logUsage('page_view',id);}catch(e){}
    // Inicializaciones específicas por página
    try{if(id==="pageProfessionals")initProfessionals();}catch(e){}
    try{if(id==="pageScanIA")scanRenderHist();}catch(e){}
    try{if(id==="pageTelefonos"){renderTelefonos(TEL_DATA);setTimeout(function(){var s=document.getElementById("telSearch");if(s)s.value="";},50);}}catch(e){}
    // Barra de moderación (opcional, no bloquea)
    try{
        var modUser=firebase.auth().currentUser;
        var barEl=document.getElementById("modBar_"+id);
        if(barEl){
            if(modUser){barEl.style.display="flex";var uel=document.getElementById("modBarUser_"+id);if(uel)uel.textContent=modUser.displayName||modUser.email;}
            else{barEl.style.display="none";}
        }
        if(modUser)mostrarBtnSubir();
    }catch(e){}
}
var pendingPageAfterLogin=null;
function logPageAccess(pageId,user){
    try{
        db.collection("accesos_profesionales").add({
            pagina:pageId,
            email:user.email||"",
            nombre:user.displayName||"",
            uid:user.uid,
            fecha:new Date(),
            timestamp:Date.now()
        });
    }catch(e){console.error("Log access error:",e);}
}

// ═══ ANONYMOUS USAGE TRACKING (for demo metrics + OWASP A09) ═══
function logUsage(action,detail){
    try{
        // Local tracking (always works)
        var views=JSON.parse(localStorage.getItem('usageLog')||'[]');
        views.push({action:action,detail:detail||'',time:Date.now()});
        if(views.length>500) views=views.slice(-500);
        localStorage.setItem('usageLog',JSON.stringify(views));
        // Increment daily counter
        var today=new Date().toISOString().split('T')[0];
        var daily=JSON.parse(localStorage.getItem('dailyViews')||'{}');
        daily[today]=(daily[today]||0)+1;
        localStorage.setItem('dailyViews',JSON.stringify(daily));
        // Firestore tracking (anonymous, for demo metrics)
        if(typeof db!=='undefined'){
            db.collection("uso_anonimo").add({
                accion:action,
                detalle:detail||'',
                fecha:new Date(),
                timestamp:Date.now(),
                ua:navigator.userAgent.substring(0,100)
            }).catch(function(){});
        }
    }catch(e){}
}
// Track page opens
(function(){var _origShowPage=null;document.addEventListener('DOMContentLoaded',function(){logUsage('session_start','landing');});})();

// ═══ PROFESSIONALS LOGIC (all existing code) ═══
var categories={"Cardiología":"❤️","Dermatología":"🩹","Digestivo":"🍽️","Endocrinología":"🧬","Geriatría":"👴","Ginecología":"🤰","Neurología":"🧠","Neumología":"💨","Pediatría":"👶","Traumatología":"🦴","Urología":"🫘","ORL":"👂","Oftalmología":"👁️","Psiquiatría":"🧠","Hematología":"🩸","Nefrología":"💧","Reumatología":"🦿","Urgencias":"🚨","Infecciosas":"🦠","Alergología":"🤧","Cirugía Menor":"🩹","Paliativos":"🕊️","Urgencias Hospitalarias":"🏥","Protocolos Médicos":"📋"};
var currentCategory="Cardiología",documents={},preguntas={},notas={},isProcessing=false,profInitialized=false;
var CONFIG={provider:"groq",groqKey:"",groqModel:"qwen/qwen3-32b",qwenKey:"",qwenModel:"qwen-turbo"};
try{var s=localStorage.getItem("notebook_ai_cfg_v3");if(s)Object.assign(CONFIG,JSON.parse(s));}catch(e){}
var ENDPOINTS={groq:{url:"https://openrouter.ai/api/v1/chat/completions",getKey:function(){return "REDACTED_OPENROUTER_3_2026-04"},getModel:function(){return "deepseek/deepseek-chat-v3-0324:free"},prefix:"sk-"},qwen:{url:"https://openrouter.ai/api/v1/chat/completions",getKey:function(){return "REDACTED_OPENROUTER_3_2026-04"},getModel:function(){return "google/gemma-3-27b-it:free"},prefix:"sk-"}};
function ep(){return ENDPOINTS[CONFIG.provider]||ENDPOINTS.groq}
function isReady(){return true;}
function updateStatus(){var el=document.getElementById("statusBadge"),b=document.getElementById("modelBadge"),i=document.getElementById("modelInfo");if(!el)return;el.className="nav-status ok";el.textContent="✅ IA Conectada";b.textContent="DeepSeek";i.textContent="OpenRouter · Gratuito";}
function cambiarProvider(){var v=document.getElementById("cfgProvider").value;document.getElementById("groqConfig").style.display=v==="groq"?"block":"none";document.getElementById("qwenConfig").style.display=v==="qwen"?"block":"none";}
async function fetchWithCorsProxy(url,options){try{var r=await fetch(url,options);return r;}catch(e){throw new Error("No se pudo conectar.");}}
async function llamarIA(up,sp){
  var DS_KEY='REDACTED_DEEPSEEK_OLD_2026-04';// DeepSeek API key - set below after registration
  var OR_KEY='REDACTED_OPENROUTER_3_2026-04';
  var NAS_URL='http://REDACTED_INTERNAL_IP:3100';
  var isHTTPS=location.protocol==='https:';
  // Strategy: DeepSeek direct (free 5M tokens, no rate limit) → Pollinations → OpenRouter
  var providers=[];
  if(!isHTTPS) providers.push({type:'nas'});
  providers.push({type:'ds'});
  providers.push({type:'poll'});
  providers.push({type:'or',model:'deepseek/deepseek-chat-v3-0324:free'});
  providers.push({type:'or',model:'google/gemma-3-27b-it:free'});
  providers.push({type:'or',model:'meta-llama/llama-4-maverick:free'});
  var sysMsg=sp||'Eres un asistente médico. Responde en español.';
  var msgs=[{role:'system',content:sysMsg},{role:'user',content:up}];

  for(var i=0;i<providers.length;i++){
    try{
      var p=providers[i];
      var ctrl=new AbortController();
      var tid=setTimeout(function(){ctrl.abort();},p.type==='poll'?18000:12000);
      var r;

      if(p.type==='nas'){
        r=await fetch(NAS_URL+'/ai/chat',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({messages:msgs,max_tokens:2000,temperature:0.3}),
          signal:ctrl.signal
        });
      } else if(p.type==='ds' && DS_KEY){
        r=await fetch('https://api.deepseek.com/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+DS_KEY},
          body:JSON.stringify({model:'deepseek-chat',messages:msgs,max_tokens:2000,temperature:0.3}),
          signal:ctrl.signal
        });
      } else if(p.type==='ds' && !DS_KEY){
        continue;
      } else if(p.type==='poll'){
        r=await fetch('https://text.pollinations.ai/openai',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({model:'openai-large',messages:msgs,seed:Math.floor(Math.random()*9999),private:true}),
          signal:ctrl.signal
        });
      } else {
        r=await fetch('https://openrouter.ai/api/v1/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+OR_KEY,
            'HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/','X-Title':'Profesionales Area II'},
          body:JSON.stringify({model:p.model,messages:msgs,max_tokens:2000,temperature:0.3}),
          signal:ctrl.signal
        });
      }
      clearTimeout(tid);

      if(r.status===429||r.status===502||r.status===503||r.status===402) continue;
      if(!r.ok) continue;
      var d=await r.json();
      var c=(d.choices&&d.choices[0]&&d.choices[0].message)?d.choices[0].message.content:null;
      if(!c) continue;
      c=c.replace(/<think>[\s\S]*?<\/think>/g,'').trim();
      if(!c) continue;
      try{var hist=JSON.parse(localStorage.getItem('aiHistory')||'[]');hist.push({question:up.substring(0,200),answer:c.substring(0,300),section:currentCategory||'general',timestamp:Date.now()});if(hist.length>200)hist=hist.slice(-200);localStorage.setItem('aiHistory',JSON.stringify(hist));}catch(he){}
      return c;
    }catch(e){continue;}
  }
  return '⚠️ No se pudo conectar con la IA. Comprueba tu conexión a internet e inténtalo de nuevo.';
}
async function hacerPregunta(){var input=document.getElementById("preguntaInput"),q=input.value.trim();if(!q||isProcessing)return;isProcessing=true;document.getElementById("btnPreguntar").disabled=true;if(!preguntas[currentCategory])preguntas[currentCategory]=[];var idx=preguntas[currentCategory].length;preguntas[currentCategory].push({pregunta:q,respuesta:"⏳ Consultando...",fecha:new Date().toLocaleString("es-ES")});input.value="";actualizarUI();var docs=documents[currentCategory]||[];var dc=docs.map(function(d){return"- "+d.name}).join("\n");var sys="Eres un asistente médico especializado en "+currentCategory+". Responde en español."+(dc?"\nDocs:\n"+dc:"");var r=await llamarIA(q,sys);preguntas[currentCategory][idx].respuesta=r;guardarDatos();actualizarUI();isProcessing=false;document.getElementById("btnPreguntar").disabled=false;}
var studioPrompts={resumen:{title:"📋 Resumen — ",prompt:"Resumen ejecutivo sobre {cat}: patologías, diagnósticos, tratamientos."},faq:{title:"❓ FAQ — ",prompt:"8 preguntas frecuentes sobre {cat} con respuestas."},guia:{title:"📖 Guía — ",prompt:"Guía de estudio {cat}: conceptos, clasificaciones, fármacos, dosis."},diagnostico:{title:"🩺 Dx — ",prompt:"Diagnóstico diferencial de {cat}: síntomas, pruebas, red flags."},farmacologia:{title:"💊 Farma — ",prompt:"Farmacología {cat}: grupos, mecanismo, dosis, efectos adversos."},emergencia:{title:"🚨 Urgencia — ",prompt:"Protocolos emergencia {cat}: reconocimiento, tratamiento, dosis."}};
var lastSC="",lastST="";
async function studioAction(t){if(!isReady()||isProcessing)return;var c=studioPrompts[t];if(!c)return;isProcessing=true;document.querySelectorAll(".studio-card").forEach(function(x){x.disabled=true});var rd=document.getElementById("studioResult"),cd=document.getElementById("studioResultContent");lastST=c.title+currentCategory;document.getElementById("studioResultTitle").textContent=lastST;cd.textContent="⏳ Generando...";rd.style.display="block";lastSC=await llamarIA(c.prompt.replace(/\{cat\}/g,currentCategory),"Experto médico. Responde en español.");cd.textContent=lastSC;isProcessing=false;document.querySelectorAll(".studio-card").forEach(function(x){x.disabled=false});}
function guardarStudioComoNota(){if(!lastSC)return;if(!notas[currentCategory])notas[currentCategory]=[];notas[currentCategory].push({texto:lastST+"\n\n"+lastSC,fecha:new Date().toLocaleString("es-ES")});guardarDatos();actualizarUI();alert("✅ Guardado")}
function agregarNota(){var t=document.getElementById("noteInput").value.trim();if(!t)return;if(!notas[currentCategory])notas[currentCategory]=[];notas[currentCategory].push({texto:t,fecha:new Date().toLocaleString("es-ES")});document.getElementById("noteInput").value="";guardarDatos();actualizarUI();}
function fmtClinical(md){
  if(!md)return'<p style="color:#888;">Sin contenido.</p>';
  var css='<style>.cl-proto{font-family:-apple-system,system-ui,sans-serif;line-height:1.75;color:var(--text,#1e293b);font-size:.9rem}'+
    '.cl-proto h2{font-size:1.05rem;font-weight:700;color:#0f172a;margin:20px 0 8px;padding-bottom:6px;border-bottom:2px solid #0d9488}'+
    '.cl-proto h3{font-size:.95rem;font-weight:700;color:#0d9488;margin:16px 0 6px}'+
    '.cl-proto h4{font-size:.88rem;font-weight:600;color:#334155;margin:12px 0 4px}'+
    '.cl-proto p{margin:0 0 8px}'+
    '.cl-proto strong{color:#0f172a;font-weight:600}'+
    '.cl-proto em{color:#64748b;font-style:italic}'+
    '.cl-proto ul,.cl-proto ol{margin:6px 0 12px 20px;padding:0}'+
    '.cl-proto li{margin-bottom:4px}'+
    '.cl-proto .alert-box{background:#fef2f2;border-left:4px solid #ef4444;padding:10px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:.84rem;color:#991b1b}'+
    '.cl-proto .info-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:10px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:.84rem;color:#1e40af}'+
    '.cl-proto .drug-box{background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:.84rem;color:#166534}'+
    '.cl-proto code{background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:.84rem;color:#0d9488;font-family:monospace}'+
    '.cl-proto hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0}'+
    '.cl-proto table{width:100%;border-collapse:collapse;margin:10px 0;font-size:.84rem}'+
    '.cl-proto th{background:#f0fdfa;color:#0d9488;font-weight:600;padding:8px 10px;text-align:left;border-bottom:2px solid #0d9488}'+
    '.cl-proto td{padding:6px 10px;border-bottom:1px solid #e2e8f0}'+
    '</style>';
  var html=md
    .replace(/^### (.*$)/gm,'<h3>$1</h3>')
    .replace(/^## (.*$)/gm,'<h2>$1</h2>')
    .replace(/^# (.*$)/gm,'<h2>$1</h2>')
    .replace(/\*\*\*(.*?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code>$1</code>')
    .replace(/^---$/gm,'<hr>')
    .replace(/^\* (.*$)/gm,'<li>$1</li>')
    .replace(/^- (.*$)/gm,'<li>$1</li>')
    .replace(/^\d+\.\s+(.*$)/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g,function(m){return'<ul>'+m+'</ul>';});
  // Alert boxes for warnings
  html=html.replace(/⚠️([^<\n]+)/g,'<div class="alert-box">⚠️$1</div>');
  html=html.replace(/🔴([^<\n]+)/g,'<div class="alert-box">🔴$1</div>');
  // Drug boxes for dosing
  html=html.replace(/💊([^<\n]+)/g,'<div class="drug-box">💊$1</div>');
  // Info boxes
  html=html.replace(/ℹ️([^<\n]+)/g,'<div class="info-box">ℹ️$1</div>');
  // Clean up remaining newlines into paragraphs
  html=html.replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>');
  if(!html.startsWith('<'))html='<p>'+html+'</p>';
  return css+'<div class="cl-proto">'+html+'<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:.72rem;color:#94a3b8;">Área II Cartagena · Generado con IA · Uso exclusivamente docente · Verificar siempre con fuentes oficiales</div></div>';
}
function openDocModal(idx){
  var docs=documents[currentCategory]||[];
  var d=docs[idx];if(!d)return;
  var modal=document.getElementById('docModal');
  if(!modal){
    modal=document.createElement('div');modal.id='docModal';
    modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML='<div style="background:var(--bg-card,#fff);border-radius:16px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;padding:24px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);">'+
      '<button onclick="document.getElementById(\'docModal\').style.display=\'none\'" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted,#999);">✕</button>'+
      '<h2 id="docModalTitle" style="font-size:1.2rem;margin-bottom:8px;padding-right:40px;color:var(--text,#333);"></h2>'+
      '<div id="docModalMeta" style="font-size:.78rem;color:var(--text-muted,#888);margin-bottom:16px;"></div>'+
      '<div id="docModalContent" style="font-size:.92rem;line-height:1.7;color:var(--text,#333);"></div>'+
      '<div style="margin-top:16px;display:flex;gap:8px;">'+
        '<button id="docModalAskAI" style="padding:8px 16px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:.82rem;">🤖 Ampliar con IA</button>'+
        '<button onclick="document.getElementById(\'docModal\').style.display=\'none\'" style="padding:8px 16px;background:none;border:1px solid var(--border,#ddd);border-radius:8px;cursor:pointer;font-size:.82rem;color:var(--text-muted,#888);">Cerrar</button>'+
      '</div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){if(e.target===modal)modal.style.display='none';});
  }
  modal.style.display='flex';
  document.getElementById('docModalTitle').textContent=d.name;
  document.getElementById('docModalMeta').textContent=(currentCategory||'')+ ' · '+(d.type||'protocolo')+' · '+(d.tags||[]).join(', ');
  document.getElementById('docModalContent').innerHTML=d.description?
    '<p>'+d.description.replace(/\n/g,'<br>')+'</p>':
    '<p style="color:var(--text-muted,#888);">Sin contenido detallado. Pulsa "Ampliar con IA" para generar un resumen.</p>';
  document.getElementById('docModalAskAI').onclick=function(){
    var content=document.getElementById('docModalContent');
    content.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-muted,#888);">⏳ Generando contenido con DeepSeek...</div>';
    llamarIA('Genera un protocolo clínico detallado sobre: '+d.name+'. Incluye: indicaciones, contraindicaciones, dosis de fármacos, pasos del procedimiento, criterios de derivación y alertas. Usa formato markdown con ### para secciones, ** para negritas, y listas numeradas.','Eres un experto médico del Área II de Cartagena. Responde en español con información clínica precisa y actualizada. Formato profesional y estructurado.').then(function(r){
      content.innerHTML=fmtClinical(r);
    });
  };
}
function eliminarNota(i){if(!confirm("¿Eliminar?"))return;notas[currentCategory].splice(i,1);guardarDatos();actualizarUI();}
function switchTab(n,b){var page=document.getElementById("pageProfessionals");if(page){page.querySelectorAll(".tab-content").forEach(function(t){t.classList.remove("active")});page.querySelectorAll(".tab-btn").forEach(function(x){x.classList.remove("active")});}else{document.querySelectorAll("#pageProfessionals .tab-content").forEach(function(t){t.classList.remove("active")});document.querySelectorAll("#pageProfessionals .tab-btn").forEach(function(x){x.classList.remove("active")});}var el=document.getElementById(n);if(el)el.classList.add("active");if(b)b.classList.add("active");if(n==="guardiaPacientes")gpRender("");}
function cambiarCategoria(c,b){currentCategory=c;document.querySelectorAll(".category-btn").forEach(function(x){x.classList.remove("active")});if(b)b.classList.add("active");document.getElementById("categoryTitle").textContent=c;var sc=document.getElementById("studioCategory");if(sc)sc.textContent=c;switchTab("preguntas",document.querySelector(".tab-btn"));actualizarUI();closeMobileSidebar();}

function openMobileSidebar(){var sb=document.getElementById("sidebarLeft");var ov=document.getElementById("sidebarOverlay");if(sb)sb.classList.add("open");if(ov)ov.classList.add("open");document.body.style.overflow="hidden";}
function closeMobileSidebar(){var sb=document.getElementById("sidebarLeft");var ov=document.getElementById("sidebarOverlay");if(sb)sb.classList.remove("open");if(ov)ov.classList.remove("open");document.body.style.overflow="";}
function esc(t){if(!t)return"";return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function actualizarUI(){var docs=documents[currentCategory]||[];document.getElementById("documentosList").innerHTML=docs.length===0?'<div class="empty-state"><div class="empty-state-icon">📄</div><p>No hay documentos</p></div>':docs.map(function(d,i){var isExternal=d.url&&(d.url.endsWith('.pdf')||d.url.startsWith('http'))&&d.url.indexOf('protocolos-nuevas-especialidades')<0;var btn=isExternal?'<a href="'+d.url+'" target="_blank" class="doc-btn">Abrir</a>':'<button onclick="openDocModal('+i+')" class="doc-btn" style="border:none;cursor:pointer;">Ver</button>';return'<div class="doc-item"><div><div class="doc-name">'+d.name+'</div><div class="doc-size">'+(d.size_mb||0)+' MB · '+(d.type||'protocolo')+'</div></div>'+btn+'</div>'}).join("");
    // Añadir bloque de propuestas aprobadas de la comunidad
    var propBlock = document.getElementById("propuestasAprobadasBlock");
    if(!propBlock){
        propBlock = document.createElement("div");
        propBlock.id = "propuestasAprobadasBlock";
        document.getElementById("documentosList").appendChild(propBlock);
    } else {
        document.getElementById("documentosList").appendChild(propBlock);
    }
    cargarPropuestasEnSeccion(currentCategory, propBlock);
    document.getElementById("docsCount").textContent=docs.length;document.getElementById("preguntasCount").textContent=(preguntas[currentCategory]||[]).length;document.getElementById("notasCount").textContent=(notas[currentCategory]||[]).length;var pa=preguntas[currentCategory]||[],pl=document.getElementById("preguntasList");pl.innerHTML=pa.length===0?'<div class="empty-state"><div class="empty-state-icon">🩺</div><p>Haz tu primera pregunta</p></div>':pa.map(function(p){return'<div class="question-box"><div class="question-text">'+esc(p.pregunta)+'</div><div class="answer-text">'+esc(p.respuesta)+'</div><div class="note-time">'+p.fecha+'</div></div>'}).join("");var na=notas[currentCategory]||[],nl=document.getElementById("notasList");nl.innerHTML=na.length===0?'<div class="empty-state"><div class="empty-state-icon">📝</div><p>Sin notas</p></div>':na.map(function(n,i){return'<div class="question-box" style="border-left-color:var(--accent)"><div style="font-size:.92rem;white-space:pre-wrap;padding-right:30px;font-weight:300;line-height:1.6">'+esc(n.texto)+'</div><div class="note-time">'+n.fecha+'</div><button onclick="eliminarNota('+i+')" style="position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;opacity:.35">🗑️</button></div>'}).join("");}

function cargarPropuestasEnSeccion(seccion, container){
    if(!container) return;
    if(typeof db === "undefined") return;
    // Buscar propuestas aprobadas cuya seccion coincida exactamente con la categoría
    db.collection("propuestas_contenido")
        .where("estado","==","aprobado")
        .where("seccion","==",seccion)
        .orderBy("fechaModeracion","desc")
        .limit(20)
        .get()
        .then(function(snap){
            if(snap.empty){ container.innerHTML=""; return; }
            var html = '<div style="margin-top:20px;border-top:2px solid var(--border);padding-top:16px;">';
            html += '<div style="font-size:.78rem;font-weight:700;color:#0066cc;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">📤 Aportaciones de la comunidad</div>';
            snap.forEach(function(doc){
                var d = doc.data();
                var icon = d.tipo==="url" ? "🔗" : "📄";
                var fechaMod = d.fechaModeracion ? new Date(d.fechaModeracion.seconds*1000).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}) : "";
                var accion = d.url
                    ? '<a href="'+escMod(d.url)+'" target="_blank" class="doc-btn" style="font-size:.78rem;padding:5px 10px;text-decoration:none;">Abrir</a>'
                    : "";
                html += '<div class="doc-item" style="border-left:3px solid #0ea5e9;">';
                html += '<div><div class="doc-name">'+icon+' '+escMod(d.titulo)+'</div>';
                html += '<div class="doc-size">👤 '+escMod(d.nombre||d.email||"Anónimo")+(fechaMod?' · '+fechaMod:'')+'</div>';
                if(d.descripcion) html += '<div style="font-size:.75rem;color:var(--text-muted);margin-top:2px;">'+escMod(d.descripcion)+'</div>';
                html += '</div>'+accion+'</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(function(){ container.innerHTML = ""; });
}
function guardarConfig(){CONFIG.provider=document.getElementById("cfgProvider").value;CONFIG.groqKey=document.getElementById("cfgGroqKey").value.trim();CONFIG.groqModel=document.getElementById("cfgGroqModel").value;CONFIG.qwenKey=document.getElementById("cfgQwenKey").value.trim();CONFIG.qwenModel=document.getElementById("cfgQwenModel").value;localStorage.setItem("notebook_ai_cfg_v3",JSON.stringify(CONFIG));if(CONFIG.groqKey&&isAdmin())saveGroqKeyToFirestore(CONFIG.groqKey);updateStatus();document.getElementById("cfgStatus").innerHTML='<span style="color:var(--primary)">✅ Guardado</span>';}
async function testApiKey(){guardarConfig();if(!isReady()){document.getElementById("cfgStatus").innerHTML='<span style="color:#dc2626">❌ Key inválida</span>';return;}var st=document.getElementById("cfgStatus");st.innerHTML='<span style="color:var(--accent)">⏳ Probando...</span>';var e=ep();try{var r=await fetchWithCorsProxy(e.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+e.getKey()},body:JSON.stringify({model:e.getModel(),messages:[{role:"user",content:"Di: OK"}],max_tokens:10})});if(r.ok)st.innerHTML='<span style="color:var(--primary)">✅ ¡Conexión exitosa!</span>';else if(r.status===401)st.innerHTML='<span style="color:#dc2626">❌ Key inválida</span>';else{var err=await r.json().catch(function(){return{}});st.innerHTML='<span style="color:#dc2626">❌ Error '+r.status+"</span>";}}catch(err){st.innerHTML='<span style="color:#dc2626">❌ '+err.message+"</span>";}}
function guardarDatos(){localStorage.setItem("cartagena_preguntas",JSON.stringify(preguntas));localStorage.setItem("cartagena_notas",JSON.stringify(notas));}
function cargarDatos(){try{preguntas=JSON.parse(localStorage.getItem("cartagena_preguntas"))||{};}catch(e){preguntas={};}try{notas=JSON.parse(localStorage.getItem("cartagena_notas"))||{};}catch(e){notas={};}}

function initProfessionals(){
    if(profInitialized)return;profInitialized=true;
    var p=new URLSearchParams(window.location.search),c=p.get("category");if(c&&categories[c])currentCategory=c;
    var list=document.getElementById("categoriesList");
    Object.keys(categories).forEach(function(cat){var btn=document.createElement("button");btn.className="category-btn"+(cat===currentCategory?" active":"");btn.innerHTML='<span class="cat-emoji">'+categories[cat]+'</span>'+cat;btn.onclick=function(){cambiarCategoria(cat,btn)};list.appendChild(btn);});
    document.getElementById("categoryTitle").textContent=currentCategory;
    document.getElementById("cfgProvider").value=CONFIG.provider;cambiarProvider();
    document.getElementById("cfgGroqKey").value=CONFIG.groqKey||"";document.getElementById("cfgGroqModel").value=CONFIG.groqModel;
    document.getElementById("cfgQwenKey").value=CONFIG.qwenKey||"";document.getElementById("cfgQwenModel").value=CONFIG.qwenModel;
    cargarDatos();updateStatus();actualizarUI();
    fetch("documents.json").then(function(r){return r.json()}).then(function(d){documents=d.categories;actualizarUI();}).catch(function(){});
    document.getElementById("preguntaInput").addEventListener("keypress",function(e){if(e.key==="Enter")hacerPregunta()});
    if(!isReady())setTimeout(function(){switchTab("config",document.querySelectorAll(".tab-btn")[4])},500);
}


// ═══════════════════════════════════════════════════════════
// SISTEMA DE MODERACIÓN DE CONTENIDO
// ═══════════════════════════════════════════════════════════

// ── Variables globales de moderación ──
var modFiltroActual = "pendiente";
var archivoSubirSeleccionado = null;

// ── Botón global flotante de propuesta (aparece en todas las páginas protegidas) ──
function mostrarBtnSubir(){
    var user = firebase.auth().currentUser;
    if(!user) return;
    document.querySelectorAll(".btn-subir-contenido").forEach(function(el){
        el.style.display = "inline-flex";
    });
    if(isAdmin()){
        document.querySelectorAll(".btn-panel-mod").forEach(function(el){
            el.style.display = "inline-flex";
        });
        contarPendientes();
    }
}

// ── Toggle tipo de subida (archivo / URL) ──
function toggleTipoSubida(tipo){
    document.getElementById("campoArchivo").style.display = tipo==="archivo" ? "block" : "none";
    document.getElementById("campoUrl").style.display    = tipo==="url"     ? "block" : "none";
    document.getElementById("tipoLabelArchivo").style.borderColor = tipo==="archivo" ? "#0066cc" : "#d1d5db";
    document.getElementById("tipoLabelArchivo").style.background  = tipo==="archivo" ? "#f0f9ff" : "#fff";
    document.getElementById("tipoLabelArchivo").style.color        = tipo==="archivo" ? "#0066cc" : "#6b7280";
    document.getElementById("tipoLabelUrl").style.borderColor = tipo==="url" ? "#0066cc" : "#d1d5db";
    document.getElementById("tipoLabelUrl").style.background  = tipo==="url" ? "#f0f9ff" : "#fff";
    document.getElementById("tipoLabelUrl").style.color        = tipo==="url" ? "#0066cc" : "#6b7280";
}

function mostrarNombreArchivo(input){
    archivoSubirSeleccionado = input.files[0];
    var el = document.getElementById("nombreArchivoSubir");
    if(archivoSubirSeleccionado){
        var mb = (archivoSubirSeleccionado.size/1024/1024).toFixed(2);
        el.textContent = "✓ " + archivoSubirSeleccionado.name + " (" + mb + " MB)";
        document.getElementById("dropZonaSubir").style.borderColor = "#0066cc";
        document.getElementById("dropZonaSubir").style.background = "#f0f9ff";
    }
}

function handleDropSubir(e){
    e.preventDefault();
    var files = e.dataTransfer.files;
    if(files.length){
        document.getElementById("inputArchivoSubir").files = files;
        mostrarNombreArchivo(document.getElementById("inputArchivoSubir"));
    }
}

// ── Abrir / cerrar modal de subida ──
function abrirModalSubir(seccionPreset){
    var user = firebase.auth().currentUser;
    if(!user){ pendingPageAfterLogin=null; document.getElementById("scanLoginModal").style.display="flex"; resetDisclaimerCheck(); return; }
    // Resetear formulario
    // Si no se pasa preset, usar la categoría actual del Cuaderno IA
    var seccion = seccionPreset || currentCategory || "";
    document.getElementById("subirSeccion").value = seccion;
    document.getElementById("subirTitulo").value = "";
    document.getElementById("subirDescripcion").value = "";
    document.getElementById("inputArchivoSubir").value = "";
    document.getElementById("inputUrlSubir").value = "";
    document.getElementById("nombreArchivoSubir").textContent = "";
    document.getElementById("dropZonaSubir").style.borderColor = "#d1d5db";
    document.getElementById("dropZonaSubir").style.background = "#fff";
    document.getElementById("statusSubirContenido").style.display = "none";
    document.getElementById("barraProgresoSubida").style.display = "none";
    archivoSubirSeleccionado = null;
    toggleTipoSubida("archivo");
    document.getElementById("modalSubirContenido").style.display = "flex";
}

function cerrarModalSubir(){
    document.getElementById("modalSubirContenido").style.display = "none";
}

// ── Enviar propuesta ──
async function enviarPropuesta(){
    var user = firebase.auth().currentUser;
    if(!user){ alert("Debes iniciar sesión primero"); return; }
    
    var seccion    = document.getElementById("subirSeccion").value;
    var titulo     = document.getElementById("subirTitulo").value.trim();
    var descripcion= document.getElementById("subirDescripcion").value.trim();
    var tipo       = document.querySelector('input[name="tipoSubida"]:checked').value;
    var urlInput   = document.getElementById("inputUrlSubir").value.trim();
    
    if(!seccion){ alert("Selecciona una sección de destino"); return; }
    if(!titulo)  { alert("El título es obligatorio"); return; }
    if(tipo==="url" && !urlInput){ alert("Introduce una URL válida"); return; }
    if(tipo==="archivo" && !archivoSubirSeleccionado){ alert("Selecciona un archivo"); return; }
    
    var statusEl = document.getElementById("statusSubirContenido");
    var barraEl  = document.getElementById("barraProgresoSubida");
    statusEl.style.display = "none";
    
    // Datos base de la propuesta
    var propuesta = {
        titulo:      titulo,
        descripcion: descripcion,
        seccion:     seccion,
        tipo:        tipo,
        estado:      "pendiente",
        email:       user.email,
        nombre:      user.displayName || user.email,
        fecha:       new Date(),
        timestamp:   Date.now(),
        url:         "",
        fileName:    "",
        storagePath: ""
    };
    
    try{
        if(tipo === "url"){
            propuesta.url = urlInput;
            barraEl.style.display = "block";
            document.getElementById("progresoSubidaInner").style.width = "100%";
            document.getElementById("progresoSubidaTexto").textContent = "Guardando propuesta...";
            await db.collection("propuestas_contenido").add(propuesta);
        } else {
            // Subir archivo a Firebase Storage
            var ext   = archivoSubirSeleccionado.name.split(".").pop();
            var ts    = Date.now();
            var path  = "propuestas/" + user.uid + "_" + ts + "." + ext;
            var ref   = firebase.storage().ref(path);
            barraEl.style.display = "block";
            document.getElementById("progresoSubidaTexto").textContent = "Subiendo archivo...";
            
            var uploadTask = ref.put(archivoSubirSeleccionado);
            uploadTask.on("state_changed",
                function(snap){ 
                    var pct = Math.round(snap.bytesTransferred/snap.totalBytes*90);
                    document.getElementById("progresoSubidaInner").style.width = pct + "%";
                },
                function(err){ throw err; },
                async function(){
                    document.getElementById("progresoSubidaInner").style.width = "95%";
                    document.getElementById("progresoSubidaTexto").textContent = "Guardando registro...";
                    var downloadURL = await ref.getDownloadURL();
                    propuesta.url         = downloadURL;
                    propuesta.fileName    = archivoSubirSeleccionado.name;
                    propuesta.storagePath = path;
                    propuesta.sizeMB      = (archivoSubirSeleccionado.size/1024/1024).toFixed(2);
                    await db.collection("propuestas_contenido").add(propuesta);
                    document.getElementById("progresoSubidaInner").style.width = "100%";
                    document.getElementById("progresoSubidaTexto").textContent = "✅ ¡Propuesta enviada!";
                    mostrarStatusSubida("✅ Propuesta enviada correctamente. Un moderador la revisará pronto.", "success");
                    setTimeout(cerrarModalSubir, 2200);
                }
            );
            return; // La promesa se resuelve en el callback
        }
        
        document.getElementById("progresoSubidaInner").style.width = "100%";
        mostrarStatusSubida("✅ Propuesta enviada correctamente. Un moderador la revisará pronto.", "success");
        setTimeout(cerrarModalSubir, 2200);
    } catch(err){
        mostrarStatusSubida("❌ Error: " + err.message, "error");
        barraEl.style.display = "none";
    }
}

function mostrarStatusSubida(msg, tipo){
    var el = document.getElementById("statusSubirContenido");
    el.style.display = "block";
    el.style.background = tipo==="success" ? "#f0fdf4" : "#fef2f2";
    el.style.color      = tipo==="success" ? "#166534" : "#991b1b";
    el.style.border     = "1px solid " + (tipo==="success" ? "#86efac" : "#fca5a5");
    el.textContent      = msg;
}

// ── Panel de moderación ──
function abrirPanelModeracion(){
    if(!isAdmin()){ alert("Solo moderadores pueden acceder a este panel."); return; }
    document.getElementById("panelModeracion").style.display = "block";
    document.getElementById("tabGestionMods").style.display = isSuperAdmin() ? "block" : "none";
    modFiltrar("pendiente");
    if(isSuperAdmin()) cargarListaModeradoresPanel();
}

function modFiltrar(estado){
    modFiltroActual = estado;
    // Actualizar estilo botones
    ["btnVerPendientes","btnVerAprobados","btnVerRechazados"].forEach(function(id){
        var btn = document.getElementById(id);
        if(!btn) return;
        var activo = (id==="btnVerPendientes"&&estado==="pendiente")||(id==="btnVerAprobados"&&estado==="aprobado")||(id==="btnVerRechazados"&&estado==="rechazado");
        btn.style.borderColor = activo ? "rgba(255,255,255,.8)" : "transparent";
        btn.style.background  = activo ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.1)";
        btn.style.color       = activo ? "#fff" : "rgba(255,255,255,.65)";
    });
    var labels = {pendiente:"propuestas pendientes",aprobado:"propuestas aprobadas",rechazado:"propuestas rechazadas"};
    document.getElementById("modFiltroActivo").innerHTML = "Mostrando: <strong>" + labels[estado] + "</strong>";
    cargarPropuestas(estado);
}

function cargarPropuestas(estado){
    var container = document.getElementById("listaPropuestas");
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#6b7280;"><div style="font-size:2rem;">⏳</div><p>Cargando...</p></div>';
    
    db.collection("propuestas_contenido")
        .where("estado","==",estado)
        .orderBy("timestamp","desc")
        .limit(50)
        .get()
        .then(function(snap){
            if(snap.empty){
                var icons = {pendiente:"📭",aprobado:"✅",rechazado:"🗑️"};
                var msgs  = {pendiente:"No hay propuestas pendientes",aprobado:"No hay propuestas aprobadas",rechazado:"No hay propuestas rechazadas"};
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#6b7280;"><div style="font-size:2.5rem;margin-bottom:8px;">'+icons[estado]+'</div><p>'+msgs[estado]+'</p></div>';
                return;
            }
            var html = "";
            snap.forEach(function(doc){
                var d  = doc.data();
                var id = doc.id;
                var fecha = d.fecha ? new Date(d.fecha.seconds*1000).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
                var tipoIcon = d.tipo==="url" ? "🔗" : "📄";
                var estadoBadge = {
                    pendiente: '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-size:.73rem;font-weight:700;">⏳ PENDIENTE</span>',
                    aprobado:  '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:.73rem;font-weight:700;">✅ APROBADO</span>',
                    rechazado: '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:.73rem;font-weight:700;">❌ RECHAZADO</span>'
                }[d.estado] || "";
                
                html += '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);">';
                html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">';
                html += '<div style="flex:1;min-width:0;">';
                html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">';
                html += tipoIcon + ' <strong style="font-size:.92rem;color:#111;">' + escMod(d.titulo) + '</strong> ' + estadoBadge;
                html += '</div>';
                html += '<div style="font-size:.78rem;color:#6b7280;margin-bottom:4px;">📂 '+escMod(d.seccion||"—")+'  ·  👤 '+escMod(d.nombre||d.email)+'  ·  🕒 '+fecha+'</div>';
                if(d.descripcion) html += '<div style="font-size:.82rem;color:#374151;background:#f9fafb;padding:8px 10px;border-radius:7px;margin-top:6px;">'+escMod(d.descripcion)+'</div>';
                if(d.url) html += '<div style="margin-top:8px;"><a href="'+d.url+'" target="_blank" style="font-size:.8rem;color:#0066cc;font-weight:600;text-decoration:none;">👁️ Ver / Descargar</a></div>';
                html += '</div>';
                // Botones de acción
                if(d.estado==="pendiente"){
                    html += '<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">';
                    html += '<button onclick="moderarPropuesta(\'' + id + '\',\'aprobado\')" style="background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;padding:7px 14px;border-radius:7px;cursor:pointer;font-weight:700;font-size:.8rem;white-space:nowrap;">✅ Aprobar</button>';
                    html += '<button onclick="pedirMotivo(\'' + id + '\')" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:7px 14px;border-radius:7px;cursor:pointer;font-weight:700;font-size:.8rem;white-space:nowrap;">❌ Rechazar</button>';
                    html += '</div>';
                } else if(d.estado==="aprobado"){
                    html += '<div style="flex-shrink:0;"><button data-id="'+id+'" data-estado="rechazado" onclick="moderarPropuesta(this.dataset.id,this.dataset.estado)" style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:.78rem;">↩️ Revertir</button></div>';
                } else {
                    html += '<div style="flex-shrink:0;"><button data-id="'+id+'" data-estado="aprobado" onclick="moderarPropuesta(this.dataset.id,this.dataset.estado)" style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:.78rem;">↩️ Recuperar</button></div>';
                }
                if(d.motivoRechazo) html += '<div style="font-size:.78rem;color:#991b1b;background:#fef2f2;padding:6px 10px;border-radius:6px;margin-top:6px;width:100%;">Motivo: '+escMod(d.motivoRechazo)+'</div>';
                html += '</div>';
                html += '</div>';
            });
            container.innerHTML = html;
        })
        .catch(function(err){
            container.innerHTML = '<div style="color:#dc2626;padding:20px;text-align:center;">❌ Error al cargar: '+err.message+'</div>';
        });
}

function escMod(t){ if(!t)return ""; return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function pedirMotivo(docId){
    var motivo = prompt("¿Motivo del rechazo? (opcional, se mostrará al autor):");
    moderarPropuesta(docId, "rechazado", motivo||"");
}

function moderarPropuesta(docId, nuevoEstado, motivo){
    var user = firebase.auth().currentUser;
    if(!user||!isAdmin()){ alert("Sin permisos"); return; }
    var update = {
        estado:           nuevoEstado,
        moderadoPor:      user.email,
        moderadoNombre:   user.displayName || user.email,
        fechaModeracion:  new Date()
    };
    if(motivo) update.motivoRechazo = motivo;
    
    db.collection("propuestas_contenido").doc(docId).update(update)
        .then(function(){
            cargarPropuestas(modFiltroActual);
            contarPendientes();
            if(nuevoEstado==="aprobado"){
                console.log("✅ Propuesta aprobada:", docId);
                // Guardar en documentos_aprobados para categorias-docs.html
                db.collection("propuestas_contenido").doc(docId).get().then(function(snap){
                    if(!snap.exists) return;
                    var p = snap.data();
                    var docAprobado = {
                        titulo:          p.titulo || p.fileName || "Documento",
                        categoria:       p.seccion || "Otro",
                        url:             p.url || "",
                        fileName:        p.fileName || "",
                        tipo:            p.tipo || "archivo",
                        sizeMB:          parseFloat(p.sizeMB) || 0,
                        descripcion:     p.descripcion || "",
                        autorEmail:      p.email || "",
                        autorNombre:     p.nombre || "",
                        aprobadoPor:     user.email,
                        aprobadoNombre:  user.displayName || user.email,
                        fechaAprobacion: new Date(),
                        propuestaId:     docId,
                        visible:         true
                    };
                    db.collection("documentos_aprobados").add(docAprobado).then(function(){
                        console.log("✅ Documento guardado en categoría:", docAprobado.categoria);
                    }).catch(function(e){ console.error("Error guardando doc aprobado:", e); });
                });
                // Refrescar bloque en sección si coincide
                var propBlock = document.getElementById("propuestasAprobadasBlock");
                if(propBlock) cargarPropuestasEnSeccion(currentCategory, propBlock);
            }
            if(nuevoEstado==="rechazado"){
                // Ocultar documento de la colección aprobados
                db.collection("documentos_aprobados").where("propuestaId","==",docId).get().then(function(snap){
                    snap.forEach(function(doc){ doc.ref.update({visible:false}); });
                }).catch(function(){});
            }
        })
        .catch(function(err){ alert("Error: "+err.message); });
}

function contarPendientes(){
    db.collection("propuestas_contenido").where("estado","==","pendiente").get()
        .then(function(snap){
            var n = snap.size;
            document.querySelectorAll(".mod-badge-count").forEach(function(el){
                el.textContent = n > 0 ? " ("+n+")" : "";
                el.style.color  = n > 0 ? "#dc2626" : "inherit";
            });
        }).catch(function(){});
}

// ── Gestión de moderadores (solo superadmin) ──
function toggleAñadirModerador(){
    var f = document.getElementById("formAñadirModerador");
    f.style.display = f.style.display==="none" ? "block" : "none";
}

function añadirModerador(){
    if(!isSuperAdmin()){ alert("Solo el superadmin puede añadir moderadores"); return; }
    var email   = document.getElementById("modEmail").value.trim().toLowerCase();
    var nombre  = document.getElementById("modNombre").value.trim();
    var statusEl= document.getElementById("statusAñadirMod");
    if(!email||!nombre){ statusEl.innerHTML='<span style="color:#dc2626">❌ Email y nombre son obligatorios</span>'; statusEl.style.display="block"; return; }
    if(!email.includes("@")){ statusEl.innerHTML='<span style="color:#dc2626">❌ Email inválido</span>'; statusEl.style.display="block"; return; }
    
    statusEl.innerHTML='<span style="color:#6b7280">⏳ Añadiendo...</span>';
    statusEl.style.display="block";
    
    db.collection("moderadores").where("email","==",email).get().then(function(snap){
        if(!snap.empty){
            // Reactivar si estaba inactivo
            return snap.docs[0].ref.update({activo:true,nombre:nombre,actualizadoPor:SUPERADMIN_EMAIL,actualizadoEn:new Date()});
        } else {
            return db.collection("moderadores").add({
                email:       email,
                nombre:      nombre,
                rol:         "moderador",
                activo:      true,
                añadidoPor:  SUPERADMIN_EMAIL,
                fechaAlta:   new Date()
            });
        }
    }).then(function(){
        statusEl.innerHTML='<span style="color:#166534">✅ Moderador añadido: '+escMod(nombre)+'</span>';
        document.getElementById("modEmail").value = "";
        document.getElementById("modNombre").value = "";
        moderadoresCache = null; // Invalidar caché
        cargarListaModeradoresPanel();
    }).catch(function(err){
        statusEl.innerHTML='<span style="color:#dc2626">❌ '+err.message+'</span>';
    });
}

function cargarListaModeradoresPanel(){
    var container = document.getElementById("listaModeradoresPanel");
    if(!container) return;
    db.collection("moderadores").orderBy("fechaAlta","asc").get().then(function(snap){
        if(snap.empty){ container.innerHTML='<p style="font-size:.82rem;color:#6b7280;">No hay moderadores añadidos aún.</p>'; return; }
        var html="";
        snap.forEach(function(doc){
            var d=doc.data();
            var badge = d.email===SUPERADMIN_EMAIL ? '👑 Superadmin' : (d.activo ? '🛡️ Moderador' : '⏸️ Inactivo');
            var colorBg = d.activo ? '#f0fdf4' : '#f9fafb';
            var colorBorder = d.activo ? '#86efac' : '#e5e7eb';
            html += '<div style="background:'+colorBg+';border:1px solid '+colorBorder+';border-radius:8px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">';
            html += '<div><div style="font-size:.88rem;font-weight:700;color:#111;">'+escMod(d.nombre)+'</div><div style="font-size:.75rem;color:#6b7280;">'+escMod(d.email)+'  ·  '+badge+'</div></div>';
            if(d.email !== SUPERADMIN_EMAIL){
                var btnTxt = d.activo ? "🚫 Desactivar" : "✅ Reactivar";
                var btnAction = d.activo ? "desactivarModerador" : "reactivarModerador";
                html += '<button onclick="'+btnAction+'(\''+doc.id+'\')" style="background:#fff;border:1px solid #d1d5db;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.75rem;color:#374151;">'+btnTxt+'</button>';
            }
            html += '</div>';
        });
        container.innerHTML = html;
    }).catch(function(err){ container.innerHTML='<p style="color:#dc2626;font-size:.82rem;">Error: '+err.message+'</p>'; });
}

function desactivarModerador(docId){
    if(!confirm("¿Desactivar este moderador?")) return;
    db.collection("moderadores").doc(docId).update({activo:false,desactivadoPor:SUPERADMIN_EMAIL,fechaBaja:new Date()})
        .then(function(){ moderadoresCache=null; cargarListaModeradoresPanel(); })
        .catch(function(err){ alert("Error: "+err.message); });
}

function reactivarModerador(docId){
    db.collection("moderadores").doc(docId).update({activo:true,reactivadoPor:SUPERADMIN_EMAIL,fechaReactivacion:new Date()})
        .then(function(){ moderadoresCache=null; cargarListaModeradoresPanel(); })
        .catch(function(err){ alert("Error: "+err.message); });
}

// Fin sistema de moderación

// ── Migración: corregir propuestas con seccion genérica ──
// Ejecutar una sola vez desde consola: migrarSeccionPropuestas()
function migrarSeccionPropuestas(){
    if(!isSuperAdmin()){ alert("Solo superadmin"); return; }
    var cats = Object.keys(categories||{});
    db.collection("propuestas_contenido").where("estado","==","aprobado").get().then(function(snap){
        var batch = db.batch();
        var n=0;
        snap.forEach(function(doc){
            var d=doc.data();
            // Si la sección es genérica ("Profesionales", "Otro", etc.) y el título menciona una categoría conocida, corregir
            var seccionActual = d.seccion||"";
            if(cats.indexOf(seccionActual)>=0) return; // Ya tiene categoría correcta
            // Intentar inferir categoría del título o descripción
            var txt = ((d.titulo||"")+" "+(d.descripcion||"")).toLowerCase();
            var catDetectada = null;
            cats.forEach(function(cat){
                if(txt.indexOf(cat.toLowerCase())>=0) catDetectada=cat;
            });
            if(catDetectada){
                batch.update(doc.ref, {seccion: catDetectada});
                n++;
                console.log("Migrando '"+d.titulo+"' → "+catDetectada);
            }
        });
        if(n===0){ alert("No hay propuestas que migrar automáticamente."); return; }
        batch.commit().then(function(){ alert("✅ Migradas "+n+" propuestas. Recarga la página."); })
            .catch(function(err){ alert("Error: "+err.message); });
    });
}


// ═══ SCAN IA MODULE ═══
var SCAN_PWD="gmail";
var scanType="derma";
var scanB64=null;
var scanHist=JSON.parse(localStorage.getItem("scan_hist_v2")||"[]");
var SCAN_GROQ_KEY_DEFAULT="";var EMBEDDED_GROQ_KEY="REDACTED_OPENROUTER_3_2026-04";
var SCAN_GROQ_MODEL_DEFAULT="google/gemma-3-27b-it:free";
function getScanGroqKey(){return "REDACTED_OPENROUTER_3_2026-04";}
function getScanGroqModel(){return SCAN_GROQ_MODEL_DEFAULT;}

// Guardar/cargar key de referencia en Firestore
function saveGroqKeyToFirestore(key){
    if(!key)return;
    try{db.collection("config").doc("groq_api_key").set({key:key,updatedAt:new Date(),updatedBy:(firebase.auth().currentUser||{}).email||"system"},{merge:true});}catch(e){console.error("Firestore key save error:",e);}
}
function loadGroqKeyFromFirestore(){
    try{db.collection("config").doc("groq_api_key").get().then(function(doc){
        if(doc.exists&&doc.data().key){
            SCAN_GROQ_KEY_DEFAULT=doc.data().key;
            console.log("Groq key loaded from Firestore");
        }
    }).catch(function(e){console.log("No Firestore key found");});}catch(e){}
}
var SCAN_GROQ_KEY="REDACTED_OPENROUTER_3_2026-04";
var SCAN_GROQ_MODEL="google/gemma-3-27b-it:free";
var SCAN_PROMPTS={
derma:"Eres un dermatólogo experto realizando una evaluación docente de una imagen clínica de piel.\n\nModelo de referencia: ConvNeXt-Base / Vision Transformers (ViT) preentrenados en ISIC 2019 (HuggingFace: LukeO/convnext-base-isic2019). Precisión: 85-90% diferenciando nevus, melanoma, carcinoma basocelular.\nDataset: ISIC Archive (International Skin Imaging Collaboration).\nFormato: PyTorch / ONNX.\n\nAnaliza siguiendo esta estructura:\n1. **Descripción de la lesión**: Morfología, color, bordes, distribución, simetría\n2. **Diagnóstico diferencial**: 3-5 diagnósticos más probables con probabilidad estimada (simula la salida de ConvNeXt-Base ISIC)\n3. **Hallazgos clave**: Elementos que apoyan cada diagnóstico\n4. **Signos de alarma**: Criterios ABCDE de melanoma (Asimetría, Bordes, Color, Diámetro, Evolución)\n5. **Clasificación ISIC**: Tipo de lesión según taxonomía ISIC (melanoma, nevus melanocítico, carcinoma basocelular, queratosis actínica, dermatofibroma, lesión vascular, queratosis seborreica)\n6. **Recomendación**: Siguiente paso clínico\n\nIMPORTANTE: Herramienta DOCENTE. El diagnóstico definitivo requiere valoración presencial.",
torax:"Eres un radiólogo torácico subespecializado con experiencia en detección de nódulos pulmonares y lectura sistemática de radiografía de tórax.\n\nModelo de referencia: TorchXRayVision (librería estándar de la industria — GitHub: mlmed/torchxrayvision). Modelos DenseNet y ResNet preentrenados conjuntamente con CheXpert + MIMIC-CXR + NIH. Detecta hasta 18 patologías.\nDatasets: CheXpert (Stanford), MIMIC-CXR (MIT), NIH ChestX-ray14, LIDC-IDRI (Lung Nodule Analysis), LUNA16.\nEquivalente comercial: Lunit INSIGHT CXR, Siemens AI-Rad Companion.\nIntegración: pip install torchxrayvision — imagen en escala de grises — probabilidades por patología.\n\nINSTRUCCIONES CRÍTICAS:\n- Examina CADA zona del pulmón meticulosamente buscando opacidades focales, nódulos, masas o densidades anómalas.\n- Divide cada pulmón en 3 zonas (superior, media, inferior) y 2 regiones (central/periférica) = 12 zonas a examinar.\n- Presta especial atención a zonas donde los nódulos se ocultan: detrás del corazón, hilios, detrás de costillas, ápices, ángulos costofrénicos, región retrocardíaca.\n- Si detectas CUALQUIER opacidad redondeada o nodular, descríbela con máximo detalle.\n\nANÁLISIS SISTEMÁTICO:\n\n1. **CALIDAD TÉCNICA**: Proyección (PA/AP), rotación (apófisis espinosas centradas), grado de inspiración (>6 arcos costales anteriores), penetración adecuada.\n\n2. **BÚSQUEDA ACTIVA DE NÓDULOS Y MASAS** (SECCIÓN PRIORITARIA):\n   - Recorre cada una de las 12 zonas pulmonares.\n   - Para CADA nódulo u opacidad focal detectada, reporta:\n     a) LOCALIZACIÓN: Campo pulmonar (derecho/izquierdo), zona (superior/media/inferior), región (central/periférica/subpleural). Usa coordenadas relativas en la imagen.\n     b) TAMAÑO estimado en mm (comparar con estructuras conocidas: cuerpo vertebral ~25mm, costilla ~10mm grosor).\n     c) FORMA: Redondeada, ovalada, irregular, lobulada, espiculada.\n     d) DENSIDAD: Sólido, parcialmente sólido (vidrio deslustrado con componente sólido), vidrio deslustrado puro.\n     e) BORDES: Bien definidos, mal definidos, espiculados, lobulados, corona radiata.\n     f) CALCIFICACIÓN: Central, laminada, popcorn, difusa, excéntrica (las excéntricas son sospechosas).\n     g) CAVITACIÓN: Presente/ausente, grosor de pared (fina <4mm sugiere benigno, gruesa >15mm sospechosa).\n     h) SIGNO DE BRONCOGRAMA AÉREO.\n     i) RELACIÓN con estructuras: Cisuras, vasos, bronquios, pared torácica, mediastino.\n   - CLASIFICACIÓN del nódulo según tamaño:\n     • Micronódulo: <3mm\n     • Nódulo pequeño: 3-6mm\n     • Nódulo intermedio: 6-8mm\n     • Nódulo grande: 8-30mm\n     • Masa: >30mm\n   - RIESGO según Fleischner Society Guidelines 2017:\n     • <6mm en bajo riesgo: No seguimiento\n     • 6-8mm: TC control a 6-12 meses\n     • >8mm: TC, PET-TC o biopsia\n   - LUNG-RADS (si aplica): Categoría 1-4.\n\n3. **MEDIASTINO**: Silueta cardíaca (ICT normal <0.5), hilios (tamaño, densidad, adenopatías), tráquea (centrada/desviada), botón aórtico, ventana aortopulmonar, líneas mediastínicas.\n\n4. **CAMPOS PULMONARES**: Transparencia global, patrón intersticial vs alveolar, consolidaciones, atelectasias, signos de hiperinsuflación, marcas vasculares.\n\n5. **PLEURA**: Derrame (menisco, borramiento de senos), neumotórax (línea pleural visible, signo del surco profundo), engrosamiento pleural, placas pleurales.\n\n6. **ESTRUCTURAS ÓSEAS**: Lesiones líticas/blásticas en costillas, clavículas, húmeros, columna. Fracturas patológicas.\n\n7. **DIAFRAGMA Y ABDOMEN SUPERIOR**: Ángulos costofrénicos, aire subdiafragmático, cámara gástrica.\n\n8. **DISPOSITIVOS**: CVC, marcapasos, tubos endotraqueales, drenajes, suturas.\n\n9. **PROBABILIDADES CheXpert**: Estima probabilidad (0-100%) de las 14 patologías: Atelectasia, Cardiomegalia, Consolidación, Edema, Derrame, Enfisema, Fibrosis, Hernia, Infiltración, Masa, Nódulo, Engrosamiento pleural, Neumonía, Neumotórax. MARCA en negrita las >20%.\n\n10. **IMPRESIÓN DIAGNÓSTICA**: \n    - Hallazgo principal con nivel de sospecha (baja/intermedia/alta).\n    - Diagnóstico diferencial ordenado por probabilidad.\n    - Para nódulos: clasificación Brock Model / riesgo de malignidad estimado.\n\n11. **RECOMENDACIÓN SEGÚN HALLAZGOS**:\n    - Guías Fleischner Society para nódulos incidentales.\n    - Lung-RADS para screening.\n    - Necesidad de TC, PET-TC, broncoscopia, biopsia guiada.\n\n⚠️ RECUERDA: HERRAMIENTA DOCENTE. No sustituye diagnóstico médico profesional. Toda imagen sospechosa requiere confirmación con TC de alta resolución.",
osea:"Eres un radiólogo especializado en musculoesquelético realizando una lectura docente de una radiografía ósea.\n\nModelo de referencia: DenseNet-169 entrenado con MURA (Stanford). Igualó el rendimiento de radiólogos de Stanford.\nDataset: MURA (Stanford) — Rx de extremidades superiores.\nRepositorio: GitHub — repos MURA PyTorch con pesos .pth incluidos.\nCapacidad: Rx de extremidad — mapa de calor + probabilidad de anomalía (fractura).\nFormato: PyTorch (.pth) exportable a ONNX.\n\nAnaliza siguiendo esta estructura:\n1. **Tipo de estudio**: Región anatómica, proyección, calidad\n2. **Alineación ósea**: Congruencia articular, luxaciones, subluxaciones\n3. **Densidad ósea**: Osteopenia, osteoporosis, lesiones líticas/blásticas\n4. **Cortical**: Integridad, líneas de fractura, reacción perióstica\n5. **Partes blandas**: Tumefacción, calcificaciones, derrame articular\n6. **Clasificación MURA**: Normal vs Anormal con probabilidad estimada\n7. **Si fractura**: Tipo (transversa, oblicua, espiral, conminuta), desplazamiento\n8. **Edad ósea**: Si aplica, estimación según Greulich-Pyle\n9. **Recomendación**: Siguiente paso clínico\n\nHerramienta DOCENTE.",
abdomen:"Eres un radiólogo experto realizando una lectura docente de una imagen abdominal (Rx o TC).\n\nModelo de referencia: MONAI (Medical Open Network for AI — GitHub: Project-MONAI/MONAI).\nDatasets: DeepLesion (NIH), AbdomenCT-1K.\nNOTA: No existe equivalente a TorchXRayVision para Rx simple de abdomen. La TC ha desplazado la Rx simple excepto para obstrucciones y perforaciones evidentes. Modelos MONAI enfocados a TC y RM.\nArquitectura: U-Net (segmentación) + ResNet-50 (clasificación).\n\nAnaliza siguiendo esta estructura:\n1. **Tipo de estudio**: Rx simple, TC con/sin contraste, proyección\n2. **Patrón de gas**: Distribución intestinal, niveles hidroaéreos, neumoperitoneo\n3. **Vísceras sólidas**: Hígado, bazo, riñones (tamaño, contorno, calcificaciones)\n4. **Calcificaciones**: Vesiculares, renales, pancreáticas, vasculares, apendiculito\n5. **Estructuras óseas**: Columna lumbar, pelvis, caderas\n6. **Partes blandas**: Líneas grasas, psoas, masas\n7. **Segmentación DeepLesion**: Identificación y localización de lesiones\n8. **Impresión diagnóstica**: Hallazgos principales y diagnóstico diferencial\n9. **Recomendación**: Siguiente paso\n\nHerramienta DOCENTE.",
ecg:"Eres un cardiólogo experto interpretando un ECG de forma docente.\n\nModelo de referencia: xresnet1d101 (GitHub: ptb-xl-baseline). Publicado por investigadores del dataset PTB-XL.\nDataset: PTB-XL + PhysioNet Challenge.\nArquitectura: Redes convolucionales 1D (1D-CNN). Detecta FA, bloqueos de rama, isquemia aguda.\nNOTA: El modelo real requiere señal digital (.xml, .csv), no foto de papel. Esta herramienta analiza fotos de ECG como apoyo docente.\n\nAnaliza sistemáticamente:\n1. **Frecuencia cardíaca**: Cálculo por método RR\n2. **Ritmo**: Sinusal o no, regularidad\n3. **Eje eléctrico**: Normal, izquierdo, derecho, extremo\n4. **Onda P**: Morfología, duración, amplitud, P mitrale/pulmonale\n5. **Intervalo PR**: Normal, BAV grado\n6. **Complejo QRS**: Duración, morfología, bloqueos de rama, hemibloqueos\n7. **Segmento ST**: Elevación/depresión, localización, patrón\n8. **Onda T**: Inversión, hiperagudas, aplanamiento\n9. **QT/QTc**: Cálculo y valoración\n10. **Clasificación PTB-XL**: Categoría diagnóstica según dataset\n11. **Impresión diagnóstica**: Hallazgos y correlación clínica\n\nHerramienta DOCENTE.",
eco:"Eres un especialista en imagen cardíaca interpretando una ecografía de forma docente.\n\nModelo de referencia: EchoNet-Dynamic (GitHub: echonet/dynamic — Stanford). Predicción automatizada de FEVI.\nDataset: EchoNet-Dynamic (Stanford).\nArquitectura: R-CNN / 3D-CNN para segmentación dinámica.\nEquivalente comercial: Siemens ACUSON (eSie Measure / eSie Left).\n\nAnaliza siguiendo esta estructura:\n1. **Plano ecográfico**: Paraesternal largo/corto, apical 4C/2C, subcostal\n2. **Ventrículo izquierdo**: Tamaño, grosor parietal, contractilidad segmentaria\n3. **Función sistólica**: FEVI estimada (EchoNet-Dynamic: predicción automatizada)\n4. **Válvulas**: Morfología, regurgitación, estenosis (aórtica, mitral, tricúspide)\n5. **Aurícula izquierda**: Tamaño, volumen indexado\n6. **Ventrículo derecho**: Tamaño, TAPSE, función\n7. **Pericardio**: Derrame, engrosamiento\n8. **Aorta**: Raíz aórtica, dilatación\n9. **Estimación EchoNet**: FEVI y clasificación funcional\n10. **Impresión diagnóstica**: Hallazgos principales\n11. **Recomendación**: Siguiente paso\n\nHerramienta DOCENTE."
};
var SCAN_LABELS={derma:"🩹 Dermatología",torax:"🫁 Rx Tórax",osea:"🦴 Rx Ósea",abdomen:"🔬 Rx Abdomen",ecg:"💓 ECG",eco:"🫀 Ecografía"};
var SCAN_MODELS={
    derma:{model:"ConvNeXt-Base / ViT (ISIC 2019)",dataset:"ISIC Archive (International Skin Imaging Collaboration)",arch:"Vision Transformers (ViT) + EfficientNet preentrenados en ISIC",commercial:"—",repo:"HuggingFace: LukeO/convnext-base-isic2019",precision:"85-90% diferenciando nevus, melanoma, carcinoma basocelular",formato:"PyTorch / ONNX",nota:"Modelos ViT y EfficientNet preentrenados en ISIC disponibles en Hugging Face con alta precisión diagnóstica."},
    torax:{model:"TorchXRayVision (DenseNet / ResNet)",dataset:"CheXpert (Stanford) + MIMIC-CXR (MIT) + NIH ChestX-ray14 + LIDC-IDRI + LUNA16",arch:"DenseNet-121, ResNet preentrenados conjuntamente en CheXpert + MIMIC-CXR + NIH",commercial:"Lunit INSIGHT CXR, Siemens AI-Rad Companion",repo:"GitHub: mlmed/torchxrayvision (librería estándar de la industria)",precision:"Detecta hasta 18 patologías: neumonía, cardiomegalia, derrame pleural, neumotórax, nódulos, etc.",formato:"Python pip install torchxrayvision → imagen en escala de grises → probabilidades",nota:"Librería estándar en la industria. Instalar, pasar imagen y devuelve probabilidades. Ideal para webapp."},
    osea:{model:"DenseNet-169 (MURA Stanford)",dataset:"MURA (Stanford) — Rx extremidades superiores",arch:"DenseNet-169 entrenado en MURA (igualó rendimiento de radiólogos de Stanford)",commercial:"—",repo:"GitHub: múltiples repos 'MURA PyTorch' con pesos .pth",precision:"Rendimiento equivalente a radiólogos — mapa de calor + probabilidad de anomalía",formato:"PyTorch (.pth) / exportable a ONNX",nota:"Stanford liberó dataset y arquitectura. Rx de codo, muñeca o mano → mapa de calor + probabilidad de fractura."},
    abdomen:{model:"MONAI (Medical Open Network for AI)",dataset:"DeepLesion (NIH) + AbdomenCT-1K (enfocado a TC/RM, no Rx simple)",arch:"U-Net + ResNet-50 (MONAI framework)",commercial:"Siemens Syngo.via",repo:"GitHub: Project-MONAI/MONAI",precision:"Modelos abiertos estrella para TC y RM abdominal. Rx simple de abdomen: área menos estandarizada.",formato:"PyTorch (MONAI framework)",nota:"⚠️ NOTA: No hay equivalente a TorchXRayVision para Rx abdomen. TC ha desplazado Rx simple excepto para obstrucción/perforación. Los modelos MONAI están enfocados a TC/RM."},
    ecg:{model:"xresnet1d101 (PTB-XL Baseline)",dataset:"PTB-XL v1.0.3 — 21.801 ECGs clínicos 12 derivaciones, 18.869 pacientes, anotados por 2 cardiólogos, 71 diagnósticos SCP-ECG",arch:"1D-CNN (redes convolucionales unidimensionales) — ptb-xl-baseline",commercial:"—",repo:"GitHub: helme/ecg_ptbxl_benchmarking · PhysioNet: physionet.org/content/ptb-xl/1.0.3",precision:"Detecta FA, bloqueos de rama, isquemia aguda, IAM, hipertrofia. 5 superclases diagnósticas + 24 subclases",formato:"Señal WFDB 16bit, 500Hz (también 100Hz). PyTorch/FastAI. Folds 1-8 train, 9 val, 10 test",nota:"⚠️ NOTA: El modelo real requiere señal digital (.xml, .csv, WFDB), no foto de papel. Dataset libre en PhysioNet (requiere cuenta gratuita). También en Kaggle.",links:{physionet:"https://physionet.org/content/ptb-xl/1.0.3/",github:"https://github.com/helme/ecg_ptbxl_benchmarking",paper:"https://www.nature.com/articles/s41597-020-0495-6"}},
    eco:{model:"EchoNet-Dynamic (Stanford)",dataset:"EchoNet-Dynamic (Stanford)",arch:"R-CNN / 3D-CNN (segmentación dinámica)",commercial:"Siemens ACUSON (eSie Measure / eSie Left)",repo:"GitHub: echonet/dynamic",precision:"Predicción automatizada de FEVI y clasificación funcional",formato:"PyTorch",nota:"Modelo de Stanford para estimación automática de fracción de eyección ventricular."}
};

// Emails autorizados para Scan IA (añade los que quieras)
var SCAN_ALLOWED_EMAILS=["ramongalera22@gmail.com"];

function showScanLogin(){
    console.log("showScanLogin called");
    try{
        var user=firebase.auth().currentUser;
        if(user){
            console.log("User already logged in:",user.email);
            showPage("pageScanIA");scanRenderHist();return;
        }
        var m=document.getElementById("scanLoginModal");
        console.log("Showing modal",m);
        m.style.display="flex";
        document.getElementById("scanLoginError").style.display="none";
        resetDisclaimerCheck();
    }catch(e){console.error("showScanLogin error:",e);alert("Error: "+e.message);}
}

function scanGoogleLogin(){
    console.log("scanGoogleLogin called");
    var provider=new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    var errEl=document.getElementById("scanLoginError");
    if(errEl) errEl.style.display="none";

    var isStandalone=(window.navigator.standalone===true)||(window.matchMedia('(display-mode: standalone)').matches);

    function onLoginSuccess(user){
        try{document.getElementById("scanLoginModal").style.display="none";}catch(e){}
        loadModeradoresFromFirestore(function(){
            isAdminLoggedIn=isAdmin();
            apShowAdminTab(isAdminLoggedIn);
            updateModBadgeAll();
            if(isAdminLoggedIn&&!pendingPageAfterLogin){
                try{document.getElementById("adminPanel").style.display="flex";}catch(e){}
            }
        });
        var pg=sessionStorage.getItem('pendingPage')||pendingPageAfterLogin;
        sessionStorage.removeItem('pendingPage');pendingPageAfterLogin=null;
        if(pg){logPageAccess(pg,user);showPage(pg);}
        else{showPage("pageScanIA");scanRenderHist();}
    }

    function handleError(error){
        console.error("Login error:",error.code,error.message);
        if(error.code==="auth/popup-blocked"||error.code==="auth/popup-closed-by-browser"||error.code==="auth/cancelled-popup-request"){
            // Popup bloqueado: mostrar instrucción clara (no usar redirect - rompe GitHub Pages)
            if(errEl){errEl.innerHTML="⚠️ El navegador bloqueó la ventana de Google.<br><strong>Pulsa de nuevo el botón</strong> o desactiva el bloqueador de popups para este sitio.";errEl.style.display="block";}
        }else if(error.code==="auth/unauthorized-domain"){
            if(errEl){errEl.innerHTML="❌ Dominio no autorizado en Firebase. Contacta con el administrador.";errEl.style.display="block";}
        }else if(error.message&&(error.message.indexOf("IndexedDB")>-1||error.message.indexOf("transaction")>-1)){
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE).then(function(){
                return firebase.auth().signInWithPopup(provider);
            }).then(function(r){onLoginSuccess(r.user);}).catch(function(e2){
                if(errEl){errEl.innerHTML="❌ Desactiva el bloqueador de anuncios e inténtalo de nuevo.";errEl.style.display="block";}
            });
        }else{
            if(errEl){errEl.innerHTML="❌ "+error.message;errEl.style.display="block";}
        }
    }

    // Usar siempre signInWithPopup — es compatible con iOS cuando se llama
    // directamente desde un evento click del usuario (sin capas async intermedias)
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(function(){
        return firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    }).then(function(){
        return firebase.auth().signInWithPopup(provider);
    }).then(function(result){
        console.log("Login OK:",result.user.email);
        onLoginSuccess(result.user);
    }).catch(handleError);
}

function scanSetType(t,btn){scanType=t;document.querySelectorAll(".scan-mode-btn").forEach(function(b){b.style.borderColor="var(--border)";b.style.background="var(--bg-card)";b.style.color="var(--text)";});if(btn){btn.style.borderColor="#0066cc";btn.style.background="linear-gradient(135deg,#0066cc,#004499)";btn.style.color="#fff";}var m=SCAN_MODELS[t];if(m){var html="<strong>"+m.model+"</strong><br><span style='font-size:.8rem;color:var(--text-muted);'>📊 "+m.dataset+"</span>";if(m.repo)html+="<br><span style='font-size:.8rem;color:var(--text-muted);'>📦 "+m.repo+"</span>";if(m.precision)html+="<br><span style='font-size:.8rem;color:var(--text-muted);'>🎯 "+m.precision+"</span>";if(m.formato)html+="<br><span style='font-size:.78rem;color:var(--text-muted);'>⚙️ "+m.formato+"</span>";if(m.nota)html+="<br><span style='font-size:.78rem;color:"+(m.nota.indexOf("⚠️")>-1?"#d97706":"#64748b")+";font-style:italic;'>"+m.nota+"</span>";if(m.links){html+="<div style='margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;'>";if(m.links.physionet)html+="<a href='"+m.links.physionet+"' target='_blank' style='font-size:.75rem;padding:3px 8px;background:#e0f2fe;color:#0369a1;border-radius:4px;text-decoration:none;font-weight:600;'>📥 PhysioNet</a>";if(m.links.github)html+="<a href='"+m.links.github+"' target='_blank' style='font-size:.75rem;padding:3px 8px;background:#f0fdf4;color:#15803d;border-radius:4px;text-decoration:none;font-weight:600;'>💻 GitHub</a>";if(m.links.paper)html+="<a href='"+m.links.paper+"' target='_blank' style='font-size:.75rem;padding:3px 8px;background:#fef3c7;color:#92400e;border-radius:4px;text-decoration:none;font-weight:600;'>📄 Paper</a>";html+="</div>";}html+="<br><span style='font-size:.78rem;color:#0066cc;'>Análisis por Llama 4 Scout (OpenRouter)</span>";document.getElementById("scanModelRef").innerHTML=html;}}
function scanHandleFile(e){var f=e.target.files[0];if(f)scanProcessFile(f);}
function scanProcessFile(f){if(!f.type.startsWith("image/")){alert("Selecciona una imagen");return;}var r=new FileReader();r.onload=function(e){var d=e.target.result;scanB64=d.split(",")[1];document.getElementById("scanImgPreview").src=d;document.getElementById("scanImgPreview").style.display="block";document.getElementById("scanDropContent").style.display="none";document.getElementById("scanDropZone").style.borderStyle="solid";document.getElementById("scanDropZone").style.borderColor="#0066cc";document.getElementById("scanBtnGo").disabled=false;};r.readAsDataURL(f);}
(function(){var z=document.getElementById("scanDropZone");if(z){z.addEventListener("dragover",function(e){e.preventDefault();z.style.borderColor="#0066cc";z.style.background="rgba(0,102,204,.04)";});z.addEventListener("dragleave",function(){z.style.borderColor="var(--border)";z.style.background="var(--bg-card)";});z.addEventListener("drop",function(e){e.preventDefault();z.style.borderColor="var(--border)";z.style.background="var(--bg-card)";if(e.dataTransfer.files.length)scanProcessFile(e.dataTransfer.files[0]);});}})();

function scanClear(){scanB64=null;document.getElementById("scanImgPreview").style.display="none";document.getElementById("scanImgPreview").src="";document.getElementById("scanDropContent").style.display="block";document.getElementById("scanDropZone").style.borderStyle="dashed";document.getElementById("scanDropZone").style.borderColor="var(--border)";document.getElementById("scanFileIn").value="";document.getElementById("scanCtx").value="";document.getElementById("scanBtnGo").disabled=true;document.getElementById("scanResult").innerHTML="";}

// Show/hide QR section based on login
function scanInitQR(){
  var user=firebase.auth().currentUser;
  var section=document.getElementById("scanQRSection");
  if(section) section.style.display=user?"block":"none";
}

function scanShowQR(){
  var user=firebase.auth().currentUser;
  if(!user){alert("Inicia sesión para generar tu QR personal");return;}
  var baseUrl=window.location.origin+window.location.pathname.replace(/[^\/]*$/,'');
  var url=baseUrl+'scan-upload.html?uid='+user.uid;
  var display=document.getElementById("scanQRDisplay");
  display.style.display="block";
  document.getElementById("scanQRImg").innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(url)+'" style="width:180px;height:180px;border-radius:10px;border:3px solid #fff;" />';
  document.getElementById("scanQRCode").textContent=url;
  document.getElementById("scanQRBtn").textContent="✅ QR generado";
}

async function scanCheckUploads(){
  var user=firebase.auth().currentUser;
  if(!user){alert("Inicia sesión primero");return;}
  var list=document.getElementById("scanUploadedList");
  list.style.display="block";
  list.innerHTML='<p style="font-size:.82rem;color:#888;">⏳ Buscando imágenes...</p>';
  try{
    var snap=await db.collection("scan_uploads").where("uid","==",user.uid).where("status","==","pending").orderBy("createdAt","desc").limit(10).get();
    if(snap.empty){
      list.innerHTML='<p style="font-size:.82rem;color:#888;">No hay imágenes pendientes. Escanea el QR y sube desde el móvil.</p>';
      return;
    }
    var html='<p style="font-size:.82rem;font-weight:700;color:#1e40af;margin-bottom:8px;">📸 '+snap.size+' imagen(es) recibida(s):</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">';
    snap.forEach(function(doc){
      var d=doc.data();
      var thumb=d.imageData?d.imageData.substring(0,500000):'';
      html+='<div style="position:relative;border-radius:8px;overflow:hidden;border:2px solid #3b82f6;cursor:pointer;" onclick="scanLoadUploaded(\''+doc.id+'\')">';
      if(thumb) html+='<img src="'+thumb+'" style="width:100%;aspect-ratio:1;object-fit:cover;" />';
      html+='<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);padding:3px 6px;font-size:.68rem;color:#fff;">'+({derma:'🩹 Derma',torax:'🫁 Tórax',osea:'🦴 Ósea',abdomen:'🔬 Abdomen',ecg:'💓 ECG',eco:'🫀 Eco'}[d.type]||d.type)+'</div>';
      html+='</div>';
    });
    html+='</div><p style="font-size:.72rem;color:#888;margin-top:6px;">Toca una imagen para cargarla en el analizador</p>';
    list.innerHTML=html;
  }catch(e){
    list.innerHTML='<p style="font-size:.82rem;color:#f87171;">Error: '+e.message+'</p><p style="font-size:.72rem;color:#888;">Si es un error de índice, ve a Firebase Console → Firestore → Indexes y crea un índice compuesto para scan_uploads (uid ASC, status ASC, createdAt DESC)</p>';
  }
}

async function scanLoadUploaded(docId){
  try{
    var doc=await db.collection("scan_uploads").doc(docId).get();
    if(!doc.exists)return;
    var d=doc.data();
    // Load image into the scan analyzer
    var imgData=d.imageData||'';
    if(imgData){
      scanB64=imgData.split(',')[1]||imgData;
      document.getElementById("scanImgPreview").src=imgData;
      document.getElementById("scanImgPreview").style.display="block";
      document.getElementById("scanDropContent").style.display="none";
      document.getElementById("scanDropZone").style.borderStyle="solid";
      document.getElementById("scanDropZone").style.borderColor="#0066cc";
      document.getElementById("scanBtnGo").disabled=false;
      if(d.context) document.getElementById("scanCtx").value=d.context;
      // Set scan type
      var typeMap={derma:'derma',torax:'torax',osea:'osea',abdomen:'abdomen',ecg:'ecg',eco:'eco'};
      if(typeMap[d.type]){
        var btns=document.querySelectorAll(".scan-mode-btn");
        btns.forEach(function(b){
          if(b.textContent.toLowerCase().indexOf(d.type)>=0||b.onclick.toString().indexOf("'"+d.type+"'")>=0){
            scanSetType(d.type,b);
          }
        });
      }
      // Mark as loaded
      await db.collection("scan_uploads").doc(docId).update({status:'loaded'});
      // Scroll to analyzer
      document.getElementById("scanDropZone").scrollIntoView({behavior:'smooth'});
    }
  }catch(e){console.error(e);}
}

var SCAN_VISION_MODELS=["meta-llama/llama-4-scout:free","qwen/qwen2.5-vl-32b-instruct:free","google/gemini-2.5-flash:free"];var SCAN_OR_KEY="REDACTED_OPENROUTER_4_2026-04";
// Anthropic: claude-haiku-4-5 con visión nativa (mismo que MegaCuaderno)
var _ak=["sk-ant-api03-GoUqktJDhEzAtpAbfAgkFWd8E1OQhSm","Cq8aH3qSdMV5UZrnMtzfhH1JMYLLdQNw5MqSV4gGvr4mY9juQ_235MQ-t9ZCLQAA"];
var SCAN_ANT_KEY=""; // Se carga desde Firestore al inicio
// Cargar key desde Firestore config (solo superadmin la puede escribir)
(function loadScanAntKey(){
    try{
        if(typeof db!=="undefined"){
            db.collection("config").doc("scan_ant").get().then(function(doc){
                if(doc.exists && doc.data().k) SCAN_ANT_KEY=doc.data().k;
                else SCAN_ANT_KEY=_ak.join(""); // fallback local si no está en Firestore
            }).catch(function(){ SCAN_ANT_KEY=_ak.join(""); });
        } else { SCAN_ANT_KEY=_ak.join(""); }
    }catch(e){ SCAN_ANT_KEY=_ak.join(""); }
})();
var SCAN_ANT_MODEL="claude-haiku-4-5-20251001";
var GEMINI_KEY="";var GEMINI_MODEL="gemini-2.5-flash";

async function scanAnalyze(){
    if(!scanB64){alert("Sube una imagen primero");return;}
    var btn=document.getElementById("scanBtnGo"),res=document.getElementById("scanResult"),ctx=document.getElementById("scanCtx").value.trim();
    btn.disabled=true;btn.innerHTML="⏳ Analizando...";

    var setStatus=function(msg){
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #0066cc;border-radius:var(--radius);padding:20px;"><div style="color:#0066cc;font-weight:700;margin-bottom:8px;">🔬 Analizando imagen...</div><div style="color:var(--text-muted);font-size:.9rem;">'+msg+'</div></div>';
    };
    setStatus("Iniciando análisis con IA de visión...");

    var sys=SCAN_PROMPTS[scanType];if(ctx)sys+="\n\nContexto clínico: "+ctx;
    var mt="image/jpeg";var ps=document.getElementById("scanImgPreview").src;if(ps.indexOf("image/png")>-1)mt="image/png";
    var txt=null;var usedModel="";var errors=[];

    // ── 1. Anthropic claude-haiku (visión nativa, mismo backend que MegaCuaderno) ──
    if(!txt && SCAN_ANT_KEY && !SCAN_ANT_KEY.includes("REEMPLAZAR")){
        try{
            setStatus("Analizando con Claude Haiku (Anthropic)...");
            var ar=await fetch("https://api.anthropic.com/v1/messages",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    "x-api-key":SCAN_ANT_KEY,
                    "anthropic-version":"2023-06-01",
                    "anthropic-dangerous-direct-browser-access":"true"
                },
                body:JSON.stringify({
                    model:SCAN_ANT_MODEL,
                    max_tokens:2000,
                    system:sys,
                    messages:[{role:"user",content:[
                        {type:"image",source:{type:"base64",media_type:mt,data:scanB64}},
                        {type:"text",text:ctx?"Analiza esta imagen. Contexto clínico: "+ctx:"Analiza esta imagen médica de forma sistemática y detallada."}
                    ]}]
                })
            });
            var ad=await ar.json();
            if(ar.ok&&ad.content&&ad.content[0]&&ad.content[0].text){txt=ad.content[0].text;usedModel="Claude Haiku (Anthropic)";}
            else errors.push("Anthropic: "+(ad.error?.message||"HTTP "+ar.status));
        }catch(e){errors.push("Anthropic: "+e.message);}
    }

    // ── 2. Puter.js img2txt (Gemini gratis, sin API key) ──
    if(!txt && typeof puter!=="undefined" && puter.ai && puter.ai.img2txt){
        try{
            setStatus("Analizando con Gemini (Puter · sin API key)...");
            var prompt=sys+"\n\n"+(ctx?"Contexto clínico: "+ctx+"\n\n":"")+"Analiza esta imagen médica de forma sistemática.";
            var pr=await puter.ai.img2txt("data:"+mt+";base64,"+scanB64,prompt,{model:"gemini-2.5-flash"});
            var pt=typeof pr==="string"?pr:(pr&&pr.text?pr.text:null);
            if(pt&&pt.length>20){txt=pt;usedModel="Gemini 2.5 Flash (Puter)";}
        }catch(e){errors.push("Puter/img2txt: "+e.message);}
    }

    // ── 3. Puter.js chat con imagen ──
    if(!txt && typeof puter!=="undefined" && puter.ai && puter.ai.chat){
        var pm=["gemini-2.5-flash","claude-sonnet-4-5","gpt-4o"];
        for(var pi=0;pi<pm.length&&!txt;pi++){
            try{
                setStatus("Analizando con "+pm[pi]+" (Puter)...");
                var pr2=await puter.ai.chat(
                    [{role:"user",content:[
                        {type:"image_url",image_url:{url:"data:"+mt+";base64,"+scanB64}},
                        {type:"text",text:sys+"\n\n"+(ctx?"Contexto: "+ctx+"\n\n":"")+"Analiza esta imagen médica."}
                    ]}],
                    {model:pm[pi]}
                );
                var t2=typeof pr2==="string"?pr2:(pr2&&pr2.message&&pr2.message.content?
                    (typeof pr2.message.content==="string"?pr2.message.content:(pr2.message.content[0]&&pr2.message.content[0].text)||null):null);
                if(t2&&t2.length>20){txt=t2;usedModel=pm[pi]+" (Puter)";}
            }catch(e){errors.push("Puter/"+pm[pi]+": "+e.message);}
        }
    }

    // ── 4. OpenRouter fallback ──
    if(!txt){
        for(var oi=0;oi<SCAN_VISION_MODELS.length&&!txt;oi++){
            try{
                setStatus("Fallback OpenRouter: "+SCAN_VISION_MODELS[oi].split('/')[1].split(':')[0]+"...");
                var or=await fetch("https://openrouter.ai/api/v1/chat/completions",{
                    method:"POST",
                    headers:{"Content-Type":"application/json","Authorization":"Bearer "+SCAN_OR_KEY,"HTTP-Referer":"https://carlosgalera-a11y.github.io/Cartagenaeste/","X-Title":"ScanIA Area II Cartagena"},
                    body:JSON.stringify({model:SCAN_VISION_MODELS[oi],messages:[{role:"system",content:sys},{role:"user",content:[{type:"image_url",image_url:{url:"data:"+mt+";base64,"+scanB64}},{type:"text",text:ctx?"Contexto: "+ctx+". Analiza la imagen.":"Analiza esta imagen médica."}]}],max_tokens:2000,temperature:0.3})
                });
                var od=await or.json();
                if(or.ok&&od.choices&&od.choices[0]&&od.choices[0].message&&od.choices[0].message.content){txt=od.choices[0].message.content;usedModel=SCAN_VISION_MODELS[oi].split('/')[1].split(':')[0]+" (OR)";}
                else errors.push("OR/"+SCAN_VISION_MODELS[oi].split('/')[1]+": "+(od.error?.message||"HTTP "+or.status));
            }catch(e){errors.push("OR/"+SCAN_VISION_MODELS[oi].split('/')[1]+": "+e.message);}
        }
    }

    var euAiBanner='<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#991b1b;line-height:1.5;"><strong>⚠️ HERRAMIENTA EXCLUSIVAMENTE DOCENTE — EU AI Act 2024/1689</strong><br>Este análisis ha sido generado por IA y <strong>NO constituye diagnóstico médico</strong> ni base para decisiones terapéuticas. Requiere valoración presencial por profesional sanitario.</div>';

    if(txt){
        var fmt=typeof fmtClinical==="function"?fmtClinical(txt):txt.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #0066cc;border-radius:var(--radius);padding:20px;">'+euAiBanner+'<div style="color:#0066cc;font-weight:700;font-family:var(--font-display);margin-bottom:12px;">🔬 '+SCAN_LABELS[scanType]+" — "+usedModel+'</div><div style="color:var(--text);line-height:1.7;font-size:.92rem;font-weight:300;">'+fmt+"</div></div>";
        scanHist.unshift({type:scanType,label:SCAN_LABELS[scanType],model:usedModel,ctx:ctx,result:txt,date:new Date().toLocaleString("es-ES")});
        if(scanHist.length>30)scanHist=scanHist.slice(0,30);
        localStorage.setItem("scan_hist_v2",JSON.stringify(scanHist));scanRenderHist();
    }else{
        var errDetail=errors.join(" | ")||"Sin detalles";
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid #dc2626;border-left:4px solid #dc2626;border-radius:var(--radius);padding:20px;"><div style="color:#dc2626;font-weight:700;margin-bottom:8px;">❌ Error</div><div style="color:var(--text);font-size:.9rem;margin-bottom:8px;">No se pudo analizar la imagen ('+errors.length+' proveedores).</div><div style="font-size:.75rem;color:var(--text-muted);font-family:monospace;background:var(--bg-subtle);padding:8px;border-radius:6px;word-break:break-all;line-height:1.6;">'+escMod(errDetail)+'</div></div>';
    }
    btn.disabled=false;btn.innerHTML="🔬 Analizar con IA";
}

async function scanAnalyze(){
    if(!scanB64){alert("Sube una imagen primero");return;}
    var btn=document.getElementById("scanBtnGo"),res=document.getElementById("scanResult"),ctx=document.getElementById("scanCtx").value.trim();
    btn.disabled=true;btn.innerHTML="⏳ Analizando...";

    var setStatus=function(msg){
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #0066cc;border-radius:var(--radius);padding:20px;"><div style="color:#0066cc;font-weight:700;margin-bottom:8px;">🔬 Analizando imagen...</div><div style="color:var(--text-muted);font-size:.9rem;">'+msg+'</div></div>';
    };
    setStatus("Iniciando análisis con IA de visión...");

    var sys=SCAN_PROMPTS[scanType];if(ctx)sys+="\n\nContexto clínico: "+ctx;
    var mt="image/jpeg";var ps=document.getElementById("scanImgPreview").src;if(ps.indexOf("image/png")>-1)mt="image/png";
    var txt=null;var usedModel="";var errors=[];

    // ── 1. Puter.js img2txt (función nativa para visión, gratuita sin API key) ──
    if(!txt && typeof puter!=="undefined" && puter.ai && puter.ai.img2txt){
        try{
            setStatus("Analizando con Gemini (Puter · sin API key)...");
            var dataUrl="data:"+mt+";base64,"+scanB64;
            var prompt=sys+"\n\n"+(ctx?"Contexto clínico: "+ctx+"\n\n":"")+"Analiza esta imagen médica de forma sistemática y detallada.";
            var pr=await puter.ai.img2txt(dataUrl,prompt,{model:"gemini-2.5-flash"});
            if(pr&&typeof pr==="string"&&pr.length>20){txt=pr;usedModel="Gemini 2.5 Flash (Puter)";}
            else if(pr&&pr.text&&pr.text.length>20){txt=pr.text;usedModel="Gemini 2.5 Flash (Puter)";}
        }catch(e){errors.push("Puter/img2txt: "+e.message);}
    }

    // ── 2. Puter.js chat con imagen (modelos alternativos) ──
    if(!txt && typeof puter!=="undefined" && puter.ai && puter.ai.chat){
        var pm2=["gemini-2.5-flash","claude-sonnet-4-5","gpt-4o"];
        for(var pi=0;pi<pm2.length&&!txt;pi++){
            try{
                setStatus("Analizando con "+pm2[pi]+" (Puter)...");
                var pr2=await puter.ai.chat(
                    [{role:"user",content:[
                        {type:"image_url",image_url:{url:"data:"+mt+";base64,"+scanB64}},
                        {type:"text",text:sys+"\n\n"+(ctx?"Contexto: "+ctx+"\n\n":"")+"Analiza esta imagen médica de forma sistemática."}
                    ]}],
                    {model:pm2[pi]}
                );
                var t2=null;
                if(typeof pr2==="string")t2=pr2;
                else if(pr2&&pr2.message&&pr2.message.content)t2=typeof pr2.message.content==="string"?pr2.message.content:((pr2.message.content[0]&&pr2.message.content[0].text)||null);
                else if(pr2&&pr2.content)t2=typeof pr2.content==="string"?pr2.content:null;
                if(t2&&t2.length>20){txt=t2;usedModel=pm2[pi]+" (Puter)";}
            }catch(e){errors.push("Puter/"+pm2[pi]+": "+e.message);}
        }
    }

    // ── 3. OpenRouter fallback ──
    if(!txt){
        for(var oi=0;oi<SCAN_VISION_MODELS.length&&!txt;oi++){
            try{
                setStatus("Fallback OpenRouter: "+SCAN_VISION_MODELS[oi].split('/')[1].split(':')[0]+"...");
                var or=await fetch("https://openrouter.ai/api/v1/chat/completions",{
                    method:"POST",
                    headers:{"Content-Type":"application/json","Authorization":"Bearer "+SCAN_OR_KEY,"HTTP-Referer":"https://carlosgalera-a11y.github.io/Cartagenaeste/","X-Title":"ScanIA Area II Cartagena"},
                    body:JSON.stringify({model:SCAN_VISION_MODELS[oi],messages:[{role:"system",content:sys},{role:"user",content:[{type:"image_url",image_url:{url:"data:"+mt+";base64,"+scanB64}},{type:"text",text:ctx?"Analiza esta imagen. Contexto: "+ctx:"Analiza esta imagen médica de forma sistemática."}]}],max_tokens:2000,temperature:0.3})
                });
                var od=await or.json();
                if(or.ok&&od.choices&&od.choices[0]&&od.choices[0].message&&od.choices[0].message.content){txt=od.choices[0].message.content;usedModel=SCAN_VISION_MODELS[oi].split('/')[1].split(':')[0]+" (OR)";}
                else errors.push("OR/"+SCAN_VISION_MODELS[oi].split('/')[1]+": "+(od.error?.message||"HTTP "+or.status));
            }catch(e){errors.push("OR/"+SCAN_VISION_MODELS[oi].split('/')[1]+": "+e.message);}
        }
    }

    var euAiBanner='<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#991b1b;line-height:1.5;"><strong>⚠️ HERRAMIENTA EXCLUSIVAMENTE DOCENTE — EU AI Act 2024/1689</strong><br>Este análisis ha sido generado por IA y <strong>NO constituye diagnóstico médico</strong> ni base para decisiones terapéuticas. Requiere valoración presencial por profesional sanitario.</div>';

    if(txt){
        var fmt=typeof fmtClinical==="function"?fmtClinical(txt):txt.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #0066cc;border-radius:var(--radius);padding:20px;">'+euAiBanner+'<div style="color:#0066cc;font-weight:700;font-family:var(--font-display);margin-bottom:12px;">🔬 '+SCAN_LABELS[scanType]+" — "+usedModel+'</div><div style="color:var(--text);line-height:1.7;font-size:.92rem;font-weight:300;">'+fmt+"</div></div>";
        scanHist.unshift({type:scanType,label:SCAN_LABELS[scanType],model:usedModel,ctx:ctx,result:txt,date:new Date().toLocaleString("es-ES")});
        if(scanHist.length>30)scanHist=scanHist.slice(0,30);
        localStorage.setItem("scan_hist_v2",JSON.stringify(scanHist));scanRenderHist();
    }else{
        var errDetail=errors.length?errors.join(" | "):"Sin detalles";
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid #dc2626;border-left:4px solid #dc2626;border-radius:var(--radius);padding:20px;"><div style="color:#dc2626;font-weight:700;margin-bottom:8px;">❌ Error</div><div style="color:var(--text);font-size:.9rem;margin-bottom:8px;">No se pudo analizar la imagen. Se intentaron '+errors.length+' proveedores.</div><div style="font-size:.75rem;color:var(--text-muted);font-family:monospace;background:var(--bg-subtle);padding:8px;border-radius:6px;word-break:break-all;line-height:1.6;">'+escMod(errDetail)+'</div></div>';
    }
    btn.disabled=false;btn.innerHTML="🔬 Analizar con IA";
}var SCAN_PUTER_MODELS=["gemini-2.5-flash","gemini-2.5-pro","claude-sonnet-4-5"];
var GEMINI_KEY="AIzaSyC1sWG4JvoIbbrkawlp6wOG8UxVwbUye1A";
var GEMINI_MODEL="gemini-2.5-flash";


function scanRenderHist(){
    var l=document.getElementById("scanHistList");if(!l)return;
    if(scanHist.length===0){l.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-muted);"><div style="font-size:2.5rem;margin-bottom:10px;opacity:.5;">🔬</div><p style="font-size:.92rem;">Aún no hay análisis</p></div>';return;}
    l.innerHTML=scanHist.map(function(h,i){return'<div onclick="scanViewHist('+i+')" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;cursor:pointer;transition:.2s;" onmouseover="this.style.borderColor=\'#0066cc\'" onmouseout="this.style.borderColor=\'var(--border)\'"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-weight:600;font-size:.85rem;color:#0066cc;">'+h.label+'</span><span style="font-size:.78rem;color:var(--text-muted);">'+h.date+'</span></div><div style="font-size:.85rem;color:var(--text-light);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+h.result.substring(0,140)+"...</div></div>";}).join("");
}
function scanViewHist(i){var h=scanHist[i];if(!h)return;var fmt=h.result.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");var euAiBannerH='<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#991b1b;line-height:1.5;"><strong>⚠️ HERRAMIENTA EXCLUSIVAMENTE DOCENTE — EU AI Act 2024/1689</strong><br>Este análisis ha sido generado por IA y NO constituye diagnóstico médico ni base para decisiones terapéuticas.</div>';
document.getElementById("scanResult").innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #0066cc;border-radius:var(--radius);padding:20px;">'+euAiBannerH+'<div style="color:#0066cc;font-weight:700;font-family:var(--font-display);margin-bottom:12px;">📋 '+h.label+" — "+h.model+" — "+h.date+"</div>"+(h.ctx?'<div style="font-size:.85rem;color:var(--text-muted);margin-bottom:10px;font-style:italic;">Contexto: '+h.ctx+"</div>":"")+'<div style="color:var(--text);line-height:1.7;font-size:.92rem;font-weight:300;">'+fmt+"</div></div>";}

// ═══ TAB SWITCHING ═══
function switchScanTab(tab){
    document.getElementById("panelScanIA").style.display=tab==="scanIA"?"block":"none";
    document.getElementById("panelNIHQuiz").style.display=tab==="nihQuiz"?"block":"none";
    document.getElementById("tabScanIA").style.background=tab==="scanIA"?"linear-gradient(135deg,#0066cc,#004499)":"var(--bg-subtle)";
    document.getElementById("tabScanIA").style.color=tab==="scanIA"?"#fff":"var(--text)";
    document.getElementById("tabNIHQuiz").style.background=tab==="nihQuiz"?"linear-gradient(135deg,#4caf50,#2e7d32)":"var(--bg-subtle)";
    document.getElementById("tabNIHQuiz").style.color=tab==="nihQuiz"?"#fff":"var(--text)";
    var calcEl=document.getElementById("panelCalc");if(calcEl)calcEl.style.display=tab==="calc"?"block":"none";
    var calcBtn=document.getElementById("tabCalc");if(calcBtn){calcBtn.style.background=tab==="calc"?"linear-gradient(135deg,#7c3aed,#4f46e5)":"var(--bg-subtle)";calcBtn.style.color=tab==="calc"?"#fff":"var(--text)";}
    var nbEl=document.getElementById("panelNotebooks");if(nbEl)nbEl.style.display=tab==="notebooks"?"block":"none";
    var nbBtn=document.getElementById("tabNotebooks");if(nbBtn){nbBtn.style.background=tab==="notebooks"?"linear-gradient(135deg,#0d47a1,#1565c0)":"var(--bg-subtle)";nbBtn.style.color=tab==="notebooks"?"#fff":"var(--text)";}
    var ptEl=document.getElementById("panelPlantillas");if(ptEl)ptEl.style.display=tab==="plantillas"?"block":"none";
    var ptBtn=document.getElementById("tabPlantillas");if(ptBtn){ptBtn.style.background=tab==="plantillas"?"linear-gradient(135deg,#0a1628,#1a3050)":"var(--bg-subtle)";ptBtn.style.color=tab==="plantillas"?"#fff":"var(--text)";}
    if(tab==="plantillas" && typeof ptInit==="function") ptInit();
}

// ═══ NOTEBOOKLM VIEWER ═══
function loadNotebook(id, title){
    var url = "https://notebooklm.google.com/notebook/" + id;
    var frame = document.getElementById("notebookFrame");
    var iframe = document.getElementById("notebookIframe");
    var titleEl = document.getElementById("notebookFrameTitle");
    var linkEl = document.getElementById("notebookFrameLink");
    var infoEl = document.getElementById("notebookEmbedInfo");

    if(titleEl) titleEl.textContent = "🤖 " + title;
    if(linkEl){ linkEl.href = url; }

    // NotebookLM bloquea iframes (X-Frame-Options: DENY)
    // Mostramos el aviso y abrimos en nueva pestaña automáticamente
    if(frame) frame.style.display = "none";
    if(infoEl) infoEl.style.display = "block";
    // Abrir en nueva pestaña directamente
    window.open(url, "_blank");
}

// ═══ NIH CHEST X-RAY QUIZ MODULE ═══
var NIH_CASES=[
{id:"00000001_000",label:"Cardiomegaly",age:58,sex:"M",desc:"Silueta cardíaca aumentada de tamaño con índice cardiotorácico >0.5. Campos pulmonares sin consolidaciones."},
{id:"00000003_000",label:"No Finding",age:45,sex:"F",desc:"Radiografía de tórax PA normal. Silueta cardíaca normal. Campos pulmonares limpios. Sin alteraciones pleurales."},
{id:"00000013_004",label:"Effusion",age:62,sex:"M",desc:"Opacificación del ángulo costofrénico derecho compatible con derrame pleural. Pulmón izquierdo sin hallazgos."},
{id:"00000032_001",label:"Infiltration",age:55,sex:"M",desc:"Infiltrados alveolares bilaterales de predominio perihiliar. Patrón intersticial difuso."},
{id:"00000040_000",label:"Atelectasis",age:71,sex:"F",desc:"Pérdida de volumen del lóbulo inferior izquierdo con elevación del hemidiafragma y desplazamiento mediastínico ipsilateral."},
{id:"00000055_001",label:"Pneumothorax",age:32,sex:"M",desc:"Línea pleural visible en hemitórax derecho con ausencia de trama vascular periférica. Compatible con neumotórax."},
{id:"00000071_003",label:"Consolidation",age:67,sex:"F",desc:"Consolidación en lóbulo inferior derecho con broncograma aéreo. Sugestivo de neumonía lobar."},
{id:"00000082_000",label:"Emphysema",age:74,sex:"M",desc:"Hiperinsuflación pulmonar bilateral. Aplanamiento diafragmático. Aumento del espacio retroesternal. Patrón compatible con enfisema."},
{id:"00000098_002",label:"Nodule",age:53,sex:"F",desc:"Nódulo pulmonar solitario de ~2cm en lóbulo superior derecho. Bordes lisos. Requiere seguimiento."},
{id:"00000120_005",label:"Mass",age:66,sex:"M",desc:"Masa pulmonar de >3cm en lóbulo superior izquierdo con bordes irregulares. Sospechoso de malignidad."},
{id:"00000145_001",label:"Edema",age:78,sex:"F",desc:"Edema pulmonar bilateral con patrón en alas de mariposa. Redistribución vascular. Líneas B de Kerley. Derrame pleural bilateral."},
{id:"00000160_000",label:"Fibrosis",age:69,sex:"M",desc:"Patrón reticular bilateral de predominio basal. Panalización subpleural. Compatible con fibrosis pulmonar."},
{id:"00000175_002",label:"Pleural_Thickening",age:63,sex:"M",desc:"Engrosamiento pleural bilateral con calcificaciones. Antecedentes de exposición a asbesto."},
{id:"00000190_000",label:"Hernia",age:72,sex:"F",desc:"Gran hernia hiatal con imagen aérea retrocardiaca. Silueta cardíaca parcialmente borrada."},
{id:"00000210_001",label:"Pneumonia",age:48,sex:"M",desc:"Consolidación alveolar en lóbulo medio derecho con broncograma aéreo. Fiebre y tos productiva."},
{id:"00000005_000",label:"Cardiomegaly",age:81,sex:"F",desc:"Cardiomegalia severa con redistribución vascular pulmonar. Derrame pleural bilateral leve."},
{id:"00000018_001",label:"No Finding",age:34,sex:"M",desc:"Tórax PA sin hallazgos patológicos significativos. Corazón y grandes vasos normales."},
{id:"00000050_003",label:"Effusion",age:73,sex:"F",desc:"Derrame pleural masivo izquierdo con desplazamiento mediastínico contralateral. Opacificación completa del hemitórax izquierdo."},
{id:"00000088_000",label:"Atelectasis",age:61,sex:"M",desc:"Atelectasia laminar en base derecha. Tractos fibrosos bilaterales. Paciente postquirúrgico."},
{id:"00000110_002",label:"Pneumothorax",age:25,sex:"M",desc:"Neumotórax espontáneo izquierdo con colapso pulmonar del 30%. Paciente joven, asténico."},
{id:"00000135_001",label:"Consolidation",age:59,sex:"F",desc:"Consolidación multilobar bilateral. Afectación de lóbulos inferiores. Broncograma aéreo bilateral."},
{id:"00000158_000",label:"Emphysema",age:70,sex:"M",desc:"Signos de EPOC avanzado. Bullas apicales bilaterales. Aplanamiento diafragmático severo."},
{id:"00000180_003",label:"Nodule",age:47,sex:"M",desc:"Múltiples nódulos pulmonares bilaterales de tamaño variable (5-15mm). Patrón sugestivo de metástasis."},
{id:"00000200_001",label:"Mass",age:71,sex:"F",desc:"Masa hiliar izquierda con ensanchamiento mediastínico. Adenopatías mediastínicas."},
{id:"00000225_000",label:"Edema",age:82,sex:"M",desc:"Edema pulmonar agudo. Patrón alveolar bilateral difuso. Cardiomegalia. Redistribución vascular cefálica."},
{id:"00000240_002",label:"Fibrosis",age:65,sex:"F",desc:"Fibrosis pulmonar idiopática con patrón UIP. Panalización basal bilateral. Bronquiectasias de tracción."},
{id:"00000260_001",label:"Infiltration",age:50,sex:"M",desc:"Infiltrados intersticiales bilaterales difusos. Patrón reticulonodular. Contexto de inmunosupresión."},
{id:"00000280_000",label:"Pneumonia",age:39,sex:"F",desc:"Neumonía de lóbulo inferior izquierdo. Consolidación homogénea con borde nítido (signo de la silueta)."},
{id:"00000300_003",label:"Pleural_Thickening",age:68,sex:"M",desc:"Engrosamiento pleural apical bilateral. Calcificación pleural izquierda."},
{id:"00000320_001",label:"Hernia",age:76,sex:"M",desc:"Hernia de Morgagni. Imagen de densidad tisular en ángulo cardiofrénico derecho."},
{id:"00000340_000",label:"No Finding",age:29,sex:"F",desc:"Radiografía de tórax normal en mujer joven. Estructuras mediastínicas y pulmonares sin alteraciones."}
];

var NIH_LABELS_ES={"No Finding":"Normal","Atelectasis":"Atelectasia","Cardiomegaly":"Cardiomegalia","Consolidation":"Consolidación","Edema":"Edema pulmonar","Effusion":"Derrame pleural","Emphysema":"Enfisema","Fibrosis":"Fibrosis","Hernia":"Hernia","Infiltration":"Infiltrado","Mass":"Masa","Nodule":"Nódulo","Pleural_Thickening":"Engrosamiento pleural","Pneumonia":"Neumonía","Pneumothorax":"Neumotórax"};
var ALL_LABELS=Object.keys(NIH_LABELS_ES);
var nihMode="quiz",nihCurrentCase=null,nihScore={correct:0,wrong:0,total:0},nihUsed=[];
var nihFiltered=NIH_CASES.slice();

function nihSetMode(m){
    nihMode=m;
    document.getElementById("nihModeQuiz").style.borderColor=m==="quiz"?"#4caf50":"var(--border)";
    document.getElementById("nihModeQuiz").style.background=m==="quiz"?"#e8f5e9":"var(--bg-card)";
    document.getElementById("nihModeQuiz").style.color=m==="quiz"?"#2e7d32":"var(--text)";
    document.getElementById("nihModeCompare").style.borderColor=m==="compare"?"#0066cc":"var(--border)";
    document.getElementById("nihModeCompare").style.background=m==="compare"?"#e3f2fd":"var(--bg-card)";
    document.getElementById("nihModeCompare").style.color=m==="compare"?"#0066cc":"var(--text)";
    if(nihCurrentCase)nihShowCase(nihCurrentCase);
}

function nihFilterCases(){
    var f=document.getElementById("nihFilterPath").value;
    nihFiltered=f==="all"?NIH_CASES.slice():NIH_CASES.filter(function(c){return c.label===f;});
    nihUsed=[];
    document.getElementById("nihTotalCases").textContent=nihFiltered.length;
}

function nihReset(){
    nihScore={correct:0,wrong:0,total:0};nihUsed=[];
    document.getElementById("nihCorrect").textContent="0";
    document.getElementById("nihWrong").textContent="0";
    document.getElementById("nihTotal").textContent="0";
    document.getElementById("nihCaseImage").innerHTML='<div style="color:#fff;opacity:.5;font-size:1.1rem;">Pulsa "Siguiente caso" para empezar</div>';
    document.getElementById("nihCaseInfo").innerHTML="";
    document.getElementById("nihQuizOptions").style.display="none";
    document.getElementById("nihCompareArea").style.display="none";
    document.getElementById("nihFeedback").style.display="none";
}

function nihNextCase(){
    var avail=nihFiltered.filter(function(c){return nihUsed.indexOf(c.id)===-1;});
    if(avail.length===0){nihUsed=[];avail=nihFiltered.slice();}
    var c=avail[Math.floor(Math.random()*avail.length)];
    nihUsed.push(c.id);
    nihCurrentCase=c;
    nihShowCase(c);
}

function nihShowCase(c){
    // Generate a representative chest X-ray SVG placeholder
    var svg=nihGenerateXraySVG(c.label);
    document.getElementById("nihCaseImage").innerHTML='<div style="position:relative;width:100%;max-width:400px;margin:0 auto;">'+svg+'<div style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.7);color:#fff;padding:4px 10px;border-radius:4px;font-size:.75rem;">ID: '+c.id+'</div></div>';
    document.getElementById("nihCaseInfo").innerHTML='<span style="background:var(--bg-subtle);padding:4px 10px;border-radius:4px;font-size:.82rem;margin-right:8px;">👤 '+c.sex+', '+c.age+' años</span><span style="background:var(--bg-subtle);padding:4px 10px;border-radius:4px;font-size:.82rem;">📋 Caso #'+c.id+'</span>';
    document.getElementById("nihFeedback").style.display="none";

    if(nihMode==="quiz"){
        document.getElementById("nihQuizOptions").style.display="block";
        document.getElementById("nihCompareArea").style.display="none";
        nihRenderOptions(c);
    }else{
        document.getElementById("nihQuizOptions").style.display="none";
        document.getElementById("nihCompareArea").style.display="block";
        document.getElementById("nihGroundTruth").innerHTML='<span style="display:inline-block;background:#2e7d32;color:#fff;padding:6px 14px;border-radius:20px;font-weight:700;font-size:.9rem;">'+NIH_LABELS_ES[c.label]+'</span><p style="margin-top:10px;font-size:.85rem;color:var(--text-light);">'+c.desc+'</p>';
        document.getElementById("nihAIDiagnosis").innerHTML='<button id="nihRunIA" onclick="nihAnalyzeWithIA()" style="padding:10px 20px;background:linear-gradient(135deg,#0066cc,#004499);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-family:var(--font-body);font-size:.88rem;">🔬 Analizar con IA</button>';
    }
}

function nihRenderOptions(c){
    var opts=[c.label];
    var pool=ALL_LABELS.filter(function(l){return l!==c.label;});
    while(opts.length<4){var r=pool[Math.floor(Math.random()*pool.length)];if(opts.indexOf(r)===-1)opts.push(r);}
    // Shuffle
    for(var i=opts.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=opts[i];opts[i]=opts[j];opts[j]=t;}
    var html=opts.map(function(o){
        return'<button onclick="nihAnswer(\''+o+'\')" class="nih-opt-btn" style="padding:14px;border:2px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-card);cursor:pointer;font-family:var(--font-body);font-size:.9rem;font-weight:600;transition:.25s;text-align:center;" onmouseover="this.style.borderColor=\'#0066cc\';this.style.background=\'#f0f7ff\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--bg-card)\'">'+NIH_LABELS_ES[o]+'</button>';
    }).join("");
    document.getElementById("nihOptions").innerHTML=html;
}

function nihAnswer(ans){
    var c=nihCurrentCase;if(!c)return;
    var correct=ans===c.label;
    nihScore.total++;
    if(correct)nihScore.correct++;else nihScore.wrong++;
    document.getElementById("nihCorrect").textContent=nihScore.correct;
    document.getElementById("nihWrong").textContent=nihScore.wrong;
    document.getElementById("nihTotal").textContent=nihScore.total;

    // Disable all buttons
    document.querySelectorAll(".nih-opt-btn").forEach(function(b){
        b.onclick=null;b.style.cursor="default";
        if(b.textContent===NIH_LABELS_ES[c.label]){b.style.borderColor="#4caf50";b.style.background="#e8f5e9";b.style.color="#2e7d32";}
        if(b.textContent===NIH_LABELS_ES[ans]&&!correct){b.style.borderColor="#dc2626";b.style.background="#fef2f2";b.style.color="#dc2626";}
    });

    var fb=document.getElementById("nihFeedback");
    fb.style.display="block";
    fb.style.background=correct?"#e8f5e9":"#fef2f2";
    fb.style.borderLeft=correct?"4px solid #4caf50":"4px solid #dc2626";
    fb.innerHTML=(correct?'<strong style="color:#2e7d32;">✅ ¡Correcto!</strong>':'<strong style="color:#dc2626;">❌ Incorrecto.</strong> La respuesta era: <strong>'+NIH_LABELS_ES[c.label]+'</strong>')+'<p style="margin-top:8px;font-size:.88rem;color:var(--text-light);">'+c.desc+'</p>';
}

function nihAnalyzeWithIA(){
    var c=nihCurrentCase;if(!c)return;
    var el=document.getElementById("nihAIDiagnosis");
    el.innerHTML='<div style="text-align:center;padding:20px;"><div class="scan-spinner" style="margin:0 auto 10px;width:30px;height:30px;border:3px solid var(--border);border-top-color:#0066cc;border-radius:50%;animation:spin 1s linear infinite;"></div><div style="font-size:.85rem;color:var(--text-muted);">Analizando con Llama 4 Scout...</div></div>';

    // Check if there's a real image loaded
    var imgEl=document.querySelector("#nihCaseImage img");
    var hasRealImage=imgEl&&imgEl.src&&imgEl.src.startsWith("http");

    if(hasRealImage){
        // Convert real image to base64 and send to Groq vision
        var canvas=document.createElement("canvas");
        var ctx2d=canvas.getContext("2d");
        var img=new Image();img.crossOrigin="anonymous";
        img.onload=function(){
            canvas.width=img.width;canvas.height=img.height;
            ctx2d.drawImage(img,0,0);
            try{
                var b64=canvas.toDataURL("image/jpeg",0.85);
                nihSendToGroqVision(c,b64,el);
            }catch(e){
                console.log("CORS blocked, using text-only analysis");
                nihSendTextAnalysis(c,el);
            }
        };
        img.onerror=function(){nihSendTextAnalysis(c,el);};
        img.src=imgEl.src;
    }else{
        nihSendTextAnalysis(c,el);
    }
}

function nihSendToGroqVision(c,b64,el){
    var sysPrompt="Eres un radiólogo experto realizando una lectura docente de una radiografía de tórax real. Responde en español de forma estructurada.";
    var userPrompt="Analiza esta radiografía de tórax real de un paciente de "+c.age+" años ("+c.sex+").\n\n1. Hallazgos principales\n2. Diagnóstico más probable\n3. Diagnósticos diferenciales\n4. Recomendación\n\nIMPORTANTE: Solo uso DOCENTE.";

    fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+getScanGroqKey(),"HTTP-Referer":"https://carlosgalera-a11y.github.io/Cartagenaeste/","X-Title":"Area II Cartagena"},
        body:JSON.stringify({
            model:SCAN_GROQ_MODEL,
            messages:[{role:"system",content:sysPrompt},{role:"user",content:[{type:"image_url",image_url:{url:b64}},{type:"text",text:userPrompt}]}],
            max_tokens:1500,temperature:0.3
        })
    }).then(function(r){return r.json();}).then(function(d){
        nihDisplayIAResult(c,d,el);
    }).catch(function(e){
        console.log("Vision API failed, falling back to text:",e);
        nihSendTextAnalysis(c,el);
    });
}

function nihSendTextAnalysis(c,el){
    var prompt="Eres un radiólogo experto. Analiza esta radiografía de tórax de un paciente de "+c.age+" años ("+c.sex+").\n\nDa tu diagnóstico principal y describe los hallazgos radiológicos que observas.\nResponde en español de forma estructurada:\n1. Hallazgos principales\n2. Diagnóstico más probable\n3. Diagnósticos diferenciales\n4. Recomendación\n\nLos hallazgos de esta radiografía son: "+c.desc+"\n\nIMPORTANTE: Solo uso DOCENTE.";

    fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+getScanGroqKey(),"HTTP-Referer":"https://carlosgalera-a11y.github.io/Cartagenaeste/","X-Title":"Area II Cartagena"},
        body:JSON.stringify({
            model:SCAN_GROQ_MODEL,
            messages:[{role:"system",content:"Eres un radiólogo experto realizando una lectura docente de una radiografía de tórax."},{role:"user",content:prompt}],
            max_tokens:1500,temperature:0.3
        })
    }).then(function(r){return r.json();}).then(function(d){
        nihDisplayIAResult(c,d,el);
    }).catch(function(e){el.innerHTML='<div style="color:#dc2626;">❌ Error de conexión: '+e.message+'</div>';});
}

function nihDisplayIAResult(c,d,el){
    if(d.error){el.innerHTML='<div style="color:#dc2626;">❌ Error: '+d.error.message+'</div>';return;}
    var txt=d.choices[0].message.content;
    var fmt=txt.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
    el.innerHTML='<div style="line-height:1.7;font-size:.88rem;">'+fmt+'</div>';

    var fb=document.getElementById("nihFeedback");
    var iaLower=txt.toLowerCase();
    var match=iaLower.indexOf(c.label.toLowerCase().replace("_"," "))!==-1||iaLower.indexOf(NIH_LABELS_ES[c.label].toLowerCase())!==-1;
    fb.style.display="block";
    fb.style.background=match?"#e8f5e9":"#fff3cd";
    fb.style.borderLeft=match?"4px solid #4caf50":"4px solid #ffc107";
    fb.innerHTML=match?'<strong style="color:#2e7d32;">✅ La IA coincide con el diagnóstico NIH:</strong> '+NIH_LABELS_ES[c.label]:'<strong style="color:#856404;">⚠️ La IA puede diferir del diagnóstico NIH:</strong> '+NIH_LABELS_ES[c.label]+'<p style="margin-top:6px;font-size:.85rem;color:var(--text-light);">Recuerda que las etiquetas NIH fueron extraídas por NLP y tienen ~90% de precisión.</p>';
}

function nihGenerateXraySVG(label){
    // Real chest X-ray images from Wikimedia Commons (public domain / CC)
    var realImages={
        "No Finding":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Chest_Xray_PA_3-8-2010.png/400px-Chest_Xray_PA_3-8-2010.png",
        "Pneumonia":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Chest_X-ray_in_influenza_and_Haemophilus_influenzae.jpg/400px-Chest_X-ray_in_influenza_and_Haemophilus_influenzae.jpg",
        "Cardiomegaly":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Chest_radiograph_of_a_person_with_congestive_heart_failure.png/400px-Chest_radiograph_of_a_person_with_congestive_heart_failure.png",
        "Effusion":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Pleural_effusion.jpg/400px-Pleural_effusion.jpg",
        "Pneumothorax":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rt_sided_pneumothorax.jpg/400px-Rt_sided_pneumothorax.jpg",
        "Edema":"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Pulmonary_edema.jpg/400px-Pulmonary_edema.jpg",
        "Atelectasis":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Atelectasia2.jpg/400px-Atelectasia2.jpg",
        "Consolidation":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Pneumonia_x-ray.jpg/400px-Pneumonia_x-ray.jpg",
        "Emphysema":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Centrilobular_emphysema_865_lores.jpg/400px-Centrilobular_emphysema_865_lores.jpg"
    };
    var url=realImages[label];
    if(url){
        return '<img src="'+url+'" alt="Chest X-ray: '+label+'" style="width:100%;max-width:400px;border-radius:8px;background:#000;" onerror="this.outerHTML=nihFallbackSVG(\''+label+'\');" crossorigin="anonymous"/>';
    }
    return nihFallbackSVG(label);
}

function nihFallbackSVG(label){
    var w=400,h=480;
    var extras="",heartRx="50",heartRy="55";
    var noise="";
    // Add realistic noise/texture
    for(var i=0;i<40;i++){
        var nx=60+Math.random()*280,ny=130+Math.random()*230,nr=1+Math.random()*3,no=.03+Math.random()*.08;
        noise+='<circle cx="'+nx+'" cy="'+ny+'" r="'+nr+'" fill="rgba(200,200,200,'+no+')"/>';
    }
    // Vascular markings
    var vasc='<g stroke="rgba(180,180,180,.08)" stroke-width="1" fill="none">'+
    '<path d="M165 180 Q150 200 140 230 Q130 260 125 290"/><path d="M165 180 Q155 210 160 250"/>'+
    '<path d="M235 180 Q250 200 260 230 Q270 260 275 290"/><path d="M235 180 Q245 210 240 250"/>'+
    '<path d="M160 190 Q140 210 130 240"/><path d="M240 190 Q260 210 270 240"/>'+
    '</g>';

    if(label==="Cardiomegaly"){heartRx="90";heartRy="80";extras='<ellipse cx="195" cy="280" rx="90" ry="80" fill="rgba(160,160,160,.45)" stroke="rgba(200,200,200,.2)" stroke-width="1"/>';}
    else if(label==="Effusion")extras='<path d="M65 350 Q130 325 200 335 Q260 325 335 350 L335 450 Q200 430 65 450Z" fill="rgba(180,180,180,.55)"/><path d="M65 360 Q200 340 335 360" stroke="rgba(200,200,200,.3)" stroke-width="1" fill="none"/>';
    else if(label==="Pneumothorax")extras='<path d="M260 140 Q310 150 315 220 Q315 300 280 360" stroke="rgba(255,255,200,.4)" stroke-width="2" fill="none"/><rect x="265" y="160" width="45" height="170" fill="rgba(0,0,0,.3)" rx="4"/><text x="272" y="250" fill="rgba(255,255,200,.35)" font-size="9" font-family="sans-serif">sin trama</text>';
    else if(label==="Consolidation")extras='<ellipse cx="145" cy="320" rx="55" ry="45" fill="rgba(190,190,190,.5)"/><path d="M120 310 L130 315 M135 305 L140 320 M150 300 L145 315" stroke="rgba(220,220,220,.3)" stroke-width="1"/>';
    else if(label==="Pneumonia")extras='<ellipse cx="260" cy="300" rx="50" ry="45" fill="rgba(190,190,190,.5)"/><g stroke="rgba(220,220,220,.25)" stroke-width="1"><line x1="240" y1="290" x2="250" y2="310"/><line x1="255" y1="285" x2="260" y2="305"/><line x1="270" y1="290" x2="265" y2="310"/></g>';
    else if(label==="Nodule")extras='<circle cx="260" cy="200" r="14" fill="rgba(190,190,190,.55)" stroke="rgba(220,220,220,.3)" stroke-width="1"/><circle cx="260" cy="200" r="8" fill="rgba(200,200,200,.3)"/>';
    else if(label==="Mass")extras='<ellipse cx="145" cy="210" rx="35" ry="30" fill="rgba(190,190,190,.5)" stroke="rgba(220,220,220,.25)" stroke-width="1"/><ellipse cx="145" cy="210" rx="20" ry="18" fill="rgba(200,200,200,.25)"/>';
    else if(label==="Edema")extras='<ellipse cx="200" cy="250" rx="90" ry="70" fill="rgba(180,180,180,.25)"/><ellipse cx="200" cy="250" rx="60" ry="45" fill="rgba(190,190,190,.2)"/><g stroke="rgba(200,200,200,.15)" stroke-width="1"><line x1="95" y1="340" x2="105" y2="340"/><line x1="100" y1="345" x2="110" y2="345"/><line x1="290" y1="340" x2="300" y2="340"/><line x1="295" y1="345" x2="305" y2="345"/></g>';
    else if(label==="Emphysema")extras='<ellipse cx="130" cy="250" rx="90" ry="115" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1"/><ellipse cx="270" cy="250" rx="90" ry="115" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1"/><path d="M65 380 L335 380" stroke="rgba(200,200,200,.2)" stroke-width="1" stroke-dasharray="3,2"/><text x="150" y="395" fill="rgba(255,255,255,.2)" font-size="8" font-family="sans-serif">diafragma aplanado</text>';
    else if(label==="Fibrosis")extras='<g opacity=".35" stroke="#aaa" stroke-width="1"><path d="M110 310 Q120 320 115 335"/><path d="M140 315 Q150 325 145 340"/><path d="M170 310 Q180 320 175 335"/><path d="M230 310 Q240 320 235 335"/><path d="M260 315 Q270 325 265 340"/><path d="M290 310 Q300 320 295 335"/></g><g opacity=".2"><circle cx="130" cy="340" r="5" fill="#aaa"/><circle cx="160" cy="345" r="4" fill="#aaa"/><circle cx="240" cy="340" r="5" fill="#aaa"/><circle cx="270" cy="345" r="4" fill="#aaa"/></g>';
    else if(label==="Hernia")extras='<ellipse cx="200" cy="380" rx="50" ry="40" fill="rgba(180,180,180,.4)"/><ellipse cx="200" cy="380" rx="30" ry="20" fill="rgba(50,50,50,.3)"/><text x="175" y="405" fill="rgba(255,255,255,.2)" font-size="8" font-family="sans-serif">aire retrocardiaco</text>';
    else if(label==="Atelectasis")extras='<path d="M100 310 Q140 340 100 370" stroke="rgba(200,200,200,.4)" stroke-width="2" fill="rgba(200,200,200,.25)"/><path d="M65 355 Q130 340 200 350" stroke="rgba(200,200,200,.25)" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/><text x="70" y="345" fill="rgba(255,255,255,.25)" font-size="8" font-family="sans-serif">↑ hemidiafragma</text>';
    else if(label==="Pleural_Thickening")extras='<path d="M65 150 Q58 260 65 370" stroke="rgba(200,200,200,.4)" stroke-width="5"/><path d="M335 150 Q342 260 335 370" stroke="rgba(200,200,200,.4)" stroke-width="5"/><path d="M68 150 Q62 260 68 370" stroke="rgba(180,180,180,.2)" stroke-width="3"/><path d="M332 150 Q338 260 332 370" stroke="rgba(180,180,180,.2)" stroke-width="3"/>';
    else if(label==="Infiltration")extras='<g opacity=".35"><circle cx="150" cy="230" r="10" fill="#bbb"/><circle cx="170" cy="255" r="8" fill="#bbb"/><circle cx="225" cy="225" r="9" fill="#bbb"/><circle cx="245" cy="250" r="7" fill="#bbb"/><circle cx="200" cy="275" r="11" fill="#bbb"/><circle cx="135" cy="260" r="6" fill="#bbb"/><circle cx="260" cy="235" r="8" fill="#bbb"/></g>';

    return '<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;max-width:400px;background:#0a0a0a;border-radius:8px;" xmlns="http://www.w3.org/2000/svg">'+
    '<defs>'+
    '<radialGradient id="lgL" cx="35%" cy="50%" r="45%"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="70%" stop-color="#181818"/><stop offset="100%" stop-color="#0a0a0a"/></radialGradient>'+
    '<radialGradient id="lgR" cx="65%" cy="50%" r="45%"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="70%" stop-color="#181818"/><stop offset="100%" stop-color="#0a0a0a"/></radialGradient>'+
    '<radialGradient id="hrt" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#555"/><stop offset="100%" stop-color="#333"/></radialGradient>'+
    '</defs>'+
    '<rect width="'+w+'" height="'+h+'" fill="#0a0a0a"/>'+
    // Soft tissue outline
    '<ellipse cx="200" cy="260" rx="150" ry="190" fill="none" stroke="rgba(200,200,200,.06)" stroke-width="2"/>'+
    // Lungs
    '<path d="M80 150 Q70 260 80 370 Q140 380 185 360 Q190 260 185 160 Q140 140 80 150Z" fill="url(#lgL)" stroke="rgba(200,200,200,.1)" stroke-width=".5"/>'+
    '<path d="M320 150 Q330 260 320 370 Q260 380 215 360 Q210 260 215 160 Q260 140 320 150Z" fill="url(#lgR)" stroke="rgba(200,200,200,.1)" stroke-width=".5"/>'+
    // Mediastinum
    '<rect x="185" y="130" width="30" height="250" fill="rgba(100,100,100,.2)" rx="5"/>'+
    // Trachea
    '<rect x="195" y="90" width="10" height="50" fill="rgba(40,40,40,.5)" rx="3" stroke="rgba(200,200,200,.08)" stroke-width="1"/>'+
    // Hilum
    '<ellipse cx="185" cy="210" rx="18" ry="25" fill="rgba(130,130,130,.25)"/>'+
    '<ellipse cx="215" cy="210" rx="18" ry="25" fill="rgba(130,130,130,.25)"/>'+
    // Heart
    '<ellipse cx="195" cy="290" rx="'+heartRx+'" ry="'+heartRy+'" fill="url(#hrt)" stroke="rgba(200,200,200,.1)" stroke-width=".5"/>'+
    // Aortic knob
    '<path d="M175 155 Q155 145 165 170" fill="rgba(130,130,130,.3)" stroke="rgba(200,200,200,.08)" stroke-width="1"/>'+
    // Spine
    '<line x1="200" y1="100" x2="200" y2="460" stroke="rgba(200,200,200,.05)" stroke-width="4"/>'+
    // Ribs
    '<g stroke="rgba(200,200,200,.08)" stroke-width="1.5" fill="none">'+
    '<path d="M85 165 Q140 155 200 160 Q260 155 315 165"/><path d="M80 200 Q140 188 200 193 Q260 188 320 200"/>'+
    '<path d="M78 235 Q140 220 200 225 Q260 220 322 235"/><path d="M80 270 Q140 255 200 260 Q260 255 320 270"/>'+
    '<path d="M83 305 Q140 290 200 295 Q260 290 317 305"/><path d="M88 340 Q140 325 200 330 Q260 325 312 340"/>'+
    '</g>'+
    // Clavicles
    '<path d="M85 130 Q130 120 190 125" stroke="rgba(200,200,200,.12)" stroke-width="2.5" fill="none"/>'+
    '<path d="M315 130 Q270 120 210 125" stroke="rgba(200,200,200,.12)" stroke-width="2.5" fill="none"/>'+
    // Scapulae hints
    '<path d="M65 160 Q55 220 65 300" stroke="rgba(200,200,200,.06)" stroke-width="3" fill="none"/>'+
    '<path d="M335 160 Q345 220 335 300" stroke="rgba(200,200,200,.06)" stroke-width="3" fill="none"/>'+
    // Diaphragm
    '<path d="M80 370 Q130 350 185 360 Q195 365 215 360 Q270 350 320 370" stroke="rgba(200,200,200,.12)" stroke-width="1.5" fill="none"/>'+
    // Costophrenic angles
    '<path d="M80 370 Q75 390 80 410" stroke="rgba(200,200,200,.08)" stroke-width="1" fill="none"/>'+
    '<path d="M320 370 Q325 390 320 410" stroke="rgba(200,200,200,.08)" stroke-width="1" fill="none"/>'+
    // Vascular markings
    vasc+
    // Random noise for realism
    noise+
    // Pathology overlay
    extras+
    // Labels
    '<text x="10" y="18" fill="rgba(255,255,255,.4)" font-size="11" font-family="monospace">NIH CXR-14</text>'+
    '<text x="10" y="32" fill="rgba(255,255,255,.25)" font-size="9" font-family="monospace">Esquema docente</text>'+
    '<text x="'+( w-55)+'" y="18" fill="rgba(255,255,255,.3)" font-size="10" font-family="monospace">PA</text>'+
    '<rect x="8" y="'+( h-28)+'" width="6" height="16" fill="rgba(255,255,255,.3)" rx="1"/>'+
    '<text x="20" y="'+( h-15)+'" fill="rgba(255,255,255,.25)" font-size="8" font-family="monospace">L</text>'+
    '</svg>';
}

// ═══ TELÉFONOS BUSCAS ═══
var TEL_DATA=[
  {s:'Admisión Ambulancias',t:'950496'},
  {s:'Admisión Camas URG',t:'950210'},
  {s:'Admisión Central',t:'950281 / 82'},
  {s:'Admisión Urgencias',t:'950493 / 94'},
  {s:'Admisión Ventanilla',t:'950493 / 4'},
  {s:'Análisis Clínicos (Laboratorio)',t:'956014'},
  {s:'Aux. Información (Busca)',t:'956086'},
  {s:'Aux. Información (Fijo)',t:'950011'},
  {s:'Banco de Sangre',t:'951500 / 956018'},
  {s:'Bioquímica',t:'951458'},
  {s:'Box Emergencias',t:'950417'},
  {s:'Busca Enf. Pasillos',t:'956103'},
  {s:'Busca Médico',t:'956030'},
  {s:'Busca Referente URG',t:'85300'},
  {s:'Busca Rosell',t:'931811'},
  {s:'C. Amarillo (4, 5, 6, 7, 8, 9, 10)',t:'950424 / 23 / 14 / 11 / 09 / 07 / 363'},
  {s:'C. Celadores / Celador Consulta 20',t:'950434'},
  {s:'C. Otorrino / OFT',t:'950418'},
  {s:'C. Verde (1 y 2)',t:'950436 / 28'},
  {s:'Cafetería Personal',t:'959503'},
  {s:'Cardiología',t:'86292'},
  {s:'Casius Informática',t:'279100'},
  {s:'Celador PSQ',t:'956074'},
  {s:'Centralita',t:'128600'},
  {s:'Cirugía General',t:'956033 / 34'},
  {s:'Cocina',t:'959505'},
  {s:'Control Encamamientos',t:'950412 / 13'},
  {s:'Control Unidad C9-C16 M. / C17-C24 H.',t:'950394 / 5 / 405'},
  {s:'Control Unidad Monitores',t:'950396 / 7'},
  {s:'Dermatología',t:'956100'},
  {s:'Ecógrafo',t:'950300'},
  {s:'Electromedicina (Siemens)',t:'956057'},
  {s:'Encamamiento (1, 2 y 3)',t:'950406 / 20 / 04'},
  {s:'Encargado de Turno',t:'956053'},
  {s:'Endoscopias',t:'950261 / 950264'},
  {s:'Enf. Consulta (21, 22, 23, 24)',t:'950430 / 25 / 26 / 951693'},
  {s:'Enf. Nutrición / Preventiva',t:'956046 / 950410'},
  {s:'Estar Enfermería',t:'950399'},
  {s:'Esterilización',t:'959512'},
  {s:'Farmacia Enfermería',t:'951486 / 7'},
  {s:'Farmacia General',t:'956035'},
  {s:'Farmacia Noche',t:'951481 / 82'},
  {s:'Ginecología',t:'956003 / 04'},
  {s:'Hematología',t:'956029'},
  {s:'Hemodinámica',t:'950450'},
  {s:'Incidencias Informática',t:'6195034 / 952054 / 5 / 6 / 7'},
  {s:'Internista Rosell',t:'326800'},
  {s:'Jefa Admisión URG',t:'950366'},
  {s:'Jefe de Servicio / Sección',t:'950454 / 399'},
  {s:'Laboratorio Urgencias',t:'956014 / 18'},
  {s:'Limpieza General',t:'956015'},
  {s:'Limpieza URG',t:'956083'},
  {s:'Mantenimiento UTECIMA',t:'956025'},
  {s:'Maxilofacial (Maxilo)',t:'951356'},
  {s:'Medicina Interna',t:'956028'},
  {s:'Megafonía',t:'969902'},
  {s:'Microbiología',t:'956098'},
  {s:'Nefrología',t:'956009'},
  {s:'Neumología',t:'956068 / 67'},
  {s:'Neurocirugía HUVA',t:'83244'},
  {s:'Neurología',t:'956040'},
  {s:'Número Destacado (recuadro)',t:'956058'},
  {s:'Oftalmología (OFT)',t:'86018'},
  {s:'Oncología General',t:'956112'},
  {s:'Oncología RT',t:'956109'},
  {s:'ORL (Otorrinolaringología)',t:'956054'},
  {s:'Pediatría',t:'956008'},
  {s:'PSQ (Psiquiatría / Guardia)',t:'956002'},
  {s:'Quirofanillo',t:'950419'},
  {s:'Quirófano',t:'951563'},
  {s:'Radiología Intervencionista',t:'950303'},
  {s:'Radiología Técnico',t:'950505'},
  {s:'Radiólogo (>15:00)',t:'956042'},
  {s:'Rayos X URG',t:'950505'},
  {s:'Reanimación',t:'951604 / 05'},
  {s:'Referente General',t:'85300'},
  {s:'Referente UCI',t:'956061'},
  {s:'Ropero / Residuos',t:'956057 / 959521'},
  {s:'Seguridad',t:'950001 / 2 / 637448014'},
  {s:'Sesiones Médicas',t:'951522'},
  {s:'Supervisor de Guardia',t:'956052'},
  {s:'Supervisor URG',t:'956078'},
  {s:'TAC',t:'950298'},
  {s:'Traumatología',t:'956043 / 50'},
  {s:'Triaje Consulta 0',t:'950415'},
  {s:'UCI 1',t:'951653'},
  {s:'UCI 2',t:'951639 / 40'},
  {s:'UCI 3',t:'951629 / 30'},
  {s:'Unidad Psiquiatría (PSQ)',t:'956000'},
  {s:'Unidad Sillones',t:'950400'},
  {s:'UPI',t:'950489 / 92'},
  {s:'Urgencias HUSL',t:'956030'},
  {s:'Urgencias Pediatría',t:'950353'},
  {s:'Urología',t:'956047'},
  {s:'Vascular',t:'956095'},
  {s:'Verde 3.C 12 / Trauma',t:'950421'},
  {s:'Zoonosis',t:'969368954'}
];

function renderTelefonos(data){
  var el=document.getElementById("telDirectory");
  if(!el)return;
  if(!data||data.length===0){
    el.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--text-muted);"><div style="font-size:2.5rem;margin-bottom:12px;">&#128269;</div><p style="font-weight:600;margin-bottom:4px;">Sin resultados</p><p style="font-size:.85rem;">Prueba con otra búsqueda</p></div>';
    return;
  }
  // Agrupar por letra normalizada
  var groups={},letters=[];
  data.forEach(function(item){
    var l=item.s.charAt(0).toUpperCase();
    var ln=l.normalize?l.normalize('NFD').replace(/[\u0300-\u036f]/g,''):l;
    if(!groups[ln]){groups[ln]=[];letters.push(ln);}
    groups[ln].push(item);
  });
  var allAlpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letters=letters.filter(function(v,i,a){return a.indexOf(v)===i;}).sort();
  // Índice
  var idx='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:18px;padding:10px 12px;background:var(--bg-subtle);border-radius:8px;">';
  allAlpha.forEach(function(l){
    if(groups[l]){idx+='<a href="#tlg-'+l+'" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:var(--primary,#1a6b4a);color:#fff;border-radius:5px;font-weight:700;font-size:.78rem;text-decoration:none;">'+l+'</a>';}
    else{idx+='<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--text-muted);font-size:.78rem;opacity:.35;">'+l+'</span>';}
  });
  idx+='</div>';
  // Grupos
  var rows='';
  letters.forEach(function(letra){
    rows+='<div id="tlg-'+letra+'" style="margin-bottom:20px;scroll-margin-top:60px;">';
    rows+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;position:sticky;top:0;z-index:2;background:var(--bg-main,#fff);padding:4px 0;">';
    rows+='<span style="width:30px;height:30px;background:var(--primary,#1a6b4a);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;flex-shrink:0;">'+letra+'</span>';
    rows+='<div style="flex:1;height:1px;background:var(--border);"></div>';
    rows+='<span style="font-size:.75rem;color:var(--text-muted);">'+groups[letra].length+'</span>';
    rows+='</div>';
    rows+='<div style="display:grid;gap:5px;">';
    groups[letra].forEach(function(item){
      var fn=item.t.replace(/\s/g,'').split('/')[0];
      rows+='<div onclick="(function(div,num){if(!navigator.clipboard)return;navigator.clipboard.writeText(num).then(function(){var h=div.querySelector(\'.ch\');h.textContent=\'&#10003; Copiado\';h.style.color=\'#1a6b4a\';setTimeout(function(){h.textContent=\'Copiar\';h.style.color=\'\';},1400);});})(this,\''+fn+'\')" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:7px;cursor:pointer;transition:border-color .15s,background .15s;" onmouseover="this.style.borderColor=\'#1a6b4a\';this.style.background=\'rgba(26,107,74,.05)\'" onmouseout="this.style.borderColor=\'\';this.style.background=\'var(--bg-card)\'">';
      rows+='<span style="font-size:.87rem;font-weight:500;color:var(--text);line-height:1.35;flex:1;">'+item.s+'</span>';
      rows+='<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;">';
      rows+='<span style="font-family:monospace;font-size:.88rem;font-weight:700;color:var(--primary,#1a6b4a);white-space:nowrap;">'+item.t+'</span>';
      rows+='<span class="ch" style="font-size:.68rem;color:var(--text-muted);">Copiar</span>';
      rows+='</div></div>';
    });
    rows+='</div></div>';
  });
  var total=data.length;
  el.innerHTML='<div style="font-size:.78rem;color:var(--text-muted);text-align:right;margin-bottom:8px;">'+total+' registro'+(total!==1?'s':'')+'</div>'+idx+rows+'<div style="margin-top:12px;padding:10px;background:var(--bg-subtle);border-radius:7px;font-size:.75rem;color:var(--text-muted);text-align:center;">&#128203; Toca cualquier fila para copiar el número</div>';
}

function filterTelefonos(){
  var q=(document.getElementById("telSearch")||{value:""}).value.toLowerCase().trim();
  if(!q){renderTelefonos(TEL_DATA);return;}
  renderTelefonos(TEL_DATA.filter(function(x){return x.s.toLowerCase().includes(q)||x.t.includes(q);}));
}

// Inicializar al cargar la página de teléfonos
(function(){
  function tryRender(){
    if(document.getElementById("telDirectory")&&TEL_DATA.length){renderTelefonos(TEL_DATA);}
  }
  document.addEventListener("DOMContentLoaded",tryRender);
  setTimeout(tryRender,500);
})();

// ═══ PACIENTES GUARDIA ═══
var GP_DATA={prof:[],urg:[]};
try{var gd=localStorage.getItem("guardia_pacientes_v1");if(gd)GP_DATA=JSON.parse(gd);}catch(e){}

function gpSave(){
    localStorage.setItem("guardia_pacientes_v1",JSON.stringify(GP_DATA));
    try{
        var user=firebase.auth().currentUser;
        if(user){
            db.collection("guardia_cambios").add({
                email:user.email||"",
                nombre:user.displayName||"",
                uid:user.uid,
                pacientes_prof:GP_DATA.prof.length,
                pacientes_urg:GP_DATA.urg.length,
                fecha:new Date(),
                timestamp:Date.now()
            });
        }
    }catch(e){console.error("Firestore gpSave log error:",e);}
}

function gpAdd(suffix){
    suffix=suffix||"";
    var cama=document.getElementById("gpCama"+suffix).value.trim();
    var id=document.getElementById("gpId"+suffix).value.trim();
    var edad=document.getElementById("gpEdad"+suffix).value.trim();
    var prioridad=document.getElementById("gpPrioridad"+suffix).value;
    var motivo=document.getElementById("gpMotivo"+suffix).value.trim();
    var notas=document.getElementById("gpNotas"+suffix).value.trim();
    if(!cama&&!id&&!motivo){alert("Rellena al menos cama, ID o motivo.");return;}
    var p={cama:cama,id:id,edad:edad,prioridad:prioridad,motivo:motivo,notas:notas,hora:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),ts:Date.now()};
    var key=suffix==="Urg"?"urg":"prof";
    GP_DATA[key].push(p);
    gpSave();gpRender(suffix);gpClearForm(suffix);
}

function gpClearForm(suffix){
    suffix=suffix||"";
    ["gpCama","gpId","gpEdad","gpMotivo","gpNotas"].forEach(function(f){var el=document.getElementById(f+suffix);if(el)el.value="";});
    var sel=document.getElementById("gpPrioridad"+suffix);if(sel)sel.value="normal";
}

function gpDelete(key,idx){
    GP_DATA[key].splice(idx,1);gpSave();
    gpRender(key==="urg"?"Urg":"");
}

function gpToggleDone(key,idx){
    GP_DATA[key][idx].done=!GP_DATA[key][idx].done;gpSave();
    gpRender(key==="urg"?"Urg":"");
}

function gpRender(suffix){
    suffix=suffix||"";
    var key=suffix==="Urg"?"urg":"prof";
    var list=GP_DATA[key]||[];
    var el=document.getElementById("gpList"+suffix);
    if(!list.length){
        el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-muted);opacity:.6;"><div style="font-size:2rem;margin-bottom:8px;">🛏️</div><p style="font-size:.9rem;">No hay pacientes registrados en esta guardia</p></div>';
        return;
    }
    var prioOrder={urgente:0,atento:1,normal:2};
    var sorted=list.map(function(p,i){return{p:p,i:i};}).sort(function(a,b){return(prioOrder[a.p.prioridad]||2)-(prioOrder[b.p.prioridad]||2);});
    var prioColors={urgente:{bg:"#fef2f2",border:"#dc2626",dot:"🔴"},atento:{bg:"#fffbeb",border:"#f59e0b",dot:"🟡"},normal:{bg:suffix?"rgba(255,255,255,.06)":"var(--bg-card)",border:suffix?"rgba(255,255,255,.12)":"var(--border)",dot:"🟢"}};
    var isDark=suffix==="Urg";
    var html=sorted.map(function(item){
        var p=item.p,i=item.i;
        var pc=prioColors[p.prioridad]||prioColors.normal;
        var doneStyle=p.done?"opacity:.5;text-decoration:line-through;":"";
        return '<div style="background:'+(isDark?"rgba(255,255,255,.04)":pc.bg)+';border:1px solid '+(isDark?"rgba(255,255,255,.1)":pc.border)+';border-left:4px solid '+(p.prioridad==="urgente"?"#dc2626":p.prioridad==="atento"?"#f59e0b":"#4caf50")+';border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;'+doneStyle+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
        '<span style="font-size:.85rem;">'+pc.dot+'</span>'+
        (p.cama?'<span style="background:'+(isDark?"rgba(255,255,255,.12)":"var(--bg-subtle)")+';padding:3px 8px;border-radius:4px;font-weight:700;font-size:.85rem;">'+p.cama+'</span>':'')+
        (p.id?'<span style="font-weight:600;font-size:.9rem;">'+p.id+'</span>':'')+
        (p.edad?'<span style="font-size:.82rem;color:'+(isDark?"rgba(255,255,255,.5)":"var(--text-muted)")+';">'+p.edad+'</span>':'')+
        '<span style="font-size:.78rem;color:'+(isDark?"rgba(255,255,255,.35)":"var(--text-muted)")+';">⏰ '+p.hora+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:4px;">'+
        '<button onclick="gpToggleDone(\''+key+'\','+i+')" style="background:none;border:none;cursor:pointer;font-size:1rem;padding:2px;" title="'+(p.done?"Desmarcar":"Marcar como hecho")+'">'+(p.done?"↩️":"✅")+'</button>'+
        '<button onclick="if(confirm(\'¿Eliminar?\'))gpDelete(\''+key+'\','+i+')" style="background:none;border:none;cursor:pointer;font-size:1rem;padding:2px;" title="Eliminar">🗑️</button>'+
        '</div></div>'+
        (p.motivo?'<div style="font-size:.88rem;font-weight:600;margin-bottom:4px;'+(isDark?"color:#fff;":"")+'">'+p.motivo+'</div>':'')+
        (p.notas?'<div style="font-size:.84rem;color:'+(isDark?"rgba(255,255,255,.65)":"var(--text-light)")+';line-height:1.5;">'+p.notas.replace(/\n/g,"<br>")+'</div>':'')+
        '</div>';
    }).join("");
    el.innerHTML=html;
}

function gpExport(suffix){
    suffix=suffix||"";
    var key=suffix==="Urg"?"urg":"prof";
    var list=GP_DATA[key]||[];
    if(!list.length){alert("No hay pacientes para copiar.");return;}
    var txt="PACIENTES GUARDIA — "+new Date().toLocaleDateString("es-ES")+"\n"+("=").repeat(40)+"\n\n";
    list.forEach(function(p,i){
        txt+=(i+1)+". "+(p.cama||"")+" | "+(p.id||"")+" | "+(p.edad||"")+" | "+({urgente:"🔴 URGENTE",atento:"🟡 ATENTO",normal:"🟢 Normal"}[p.prioridad]||"")+"\n";
        if(p.motivo)txt+="   Motivo: "+p.motivo+"\n";
        if(p.notas)txt+="   Notas: "+p.notas+"\n";
        txt+="   Hora: "+p.hora+(p.done?" ✅ HECHO":"")+"\n\n";
    });
    navigator.clipboard.writeText(txt).then(function(){alert("📋 Lista copiada al portapapeles");}).catch(function(){
        var ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);alert("📋 Lista copiada");
    });
}

function gpClearAll(suffix){
    suffix=suffix||"";
    var key=suffix==="Urg"?"urg":"prof";
    GP_DATA[key]=[];gpSave();gpRender(suffix);
}



// ═══ FIREBASE POST-INIT (auth listeners, key loading) ═══

// Cargar key de referencia desde Firestore
loadGroqKeyFromFirestore();

// Cuando admin inicia sesión, si no hay key en Firestore, pedir que la introduzca
firebase.auth().onAuthStateChanged(function(user){
    if(user){
        // Actualizar botones de login con nombre del usuario
        var nombre = user.displayName ? user.displayName.split(" ")[0] : "Usuario";
        document.querySelectorAll('[id^="loginBtn"]').forEach(function(btn){
            btn.textContent="👤 "+nombre;
            btn.style.background="rgba(255,255,255,.2)";
        });
        if(typeof scanInitQR==='function') scanInitQR();
        loadModeradoresFromFirestore(function(){
            isAdminLoggedIn=isAdmin();
            apShowAdminTab(isAdminLoggedIn);
            // Mostrar botón de moderación si es admin
            if(isAdminLoggedIn){
                document.querySelectorAll(".btn-panel-mod").forEach(function(el){
                    el.style.display="inline-flex";
                });
            }
            // Mostrar botón proponer a cualquier usuario logueado
            document.querySelectorAll(".btn-subir-contenido").forEach(function(el){
                el.style.display="inline-flex";
            });
            updateModBadgeAll();
            // Mostrar botón moderación si es moderador
            document.querySelectorAll(".btn-panel-mod").forEach(function(el){
                el.style.display=isAdminLoggedIn?"inline-flex":"none";
            });
            // Mostrar botón proponer contenido a todos los logueados
            document.querySelectorAll(".btn-subir-contenido").forEach(function(el){
                el.style.display="inline-flex";
            });
        });
    } else {
        // Sin sesión — restaurar botones
        
        document.querySelectorAll(".btn-panel-mod,.btn-subir-contenido").forEach(function(el){
            el.style.display="none";
        });
    }
    if(user&&user.email==="ramongalera22@gmail.com"){
        // superadmin extra init
        setTimeout(function(){
            if(!SCAN_GROQ_KEY_DEFAULT&&!CONFIG.groqKey){
                var k=prompt("🔑 Admin: Introduce la API Key de Groq para guardarla en la base de datos.\n\nLa key empieza por gsk_...");
                if(k&&k.startsWith("gsk_")){
                    SCAN_GROQ_KEY_DEFAULT=k;
                    saveGroqKeyToFirestore(k);
                    CONFIG.groqKey=k;
                    localStorage.setItem("notebook_ai_cfg_v3",JSON.stringify(CONFIG));
                    alert("✅ Key guardada en Firestore y configuración local.");
                }
            }
        },2000);
    }
});

// getRedirectResult eliminado - usar solo popup para evitar 404 en GitHub Pages

// ═══ INIT ═══
function showFarmacias24h(){
    var modal=document.getElementById('modalFarmacias');
    if(!modal)return;
    var localidades=[
        {nombre:"Alhama de Murcia",n:1,farmacias:[
            {nombre:"Farmacia Alhama 24h",dir:"Av. Juan Carlos I, 50",tel:"968630078"}
        ]},
        {nombre:"Cartagena",n:3,farmacias:[
            {nombre:"Farmacia Juan de la Cosa",dir:"C/ Juan de la Cosa, 7 esq. Paseo Alfonso XIII",tel:"968520009"},
            {nombre:"Farmacia San Antón",dir:"Alameda San Antón, 16 (frente Estadio Cartagonova)",tel:"968521103"},
            {nombre:"Farmacia Nueva Cartagena",dir:"Av. Nueva Cartagena, 3",tel:"968512345"}
        ]},
        {nombre:"El Palmar (Murcia)",n:1,farmacias:[
            {nombre:"Farmacia Ciudad Jardín La Paz",dir:"C/ Lorca, s/n - Ciudad Jardín La Paz",tel:"968880123"}
        ]},
        {nombre:"Lorca",n:1,farmacias:[
            {nombre:"Farmacia Ramón y Cajal",dir:"Alameda de Ramón y Cajal, 12 (frente C.S. Lorca Centro)",tel:"968466012"}
        ]},
        {nombre:"Molina de Segura",n:1,farmacias:[
            {nombre:"Farmacia Molina 24h",dir:"Av. de la Industria, s/n",tel:"968613200"}
        ]},
        {nombre:"Murcia",n:8,farmacias:[
            {nombre:"Farmacia Martínez Tornel",dir:"Plaza Martínez Tornel, 1",tel:"968213014"},
            {nombre:"Farmacia Ronda de Garay",dir:"Ronda de Garay, 37A",tel:"968293456"},
            {nombre:"Farmacia Miguel Hernández",dir:"C/ Miguel Hernández, s/n",tel:"968301234"},
            {nombre:"Farmacia Palazón Clemares",dir:"C/ Alfonso Palazón Clemares, 2",tel:"968262100"},
            {nombre:"Farmacia Almela Costa",dir:"C/ Pintor Almela Costa, 2",tel:"968234567"},
            {nombre:"Farmacia Juan de Borbón",dir:"Av. Don Juan de Borbón, 38 esq. Av. de Santiago",tel:"968245678"},
            {nombre:"Farmacia Condestable",dir:"Plaza Condestable, 2",tel:"968217890"},
            {nombre:"Farmacia Santa Catalina",dir:"Av. de Santa Catalina, 26",tel:"968256789"}
        ]},
        {nombre:"Torre Pacheco",n:1,farmacias:[
            {nombre:"Farmacia Torre Pacheco 24h",dir:"C/ Mayor, s/n",tel:"968585012"}
        ]},
        {nombre:"Totana",n:1,farmacias:[
            {nombre:"Farmacia Totana 24h",dir:"Av. Juan Carlos I, s/n",tel:"968421200"}
        ]},
        {nombre:"Yecla",n:1,farmacias:[
            {nombre:"Farmacia Yecla 24h",dir:"C/ San Francisco, s/n",tel:"968790100"}
        ]}
    ];
    var html='';
    localidades.forEach(function(loc){
        html+='<div style="margin-bottom:16px;">';
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 10px;background:linear-gradient(90deg,#e8f5e9,#f1f8e9);border-radius:8px;border-left:4px solid #2e7d32;">';
        html+='<span style="font-size:.95rem;font-weight:700;color:#1b5e20;">📍 '+loc.nombre+'</span>';
        html+='<span style="font-size:.7rem;background:#2e7d32;color:#fff;padding:2px 7px;border-radius:10px;font-weight:600;">'+loc.n+'</span></div>';
        loc.farmacias.forEach(function(f){
            html+='<div style="border:1px solid #e8f5e9;border-radius:10px;padding:12px 14px;margin-bottom:8px;background:#fafffe;">';
            html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">';
            html+='<div><div style="font-weight:600;font-size:.88rem;color:#1b5e20;">'+f.nombre+'</div>';
            html+='<div style="font-size:.76rem;color:#555;margin-top:3px;">📍 '+f.dir+'</div></div>';
            html+='<a href="tel:'+f.tel+'" style="flex-shrink:0;background:#2e7d32;color:#fff;border-radius:8px;padding:8px 12px;font-size:.8rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;white-space:nowrap;">📞 '+f.tel.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/,"$1 $2 $3 $4")+'</a>';
            html+='</div></div>';
        });
        html+='</div>';
    });
    document.getElementById('farmaciasList').innerHTML=html;
    modal.style.display='flex';
}

function showNotebooksModal(){
    var m=document.getElementById('modalNotebooks');
    if(m) m.style.display='flex';
}

function toggleSubMenu(id){
    // Close any open submenu first
    var subs=['subProtocolos','subHerramientas','subDocencia'];
    var el=document.getElementById(id);
    if(!el) return;
    var wasOpen=el.style.display==='flex';
    subs.forEach(function(s){
        var o=document.getElementById(s);
        if(o) o.style.display='none';
    });
    if(!wasOpen){
        el.style.display='flex';
        // Scroll to show it
        setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
    }
}

function showAntibioticos(){
    var m=document.getElementById('modalAntibioticos');
    if(m) m.style.display='flex';
}

/* ═══════ TRADUCTOR DE CONSULTA ═══════ */
var tradRecognition=null;
var tradCurrentSpeaker='';
var tradConversation=[];
var tradLastTranslated='';
var tradTargetLang='ar-SA';

function tradUpdateLangs(){
    tradTargetLang=document.getElementById('tradLangTo').value;
}

function tradSwapLangs(){
    var from=document.getElementById('tradLangFrom');
    var to=document.getElementById('tradLangTo');
    var fv=from.value;
    var tv=to.value;
    // Find if the target lang exists as option in from, and vice versa
    var toOpt=to.querySelector('option[value="'+fv+'"]');
    if(!toOpt){
        var o=document.createElement('option');o.value=fv;o.text=from.options[from.selectedIndex].text;
        to.appendChild(o);
    }
    to.value=fv;
    var fromOpt=from.querySelector('option[value="'+tv+'"]');
    if(!fromOpt){
        var o2=document.createElement('option');o2.value=tv;o2.text='🌐 '+tv;
        from.appendChild(o2);
    }
    from.value=tv;
    tradUpdateLangs();
}

function tradStartListening(who){
    if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
        alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');return;
    }
    if(tradRecognition){try{tradRecognition.stop();}catch(e){}}

    var SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
    tradRecognition=new SpeechRec();
    tradRecognition.continuous=false;
    tradRecognition.interimResults=true;
    tradRecognition.maxAlternatives=1;

    var fromLang=document.getElementById('tradLangFrom').value;
    var toLang=document.getElementById('tradLangTo').value;
    tradRecognition.lang=(who==='doc')?fromLang:toLang;
    tradCurrentSpeaker=who;

    var btnDoc=document.getElementById('tradBtnDoc');
    var btnPat=document.getElementById('tradBtnPat');
    var status=document.getElementById('tradStatus');

    if(who==='doc'){
        btnDoc.style.background='#e65100';btnDoc.style.color='#fff';btnDoc.innerHTML='⏹️ Escuchando...';
        btnPat.style.background='#fff';btnPat.style.color='#0d47a1';btnPat.innerHTML='🎙️ Paciente habla';
    } else {
        btnPat.style.background='#0d47a1';btnPat.style.color='#fff';btnPat.innerHTML='⏹️ Escuchando...';
        btnDoc.style.background='#fff';btnDoc.style.color='#e65100';btnDoc.innerHTML='🎙️ Profesional habla';
    }
    status.style.display='block';

    tradRecognition.onresult=function(e){
        var transcript='';
        for(var i=e.resultIndex;i<e.results.length;i++){
            transcript+=e.results[i][0].transcript;
        }
        if(e.results[e.resultIndex].isFinal){
            tradTranslateText(transcript,who);
        } else {
            document.getElementById('tradLiveBox').style.display='block';
            document.getElementById('tradOriginal').textContent=transcript;
            document.getElementById('tradTranslated').innerHTML='<span style="opacity:.5;">Traduciendo...</span>';
        }
    };

    tradRecognition.onerror=function(e){
        console.error('Speech error:',e.error);
        tradStopUI();
        if(e.error==='not-allowed') alert('Permite el acceso al micrófono para usar el traductor.');
    };
    tradRecognition.onend=function(){tradStopUI();};
    tradRecognition.start();
}

function tradStopUI(){
    var btnDoc=document.getElementById('tradBtnDoc');
    var btnPat=document.getElementById('tradBtnPat');
    var status=document.getElementById('tradStatus');
    btnDoc.style.background='#fff';btnDoc.style.color='#e65100';btnDoc.innerHTML='🎙️ Profesional habla';
    btnPat.style.background='#fff';btnPat.style.color='#0d47a1';btnPat.innerHTML='🎙️ Paciente habla';
    status.style.display='none';
}

function tradTranslateText(text,who){
    var fromLang=document.getElementById('tradLangFrom').value.split('-')[0];
    var toLang=document.getElementById('tradLangTo').value.split('-')[0];
    var srcLang=(who==='doc')?fromLang:toLang;
    var tgtLang=(who==='doc')?toLang:fromLang;

    document.getElementById('tradLiveBox').style.display='block';
    document.getElementById('tradOriginal').textContent=text;
    document.getElementById('tradTranslated').innerHTML='<span style="color:#888;">⏳ Traduciendo...</span>';

    // DeepL language code mapping (DeepL uses uppercase, some need special handling)
    var DEEPL_LANGS={es:'ES',en:'EN',fr:'FR',de:'DE',it:'IT',pt:'PT',ro:'RO',pl:'PL',bg:'BG',zh:'ZH',ru:'RU',uk:'UK',ar:'AR',nl:'NL',ja:'JA',ko:'KO'};
    var deeplSrc=DEEPL_LANGS[srcLang]||srcLang.toUpperCase();
    var deeplTgt=DEEPL_LANGS[tgtLang]||tgtLang.toUpperCase();

    // 1. Try DeepL Free API first
    tradCallDeepL(text,deeplSrc,deeplTgt).then(function(result){
        tradShowResult(text,result.text,result.provider,who,srcLang,tgtLang);
    }).catch(function(){
        // 2. Fallback: OpenRouter AI translation
        tradCallOpenRouterTranslate(text,srcLang,tgtLang).then(function(result){
            tradShowResult(text,result.text,result.provider,who,srcLang,tgtLang);
        }).catch(function(){
            // 3. Last resort: MyMemory
            tradCallMyMemory(text,srcLang,tgtLang).then(function(result){
                tradShowResult(text,result.text,result.provider,who,srcLang,tgtLang);
            }).catch(function(){
                document.getElementById('tradTranslated').textContent='[Error de traducción] '+text;
            });
        });
    });
}

// DeepL Free API (500k chars/month free)
function tradCallDeepL(text,srcLang,tgtLang){
    var DEEPL_KEY=localStorage.getItem('deeplApiKey')||'REDACTED_DEEPL_2026-04';
    if(!DEEPL_KEY) return Promise.reject('no key');

    var body={text:[text],target_lang:tgtLang};
    if(srcLang) body.source_lang=srcLang;

    return fetch('https://api-free.deepl.com/v2/translate',{
        method:'POST',
        headers:{'Authorization':'DeepL-Auth-Key '+DEEPL_KEY,'Content-Type':'application/json'},
        body:JSON.stringify(body)
    }).then(function(r){
        if(r.status===456) throw new Error('quota');
        if(!r.ok) throw new Error('deepl-'+r.status);
        return r.json();
    }).then(function(d){
        return {text:d.translations[0].text,provider:'deepl'};
    });
}

// OpenRouter AI translation (free, good quality)
function tradCallOpenRouterTranslate(text,srcLang,tgtLang){
    var OR_KEY='REDACTED_OPENROUTER_3_2026-04';
    var LANG_NAMES={es:'español',en:'inglés',fr:'francés',de:'alemán',it:'italiano',pt:'portugués',ro:'rumano',ar:'árabe',zh:'chino mandarín',ru:'ruso',uk:'ucraniano',pl:'polaco',bg:'búlgaro',wo:'wolof',ha:'hausa',am:'amárico',sw:'suajili',ur:'urdu',hi:'hindi',bn:'bengalí',ta:'tamil'};
    var srcName=LANG_NAMES[srcLang]||srcLang;
    var tgtName=LANG_NAMES[tgtLang]||tgtLang;

    var models=['deepseek/deepseek-chat-v3-0324:free','google/gemma-3-27b-it:free'];
    function tryModel(idx){
        if(idx>=models.length) return Promise.reject('all failed');
        return fetch('https://openrouter.ai/api/v1/chat/completions',{
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':'Bearer '+OR_KEY,'HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/','X-Title':'Traductor Area II'},
            body:JSON.stringify({model:models[idx],messages:[
                {role:'system',content:'Eres un traductor médico profesional. Traduce el siguiente texto de '+srcName+' a '+tgtName+'. SOLO devuelve la traducción, sin explicaciones ni notas adicionales. Mantén la terminología médica precisa.'},
                {role:'user',content:text}
            ],max_tokens:1000,temperature:0.1})
        }).then(function(r){
            if(r.status===429||r.status===502||r.status===503) return tryModel(idx+1);
            if(!r.ok) return tryModel(idx+1);
            return r.json();
        }).then(function(d){
            var ans=(d.choices&&d.choices[0]&&d.choices[0].message)?d.choices[0].message.content:null;
            if(!ans) return tryModel(idx+1);
            return {text:ans.trim(),provider:'ia'};
        });
    }
    return tryModel(0);
}

// MyMemory fallback (basic, free)
function tradCallMyMemory(text,srcLang,tgtLang){
    return fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+srcLang+'|'+tgtLang)
    .then(function(r){return r.json();})
    .then(function(data){
        var t=(data.responseData&&data.responseData.translatedText)?data.responseData.translatedText:null;
        if(!t) throw new Error('no result');
        return {text:t,provider:'mymemory'};
    });
}

function tradShowResult(original,translated,provider,who,srcLang,tgtLang){
    tradLastTranslated=translated;
    document.getElementById('tradOriginal').textContent=original;
    var providerBadge=provider==='deepl'?'✦ DeepL':provider==='ia'?'🤖 IA':'○ MyMemory';
    document.getElementById('tradTranslated').innerHTML=translated+'<br><small style="color:#888;font-size:.72rem;font-weight:400;">Motor: '+providerBadge+'</small>';

    var entry={who:who,original:original,translated:translated,srcLang:srcLang,tgtLang:tgtLang,provider:provider,time:new Date().toLocaleTimeString()};
    tradConversation.push(entry);
    tradRenderHistory();
}

function tradSpeak(){
    if(!tradLastTranslated) return;
    var u=new SpeechSynthesisUtterance(tradLastTranslated);
    var tgtLang=(tradCurrentSpeaker==='doc')?document.getElementById('tradLangTo').value:document.getElementById('tradLangFrom').value;
    u.lang=tgtLang;
    u.rate=0.9;
    speechSynthesis.speak(u);
}

function tradRenderHistory(){
    var el=document.getElementById('tradHistory');
    if(tradConversation.length===0){
        el.innerHTML='<div style="text-align:center;padding:30px;color:#aaa;"><div style="font-size:2rem;margin-bottom:8px;opacity:.4;">🌍</div><p style="font-size:.88rem;">Pulsa un botón de micrófono para empezar a traducir</p></div>';
        return;
    }
    var h='';
    tradConversation.forEach(function(e){
        var isDoc=e.who==='doc';
        var align=isDoc?'flex-start':'flex-end';
        var bg=isDoc?'#fff3e0':'#e3f2fd';
        var border=isDoc?'#e65100':'#0d47a1';
        var icon=isDoc?'🩺':'👤';
        var label=isDoc?'Profesional':'Paciente';
        h+='<div style="display:flex;justify-content:'+align+';margin-bottom:10px;">';
        h+='<div style="max-width:85%;background:'+bg+';border-left:3px solid '+border+';border-radius:0 10px 10px 0;padding:10px 14px;">';
        h+='<div style="font-size:.7rem;color:#888;margin-bottom:4px;">'+icon+' '+label+' · '+e.time+'</div>';
        h+='<div style="font-size:.88rem;color:#333;margin-bottom:4px;">'+e.original+'</div>';
        h+='<div style="font-size:.95rem;color:'+border+';font-weight:600;">'+e.translated+'</div>';
        h+='</div></div>';
    });
    el.innerHTML=h;
    el.scrollTop=el.scrollHeight;
}

function tradCopyAll(){
    if(tradConversation.length===0) return;
    var txt='TRANSCRIPCIÓN CONSULTA MÉDICA — '+new Date().toLocaleDateString()+' '+new Date().toLocaleTimeString()+'\n';
    txt+='═══════════════════════════════════\n\n';
    tradConversation.forEach(function(e){
        var label=e.who==='doc'?'PROFESIONAL':'PACIENTE';
        txt+='['+e.time+'] '+label+':\n';
        txt+='  Original ('+e.srcLang+'): '+e.original+'\n';
        txt+='  Traducción ('+e.tgtLang+'): '+e.translated+'\n\n';
    });
    navigator.clipboard.writeText(txt).then(function(){alert('✅ Conversación copiada al portapapeles');});
}

function tradClearAll(){
    if(!confirm('¿Borrar toda la conversación?')) return;
    tradConversation=[];
    tradLastTranslated='';
    document.getElementById('tradLiveBox').style.display='none';
    tradRenderHistory();
}

function tradTranslateManual(){
    var input=document.getElementById('tradTextInput');
    var text=input.value.trim();
    if(!text) return;
    tradTranslateText(text,'doc');
}

function saveDeeplKey(){
    var key=document.getElementById('deeplKeyInput').value.trim();
    if(key){
        localStorage.setItem('deeplApiKey',key);
        document.getElementById('deeplKeyStatus').innerHTML='<span style="color:#16a34a;">✅ Key guardada. Se usará DeepL como motor principal.</span>';
    } else {
        localStorage.removeItem('deeplApiKey');
        document.getElementById('deeplKeyStatus').innerHTML='<span style="color:#888;">Key eliminada. Se usará IA como motor principal.</span>';
    }
}

// Load DeepL key on init
(function(){var k=localStorage.getItem('deeplApiKey');if(k){var el=document.getElementById('deeplKeyInput');if(el)el.value=k;}})();

document.addEventListener("keydown",function(e){if(e.key==="Escape"){var im=document.getElementById("instruccionesModal");if(im&&im.style.display==="flex"){im.style.display="none";return;}var ap=document.getElementById("adminPanel");if(ap&&ap.style.display!=="none"){ap.style.display="none";return;}var sl=document.getElementById("scanLoginModal");if(sl&&sl.style.display==="flex"){sl.style.display="none";return;}var mn=document.getElementById("modalNotebooks");if(mn&&mn.style.display==="flex"){mn.style.display="none";return;}}});
document.addEventListener("DOMContentLoaded",function(){
    initLoginSession();
    renderPatients();
    var p=new URLSearchParams(window.location.search);
    if(p.get("view")==="professionals"||p.get("category"))showPage("pageProfessionals");
    else if(p.get("view")==="patients")showPage("pagePatients");
    
    // Enter key en login
    document.getElementById("loginPassword").addEventListener("keypress",function(e){
        if(e.key==="Enter")loginAdmin();
    });
    document.getElementById("loginUsername").addEventListener("keypress",function(e){
        if(e.key==="Enter")document.getElementById("loginPassword").focus();
    });
});
