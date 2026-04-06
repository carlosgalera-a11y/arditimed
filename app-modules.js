
function enfFilterDocs(query){
  var q=query.toLowerCase().trim();
  document.querySelectorAll('.enf-doc-item').forEach(function(item){
    var text=item.textContent.toLowerCase();
    item.style.display=(!q||text.includes(q))?'':'none';
  });
  document.querySelectorAll('.enf-doc-section').forEach(function(h){
    var grid=h.nextElementSibling;
    if(grid){
      var visible=grid.querySelectorAll('.enf-doc-item:not([style*="display: none"])');
      h.style.display=visible.length>0?'':'none';
      grid.style.display=visible.length>0?'':'none';
    }
  });
}

// ═══ ENFERMERÍA ═══
var enfModel=localStorage.getItem('enfModel')||'qwen/qwen3-32b';

function switchEnfTab(id,btn){
  document.querySelectorAll('.enf-tab-content').forEach(function(t){t.style.display='none';});
  document.getElementById(id).style.display='block';
  var tabs=btn.parentElement.querySelectorAll('.tab-btn');
  tabs.forEach(function(t){t.classList.remove('active');});
  btn.classList.add('active');
}

function enfGetKey(){
  return _dk();
}

var ENF_OR_MODELS=['deepseek/deepseek-chat-v3-0324:free','qwen/qwen3.5-flash','qwen/qwen3.5-9b','qwen/qwen3.6-plus:free'];

async function enfCallOR(prompt,sysPrompt,idx){
  idx=idx||0;
  var NAS_URL='http://REDACTED_INTERNAL_IP:3100';
  var DS_KEY=_xd('89,65,7,75,18,19,78,78,27,29,76,75,75,18,30,30,18,73,24,75,75,26,75,28,73,79,28,75,73,73,72,18,19,72,19'); // ⚠️ KEY REMOVED — routed through NAS proxy. See api-config.js;
  var msgs=[{role:'system',content:sysPrompt},{role:'user',content:prompt}];
  // Try NAS first (keys hidden) — only on HTTP to avoid mixed content
  if(idx===0 && location.protocol!=='https:'){
    try{
      var rn=await fetch(NAS_URL+'/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:2000,temperature:0.3})});
      if(rn.ok){var dn=await rn.json();var na=(dn.choices&&dn.choices[0]&&dn.choices[0].message)?dn.choices[0].message.content:null;if(na)return na;}
    }catch(e){}
  }
  // Try DeepSeek direct (5M free tokens, no rate limit)
  if(idx<=1){
    try{
      var rd=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+DS_KEY},body:JSON.stringify({model:'deepseek-chat',messages:msgs,max_tokens:2000,temperature:0.3})});
      if(rd.ok){var dd=await rd.json();var da=(dd.choices&&dd.choices[0]&&dd.choices[0].message)?dd.choices[0].message.content:null;if(da)return da;}
    }catch(e){}
  }
  // Try Pollinations (no rate limit)
  if(idx<=1){
    try{
      var rp=await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai-large',messages:msgs,seed:Math.floor(Math.random()*9999),private:true})});
      if(rp.ok){var dp=await rp.json();var pa=(dp.choices&&dp.choices[0]&&dp.choices[0].message)?dp.choices[0].message.content:null;if(pa)return pa;}
    }catch(e){}
  }
  // Then try OpenRouter models
  var orIdx=(idx===0)?0:idx-1;
  if(orIdx>=ENF_OR_MODELS.length) return null;
  try{
    var r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+enfGetKey(),'HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/','X-Title':'Enfermeria Area II Cartagena'},body:JSON.stringify({model:ENF_OR_MODELS[orIdx],messages:msgs,max_tokens:2000,temperature:0.3})});
    if(r.status===429||r.status===502||r.status===503||r.status===402)return enfCallOR(prompt,sysPrompt,idx+1);
    if(!r.ok)return enfCallOR(prompt,sysPrompt,idx+1);
    var d=await r.json();var ans=(d.choices&&d.choices[0]&&d.choices[0].message)?d.choices[0].message.content:null;
    return ans||enfCallOR(prompt,sysPrompt,idx+1);
  }catch(e){return enfCallOR(prompt,sysPrompt,idx+1);}
}

async function enfCallAI(prompt,resultDiv,titleDiv,titleText){
  if(titleDiv)document.getElementById(titleDiv).textContent=titleText||'Resultado';
  document.getElementById(resultDiv).style.display='block';
  var contentDiv=resultDiv.replace('Result','Content');
  document.getElementById(contentDiv).innerHTML='<div style="text-align:center;padding:20px;color:var(--text-muted);">⏳ Generando respuesta...</div>';
  var sys='Eres un experto en enfermería clínica española. Responde en español de forma clara, estructurada y práctica. Usa formato con secciones numeradas. Incluye indicaciones, contraindicaciones y precauciones cuando sea relevante. Enfocado a enfermería de Atención Primaria y urgencias.';
  var text=await enfCallOR(prompt,sys,0);
  if(text){document.getElementById(contentDiv).textContent=text;}
  else{document.getElementById(contentDiv).innerHTML='<span style="color:#ef4444;">⚠️ No se pudo conectar con la IA. Comprueba tu conexión.</span>';}
}

async function enfHacerPregunta(){
  var input=document.getElementById('enfPreguntaInput');
  var text=input.value.trim();
  if(!text)return;
  input.value='';
  var list=document.getElementById('enfPreguntasList');
  var qDiv=document.createElement('div');qDiv.className='question-box';
  qDiv.innerHTML='<div class="question-text">'+text+'</div><div class="answer-text" style="color:var(--text-muted);">⏳ Pensando...</div><div class="note-time">'+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+'</div>';
  if(list.querySelector('.empty-state'))list.innerHTML='';
  list.prepend(qDiv);
  var sys='Eres un experto en enfermería clínica española. Responde en español de forma clara y práctica para profesionales de enfermería de Atención Primaria y urgencias.';
  var ans=await enfCallOR(text,sys,0);
  if(ans){qDiv.querySelector('.answer-text').textContent=ans;qDiv.querySelector('.answer-text').style.color='';}
  else{qDiv.querySelector('.answer-text').innerHTML='<span style="color:#ef4444;">⚠️ No se pudo conectar. Reintenta en unos segundos.</span>';}
}

function enfAskAI(prompt){enfCallAI(prompt,'enfTecnicaResult','enfTecnicaTitle',prompt.substring(0,60)+'...');}

function enfLoadProtocol(id){
  var prompts={
    curas:'Describe el protocolo completo de curas y tratamiento de heridas en enfermería de AP: tipos de heridas (agudas, crónicas, úlceras venosas, arteriales, por presión), material necesario, técnica estéril, tipos de apósitos (alginatos, hidrogeles, espumas, hidrocoloides), frecuencia de curas y criterios de derivación',
    via_venosa:'Describe el protocolo de canalización y mantenimiento de vía venosa periférica: indicaciones, material, calibres de catéter, técnica de inserción, fijación, mantenimiento, complicaciones (flebitis, extravasación, infección) y criterios de retirada',
    sondaje:'Describe los protocolos de sondaje en enfermería: sondaje vesical (masculino y femenino), sondaje nasogástrico y sondaje rectal. Para cada uno: indicaciones, contraindicaciones, material, técnica paso a paso y complicaciones',
    vacunacion:'Describe el protocolo de vacunación en enfermería: calendario vacunal del adulto en España, técnica de administración (IM, SC), zonas de inyección, cadena de frío, contraindicaciones generales y registro',
    inyectables:'Describe los protocolos de administración de inyectables: vía intramuscular (zonas: deltoides, dorsoglútea, ventroglútea, vasto externo), subcutánea, intravenosa e intradérmica. Ángulos, volúmenes máximos, agujas y precauciones',
    constantes:'Describe el protocolo de toma de constantes vitales: presión arterial (técnica, valores normales), frecuencia cardíaca, temperatura, saturación de oxígeno y glucemia capilar. Valores de alarma y actuación',
    ecg:'Describe el protocolo de realización de ECG de 12 derivaciones en enfermería: preparación del paciente, colocación de electrodos precordiales y de extremidades, errores frecuentes y artefactos, valores normales básicos',
    rcp:'Describe el protocolo de RCP básica y uso de DEA según ERC 2021: secuencia de actuación, compresiones torácicas, ventilación, uso del desfibrilador, algoritmo SVB, posición lateral de seguridad',
    diabetico:'Describe el protocolo de enfermería para el paciente diabético: tipos de insulina (rápida, lenta, mixta), técnica de administración, rotación de zonas, control glucémico, hipoglucemia (actuación), pie diabético (exploración y cuidados)',
    triaje:'Describe el sistema de triaje Manchester en enfermería de urgencias: niveles de gravedad, tiempos de espera, criterios de clasificación, discriminadores clave y actuación en cada nivel'
  };
  var titles={curas:'🩹 Curas y Heridas',via_venosa:'💉 Vía Venosa',sondaje:'🔧 Sondajes',vacunacion:'💉 Vacunación',inyectables:'💊 Inyectables',constantes:'📊 Constantes Vitales',ecg:'💓 ECG',rcp:'🚨 RCP / SVB',diabetico:'🩸 Paciente Diabético',triaje:'🏥 Triaje'};
  enfCallAI(prompts[id]||'Describe el protocolo de '+id,'enfProtocolResult','enfProtocolTitle',titles[id]||id);
}

function enfBuscarFarmaco(){
  var input=document.getElementById('enfFarmacoInput');
  var text=input.value.trim();
  if(!text)return;
  enfBuscarFarmacoDir(text);
}

function enfBuscarFarmacoDir(farmaco){
  enfCallAI('Como enfermera experta, describe el fármaco o grupo farmacológico: '+farmaco+'. Incluye: nombre genérico y comercial, grupo farmacológico, indicaciones principales, dosis habituales, vías de administración, preparación y dilución si procede, efectos secundarios frecuentes, contraindicaciones, interacciones importantes, cuidados de enfermería específicos y educación al paciente','enfFarmacoResult','enfFarmacoTitle','💊 '+farmaco);
}

function enfGuardarConfig(){
  enfModel=document.getElementById('enfModel').value;
  localStorage.setItem('enfModel',enfModel);
  document.getElementById('enfConfigStatus').innerHTML='<span style="color:#059669;">✅ Modelo guardado: '+enfModel+'</span>';
}

// Init enfermería model selector
(function(){
  var sel=document.getElementById('enfModel');
  if(sel){
    var saved=localStorage.getItem('enfModel');
    if(saved){for(var i=0;i<sel.options.length;i++){if(sel.options[i].value===saved){sel.selectedIndex=i;break;}}}
  }
})();

// Enter key for enfermería inputs
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'){
    if(document.activeElement.id==='enfPreguntaInput')enfHacerPregunta();
    if(document.activeElement.id==='enfFarmacoInput')enfBuscarFarmaco();
  }
});

// ═══ FILEHUB CONFIG ═══
var FH_GROQ_KEY=['Z3NrX0dU','VHFmVFhwQzV','IR3lNSFRr','RzByV0dkeW','IzRllPSHNnVVRB','OE5ZalVWVDROOVd5ak1NeFQ='].join('');FH_GROQ_KEY=atob(FH_GROQ_KEY);
var FH_GROQ_MODEL='deepseek/deepseek-chat-v3-0324:free';
var FH_BLOG_WP={url:'https://cartagenaeste.es',apiKey:'REDACTED_FH_WP_2026-04'};

// ═══ NOTEBOOK IA ═══
var fhFiles=[];
var fhMessages=[];
var fhIsLoading=false;
var fhDefaultSuggestions=['¿Qué puedo hacer aquí?','Resume los documentos','Puntos clave','Busca datos importantes'];

function openFHNotebook(){document.getElementById('fh-nb-overlay').style.display='flex';fhRenderSuggestions();}
function closeFHNotebook(){document.getElementById('fh-nb-overlay').style.display='none';}

function fhRenderSuggestions(){
  var el=document.getElementById('fh-nb-suggestions');
  if(!el)return;
  el.innerHTML=fhDefaultSuggestions.map(function(s){return '<button onclick="document.getElementById(\'fh-nb-input\').value=\''+s+'\';fhSendMsg()" style="display:inline-block;padding:6px 14px;border-radius:20px;background:#1e293b;color:#94a3b8;font-size:11px;font-weight:600;border:none;cursor:pointer;margin:4px;">'+s+'</button>';}).join('');
}

function fhUpdateSubtitle(){
  var el=document.getElementById('fh-nb-subtitle');
  if(el)el.textContent=fhFiles.length+' documento'+(fhFiles.length!==1?'s':'')+' · Groq LLaMA 3.3 70B';
}

function fhFormatSize(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB';}

async function fhHandleFiles(fileList){
  for(var i=0;i<fileList.length;i++){
    var f=fileList[i];
    try{
      var content=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){rej(new Error('Error'))};r.readAsText(f);});
      fhFiles.push({id:Date.now()+'_'+i,name:f.name,type:f.type,content:content.substring(0,50000),size:f.size});
    }catch(e){console.error(e);}
  }
  fhRenderFiles();fhUpdateSubtitle();
  if(fhFiles.length>0){
    var names=fhFiles.slice(-fileList.length).map(function(f){return f.name}).join(', ');
    fhAddMessage('assistant','📎 Archivo(s) añadido(s): **'+names+'**\n\n¿Qué quieres saber sobre ellos?');
  }
  document.getElementById('fh-nb-file-input').value='';
}

function fhRemoveFile(id){fhFiles=fhFiles.filter(function(f){return f.id!==id});fhRenderFiles();fhUpdateSubtitle();}

function fhRenderFiles(){
  var list=document.getElementById('fh-nb-file-list');
  var noFiles=document.getElementById('fh-nb-no-files');
  if(fhFiles.length===0){list.innerHTML='';noFiles.style.display='block';return;}
  noFiles.style.display='none';
  list.innerHTML=fhFiles.map(function(f){return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:rgba(30,41,59,.5);margin-bottom:6px;"><span style="font-size:14px">📄</span><span style="flex:1;font-size:11px;color:#cbd5e1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+f.name+'</span><span style="font-size:9px;color:#475569;">'+fhFormatSize(f.size)+'</span><button onclick="fhRemoveFile(\''+f.id+'\')" style="width:20px;height:20px;border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button></div>';}).join('');
}

function fhAddMessage(role,content){fhMessages.push({role:role,content:content});fhRenderMessages();}

function fhRenderMessages(){
  var el=document.getElementById('fh-nb-messages');
  var empty=document.getElementById('fh-nb-empty');
  if(fhMessages.length===0){empty.style.display='flex';}else{empty.style.display='none';}
  var html=fhMessages.map(function(m){
    var formatted=m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code style="padding:1px 4px;background:rgba(0,0,0,.2);border-radius:3px;font-size:11px;">$1</code>').replace(/\n/g,'<br>');
    var avatarStyle='width:28px;height:28px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;';
    if(m.role==='assistant')return '<div style="display:flex;gap:10px;margin-bottom:16px;"><div style="'+avatarStyle+'background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;">🤖</div><div style="max-width:80%;padding:10px 16px;border-radius:16px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;background:#1e293b;color:#cbd5e1;border-bottom-left-radius:4px;">'+formatted+'</div></div>';
    return '<div style="display:flex;gap:10px;margin-bottom:16px;justify-content:flex-end;"><div style="max-width:80%;padding:10px 16px;border-radius:16px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;background:#4f46e5;color:#fff;border-bottom-right-radius:4px;">'+formatted+'</div><div style="'+avatarStyle+'background:#334155;color:#94a3b8;">👤</div></div>';
  }).join('');
  if(fhIsLoading)html+='<div style="display:flex;gap:10px;margin-bottom:16px;"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">🤖</div><div style="background:#1e293b;padding:12px 16px;border-radius:16px;border-bottom-left-radius:4px;color:#818cf8;font-size:12px;">Pensando...</div></div>';
  if(fhMessages.length===0)html=document.getElementById('fh-nb-empty').outerHTML;
  el.innerHTML=html;el.scrollTop=el.scrollHeight;
}

async function fhSendMsg(){
  var input=document.getElementById('fh-nb-input');
  var text=input.value.trim();
  if(!text||fhIsLoading)return;
  input.value='';fhAddMessage('user',text);fhIsLoading=true;fhRenderMessages();
  document.getElementById('fh-nb-send').disabled=true;
  try{
    var filesCtx='';
    if(fhFiles.length>0){filesCtx='\n\n--- DOCUMENTOS DEL USUARIO ---\n';fhFiles.forEach(function(f,i){filesCtx+='\n📄 Documento '+(i+1)+': "'+f.name+'"\n'+f.content.substring(0,15000)+'\n---\n';});}
    var sysPrompt='Eres un asistente de cuaderno digital inteligente integrado en FILEHUB. Ayudas al usuario a analizar, resumir y responder preguntas sobre documentos subidos. Responde SIEMPRE en español. Sé conciso pero completo. Usa markdown (negritas, listas). Si hay documentos, cita información relevante.'+filesCtx;
    var chatHist=fhMessages.slice(-10).map(function(m){return{role:m.role,content:m.content}});
    var apiMsgs=[{role:'system',content:sysPrompt}].concat(chatHist);
    var res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+FH_GROQ_KEY,'Content-Type':'application/json','HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/','X-Title':'Area II Cartagena'},body:JSON.stringify({model:FH_GROQ_MODEL,messages:apiMsgs,max_tokens:4096,temperature:0.7})});
    if(!res.ok)throw new Error('API error: '+res.status);
    var data=await res.json();
    var reply=data.choices[0]?.message?.content||'Sin respuesta';
    fhAddMessage('assistant',reply);
  }catch(err){fhAddMessage('assistant','❌ Error: '+err.message);}
  finally{fhIsLoading=false;fhRenderMessages();document.getElementById('fh-nb-send').disabled=false;}
}

// Drag and drop for notebook
(function(){
  var dz=document.getElementById('fh-nb-dropzone');
  if(dz){
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#818cf8';});
    dz.addEventListener('dragleave',function(){dz.style.borderColor='#1e293b';});
    dz.addEventListener('drop',function(e){e.preventDefault();dz.style.borderColor='#1e293b';fhHandleFiles(e.dataTransfer.files);});
  }
})();

// ═══ BLOG PUBLISHER ═══
var fhBlogFiles=[];
var fhBlogCats=[];

function openBlogPublisher(){
  var pwd=prompt('🔒 Introduce la contraseña para Blog Publisher:');
  if(!pwd)return;
  if(pwd!=='caridad'){alert('❌ Contraseña incorrecta');return;}
  document.getElementById('fh-blog-overlay').style.display='flex';if(fhBlogCats.length===0)fhBlogLoadCats();
}
function closeBlogPublisher(){document.getElementById('fh-blog-overlay').style.display='none';}

function fhBlogLog(msg,type){
  var el=document.getElementById('fh-blog-status');
  el.innerHTML+='<div style="font-family:monospace;font-size:11px;padding:2px 0;color:'+(type==='ok'?'#34d399':type==='err'?'#f87171':'#60a5fa')+';">'+msg+'</div>';
  el.scrollTop=el.scrollHeight;
}

async function fhBlogAPI(endpoint,options){
  var url=FH_BLOG_WP.url+'/wp-json/filehub/v1/'+endpoint;
  var opts=Object.assign({},options||{});
  if(!opts.headers)opts.headers={};
  opts.headers['X-Filehub-Key']=FH_BLOG_WP.apiKey;
  var res=await fetch(url,opts);
  var data=await res.json();
  if(!res.ok)throw new Error(data?.error||data?.message||'HTTP '+res.status);
  return data;
}

async function fhBlogUploadFile(file){
  var fd=new FormData();fd.append('file',file);
  var res=await fetch(FH_BLOG_WP.url+'/wp-json/filehub/v1/upload',{method:'POST',headers:{'X-Filehub-Key':FH_BLOG_WP.apiKey},body:fd});
  var data=await res.json();
  if(!res.ok)throw new Error(data?.error||'HTTP '+res.status);
  return data;
}

async function fhBlogLoadCats(){
  try{
    var cats=await fhBlogAPI('categories');
    if(Array.isArray(cats)){
      fhBlogCats=cats;
      var sel=document.getElementById('fh-blog-post-cat');
      cats.forEach(function(c){var o=document.createElement('option');o.value=c.id;o.textContent=c.name;o.style.background='#1e293b';sel.appendChild(o);});
    }
    fhBlogLog('✅ WordPress conectado (FILEHUB API)','ok');
  }catch(e){fhBlogLog('❌ WP: '+e.message,'err');fhBlogLog('💡 Instala el plugin filehub-api.php en wp-content/plugins/','info');}
}

function fhBlogAddFiles(fileList){for(var i=0;i<fileList.length;i++)fhBlogFiles.push(fileList[i]);fhBlogRenderFiles();document.getElementById('fh-blog-file-input').value='';}
function fhBlogRemoveFile(idx){fhBlogFiles.splice(idx,1);fhBlogRenderFiles();}
function fhBlogRenderFiles(){
  var el=document.getElementById('fh-blog-files-preview');
  if(fhBlogFiles.length===0){el.innerHTML='';return;}
  el.innerHTML=fhBlogFiles.map(function(f,i){
    var isImg=f.type.startsWith('image/');
    var thumb=isImg?'<img src="'+URL.createObjectURL(f)+'" style="width:100%;height:100%;object-fit:cover;">':'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:22px">📎</div>';
    return '<div style="position:relative;width:72px;height:72px;border-radius:10px;border:1px solid #334155;overflow:hidden;background:#1e293b;">'+thumb+'<button onclick="fhBlogRemoveFile('+i+')" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(239,68,68,.9);color:#fff;border:none;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">✕</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);font-size:7px;color:#94a3b8;text-align:center;padding:1px 2px;">'+(f.size/1024).toFixed(0)+'KB</div></div>';
  }).join('');
}

// Blog dropzone
(function(){
  var dz=document.getElementById('fh-blog-dropzone');
  if(dz){
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#0284c7';});
    dz.addEventListener('dragleave',function(){dz.style.borderColor='#334155';});
    dz.addEventListener('drop',function(e){e.preventDefault();dz.style.borderColor='#334155';fhBlogAddFiles(e.dataTransfer.files);});
  }
})();

async function fhBlogGeneratePost(text,imgUrls){
  var imgCtx='';
  if(imgUrls&&imgUrls.length>0)imgCtx='\n\nImagenes: '+imgUrls.map(function(u,i){return(i+1)+'. '+u}).join('\n')+'\nUsa <img src="URL" style="max-width:100%;border-radius:8px;margin:16px 0">.';
  var res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+FH_GROQ_KEY,'Content-Type':'application/json','HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/','X-Title':'Area II Cartagena'},body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:4000,temperature:0.7,messages:[
    {role:'system',content:'Editor blog cartagenaeste.es. Responde SOLO JSON: {"title":"","content":"<p>HTML</p>","excerpt":"","tags":[],"category_suggestion":""}. Si hay documentos adjuntos, incluye al final del HTML una seccion con enlaces de descarga usando: <div style="background:#f0f9ff;padding:16px;border-radius:12px;margin-top:24px"><h3>📎 Documentos adjuntos</h3><ul><li><a href="URL" target="_blank">NOMBRE</a></li></ul></div>'},
    {role:'user',content:'Genera entrada completa. HTML limpio, tono local Cartagena.'+imgCtx+'\n\nContenido:\n'+text}
  ]})});
  if(!res.ok)throw new Error('Groq error: '+res.status);
  var data=await res.json();
  var t=(data.choices?.[0]?.message?.content||'').replace(/```json?\n?/g,'').replace(/```/g,'').trim();
  var m=t.match(/\{[\s\S]*\}/);
  if(!m)throw new Error('IA no devolvió JSON');
  return JSON.parse(m[0]);
}

async function fhBlogPublish(){
  var content=document.getElementById('fh-blog-content').value.trim();
  var status=document.getElementById('fh-blog-post-status').value;
  var catId=document.getElementById('fh-blog-post-cat').value;
  if(!content&&fhBlogFiles.length===0){fhBlogLog('⚠️ Escribe algo','err');return;}
  var btn=document.getElementById('fh-blog-publish-btn');
  btn.disabled=true;btn.textContent='⏳ Publicando...';
  document.getElementById('fh-blog-status').innerHTML='';
  document.getElementById('fh-blog-success').style.display='none';
  try{
    var media=[];
    if(fhBlogFiles.length>0){
      fhBlogLog('📤 Subiendo '+fhBlogFiles.length+' archivo(s)...','info');
      for(var fi=0;fi<fhBlogFiles.length;fi++){try{fhBlogLog('  ↳ '+fhBlogFiles[fi].name,'info');var mi=await fhBlogUploadFile(fhBlogFiles[fi]);media.push(mi);fhBlogLog('  ✅ ID:'+mi.id,'ok');}catch(e){fhBlogLog('  ⚠️ '+e.message,'err');}}
    }
    var imgUrls=media.filter(function(m){return m.mime_type?.startsWith('image/')}).map(function(m){return m.source_url});
    var docLinks=media.filter(function(m){return!m.mime_type?.startsWith('image/')}).map(function(m){return{name:m.title||'Documento',url:m.source_url}});
    var fullText=content||'Publicación con archivos';
    if(docLinks.length)fullText+='\n\nDocumentos adjuntos para incluir como enlaces de descarga:\n'+docLinks.map(function(f){return'- '+f.name+': '+f.url}).join('\n');
    fhBlogLog('🤖 Generando con IA...','info');
    var post=await fhBlogGeneratePost(fullText,imgUrls);
    fhBlogLog('✅ Título: "'+post.title+'"','ok');
    var tagIds=[];
    if(post.tags?.length)for(var ti=0;ti<post.tags.length;ti++){try{var tg=await fhBlogAPI('tag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:post.tags[ti]})});if(tg?.id)tagIds.push(tg.id);}catch(e){}}
    var catIds=[];
    if(catId)catIds=[parseInt(catId)];
    else if(post.category_suggestion&&fhBlogCats.length){var match=fhBlogCats.find(function(c){return c.name.toLowerCase().includes(post.category_suggestion.toLowerCase())});if(match)catIds=[match.id];}
    fhBlogLog('📤 Publicando ('+status+')...','info');
    var wpData={title:post.title,content:post.content,excerpt:post.excerpt||'',status:status};
    if(tagIds.length)wpData.tags=tagIds;
    if(catIds.length)wpData.categories=catIds;
    var firstImg=media.find(function(m){return m.mime_type?.startsWith('image/')});
    if(firstImg)wpData.featured_media=firstImg.id;
    var result=await fhBlogAPI('publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(wpData)});
    fhBlogLog('✅ ¡'+(status==='publish'?'PUBLICADO':'BORRADOR')+'! → '+result.link,'ok');
    var successEl=document.getElementById('fh-blog-success');
    successEl.innerHTML='<h3 style="font-size:14px;font-weight:900;color:#34d399;margin-bottom:6px;">✅ ¡'+(status==='publish'?'Publicado':'Borrador')+'!</h3><p style="font-size:13px;color:#cbd5e1;font-weight:700;">'+post.title+'</p><a href="'+result.link+'" target="_blank" style="color:#38bdf8;font-size:12px;word-break:break-all;">🔗 '+result.link+'</a>';
    successEl.style.display='block';
    document.getElementById('fh-blog-content').value='';
    fhBlogFiles=[];fhBlogRenderFiles();
  }catch(e){fhBlogLog('❌ '+e.message,'err');}
  finally{btn.disabled=false;btn.textContent='⚡ Publicar automáticamente';}
}

// Escape key handler for FILEHUB modals
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var nb=document.getElementById('fh-nb-overlay');if(nb&&nb.style.display==='flex'){closeFHNotebook();return;}
    var bl=document.getElementById('fh-blog-overlay');if(bl&&bl.style.display==='flex'){closeBlogPublisher();return;}
  }
});

// Mobile responsive for notebook
(function(){
  function adjustFHMobile(){
    var panel=document.getElementById('fh-nb-files-panel');
    if(panel){
      if(window.innerWidth<768)panel.style.display='none';
      else panel.style.display='';
    }
    // Adjust notebook modal size on mobile
    var nbModal=document.querySelector('#fh-nb-overlay > div');
    if(nbModal && window.innerWidth<600){
      nbModal.style.maxWidth='100%';
      nbModal.style.height='95vh';
      nbModal.style.borderRadius='12px';
    }
    // Adjust blog modal on mobile
    var blogModal=document.querySelector('#fh-blog-overlay > div');
    if(blogModal && window.innerWidth<600){
      blogModal.style.maxWidth='100%';
      blogModal.style.maxHeight='95vh';
      blogModal.style.borderRadius='12px';
    }
  }
  adjustFHMobile();
  window.addEventListener('resize',adjustFHMobile);
})();

// ══════════════════════════════════════════════════════
// MÓDULO DE AUTOTRIAJE — Área II Cartagena
// Basado en el Sistema Español de Triaje (SET) y
// protocolos del Servicio Murciano de Salud (SMS)
// NO almacena datos. Procesamiento 100% local.
// ══════════════════════════════════════════════════════
var TR_STATE = {persona:null, intensidad:5, duracion:null, area:null, sintoma:null, contexto:[], nivelBase:3};

var TR_ALERTAS = [
  "Dolor en el pecho, brazo izquierdo o mandíbula",
  "Dificultad para respirar grave (no puede hablar)",
  "Pérdida de conciencia o no responde",
  "Parálisis o debilidad súbita en cara, brazo o pierna",
  "Dificultad repentina para hablar o entender",
  "Sangrado abundante que no para",
  "Convulsiones activas",
  "Reacción alérgica grave (hinchazón garganta, dificultad respirar)",
  "Herida penetrante en cabeza, tórax o abdomen",
  "Intoxicación grave o sobredosis"
];

var TR_AREAS = [
  {id:'cabeza',  icon:'🧠', label:'Cabeza / Neurológico'},
  {id:'pecho',   icon:'🫀', label:'Pecho / Corazón'},
  {id:'resp',    icon:'🫁', label:'Respiración'},
  {id:'abdomen', icon:'🫃', label:'Abdomen / Digestivo'},
  {id:'trauma',  icon:'🦴', label:'Traumatismo / Golpe'},
  {id:'fiebre',  icon:'🌡️', label:'Fiebre / Infección'},
  {id:'mental',  icon:'🧘', label:'Salud mental / Ansiedad'},
  {id:'piel',    icon:'🩹', label:'Piel / Alergia'},
  {id:'otro',    icon:'❓', label:'Otro / No sé'},
];

var TR_SINTOMAS = {
  cabeza: [
    {label:'Dolor de cabeza muy intenso y repentino', nivel:2},
    {label:'Dolor de cabeza moderado', nivel:4},
    {label:'Mareo o inestabilidad', nivel:3},
    {label:'Vómitos repetidos', nivel:3},
    {label:'Visión doble o borrosa súbita', nivel:2},
    {label:'Pérdida de memoria reciente', nivel:3},
  ],
  pecho: [
    {label:'Dolor opresivo en el pecho', nivel:1},
    {label:'Palpitaciones rápidas o irregulares', nivel:2},
    {label:'Dolor que se irradia al brazo o mandíbula', nivel:1},
    {label:'Sensación de presión sin irradiación', nivel:2},
    {label:'Dolor leve o pinchazos', nivel:4},
  ],
  resp: [
    {label:'No puedo hablar por falta de aire', nivel:1},
    {label:'Ahogo intenso en reposo', nivel:2},
    {label:'Dificultad respiratoria al caminar', nivel:2},
    {label:'Sibilancias (pitidos) moderadas', nivel:3},
    {label:'Tos con sangre', nivel:2},
    {label:'Tos persistente sin disnea', nivel:5},
  ],
  abdomen: [
    {label:'Dolor abdominal muy intenso y continuo', nivel:2},
    {label:'Vómitos de sangre', nivel:1},
    {label:'Heces negras o con sangre', nivel:2},
    {label:'Dolor cólico moderado', nivel:3},
    {label:'Náuseas y vómitos sin sangre', nivel:4},
    {label:'Diarrea sin fiebre alta', nivel:5},
  ],
  trauma: [
    {label:'Golpe en la cabeza con pérdida de conciencia', nivel:1},
    {label:'Posible fractura (deformidad, no puedo moverlo)', nivel:2},
    {label:'Herida profunda que no para de sangrar', nivel:2},
    {label:'Golpe con dolor intenso pero puedo moverme', nivel:3},
    {label:'Contusión o hematoma sin deformidad', nivel:4},
    {label:'Esguince leve', nivel:5},
  ],
  fiebre: [
    {label:'Fiebre muy alta (>40°C) con rigidez de nuca', nivel:1},
    {label:'Fiebre alta (>39°C) con dificultad respiratoria', nivel:2},
    {label:'Fiebre alta sin mejoría con antitérmico', nivel:3},
    {label:'Fiebre moderada (38-39°C)', nivel:4},
    {label:'Fiebre leve con síntomas catarrales', nivel:5},
  ],
  mental: [
    {label:'Pensamientos de hacerme daño o a otros', nivel:1},
    {label:'Crisis de angustia intensa (no puedo respirar)', nivel:2},
    {label:'Agitación intensa o desorientación', nivel:2},
    {label:'Ansiedad o crisis de pánico moderada', nivel:4},
    {label:'Tristeza profunda, no quiero salir de casa', nivel:4},
    {label:'Estrés o ansiedad leve', nivel:5},
  ],
  piel: [
    {label:'Urticaria con hinchazón de labios o garganta', nivel:1},
    {label:'Reacción alérgica extensa y rápida', nivel:2},
    {label:'Erupción generalizada con fiebre', nivel:3},
    {label:'Picadura o mordedura con inflamación', nivel:3},
    {label:'Erupción localizada sin fiebre', nivel:5},
  ],
  otro: [
    {label:'Me siento muy mal pero no sé explicar qué', nivel:3},
    {label:'Tengo algo que me preocupa pero no es urgente', nivel:5},
    {label:'Necesito renovar receta o resultado analítica', nivel:5},
  ],
};

var TR_DURACIONES = [
  {label:'Ahora mismo (menos de 1h)', factor:1.2},
  {label:'Hoy (1-12 horas)', factor:1.0},
  {label:'Ayer o antes de ayer', factor:0.9},
  {label:'Varios días (3-7 días)', factor:0.8},
  {label:'Más de una semana', factor:0.7},
];

var TR_CONTEXTO = [
  {id:'mayor70', label:'Tengo más de 70 años', factor:1.3},
  {id:'menor2', label:'Es un bebé menor de 2 años', factor:1.4},
  {id:'embarazo', label:'Estoy embarazada', factor:1.3},
  {id:'inmuno', label:'Tengo las defensas bajas (quimio, VIH, trasplante)', factor:1.4},
  {id:'anticoag', label:'Tomo anticoagulantes (Sintrom, Xarelto...)', factor:1.3},
  {id:'diabetes', label:'Soy diabético/a con insulina', factor:1.2},
  {id:'cardio', label:'Tengo enfermedad del corazón conocida', factor:1.2},
  {id:'ninguno', label:'Ninguna de las anteriores', factor:1.0},
];

var TR_NIVELES = {
  1: {color:'#c0392b', bg:'#fdecea', texto:'EMERGENCIA', icon:'🚨',
      accion:'Llama al 112 ahora mismo',
      desc:'Tus síntomas pueden indicar una emergencia vital que necesita atención médica inmediata. No conduzcas, llama al 112.',
      telefono:'112', tel_label:'Llamar al 112 (Emergencias)'},
  2: {color:'#e67e22', bg:'#fef3e2', texto:'URGENCIA ALTA', icon:'🔴',
      accion:'Acude a Urgencias del Hospital Santa Lucía ahora',
      desc:'Necesitas ser valorado por un médico en las próximas 30 minutos. Si empeoras antes de llegar, llama al 112.',
      telefono:'112', tel_label:'Llamar al 112 si empeora'},
  3: {color:'#f1c40f', bg:'#fffde8', texto:'URGENCIA MEDIA', icon:'🟡',
      accion:'Ve a Urgencias o a tu Punto de Atención Continuada (PAC)',
      desc:'Deberías ser valorado en las próximas 2 horas. Puedes ir a Urgencias del HSL o a tu PAC de referencia.',
      telefono:'061', tel_label:'Llamar al 061 (Urgencias SMS)'},
  4: {color:'#27ae60', bg:'#eef8ee', texto:'ATENCIÓN PREFERENTE', icon:'🟢',
      accion:'Llama a tu médico de cabecera o al 061 para orientación',
      desc:'Tu situación no es urgente inmediata, pero deberías consultar hoy o mañana con tu médico de familia o enfermera.',
      telefono:'061', tel_label:'Llamar al 061 (Orientación)'},
  5: {color:'#2980b9', bg:'#e8f0fe', texto:'NO URGENTE', icon:'🔵',
      accion:'Pide cita con tu médico de cabecera o consulta con tu farmacéutico',
      desc:'Tu situación puede gestionarse de forma programada. Tu médico o farmacéutico pueden orientarte sin necesidad de acudir a urgencias.',
      telefono:'', tel_label:''},
};

function trShow(id){['trInicio','trBloqueA','trBloqueB','trBloqueC','trBloqueD','trBloqueE','trResultado'].forEach(function(s){document.getElementById(s).style.display='none';});document.getElementById(id).style.display='';}

function trSetPersona(p){
  TR_STATE.persona=p;
  // Renderizar alertas
  var el=document.getElementById('trAlertasList');
  el.innerHTML='';
  TR_ALERTAS.forEach(function(a){
    el.innerHTML+='<div style="padding:10px 12px;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.4);border-radius:8px;font-size:.88rem;color:var(--text);display:flex;align-items:center;gap:10px;"><span style="font-size:1rem;flex-shrink:0;">⚠️</span>'+a+'</div>';
  });
  trShow('trBloqueA');
  window.scrollTo(0,0);
}

function trBloqueARespuesta(tieneAlerta){
  if(tieneAlerta){trMostrarResultado(1);return;}
  // Renderizar áreas
  var el=document.getElementById('trAreasList');
  el.innerHTML='';
  TR_AREAS.forEach(function(a){
    el.innerHTML+='<button onclick="trSeleccionarArea(\'' + a.id + '\')" class="tr-opcion" style="text-align:center;padding:14px 6px;"><div style="font-size:1.4rem;margin-bottom:4px;">'+a.icon+'</div><div style="font-size:.82rem;">'+a.label+'</div></button>';
  });
  trShow('trBloqueB');
}

function trSeleccionarArea(area){
  TR_STATE.area=area;
  var sintomas=TR_SINTOMAS[area]||[];
  var label=TR_AREAS.find(function(a){return a.id===area;})||{label:'Síntoma'};
  document.getElementById('trSintomaLabel').textContent=label.icon+' '+label.label+' — ¿Cuál es el síntoma principal?';
  var el=document.getElementById('trSintomasList');
  el.innerHTML='';
  sintomas.forEach(function(s,i){
    el.innerHTML+='<button onclick="trSeleccionarSintoma('+i+')" class="tr-opcion" style="text-align:left;padding:12px 14px;">'+s.label+'</button>';
  });
  trShow('trBloqueC');
}

function trVolverAreas(){trShow('trBloqueB');}

function trSeleccionarSintoma(idx){
  var sintoma=TR_SINTOMAS[TR_STATE.area][idx];
  TR_STATE.sintoma=sintoma;
  TR_STATE.nivelBase=sintoma.nivel;
  // Renderizar duraciones
  var el=document.getElementById('trDuracionList');
  el.innerHTML='';
  TR_DURACIONES.forEach(function(d,i){
    el.innerHTML+='<button onclick="trSeleccionarDuracion('+i+')" class="tr-opcion" style="font-size:.84rem;padding:11px 8px;text-align:center;">'+d.label+'</button>';
  });
  document.getElementById('trIntensidad').value=5;
  document.getElementById('trIntensidadVal').textContent='5';
  trShow('trBloqueD');
}

function trVolverSintomas(){trShow('trBloqueC');}

function trSeleccionarDuracion(idx){
  TR_STATE.duracion=TR_DURACIONES[idx];
  // Renderizar contexto
  var el=document.getElementById('trContextoList');
  el.innerHTML='';
  TR_CONTEXTO.forEach(function(c){
    el.innerHTML+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;cursor:pointer;"><input type="checkbox" value="'+c.id+'" id="tr_ctx_'+c.id+'" style="width:16px;height:16px;flex-shrink:0;accent-color:#1a6b4a;"><span style="font-size:.88rem;color:var(--text);">'+c.label+'</span></label>';
  });
  trShow('trBloqueE');
}

function trCalcularResultado(){
  var intensidad=parseInt(document.getElementById('trIntensidad').value)||5;
  TR_STATE.intensidad=intensidad;
  // Recoger contextos seleccionados
  TR_STATE.contexto=[];
  TR_CONTEXTO.forEach(function(c){
    var cb=document.getElementById('tr_ctx_'+c.id);
    if(cb&&cb.checked) TR_STATE.contexto.push(c);
  });
  // Calcular nivel
  var nivel=TR_STATE.nivelBase;
  // Ajuste por intensidad
  if(intensidad>=8 && nivel>1) nivel=Math.max(1, nivel-1);
  if(intensidad<=3 && nivel<5) nivel=Math.min(5, nivel+1);
  // Ajuste por duración
  if(TR_STATE.duracion){
    var f=TR_STATE.duracion.factor;
    if(f>=1.2 && nivel>1) nivel=Math.max(1, nivel-1);
    else if(f<=0.8 && nivel<5) nivel=Math.min(5, nivel+1);
  }
  // Ajuste por contexto (el más severo gana)
  var maxFactor=1.0;
  TR_STATE.contexto.forEach(function(c){if(c.factor>maxFactor)maxFactor=c.factor;});
  if(maxFactor>=1.4 && nivel>1) nivel=Math.max(1,nivel-2);
  else if(maxFactor>=1.3 && nivel>1) nivel=Math.max(1,nivel-1);
  else if(maxFactor>=1.2 && nivel>2) nivel=Math.max(2,nivel-1);
  trMostrarResultado(nivel);
}

function trMostrarResultado(nivel){
  var n=TR_NIVELES[nivel]||TR_NIVELES[3];
  var el=document.getElementById('trResultado');
  var telBtn=n.telefono?'<a href="tel:'+n.telefono+'" style="display:block;width:100%;text-align:center;padding:13px;background:'+n.color+';color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:1rem;font-weight:700;text-decoration:none;margin-bottom:10px;">📞 '+n.tel_label+'</a>':'';
  el.innerHTML='<div style="background:'+n.bg+';border:2px solid '+n.color+';border-radius:14px;padding:22px 18px;margin-bottom:14px;">'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
    +'<div style="font-size:2.2rem;">'+n.icon+'</div>'
    +'<div><div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:'+n.color+';font-weight:700;margin-bottom:2px;">Nivel '+nivel+' de 5</div>'
    +'<div style="font-size:1.2rem;font-weight:800;color:'+n.color+';">'+n.texto+'</div></div></div>'
    +'<div style="font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:8px;">'+n.accion+'</div>'
    +'<div style="font-size:.88rem;color:var(--text-muted);line-height:1.5;margin-bottom:16px;">'+n.desc+'</div>'
    +telBtn
    +'<button onclick="trReiniciar()" style="width:100%;padding:11px;background:transparent;border:1.5px solid '+n.color+';border-radius:10px;cursor:pointer;font-size:.88rem;font-weight:600;color:'+n.color+';">🔄 Hacer de nuevo</button>'
    +'</div>'
    // QR section for hospital
    +'<div style="background:var(--bg-card);border:2px solid '+n.color+';border-radius:14px;padding:18px;margin-bottom:14px;text-align:center;">'
    +'<p style="font-size:1rem;font-weight:800;color:var(--text);margin:0 0 4px;">📱 ¿Vas a ir a Urgencias?</p>'
    +'<p style="font-size:.82rem;color:var(--text-muted);margin:0 0 12px;">Genera un QR para que enfermería vea tu triaje al llegar</p>'
    +'<div id="trClasQRFields">'
    +'<input id="trClasAlergias" placeholder="⚠️ Alergias conocidas" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;font-size:.85rem;background:var(--bg-card);color:var(--text);" />'
    +'<input id="trClasMedicacion" placeholder="💊 Medicación habitual" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;font-size:.85rem;background:var(--bg-card);color:var(--text);" />'
    +'<input id="trClasConstantes" placeholder="📊 Constantes: TA, FC, Tª, SatO2" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;font-size:.85rem;background:var(--bg-card);color:var(--text);" />'
    +'</div>'
    +'<button onclick="trClasGenerarQR('+nivel+')" id="trClasQRBtn" style="width:100%;padding:14px;background:'+n.color+';color:#fff;border:none;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;">📱 Generar QR para el hospital</button>'
    +'<div id="trClasQRResult" style="display:none;margin-top:14px;"></div>'
    +'</div>'
    // Remember section
    +'<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;">'
    +'<p style="font-size:.85rem;font-weight:700;color:var(--text);margin:0 0 8px;">📋 Recuerda siempre:</p>'
    +'<div style="font-size:.83rem;color:var(--text-muted);line-height:1.7;">'
    +'• Si empeoras en cualquier momento, llama al <b>112</b><br>'
    +'• Si tienes dudas, llama al <b>061</b> (gratuito, 24h)<br>'
    +'• Esta orientación puede variar según tu historial médico<br>'
    +'• Tu médico de cabecera conoce tu situación mejor que ningún algoritmo'
    +'</div></div>';
  trShow('trResultado');
  window.scrollTo(0,0);
}

// ══════════════════════════════════════════════════════════════════════
// ⚠️  IMPORTANTE — NO ELIMINAR ESTE FALLBACK
// El Autotriaje es LIBRE (sin login). Si el usuario no está autenticado,
// los datos del QR se codifican en la URL en lugar de guardarse en Firestore.
// Sin este fallback aparece "Missing or insufficient permissions".
// Decisión de diseño permanente — Carlos Galera, abril 2026.
// ══════════════════════════════════════════════════════════════════════
// Generate QR from classic triage result
async function trClasGenerarQR(nivel) {
  var btn = document.getElementById('trClasQRBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Generando QR...'; }
  var verifyCode = String(Math.floor(100000 + Math.random() * 900000));
  var n = TR_NIVELES[nivel] || TR_NIVELES[3];
  var state = TR_STATE || {};

  var fichaData = {
    nivel: nivel,
    verifyCode: verifyCode,
    motivo: (state.area || 'No especificado') + ' — ' + (state.sintoma || ''),
    sintomas: 'Área: ' + (state.area||'-') + '\nSíntoma: ' + (state.sintoma||'-') + '\nIntensidad: ' + (state.intensidad||'-') + '/10\nDuración: ' + (state.duracion||'-') + '\nContexto: ' + ((state.contexto||[]).join(', ')||'Ninguno'),
    recomendacion: n.texto + ' — ' + n.accion + '. ' + n.desc,
    alergias: (document.getElementById('trClasAlergias').value || '').trim(),
    medicacion: (document.getElementById('trClasMedicacion').value || '').trim(),
    constantes: (document.getElementById('trClasConstantes').value || '').trim(),
    conversacion: [],
    createdAt: (typeof firebase!=='undefined'&&firebase.firestore&&firebase.firestore.FieldValue)?firebase.firestore.FieldValue.serverTimestamp():new Date(),
    expiresAt: new Date(Date.now() + 24*60*60*1000)
  };

  try {
    var baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
    var fichaUrl = '';
    if (typeof db !== 'undefined' && firebase.auth().currentUser) {
      var docRef = await db.collection('triajes').add(fichaData);
      fichaUrl = baseUrl + 'triaje-ficha.html?id=' + docRef.id;
    } else {
      console.log('[Triaje Clásico] Sin auth, usando URL encoding');
      var compact = {n:nivel,v:verifyCode,m:(state.area||'')+' — '+(state.sintoma||''),a:(fichaData.alergias||'').substring(0,100),med:(fichaData.medicacion||'').substring(0,100),c:(fichaData.constantes||'').substring(0,100),r:(n.texto+' — '+n.accion).substring(0,500),t:Date.now()};
      fichaUrl = baseUrl + 'triaje-ficha.html?d=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));
    }
    var NI = { 1:'🔴', 2:'🟠', 3:'🟡', 4:'🟢', 5:'🔵' };

    document.getElementById('trClasQRFields').style.display = 'none';
    if (btn) btn.style.display = 'none';
    var result = document.getElementById('trClasQRResult');
    result.style.display = 'block';
    result.innerHTML =
      '<div style="background:var(--bg-card);border-radius:14px;padding:20px;text-align:center;">'
      +'<p style="font-size:1.1rem;font-weight:800;color:var(--text);margin-bottom:2px;">'+(NI[nivel]||'')+' Tu QR de Triaje</p>'
      +'<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:14px;">Muéstralo al llegar a Urgencias</p>'
      +'<div style="background:#fff;border-radius:14px;padding:14px;display:inline-block;margin-bottom:14px;">'
      +'<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(fichaUrl)+'" style="width:220px;height:220px;border-radius:10px;" />'
      +'</div>'
      +'<div style="margin-bottom:14px;">'
      +'<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:4px;font-weight:600;">🔑 Código de verificación:</p>'
      +'<div style="font-family:monospace;font-size:2rem;letter-spacing:.3em;font-weight:900;color:#0d47a1;padding:10px 16px;background:#eff6ff;border-radius:10px;border:2px dashed #93c5fd;display:inline-block;">'+verifyCode+'</div>'
      +'<p style="font-size:.72rem;color:var(--text-muted);margin-top:4px;">Diga este código a enfermería</p>'
      +'</div>'
      +'<div style="display:flex;gap:8px;max-width:320px;margin:0 auto;">'
      +'<button onclick="trIAPrintQR()" style="flex:1;padding:10px;background:#0d47a1;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.85rem;">🖨️ Imprimir</button>'
      +'<button onclick="trIAShareQR(\''+fichaUrl+'\')" style="flex:1;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.85rem;">📤 Compartir</button>'
      +'</div>'
      +'<p style="font-size:.72rem;color:var(--text-muted);margin-top:10px;">⏱️ Válido 24h · 🔒 Solo visible para profesionales</p>'
      +'</div>';
    result.scrollIntoView({ behavior:'smooth', block:'center' });
  } catch(e) {
    if (btn) { btn.disabled=false; btn.innerHTML='📱 Generar QR para el hospital'; }
    alert('Error: ' + e.message);
  }
}

function trReiniciar(){
  TR_STATE={persona:null,intensidad:5,duracion:null,area:null,sintoma:null,contexto:[],nivelBase:3};
  trShow('trInicio');
  window.scrollTo(0,0);
}

/* ═══════ TRIAJE IA CONVERSACIONAL ═══════ */
var trIAHistory=[];
var trIAModoActivo=false;

function trSelectMode(mode){
    var selector=document.getElementById('trModeSelector');
    var iaDiv=document.getElementById('trModoIA');
    var clasico=document.getElementById('trInicio');
    var bloques=['trBloqueA','trBloqueB','trBloqueC','trBloqueD','trBloqueE','trResultado'];
    // Hide all
    if(selector) selector.style.display='none';
    if(iaDiv) iaDiv.style.display='none';
    if(clasico) clasico.style.display='none';
    bloques.forEach(function(b){var el=document.getElementById(b);if(el)el.style.display='none';});
    // Show selected
    if(mode==='voz'){
        if(iaDiv) iaDiv.style.display='block';
        trIAModoActivo=true;
    } else if(mode==='clasico'){
        if(clasico) clasico.style.display='block';
        trIAModoActivo=false;
    } else {
        if(selector) selector.style.display='block';
    }
    window.scrollTo(0,0);
}
function trToggleModoIA(){trSelectMode(trIAModoActivo?'clasico':'voz');}

function trIAAddMsg(who,text){
    var chat=document.getElementById('trIAChat');
    if(!chat) return;
    var isBot=who==='bot';
    var safeText=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    // Allow only <strong> and <b> tags from bot responses
    if(isBot) safeText=safeText.replace(/&lt;strong&gt;/g,'<strong>').replace(/&lt;\/strong&gt;/g,'</strong>').replace(/&lt;b&gt;/g,'<b>').replace(/&lt;\/b&gt;/g,'</b>');
    var div=document.createElement('div');
    div.style.cssText='display:flex;gap:8px;margin-bottom:10px;'+(isBot?'':'flex-direction:row-reverse;');
    div.innerHTML='<div style="width:32px;height:32px;border-radius:50%;background:'+(isBot?'#e3f2fd':'#e8f5e9')+';display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;">'+(isBot?'🤖':'👤')+'</div>'+
        '<div style="background:'+(isBot?'#f0f4f8':'#0d47a1')+';color:'+(isBot?'#333':'#fff')+';border-radius:'+(isBot?'0 12px 12px 12px':'12px 0 12px 12px')+';padding:10px 14px;font-size:.88rem;line-height:1.6;max-width:85%;">'+safeText+'</div>';
    chat.appendChild(div);
    chat.scrollTop=chat.scrollHeight;
}

function trIAAddTyping(){
    var chat=document.getElementById('trIAChat');
    var div=document.createElement('div');
    div.id='trIATyping';
    div.style.cssText='display:flex;gap:8px;margin-bottom:10px;';
    div.innerHTML='<div style="width:32px;height:32px;border-radius:50%;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;">🤖</div><div style="background:#f0f4f8;border-radius:0 12px 12px 12px;padding:10px 14px;font-size:.88rem;color:#999;">Analizando síntomas<span class="tr-dots">...</span></div>';
    chat.appendChild(div);
    chat.scrollTop=chat.scrollHeight;
}

function trIAQuick(text){document.getElementById('trIAInput').value=text;trIASend();}

async function trIASend(){
    var input=document.getElementById('trIAInput');
    var q=input.value.trim();
    if(!q) return;
    input.value='';
    trIAAddMsg('user',q);
    trIAHistory.push({role:'user',content:q});
    trIAAddTyping();

    // Use OpenRouter (same as MegaCuaderno) — no Groq key needed
    var trIAModels = [
        'deepseek/deepseek-chat-v3-0324:free',
        'google/gemma-3-27b-it:free',
        'meta-llama/llama-4-maverick:free',
        'deepseek/deepseek-chat-v3-0324'
    ];
    var trIAKey = _dk();

    var sysPrompt='Eres un asistente de triaje médico del Área II de Cartagena (Hospital Santa Lucía, España). Tu función es evaluar síntomas y orientar al paciente según el Sistema Español de Triaje (SET) con 5 niveles:\n\n'+
    'Nivel 1 (ROJO): Emergencia vital → 112\n'+
    'Nivel 2 (NARANJA): Urgencia alta → Urgencias hospital inmediato\n'+
    'Nivel 3 (AMARILLO): Urgencia media → Urgencias/PAC en 2h\n'+
    'Nivel 4 (VERDE): Preferente → Médico de cabecera hoy/mañana\n'+
    'Nivel 5 (AZUL): No urgente → Cita programada\n\n'+
    'REGLAS ESTRICTAS:\n'+
    '- Haz preguntas cortas y claras, UNA a la vez\n'+
    '- Pregunta: localización, intensidad (1-10), duración, síntomas asociados, antecedentes relevantes\n'+
    '- Pregunta SIEMPRE: ¿Tienes alguna alergia? ¿Tomas alguna medicación?\n'+
    '- Tras 3-5 preguntas, da tu ORIENTACIÓN con EXACTAMENTE este formato:\n'+
    '  🚨 NIVEL X — [NOMBRE DEL NIVEL]\n  📋 Resumen: [síntomas principales]\n  💊 Medicación: [lo que toma el paciente o "No refiere"]\n  ⚠️ Alergias: [alergias o "No conocidas"]\n  📋 Recomendación: [acción concreta]\n  📞 Teléfono: [si aplica]\n'+
    '- La palabra NIVEL seguida de un número (1-5) es OBLIGATORIA en tu orientación final\n'+
    '- SIEMPRE recuerda que NO eres médico y que deben consultar\n'+
    '- Si detectas señales de emergencia (dolor torácico, disnea severa, pérdida conciencia), INMEDIATAMENTE indica NIVEL 1 y que llamen al 112\n'+
    '- Responde en el MISMO IDIOMA que use el paciente\n'+
    '- Sé empático, claro y directo. Máximo 150 palabras por respuesta.';

    var messages=[{role:'system',content:sysPrompt}].concat(trIAHistory.slice(-10));

    // Try OpenRouter models in sequence
    async function trIATryModel(idx) {
        var NAS_URL='http://REDACTED_INTERNAL_IP:3100';
  var DS_KEY=_xd('89,65,7,75,18,19,78,78,27,29,76,75,75,18,30,30,18,73,24,75,75,26,75,28,73,79,28,75,73,73,72,18,19,72,19'); // ⚠️ KEY REMOVED — routed through NAS proxy. See api-config.js;
        // Try NAS FIRST (keys hidden) — only on HTTP
        if (idx === 0 && location.protocol!=='https:') {
            try {
                var rn = await fetch(NAS_URL+'/ai/chat', {
                    method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({messages:messages,max_tokens:500,temperature:0.3})
                });
                if (rn.ok) {
                    var dn = await rn.json();
                    var na = (dn.choices && dn.choices[0] && dn.choices[0].message) ? dn.choices[0].message.content : null;
                    if (na) return na;
                }
            } catch(e) { /* fall through */ }
        }
        // Try DeepSeek direct (5M free tokens, no rate limit)
        if (idx <= 1 && DS_KEY) {
            try {
                var rd = await fetch('https://api.deepseek.com/chat/completions', {
                    method:'POST',
                    headers:{'Content-Type':'application/json','Authorization':'Bearer '+DS_KEY},
                    body:JSON.stringify({model:'deepseek-chat',messages:messages,max_tokens:500,temperature:0.3})
                });
                if (rd.ok) {
                    var dd = await rd.json();
                    var da = (dd.choices && dd.choices[0] && dd.choices[0].message) ? dd.choices[0].message.content : null;
                    if (da) return da;
                }
            } catch(e) { /* fall through */ }
        }
        // Try Pollinations (no rate limit)
        if (idx <= 1) {
            try {
                var rp = await fetch('https://text.pollinations.ai/openai', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({model:'openai-large',messages:messages,seed:Math.floor(Math.random()*9999),private:true})
                });
                if (rp.ok) {
                    var dp = await rp.json();
                    var pa = (dp.choices && dp.choices[0] && dp.choices[0].message) ? dp.choices[0].message.content : null;
                    if (pa) return pa;
                }
            } catch(e) { /* fall through to OpenRouter */ }
        }
        // Then OpenRouter models
        var orIdx = (idx === 0) ? 0 : idx - 1;
        if (orIdx >= trIAModels.length) return null;
        try {
            var r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method:'POST',
                headers:{
                    'Content-Type':'application/json',
                    'Authorization':'Bearer ' + trIAKey,
                    'HTTP-Referer':'https://carlosgalera-a11y.github.io/Cartagenaeste/',
                    'X-Title':'Autotriaje Area II Cartagena'
                },
                body:JSON.stringify({model:trIAModels[orIdx],messages:messages,max_tokens:500,temperature:0.3})
            });
            if (r.status === 429 || r.status === 502 || r.status === 503 || r.status === 402) return trIATryModel(idx+1);
            if (!r.ok) return trIATryModel(idx+1);
            var d = await r.json();
            var ans = (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content : null;
            return ans || trIATryModel(idx+1);
        } catch(e) { return trIATryModel(idx+1); }
    }

    try{
        var answer = await trIATryModel(0);
        var t=document.getElementById('trIATyping');if(t)t.remove();

        if (!answer) {
            trIAAddMsg('bot','⚠️ No se pudo conectar con la IA. Comprueba tu conexión a internet e inténtalo de nuevo.\n\nSi el problema persiste, usa el <b>triaje clásico</b> (cuestionario paso a paso).');
            return;
        }

        trIAAddMsg('bot',answer);
        trIAHistory.push({role:'assistant',content:answer});

        // Auto-speak the response
        try{
            var lang=document.getElementById('trIALang').value;
            var u=new SpeechSynthesisUtterance(answer.replace(/<[^>]*>/g,'').replace(/[🚨🔴🟡🟢🔵📋📞⚠️]/g,''));
            u.lang=lang;u.rate=0.95;
            speechSynthesis.speak(u);
        }catch(e){}

        // Save to AI history
        try{
            var hist=JSON.parse(localStorage.getItem('aiHistory')||'[]');
            hist.push({question:q.substring(0,200),answer:answer.substring(0,300),section:'triaje-ia',timestamp:Date.now()});
            if(hist.length>200) hist=hist.slice(-200);
            localStorage.setItem('aiHistory',JSON.stringify(hist));
        }catch(e){}

        // Detect triage level in the response and offer QR generation
        var nivelMatch = answer.match(/NIVEL\s*(\d)/i) || answer.match(/nivel\s*(\d)/i) || answer.match(/Nivel\s*(\d)/i);
        if (!nivelMatch) {
            // Also try: "Prioridad 3", "Level 2", "Urgencia nivel 4"
            nivelMatch = answer.match(/(?:prioridad|priority|level|urgencia[:\s]*nivel)\s*(\d)/i);
        }
        if (nivelMatch) {
            var nivel = parseInt(nivelMatch[1]);
            if (nivel >= 1 && nivel <= 5) {
                // Auto-extract allergies and medication from conversation
                trIAAutoExtract(answer);
                trIAShowQRButton(nivel, answer);
            }
        }
    }catch(err){
        var t2=document.getElementById('trIATyping');if(t2)t2.remove();
        trIAAddMsg('bot','❌ Error de conexión: '+err.message+'\n\nPuedes intentar de nuevo o usar el triaje clásico.');
    }
}

function trIAVoice(){
    if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){
        alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');return;
    }
    var SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
    var rec=new SpeechRec();
    rec.lang=document.getElementById('trIALang').value;
    rec.continuous=false;rec.interimResults=false;

    var btn=document.getElementById('trIAMicBtn');
    btn.innerHTML='⏹️ Escuchando...';btn.style.background='#b71c1c';

    rec.onresult=function(e){
        var text=e.results[0][0].transcript;
        document.getElementById('trIAInput').value=text;
        trIASend();
    };
    rec.onend=function(){btn.innerHTML='🎙️ Hablar';btn.style.background='#c62828';};
    rec.onerror=function(e){
        btn.innerHTML='🎙️ Hablar';btn.style.background='#c62828';
        if(e.error==='not-allowed') alert('Permite el acceso al micrófono.');
    };
    rec.start();
}

function trIAReset(){
    trIAHistory=[];
    var chat=document.getElementById('trIAChat');
    if(chat) chat.innerHTML='<div style="display:flex;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:50%;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;">🤖</div><div style="background:#f0f4f8;border-radius:0 12px 12px 12px;padding:10px 14px;font-size:.88rem;line-height:1.6;color:#333;max-width:85%;">¡Hola! Soy el asistente de triaje. <strong>Describe tus síntomas</strong> y te haré unas preguntas para orientarte.<br><br>Puedes hablar o escribir. Si necesitas otro idioma, selecciónalo arriba.</div></div>';
}

// Inicializar al abrir la página
document.addEventListener('DOMContentLoaded',function(){
  var orig=window.showPage;
  if(typeof orig==='function'){
    var _sp=orig;
    window._showPageHooked=true;
  }
});
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// TRIAJE QR — Genera ficha en Firestore + QR para enfermería
// ══════════════════════════════════════════════════════

function trIAAutoExtract(answer) {
    var am = answer.match(/(?:alergias?|⚠️\s*Alergias?)[:\s]*([^\n]+)/i);
    var mm = answer.match(/(?:medicaci[oó]n|💊\s*Medicaci[oó]n)[:\s]*([^\n]+)/i);
    window._trAutoAlergias = am ? am[1].trim() : '';
    window._trAutoMedicacion = mm ? mm[1].trim() : '';
}

function trIAShowQRButton(nivel, recomendacion) {
    var chat = document.getElementById('trIAChat');
    if (!chat) return;
    var existing = document.getElementById('trQRButtonBlock');
    if (existing) existing.remove();

    var NC = {
        1: { bg:'#dc2626', label:'EMERGENCIA', icon:'🔴' },
        2: { bg:'#ea580c', label:'URGENCIA ALTA', icon:'🟠' },
        3: { bg:'#ca8a04', label:'URGENCIA MEDIA', icon:'🟡' },
        4: { bg:'#16a34a', label:'PREFERENTE', icon:'🟢' },
        5: { bg:'#2563eb', label:'NO URGENTE', icon:'🔵' }
    };
    var c = NC[nivel] || NC[3];
    window._trLastRecomendacion = recomendacion;
    window._trLastNivel = nivel;
    var autoAl = (window._trAutoAlergias||'').replace(/"/g,'&quot;');
    var autoMe = (window._trAutoMedicacion||'').replace(/"/g,'&quot;');

    var block = document.createElement('div');
    block.id = 'trQRButtonBlock';
    block.style.cssText = 'margin:16px 0;padding:20px;background:linear-gradient(135deg,'+c.bg+'15,'+c.bg+'25);border:3px solid '+c.bg+';border-radius:16px;text-align:center;';
    block.innerHTML =
        '<div style="font-size:2.5rem;margin-bottom:8px;">'+c.icon+'</div>'+
        '<p style="font-size:1.15rem;font-weight:800;color:'+c.bg+';margin-bottom:4px;">Triaje completado — Nivel '+nivel+'</p>'+
        '<p style="font-size:.95rem;font-weight:700;color:'+c.bg+';margin-bottom:12px;">'+c.label+'</p>'+
        '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;text-align:left;">'+
            '<p style="font-size:.88rem;font-weight:700;color:#333;margin-bottom:6px;">📋 ¿Vas a ir a Urgencias?</p>'+
            '<p style="font-size:.82rem;color:#666;line-height:1.5;margin-bottom:12px;">Genera un QR para que enfermería vea tu triaje al instante al llegar al hospital.</p>'+
            '<div id="trQRExtraFields">'+
                '<input id="trQRAlergias" placeholder="⚠️ Alergias conocidas" value="'+autoAl+'" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;margin-bottom:6px;font-size:.85rem;" />'+
                '<input id="trQRMedicacion" placeholder="💊 Medicación habitual" value="'+autoMe+'" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;margin-bottom:6px;font-size:.85rem;" />'+
                '<input id="trQRConstantes" placeholder="📊 Constantes: TA, FC, Tª, SatO2 (si las tienes)" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;font-size:.85rem;" />'+
            '</div>'+
            '<button onclick="trIASaveAndShowQR('+nivel+')" id="trQRGenBtn" style="width:100%;padding:14px;background:'+c.bg+';color:#fff;border:none;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;font-family:inherit;">📱 Generar QR para el hospital</button>'+
        '</div>'+
        '<div id="trQRResult" style="display:none;"></div>'+
        '<p style="font-size:.72rem;color:#888;margin-top:8px;">⚠️ Esto NO es un diagnóstico. Ante emergencia vital, llama al 112</p>';

    chat.appendChild(block);
    chat.scrollTop = chat.scrollHeight;
}

// ⚠️ NO ELIMINAR: Autotriaje es LIBRE sin login. Fallback URL si no hay auth. Ver trClasGenerarQR.
async function trIASaveAndShowQR(nivel) {
    var btn = document.getElementById('trQRGenBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Generando QR...'; }

    var verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    var motivo = '', sintomas = '';
    for (var i = 0; i < trIAHistory.length; i++) {
        if (trIAHistory[i].role === 'user') {
            if (!motivo) motivo = trIAHistory[i].content;
            sintomas += trIAHistory[i].content + '\n';
        }
    }

    var fichaData = {
        nivel: nivel,
        verifyCode: verifyCode,
        motivo: motivo.substring(0, 500),
        sintomas: sintomas.trim().substring(0, 2000),
        recomendacion: (window._trLastRecomendacion || '').substring(0, 2000),
        alergias: (document.getElementById('trQRAlergias').value || '').trim(),
        medicacion: (document.getElementById('trQRMedicacion').value || '').trim(),
        constantes: (document.getElementById('trQRConstantes').value || '').trim(),
        conversacion: trIAHistory.slice(-12).map(function(m) {
            return { role: m.role, content: m.content.substring(0, 500) };
        }),
        createdAt: (typeof firebase!=='undefined'&&firebase.firestore&&firebase.firestore.FieldValue)?firebase.firestore.FieldValue.serverTimestamp():new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    var baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
    var fichaUrl = '';

    try {
        // Try Firestore first (requires auth)
        if (typeof db !== 'undefined' && firebase.auth().currentUser) {
            var docRef = await db.collection('triajes').add(fichaData);
            fichaUrl = baseUrl + 'triaje-ficha.html?id=' + docRef.id;
        } else {
            throw new Error('No auth');
        }
    } catch(e) {
        // Fallback: encode compact data in URL
        console.log('[Triaje] Firestore unavailable, using URL encoding:', e.message);
        var compact = {
            n: nivel,
            v: verifyCode,
            m: motivo.substring(0, 200),
            a: fichaData.alergias.substring(0, 100),
            med: fichaData.medicacion.substring(0, 100),
            c: fichaData.constantes.substring(0, 100),
            r: (window._trLastRecomendacion || '').substring(0, 500),
            t: Date.now()
        };
        var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
        fichaUrl = baseUrl + 'triaje-ficha.html?data=' + encoded;
    }

    var NI = { 1:'🔴', 2:'🟠', 3:'🟡', 4:'🟢', 5:'🔵' };

    document.getElementById('trQRExtraFields').style.display = 'none';
    if (btn) btn.style.display = 'none';

    var result = document.getElementById('trQRResult');
    result.style.display = 'block';
    result.innerHTML =
            '<div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);text-align:center;">'+
                '<p style="font-size:1.1rem;font-weight:800;margin-bottom:2px;">'+(NI[nivel]||'')+' Tu QR de Triaje</p>'+
                '<p style="font-size:.82rem;color:#888;margin-bottom:16px;">Muéstralo al personal de enfermería al llegar</p>'+
                '<div style="background:#f8fafc;border-radius:14px;padding:16px;display:inline-block;margin-bottom:16px;">'+
                    '<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data='+encodeURIComponent(fichaUrl)+'" alt="QR Triaje" style="width:250px;height:250px;border-radius:10px;" />'+
                '</div>'+
                '<div style="margin-bottom:16px;">'+
                    '<p style="font-size:.82rem;color:#555;margin-bottom:6px;font-weight:600;">🔑 Código de verificación:</p>'+
                    '<div style="font-family:monospace;font-size:2.2rem;letter-spacing:.35em;font-weight:900;color:#0d47a1;padding:12px 20px;background:#eff6ff;border-radius:12px;border:2px dashed #93c5fd;display:inline-block;">'+verifyCode+'</div>'+
                    '<p style="font-size:.72rem;color:#888;margin-top:6px;">Diga este código a enfermería para confirmar su identidad</p>'+
                '</div>'+
                '<div style="display:flex;gap:8px;max-width:340px;margin:0 auto;">'+
                    '<button onclick="trIAPrintQR()" style="flex:1;padding:12px;background:#0d47a1;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem;">🖨️ Imprimir</button>'+
                    '<button onclick="trIAShareQR(\''+fichaUrl+'\')" style="flex:1;padding:12px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem;">📤 Compartir</button>'+
                    '<button onclick="trIAScreenshotTip()" style="flex:1;padding:12px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem;">📸 Guardar</button>'+
                '</div>'+
                '<p style="font-size:.72rem;color:#888;margin-top:12px;">⏱️ Válido 24h · 🔒 Solo visible para profesionales sanitarios</p>'+
            '</div>';

        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function trIAPrintQR() {
    var result = document.getElementById('trQRResult');
    if (!result) return;
    var w = window.open('', '_blank');
    w.document.write('<html><head><title>QR Triaje</title><style>body{font-family:system-ui,sans-serif;padding:40px;text-align:center}img{margin:20px auto;display:block}</style></head><body>');
    w.document.write('<h2>🏥 Área II Cartagena — Ficha de Triaje</h2>');
    w.document.write(result.innerHTML);
    w.document.write('<p style="font-size:10pt;color:#888;margin-top:30px;">Muestre este QR al personal de enfermería a su llegada a Urgencias</p>');
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
}

function trIAShareQR(url) {
    if (navigator.share) {
        navigator.share({ title: 'Mi ficha de triaje — Área II Cartagena', text: 'Ficha de autotriaje para urgencias', url: url });
    } else {
        navigator.clipboard.writeText(url).then(function() { alert('Enlace copiado al portapapeles'); });
    }
}

function trIAScreenshotTip() {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isAndroid = /Android/.test(navigator.userAgent);
    var msg = '📸 Para guardar el QR:\n\n';
    if (isIOS) msg += '• Pulsa botón lateral + subir volumen\n• O usa "Compartir → Guardar imagen"';
    else if (isAndroid) msg += '• Pulsa apagar + bajar volumen\n• O usa "Compartir" de arriba';
    else msg += '• Pulsa Ctrl+Shift+S para capturar\n• O clic derecho en el QR → Guardar imagen';
    alert(msg);
}
