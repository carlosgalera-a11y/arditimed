// ═══ CALCULADORA DE TURNOS DE GUARDIA ═══
var turnoNum=2;

function turnoPreset(inicio,fin,btn){
    if(inicio==='now'){
        var n=new Date();
        var hh=String(n.getHours()).padStart(2,'0');
        var mm=String(n.getMinutes()).padStart(2,'0');
        document.getElementById('turnoInicio').value=hh+':'+mm;
        document.getElementById('turnoFin').value='08:00';
    }else{
        document.getElementById('turnoInicio').value=inicio+':00';
        document.getElementById('turnoFin').value=fin+':00';
    }
    // Highlight selected preset. Preferimos el `this` pasado desde el onclick;
    // si no, fallback a window.event (compatibilidad inline). Esto evita el bug
    // de no resaltar cuando se llama programáticamente.
    var tgt = btn || (typeof event!=='undefined' && event && event.target ? event.target.closest('.tg-preset') : null);
    var presets=document.querySelectorAll('#turnoPresets .tg-preset');
    if(presets.length){
        presets.forEach(function(b){b.classList.remove('is-active');});
        if(tgt) tgt.classList.add('is-active');
    }else{
        document.querySelectorAll('#turnoPresets button').forEach(function(b){
            b.style.background='var(--bg-subtle)';b.style.borderColor='var(--border)';b.style.color='var(--text)';
        });
        if(tgt){
            tgt.style.background='#1d4ed8';tgt.style.borderColor='#1d4ed8';tgt.style.color='#fff';
        }
    }
    turnoCalc();
}

function turnoChangNum(d){
    turnoNum=Math.max(1,Math.min(10,turnoNum+d));
    document.getElementById('turnoNumDisplay').textContent=turnoNum;
    turnoCalc();
}

function turnoCalc(){
    var inicioStr=document.getElementById('turnoInicio').value;
    var finStr=document.getElementById('turnoFin').value;
    if(!inicioStr||!finStr)return;

    var ip=inicioStr.split(':');var fp=finStr.split(':');
    var inicioMin=parseInt(ip[0])*60+parseInt(ip[1]);
    var finMin=parseInt(fp[0])*60+parseInt(fp[1]);

    // Si fin <= inicio, la guardia cruza medianoche
    var totalMin=finMin>inicioMin?finMin-inicioMin:((24*60)-inicioMin)+finMin;

    var turnoMin=Math.floor(totalMin/turnoNum);
    var sobrante=totalMin-(turnoMin*turnoNum);

    // Duración info
    var totalH=Math.floor(totalMin/60);
    var totalM=totalMin%60;
    var turnoH=Math.floor(turnoMin/60);
    var turnoM=turnoMin%60;
    document.getElementById('turnoDuracion').innerHTML='Guardia: <strong>'+totalH+'h '+totalM+'min</strong> → Cada turno: <strong>'+turnoH+'h '+turnoM+'min</strong>';

    // Parse nombres
    var nombresRaw=document.getElementById('turnoNombres').value.trim();
    var nombres=nombresRaw?nombresRaw.split(',').map(function(n){return n.trim();}).filter(function(n){return n.length>0;}):[];

    // Build turnos
    var turnos=[];
    var currentMin=inicioMin;
    for(var i=0;i<turnoNum;i++){
        var duracion=turnoMin+(i<sobrante?1:0); // distribuir minutos sobrantes
        var startMin=currentMin%1440;
        var endMin=(currentMin+duracion)%1440;
        turnos.push({
            num:i+1,
            nombre:nombres[i]||'Turno '+(i+1),
            inicio:minToTime(startMin),
            fin:minToTime(endMin),
            durH:Math.floor(duracion/60),
            durM:duracion%60
        });
        currentMin+=duracion;
    }

    renderTurnos(turnos,totalH,totalM);
}

function minToTime(m){
    m=((m%1440)+1440)%1440;
    return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
}

function renderTurnos(turnos,totalH,totalM){
    // Update inline duración meta (matches Stitch layout)
    var turnoMinTotal=(turnos[0].durH*60+turnos[0].durM);
    var durMeta=document.getElementById('turnoDuracion');
    if(durMeta){
        durMeta.textContent='Duración total: '+totalH+'h '+totalM+'min · Cada turno: '+turnos[0].durH+'h '+turnos[0].durM+'min';
    }

    // Detect new Stitch panel (#panelTurnos uses .tg-* classes)
    var stitch=!!document.querySelector('#panelTurnos .tg-card');
    if(!stitch){
        return _renderTurnosLegacy(turnos,totalH,totalM);
    }

    var colors=['#003527','#0f6b4a','#16a34a','#52a787','#80bea6','#5a8c75','#7b5804','#fdcd74','#475569','#15803d'];
    var bgs   =['#e9efeb','#f5fbf7','#dcfce7','#eef5f0','#e3eae6','#eff5f1','#fef3c7','#fef9c3','#f1f5f9','#f0fdf4'];

    var totalMin=totalH*60+totalM;
    var html=''
      +'<div class="tg-result">'
      +'<div class="tg-result-head">'
      +'<div class="tg-result-caps">Guardia de '+totalH+'h '+totalM+'min · '+turnos.length+' turno'+(turnos.length>1?'s':'')+'</div>'
      +'<div class="tg-result-time">'+turnos[0].inicio+' → '+turnos[turnos.length-1].fin+'</div>'
      +'</div>';

    // Timeline bar
    html+='<div class="tg-timeline-bar" role="img" aria-label="Distribución visual de turnos">';
    turnos.forEach(function(t,i){
        var dur=t.durH*60+t.durM;
        var pct=totalMin>0?(dur/totalMin*100):(100/turnos.length);
        html+='<div style="flex:'+pct.toFixed(2)+';background:'+colors[i%colors.length]+';" title="'+_escAttr(t.nombre)+': '+t.inicio+' → '+t.fin+'"></div>';
    });
    html+='</div>';

    // Timeline labels (TURNO 1 · CAMBIO HH:MM · TURNO 2 …)
    html+='<div class="tg-timeline-labels">';
    turnos.forEach(function(t,i){
        html+='<span>Turno '+t.num+'</span>';
        if(i<turnos.length-1){
            html+='<span class="tg-tl-sep">Cambio · '+t.fin+'</span>';
        }
    });
    html+='</div>';

    // Turno cards
    turnos.forEach(function(t,i){
        var c=colors[i%colors.length];
        var bg=bgs[i%bgs.length];
        var activeCls=(i===0)?' is-active':'';
        html+='<div class="tg-turn-card'+activeCls+'" style="background:'+bg+';">'
          +'<div class="tg-turn-num" style="background:'+c+';">'+t.num+'</div>'
          +'<div class="tg-turn-body">'
          +'<div class="tg-turn-name">'+_escHtml(t.nombre)+'</div>'
          +'<div class="tg-turn-time"><span>⏱ '+t.inicio+' → '+t.fin+'</span><span class="tg-turn-pill">'+t.durH+'h '+t.durM+'min</span></div>'
          +'</div></div>';
    });

    // Actions
    html+='<div class="tg-actions">'
      +'<button type="button" onclick="turnoShareWA()" class="tg-act tg-act-primary">📤 WhatsApp</button>'
      +'<button type="button" onclick="turnoCopy()" class="tg-act">📋 Copiar</button>'
      +'<button type="button" onclick="turnoPrint()" class="tg-act">🖨 Imprimir</button>'
      +'</div>'
      +'</div>';

    document.getElementById('turnoResult').innerHTML=html;
    window._turnosData=turnos;
}

function _escHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function _escAttr(s){return _escHtml(s);}

function _renderTurnosLegacy(turnos,totalH,totalM){
    var colors=['#1d4ed8','#059669','#dc2626','#7c3aed','#ea580c','#0284c7','#ca8a04','#be185d','#475569','#15803d'];
    var bgColors=['#eff6ff','#ecfdf5','#fef2f2','#f5f3ff','#fff7ed','#e0f2fe','#fefce8','#fdf2f8','#f1f5f9','#f0fdf4'];

    var html='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">';
    html+='<div style="text-align:center;margin-bottom:20px;">';
    html+='<div style="font-size:.85rem;color:var(--text-muted);margin-bottom:4px;">Guardia de '+totalH+'h '+totalM+'min · '+turnos.length+' turnos</div>';
    html+='<div style="font-size:1.5rem;font-weight:800;color:var(--text);">'+turnos[0].inicio+' → '+turnos[turnos.length-1].fin+'</div>';
    html+='</div>';
    html+='<div style="display:flex;border-radius:10px;overflow:hidden;height:40px;margin-bottom:20px;border:1px solid var(--border);">';
    turnos.forEach(function(t,i){
        var pct=(t.durH*60+t.durM)/(totalH*60+(totalH===0?totalM:0))*100||100/turnos.length;
        html+='<div style="flex:'+pct+';background:'+colors[i%colors.length]+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:.75rem;font-weight:700;min-width:30px;" title="'+t.nombre+': '+t.inicio+' - '+t.fin+'">'+t.num+'</div>';
    });
    html+='</div>';
    turnos.forEach(function(t,i){
        var c=colors[i%colors.length];var bg=bgColors[i%bgColors.length];
        html+='<div style="display:flex;align-items:center;gap:14px;padding:14px;margin-bottom:8px;background:'+bg+';border-radius:10px;border-left:4px solid '+c+';">';
        html+='<div style="min-width:44px;height:44px;border-radius:50%;background:'+c+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.1rem;">'+t.num+'</div>';
        html+='<div style="flex:1;"><div style="font-weight:700;font-size:.95rem;color:'+c+';">'+t.nombre+'</div><div style="font-size:.85rem;color:var(--text);margin-top:2px;">'+t.inicio+' → '+t.fin+' <span style="color:var(--text-muted);font-size:.78rem;">('+t.durH+'h '+t.durM+'min)</span></div></div>';
        html+='</div>';
    });
    html+='<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">';
    html+='<button onclick="turnoShareWA()" style="padding:10px 20px;background:#25d366;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:.88rem;font-family:var(--font-body);">📱 WhatsApp</button>';
    html+='<button onclick="turnoCopy()" style="padding:10px 20px;background:var(--bg-subtle);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-weight:600;font-size:.88rem;font-family:var(--font-body);">📋 Copiar</button>';
    html+='<button onclick="turnoPrint()" style="padding:10px 20px;background:var(--bg-subtle);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-weight:600;font-size:.88rem;font-family:var(--font-body);">🖨 Imprimir</button>';
    html+='</div></div>';
    document.getElementById('turnoResult').innerHTML=html;
    window._turnosData=turnos;
}

function turnoGetText(){
    var t=window._turnosData;if(!t)return'';
    var txt='⏰ TURNOS DE GUARDIA\n';
    txt+=t[0].inicio+' → '+t[t.length-1].fin+'\n';
    txt+='━━━━━━━━━━━━━━━━━━\n';
    t.forEach(function(s){
        txt+=s.num+'. '+s.nombre+': '+s.inicio+' - '+s.fin+' ('+s.durH+'h '+s.durM+'min)\n';
    });
    txt+='━━━━━━━━━━━━━━━━━━\n';
    txt+='Área II Cartagena';
    return txt;
}

function turnoShareWA(){
    var txt=turnoGetText();
    window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
}

function turnoCopy(){
    var txt=turnoGetText();
    navigator.clipboard.writeText(txt).then(function(){
        alert('Turnos copiados al portapapeles');
    }).catch(function(){
        // Fallback
        var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
        alert('Turnos copiados');
    });
}

function turnoPrint(){
    var content=document.getElementById('turnoResult').innerHTML;
    var w=window.open('','_blank');
    w.document.write('<html><head><title>Turnos de Guardia</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px;}@media print{body{padding:0;}}</style></head><body>');
    w.document.write('<h2>⏰ Turnos de Guardia — Área II Cartagena</h2>');
    w.document.write('<p style="color:#666;">'+new Date().toLocaleString('es-ES')+'</p>');
    w.document.write(content);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(function(){w.print();},500);
}

// Auto-calc on load
document.addEventListener('DOMContentLoaded',function(){
    if(document.getElementById('turnoInicio'))turnoCalc();
});
