/* MA MUSCU — V1, sans framework, compatible GitHub Pages.
   Données privées dans Supabase, aucune donnée sportive dans les fichiers GitHub.
*/
(() => {
'use strict';
const root = document.getElementById('app');
const conf = window.MUSCU_CONFIG || {};
const configured = /^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(conf.supabaseUrl || '') &&
  conf.supabasePublishableKey && !conf.supabasePublishableKey.startsWith('REMPLACER');
const api = configured && window.supabase?.createClient
  ? window.supabase.createClient(conf.supabaseUrl, conf.supabasePublishableKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
  : null;
const CATS = ['Haut du corps','Jambes','Fessiers','Mollets','Core'];
const MUSCLES = ['Quadriceps','Fessiers','Ischios','Adducteurs','Mollets','Pectoraux','Dos','Épaules','Biceps','Triceps','Abdominaux','Obliques'];
const SIDES = [['both','Deux jambes / bras'],['alternating','Alternées (total)'],['both_lr','Chaque jambe (G+D)'],['left','Gauche'],['right','Droite']];
const ICONS = {
  dumbbell:'<path d="m6.5 6.5 11 11M2.5 6.5l4-4 15 15-4 4M7.5 3.5l-4 4M20.5 16.5l-4 4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  chart:'<path d="M4 20V4M4 20h17M8 15l4-4 3 2 5-7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  machine:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10M8 17l4-5 4 5M12 12V8"/>',
  edit:'<path d="M12 20h9M16 4l4 4-12 12H4v-4z"/>',
  trash:'<path d="M4 7h16M10 4h4M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  logout:'<path d="M10 17l5-5-5-5M15 12H3M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
function icon(k){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]||ICONS.dumbbell}</svg>`;}
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safe = esc;
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR',{maximumFractionDigits:2});
const num = v => v === '' || v == null ? null : Number(String(v).replace(',','.'));
const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const dFrom = s => new Date(`${s}T12:00:00`);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateFr = v => v ? dFrom(v).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) : '';
const dayFr = v => v ? dFrom(v).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
const state = {user:null,screen:'exercises',category:'Tous',query:'',chooseCategory:'Tous',chooseQuery:'',showArchived:false,
  pickedExercise:null,pickedSession:null,pickedEntry:null,addingToSession:null,
  editExercise:null,editSession:null,draftRows:[],draftNote:'',removedRows:[],weekOffset:0,
  data:{exercises:[],sessions:[],entries:[],sets:[]},busy:false,flash:''};

function getExercise(id){return state.data.exercises.find(x=>x.id===id);}
function getSession(id){return state.data.sessions.find(x=>x.id===id);}
function getEntry(id){return state.data.entries.find(x=>x.id===id);}
function setsFor(id){return state.data.sets.filter(s=>s.session_exercise_id===id).sort((a,b)=>a.position-b.position);}
function entriesForSession(id){return state.data.entries.filter(e=>e.session_id===id).sort((a,b)=>a.position-b.position);}
function pills(x){return (x?.muscles||[]).map(m=>`<span class="pill">${safe(m)}</span>`).join('');}
function machine(x){return x?.requires_machine?`<span class="machine">${icon('machine')} Salle</span>`:'';}
function titleBar(title, back, subtitle){return `<header class="topbar"><div class="toprow">${back?`<button class="back" data-action="back" data-to="${safe(back)}">${icon('back')} <span>${safe(title)}</span></button>`:`<h1>${safe(title)}</h1>`}<div class="top-actions">${!back?`<button class="icon-button" data-action="logout" title="Se déconnecter" aria-label="Se déconnecter">${icon('logout')}</button>`:''}</div></div>${subtitle?`<div class="subtitle">${safe(subtitle)}</div>`:''}</header>`;}
function nav(){return `<nav class="bottomnav" aria-label="Navigation principale">${[['exercises','dumbbell','Exercices'],['sessions','calendar','Séances'],['stats','chart','Stats']].map(([k,i,l])=>`<button class="navtab ${tab()===k?'active':''}" data-action="tab" data-screen="${k}">${icon(i)}${l}</button>`).join('')}</nav>`;}
function tab(){return ['exercise','exercises','exercise-form'].includes(state.screen)?'exercises':['sessions','session','session-form','choose-exercise','entry-add','entry-edit'].includes(state.screen)?'sessions':'stats';}
function shell(head,inner){root.innerHTML=`<div class="shell">${head}<section class="main">${inner}</section>${nav()}</div>${state.flash?`<div class="toast" role="status">${safe(state.flash)}</div>`:''}`;}
function notify(message){state.flash=message;render();window.setTimeout(()=>{if(state.flash===message){state.flash='';let t=root.querySelector('.toast');if(t)t.remove();}},2400);}
function go(screen, fields={}){Object.assign(state,fields);state.screen=screen;state.flash='';render();window.scrollTo({top:0,behavior:'instant'});}
function err(m){const box=root.querySelector('#form-error');if(box){box.textContent=m;box.hidden=false;}else alert(m);}
function btn(text,action,style='btn-primary',extra=''){return `<button type="button" class="btn ${style}" data-action="${action}" ${extra}>${text}</button>`;}
function groupBox(title,child){return `<section class="section"><h2 class="section-title">${title}</h2>${child}</section>`;}
function activeCategory(){return state.screen==='choose-exercise'?state.chooseCategory:state.category;}
function activeQuery(){return state.screen==='choose-exercise'?state.chooseQuery:state.query;}
function filteredExercises(){
 const category=activeCategory(),query=activeQuery().toLowerCase();
 return state.data.exercises.filter(e=>{
   const matchesCategory = category==='Tous' || e.category===category;
   const searchText = `${e.name} ${e.category} ${(e.muscles||[]).join(' ')}`.toLowerCase();
   return (state.showArchived || !e.archived) && matchesCategory && (!query || searchText.includes(query));
 });
}
function exerciseRow(e,action='view-exercise'){return `<button class="exercise-row" data-action="${action}" data-id="${e.id}"><span class="left-ico">${icon(e.requires_machine?'machine':'dumbbell')}</span><span class="grow"><span class="title">${safe(e.name)}${e.archived?' (archivé)':''}</span><div class="small" style="margin-top:4px">${pills(e)}</div></span>${machine(e)}<span class="chev">${icon('chevron')}</span></button>`;}
function exerciseListHtml(action='view-exercise'){const sorted=filteredExercises();if(!sorted.length)return `<div class="empty"><h3>Aucun exercice trouvé</h3><p>Ajoute un exercice maîtrisé ou modifie ton filtre.</p></div>`;
 return CATS.map(cat=>{const xs=sorted.filter(e=>e.category===cat).sort((a,b)=>a.name.localeCompare(b.name,'fr'));return !xs.length?'':`<h3 class="category-heading">${cat.toLocaleUpperCase('fr-FR')} <span class="muted tiny">(${xs.length})</span></h3><div class="listbox">${xs.map(e=>exerciseRow(e,action)).join('')}</div>`}).join('');}
function searchControls(){return `<div class="searchbox">${icon('search')}<input data-role="exercise-search" value="${safe(activeQuery())}" placeholder="Rechercher un exercice…" aria-label="Rechercher un exercice"/></div><div class="filters">${['Tous',...CATS].map(cat=>`<button class="filter ${activeCategory()===cat?'active':''}" data-action="filter" data-value="${safe(cat)}">${cat}</button>`).join('')}</div>`;}
function renderLibrary(){let content=`${searchControls()}<div id="exercise-results">${exerciseListHtml()}</div><div class="row between mt20"><label class="small muted"><input type="checkbox" data-role="show-archived" ${state.showArchived?'checked':''}/> Afficher les exercices archivés</label></div>`;
 shell(titleBar('Exercices'),content+`<button class="floating" data-action="add-exercise" aria-label="Ajouter un exercice">${icon('plus')}</button>`);}
function mostRecentEntry(exerciseId){return state.data.entries.filter(e=>e.exercise_id===exerciseId).map(e=>({entry:e,session:getSession(e.session_id)})).filter(x=>x.session).sort((a,b)=>b.session.session_date.localeCompare(a.session.session_date)||b.entry.created_at.localeCompare(a.entry.created_at))[0]?.entry;}
// Indice RELATIF par exercice : 100 = première performance comparable.
// Répétitions chargées : 1RM estimé (Epley avec répétitions restantes, estimation imparfaite).
// Répétitions au poids du corps : répétitions possibles estimées (= répétitions + RIR).
// Durée : secondes avec un petit correctif heuristique lié au RIR (non validé).
// Ne pas additionner les séries : meilleure série de travail par date = indice de capacité, pas volume.
function calcCapacity(set,kind){
 const rir=Number.isFinite(Number(set.rir)) && set.rir!==null ? Math.max(0,Number(set.rir)) : 0;
 const kg=Number(set.kg)||0;
 if(kind==='time')return (Number(set.seconds)||0)*(1+0.025*rir);
 if(kind==='loaded')return kg*(1+(Math.min(30,(Number(set.reps)||0)+rir))/30);
 return (Number(set.reps)||0)+rir;
}
function performancePoints(exerciseId,cutoff=null){
 const exercise=getExercise(exerciseId);
 if(!exercise)return {points:[],mode:'none',excluded:0,note:''};
 const observations=[];
 state.data.entries.filter(e=>e.exercise_id===exerciseId).forEach(entry=>{
   const session=getSession(entry.session_id);
   if(!session||(cutoff&&session.session_date>cutoff))return;
   setsFor(entry.id).forEach(set=>{
     const qty=exercise.tracking_type==='time'?set.seconds:set.reps;
     if(!(Number(qty)>0))return;
     observations.push({date:session.session_date,session,entry,set});
   });
 });
 if(!observations.length)return {points:[],mode:'none',excluded:0,note:''};
 const timed=exercise.tracking_type==='time';
 const loaded=!timed&&observations.some(o=>Number(o.set.kg)>0);
 const mode=timed?'time':loaded?'loaded':'bodyweight';
 let comparable=observations;
 let note='';
 if(loaded){
    comparable=observations.filter(o=>Number(o.set.kg)>0);
    if(comparable.length<observations.length)note='Les séries au poids du corps ne sont pas comparées aux séries avec charge : seules les séries chargées figurent sur la courbe.';
 }
 if(timed){
    const weights=[...new Set(observations.map(o=>Number(o.set.kg)||0))];
    if(weights.length>1){
      // Ne pas confondre un gain de durée avec une variation de charge pendant le gainage.
      const reference=Number([...observations].sort((a,b)=>b.date.localeCompare(a.date))[0].set.kg)||0;
      comparable=observations.filter(o=>(Number(o.set.kg)||0)===reference);
      note=`Pour rester comparable, la courbe montre uniquement les séries à ${fmt(reference)} kg. Les autres charges sont exclues.`;
    }
 }
 const byDate=new Map();
 comparable.forEach(o=>{
    const capacity=calcCapacity(o.set,mode);
    if(!Number.isFinite(capacity)||capacity<=0)return;
    const old=byDate.get(o.date);
    if(!old||capacity>old.capacity){
      byDate.set(o.date,{date:o.date,capacity,kg:Number(o.set.kg)||0,reps:o.set.reps,seconds:o.set.seconds,rir:o.set.rir,side:o.set.side});
    }
 });
 const sorted=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
 const base=sorted[0]?.capacity||0;
 return {points:sorted.map(p=>({...p,index:base>0?100*p.capacity/base:100})),mode,excluded:observations.length-comparable.length,note};
}
function perfComponents(p,mode){
 const amount=mode==='time'?`${fmt(p.seconds)} s`:`${fmt(p.reps)} rép.`;
 const kg=mode==='time'&&p.kg===0?'':` · ${fmt(p.kg)} kg`;
 return `${amount}${kg} · RIR ${p.rir??'non saisi'}`;
}
function perfFormula(mode){
 if(mode==='loaded')return 'Capacité estimée = charge × [1 + (répétitions + RIR) / 30] (formule de type Epley, plafonnée à 30 répétitions théoriques).';
 if(mode==='bodyweight')return 'Capacité estimée au poids du corps = répétitions + RIR. Charge additionnelle nulle.';
 return 'Capacité chronométrée = secondes × (1 + 0,025 × RIR). Le coefficient RIR pour le temps est un repère pratique, non une formule scientifique validée.';
}
function renderGraph(series){
 const {points,mode,note}=series;
 if(!points.length)return `<div class="note">Pas encore de performances comparables. Saisis des répétitions ou une durée pour commencer le suivi.</div>`;
 const ps=points.slice(-8),w=Math.max(390,ps.length*96),h=280,x0=42,x1=w-27,y0=51,y1=195;
 const low=Math.min(...ps.map(p=>p.index)),high=Math.max(...ps.map(p=>p.index));
 const minY=Math.max(0,Math.floor((low-8)/10)*10),maxY=Math.ceil((high+8)/10)*10;
 const yr=maxY===minY?maxY+20:maxY;
 const xy=ps.map((p,i)=>({x:ps.length===1?(x0+x1)/2:x0+(x1-x0)*i/(ps.length-1),y:y1-(p.index-minY)/(yr-minY)*(y1-y0),p}));
 let grid='';for(let k=0;k<=4;k++){const y=y1-(y1-y0)*k/4;grid+=`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#e8edf3"/><text x="34" y="${y+4}" text-anchor="end" fill="#8495a9" font-size="10">${fmt(minY+(yr-minY)*k/4)}</text>`;}
 const path=xy.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');
 const dots=xy.map(({x,y,p})=>`<circle cx="${x}" cy="${y}" r="5" fill="#c99d4c" stroke="#fff" stroke-width="2"><title>${dateFr(p.date)} — indice ${fmt(p.index)} — ${perfComponents(p,mode)}</title></circle>`).join('');
 const annot=xy.map(({x,y,p})=>{
    const component=mode==='time'?`${fmt(p.seconds)}s`:`${fmt(p.kg)}kg · ${fmt(p.reps)}rép`;
    return `<text x="${x}" y="${Math.max(14,y-15)}" text-anchor="middle" font-size="12" font-weight="800" fill="#0e335c">${Math.round(p.index)}</text><text x="${x}" y="${Math.min(223,y+16)}" text-anchor="middle" font-size="9" font-weight="700" fill="#576c85">${safe(component)}</text><text x="${x}" y="${Math.min(236,y+29)}" text-anchor="middle" font-size="9" fill="#907039">RIR ${p.rir??'—'}</text><text x="${x}" y="265" text-anchor="middle" font-size="9" fill="#657b91">${dFrom(p.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</text>`;
 }).join('');
 const last=points.at(-1),change=last.index-100;
 return `<div class="card performance-card"><div class="row between"><div><div class="tiny muted">Indice de progression</div><div class="score-big">${fmt(last.index)} <span class="score-delta ${change<0?'negative':''}">${change>=0?'+':''}${fmt(change)} % depuis la référence</span></div></div><span class="index-base">Base 100</span></div>
 <div class="progress-wrap mt12"><svg class="progress-svg" style="min-width:${w}px" viewBox="0 0 ${w} ${h}" role="img" aria-label="Évolution de l'indice de progression par date">${grid}<path d="${path}" fill="none" stroke="#c99d4c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${annot}</svg></div>
 <p class="small muted">Chaque point affiche l’indice, la charge, les répétitions ou la durée, et le RIR. <strong>100 = première référence comparable</strong>. La courbe indique une évolution estimée, pas une mesure exacte de la force.</p>
 ${note?`<div class="note">${safe(note)}</div>`:''}
 <div class="progress-table-wrap"><table class="progress-list"><thead><tr><th>Date</th><th>Indice</th><th>${mode==='time'?'Durée':'Rép.'}</th><th>Kg</th><th>RIR</th></tr></thead><tbody>${[...points].reverse().slice(0,20).map(p=>`<tr><td>${dateFr(p.date)}</td><td><strong>${fmt(p.index)}</strong></td><td>${fmt(mode==='time'?p.seconds:p.reps)}</td><td>${fmt(p.kg)}</td><td>${p.rir===null?'—':fmt(p.rir)}</td></tr>`).join('')}</tbody></table></div>
 <details class="index-explainer"><summary>Comment est calculé l’indice ?</summary><p>${safe(perfFormula(mode))}</p><p><strong>Indice = 100 × capacité du jour / capacité de référence.</strong> Le RIR est subjectif ; les séries à l'échec, l'amplitude, les machines, la technique et les conditions changent la comparabilité. Le nombre de séries n'entre pas dans l'indice : il est suivi dans Stats.</p></details></div>`;
}
function exerciseHistory(id){const rows=state.data.entries.filter(e=>e.exercise_id===id).map(e=>({session:getSession(e.session_id),entry:e})).filter(x=>x.session).sort((a,b)=>b.session.session_date.localeCompare(a.session.session_date));
 if(!rows.length)return `<div class="note">Pas encore de séance enregistrée avec cet exercice.</div>`;
 return `<div class="listbox">${rows.slice(0,25).map(({session,entry})=>`<button class="session-row" data-action="view-session" data-id="${session.id}"><span class="grow"><span class="title">${dateFr(session.session_date)} · ${safe(session.location)}</span><div class="small muted" style="margin-top:5px">${safe(describeSets(entry))}</div></span>${icon('chevron')}</button>`).join('')}</div>`;}
function renderExerciseDetail(){const e=getExercise(state.pickedExercise);if(!e)return go('exercises');
 const p=performancePoints(e.id);shell(titleBar(e.name,'exercises'),`<div class="card"><div class="row between mb8"><span class="pill">${safe(e.category)}</span>${machine(e)}</div><div>${pills(e)}</div>${e.notes?`<p class="small muted">${safe(e.notes)}</p>`:''}<div class="mt12">${btn(icon('edit')+' Modifier la fiche','edit-exercise','btn-outline','data-id="'+e.id+'"')}</div></div>${groupBox('Indice de progression',renderGraph(p))}${groupBox('Historique',exerciseHistory(e.id))}`);}
function renderExerciseForm(){const e=state.editExercise?getExercise(state.editExercise):null;const category=e?.category||'Jambes';const selected=e?.muscles||[];let html=`<form id="exercise-form"><div class="card"><div class="field"><label class="form-label" for="exercise-name">Nom de l’exercice *</label><input id="exercise-name" class="control" name="name" required maxlength="140" placeholder="Ex. : Fentes arrière" value="${safe(e?.name||'')}"/></div>
 <div class="field"><div class="form-label">Catégorie *</div><div class="radio-row">${CATS.map(c=>`<label class="radio-choice"><input type="radio" name="category" value="${safe(c)}" ${category===c?'checked':''}/><span>${c}</span></label>`).join('')}</div></div>
 <div class="field"><label class="form-label" for="primary">Muscle principal *</label><select id="primary" class="control" name="primary_muscle">${MUSCLES.map(m=>`<option value="${m}" ${e?.primary_muscle===m?'selected':''}>${m}</option>`).join('')}</select><div class="tiny muted" style="margin-top:5px">Utilisé pour compter les séries dans les statistiques, sans les compter plusieurs fois.</div></div>
 <div class="field"><div class="form-label">Tous les muscles travaillés</div><div class="chip-grid">${MUSCLES.map(m=>`<label class="chip-choice"><input type="checkbox" name="muscles" value="${m}" ${selected.includes(m)?'checked':''}/><span>${m}</span></label>`).join('')}</div></div>
 <div class="field"><label class="form-label" for="tracking">Type de suivi</label><select id="tracking" class="control" name="tracking_type"><option value="reps" ${e?.tracking_type!=='time'?'selected':''}>Répétitions</option><option value="time" ${e?.tracking_type==='time'?'selected':''}>Durée (secondes)</option></select></div>
 <div class="field"><label class="switchline"><span class="title small">${icon('machine')} Nécessite la salle</span><input name="requires_machine" type="checkbox" ${e?.requires_machine?'checked':''}/></label></div>
 <div class="field"><label class="form-label" for="ex-notes">Commentaires (facultatif)</label><textarea class="control textarea" id="ex-notes" name="notes" placeholder="Conseils d’exécution, variante…">${safe(e?.notes||'')}</textarea></div><div id="form-error" class="error" hidden></div><button class="btn btn-gold btn-wide" type="submit">${e?'Enregistrer les modifications':'Ajouter à ma bibliothèque'}</button></div></form>`;
 if(e)html+=`<div style="margin-top:12px">${btn(e.archived?'Réactiver cet exercice':'Archiver cet exercice','archive-exercise','btn-outline btn-wide','data-id="'+e.id+'"')}</div><p class="small muted">Archiver masque l’exercice de la bibliothèque sans supprimer son historique.</p>`;
 shell(titleBar(e?'Modifier l’exercice':'Nouvel exercice',e?'exercise':'exercises'),html);}
function renderSessions(){const rows=[...state.data.sessions].sort((a,b)=>b.session_date.localeCompare(a.session_date)||b.created_at.localeCompare(a.created_at));
 const grouped={};rows.forEach(s=>{const k=dFrom(s.session_date).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});(grouped[k]??=[]).push(s);});
 const html=rows.length?Object.entries(grouped).map(([month,xs])=>`<h3 class="category-heading">${month[0].toUpperCase()+month.slice(1)}</h3><div class="listbox">${xs.map(s=>`<button class="session-row" data-action="view-session" data-id="${s.id}"><span class="left-ico">${icon('calendar')}</span><span class="grow"><span class="title">${safe(dayFr(s.session_date))}</span><div class="small muted" style="margin-top:4px">${safe(s.location)} ${s.duration_min!==null?'· '+s.duration_min+' min':''} · ${entriesForSession(s.id).length} ex.</div></span><span class="chev">${icon('chevron')}</span></button>`).join('')}</div>`).join(''):
 `<div class="empty">${icon('calendar')}<h3>Ton carnet commence ici</h3><p>Crée une séance vide, puis ajoute tes exercices à la volée ou plus tard.</p>${btn(icon('plus')+' Nouvelle séance','new-session','btn-gold')}</div>`;
 shell(titleBar('Séances'),html+`<button class="floating" data-action="new-session" aria-label="Créer une séance">${icon('plus')}</button>`);}
function sessionSummary(s){return `${dateFr(s.session_date)} · ${s.location}${s.duration_min!==null?' · '+s.duration_min+' min':''}`;}
function describeSets(entry){const sets=setsFor(entry.id);const e=getExercise(entry.exercise_id);if(!sets.length)return 'Aucune série';
 const allSame=(key)=>sets.every(s=>String(s[key]??'')===String(sets[0][key]??''));
 const length=sets.length, pairs=length%2===0 && sets.filter(s=>s.side==='left').length===length/2 && sets.filter(s=>s.side==='right').length===length/2;
 const count=pairs?length/2:length;
 let reps=e?.tracking_type==='time'?(allSame('seconds')?`${sets[0].seconds??'—'} sec`:'durées variables'):(allSame('reps')?`${sets[0].reps??'—'} rép.`:'rép. variables');
 return `${count} × ${reps}${pairs?' / jambe':''}${sets[0].side==='alternating'?' (total alterné)':''} · ${allSame('kg')?fmt(sets[0].kg)+' kg':'charges variables'} · ${allSame('rir')?'RIR '+(sets[0].rir??'—'):'RIR variables'}`;
}
function renderSessionDetail(){const s=getSession(state.pickedSession);if(!s)return go('sessions');const entries=entriesForSession(s.id);
 const content=`<div class="card"><div class="row between"><div><span class="title">${safe(dayFr(s.session_date))}</span><div class="small muted mt12">${safe(s.location)} ${s.duration_min!==null?'· '+s.duration_min+' min':''}</div></div><button class="icon-button" style="background:#eef2f7;color:var(--navy)" data-action="edit-session" aria-label="Modifier la séance">${icon('edit')}</button></div>${s.notes?`<p class="small muted">${safe(s.notes)}</p>`:''}</div>
 ${btn(icon('plus')+' Ajouter un exercice','choose-exercise','btn-gold btn-wide')}
 <div class="mt20">${entries.length?entries.map(entry=>{const e=getExercise(entry.exercise_id);return `<button class="session-row" data-action="edit-entry" data-id="${entry.id}" style="margin-bottom:9px;border:1px solid var(--line);border-radius:13px;"><span class="left-ico">${icon(e?.requires_machine?'machine':'dumbbell')}</span><span class="grow"><span class="title">${safe(e?.name||'Exercice archivé')}</span><div class="small muted" style="margin-top:5px">${safe(describeSets(entry))}</div>${entry.notes?`<div class="tiny muted">${safe(entry.notes)}</div>`:''}</span><span class="chev">${icon('chevron')}</span></button>`;}).join(''):`<div class="empty"><h3>Séance vide</h3><p>Ajoute un premier exercice maintenant, ou reviens après l’entraînement.</p></div>`}</div>
 <div class="mt20">${btn(icon('edit')+' Modifier date, lieu et durée','edit-session','btn-outline btn-wide')}</div><div class="mt12">${btn(icon('trash')+' Supprimer cette séance','delete-session','btn-danger btn-wide')}</div>`;
 shell(titleBar('Ma séance','sessions',sessionSummary(s)),content);}
function renderSessionForm(){const s=state.editSession?getSession(state.editSession):null;const form=`<form id="session-form"><div class="card"><div class="field"><label class="form-label" for="session-date">Date *</label><input class="control" type="date" id="session-date" name="session_date" value="${s?.session_date||today()}" required/></div><div class="field"><div class="form-label">Lieu *</div><div class="radio-row">${['Maison','INSEP','ON AIR'].map(loc=>`<label class="radio-choice"><input type="radio" name="location" value="${loc}" ${(s?.location||'Maison')===loc?'checked':''}/><span>${loc}</span></label>`).join('')}</div></div><div class="field"><label class="form-label" for="duration">Durée (minutes, facultatif)</label><input class="control" id="duration" name="duration_min" type="number" min="0" max="600" placeholder="À compléter après la séance" value="${s?.duration_min??''}"/></div><div class="field"><label class="form-label" for="session-notes">Commentaire (facultatif)</label><textarea class="control textarea" id="session-notes" name="notes" placeholder="Sensations, contexte, objectif…">${safe(s?.notes||'')}</textarea></div><div id="form-error" class="error" hidden></div><button type="submit" class="btn btn-gold btn-wide">${s?'Enregistrer les modifications':'Créer la séance vide'}</button></div></form>`;
 shell(titleBar(s?'Modifier la séance':'Nouvelle séance',s?'session':'sessions'),form);}
function renderChooseExercise(){let list=`${searchControls()}<div id="exercise-results">${exerciseListHtml('select-for-session')}</div><div class="note">Tu peux ajouter plusieurs fois le même exercice, ou revenir modifier une séance à tout moment.</div>`;
 shell(titleBar('Ajouter un exercice','session'),list);}
function latestSetsFor(exerciseId){const entry=mostRecentEntry(exerciseId);return entry?setsFor(entry.id):[];}
function renderEntryAdd(){const e=getExercise(state.pickedExercise),s=getSession(state.pickedSession);if(!e||!s)return go('session');const last=latestSetsFor(e.id);const isTime=e.tracking_type==='time';const side=last[0]?.side||'both';const hasBoth=last.some(s=>s.side==='left')&&last.some(s=>s.side==='right');
 const startN=last.length?(hasBoth?Math.max(1,last.length/2):last.length):3;
 const html=`<div class="card"><div class="title">${safe(e.name)}</div><div class="mt12">${pills(e)} ${machine(e)}</div></div><form id="add-entry-form"><div class="card"><h2 class="section-title">Saisie rapide</h2><div class="row field"><label class="grow"><span class="form-label">Séries</span><input class="control" type="number" name="count" min="1" max="30" value="${Math.min(30,startN)}" required/></label><label class="grow"><span class="form-label">${isTime?'Secondes / série':'Répétitions / série'}</span><input class="control" type="number" name="quantity" min="1" max="${isTime?36000:1000}" value="${isTime?last[0]?.seconds||45:last[0]?.reps||10}" required/></label></div><div class="row field"><label class="grow"><span class="form-label">Charge (kg)</span><input class="control" type="number" name="kg" min="0" max="10000" step="0.25" value="${last[0]?.kg??0}" required/></label><label class="grow"><span class="form-label">RIR (facultatif)</span><input class="control" type="number" name="rir" min="0" max="10" step="0.5" placeholder="—" value="${last[0]?.rir??''}"/></label></div><div class="field"><label class="form-label" for="entry-side">Comment compter ?</label><select class="control" id="entry-side" name="side">${SIDES.map(([v,l])=>`<option value="${v}" ${(hasBoth?'both_lr':side)===v?'selected':''}>${l}</option>`).join('')}</select><div class="small muted" style="margin-top:6px">Fentes alternées : indique le nombre TOTAL de répétitions de la série (ex. 25). « Chaque jambe » crée une ligne gauche et une ligne droite par série.</div></div><div class="field"><label class="form-label">Commentaire (facultatif)</label><textarea class="control textarea" name="notes" placeholder="Technique, sensations…"></textarea></div><div id="form-error" class="error" hidden></div><button type="submit" class="btn btn-gold btn-wide">Ajouter à la séance</button></div></form>`;
 shell(titleBar(e.name,'session','Ajout à '+dateFr(s.session_date)),html);}
function newRowFor(entry){const arr=state.draftRows;const last=arr[arr.length-1]||{reps:10,seconds:45,kg:0,rir:null,side:'both'};return {id:null,position:arr.length+1,reps:last.reps,seconds:last.seconds,kg:last.kg,rir:last.rir,side:last.side};}
function entryEditHtml(){const entry=getEntry(state.pickedEntry),e=getExercise(entry?.exercise_id);if(!entry||!e)return `<div class="empty">Exercice introuvable</div>`;
 const time=e.tracking_type==='time';return `<div class="card"><div class="title">${safe(e.name)}</div><div class="mt12">${pills(e)}</div></div><form id="edit-entry-form"><div class="card"><h2 class="section-title">Modifier les séries</h2><div class="set-grid-head"><span>N°</span><span>${time?'Sec.':'Rép.'}</span><span>Kg</span><span>RIR</span><span>Côté</span><span></span></div>
 ${state.draftRows.map((row,i)=>`<div class="set-grid"><span class="center small">${i+1}</span><input class="control sm" type="number" min="0" max="${time?'36000':'1000'}" data-row="${i}" data-field="${time?'seconds':'reps'}" value="${safe((time?row.seconds:row.reps)??'')}" aria-label="${time?'Secondes':'Répétitions'} série ${i+1}"/><input class="control sm" type="number" min="0" max="10000" step="0.25" data-row="${i}" data-field="kg" value="${safe(row.kg??0)}" aria-label="Charge série ${i+1}"/><input class="control sm" type="number" min="0" max="10" step="0.5" data-row="${i}" data-field="rir" value="${safe(row.rir??'')}" aria-label="RIR série ${i+1}"/><select class="control sm" style="font-size:10px;padding:2px" data-row="${i}" data-field="side" aria-label="Côté série ${i+1}">${[['both','2'],['alternating','Alt'],['left','G'],['right','D']].map(([v,l])=>`<option value="${v}" ${row.side===v?'selected':''}>${l}</option>`).join('')}</select><button class="btn-remove" type="button" data-action="remove-row" data-index="${i}" title="Supprimer série">${icon('trash')}</button></div>`).join('')}
 <button class="btn btn-outline btn-wide mt12" type="button" data-action="add-row">${icon('plus')} Ajouter une série</button>
 <div class="field mt20"><label class="form-label" for="edit-entry-notes">Commentaire</label><textarea class="control textarea" id="edit-entry-notes" name="notes">${safe(state.draftNote)}</textarea></div><div id="form-error" class="error" hidden></div><button type="submit" class="btn btn-gold btn-wide">Enregistrer les modifications</button></div></form><div class="mt20">${btn(icon('trash')+' Retirer cet exercice de la séance','remove-entry','btn-danger btn-wide')}</div>`;}
function renderEntryEdit(){const entry=getEntry(state.pickedEntry),e=getExercise(entry?.exercise_id);if(!entry||!e)return go('session');shell(titleBar('Modifier : '+e.name,'session'),entryEditHtml());}
function monday(offset=0){const d=dFrom(today());d.setDate(d.getDate() - (d.getDay()+6)%7 + offset*7);return d;}
function statsData(){const from=iso(monday(state.weekOffset));const untilD=monday(state.weekOffset);untilD.setDate(untilD.getDate()+6);const until=iso(untilD);const sessions=state.data.sessions.filter(s=>s.session_date>=from&&s.session_date<=until);
 const ids=new Set(sessions.map(s=>s.id));const entries=state.data.entries.filter(e=>ids.has(e.session_id));let counts={};let total=0;
 entries.forEach(entry=>{const e=getExercise(entry.exercise_id);const n=setsFor(entry.id).length;total+=n;if(e)counts[e.primary_muscle]=(counts[e.primary_muscle]||0)+n;});return {from,until,sessions,entries,counts,total};}
function renderStats(){const st=statsData(),max=Math.max(1,...Object.values(st.counts));const weekName=`${dateFr(st.from)} — ${dateFr(st.until)}`;const muscleNames=MUSCLES.filter(m=>st.counts[m]>0).sort((a,b)=>(st.counts[b]||0)-(st.counts[a]||0));
 const prev=state.data.exercises.map(e=>({e,p:performancePoints(e.id,st.until).points})).filter(x=>x.p.length>=2 && !x.e.archived)
  .map(({e,p})=>({e,last:p.at(-1),before:p.at(-2)})).sort((a,b)=>a.e.category.localeCompare(b.e.category,'fr'));
 const trends=prev.slice(0,12).map(({e,last,before})=>{const diff=last.index-before.index;return `<button class="trend-row" style="width:100%;border-top:0;border-left:0;border-right:0;background:transparent;text-align:left" data-action="view-exercise" data-id="${e.id}"><span class="grow"><span class="title small">${safe(e.name)}</span><div class="tiny muted">${dateFr(before.date)} : ${fmt(before.index)} → ${dateFr(last.date)} : ${fmt(last.index)} points</div></span><span class="trend-change ${diff<0?'neg':diff===0?'flat':''}">${diff>0?'+':''}${fmt(diff)} pts</span>${icon('chevron')}</button>`;}).join('');
 const html=`<div class="week-nav"><button data-action="week-prev" aria-label="Semaine précédente">${icon('back')}</button><div class="week-label">${safe(weekName)}</div><button data-action="week-next" aria-label="Semaine suivante" ${state.weekOffset>=0?'disabled':''}>${icon('chevron')}</button></div><div class="stats-grid"><div class="statbox"><strong>${st.sessions.length}</strong><span>Séances</span></div><div class="statbox"><strong>${st.total}</strong><span>Séries</span></div><div class="statbox"><strong>${st.entries.length}</strong><span>Exercices réalisés</span></div></div>
 <div class="mt20">${groupBox('Volume hebdomadaire par muscle',`<div class="card">${muscleNames.length?muscleNames.map(m=>`<div class="bar-row"><span>${m}</span><span class="bar-bg"><span class="bar-fill" style="display:block;width:${(st.counts[m]/max*100).toFixed(2)}%"></span></span><strong>${st.counts[m]}</strong></div>`).join(''):'<p class="small muted">Aucune série enregistrée sur cette semaine.</p>'}<div class="note">Volume = nombre de séries attribuées au <strong>muscle principal</strong> de chaque exercice. Cela évite de compter deux fois la même série.</div></div>`)}</div>
 ${groupBox('Évolution de l’indice par exercice',`<div class="card">${trends||'<p class="small muted">Deux dates avec des performances sont nécessaires pour comparer un exercice.</p>'}<p class="small muted mt12">Comparaison des deux dernières dates suivies jusqu’à cette semaine. Indice relatif à la première référence de chaque exercice (base 100). Clique pour voir charge, répétitions ou durée et RIR.</p></div>`)}`;
 shell(titleBar('Stats'),html);}
function renderAuth(){root.innerHTML=`<div class="auth-page"><div class="auth-brand"><img src="./icon-192.png" alt=""/><h1>MUSCU</h1></div><form id="login-form" class="auth-card"><h2>Connexion privée</h2><div class="field"><label class="form-label" for="login-email">Adresse e-mail</label><input class="control" type="email" id="login-email" name="email" required autocomplete="username"/></div><div class="field"><label class="form-label" for="login-password">Mot de passe</label><input class="control" type="password" id="login-password" name="password" required autocomplete="current-password"/></div><div id="form-error" class="error" hidden></div><button type="submit" class="btn btn-gold btn-wide">${icon('lock')} Se connecter</button><p class="small muted center">Accès réservé à ton compte. Pas d’inscription publique.</p></form></div>`;}
function render(){if(!api){root.innerHTML=`<div class="setup"><h2>Configuration nécessaire</h2><p>La V1 est prête. Ouvre le fichier <code>config.js</code> et renseigne l’URL de ton projet Supabase et sa clé <strong>publishable</strong> (jamais de clé secrète).</p><p>Lis <code>README.md</code> pour les étapes de configuration.</p></div>`;return;}
 if(!state.user){renderAuth();return;}
 switch(state.screen){case'exercises':renderLibrary();break;case'exercise':renderExerciseDetail();break;case'exercise-form':renderExerciseForm();break;case'sessions':renderSessions();break;case'session':renderSessionDetail();break;case'session-form':renderSessionForm();break;case'choose-exercise':renderChooseExercise();break;case'entry-add':renderEntryAdd();break;case'entry-edit':renderEntryEdit();break;case'stats':renderStats();break;default:go('exercises');}}

async function fetchAll(table){const limit=900;let start=0,all=[];while(true){const {data,error}=await api.from(table).select('*').order('created_at',{ascending:true}).order('id',{ascending:true}).range(start,start+limit-1);if(error)throw error;all.push(...(data||[]));if(!data||data.length<limit)break;start+=limit;}return all;}
const INITIAL = [
 ['Fentes avant','Jambes','Quadriceps','Fessiers,Ischios',false,'reps'],
 ['Fentes arrière','Jambes','Quadriceps','Fessiers,Ischios',false,'reps'],
 ['Presse à cuisses assise','Jambes','Quadriceps','Fessiers,Ischios',true,'reps'],
 ['Presse inclinée (Hammer Strength)','Jambes','Quadriceps','Fessiers,Ischios',true,'reps'],
 ['Leg extension','Jambes','Quadriceps','',true,'reps'],
 ['Machine adducteurs','Jambes','Adducteurs','',true,'reps'],
 ['Leg curl','Fessiers','Ischios','Mollets',true,'reps'],
 ['Hip thrust','Fessiers','Fessiers','Ischios',false,'reps'],
 ['Romanian deadlift','Fessiers','Ischios','Fessiers,Dos',false,'reps'],
 ['Abduction des hanches assise','Fessiers','Fessiers','',true,'reps'],
 ['Élévations mollets','Mollets','Mollets','',false,'reps'],
 ['Step','Jambes','Quadriceps','Fessiers,Mollets',false,'reps'],
 ['Curl haltères debout / assis','Haut du corps','Biceps','',false,'reps'],
 ['Pompes sur genoux','Haut du corps','Pectoraux','Triceps,Épaules,Abdominaux',false,'reps'],
 ['Pompes sur genoux avec poignées','Haut du corps','Pectoraux','Triceps,Épaules,Abdominaux',false,'reps'],
 ['Développé militaire','Haut du corps','Épaules','Triceps',false,'reps'],
 ['Extension triceps à la poulie','Haut du corps','Triceps','',true,'reps'],
 ['Tirage latéral prise écartée','Haut du corps','Dos','Biceps',true,'reps'],
 ['Gainage frontal','Core','Abdominaux','',false,'time'],
 ['Gainage latéral','Core','Obliques','Abdominaux,Fessiers',false,'time'],
 ['Relevé de jambes sur chaise romaine','Core','Abdominaux','',true,'reps']
];
async function loadStore(){root.innerHTML='<div class="loading">Chargement sécurisé des données…</div>';
 try{
   const tables=['muscle_exercises','muscle_sessions','muscle_session_exercises','muscle_sets'];
   let [exercises,sessions,entries,sets]=await Promise.all(tables.map(fetchAll));
   if(!exercises.length){const payload=INITIAL.map(([name,category,primary_muscle,others,requires_machine,tracking_type])=>({user_id:state.user.id,name,category,primary_muscle,muscles:[...new Set([primary_muscle,...(others?others.split(','):[])])],requires_machine,tracking_type,notes:''}));
     const r=await api.from('muscle_exercises').insert(payload);if(r.error)throw r.error;exercises=await fetchAll('muscle_exercises');}
   state.data={exercises,sessions,entries,sets};render();
 }catch(e){root.innerHTML=`<div class="setup"><h2>Impossible de charger les données</h2><div class="error">${safe(e.message||e)}</div><p>Vérifie que tu as exécuté <code>schema.sql</code> dans le bon projet Supabase, et que tu es connectée au compte créé dans Authentication.</p><button class="btn btn-outline" id="reload-app">Réessayer</button><button class="btn btn-danger" id="logout-app">Déconnexion</button></div>`;}}
async function write(table,method,payload,query=null){let q=method==='delete'?api.from(table).delete():api.from(table)[method](payload);if(query)q=query(q);const {data,error}=await q;if(error)throw error;return data;}
async function busy(task){if(state.busy)return;state.busy=true;try{await task();}catch(e){err('Enregistrement impossible : '+(e.message||e));}finally{state.busy=false;}}
function validNumber(v,min,max,field){const x=num(v);if(x===null||!Number.isFinite(x)||x<min||x>max)throw new Error(`${field} : valeur entre ${min} et ${max} attendue.`);return x;}
function toSet(r,isTime,entryId,pos){const amount=isTime?{seconds:r.seconds===null?null:validNumber(r.seconds,0,36000,'Durée'),reps:null}:{reps:r.reps===null?null:validNumber(r.reps,0,1000,'Répétitions'),seconds:null};const kg=validNumber(r.kg??0,0,10000,'Charge');const rir=r.rir===''||r.rir===null||r.rir===undefined?null:validNumber(r.rir,0,10,'RIR');return {...amount,kg,rir,side:r.side||'both',position:pos,session_exercise_id:entryId,user_id:state.user.id};}
function syncDraft(){const note=root.querySelector('#edit-entry-notes');if(note)state.draftNote=note.value;root.querySelectorAll('[data-row][data-field]').forEach(input=>{const i=Number(input.dataset.row),field=input.dataset.field;if(state.draftRows[i])state.draftRows[i][field]=input.value;});}
function openEntryEdit(id){state.pickedEntry=id;state.draftRows=setsFor(id).map(x=>({...x}));state.draftNote=getEntry(id)?.notes||'';state.removedRows=[];go('entry-edit');}

root.addEventListener('input',(ev)=>{if(ev.target.matches('[data-role="exercise-search"]')){if(state.screen==='choose-exercise')state.chooseQuery=ev.target.value;else state.query=ev.target.value;const el=root.querySelector('#exercise-results');if(el)el.innerHTML=exerciseListHtml(state.screen==='choose-exercise'?'select-for-session':'view-exercise');}});
root.addEventListener('change',(ev)=>{if(ev.target.matches('[data-role="show-archived"]')){state.showArchived=ev.target.checked;render();}});
root.addEventListener('click',async(ev)=>{
 if(ev.target.id==='reload-app'){await loadStore();return;}
 if(ev.target.id==='logout-app'){await api.auth.signOut();state.user=null;render();return;}
 const b=ev.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 switch(a){
 case'tab':go(b.dataset.screen);break;
 case'back':go(b.dataset.to);break;
 case'filter':if(state.screen==='choose-exercise')state.chooseCategory=b.dataset.value;else state.category=b.dataset.value;render();break;
 case'logout':await busy(async()=>{await api.auth.signOut();state.user=null;render();});break;
 case'add-exercise':state.editExercise=null;go('exercise-form');break;
 case'edit-exercise':state.editExercise=id;go('exercise-form');break;
 case'view-exercise':state.pickedExercise=id;go('exercise');break;
 case'archive-exercise':await busy(async()=>{const e=getExercise(id);await write('muscle_exercises','update',{archived:!e.archived},q=>q.eq('id',id));await loadStore();go('exercises');notify(e.archived?'Exercice réactivé':'Exercice archivé, historique conservé');});break;
 case'new-session':state.editSession=null;go('session-form');break;
 case'edit-session':state.editSession=state.pickedSession;go('session-form');break;
 case'view-session':state.pickedSession=id;go('session');break;
 case'choose-exercise':state.chooseCategory='Tous';state.chooseQuery='';go('choose-exercise');break;
 case'select-for-session':state.pickedExercise=id;go('entry-add');break;
 case'edit-entry':openEntryEdit(id);break;
 case'add-row':syncDraft();state.draftRows.push(newRowFor());render();break;
 case'remove-row':syncDraft();{const i=Number(b.dataset.index);const del=state.draftRows.splice(i,1)[0];if(del?.id)state.removedRows.push(del.id);render();}break;
 case'week-prev':state.weekOffset--;render();break;
 case'week-next':state.weekOffset=Math.min(0,state.weekOffset+1);render();break;
 case'delete-session':if(!confirm('Supprimer définitivement cette séance et toutes ses séries ?'))break;await busy(async()=>{await write('muscle_sessions','delete',null,q=>q.eq('id',state.pickedSession));await loadStore();go('sessions');notify('Séance supprimée');});break;
 case'remove-entry':if(!confirm('Retirer cet exercice et ses séries de la séance ?'))break;await busy(async()=>{await write('muscle_session_exercises','delete',null,q=>q.eq('id',state.pickedEntry));await loadStore();go('session');notify('Exercice retiré de la séance');});break;
 }
});
root.addEventListener('submit',async ev=>{
 ev.preventDefault();const form=ev.target,fd=new FormData(form),name=form.id;
 if(name==='login-form'){await busy(async()=>{const {data,error}=await api.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});if(error)throw error;state.user=data.user;await loadStore();});return;}
 if(name==='exercise-form'){await busy(async()=>{const primary=String(fd.get('primary_muscle'));const muscles=[...new Set([primary,...fd.getAll('muscles')])];const payload={name:String(fd.get('name')).trim(),category:String(fd.get('category')),primary_muscle:primary,muscles,requires_machine:fd.has('requires_machine'),tracking_type:String(fd.get('tracking_type')),notes:String(fd.get('notes')||'').trim(),user_id:state.user.id};if(payload.name.length<2)throw new Error('Donne un nom à ton exercice.');
 if(state.editExercise){await write('muscle_exercises','update',payload,q=>q.eq('id',state.editExercise));state.pickedExercise=state.editExercise;}else{const data=await write('muscle_exercises','insert',payload,q=>q.select('*').single());state.pickedExercise=data.id;}
 await loadStore();go('exercise');notify('Fiche exercice enregistrée');});return;}
 if(name==='session-form'){await busy(async()=>{const duration=fd.get('duration_min')===''?null:validNumber(fd.get('duration_min'),0,600,'Durée');const payload={session_date:String(fd.get('session_date')),location:String(fd.get('location')),duration_min:duration,notes:String(fd.get('notes')||'').trim(),user_id:state.user.id};if(!/^\d{4}-\d{2}-\d{2}$/.test(payload.session_date))throw new Error('Date invalide.');
 if(state.editSession)await write('muscle_sessions','update',payload,q=>q.eq('id',state.editSession));else{const data=await write('muscle_sessions','insert',payload,q=>q.select('*').single());state.pickedSession=data.id;}await loadStore();go('session');notify('Séance enregistrée');});return;}
 if(name==='add-entry-form'){await busy(async()=>{const e=getExercise(state.pickedExercise);const count=validNumber(fd.get('count'),1,30,'Séries'),quantity=validNumber(fd.get('quantity'),1,e.tracking_type==='time'?36000:1000,'Répétitions / secondes'),kg=validNumber(fd.get('kg'),0,10000,'Charge'),rir=fd.get('rir')===''?null:validNumber(fd.get('rir'),0,10,'RIR');if(!Number.isInteger(count)||!Number.isInteger(quantity))throw new Error('Utilise des nombres entiers pour séries et répétitions / secondes.');
 const side=String(fd.get('side'));const position=entriesForSession(state.pickedSession).length;const row=await write('muscle_session_exercises','insert',{session_id:state.pickedSession,exercise_id:e.id,user_id:state.user.id,notes:String(fd.get('notes')||'').trim(),position},q=>q.select('*').single());
 try{const sets=[];for(let i=0;i<count;i++){for(const s of side==='both_lr'?['left','right']:[side])sets.push({user_id:state.user.id,session_exercise_id:row.id,position:sets.length+1,reps:e.tracking_type==='time'?null:quantity,seconds:e.tracking_type==='time'?quantity:null,kg,rir,side:s});}await write('muscle_sets','insert',sets);}catch(x){await write('muscle_session_exercises','delete',null,q=>q.eq('id',row.id));throw x;}
 await loadStore();go('session');notify('Exercice ajouté');});return;}
 if(name==='edit-entry-form'){await busy(async()=>{syncDraft();const entry=getEntry(state.pickedEntry),ex=getExercise(entry.exercise_id);if(!state.draftRows.length)throw new Error('Ajoute au moins une série, ou retire cet exercice.');
 const rows=state.draftRows.map((r,i)=>({...toSet(r,ex.tracking_type==='time',entry.id,i+1),id:r.id||undefined}));
 for(const row of rows){const id=row.id;delete row.id;if(id)await write('muscle_sets','update',row,q=>q.eq('id',id));else await write('muscle_sets','insert',row);}
 for(const id of state.removedRows)await write('muscle_sets','delete',null,q=>q.eq('id',id));
 await write('muscle_session_exercises','update',{notes:state.draftNote},q=>q.eq('id',entry.id));await loadStore();go('session');notify('Séries enregistrées');});}
});

async function init(){render();if(!api)return;const {data,error}=await api.auth.getSession();if(error){err(error.message);return;}state.user=data.session?.user||null;
 api.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){state.user=null;render();}else if(event==='TOKEN_REFRESHED'&&session){state.user=session.user;}});
 if(state.user)await loadStore();else render();}
init();
})();
