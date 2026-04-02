// ═══ TRIAJE IA — Análisis de capturas de listados de pacientes ═══
var triajeB64=null;
var triajeData=[];

function triajeHandleFile(e){var f=e.target.files[0];if(f)triajeProcessFile(f);}
function triajeProcessFile(f){
    if(!f.type.startsWith("image/")){alert("Selecciona una imagen");return;}
    var r=new FileReader();
    r.onload=function(e){
        var d=e.target.result;
        triajeB64=d.split(",")[1];
        document.getElementById("triajeImgPreview").src=d;
        document.getElementById("triajeImgPreview").style.display="block";
        document.getElementById("triajeDropContent").style.display="none";
        document.getElementById("triajeDropZone").style.borderStyle="solid";
        document.getElementById("triajeDropZone").style.borderColor="#dc2626";
        document.getElementById("triajeBtnGo").disabled=false;
    };
    r.readAsDataURL(f);
}

function triajeClear(){
    triajeB64=null;triajeData=[];
    document.getElementById("triajeImgPreview").style.display="none";
    document.getElementById("triajeImgPreview").src="";
    document.getElementById("triajeDropContent").style.display="block";
    document.getElementById("triajeDropZone").style.borderStyle="dashed";
    document.getElementById("triajeDropZone").style.borderColor="var(--border)";
    document.getElementById("triajeFileIn").value="";
    document.getElementById("triajeCtx").value="";
    document.getElementById("triajeBtnGo").disabled=true;
    document.getElementById("triajeResult").innerHTML="";
    document.getElementById("triajeExportBtn").style.display="none";
    document.getElementById("triajePrintBtn").style.display="none";
}

// Drag & drop
(function(){
    var z=document.getElementById("triajeDropZone");if(!z)return;
    z.addEventListener("dragover",function(e){e.preventDefault();z.style.borderColor="#dc2626";z.style.background="rgba(220,38,38,.04)";});
    z.addEventListener("dragleave",function(){z.style.borderColor="var(--border)";z.style.background="var(--bg-card)";});
    z.addEventListener("drop",function(e){e.preventDefault();z.style.borderColor="var(--border)";z.style.background="var(--bg-card)";if(e.dataTransfer.files.length)triajeProcessFile(e.dataTransfer.files[0]);});
})();

// Clipboard paste for triaje
(function(){
    function handleTriajePaste(e){
        var items=e.clipboardData&&e.clipboardData.items;if(!items)return;
        for(var i=0;i<items.length;i++){
            if(items[i].type.indexOf("image")!==-1){
                e.preventDefault();
                triajeProcessFile(items[i].getAsFile());
                var z=document.getElementById("triajeDropZone");
                if(z){z.style.borderColor="#dc2626";z.style.background="rgba(220,38,38,.08)";setTimeout(function(){z.style.background="var(--bg-card)";},300);}
                return;
            }
        }
    }
    document.addEventListener("paste",function(e){
        var active=document.activeElement;
        if(active&&(active.tagName==="INPUT"||active.tagName==="TEXTAREA"||active.isContentEditable))return;
        var panel=document.getElementById("panelTriaje");
        if(panel&&panel.style.display!=="none")handleTriajePaste(e);
    });
})();

// ── AI Analysis ──
async function triajeAnalyze(){
    if(!triajeB64){alert("Pega o sube una captura primero");return;}
    var btn=document.getElementById("triajeBtnGo");
    var res=document.getElementById("triajeResult");
    var ctx=document.getElementById("triajeCtx").value.trim();
    btn.disabled=true;btn.innerHTML="⏳ Analizando listado...";
    res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid #dc2626;border-radius:var(--radius);padding:20px;"><div style="color:#dc2626;font-weight:700;margin-bottom:8px;">🚨 Procesando captura...</div><div style="color:var(--text-muted);font-size:.9rem;" id="triajeProgress">Extrayendo información de pacientes...</div></div>';

    var mt="image/jpeg";
    var ps=document.getElementById("triajeImgPreview").src;
    if(ps.indexOf("image/png")>-1)mt="image/png";
    var dataUrl="data:"+mt+";base64,"+triajeB64;

    var sysPrompt='Eres un asistente de triaje hospitalario. Analiza esta captura de pantalla de un listado de pacientes (puede ser de Selene, Florence, OCIOGEN, HCIS, o cualquier sistema hospitalario).\n\nExtrae TODOS los pacientes visibles y genera una respuesta SOLO en formato JSON válido (sin markdown, sin ```json, sin texto adicional). El JSON debe ser un array de objetos con esta estructura exacta:\n[\n  {\n    "box": "número de box/cama",\n    "nombre": "iniciales o nombre si visible (anonimizar si es nombre completo: solo iniciales)",\n    "edad": "edad si visible",\n    "motivo": "motivo de consulta / diagnóstico principal",\n    "pendiente": "pruebas o acciones pendientes (analítica, Rx, ECG, interconsulta, etc.)",\n    "prioridad": 1-5,\n    "prioridad_texto": "ROJO/NARANJA/AMARILLO/VERDE/AZUL",\n    "notas": "observaciones relevantes"\n  }\n]\n\nReglas de prioridad:\n1 (ROJO) = Emergencia vital: PCR, shock, IAM, ictus, politrauma\n2 (NARANJA) = Urgente: dolor torácico, disnea severa, abdomen agudo, hemorragia\n3 (AMARILLO) = Urgente diferible: fiebre alta, dolor moderado, fracturas estables\n4 (VERDE) = No urgente: patología leve, heridas menores, dolor leve\n5 (AZUL) = Administrativa: pendiente de resultados, alta médica pendiente\n\nSi no puedes leer algo, pon "ilegible". Extrae TODO lo que se vea en la captura.';

    if(ctx) sysPrompt+="\n\nContexto adicional del profesional: "+ctx;

    var txt=null;var usedModel="";var errors=[];

    // 1. Pollinations
    try{
        var ctrl=new AbortController();setTimeout(function(){ctrl.abort();},30000);
        document.getElementById("triajeProgress").textContent="Probando GPT-4o (Pollinations)...";
        var r=await fetch("https://text.pollinations.ai/openai",{
            method:"POST",signal:ctrl.signal,
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({model:"openai",messages:[{role:"system",content:sysPrompt},{role:"user",content:[{type:"image_url",image_url:{url:dataUrl}},{type:"text",text:"Analiza este listado de pacientes y genera el JSON de triaje."}]}],seed:Math.floor(Math.random()*99999)})
        });
        if(r.ok){var d=await r.json();txt=d.choices?.[0]?.message?.content||null;if(txt)usedModel="GPT-4o";}
        else errors.push("Pollinations: HTTP "+r.status);
    }catch(e){errors.push("Pollinations: "+e.message);}

    // 2. OpenRouter fallback
    if(!txt){
        try{
            var orKey=_dk();
            if(orKey){
                var models=["meta-llama/llama-4-scout:free","qwen/qwen2.5-vl-32b-instruct"];
                for(var mi=0;mi<models.length&&!txt;mi++){
                    var vm=models[mi];
                    document.getElementById("triajeProgress").textContent="Probando "+vm.split("/")[1].split(":")[0]+"...";
                    var r2=await fetch("https://openrouter.ai/api/v1/chat/completions",{
                        method:"POST",
                        headers:{"Content-Type":"application/json","Authorization":"Bearer "+orKey,"HTTP-Referer":"https://carlosgalera-a11y.github.io/Cartagenaeste/","X-Title":"TriajeIA Area II Cartagena"},
                        body:JSON.stringify({model:vm,messages:[{role:"system",content:sysPrompt},{role:"user",content:[{type:"image_url",image_url:{url:dataUrl}},{type:"text",text:"Analiza este listado y genera el JSON de triaje."}]}],max_tokens:3000,temperature:0.2})
                    });
                    var d2=await r2.json();
                    if(r2.ok&&d2.choices&&d2.choices[0]){txt=d2.choices[0].message.content||null;if(txt)usedModel=vm.split("/")[1].split(":")[0];}
                    else errors.push(vm.split("/")[1]+": "+r2.status);
                }
            }
        }catch(e){errors.push("OpenRouter: "+e.message);}
    }

    // Parse result
    if(txt){
        try{
            // Clean JSON from markdown fences
            var clean=txt.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
            // Find the JSON array
            var start=clean.indexOf("[");var end=clean.lastIndexOf("]");
            if(start>=0&&end>start) clean=clean.substring(start,end+1);
            triajeData=JSON.parse(clean);
            // Sort by priority
            triajeData.sort(function(a,b){return(a.prioridad||5)-(b.prioridad||5);});
            triajeRenderTable(usedModel);
        }catch(e){
            // If JSON parse fails, show raw text
            res.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;"><div style="color:#dc2626;font-weight:700;margin-bottom:8px;">⚠️ No se pudo generar la tabla</div><div style="font-size:.85rem;color:var(--text-muted);margin-bottom:10px;">La IA devolvió texto pero no se pudo parsear como tabla. Modelo: '+usedModel+'</div><pre style="white-space:pre-wrap;font-size:.8rem;background:var(--bg-subtle);padding:12px;border-radius:8px;max-height:400px;overflow:auto;">'+txt.replace(/</g,"&lt;")+'</pre></div>';
        }
    }else{
        res.innerHTML='<div style="background:var(--bg-card);border:1px solid #dc2626;border-left:4px solid #dc2626;border-radius:var(--radius);padding:20px;"><div style="color:#dc2626;font-weight:700;margin-bottom:8px;">❌ Error</div><div style="color:var(--text);font-size:.9rem;">No se pudo analizar la captura.</div><div style="margin-top:8px;padding:8px;background:var(--bg-subtle);border-radius:6px;font-size:.78rem;color:var(--text-muted);font-family:monospace;">'+errors.join(" | ")+'</div></div>';
    }
    btn.disabled=false;btn.innerHTML="🚨 Generar tabla de triaje";
}

// ── Render Table ──
function triajeRenderTable(model){
    var prioColors={"1":"#dc2626","2":"#ea580c","3":"#eab308","4":"#22c55e","5":"#3b82f6"};
    var prioBg={"1":"#fef2f2","2":"#fff7ed","3":"#fefce8","4":"#f0fdf4","5":"#eff6ff"};
    var prioLabels={"1":"ROJO","2":"NARANJA","3":"AMARILLO","4":"VERDE","5":"AZUL"};

    var html='<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;overflow-x:auto;">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">';
    html+='<div style="font-weight:700;font-size:1rem;color:var(--text);">🚨 Tabla de Triaje — '+triajeData.length+' pacientes</div>';
    html+='<div style="font-size:.75rem;color:var(--text-muted);">Modelo: '+model+' · '+new Date().toLocaleString("es-ES")+'</div>';
    html+='</div>';

    // Summary badges
    var counts={1:0,2:0,3:0,4:0,5:0};
    triajeData.forEach(function(p){counts[p.prioridad||5]++;});
    html+='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">';
    [1,2,3,4,5].forEach(function(p){
        if(counts[p]>0) html+='<span style="padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700;background:'+prioBg[p]+';color:'+prioColors[p]+';border:1px solid '+prioColors[p]+'20;">'+prioLabels[p]+': '+counts[p]+'</span>';
    });
    html+='</div>';

    // Table
    html+='<table style="width:100%;border-collapse:collapse;font-size:.82rem;">';
    html+='<thead><tr style="background:var(--bg-subtle);">';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">PRIO</th>';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">BOX</th>';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">PACIENTE</th>';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">MOTIVO</th>';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">PENDIENTE</th>';
    html+='<th style="padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid var(--border);font-size:.75rem;color:var(--text-muted);">NOTAS</th>';
    html+='</tr></thead><tbody>';

    triajeData.forEach(function(p,i){
        var prio=p.prioridad||5;
        var color=prioColors[prio]||"#6b7280";
        var bg=prioBg[prio]||"#f9fafb";
        html+='<tr style="border-bottom:1px solid var(--border);">';
        html+='<td style="padding:8px 6px;"><span style="display:inline-block;padding:3px 10px;border-radius:4px;font-weight:700;font-size:.75rem;background:'+bg+';color:'+color+';border:1px solid '+color+'30;">'+(p.prioridad_texto||prioLabels[prio])+'</span></td>';
        html+='<td style="padding:8px 6px;font-weight:600;">'+(p.box||"—")+'</td>';
        html+='<td style="padding:8px 6px;">'+(p.nombre||"—")+(p.edad?' <span style="color:var(--text-muted);font-size:.75rem;">'+p.edad+'a</span>':'')+'</td>';
        html+='<td style="padding:8px 6px;">'+(p.motivo||"—")+'</td>';
        html+='<td style="padding:8px 6px;color:#b45309;font-weight:500;">'+(p.pendiente||"—")+'</td>';
        html+='<td style="padding:8px 6px;color:var(--text-muted);font-size:.78rem;">'+(p.notas||"—")+'</td>';
        html+='</tr>';
    });

    html+='</tbody></table></div>';

    document.getElementById("triajeResult").innerHTML=html;
    document.getElementById("triajeExportBtn").style.display="inline-flex";
    document.getElementById("triajePrintBtn").style.display="inline-flex";
}

// ── Export CSV ──
function triajeExportCSV(){
    if(!triajeData.length)return;
    var csv="Prioridad;Box;Paciente;Edad;Motivo;Pendiente;Notas\n";
    triajeData.forEach(function(p){
        csv+=(p.prioridad_texto||"")+";"+(p.box||"")+";"+(p.nombre||"")+";"+(p.edad||"")+";"+(p.motivo||"").replace(/;/g,",")+";"+(p.pendiente||"").replace(/;/g,",")+";"+(p.notas||"").replace(/;/g,",")+"\n";
    });
    var blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download="triaje_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
}

// ── Print ──
function triajePrint(){
    var content=document.getElementById("triajeResult").innerHTML;
    var w=window.open("","_blank");
    w.document.write('<html><head><title>Triaje — '+new Date().toLocaleString("es-ES")+'</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:11px;}th{background:#f1f5f9;font-weight:700;}@media print{body{padding:0;}}</style></head><body>');
    w.document.write('<h2 style="margin-bottom:4px;">🚨 Tabla de Triaje</h2><p style="color:#666;font-size:11px;margin-bottom:12px;">'+new Date().toLocaleString("es-ES")+' — Área II Cartagena</p>');
    w.document.write(content);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(function(){w.print();},500);
}
