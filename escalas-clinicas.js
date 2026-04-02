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
