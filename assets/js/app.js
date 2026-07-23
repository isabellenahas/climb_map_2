
const STORAGE_KEY="climbmap_simple_v7",CATALOG_KEY="climbmap_catalog_v7";
const LEVELS=["Fundamentos","Básico","Intermediário","Avançado","Especialista"];
const STATUS={standby:"Stand by",aberto:"Em Aberto",andamento:"Em Andamento",concluido:"Concluído",cancelado:"Cancelado"};
const ASSESS={na:"Não avaliada",0:"Não conheço",1:"Já ouvi falar",2:"Experimentei",3:"Autônomo",4:"Ensino"};
const routes={mapa:"Meu Mapa",catalogo:"Catálogo de Competências",planejamento:"Planejamento",trilhas:"Trilhas",heatmap:"Heatmap",evolucao:"Evolução"};
let baseData=null,state=loadState(),currentRoute="mapa",pendingCatalogFocus=null;
const filters={catalog:{q:"",category:"",trail:"",level:"",assessment:""},planning:{q:"",status:"",type:"",priority:"",category:"",trail:"",level:""},heat:{q:"",category:"",trail:"",level:"",assessment:""}};
const el=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>crypto.randomUUID?.()??`${Date.now()}-${Math.random()}`;
const today=()=>new Date().toISOString().slice(0,10);
function defaultState(){return{profileName:"",theme:"light",assessments:{},planning:[],history:[],expandedTrails:{},favorites:{}}}
function loadState(){try{return{...defaultState(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}catch{return defaultState()}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function toast(m){el("toast").textContent=m;el("toast").classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el("toast").classList.remove("show"),2600)}
function addHistory(type,title,details=""){state.history.unshift({id:uid(),type,title,details,date:new Date().toISOString()});state.history=state.history.slice(0,500)}
async function loadBaseData(){const stored=localStorage.getItem(CATALOG_KEY);if(stored){try{return JSON.parse(stored)}catch{}}const r=await fetch("data/catalogo.json");if(!r.ok)throw new Error("Não foi possível carregar data/catalogo.json");return r.json()}
function saveCatalog(data){localStorage.setItem(CATALOG_KEY,JSON.stringify(data));baseData=data}
function init(){document.documentElement.dataset.theme=state.theme;if(!state.profileName)el("onboarding").classList.remove("hidden");else showApp()}
function showApp(){el("onboarding").classList.add("hidden");el("app").classList.remove("hidden");el("sidebar-name").textContent=state.profileName;el("avatar").textContent=(state.profileName[0]||"P").toUpperCase();render()}
function navigate(route){currentRoute=route;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===route));el("page-title").textContent=routes[route];render()}
function render(){const r={mapa:renderMap,catalogo:renderCatalog,planejamento:renderPlanning,trilhas:renderTrails,heatmap:renderHeatmap,evolucao:renderEvolution}[currentRoute];el("content").innerHTML=r();bindPageEvents();if(currentRoute==="catalogo")setTimeout(applyCatalogFocus,30)}
function activeCatalog(){return(baseData.catalogo||[]).filter(c=>c.ativo!==false)}
function assessmentRaw(name){return state.assessments[name]?.value}
function assessmentKey(name){const v=assessmentRaw(name);return v===undefined||v===null||v===""?"na":String(v)}
function assessmentLabel(name){return ASSESS[assessmentKey(name)]}
function assessedCatalog(){return activeCatalog().filter(c=>assessmentKey(c.competencia)!=="na")}
function planForCompetency(name){return state.planning.filter(p=>p.competency===name&&p.status!=="cancelado")}
function completedLevels(name){return new Set(planForCompetency(name).filter(p=>p.status==="concluido").map(p=>p.level))}
function percent(n,d){return d?Math.round(n/d*100):0}
function unique(arr){return[...new Set(arr.filter(Boolean))]}
function norm(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()}
function slug(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"")}
function categoryClass(category){return`category-${slug(category)}`}
function openCatalogFocus(competency){filters.catalog={q:competency,category:"",trail:"",level:"",assessment:""};pendingCatalogFocus=competency;navigate("catalogo")}
function applyCatalogFocus(){if(!pendingCatalogFocus)return;const exact=pendingCatalogFocus;const card=[...document.querySelectorAll("[data-catalog-card]")].find(c=>norm(c.dataset.competency)===norm(exact));if(card)card.querySelector(".detail-panel")?.classList.remove("hidden");pendingCatalogFocus=null}
function fullBackupPayload(){return{format:"climbmap-full-backup",version:"7.0.0",exportedAt:new Date().toISOString(),state,catalog:baseData}}
function validateFullBackup(data){return data&&data.format==="climbmap-full-backup"&&data.state&&data.catalog&&Array.isArray(data.catalog.catalogo)}

function metric(label,value,caption,progressValue=null){return`<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span class="muted">${esc(caption)}</span>${progressValue===null?"":`<div class="progress"><span style="width:${progressValue}%"></span></div>`}</div>`}
function empty(title,text){return`<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`}
function assessOptions(name){const current=assessmentKey(name);return`<option value="na"${current==="na"?" selected":""}>Não avaliada</option>${[0,1,2,3,4].map(v=>`<option value="${v}"${current===String(v)?" selected":""}>${ASSESS[v]}</option>`).join("")}`}
function nivelTitle(n){return n?.descricao||n?.nivel||"—"}
function assessBadge(name){const k=assessmentKey(name);return`<span class="assessment-badge assess-${k}">${esc(ASSESS[k])}</span>`}
function isFavorite(name){return !!state.favorites?.[name]}
function favoriteButton(name,small=false){
 return`<button type="button" class="favorite-button ${small?"small":""} ${isFavorite(name)?"active":""}" data-favorite="${esc(name)}" title="${isFavorite(name)?"Remover dos favoritos":"Adicionar aos favoritos"}" aria-label="${isFavorite(name)?"Remover dos favoritos":"Adicionar aos favoritos"}">${isFavorite(name)?"★":"☆"}</button>`
}
function toggleFavorite(name){
 state.favorites=state.favorites||{};
 if(state.favorites[name])delete state.favorites[name];else state.favorites[name]=true;
 saveState();toast(state.favorites[name]?"Competência favoritada.":"Competência removida dos favoritos.");render()
}
function categoryAssessment(cat){
 const items=activeCatalog().filter(c=>c.categoria===cat&&assessmentKey(c.competencia)!=="na");
 if(!items.length)return null;
 return items.reduce((sum,c)=>sum+Number(assessmentRaw(c.competencia)),0)/items.length
}

function renderMap(){
 const catalog=activeCatalog(),assessed=assessedCatalog(),active=state.planning.filter(p=>["aberto","andamento","standby"].includes(p.status)),done=state.planning.filter(p=>p.status==="concluido");
 const avg=assessed.length?(assessed.reduce((s,c)=>s+Number(assessmentRaw(c.competencia)),0)/assessed.length).toFixed(1):"0.0";
 const favorites=catalog.filter(c=>isFavorite(c.competencia));
 const heat=favorites.map(c=>{const n=c.niveis[0];return`<div class="heat-card heat-${assessmentKey(c.competencia)} clickable-card" data-open-catalog="${esc(c.competencia)}"><div class="favorite-card-head"><strong>${esc(c.competencia)}</strong>${favoriteButton(c.competencia,true)}</div><span>${esc(n?.nivel||"Competência")} · ${esc(assessmentLabel(c.competencia))}</span></div>`}).join("");
 const next=active.slice(0,5).map(p=>p.competency?`<article class="planning-card priority-${p.priority} clickable-card" data-open-catalog="${esc(p.competency)}"><div class="tag-row"><span class="tag">Competência</span></div><h4>${esc(p.title)}</h4><small>${esc(p.competency)} · ${esc(p.level||"")}</small></article>`:`<article class="planning-card priority-${p.priority} clickable-card" data-go="planejamento"><div class="tag-row"><span class="tag">${esc(p.studyType||"Outro")}</span></div><h4>${esc(p.title)}</h4><small>Objetivo manual</small></article>`).join("");
 return`<section class="hero"><div><p class="eyebrow">VISÃO PESSOAL</p><h2>Olá, ${esc(state.profileName)}.</h2><p>Acompanhe competências, níveis planejados e evolução em um único lugar.</p></div><div class="hero-stat"><strong>${avg}</strong><span>média autoavaliada de 0 a 4</span></div></section>
 <section class="metric-grid">${metric("Competências avaliadas",assessed.length,`${catalog.length} disponíveis`)}${metric("Em desenvolvimento",active.length,"níveis e objetivos ativos")}${metric("Concluídos",done.length,"registros finalizados")}${metric("Cobertura do mapa",`${percent(assessed.length,catalog.length)}%`,"competências avaliadas",percent(assessed.length,catalog.length))}</section>
 <section class="dashboard-grid"><div class="card"><div class="section-heading"><div><p class="eyebrow">MAPA RESUMIDO</p><h3>Competências favoritadas</h3></div><button class="button secondary" data-go="catalogo">Gerenciar favoritos</button></div>${heat?`<div class="mini-heatmap">${heat}</div>`:empty("Nenhuma competência favoritada","Use a estrela no Catálogo ou em Trilhas para montar seu mapa resumido.")}</div>
 <div class="card"><div class="section-heading"><div><p class="eyebrow">PRÓXIMOS PASSOS</p><h3>Planejamento ativo</h3></div><button class="button secondary" data-go="planejamento">Ver quadro</button></div>${next||empty("Nenhum item ativo","Adicione níveis ou objetivos ao planejamento.")}</div></section>`}
function filteredCatalogItems(){
 const f=filters.catalog,qn=norm(f.q);
 return activeCatalog().filter(c=>{
  const hay=norm([c.competencia,c.categoria,c.trilha,c.descricaoCompetencia,c.niveis.map(n=>`${n.nivel} ${n.conteudos}`).join(" ")].join(" "));
  const exact=qn&&norm(c.competencia)===qn;
  const textOk=!qn||(activeCatalog().some(x=>norm(x.competencia)===qn)?exact:hay.includes(qn));
  return textOk&&(!f.category||c.categoria===f.category)&&(!f.trail||(c.trilhas||[c.trilha]).includes(f.trail))&&(!f.level||c.niveis.some(n=>n.nivel===f.level))&&(!f.assessment||assessmentKey(c.competencia)===f.assessment)
 })
}
function renderCatalog(){
 const cats=unique(activeCatalog().map(c=>c.categoria)),trails=unique(activeCatalog().map(c=>c.trilha)),levels=unique(activeCatalog().flatMap(c=>c.niveis.map(n=>n.nivel))),f=filters.catalog,items=filteredCatalogItems();
 return`<div class="filter-panel filter-panel-no-action"><label class="filter-field wide"><span>Buscar no catálogo</span><input id="catalog-search" value="${esc(f.q)}" placeholder="Competência, trilha ou conteúdo"></label>
 <label class="filter-field"><span>Categoria</span><select id="catalog-category"><option value="">Todas</option>${cats.map(x=>`<option ${f.category===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Trilha</span><select id="catalog-trail"><option value="">Todas</option>${trails.map(x=>`<option ${f.trail===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Nível</span><select id="catalog-level"><option value="">Todos</option>${levels.map(x=>`<option ${f.level===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Autoavaliação</span><select id="catalog-assessment"><option value="">Todas</option><option value="na" ${f.assessment==="na"?"selected":""}>Não avaliada</option>${[0,1,2,3,4].map(v=>`<option value="${v}" ${f.assessment===String(v)?"selected":""}>${ASSESS[v]}</option>`).join("")}</select></label></div><div id="catalog-grid" class="catalog-grid">${catalogCards(items)}</div>`}
function catalogCards(items){if(!items.length)return empty("Nenhuma competência encontrada","Ajuste os filtros.");return items.map((c,i)=>`<article class="competency-card category-accent ${categoryClass(c.categoria)}" data-catalog-card data-competency="${esc(c.competencia)}" data-search="${esc([c.competencia,c.categoria,c.trilha,c.descricaoCompetencia,c.niveis.map(n=>`${n.nivel} ${n.conteudos}`).join(" ")].join(" ").toLowerCase())}" data-category="${esc(c.categoria)}" data-trail="${esc(c.trilha)}" data-levels="${esc(c.niveis.map(n=>n.nivel).join("|"))}" data-assessment="${assessmentKey(c.competencia)}">
 <div class="catalog-card-top"><div class="tag-row"><span class="tag category category-badge">${esc(c.categoria)}</span><span class="tag">${esc(c.trilha)}</span></div>${favoriteButton(c.competencia)}</div><div><h3>${esc(c.competencia)}</h3><p class="muted">${esc(c.descricaoCompetencia)}</p></div>
 <div class="levels">${LEVELS.map((_,n)=>`<span class="level-dot ${c.niveis.some(x=>x.ordem===n+1)?"available":""}"></span>`).join("")}</div>
 <div class="assessment"><div><small class="muted">Autoavaliação</small><br>${assessBadge(c.competencia)}</div><select data-assess="${esc(c.competencia)}">${assessOptions(c.competencia)}</select></div>
 <button class="button secondary" data-detail="${i}">Ver níveis e conteúdos</button><div class="detail-panel hidden" data-detail-panel="${i}">${c.niveis.map(n=>levelBlock(c,n)).join("")}</div></article>`).join("")}
function levelBlock(c,n){const lines=v=>String(v||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),refs=[...lines(n.cursos),...lines(n.certificacoes),...lines(n.livros)],links=lines(n.links);return`<div class="level-block"><div class="section-heading"><div><h4>${esc(n.nivel)}</h4><small class="muted">${esc(n.descricao)}</small></div><button class="button primary small" data-add-level="${esc(c.competencia)}" data-level="${esc(n.nivel)}">Planejar</button></div>${n.criterios?`<p><strong>Critério:</strong> ${esc(n.criterios)}</p>`:""}${lines(n.conteudos).length?`<strong>Conteúdos</strong><ul>${lines(n.conteudos).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}${refs.length?`<strong>Referências sugeridas</strong><ul>${refs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}${links.length?`<div class="reference-links">${links.map(x=>`<a href="${esc(x)}" target="_blank" rel="noopener">${esc(x)}</a>`).join("")}</div>`:""}</div>`}
function filteredPlanningItems(){const f=filters.planning;return state.planning.filter(p=>p.status!=="cancelado").filter(p=>{const displayType=p.type==="nivel"?"Competência":(p.studyType||"Outro");return(!f.q||norm(`${p.title} ${p.competency||""}`).includes(norm(f.q)))&&(!f.status||p.status===f.status)&&(!f.type||displayType===f.type)&&(!f.priority||p.priority===f.priority)&&(!f.category||p.category===f.category)&&(!f.trail||p.trail===f.trail)&&(!f.level||p.level===f.level)})}
function renderPlanning(){
 const all=state.planning.filter(p=>p.status!=="cancelado"),visible=filteredPlanningItems(),cats=unique(all.map(p=>p.category)),trails=unique(all.map(p=>p.trail)),levels=unique(all.map(p=>p.level)),f=filters.planning;
 return`<div class="section-heading"><div><p class="eyebrow">KANBAN PESSOAL</p><h2>Competências e objetivos</h2><p class="muted">Planeje níveis do catálogo ou crie cards manuais.</p></div><button id="new-item" class="button primary">+ Novo card</button></div>
 <div class="filter-panel planning-filters filter-panel-no-action"><label class="filter-field wide"><span>Buscar</span><input id="planning-search" value="${esc(f.q)}" placeholder="Título ou competência"></label>
 <label class="filter-field"><span>Status</span><select id="planning-status"><option value="">Todos</option>${Object.entries(STATUS).filter(([k])=>k!=="cancelado").map(([k,v])=>`<option value="${k}" ${f.status===k?"selected":""}>${v}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Tipo</span><select id="planning-type"><option value="">Todos</option>${["Competência","Curso","Certificação","Conteúdo","Outro"].map(x=>`<option ${f.type===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Prioridade</span><select id="planning-priority"><option value="">Todas</option>${[["alta","Alta"],["media","Média"],["baixa","Baixa"]].map(([v,l])=>`<option value="${v}" ${f.priority===v?"selected":""}>${l}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Categoria</span><select id="planning-category"><option value="">Todas</option>${cats.map(x=>`<option ${f.category===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Trilha</span><select id="planning-trail"><option value="">Todas</option>${trails.map(x=>`<option ${f.trail===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <label class="filter-field"><span>Nível</span><select id="planning-level"><option value="">Todos</option>${levels.map(x=>`<option ${f.level===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label></div>
 <div class="kanban">${["standby","aberto","andamento","concluido"].map(status=>{const items=visible.filter(p=>p.status===status);return`<section class="kanban-column"><div class="column-header"><h3>${STATUS[status]}</h3><span class="count">${items.length}</span></div>${items.map(planningCard).join("")||`<div class="empty">Sem itens</div>`}</section>`}).join("")}</div>`}
function planningCard(p){const displayType=p.type==="nivel"?"Competência":(p.studyType||"Outro");return`<article class="planning-card priority-${p.priority}" data-edit="${p.id}" data-search="${esc(`${p.title} ${p.competency||""}`.toLowerCase())}" data-status="${p.status}" data-type="${esc(displayType)}" data-priority="${p.priority}" data-category="${esc(p.category||"")}" data-trail="${esc(p.trail||"")}" data-level="${esc(p.level||"")}"><div class="tag-row"><span class="tag">${esc(displayType)}</span><span class="tag">${esc(p.priority)}</span></div><h4>${esc(p.title)}</h4>${p.competency?`<small>${esc(p.competency)} · ${esc(p.level)}</small>`:`<small>${esc(displayType)} manual</small>`}${p.deadline?`<p><small>Prazo: ${formatDate(p.deadline)}</small></p>`:""}</article>`}
function renderTrails(){
 const trails=(baseData.trilhas||[]).filter(t=>t.ativo!==false);if(!trails.length)return empty("Nenhuma trilha cadastrada","Importe a base.");
 return`<div class="trail-list">${trails.map(t=>{const key=`${t.categoria}|||${t.nome}`,comps=activeCatalog().filter(c=>(c.trilhas||[c.trilha]).includes(t.nome)&&(c.categorias||[c.categoria]).includes(t.categoria)),complete=comps.filter(c=>assessmentKey(c.competencia)==="4"||completedLevels(c.competencia).size>=c.niveis.length).length,pct=percent(complete,comps.length),expanded=!!state.expandedTrails[key];return`<article class="trail-card"><div class="trail-header"><div><div class="tag-row"><span class="tag category">${esc(t.categoria)}</span><span class="tag">${comps.length} competências</span></div><h3>${esc(t.nome)}</h3><p class="muted">${esc(t.descricao||"Trilha de desenvolvimento por competências.")}</p></div><div class="trail-actions"><button class="button secondary small" data-toggle-trail="${esc(key)}">${expanded?"Minimizar":"Ver competências"}</button><button class="button primary small" data-add-trail="${esc(key)}">Adicionar trilha</button></div></div><div class="trail-summary"><div class="progress"><span style="width:${pct}%"></span></div><strong>${pct}%</strong></div><div class="trail-details ${expanded?"":"hidden"}">${comps.length?`<div class="trail-competencies">${comps.map(c=>`<section class="trail-competency-block ${categoryClass(c.categoria)}"><div class="trail-item"><div class="trail-item-title"><div class="trail-title-line"><strong>${esc(c.competencia)}</strong>${favoriteButton(c.competencia,true)}</div><small>${c.niveis.length} níveis disponíveis</small></div><select data-assess="${esc(c.competencia)}">${assessOptions(c.competencia)}</select><div class="trail-item-actions"><button class="button secondary small" data-view-competency="${esc(c.competencia)}">Visualizar</button></div></div><div class="trail-levels">${c.niveis.map(n=>`<div class="trail-level-row"><div><strong>${esc(n.nivel)}</strong><small>${esc(nivelTitle(n))}</small></div><button class="button primary small" data-add-level="${esc(c.competencia)}" data-level="${esc(n.nivel)}">Adicionar nível</button></div>`).join("")}</div></section>`).join("")}</div>`:empty("Sem competências","Nenhuma competência está vinculada a esta trilha.")}</div></article>`}).join("")}</div>`}
function filteredHeatCatalog(){const f=filters.heat;return activeCatalog().filter(c=>{const hay=norm(`${c.competencia} ${c.categoria} ${c.trilha} ${c.niveis.map(n=>`${n.nivel} ${nivelTitle(n)}`).join(" ")}`);return(!f.q||hay.includes(norm(f.q)))&&(!f.category||c.categoria===f.category)&&(!f.trail||(c.trilhas||[c.trilha]).includes(f.trail))&&(!f.assessment||assessmentKey(c.competencia)===f.assessment)})}
function categoryScoreCards(){return activeCategories().map(cat=>{const score=categoryAssessment(cat);return`<div class="evolution-category-card ${categoryClass(cat)}"><small>${esc(cat)}</small><strong>${score===null?"—":score.toFixed(1)}</strong><span class="muted">${score===null?"sem autoavaliações":"média de autoavaliação / 4"}</span></div>`}).join("")}
function activeCategories(){return unique(activeCatalog().map(c=>c.categoria))}
function renderHeatmap(){
 const cats=activeCategories(),trails=unique(activeCatalog().map(c=>c.trilha)),f=filters.heat,items=filteredHeatCatalog();
 const legend=["na",0,1,2,3,4].map(v=>`<div class="legend-item"><span class="legend-swatch heat-${v}"></span>${esc(ASSESS[v])}</div>`).join("");
 const rows=items.map(c=>{const byLevel=Object.fromEntries(c.niveis.map(n=>[n.nivel,n])),score=assessmentKey(c.competencia);return`<div class="heatmap-category-cell ${categoryClass(c.categoria)}">${esc(c.categoria)}</div><div class="heatmap-competency" data-open-catalog="${esc(c.competencia)}">${esc(c.competencia)}</div>${LEVELS.map(level=>{const n=byLevel[level];if(!n)return`<div class="heatmap-cell heat-na">—</div>`;const hidden=f.level&&f.level!==level;return`<div class="heatmap-cell heat-${score} ${hidden?"level-filter-hidden":""}" data-open-catalog="${esc(c.competencia)}"><span>${esc(nivelTitle(n))}</span></div>`}).join("")}`}).join("");
 return`<section class="evolution-category-grid heatmap-category-scores">${categoryScoreCards()}</section><div class="filter-panel filter-panel-no-action"><label class="filter-field wide"><span>Buscar no heatmap</span><input id="heat-search" value="${esc(f.q)}" placeholder="Competência ou nível"></label><label class="filter-field"><span>Categoria</span><select id="heat-category"><option value="">Todas</option>${cats.map(x=>`<option ${f.category===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label class="filter-field"><span>Trilha</span><select id="heat-trail"><option value="">Todas</option>${trails.map(x=>`<option ${f.trail===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label class="filter-field"><span>Nível</span><select id="heat-level"><option value="">Todos</option>${LEVELS.map(x=>`<option ${f.level===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label class="filter-field"><span>Autoavaliação</span><select id="heat-assessment"><option value="">Todas</option><option value="na" ${f.assessment==="na"?"selected":""}>Não avaliada</option>${[0,1,2,3,4].map(v=>`<option value="${v}" ${f.assessment===String(v)?"selected":""}>${ASSESS[v]}</option>`).join("")}</select></label></div><div class="legend">${legend}</div><div class="heatmap-matrix-wrap"><div class="heatmap-matrix"><div class="heatmap-header">Categoria</div><div class="heatmap-header">Competência</div>${LEVELS.map(x=>`<div class="heatmap-header ${f.level&&f.level!==x?"level-filter-hidden":""}">${esc(x)}</div>`).join("")}${rows}</div></div>`}
function courseMonthDate(p,completed=false){const raw=completed?(p.updatedAt||p.deadline||p.start):(p.start||p.deadline||p.createdAt);return raw?new Date(raw):null}
function renderCourseCalendar(){const year=new Date().getFullYear(),months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],courses=state.planning.filter(p=>p.studyType==="Curso"&&p.status!=="cancelado");return`<div class="course-calendar">${months.map((name,index)=>{const planned=courses.filter(p=>p.status!=="concluido").filter(p=>{const d=courseMonthDate(p);return d&&d.getFullYear()===year&&d.getMonth()===index}),done=courses.filter(p=>p.status==="concluido").filter(p=>{const d=courseMonthDate(p,true);return d&&d.getFullYear()===year&&d.getMonth()===index});return`<div class="course-month"><strong>${name}</strong><div class="course-month-counts"><span class="planned-dot">${planned.length} planejado(s)</span><span class="done-dot">${done.length} concluído(s)</span></div>${[...planned.map(p=>({p,label:"Planejado"})),...done.map(p=>({p,label:"Concluído"}))].slice(0,6).map(({p,label})=>`<div class="course-event ${label==="Concluído"?"done":"planned"}" data-go="planejamento"><small>${label}</small><span>${esc(p.title)}</span></div>`).join("")}</div>`}).join("")}</div>`}
function renderEvolution(){const completed=state.planning.filter(p=>p.status==="concluido"&&p.type==="nivel"),events=[...state.history].sort((a,b)=>new Date(a.date)-new Date(b.date)),months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],year=new Date().getFullYear(),timeline=months.map((m,i)=>{const me=events.filter(e=>{const d=new Date(e.date);return d.getFullYear()===year&&d.getMonth()===i});return`<div class="month"><strong>${m}</strong>${me.slice(-5).map(e=>`<div class="event">${esc(e.title)}</div>`).join("")}</div>`}).join(""),assessed=assessedCatalog(),avg=assessed.length?assessed.reduce((s,c)=>s+Number(assessmentRaw(c.competencia)),0)/assessed.length:0,categories=activeCategories(),categoryStrip=categoryScoreCards(),completedCards=completed.map(p=>`<article class="completed-level-card ${categoryClass(p.category)} clickable-card" data-open-catalog="${esc(p.competency)}"><div class="tag-row"><span class="tag category category-badge">${esc(p.category||"Sem categoria")}</span><span class="tag">${esc(p.level)}</span></div><h4>${esc(p.competency)}</h4><small>${esc(p.trail||"")}</small></article>`).join("");return`<section class="metric-grid">${metric("Níveis e objetivos concluídos",state.planning.filter(p=>p.status==="concluido").length,"histórico do planejamento")}${metric("Competências avaliadas",assessed.length,"autoavaliações registradas")}${metric("Média atual",avg.toFixed(1),"escala de 0 a 4")}${metric("Eventos registrados",state.history.length,"alterações relevantes")}</section><section class="evolution-category-grid">${categoryStrip}</section><section class="card"><div class="section-heading"><div><p class="eyebrow">CALENDÁRIO DE EVOLUÇÃO</p><h3>Linha do tempo ${year}</h3></div></div><div class="timeline">${timeline}</div></section><section class="card" style="margin-top:20px"><div class="section-heading"><div><p class="eyebrow">CONCLUÍDO POR NÍVEL</p><h3>Níveis de competência finalizados</h3></div></div>${completedCards?`<div class="completed-level-grid">${completedCards}</div>`:empty("Nenhum nível concluído","Os níveis concluídos no Planejamento aparecerão aqui.")}</section><section class="card" style="margin-top:20px"><div class="section-heading"><div><p class="eyebrow">CURSOS</p><h3>Calendário mensal de cursos planejados e concluídos</h3></div></div>${renderCourseCalendar()}</section>`}
function bindPageEvents(){
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
 document.querySelectorAll("[data-open-catalog]").forEach(b=>b.onclick=()=>openCatalogFocus(b.dataset.openCatalog));
 document.querySelectorAll("[data-assess]").forEach(s=>s.onchange=()=>saveAssessment(s.dataset.assess,s.value));
 document.querySelectorAll("[data-favorite]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.favorite)});
 document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>document.querySelector(`[data-detail-panel="${b.dataset.detail}"]`)?.classList.toggle("hidden"));
 document.querySelectorAll("[data-add-level]").forEach(b=>b.onclick=()=>openItemDialog(null,{competency:b.dataset.addLevel,level:b.dataset.level}));
 document.querySelectorAll("[data-edit]").forEach(c=>c.onclick=()=>openItemDialog(c.dataset.edit));
 document.querySelectorAll("[data-toggle-trail]").forEach(b=>b.onclick=()=>{state.expandedTrails[b.dataset.toggleTrail]=!state.expandedTrails[b.dataset.toggleTrail];saveState();render()});
 document.querySelectorAll("[data-add-trail]").forEach(b=>b.onclick=()=>openTrailDialog(b.dataset.addTrail));
 document.querySelectorAll("[data-view-competency]").forEach(b=>b.onclick=()=>openCompetencyView(b.dataset.viewCompetency));
 el("new-item")?.addEventListener("click",()=>openItemDialog());
 ["catalog-search","catalog-category","catalog-trail","catalog-level","catalog-assessment"].forEach(id=>el(id)?.addEventListener(id.includes("search")?"input":"change",()=>{filters.catalog={q:el("catalog-search").value,category:el("catalog-category").value,trail:el("catalog-trail").value,level:el("catalog-level").value,assessment:el("catalog-assessment").value};render()}));
 ["planning-search","planning-status","planning-type","planning-priority","planning-category","planning-trail","planning-level"].forEach(id=>el(id)?.addEventListener(id.includes("search")?"input":"change",()=>{filters.planning={q:el("planning-search").value,status:el("planning-status").value,type:el("planning-type").value,priority:el("planning-priority").value,category:el("planning-category").value,trail:el("planning-trail").value,level:el("planning-level").value};render()}));
 ["heat-search","heat-category","heat-trail","heat-level","heat-assessment"].forEach(id=>el(id)?.addEventListener(id.includes("search")?"input":"change",()=>{filters.heat={q:el("heat-search").value,category:el("heat-category").value,trail:el("heat-trail").value,level:el("heat-level").value,assessment:el("heat-assessment").value};render()}));
}
function saveAssessment(name,value){if(value==="na")delete state.assessments[name];else{state.assessments[name]={value:Number(value),date:new Date().toISOString()};addHistory("assessment",`Autoavaliação: ${name}`,ASSESS[value])}saveState();toast("Autoavaliação salva.");render()}
function filterCatalog(){render()}
function filterPlanning(){render()}
function filterHeatmap(){render()}
function openCompetencyView(name){
 const c=activeCatalog().find(x=>x.competencia===name);if(!c)return;
 el("competency-view-title").textContent=c.competencia;
 el("competency-view-content").innerHTML=`<div class="tag-row"><span class="tag category category-badge ${categoryClass(c.categoria)}">${esc(c.categoria)}</span><span class="tag">${esc(c.trilha)}</span></div><p>${esc(c.descricaoCompetencia)}</p><div>${c.niveis.map(n=>`<section class="competency-view-level"><div class="section-heading"><div><h4>${esc(n.nivel)}</h4><p>${esc(n.descricao||"")}</p></div><button class="button primary small" data-dialog-add-level="${esc(c.competencia)}" data-level="${esc(n.nivel)}">Adicionar nível</button></div>${n.criterios?`<p><strong>Critério:</strong> ${esc(n.criterios)}</p>`:""}</section>`).join("")}</div>`;
 el("competency-view-dialog").showModal();
 el("competency-view-content").querySelectorAll("[data-dialog-add-level]").forEach(b=>b.onclick=()=>{el("competency-view-dialog").close();openItemDialog(null,{competency:b.dataset.dialogAddLevel,level:b.dataset.level})});
}
function openItemDialog(id=null,preset={}){const item=id?state.planning.find(p=>p.id===id):null;el("dialog-title").textContent=item?"Editar card":"Novo card";el("item-id").value=item?.id||"";el("item-type").value=item?.type||(preset.competency?"nivel":"manual");el("item-study-type").value=item?.studyType||"Curso";populateCompetencies(item?.competency||preset.competency||"");populateLevels(item?.competency||preset.competency||"",item?.level||preset.level||"");el("item-title").value=item?.title||(preset.competency?`${preset.competency} — ${preset.level}`:"");el("item-status").value=item?.status||"standby";el("item-priority").value=item?.priority||"media";el("item-start").value=item?.start||"";el("item-deadline").value=item?.deadline||"";el("item-notes").value=item?.notes||"";el("delete-item").classList.toggle("hidden",!item);syncItemType();el("item-dialog").showModal()}
function populateCompetencies(selected=""){el("item-competency").innerHTML=activeCatalog().map(c=>`<option ${c.competencia===selected?"selected":""}>${esc(c.competencia)}</option>`).join("")}
function populateLevels(comp,selected=""){const c=activeCatalog().find(x=>x.competencia===comp)||activeCatalog()[0];el("item-level").innerHTML=(c?.niveis||[]).map(n=>`<option ${n.nivel===selected?"selected":""}>${esc(n.nivel)}</option>`).join("")}
function syncItemType(){const level=el("item-type").value==="nivel";el("competency-fields").classList.toggle("hidden",!level);el("manual-fields").classList.toggle("hidden",level);if(level&&!el("item-title").value)el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`}
function saveItem(){const id=el("item-id").value||uid(),type=el("item-type").value,old=state.planning.find(p=>p.id===id),comp=type==="nivel"?activeCatalog().find(c=>c.competencia===el("item-competency").value):null,item={id,type,studyType:type==="manual"?el("item-study-type").value:"Competência",title:el("item-title").value.trim(),status:el("item-status").value,priority:el("item-priority").value,start:el("item-start").value,deadline:el("item-deadline").value,notes:el("item-notes").value.trim(),competency:type==="nivel"?el("item-competency").value:"",level:type==="nivel"?el("item-level").value:"",category:comp?.categoria||"",trail:comp?.trilha||"",updatedAt:new Date().toISOString(),createdAt:old?.createdAt||new Date().toISOString()};const idx=state.planning.findIndex(p=>p.id===id);if(idx>=0)state.planning[idx]=item;else state.planning.push(item);addHistory(item.status==="concluido"?"completed":"planning",item.status==="concluido"?`Concluído: ${item.title}`:`Planejamento: ${item.title}`,STATUS[item.status]);saveState();el("item-dialog").close();toast("Planejamento salvo.");render()}
function deleteItem(){const id=el("item-id").value,item=state.planning.find(p=>p.id===id);state.planning=state.planning.filter(p=>p.id!==id);if(item)addHistory("deleted",`Item removido: ${item.title}`,"Exclusão manual");saveState();el("item-dialog").close();toast("Item excluído.");render()}
function addCompetencyToPlan(name){const c=activeCatalog().find(x=>x.competencia===name);if(!c)return;let added=0;c.niveis.forEach((n,i)=>{if(i===0&&!state.planning.some(p=>p.competency===name&&p.level===n.nivel&&p.status!=="cancelado")){state.planning.push(makeLevelItem(c,n));added++}});if(added){addHistory("planning",`Competência adicionada: ${name}`,"Primeiro nível");saveState();toast("Competência adicionada ao planejamento.")}else toast("Esta competência já está no planejamento.")}
function makeLevelItem(c,n){return{id:uid(),type:"nivel",studyType:"Competência",title:`${c.competencia} — ${n.nivel}`,status:"standby",priority:"media",start:"",deadline:"",notes:"",competency:c.competencia,level:n.nivel,category:c.categoria,trail:c.trilha,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}
function openTrailDialog(key){const[,name]=key.split("|||");el("trail-dialog-key").value=key;el("trail-dialog-title").textContent=`Adicionar ${name}`;el("trail-selected-level").innerHTML=LEVELS.map(x=>`<option>${x}</option>`).join("");el("trail-add-mode").value="primeiro";el("trail-level-wrapper").classList.add("hidden");el("trail-dialog").showModal()}
function confirmAddTrail(){const key=el("trail-dialog-key").value,[cat,tr]=key.split("|||"),mode=el("trail-add-mode").value,selected=el("trail-selected-level").value,comps=activeCatalog().filter(c=>(c.categorias||[c.categoria]).includes(cat)&&(c.trilhas||[c.trilha]).includes(tr));let added=0;comps.forEach(c=>{let levels=mode==="todos"?c.niveis:mode==="escolhido"?c.niveis.filter(n=>n.nivel===selected):c.niveis.slice(0,1);levels.forEach(n=>{if(!state.planning.some(p=>p.competency===c.competencia&&p.level===n.nivel&&p.status!=="cancelado")){state.planning.push(makeLevelItem(c,n));added++}})});if(added){addHistory("planning",`Trilha adicionada: ${tr}`,`${added} níveis`);saveState();toast(`${added} item(ns) adicionados.`)}else toast("Nenhum novo item para adicionar.");el("trail-dialog").close();render()}
function formatDate(v){return v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):""}
function formatDateTime(v){return new Date(v).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}
async function importExcel(file){
 if(!window.XLSX)throw new Error("Biblioteca de Excel indisponível.");
 const buffer=await file.arrayBuffer(),book=XLSX.read(buffer,{type:"array"});
 const read=n=>{const s=book.Sheets[n];if(!s)throw new Error(`A aba ${n} não foi encontrada.`);return XLSX.utils.sheet_to_json(s,{defval:""})};
 const truth=v=>v===true||String(v).toUpperCase()==="VERDADEIRO"||String(v).toUpperCase()==="TRUE"||v===1;
 const splitIds=v=>String(v||"").split("|").map(x=>x.trim()).filter(Boolean);
 const cats=read("01_Categorias"),trailRows=read("02_Trilhas"),rows=read("03_Catalogo");
 const categories=cats.filter(r=>r.ID_Categoria&&r.Nome_Categoria&&truth(r.Ativo)).map(r=>({
   idCategoria:r.ID_Categoria,nome:r.Nome_Categoria,descricao:r.Descricao,icone:r.Icone,ordem:Number(r.Ordem)||999,ativo:true
 }));
 const categoryById=Object.fromEntries(categories.map(c=>[c.idCategoria,c]));
 const trails=trailRows.filter(r=>r.ID_Trilha&&r.Nome_Trilha&&truth(r.Ativo)).map(r=>({
   idTrilha:r.ID_Trilha,categoriaId:r.ID_Categoria,categoria:categoryById[r.ID_Categoria]?.nome||"",
   nome:r.Nome_Trilha,descricao:r.Descricao,idsCompetencias:splitIds(r.IDs_Competencias),ordem:Number(r.Ordem)||999,ativo:true
 }));
 const map=new Map;
 rows.filter(r=>r.ID_Catalogo&&r.ID_Competencia&&r.Competencia&&truth(r.Ativo)).forEach(r=>{
   const id=r.ID_Competencia;
   if(!map.has(id))map.set(id,{
     idCompetencia:id,categoriaId:r.ID_Categoria_Principal,categoria:categoryById[r.ID_Categoria_Principal]?.nome||"",
     competencia:r.Competencia,descricaoCompetencia:r.Descricao_Competencia,ordemCompetencia:Number(r.Ordem_Competencia)||999,
     ativo:true,niveis:[]
   });
   map.get(id).niveis.push({
     idCatalogo:r.ID_Catalogo,nivel:r.Nivel,ordem:Number(r.Ordem_Nivel)||999,descricao:r.Descricao_Nivel,
     criterios:r.Criterios_Conhecimento,conteudos:r.Conteudos_Estudo,cursos:r.Cursos_Sugeridos,
     certificacoes:r.Certificacoes_Sugeridas,livros:r.Livros_Documentacoes,links:r.Links_Referencias,observacoes:r.Observacoes
   });
 });
 const catalog=[...map.values()];
 catalog.forEach(c=>{
   const related=trails.filter(t=>t.idsCompetencias.includes(c.idCompetencia));
   c.trilhas=related.map(t=>t.nome);
   c.categorias=[...new Set(related.map(t=>t.categoria).filter(Boolean).concat(c.categoria||[]))];
   c.trilha=c.trilhas[0]||"";
   c.niveis.sort((a,b)=>a.ordem-b.ordem);
 });
 if(!catalog.length)throw new Error("Nenhuma competência ativa encontrada no novo modelo.");
 const converted={version:new Date().toISOString(),modelo:"IDs_Competencias_na_Trilha",separadorIDs:"|",categorias:categories,trilhas,catalogo:catalog};
 saveCatalog(converted);addHistory("import","Catálogo atualizado",`${catalog.length} competências importadas`);
 saveState();toast(`Catálogo importado: ${catalog.length} competências.`);render()
}
function download(name,content,type="application/json"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
document.addEventListener("DOMContentLoaded",async()=>{try{baseData=await loadBaseData();init()}catch(err){document.body.innerHTML=`<div class="empty"><strong>Erro ao abrir o Climb Map</strong>${esc(err.message)}</div>`}
 el("onboarding-form").onsubmit=e=>{e.preventDefault();state.profileName=el("profile-name").value.trim();saveState();showApp()};
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>navigate(b.dataset.route));
 document.querySelectorAll(".close-dialog").forEach(b=>b.onclick=()=>el("item-dialog").close());el("item-type").onchange=syncItemType;el("item-competency").onchange=()=>{populateLevels(el("item-competency").value);el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`};el("item-level").onchange=()=>el("item-title").value=`${el("item-competency").value} — ${el("item-level").value}`;el("item-form").onsubmit=e=>{e.preventDefault();saveItem()};el("delete-item").onclick=deleteItem;
 document.querySelectorAll(".close-trail-dialog").forEach(b=>b.onclick=()=>el("trail-dialog").close());el("trail-add-mode").onchange=()=>el("trail-level-wrapper").classList.toggle("hidden",el("trail-add-mode").value!=="escolhido");el("confirm-add-trail").onclick=confirmAddTrail;
 el("open-settings").onclick=()=>openSettings();el("settings-button").onclick=()=>openSettings();
 function openSettings(){el("settings-name").value=state.profileName;el("settings-dialog").showModal()}
 document.querySelectorAll(".close-settings").forEach(b=>b.onclick=()=>el("settings-dialog").close());
 el("settings-theme").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;saveState();toast(`Tema ${state.theme==="dark"?"escuro":"claro"} ativado.`)};
 el("settings-import-excel").onclick=()=>el("excel-input").click();
 el("excel-input").onchange=async e=>{try{if(e.target.files[0])await importExcel(e.target.files[0])}catch(err){toast(err.message)}finally{e.target.value=""}};
 el("download-full-backup").onclick=()=>download(`climbmap-backup-completo-${today()}.json`,JSON.stringify(fullBackupPayload(),null,2));
 el("upload-full-backup").onclick=()=>el("full-backup-input").click();
 el("full-backup-input").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!validateFullBackup(data))throw new Error("Arquivo de backup inválido.");if(!confirm("Este upload substituirá todos os dados ativos deste navegador. Deseja continuar?"))return;state={...defaultState(),...data.state};baseData=data.catalog;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem(CATALOG_KEY,JSON.stringify(baseData));document.documentElement.dataset.theme=state.theme||"light";el("settings-dialog").close();showApp();toast("Backup restaurado com sucesso.")}catch(err){toast(err.message||"Não foi possível restaurar o backup.")}finally{e.target.value=""}};
 el("save-settings").onclick=e=>{e.preventDefault();state.profileName=el("settings-name").value.trim()||state.profileName;saveState();el("settings-dialog").close();showApp();toast("Perfil atualizado.")};
 el("reset-data").onclick=()=>{if(confirm("Apagar todas as autoavaliações, planejamento e histórico deste navegador?")){const name=state.profileName,theme=state.theme;state={...defaultState(),profileName:name,theme};saveState();el("settings-dialog").close();render();toast("Dados pessoais apagados.")}};
 document.querySelectorAll(".close-competency-view").forEach(b=>b.onclick=()=>el("competency-view-dialog").close());});
