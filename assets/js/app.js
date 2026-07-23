
const STORAGE_KEY = "climbmap_simple_v1";
const CATALOG_KEY = "climbmap_catalog_v1";
const LEVELS = ["Fundamentos","Básico","Intermediário","Avançado","Especialista"];
const STATUS = {standby:"Stand by",aberto:"Em Aberto",andamento:"Em Andamento",concluido:"Concluído",cancelado:"Cancelado"};
const routes = {mapa:"Meu Mapa",catalogo:"Catálogo de Competências",planejamento:"Planejamento",trilhas:"Trilhas",evolucao:"Evolução"};

let baseData = null;
let state = loadState();
let currentRoute = "mapa";

const el = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const today = () => new Date().toISOString().slice(0,10);

function defaultState(){
  return {profileName:"", theme:"light", assessments:{}, planning:[], history:[]};
}
function loadState(){
  try { return {...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")}; }
  catch { return defaultState(); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function toast(message){
  el("toast").textContent = message; el("toast").classList.add("show");
  clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el("toast").classList.remove("show"),2600);
}
function addHistory(type,title,details=""){
  state.history.unshift({id:uid(),type,title,details,date:new Date().toISOString()});
  state.history=state.history.slice(0,500);
}
async function loadBaseData(){
  const stored = localStorage.getItem(CATALOG_KEY);
  if(stored){ try{return JSON.parse(stored)}catch{} }
  const response = await fetch("data/catalogo.json");
  if(!response.ok) throw new Error("Não foi possível carregar data/catalogo.json");
  return response.json();
}
function saveCatalog(data){
  localStorage.setItem(CATALOG_KEY, JSON.stringify(data));
  baseData=data;
}
function init(){
  document.documentElement.dataset.theme=state.theme;
  if(!state.profileName){ el("onboarding").classList.remove("hidden"); }
  else showApp();
}
function showApp(){
  el("onboarding").classList.add("hidden"); el("app").classList.remove("hidden");
  el("sidebar-name").textContent=state.profileName;
  el("avatar").textContent=(state.profileName[0]||"P").toUpperCase();
  render();
}
function navigate(route){
  currentRoute=route;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
  el("page-title").textContent=routes[route];
  render();
}
function render(){
  const renderer={mapa:renderMap,catalogo:renderCatalog,planejamento:renderPlanning,trilhas:renderTrails,evolucao:renderEvolution}[currentRoute];
  el("content").innerHTML=renderer();
  bindPageEvents();
}
function activeCatalog(){ return (baseData.catalogo||[]).filter(c=>c.ativo!==false); }
function assessmentValue(name){ return Number(state.assessments[name]?.value||0); }
function planForCompetency(name){ return state.planning.filter(p=>p.competency===name && p.status!=="cancelado"); }
function completedLevels(name){ return new Set(planForCompetency(name).filter(p=>p.status==="concluido").map(p=>p.level)); }
function percent(n,d){ return d ? Math.round(n/d*100) : 0; }

function renderMap(){
  const catalog=activeCatalog();
  const assessed=catalog.filter(c=>assessmentValue(c.competencia)>0);
  const activePlans=state.planning.filter(p=>["aberto","andamento","standby"].includes(p.status));
  const completed=state.planning.filter(p=>p.status==="concluido");
  const avg=assessed.length ? (assessed.reduce((s,c)=>s+assessmentValue(c.competencia),0)/assessed.length).toFixed(1) : "0.0";
  const heat=catalog.slice(0,20).map(c=>`<div class="heat-cell heat-${assessmentValue(c.competencia)}"><strong>${esc(c.competencia)}</strong><span>${assessmentValue(c.competencia)||"—"}/5</span></div>`).join("");
  const next=activePlans.slice(0,5).map(p=>`<div class="planning-card priority-${p.priority}" data-edit="${p.id}"><span class="tag">${esc(STATUS[p.status])}</span><h4>${esc(p.title)}</h4><small>${esc(p.level||p.type==="manual"?"Objetivo manual":"")}${p.deadline?` · até ${formatDate(p.deadline)}`:""}</small></div>`).join("");
  return `
    <section class="hero"><div><p class="eyebrow">VISÃO PESSOAL</p><h2>Olá, ${esc(state.profileName)}.</h2><p>Acompanhe suas competências, níveis planejados e evolução em um único lugar.</p></div><div class="hero-stat"><strong>${avg}</strong><span>nível médio autoavaliado</span></div></section>
    <section class="metric-grid">
      ${metric("Competências avaliadas", assessed.length, `${catalog.length} disponíveis no catálogo`)}
      ${metric("Em desenvolvimento", activePlans.length, "níveis e objetivos ativos")}
      ${metric("Concluídos", completed.length, "registros finalizados")}
      ${metric("Cobertura do mapa", `${percent(assessed.length,catalog.length)}%`, "competências com autoavaliação", percent(assessed.length,catalog.length))}
    </section>
    <section class="grid-2">
      <div class="card"><div class="section-heading"><div><p class="eyebrow">HEATMAP</p><h3>Meu mapa de competências</h3></div><button class="button secondary" data-go="catalogo">Avaliar competências</button></div>${heat?`<div class="heatmap">${heat}</div>`:empty("Catálogo vazio","Importe o Excel para começar.")}</div>
      <div class="card"><div class="section-heading"><div><p class="eyebrow">PRÓXIMOS PASSOS</p><h3>Planejamento ativo</h3></div><button class="button secondary" data-go="planejamento">Ver quadro</button></div>${next||empty("Nenhum item ativo","Adicione um nível ou card manual ao planejamento.")}</div>
    </section>`;
}
function metric(label,value,caption,progressValue=null){
  return `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span class="muted">${esc(caption)}</span>${progressValue===null?"":`<div class="progress"><span style="width:${progressValue}%"></span></div>`}</div>`;
}
function empty(title,text){return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`}

function renderCatalog(){
  const categories=[...new Set(activeCatalog().map(c=>c.categoria))];
  return `
    <div class="toolbar">
      <input id="catalog-search" placeholder="Buscar competência, trilha ou conteúdo">
      <select id="catalog-category"><option value="">Todas as categorias</option>${categories.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <select id="catalog-trail"><option value="">Todas as trilhas</option>${[...new Set(activeCatalog().map(c=>c.trilha))].map(x=>`<option>${esc(x)}</option>`).join("")}</select>
    </div>
    <div id="catalog-grid" class="catalog-grid">${catalogCards(activeCatalog())}</div>`;
}
function catalogCards(items){
  if(!items.length) return empty("Nenhuma competência encontrada","Ajuste os filtros ou importe o catálogo.");
  return items.map((c,index)=>{
    const value=assessmentValue(c.competencia);
    const dots=LEVELS.map((_,i)=>`<span class="level-dot ${c.niveis.some(n=>n.ordem===i+1)?"available":""}"></span>`).join("");
    return `<article class="competency-card" data-catalog-card data-search="${esc([c.competencia,c.categoria,c.trilha,c.descricaoCompetencia,c.niveis.map(n=>n.conteudos).join(" ")].join(" ").toLowerCase())}" data-category="${esc(c.categoria)}" data-trail="${esc(c.trilha)}">
      <div class="tag-row"><span class="tag category">${esc(c.categoria)}</span><span class="tag">${esc(c.trilha)}</span></div>
      <div><h3>${esc(c.competencia)}</h3><p class="muted">${esc(c.descricaoCompetencia)}</p></div>
      <div class="levels">${dots}</div>
      <div class="assessment"><span><small class="muted">Autoavaliação</small><br><strong>${value?`${value}/5`:"Não avaliada"}</strong></span>
        <select data-assess="${esc(c.competencia)}"><option value="0">—</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${value===n?"selected":""}>${n}</option>`).join("")}</select>
      </div>
      <button class="button secondary" data-detail="${index}">Ver níveis e conteúdos</button>
      <div class="detail-panel hidden" data-detail-panel="${index}">${c.niveis.sort((a,b)=>a.ordem-b.ordem).map(n=>levelBlock(c,n)).join("")}</div>
    </article>`;
  }).join("");
}
function levelBlock(c,n){
  const lines = value => String(value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const refs=[...lines(n.cursos),...lines(n.certificacoes),...lines(n.livros)];
  const links=lines(n.links);
  return `<div class="level-block"><div class="section-heading"><div><h4>${esc(n.nivel)}</h4><small class="muted">${esc(n.descricao)}</small></div><button class="button primary" data-add-level="${esc(c.competencia)}" data-level="${esc(n.nivel)}">Planejar</button></div>
    ${n.criterios?`<p><strong>Critério:</strong> ${esc(n.criterios)}</p>`:""}
    ${lines(n.conteudos).length?`<strong>Conteúdos</strong><ul>${lines(n.conteudos).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
    ${refs.length?`<strong>Referências sugeridas</strong><ul>${refs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
    ${links.length?`<div class="reference-links">${links.map(x=>`<a href="${esc(x)}" target="_blank" rel="noopener">${esc(x)}</a>`).join("")}</div>`:""}
  </div>`;
}

function renderPlanning(){
  const visible=state.planning.filter(p=>p.status!=="cancelado");
  const columns=["standby","aberto","andamento","concluido"];
  return `<div class="section-heading"><div><p class="eyebrow">KANBAN PESSOAL</p><h2>Competências e objetivos</h2><p class="muted">Planeje níveis do catálogo ou adicione qualquer curso, certificação e objetivo manual.</p></div><button id="new-item" class="button primary">+ Novo card</button></div>
    <div class="toolbar"><select id="planning-filter"><option value="">Todas as prioridades</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></div>
    <div class="kanban">${columns.map(status=>{
      const items=visible.filter(p=>p.status===status);
      return `<section class="kanban-column" data-column="${status}"><div class="column-header"><h3>${STATUS[status]}</h3><span class="count">${items.length}</span></div>${items.map(planningCard).join("")||`<div class="empty">Sem itens</div>`}</section>`;
    }).join("")}</div>`;
}
function planningCard(p){
  return `<article class="planning-card priority-${p.priority}" data-edit="${p.id}" data-priority="${p.priority}">
    <div class="tag-row"><span class="tag">${p.type==="nivel"?"Competência":"Manual"}</span><span class="tag">${esc(p.priority)}</span></div>
    <h4>${esc(p.title)}</h4>
    ${p.competency?`<small>${esc(p.competency)} · ${esc(p.level)}</small>`:"<small>Objetivo personalizado</small>"}
    ${p.deadline?`<p><small>Prazo: ${formatDate(p.deadline)}</small></p>`:""}
  </article>`;
}

function renderTrails(){
  const trails=(baseData.trilhas||[]).filter(t=>t.ativo!==false);
  if(!trails.length)return empty("Nenhuma trilha cadastrada","Importe a base para visualizar trilhas.");
  return `<div class="trail-list">${trails.map(t=>{
    const comps=activeCatalog().filter(c=>c.trilha===t.nome && c.categoria===t.categoria);
    const completed=comps.filter(c=>assessmentValue(c.competencia)>=4 || completedLevels(c.competencia).size>=c.niveis.length).length;
    const pct=percent(completed,comps.length);
    return `<article class="trail-card"><div class="trail-header"><div><div class="tag-row"><span class="tag category">${esc(t.categoria)}</span></div><h3>${esc(t.nome)}</h3><p class="muted">${esc(t.descricao)}</p></div><div><strong>${pct}%</strong><small class="muted"> concluída</small></div></div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="trail-competencies">${comps.map(c=>`<div class="trail-item ${assessmentValue(c.competencia)>=4?"done":""}"><strong>${esc(c.competencia)}</strong><br><small>${c.niveis.length} níveis · avaliação ${assessmentValue(c.competencia)||"—"}/5</small></div>`).join("")||"<span class='muted'>Nenhuma competência associada.</span>"}</div>
    </article>`;
  }).join("")}</div>`;
}

function renderEvolution(){
  const completed=state.planning.filter(p=>p.status==="concluido");
  const events=[...state.history].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const year=new Date().getFullYear();
  const timeline=months.map((m,i)=>{
    const monthEvents=events.filter(e=>{const d=new Date(e.date);return d.getFullYear()===year&&d.getMonth()===i});
    return `<div class="month"><strong>${m}</strong>${monthEvents.slice(-5).map(e=>`<div class="event" title="${esc(e.details)}">${esc(e.title)}</div>`).join("")}</div>`;
  }).join("");
  const assessed=activeCatalog().filter(c=>assessmentValue(c.competencia)>0);
  const avg=assessed.length?assessed.reduce((s,c)=>s+assessmentValue(c.competencia),0)/assessed.length:0;
  return `
    <section class="metric-grid">
      ${metric("Níveis e objetivos concluídos",completed.length,"histórico do planejamento")}
      ${metric("Competências avaliadas",assessed.length,"autoavaliações registradas")}
      ${metric("Média atual",avg.toFixed(1),"escala de 1 a 5")}
      ${metric("Eventos registrados",state.history.length,"alterações relevantes")}
    </section>
    <section class="card"><div class="section-heading"><div><p class="eyebrow">CALENDÁRIO DE EVOLUÇÃO</p><h3>Linha do tempo ${year}</h3></div></div><div class="timeline">${timeline}</div></section>
    <section class="card" style="margin-top:20px"><div class="section-heading"><div><p class="eyebrow">HISTÓRICO</p><h3>Últimas conquistas e alterações</h3></div></div>
      ${state.history.length?state.history.slice(0,20).map(e=>`<div class="planning-card"><strong>${esc(e.title)}</strong><br><small>${formatDateTime(e.date)} · ${esc(e.details)}</small></div>`).join(""):empty("Ainda não há eventos","Avalie competências e movimente seu planejamento.")}</section>`;
}
function bindPageEvents(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
  document.querySelectorAll("[data-assess]").forEach(s=>s.onchange=()=>{
    const name=s.dataset.assess, value=Number(s.value);
    if(value){ state.assessments[name]={value,date:new Date().toISOString()}; addHistory("assessment",`Autoavaliação: ${name}`,`Nota ${value}/5`); }
    else delete state.assessments[name];
    saveState(); toast("Autoavaliação salva."); render();
  });
  document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>{
    document.querySelector(`[data-detail-panel="${b.dataset.detail}"]`)?.classList.toggle("hidden");
  });
  document.querySelectorAll("[data-add-level]").forEach(b=>b.onclick=()=>openItemDialog(null,{competency:b.dataset.addLevel,level:b.dataset.level}));
  document.querySelectorAll("[data-edit]").forEach(c=>c.onclick=()=>openItemDialog(c.dataset.edit));
  el("new-item")?.addEventListener("click",()=>openItemDialog());
  el("catalog-search")?.addEventListener("input",filterCatalog);
  el("catalog-category")?.addEventListener("change",filterCatalog);
  el("catalog-trail")?.addEventListener("change",filterCatalog);
  el("planning-filter")?.addEventListener("change",e=>document.querySelectorAll(".planning-card[data-priority]").forEach(c=>c.hidden=!!e.target.value&&c.dataset.priority!==e.target.value));
}
function filterCatalog(){
  const q=(el("catalog-search")?.value||"").toLowerCase();
  const cat=el("catalog-category")?.value||"", trail=el("catalog-trail")?.value||"";
  document.querySelectorAll("[data-catalog-card]").forEach(c=>c.hidden=!( (!q||c.dataset.search.includes(q)) && (!cat||c.dataset.category===cat) && (!trail||c.dataset.trail===trail) ));
}
function openItemDialog(id=null,preset={}){
  const item=id?state.planning.find(p=>p.id===id):null;
  el("dialog-title").textContent=item?"Editar card":"Novo card";
  el("item-id").value=item?.id||"";
  el("item-type").value=item?.type||(preset.competency?"nivel":"manual");
  populateCompetencies(item?.competency||preset.competency||"");
  populateLevels(item?.competency||preset.competency||"",item?.level||preset.level||"");
  el("item-title").value=item?.title||(preset.competency?`${preset.competency} — ${preset.level}`:"");
  el("item-status").value=item?.status||"standby"; el("item-priority").value=item?.priority||"media";
  el("item-start").value=item?.start||""; el("item-deadline").value=item?.deadline||""; el("item-notes").value=item?.notes||"";
  el("delete-item").classList.toggle("hidden",!item);
  syncItemType();
  el("item-dialog").showModal();
}
function populateCompetencies(selected=""){
  el("item-competency").innerHTML=activeCatalog().map(c=>`<option ${c.competencia===selected?"selected":""}>${esc(c.competencia)}</option>`).join("");
}
function populateLevels(comp,selected=""){
  const c=activeCatalog().find(x=>x.competencia===comp)||activeCatalog()[0];
  el("item-level").innerHTML=(c?.niveis||[]).sort((a,b)=>a.ordem-b.ordem).map(n=>`<option ${n.nivel===selected?"selected":""}>${esc(n.nivel)}</option>`).join("");
}
function syncItemType(){
  const isLevel=el("item-type").value==="nivel";
  el("competency-fields").classList.toggle("hidden",!isLevel);
  if(isLevel&&!el("item-title").value){el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`;}
}
function saveItem(){
  const id=el("item-id").value||uid(), type=el("item-type").value;
  const old=state.planning.find(p=>p.id===id);
  const item={id,type,title:el("item-title").value.trim(),status:el("item-status").value,priority:el("item-priority").value,start:el("item-start").value,deadline:el("item-deadline").value,notes:el("item-notes").value.trim(),competency:type==="nivel"?el("item-competency").value:"",level:type==="nivel"?el("item-level").value:"",updatedAt:new Date().toISOString(),createdAt:old?.createdAt||new Date().toISOString()};
  const idx=state.planning.findIndex(p=>p.id===id); if(idx>=0)state.planning[idx]=item;else state.planning.push(item);
  addHistory(item.status==="concluido"?"completed":"planning",item.status==="concluido"?`Concluído: ${item.title}`:`Planejamento: ${item.title}`,STATUS[item.status]);
  saveState(); el("item-dialog").close(); toast("Planejamento salvo."); render();
}
function deleteItem(){
  const id=el("item-id").value, item=state.planning.find(p=>p.id===id);
  state.planning=state.planning.filter(p=>p.id!==id); if(item)addHistory("deleted",`Item removido: ${item.title}`,"Exclusão manual");
  saveState(); el("item-dialog").close();toast("Item excluído.");render();
}
function formatDate(v){return v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):""}
function formatDateTime(v){return new Date(v).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}

async function importExcel(file){
  if(!window.XLSX) throw new Error("Biblioteca de Excel indisponível. Verifique sua conexão.");
  const buffer=await file.arrayBuffer(), workbook=XLSX.read(buffer,{type:"array"});
  const read=name=>{
    const sheet=workbook.Sheets[name];
    if(!sheet)throw new Error(`A aba ${name} não foi encontrada.`);
    return XLSX.utils.sheet_to_json(sheet,{defval:""});
  };
  const cats=read("01_Categorias"), trails=read("02_Trilhas"), rows=read("03_Catalogo");
  const truth=v=>v===true||String(v).toUpperCase()==="VERDADEIRO"||String(v).toUpperCase()==="TRUE"||v===1;
  const catalogMap=new Map();
  rows.filter(r=>r.Competencia&&truth(r.Ativo)).forEach(r=>{
    const key=`${r.Categoria}|||${r.Trilha}|||${r.Competencia}`;
    if(!catalogMap.has(key))catalogMap.set(key,{categoria:r.Categoria,trilha:r.Trilha,competencia:r.Competencia,descricaoCompetencia:r.Descricao_Competencia,ordemCompetencia:Number(r.Ordem_Competencia)||999,ativo:true,niveis:[]});
    catalogMap.get(key).niveis.push({nivel:r.Nivel,ordem:Number(r.Ordem_Nivel)||LEVELS.indexOf(r.Nivel)+1,descricao:r.Descricao_Nivel,criterios:r.Criterios_Conhecimento,conteudos:r.Conteudos_Estudo,cursos:r.Cursos_Sugeridos,certificacoes:r.Certificacoes_Sugeridas,livros:r.Livros_Documentacoes,links:r.Links_Referencias,observacoes:r.Observacoes});
  });
  const converted={
    version:new Date().toISOString(),
    categorias:cats.filter(r=>r.Nome_Categoria&&truth(r.Ativo)).map(r=>({nome:r.Nome_Categoria,descricao:r.Descricao,icone:r.Icone,ordem:Number(r.Ordem)||999,ativo:true})),
    trilhas:trails.filter(r=>r.Nome_Trilha&&truth(r.Ativo)).map(r=>({categoria:r.Categoria,nome:r.Nome_Trilha,descricao:r.Descricao,ordem:Number(r.Ordem)||999,ativo:true})),
    catalogo:[...catalogMap.values()].sort((a,b)=>a.ordemCompetencia-b.ordemCompetencia)
  };
  if(!converted.catalogo.length) throw new Error("Nenhuma competência ativa foi encontrada na aba 03_Catalogo.");
  saveCatalog(converted); addHistory("import","Catálogo atualizado",`${converted.catalogo.length} competências importadas`);saveState();
  toast(`Catálogo importado: ${converted.catalogo.length} competências.`);render();
}
function download(name,content,type="application/json"){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded",async()=>{
  try{baseData=await loadBaseData();init()}catch(err){document.body.innerHTML=`<div class="empty"><strong>Erro ao abrir o Climb Map</strong>${esc(err.message)}</div>`}
  el("onboarding-form").onsubmit=e=>{e.preventDefault();state.profileName=el("profile-name").value.trim();saveState();showApp()};
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>navigate(b.dataset.route));
  el("theme-button").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;saveState()};
  el("import-button").onclick=()=>el("excel-input").click();
  el("excel-input").onchange=async e=>{try{if(e.target.files[0])await importExcel(e.target.files[0])}catch(err){toast(err.message)}finally{e.target.value=""}};
  document.querySelectorAll(".close-dialog").forEach(b=>b.onclick=()=>el("item-dialog").close());
  el("item-type").onchange=syncItemType;
  el("item-competency").onchange=()=>{populateLevels(el("item-competency").value);el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`};
  el("item-level").onchange=()=>el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`;
  el("item-form").onsubmit=e=>{e.preventDefault();saveItem()};
  el("delete-item").onclick=deleteItem;
  el("open-settings").onclick=()=>{el("settings-name").value=state.profileName;el("settings-dialog").showModal()};
  document.querySelectorAll(".close-settings").forEach(b=>b.onclick=()=>el("settings-dialog").close());
  el("save-settings").onclick=e=>{e.preventDefault();state.profileName=el("settings-name").value.trim()||state.profileName;saveState();el("settings-dialog").close();showApp();toast("Perfil atualizado.")};
  el("export-backup").onclick=()=>download(`climbmap-backup-${today()}.json`,JSON.stringify({state,catalog:baseData},null,2));
  el("reset-data").onclick=()=>{if(confirm("Apagar todas as autoavaliações, planejamento e histórico deste navegador?")){const name=state.profileName,theme=state.theme;state={...defaultState(),profileName:name,theme};saveState();el("settings-dialog").close();render();toast("Dados pessoais apagados.")}};
});
