// ═══ ESCALAS CLÍNICAS — Área II Cartagena ═══
// Fine/PORT, PESI, BODE, CRB-65, BAP-65, Wood-Downes-Ferrés, Taussig, DECAF, CAUDA-70, VNI fracaso

// ── 1. FINE / PORT (PSI) — Neumonía ──
function calcFine(){
    var age=parseInt(document.getElementById('fineAge').value)||0;
    var sex=document.getElementById('fineSex').value;
    var pts=age;
    if(sex==='F') pts-=10;
    // Comorbilidades
    document.querySelectorAll('.fine-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    // Exploración
    document.querySelectorAll('.fine-exp').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    // Laboratorio
    document.querySelectorAll('.fine-lab').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('fineResult');
    var clase,txt,bg,fg;
    if(pts<=50){clase='I';txt='Bajo riesgo — Mortalidad 0.1% — Ambulatorio';bg='#f0fdf4';fg='#166534';}
    else if(pts<=70){clase='II';txt='Bajo riesgo — Mortalidad 0.6% — Ambulatorio';bg='#f0fdf4';fg='#166534';}
    else if(pts<=90){clase='III';txt='Riesgo bajo-moderado — Mortalidad 0.9-2.8% — Observación breve';bg='#fefce8';fg='#854d0e';}
    else if(pts<=130){clase='IV';txt='Riesgo moderado — Mortalidad 8.2-9.3% — Ingreso';bg='#fff7ed';fg='#9a3412';}
    else{clase='V';txt='Alto riesgo — Mortalidad 27-31% — Ingreso/UCI';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>PORT/PSI: '+pts+' puntos — Clase '+clase+'</strong><br>'+txt;
}

// ── 2. PESI — Embolismo Pulmonar ──
function calcPESI(){
    var age=parseInt(document.getElementById('pesiAge').value)||0;
    var pts=age;
    document.querySelectorAll('.pesi-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('pesiResult');
    var clase,txt,bg,fg;
    if(pts<=65){clase='I';txt='Muy bajo riesgo — Mortalidad 30d: 0-1.6%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=85){clase='II';txt='Bajo riesgo — Mortalidad 30d: 1.7-3.5%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=105){clase='III';txt='Riesgo intermedio — Mortalidad 30d: 3.2-7.1%';bg='#fefce8';fg='#854d0e';}
    else if(pts<=125){clase='IV';txt='Alto riesgo — Mortalidad 30d: 4-11.4%';bg='#fff7ed';fg='#9a3412';}
    else{clase='V';txt='Muy alto riesgo — Mortalidad 30d: 10-24.5%';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>PESI: '+pts+' puntos — Clase '+clase+'</strong><br>'+txt;
}

// ── 3. Índice BODE — EPOC ──
function calcBODE(){
    var b=parseInt(document.getElementById('bodeFEV1').value)||0;
    var o=parseInt(document.getElementById('bode6MWT').value)||0;
    var d=parseInt(document.getElementById('bodeMRC').value)||0;
    var e=parseInt(document.getElementById('bodeBMI').value)||0;
    var pts=b+o+d+e;
    var el=document.getElementById('bodeResult');
    var txt,bg,fg;
    if(pts<=2){txt='Cuartil 1 — Supervivencia 4 años ~80%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=4){txt='Cuartil 2 — Supervivencia 4 años ~67%';bg='#fefce8';fg='#854d0e';}
    else if(pts<=6){txt='Cuartil 3 — Supervivencia 4 años ~57%';bg='#fff7ed';fg='#9a3412';}
    else{txt='Cuartil 4 — Supervivencia 4 años ~18%';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>BODE: '+pts+'/10</strong><br>'+txt;
}

// ── 4. CRB-65 — Neumonía comunitaria (sin analítica) ──
function calcCRB65(){
    var pts=[...document.querySelectorAll('.crb65-chk')].filter(c=>c.checked).length;
    var el=document.getElementById('crb65Result');
    var info=['Bajo riesgo — Ambulatorio','Riesgo intermedio — Valorar ingreso','Alto riesgo — Ingreso urgente','Muy alto riesgo — UCI','Muy alto riesgo — UCI'];
    var colors=['#f0fdf4,#166534','#fefce8,#854d0e','#fff7ed,#9a3412','#fef2f2,#991b1b','#fef2f2,#991b1b'];
    var c=colors[pts].split(',');el.style.background=c[0];el.style.color=c[1];
    el.textContent='CRB-65: '+pts+'/4 — '+info[pts];
}

// ── 5. BAP-65 — Exacerbación EPOC ──
function calcBAP65(){
    var pts=0;
    document.querySelectorAll('.bap65-chk').forEach(function(c){if(c.checked)pts+=1;});
    var age65=document.getElementById('bap65Age').checked?1:0;
    pts+=age65;
    var el=document.getElementById('bap65Result');
    var clase,txt,bg,fg;
    if(pts===0){clase='I';txt='Mortalidad 0.3% — Ambulatorio';bg='#f0fdf4';fg='#166534';}
    else if(pts===1){clase='II';txt='Mortalidad 1% — Observación';bg='#fefce8';fg='#854d0e';}
    else if(pts===2){clase='III';txt='Mortalidad 2.2% — Ingreso';bg='#fff7ed';fg='#9a3412';}
    else if(pts===3){clase='IV';txt='Mortalidad 6.4% — Ingreso/UCI';bg='#fef2f2';fg='#991b1b';}
    else{clase='V';txt='Mortalidad 14.1% — UCI';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>BAP-65: Clase '+clase+'</strong><br>'+txt;
}

// ── 6. Wood-Downes-Ferrés — Bronquiolitis ──
function calcWoodDownes(){
    var ids=['wdSibilancias','wdTiraje','wdEntrada','wdCianosis','wdFR','wdFC'];
    var pts=ids.reduce(function(s,id){return s+(parseInt(document.getElementById(id).value)||0);},0);
    var el=document.getElementById('wdResult');
    var txt,bg,fg;
    if(pts<=3){txt='Leve — Observación domiciliaria';bg='#f0fdf4';fg='#166534';}
    else if(pts<=7){txt='Moderada — Observación hospitalaria';bg='#fefce8';fg='#854d0e';}
    else if(pts<=10){txt='Grave — Ingreso + O2';bg='#fff7ed';fg='#9a3412';}
    else{txt='Muy grave — UCI pediátrica';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Wood-Downes-Ferrés: '+pts+'/14</strong><br>'+txt;
}

// ── 7. Taussig Score — Valoración del Crup ──
function calcTaussig(){
    var ids=['taussigEstridor','taussigTiraje','taussigEntrada','taussigColor','taussigConciencia'];
    var pts=ids.reduce(function(s,id){return s+(parseInt(document.getElementById(id).value)||0);},0);
    var el=document.getElementById('taussigResult');
    var txt,bg,fg;
    if(pts<=6){txt='Leve — Tratamiento ambulatorio';bg='#f0fdf4';fg='#166534';}
    else if(pts<=8){txt='Moderado — Observación + dexametasona';bg='#fefce8';fg='#854d0e';}
    else{txt='Grave — Adrenalina nebulizada + ingreso';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Taussig: '+pts+'/15</strong><br>'+txt;
}

// ── 8. DECAF Score — Mortalidad EPOC agudizada ──
function calcDECAF(){
    var pts=0;
    document.querySelectorAll('.decaf-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('decafResult');
    var txt,bg,fg;
    if(pts===0){txt='Mortalidad intrahospitalaria ~1.4%';bg='#f0fdf4';fg='#166534';}
    else if(pts===1){txt='Mortalidad ~5.2%';bg='#fefce8';fg='#854d0e';}
    else if(pts===2){txt='Mortalidad ~12.4%';bg='#fff7ed';fg='#9a3412';}
    else if(pts===3){txt='Mortalidad ~24.4%';bg='#fef2f2';fg='#991b1b';}
    else{txt='Mortalidad >34% — Cuidados intensivos';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>DECAF: '+pts+'/6</strong><br>'+txt;
}

// ── 9. CAUDA-70 — Mortalidad intrahospitalaria agudización EPOC ──
function calcCAUDA70(){
    var pts=0;
    document.querySelectorAll('.cauda-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('cauda70Result');
    var txt,bg,fg;
    if(pts<=1){txt='Bajo riesgo — Mortalidad ~2%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=3){txt='Riesgo intermedio — Mortalidad ~15%';bg='#fefce8';fg='#854d0e';}
    else if(pts<=5){txt='Alto riesgo — Mortalidad ~30%';bg='#fff7ed';fg='#9a3412';}
    else{txt='Muy alto riesgo — Mortalidad >50%';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>CAUDA-70: '+pts+'</strong><br>'+txt;
}

// ── 10. Riesgo fracaso VNI en EPOC ──
function calcVNIFracaso(){
    var pts=0;
    document.querySelectorAll('.vni-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('vniResult');
    var txt,bg,fg;
    if(pts<=2){txt='Bajo riesgo de fracaso VNI';bg='#f0fdf4';fg='#166534';}
    else if(pts<=4){txt='Riesgo moderado de fracaso — Monitorización estrecha';bg='#fefce8';fg='#854d0e';}
    else{txt='Alto riesgo de fracaso — Valorar IOT precoz';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Riesgo fracaso VNI: '+pts+'</strong><br>'+txt;
}

// ── 11. Escala de Pisa — Riesgo TEP con Rx Tórax ──
function calcPisa(){
    var pts=0;
    document.querySelectorAll('.pisa-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('pisaResult');
    var txt,bg,fg;
    if(pts<=20){txt='Baja probabilidad clínica de TEP';bg='#f0fdf4';fg='#166534';}
    else if(pts<=80){txt='Probabilidad intermedia — D-dímero + angioTC';bg='#fefce8';fg='#854d0e';}
    else{txt='Alta probabilidad — AngioTC urgente';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Pisa: '+pts+'%</strong><br>'+txt;
}

// ═══ ESCALAS ADICIONALES — Bloque 2 ═══

// ── 12. HEART Score — Dolor torácico ──
function calcHEART(){
    var pts=0;
    document.querySelectorAll('.heart-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('heartResult');
    var txt,bg,fg;
    if(pts<=3){txt='Bajo riesgo (1.7%) — Alta con seguimiento ambulatorio';bg='#f0fdf4';fg='#166534';}
    else if(pts<=6){txt='Riesgo moderado (12%) — Observación + troponina seriada';bg='#fefce8';fg='#854d0e';}
    else{txt='Alto riesgo (65%) — Ingreso + cardio urgente';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>HEART: '+pts+'/10</strong><br>'+txt;
}

// ── 13. CHA₂DS₂-VASc — Riesgo ictus en FA ──
function calcCHADS(){
    var pts=0;
    document.querySelectorAll('.chads-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('chadsResult');
    var txt,bg,fg;
    if(pts===0){txt='Bajo riesgo — No anticoagular';bg='#f0fdf4';fg='#166534';}
    else if(pts===1){txt='Riesgo intermedio — Considerar anticoagulación';bg='#fefce8';fg='#854d0e';}
    else{txt='Alto riesgo ('+[0,1.3,2.2,3.2,4.0,6.7,9.8,9.6,6.7,15.2][Math.min(pts,9)]+'%/año) — Anticoagular';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>CHA₂DS₂-VASc: '+pts+'/9</strong><br>'+txt;
}

// ── 14. HAS-BLED — Riesgo hemorrágico ──
function calcHASBLED(){
    var pts=[...document.querySelectorAll('.hasbled-chk')].filter(c=>c.checked).length;
    var el=document.getElementById('hasbResult');
    var txt,bg,fg;
    if(pts<=2){txt='Bajo riesgo hemorrágico — Anticoagulación segura';bg='#f0fdf4';fg='#166534';}
    else{txt='Alto riesgo hemorrágico — Precaución, no contraindica ACO pero monitorizar';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>HAS-BLED: '+pts+'/9</strong><br>'+txt;
}

// ── 15. NEWS2 — Early Warning Score ──
function calcNEWS2(){
    var pts=0;
    document.querySelectorAll('.news2-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('news2Result');
    var txt,bg,fg;
    if(pts<=4){txt='Bajo riesgo — Monitorización habitual';bg='#f0fdf4';fg='#166534';}
    else if(pts<=6){txt='Riesgo medio — Valoración urgente por médico';bg='#fefce8';fg='#854d0e';}
    else{txt='Alto riesgo — Activar equipo de respuesta rápida';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>NEWS2: '+pts+'</strong><br>'+txt;
}

// ── 16. SOFA — Sequential Organ Failure Assessment ──
function calcSOFA(){
    var pts=0;
    document.querySelectorAll('.sofa-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('sofaResult');
    var mort=[0,0,6.4,20.2,21.5,33.3,50,71.4,71.4,80,80,90,95,95,95,95,95,95,95,95,95,95,100,100,100];
    var m=mort[Math.min(pts,23)]||0;
    var txt,bg,fg;
    if(pts<=5){txt='Mortalidad ~'+m+'%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=10){txt='Mortalidad ~'+m+'%';bg='#fefce8';fg='#854d0e';}
    else if(pts<=15){txt='Mortalidad ~'+m+'%';bg='#fff7ed';fg='#9a3412';}
    else{txt='Mortalidad ~'+m+'%';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>SOFA: '+pts+'/24</strong><br>'+txt;
}

// ── 17. Glasgow-Blatchford — Hemorragia digestiva alta ──
function calcBlatchford(){
    var pts=0;
    document.querySelectorAll('.blatch-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    document.querySelectorAll('.blatch-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('blatchResult');
    var txt,bg,fg;
    if(pts===0){txt='Muy bajo riesgo — Alta precoz sin endoscopia';bg='#f0fdf4';fg='#166534';}
    else if(pts<=5){txt='Bajo riesgo — Endoscopia preferente';bg='#fefce8';fg='#854d0e';}
    else if(pts<=10){txt='Riesgo moderado — Endoscopia urgente';bg='#fff7ed';fg='#9a3412';}
    else{txt='Alto riesgo — Endoscopia emergente + UCI';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Glasgow-Blatchford: '+pts+'/23</strong><br>'+txt;
}

// ── 18. Child-Pugh — Cirrosis ──
function calcChildPugh(){
    var pts=0;
    document.querySelectorAll('.childp-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('childpResult');
    var clase,txt,bg,fg;
    if(pts<=6){clase='A';txt='Bien compensada — Supervivencia 1a: 100%, 2a: 85%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=9){clase='B';txt='Compromiso funcional — Supervivencia 1a: 81%, 2a: 57%';bg='#fefce8';fg='#854d0e';}
    else{clase='C';txt='Descompensada — Supervivencia 1a: 45%, 2a: 35%';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Child-Pugh: '+pts+' — Clase '+clase+'</strong><br>'+txt;
}

// ── 19. Alvarado — Apendicitis ──
function calcAlvarado(){
    var pts=0;
    document.querySelectorAll('.alva-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    var el=document.getElementById('alvaResult');
    var txt,bg,fg;
    if(pts<=4){txt='Apendicitis poco probable — Observación';bg='#f0fdf4';fg='#166534';}
    else if(pts<=6){txt='Apendicitis posible — Pruebas complementarias';bg='#fefce8';fg='#854d0e';}
    else if(pts<=8){txt='Apendicitis probable — Cirugía';bg='#fff7ed';fg='#9a3412';}
    else{txt='Apendicitis muy probable — Cirugía urgente';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Alvarado: '+pts+'/10</strong><br>'+txt;
}

// ── 20. PHQ-9 — Depresión ──
function calcPHQ9(){
    var pts=0;
    document.querySelectorAll('.phq9-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('phq9Result');
    var txt,bg,fg;
    if(pts<=4){txt='Mínima — No tratamiento';bg='#f0fdf4';fg='#166534';}
    else if(pts<=9){txt='Leve — Vigilancia, activación conductual';bg='#dbeafe';fg='#1e40af';}
    else if(pts<=14){txt='Moderada — Considerar ISRS';bg='#fefce8';fg='#854d0e';}
    else if(pts<=19){txt='Moderada-grave — ISRS + terapia';bg='#fff7ed';fg='#9a3412';}
    else{txt='Grave — Tratamiento urgente + derivar Salud Mental';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>PHQ-9: '+pts+'/27</strong><br>'+txt;
}

// ── 21. GAD-7 — Ansiedad ──
function calcGAD7(){
    var pts=0;
    document.querySelectorAll('.gad7-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('gad7Result');
    var txt,bg,fg;
    if(pts<=4){txt='Mínima — No tratamiento';bg='#f0fdf4';fg='#166534';}
    else if(pts<=9){txt='Leve — Monitorizar';bg='#dbeafe';fg='#1e40af';}
    else if(pts<=14){txt='Moderada — Considerar tratamiento';bg='#fefce8';fg='#854d0e';}
    else{txt='Grave — Tratamiento + derivar Salud Mental';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>GAD-7: '+pts+'/21</strong><br>'+txt;
}

// ── 22. Barthel — Dependencia funcional ──
function calcBarthel(){
    var pts=0;
    document.querySelectorAll('.barthel-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('barthelResult');
    var txt,bg,fg;
    if(pts===100){txt='Independiente';bg='#f0fdf4';fg='#166534';}
    else if(pts>=60){txt='Dependencia leve';bg='#dbeafe';fg='#1e40af';}
    else if(pts>=40){txt='Dependencia moderada';bg='#fefce8';fg='#854d0e';}
    else if(pts>=20){txt='Dependencia grave';bg='#fff7ed';fg='#9a3412';}
    else{txt='Dependencia total';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Barthel: '+pts+'/100</strong><br>'+txt;
}

// ── 23. CKD-EPI — Filtrado glomerular estimado ──
function calcCKDEPI(){
    var cr=parseFloat(document.getElementById('ckdCreat').value)||0;
    var age=parseInt(document.getElementById('ckdAge').value)||0;
    var sex=document.getElementById('ckdSex').value;
    if(!cr||!age){document.getElementById('ckdResult').textContent='Introduce creatinina y edad';return;}
    // CKD-EPI 2021 (race-free)
    var k=sex==='F'?0.7:0.9;
    var a=sex==='F'?-0.241:-0.302;
    var f=sex==='F'?1.012:1.0;
    var gfr=142*Math.pow(Math.min(cr/k,1),a)*Math.pow(Math.max(cr/k,1),-1.200)*Math.pow(0.9938,age)*f;
    gfr=Math.round(gfr);
    var el=document.getElementById('ckdResult');
    var txt,bg,fg,estadio;
    if(gfr>=90){estadio='G1';txt='Normal o alto';bg='#f0fdf4';fg='#166534';}
    else if(gfr>=60){estadio='G2';txt='Ligeramente disminuido';bg='#dbeafe';fg='#1e40af';}
    else if(gfr>=45){estadio='G3a';txt='Leve-moderadamente disminuido';bg='#fefce8';fg='#854d0e';}
    else if(gfr>=30){estadio='G3b';txt='Moderada-gravemente disminuido';bg='#fff7ed';fg='#9a3412';}
    else if(gfr>=15){estadio='G4';txt='Gravemente disminuido — Derivar Nefrología';bg='#fef2f2';fg='#991b1b';}
    else{estadio='G5';txt='Fallo renal — Diálisis/trasplante';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>FGe (CKD-EPI 2021): '+gfr+' mL/min/1.73m² — '+estadio+'</strong><br>'+txt;
}

// ── 24. Ottawa Tobillo — ¿Necesita Rx? ──
function calcOttawa(){
    var needs=[...document.querySelectorAll('.ottawa-chk')].some(c=>c.checked);
    var el=document.getElementById('ottawaResult');
    if(needs){el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Rx indicada</strong><br>Cumple criterios Ottawa — Solicitar radiografía';}
    else{el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Rx NO indicada</strong><br>No cumple criterios Ottawa — Sensibilidad ~98%';}
}

// ── 25. ABCD2 — Riesgo ictus tras AIT ──
function calcABCD2(){
    var pts=0;
    document.querySelectorAll('.abcd2-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
    document.querySelectorAll('.abcd2-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('abcd2Result');
    var txt,bg,fg;
    if(pts<=3){txt='Bajo riesgo — Ictus a 2d: 1%, 7d: 1.2%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=5){txt='Riesgo moderado — Ictus a 2d: 4.1%, 7d: 5.9%';bg='#fefce8';fg='#854d0e';}
    else{txt='Alto riesgo — Ictus a 2d: 8.1%, 7d: 11.7% — Ingreso';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>ABCD²: '+pts+'/7</strong><br>'+txt;
}

// ── 26. Ranson — Pancreatitis aguda ──
function calcRanson(){
    var pts=0;
    document.querySelectorAll('.ranson-chk').forEach(function(c){if(c.checked)pts+=1;});
    var el=document.getElementById('ransonResult');
    var txt,bg,fg;
    if(pts<=2){txt='Pancreatitis leve — Mortalidad ~1%';bg='#f0fdf4';fg='#166534';}
    else if(pts<=4){txt='Mortalidad ~16%';bg='#fefce8';fg='#854d0e';}
    else if(pts<=6){txt='Mortalidad ~40%';bg='#fff7ed';fg='#9a3412';}
    else{txt='Mortalidad >99% — UCI';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Ranson: '+pts+'/11</strong><br>'+txt;
}

// ── 27. Downton — Riesgo de caídas ──
function calcDownton(){
    var pts=0;
    document.querySelectorAll('.downton-chk').forEach(function(c){if(c.checked)pts+=1;});
    var el=document.getElementById('downtonResult');
    if(pts>=3){el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Downton: '+pts+'</strong><br>Alto riesgo de caídas — Medidas preventivas';}
    else if(pts>=2){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>Downton: '+pts+'</strong><br>Riesgo moderado';}
    else{el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Downton: '+pts+'</strong><br>Bajo riesgo de caídas';}
}

// ── 28. Fagerström — Dependencia nicotínica ──
function calcFagerstrom(){
    var pts=0;
    document.querySelectorAll('.fager-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('fagerResult');
    var txt,bg,fg;
    if(pts<=3){txt='Dependencia baja';bg='#f0fdf4';fg='#166534';}
    else if(pts<=6){txt='Dependencia moderada';bg='#fefce8';fg='#854d0e';}
    else{txt='Dependencia alta — TSN + Vareniclina/Bupropion';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Fagerström: '+pts+'/10</strong><br>'+txt;
}

// ── 29. Epworth — Somnolencia (SAOS) ──
function calcEpworth(){
    var pts=0;
    document.querySelectorAll('.epworth-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
    var el=document.getElementById('epworthResult');
    var txt,bg,fg;
    if(pts<=10){txt='Somnolencia normal';bg='#f0fdf4';fg='#166534';}
    else if(pts<=14){txt='Somnolencia leve';bg='#fefce8';fg='#854d0e';}
    else if(pts<=18){txt='Somnolencia moderada — Valorar polisomnografía';bg='#fff7ed';fg='#9a3412';}
    else{txt='Somnolencia grave — Estudio urgente SAOS';bg='#fef2f2';fg='#991b1b';}
    el.style.background=bg;el.style.color=fg;
    el.innerHTML='<strong>Epworth: '+pts+'/24</strong><br>'+txt;
}

// ═══ ESCALAS SAMIUC — Añadidas ═══

// ── 30. APACHE II — Gravedad UCI ──
function calcAPACHE2(){
  var pts=0;
  document.querySelectorAll('.apache-num').forEach(function(el){pts+=parseInt(el.value)||0;});
  document.querySelectorAll('.apache-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
  var el=document.getElementById('apache2Result');
  var mort;
  if(pts<=4){mort='~4%';el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(pts<=9){mort='~8%';el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(pts<=14){mort='~15%';el.style.background='#fefce8';el.style.color='#854d0e';}
  else if(pts<=19){mort='~25%';el.style.background='#fff7ed';el.style.color='#9a3412';}
  else if(pts<=24){mort='~40%';el.style.background='#fef2f2';el.style.color='#991b1b';}
  else if(pts<=29){mort='~55%';el.style.background='#fef2f2';el.style.color='#991b1b';}
  else if(pts<=34){mort='~73%';el.style.background='#fef2f2';el.style.color='#7f1d1d';}
  else{mort='>85%';el.style.background='#450a0a';el.style.color='#fecaca';}
  el.innerHTML='<strong>APACHE II: '+pts+' puntos</strong><br>Mortalidad estimada: '+mort;
}

// ── 31. Wells TEP — Tromboembolismo pulmonar ──
function calcWellsPE(){
  var pts=0;
  document.querySelectorAll('.wellspe-chk').forEach(function(c){if(c.checked)pts+=parseFloat(c.dataset.pts);});
  var el=document.getElementById('wellsPEResult');
  if(pts<=1){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Wells TEP: '+pts+'</strong><br>Baja probabilidad — TEP improbable';}
  else if(pts<=4){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>Wells TEP: '+pts+'</strong><br>Probabilidad intermedia — Solicitar D-dímero';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Wells TEP: '+pts+'</strong><br>Alta probabilidad — AngioCT urgente';}
}

// ── 32. TIMI SCASEST — Síndrome coronario sin elevación ST ──
function calcTIMI(){
  var pts=[...document.querySelectorAll('.timi-chk')].filter(c=>c.checked).length;
  var el=document.getElementById('timiResult');
  var risk,bg,fg;
  if(pts<=2){risk='Bajo (muerte/IAM <8%)';bg='#f0fdf4';fg='#166534';}
  else if(pts<=4){risk='Intermedio (muerte/IAM 13-20%)';bg='#fefce8';fg='#854d0e';}
  else{risk='Alto (muerte/IAM 26-41%)';bg='#fef2f2';fg='#991b1b';}
  el.style.background=bg;el.style.color=fg;
  el.innerHTML='<strong>TIMI SCASEST: '+pts+'/7</strong><br>Riesgo: '+risk;
}

// ── 33. GRACE — Riesgo en SCA ──
function calcGRACE(){
  var pts=0;
  document.querySelectorAll('.grace-num').forEach(function(el){pts+=parseInt(el.value)||0;});
  document.querySelectorAll('.grace-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
  var el=document.getElementById('graceResult');
  if(pts<=108){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>GRACE: '+pts+'</strong><br>Bajo riesgo — Mortalidad <1%';}
  else if(pts<=140){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>GRACE: '+pts+'</strong><br>Riesgo intermedio — Mortalidad 1-3%';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>GRACE: '+pts+'</strong><br>Alto riesgo — Mortalidad >3% — Coronariografía precoz';}
}

// ── 34. BISAP — Pancreatitis aguda (primeras 24h) ──
function calcBISAP(){
  var pts=[...document.querySelectorAll('.bisap-chk')].filter(c=>c.checked).length;
  var el=document.getElementById('bisapResult');
  if(pts<=1){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>BISAP: '+pts+'/5</strong><br>Bajo riesgo — Mortalidad <2%';}
  else if(pts===2){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>BISAP: '+pts+'/5</strong><br>Riesgo intermedio — Mortalidad ~5%';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>BISAP: '+pts+'/5</strong><br>Alto riesgo — Mortalidad ~22% — Considerar UCI';}
}

// ── 35. Norton — Riesgo úlceras por presión ──
function calcNorton(){
  var pts=0;
  document.querySelectorAll('.norton-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
  var el=document.getElementById('nortonResult');
  if(pts>=15){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Norton: '+pts+'/20</strong><br>Riesgo mínimo/bajo';}
  else if(pts>=13){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>Norton: '+pts+'/20</strong><br>Riesgo medio — Medidas preventivas';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Norton: '+pts+'/20</strong><br>Alto riesgo — Protocolo UPP completo';}
}

// ── 36. Rockall — Hemorragia digestiva (post-endoscopia) ──
function calcRockall(){
  var pts=0;
  document.querySelectorAll('.rockall-sel').forEach(function(s){pts+=parseInt(s.value)||0;});
  var el=document.getElementById('rockallResult');
  if(pts<=2){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Rockall: '+pts+'/11</strong><br>Bajo riesgo — Mortalidad ~0.1%';}
  else if(pts<=4){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>Rockall: '+pts+'/11</strong><br>Riesgo intermedio — Mortalidad ~5%';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Rockall: '+pts+'/11</strong><br>Alto riesgo — Mortalidad ~25% — UCI/Vigilancia';}
}

// ── 37. MELD-Na — Hepatopatía crónica / Trasplante ──
function calcMELD(){
  var cr=parseFloat(document.getElementById('meldCr').value)||1;
  var bil=parseFloat(document.getElementById('meldBil').value)||1;
  var inr=parseFloat(document.getElementById('meldINR').value)||1;
  var na=parseFloat(document.getElementById('meldNa').value)||140;
  if(cr<1)cr=1;if(cr>4)cr=4;if(bil<1)bil=1;if(inr<1)inr=1;
  if(na<125)na=125;if(na>137)na=137;
  var meld=Math.round(10*(0.957*Math.log(cr)+0.378*Math.log(bil)+1.120*Math.log(inr)+0.643));
  if(meld<6)meld=6;if(meld>40)meld=40;
  var meldna=Math.round(meld+1.32*(137-na)-(0.033*meld*(137-na)));
  if(meldna<6)meldna=6;if(meldna>40)meldna=40;
  var el=document.getElementById('meldResult');
  if(meldna<=9){el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(meldna<=19){el.style.background='#fefce8';el.style.color='#854d0e';}
  else if(meldna<=29){el.style.background='#fff7ed';el.style.color='#9a3412';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>MELD: '+meld+' | MELD-Na: '+meldna+'</strong><br>'+
    (meldna<=9?'Mortalidad 3 meses: 1.9%':meldna<=19?'Mortalidad 3 meses: 6%':meldna<=29?'Mortalidad 3 meses: 19.6%':'Mortalidad 3 meses: 52.6% — Prioridad trasplante');
}

// ── 38. Wells TEP simplificado (ya existe Wells TVP, este es para TEP) ──
// Ya implementado arriba como calcWellsPE

// ── 39. Padua — Riesgo TEV en hospitalizados ──
function calcPadua(){
  var pts=0;
  document.querySelectorAll('.padua-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
  var el=document.getElementById('paduaResult');
  if(pts<4){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Padua: '+pts+'</strong><br>Bajo riesgo TEV — No tromboprofilaxis farmacológica';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Padua: '+pts+'</strong><br>Alto riesgo TEV — Tromboprofilaxis con HBPM indicada';}
}

// ═══ ESCALAS SAMIUC — Batch 2 ═══

// ── 39. SAPS-II — Gravedad UCI (Le Gall, 1993) ──
function calcSAPS2(){
  var pts=0;
  document.querySelectorAll('.saps2-num').forEach(function(el){pts+=parseInt(el.value)||0;});
  var el=document.getElementById('saps2Result');
  // Logistic regression: logit = -7.7631 + 0.0737*pts + 0.9971*ln(pts+1)
  var logit=-7.7631+0.0737*pts+0.9971*Math.log(pts+1);
  var mort=Math.round(100*Math.exp(logit)/(1+Math.exp(logit)));
  if(mort<0)mort=0;if(mort>100)mort=100;
  if(pts<=29){el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(pts<=39){el.style.background='#fefce8';el.style.color='#854d0e';}
  else if(pts<=51){el.style.background='#fff7ed';el.style.color='#9a3412';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>SAPS-II: '+pts+'</strong><br>Mortalidad estimada: ~'+mort+'%';
}

// ── 40. IMC — Índice de Masa Corporal ──
function calcIMC(){
  var peso=parseFloat(document.getElementById('imcPeso').value)||0;
  var talla=parseFloat(document.getElementById('imcTalla').value)||0;
  if(!peso||!talla){document.getElementById('imcResult').textContent='Introduce peso y talla';return;}
  var h=talla>3?talla/100:talla; // accept cm or m
  var imc=peso/(h*h);
  var el=document.getElementById('imcResult');
  var cat,bg,fg;
  if(imc<18.5){cat='Bajo peso';bg='#dbeafe';fg='#1e40af';}
  else if(imc<25){cat='Normopeso';bg='#f0fdf4';fg='#166534';}
  else if(imc<30){cat='Sobrepeso';bg='#fefce8';fg='#854d0e';}
  else if(imc<35){cat='Obesidad grado I';bg='#fff7ed';fg='#9a3412';}
  else if(imc<40){cat='Obesidad grado II';bg='#fef2f2';fg='#991b1b';}
  else{cat='Obesidad mórbida (grado III)';bg='#fef2f2';fg='#7f1d1d';}
  el.style.background=bg;el.style.color=fg;
  el.innerHTML='<strong>IMC: '+imc.toFixed(1)+' kg/m²</strong><br>'+cat;
}

// ── 41. Anion Gap ──
function calcAnionGap(){
  var na=parseFloat(document.getElementById('agNa').value)||140;
  var cl=parseFloat(document.getElementById('agCl').value)||104;
  var hco3=parseFloat(document.getElementById('agHCO3').value)||24;
  var alb=parseFloat(document.getElementById('agAlb').value)||4.0;
  var ag=na-(cl+hco3);
  var agCorr=ag+(2.5*(4.0-alb));
  var el=document.getElementById('agResult');
  if(agCorr<=12){el.style.background='#f0fdf4';el.style.color='#166534';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>Anion Gap: '+ag.toFixed(1)+' mEq/L</strong><br>Corregido por albúmina: '+agCorr.toFixed(1)+' mEq/L<br>'+(agCorr>12?'⚠️ Elevado — Acidosis metabólica AG elevado':'✅ Normal (8-12)');
}

// ── 42. Gradiente Alveolo-arterial O₂ ──
function calcGradAa(){
  var fio2=parseFloat(document.getElementById('aaFiO2').value)||21;
  var pao2=parseFloat(document.getElementById('aaPaO2').value)||95;
  var paco2=parseFloat(document.getElementById('aaPaCO2').value)||40;
  var age=parseFloat(document.getElementById('aaAge').value)||40;
  var PAO2=(fio2/100)*(760-47)-(paco2/0.8);
  var grad=PAO2-pao2;
  var expected=(age/4)+4;
  var el=document.getElementById('aaResult');
  if(grad<=expected){el.style.background='#f0fdf4';el.style.color='#166534';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>Gradiente Aa: '+grad.toFixed(1)+' mmHg</strong><br>PAO₂ calculada: '+PAO2.toFixed(1)+' mmHg<br>Esperado para edad: ≤'+expected.toFixed(0)+' mmHg<br>'+(grad>expected?'⚠️ Elevado — Alteración V/Q, shunt, difusión':'✅ Normal');
}

// ── 43. Osmolalidad sérica calculada ──
function calcOsm(){
  var na=parseFloat(document.getElementById('osmNa').value)||140;
  var glu=parseFloat(document.getElementById('osmGlu').value)||100;
  var bun=parseFloat(document.getElementById('osmBUN').value)||14;
  var etoh=parseFloat(document.getElementById('osmEtOH').value)||0;
  var osm=2*na+(glu/18)+(bun/2.8)+(etoh/4.6);
  var el=document.getElementById('osmResult');
  if(osm>=275&&osm<=295){el.style.background='#f0fdf4';el.style.color='#166534';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>Osmolalidad: '+osm.toFixed(0)+' mOsm/kg</strong><br>Normal: 275-295 mOsm/kg<br>'+(osm<275?'⬇️ Hipoosmolar':osm>295?'⬆️ Hiperosmolar':'✅ Normal');
}

// ── 44. QTc corregido (Bazett) ──
function calcQTc(){
  var qt=parseFloat(document.getElementById('qtcQT').value)||400;
  var rr=parseFloat(document.getElementById('qtcRR').value)||800;
  if(rr<=0)return;
  var qtc=qt/Math.sqrt(rr/1000);
  var el=document.getElementById('qtcResult');
  if(qtc<=440){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>QTc: '+Math.round(qtc)+' ms</strong><br>✅ Normal (≤440 ms)';}
  else if(qtc<=500){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>QTc: '+Math.round(qtc)+' ms</strong><br>⚠️ Prolongado — Revisar fármacos (antiarrítmicos, macrólidos, antipsicóticos)';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>QTc: '+Math.round(qtc)+' ms</strong><br>🚨 Muy prolongado (>500ms) — Riesgo Torsade de Pointes';}
}

// ── 45. Cockcroft-Gault — Aclaramiento de creatinina ──
function calcCockcroftGault(){
  var age=parseFloat(document.getElementById('cgAge').value)||50;
  var peso=parseFloat(document.getElementById('cgPeso').value)||70;
  var cr=parseFloat(document.getElementById('cgCr').value)||1.0;
  var sex=document.getElementById('cgSex').value;
  if(cr<=0)return;
  var ccr=(140-age)*peso/(72*cr);
  if(sex==='F')ccr*=0.85;
  var el=document.getElementById('cgResult');
  if(ccr>=90){el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(ccr>=60){el.style.background='#fefce8';el.style.color='#854d0e';}
  else if(ccr>=30){el.style.background='#fff7ed';el.style.color='#9a3412';}
  else if(ccr>=15){el.style.background='#fef2f2';el.style.color='#991b1b';}
  else{el.style.background='#450a0a';el.style.color='#fecaca';}
  el.innerHTML='<strong>ClCr: '+ccr.toFixed(1)+' mL/min</strong><br>'+(ccr>=90?'G1 — Normal':ccr>=60?'G2 — Leve ↓':ccr>=30?'G3 — Moderada ↓ — Ajustar dosis':ccr>=15?'G4 — Grave ↓ — Ajustar dosis':'G5 — Fallo renal');
}

// ── 46. SIRS — Criterios de respuesta inflamatoria sistémica ──
function calcSIRS(){
  var pts=[...document.querySelectorAll('.sirs-chk')].filter(c=>c.checked).length;
  var el=document.getElementById('sirsResult');
  if(pts<2){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>SIRS: '+pts+'/4</strong><br>No cumple criterios SIRS';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>SIRS: '+pts+'/4</strong><br>⚠️ SIRS positivo (≥2 criterios) — Buscar foco infeccioso → Sepsis?';}
}

// ── 47. Caprini — Riesgo TEV quirúrgico ──
function calcCaprini(){
  var pts=0;
  document.querySelectorAll('.caprini-chk').forEach(function(c){if(c.checked)pts+=parseInt(c.dataset.pts);});
  var el=document.getElementById('capriniResult');
  if(pts<=1){el.style.background='#f0fdf4';el.style.color='#166534';el.innerHTML='<strong>Caprini: '+pts+'</strong><br>Bajo riesgo — Deambulación precoz';}
  else if(pts<=2){el.style.background='#fefce8';el.style.color='#854d0e';el.innerHTML='<strong>Caprini: '+pts+'</strong><br>Riesgo moderado — Considerar HBPM';}
  else if(pts<=4){el.style.background='#fff7ed';el.style.color='#9a3412';el.innerHTML='<strong>Caprini: '+pts+'</strong><br>Alto riesgo — HBPM recomendada';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';el.innerHTML='<strong>Caprini: '+pts+'</strong><br>Muy alto riesgo — HBPM + medias compresivas';}
}

// ── 48. Revised Trauma Score (RTS) ──
function calcRTS(){
  var gcs=parseInt(document.getElementById('rtsGCS').value)||15;
  var tas=parseInt(document.getElementById('rtsTAS').value)||120;
  var fr=parseInt(document.getElementById('rtsFR').value)||16;
  function cGCS(g){return g>=13?4:g>=9?3:g>=6?2:g>=4?1:0;}
  function cTAS(t){return t>89?4:t>=76?3:t>=50?2:t>=1?1:0;}
  function cFR(f){return f>=10&&f<=29?4:f>29?3:f>=6?2:f>=1?1:0;}
  var rts=(0.9368*cGCS(gcs)+0.7326*cTAS(tas)+0.2908*cFR(fr));
  var el=document.getElementById('rtsResult');
  if(rts>=7){el.style.background='#f0fdf4';el.style.color='#166534';}
  else if(rts>=5){el.style.background='#fefce8';el.style.color='#854d0e';}
  else{el.style.background='#fef2f2';el.style.color='#991b1b';}
  el.innerHTML='<strong>RTS: '+rts.toFixed(2)+'</strong><br>'+
    (rts>=7?'Buen pronóstico — Supervivencia >90%':rts>=5?'Riesgo moderado — Activar código trauma':'Mal pronóstico — UCI/Código trauma');
}
