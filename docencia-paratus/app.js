// Paratus · Área II Cartagena — full dataset
'use strict';
let PARATUS=null,currentEnv='adult',currentTab='conditions',currentWeight=70,historyStack=['home'],searchTO=null,_currentDrug=null,_currentDetailTab='doses';
function txt(o){if(!o)return'';if(typeof o==='string')return o;if(Array.isArray(o))return o.join(', ');if(typeof o==='object')return o.en||o.fr||Object.values(o).find(v=>v)||'';return String(o);}
function norm(s){return(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function getEnv(){return PARATUS?PARATUS[currentEnv]:null;}
function catIcon(c){return{Cardiovascular:'❤️',Neurological:'🧠',Respiratory:'🫁',Toxicology:'☠️',Trauma:'🩹',Metabolic:'⚗️',Gastroenterology:'🫃','OB/GYN':'🤰',Infectious:'🦠',Uncategorized:'📋',General:'📋',Airway:'💨','Vascular Access':'💉',Monitoring:'📊',Neonatal:'👶'}[c]||'🏥';}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('mainContent').innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60%;gap:16px;color:#9ca3af"><div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#ea3a35;border-radius:50%;animation:spin .8s linear infinite"></div><div style="font-size:.9rem">Cargando Paratus...</div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  fetch('./paratus_all.json').then(r=>r.json()).then(d=>{PARATUS=d;setupUI();renderHome();}).catch(e=>{document.getElementById('mainContent').innerHTML='<div style="padding:32px;text-align:center;color:#e53e3e">⚠️ Error: '+e.message+'</div>';});
});

function setupUI(){
  document.getElementById('weightBtn').addEventListener('click',openWeightModal);
  document.getElementById('closeWeightModal').addEventListener('click',closeWeightModal);
  document.getElementById('saveWeightBtn').addEventListener('click',saveWeight);
  document.getElementById('navBack').addEventListener('click',goBack);
  document.getElementById('navHome').addEventListener('click',goHome);
  updateWeightUI();
  // Env bar
  const hc=document.getElementById('headerContent');
  const eb=document.createElement('div');
  eb.id='envBar';eb.style.cssText='display:flex;gap:6px;padding:8px 0 0;justify-content:center;';
  ['adult','pediatric','neonatal'].forEach(env=>{
    const b=document.createElement('button');
    b.textContent=env==='adult'?'👨 Adulto':env==='pediatric'?'🧒 Pediátrico':'👶 Neonatal';
    b.style.cssText='padding:4px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.4);background:'+(env===currentEnv?'rgba(255,255,255,.3)':'transparent')+';color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;';
    b.addEventListener('click',()=>{currentEnv=env;document.querySelectorAll('#envBar button').forEach(x=>x.style.background='transparent');b.style.background='rgba(255,255,255,.3)';historyStack=['home'];showHomeView();renderHome();});
    eb.appendChild(b);
  });
  hc.appendChild(eb);
  // Home tabs
  document.querySelectorAll('.tabs-nav .tab').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.tabs-nav .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentTab=btn.dataset.tab;historyStack=['home'];renderHome();});
  });
  // Search
  const si=document.querySelector('.search-box input');
  si.addEventListener('input',()=>{clearTimeout(searchTO);searchTO=setTimeout(()=>{const q=si.value.trim();if(q.length>1)renderSearch(q);else renderHome();},250);});
  // Detail tabs
  document.querySelectorAll('.detail-tabs .tab').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.detail-tabs .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderDetailTab(btn.dataset.tab);});
  });
}

function showHomeView(){document.getElementById('homeTabs').classList.remove('hidden');document.getElementById('detailTabs').classList.add('hidden');document.getElementById('topHeader').style.borderRadius='0 0 24px 24px';if(document.getElementById('envBar'))document.getElementById('envBar').style.display='flex';}
function showDetailView(){document.getElementById('homeTabs').classList.add('hidden');document.getElementById('detailTabs').classList.remove('hidden');document.getElementById('topHeader').style.borderRadius='0';if(document.getElementById('envBar'))document.getElementById('envBar').style.display='none';}

function goBack(){
  if(historyStack.length>1){
    historyStack.pop();
    const prev=historyStack[historyStack.length-1];
    if(prev==='home'){showHomeView();renderHome();}
    else if(prev&&prev.type==='drug'){showDrug(prev.id,false);}
    else if(prev&&prev.type==='condition'){showCondition(prev.id,false);}
    else if(prev&&prev.type==='procedure'){showProcedure(prev.id,false);}
    else{showHomeView();renderHome();}
  }else{window.location.href='../index.html';}
}
function goHome(){historyStack=['home'];showHomeView();renderHome();document.querySelector('.search-box input').value='';}

function renderHome(){
  const env=getEnv();if(!env)return;
  const main=document.getElementById('mainContent');
  if(currentTab==='conditions'){
    const byC=env.conditionsByCategory||{};
    let h='';
    Object.entries(byC).forEach(([cat,items])=>{
      const ic=catIcon(cat);
      h+=`<div class="list-section"><div class="section-header">${ic} ${cat}</div>${items.map(item=>`<div class="list-item" onclick="showCondition(${item.id})"><div class="list-item-icon" style="font-size:1.2rem">${ic}</div><div class="list-item-body"><div class="list-item-title">${item.name}</div></div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`).join('')}</div>`;
    });
    main.innerHTML=h||'<div class="empty">Sin datos</div>';
  }else if(currentTab==='procedures'){
    const byC=env.proceduresByCategory||{};
    let h='';
    Object.entries(byC).forEach(([cat,items])=>{
      h+=`<div class="list-section"><div class="section-header">🔧 ${cat}</div>${items.map(item=>`<div class="list-item" onclick="showProcedure(${item.id})"><div class="list-item-icon" style="font-size:1.2rem">🔧</div><div class="list-item-body"><div class="list-item-title">${item.name}</div></div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`).join('')}</div>`;
    });
    main.innerHTML=h||'<div class="empty">Sin procedimientos</div>';
  }else{
    const drugs=env.drugs||[];
    const grouped={};
    drugs.forEach(d=>{const l=d.name[0].toUpperCase();if(!grouped[l])grouped[l]=[];grouped[l].push(d);});
    let h='';
    Object.keys(grouped).sort().forEach(l=>{
      h+=`<div class="list-section"><div class="section-header">${l}</div>${grouped[l].map(d=>{const cm=txt(d.name_common);const sc=cm&&cm!=='[]'&&cm!=='null';return`<div class="list-item" onclick="showDrug(${d.id})"><div class="list-item-icon">💊</div><div class="list-item-body"><div class="list-item-title">${d.name}</div>${sc?`<div class="list-item-sub">${cm}</div>`:''}</div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`;}).join('')}</div>`;
    });
    main.innerHTML=h;
  }
}

function renderSearch(q){
  const env=getEnv();if(!env)return;
  const qn=norm(q);let h='';
  const drugs=(env.drugs||[]).filter(d=>norm(d.name).includes(qn)||norm(txt(d.name_common)).includes(qn)||d.indications.some(i=>norm(i.name).includes(qn)));
  if(drugs.length)h+=`<div class="list-section"><div class="section-header">💊 Fármacos</div>${drugs.slice(0,20).map(d=>`<div class="list-item" onclick="showDrug(${d.id})"><div class="list-item-icon">💊</div><div class="list-item-body"><div class="list-item-title">${d.name}</div><div class="list-item-sub">${txt(d.name_common)||''}</div></div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`).join('')}</div>`;
  const conds=(env.conditions||[]).filter(c=>norm(c.name).includes(qn));
  if(conds.length)h+=`<div class="list-section"><div class="section-header">📋 Condiciones</div>${conds.slice(0,10).map(c=>`<div class="list-item" onclick="showCondition(${c.id})"><div class="list-item-icon">📋</div><div class="list-item-body"><div class="list-item-title">${c.name}</div></div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`).join('')}</div>`;
  const procs=(env.procedures||[]).filter(p=>norm(p.name).includes(qn));
  if(procs.length)h+=`<div class="list-section"><div class="section-header">🔧 Procedimientos</div>${procs.slice(0,10).map(p=>`<div class="list-item" onclick="showProcedure(${p.id})"><div class="list-item-icon">🔧</div><div class="list-item-body"><div class="list-item-title">${p.name}</div></div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`).join('')}</div>`;
  document.getElementById('mainContent').innerHTML=h||`<div class="empty">Sin resultados para "<strong>${q}</strong>"</div>`;
}

function showDrug(id,push=true){
  const env=getEnv();const drug=env.drugs.find(d=>d.id===id);if(!drug)return;
  _currentDrug=drug;_currentDetailTab='doses';
  if(push)historyStack.push({type:'drug',id});
  showDetailView();
  document.querySelectorAll('.detail-tabs .tab').forEach((b,i)=>{b.classList.toggle('active',i===0);b.dataset.tab=i===0?'doses':'references';b.textContent=i===0?'Dosis':'Referencias';});
  renderDrugView(drug,'doses');
}
function renderDetailTab(tab){_currentDetailTab=tab;if(_currentDrug)renderDrugView(_currentDrug,tab);}

function renderDrugView(drug,tab){
  const cm=txt(drug.name_common);const sc=cm&&cm!=='[]'&&cm!=='null';
  let h=`<div class="detail-hero"><div class="detail-title">${drug.name}</div>${sc?`<div class="detail-sub">${cm}</div>`:''}</div>`;
  if(tab==='doses'){
    drug.indications.forEach(ind=>{
      h+=`<div class="indication-block"><div class="indication-title"><span class="material-symbols-outlined" style="font-size:16px;color:#ea3a35;vertical-align:middle">local_hospital</span> ${ind.name}${ind.category?` <span class="ind-cat-badge">${ind.category}</span>`:''}</div>`;
      ind.steps.forEach(step=>{h+=renderStep(step);});
      h+=`</div>`;
    });
  }else{
    let hasR=false;
    drug.indications.forEach(ind=>{ind.steps.forEach(step=>{const ref=txt(step.reference);if(ref){hasR=true;h+=`<div class="ref-block"><div class="ref-title">${ind.name} — ${txt(step.name)||'Paso'}</div><div class="ref-body">${ref}</div></div>`;}});});
    if(!hasR)h+='<div class="empty">Sin referencias</div>';
  }
  document.getElementById('mainContent').innerHTML=h;
}

function renderStep(step){
  const sn=txt(step.name);const route=txt(step.administration_route);const concTxt=txt(step.concentration_text);
  const admin=txt(step.administration);const part=txt(step.particularity);const prep=txt(step.preparation_text);
  let h=`<div class="step-card"><div class="step-header"><span class="step-name">${sn||'Dosis'}</span>${route?`<span class="step-route">${route}</span>`:''}</div>`;
  if(concTxt)h+=`<div class="dose-row"><div class="dose-label">Concentración</div><div class="dose-value">${concTxt}</div></div>`;
  step.doses.forEach(dose=>{
    const dt=txt(dose.text);
    if(dt&&dt!=='[]')h+=`<div class="dose-row dose-highlight"><div class="dose-label">💉 Dosis</div><div class="dose-value bold">${dt}</div></div>`;
    else if(dose.treatment_dose&&dose.treatment_dose>0){
      let val=(dose.treatment_dose*currentWeight);
      if(dose.max&&dose.max>0)val=Math.min(val,dose.max);
      const unit=step.unit||'';
      h+=`<div class="dose-row dose-highlight"><div class="dose-label">💉 ${currentWeight}kg</div><div class="dose-value bold">${val.toFixed(2).replace(/\.?0+$/,'')} ${unit}</div></div>`;
    }
  });
  if(prep)h+=`<div class="dose-row"><div class="dose-label">Preparación</div><div class="dose-value">${prep}</div></div>`;
  if(admin)h+=`<div class="admin-note"><span class="material-symbols-outlined" style="font-size:14px;flex-shrink:0;margin-top:2px">info</span><div>${admin}</div></div>`;
  if(part)h+=`<div class="warning-note"><span class="material-symbols-outlined" style="font-size:14px;flex-shrink:0;margin-top:2px">warning</span><div>${part}</div></div>`;
  h+=`</div>`;return h;
}

function showCondition(id,push=true){
  const env=getEnv();const cond=env.conditions.find(c=>c.id===id);if(!cond)return;
  if(push)historyStack.push({type:'condition',id});
  showDetailView();_currentDrug=null;
  document.querySelectorAll('.detail-tabs .tab').forEach((b,i)=>{b.classList.toggle('active',i===0);b.dataset.tab=i===0?'drugs':'info';b.textContent=i===0?'Fármacos':'Info';});
  const cat=(cond.indications&&cond.indications[0]&&cond.indications[0].category)||'';
  let h=`<div class="detail-hero"><div class="detail-title">${catIcon(cat)} ${cond.name}</div>${cat?`<div class="detail-sub">${cat}</div>`:''}</div>`;
  const relDrugs=[];
  env.drugs.forEach(drug=>{drug.indications.forEach(ind=>{const in2=norm(ind.name);const cn2=norm(cond.name);const w1=cn2.split(' ')[0];const w2=in2.split(' ')[0];if(in2.includes(w1)||cn2.includes(w2)){if(!relDrugs.find(r=>r.drug.id===drug.id))relDrugs.push({drug,ind});}});});
  if(relDrugs.length){
    h+=`<div class="list-section"><div class="section-header">💊 Fármacos relacionados</div>${relDrugs.map(({drug,ind})=>{const cm=txt(drug.name_common);const sc=cm&&cm!=='[]'&&cm!=='null';const steps=ind.steps.slice(0,2).map(s=>txt(s.name)).filter(Boolean).join(' · ');return`<div class="list-item" onclick="showDrug(${drug.id})"><div class="list-item-icon">💊</div><div class="list-item-body"><div class="list-item-title">${drug.name}${sc?` <span style="color:#9ca3af;font-weight:400;font-size:.78rem">${cm}</span>`:''}</div>${steps?`<div class="list-item-sub">${steps}</div>`:''}</div><span class="material-symbols-outlined list-arrow">chevron_right</span></div>`;}).join('')}</div>`;
  }
  if(cond.indications)cond.indications.forEach(ind=>{if(ind.tabs)ind.tabs.forEach(tab=>{const content=txt(tab.content);if(content&&content.length>10)h+=`<div class="indication-block"><div class="indication-title">${txt(tab.name)||'Protocolo'}</div><div style="padding:10px 14px;font-size:.82rem;line-height:1.55;color:#374151">${content}</div></div>`;});});
  document.getElementById('mainContent').innerHTML=h;
}

function showProcedure(id,push=true){
  const env=getEnv();const proc=env.procedures.find(p=>p.id===id);if(!proc)return;
  if(push)historyStack.push({type:'procedure',id});
  showDetailView();_currentDrug=null;
  document.querySelectorAll('.detail-tabs .tab').forEach((b,i)=>{b.classList.toggle('active',i===0);b.dataset.tab=i===0?'doses':'info';b.textContent=i===0?'Dosis':'Info';});
  const cat=(proc.indications&&proc.indications[0]&&proc.indications[0].category)||'';
  let h=`<div class="detail-hero"><div class="detail-title">🔧 ${proc.name}</div>${cat?`<div class="detail-sub">${cat}</div>`:''}</div>`;
  if(proc.indications)proc.indications.forEach(ind=>{
    h+=`<div class="indication-block"><div class="indication-title">${ind.name||'Indicación'}</div>`;
    if(ind.steps)ind.steps.forEach(step=>{h+=renderStep(step);});
    if(ind.tabs)ind.tabs.forEach(tab=>{const c=txt(tab.content);if(c)h+=`<div style="padding:10px 14px;font-size:.82rem;line-height:1.55;color:#374151">${c}</div>`;});
    h+=`</div>`;
  });
  document.getElementById('mainContent').innerHTML=h;
}

function updateWeightUI(){document.getElementById('weightValKg').textContent=currentWeight.toFixed(1);document.getElementById('weightValLbs').textContent=(currentWeight*2.205).toFixed(1);}
function openWeightModal(){document.getElementById('weightInput').value=currentWeight;document.getElementById('weightModal').classList.remove('hidden');}
function closeWeightModal(){document.getElementById('weightModal').classList.add('hidden');}
function saveWeight(){const v=parseFloat(document.getElementById('weightInput').value);if(v>0&&v<=300){currentWeight=v;updateWeightUI();closeWeightModal();if(_currentDrug)renderDrugView(_currentDrug,_currentDetailTab);else renderHome();}}
