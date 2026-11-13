/* Stoopids Hoops data layer for the verbatim STOOPIDS page (league.html is built from STOOPIDS index.html by tools/build_league_from_stoopids.py).
   This file is the ONLY Hoops logic on that page: it reads one Hoops league (?l=<code>) from the shoops1- store (managers from the joins, rosters from the draft picks),
   the NBA score files (data/scores.json, data/tournament.json, ESPN NBA) and NBA scoring (js/scoring.js via js/league-d.js), and hands the page the same `D` object
   shape that STOOPIDS' refresh.py writes to data.js. It also: checks the manager's own private link (no act-as-anyone), checks the commissioner passcode
   (league meta.pass) and does the commissioner 'Make a new link for [manager]' tool. Nothing here writes outside the shoops1-<league> keys. */
(function(){'use strict';
const q=new URLSearchParams(location.search);let id=String(q.get('l')||'').trim().replace(/[^A-Za-z0-9]/g,'').slice(0,40);
/* If the URL lost ?l= (stale rewrite, PWA start, truncated open), reopen the last league on this device instead of the home landing. */
function lastOpenedLeague(){
  const ok=x=>!!(x&&typeof x==='string'&&/^[A-Za-z0-9]{2,40}$/.test(x));
  const tabOf=t=>/^[a-z]{3,12}$/.test(String(t||''))?String(t):'';
  try{
    const b=JSON.parse(localStorage.getItem('shoops.lastsite')||'null');
    if(b&&!b.mock&&ok(b.id)&&(Date.now()-(+b.at||0)<14*864e5))return{id:String(b.id).replace(/[^A-Za-z0-9]/g,'').slice(0,40),tab:tabOf(b.t)};
  }catch(e){}
  try{
    const a=JSON.parse(localStorage.getItem('shoops.leagues')||'null');
    if(Array.isArray(a)){
      const L=a.find(x=>x&&ok(x.id));
      if(L){let tab='';try{tab=tabOf(sessionStorage.getItem('shoops1.'+String(L.id).toLowerCase()+'.tab'))}catch(e){}return{id:L.id,tab}}
    }
  }catch(e){}
  return null;
}
if(!id){
  const last=lastOpenedLeague();
  if(last){
    const u=new URL(location.href);
    u.searchParams.set('l',last.id);
    if((!u.hash||u.hash.length<2)&&last.tab)u.hash='#'+last.tab;
    location.replace(u.pathname+u.search+u.hash);
    return;
  }
}
const H=window.HOOPS={id,me:null,mid:null,cmOk:false,cmName:'',meta:null,L:null,err:'',nl:{url:'',who:'',busy:false,msg:''},dataName:'',
  draftUrl:'room.html?l='+encodeURIComponent(id),homeUrl:'index.html'};
window.HK='shoops1.'+id.toLowerCase()+'.';   /* this page's localStorage keys (STOOPIDS 'stoopids_*' keys renamed per league; never shared with the real STOOPIDS site on the same origin) */
/*<PAUL-e>*/ /* Archive tab: this league's past seasons from js/hoops-archive.js (keyed by a hash of the league code; built from Paul's sheet by tools/archive_from_sheet.py).
   Any other league keeps the empty Archive state. Sheet names are linked to this league's managers in load() (H.archiveLink), so nothing here names a manager. */
const archKey=c=>{let h=0x811c9dc5;c=String(c||'').toUpperCase();for(let i=0;i<c.length;i++){h^=c.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return ('0000000'+h.toString(16)).slice(-8)};
window.ARCHIVE=(window.HOOPS_ARCHIVES&&window.HOOPS_ARCHIVES[archKey(id)])||{seasons:[]};
H.archiveLink=function(names){const A=window.ARCHIVE;if(!A||!A.seasons||!A.seasons.length)return;const nk=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const find=al=>{const want=(al||[]).map(nk).filter(Boolean);const hit=names.filter(n=>want.indexOf(nk(n))>=0);return hit.length===1?hit[0]:null};
  (A.alltime||[]).forEach(p=>{const c=find(p.aliases);if(c)p.current_owner=c;else delete p.current_owner});
  A.seasons.forEach(S=>(S.owners||[]).forEach(o=>{const p=(A.alltime||[]).find(x=>x.person===o.person);if(p&&p.current_owner)o.current_owner=p.current_owner;else delete o.current_owner}))};/*</PAUL-e>*/
window.HOOPS_OWNER_DISP={};window.HOOPS_OLD_PN={};window.HOOPS_LEGACY_OWNER={};
window.HOOPS_DRAFT27={season:'2026-27',slots:[],order:{}};
window.HOOPS_DRAFT27_RESULTS={contract:'v1',season:'2026-27',league:'',build:'',draft:{type:'snake',rounds:0,managers:0},source:{},order:[],picks:[],grades:{}};
const isLocal=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const base=(()=>{try{const o=isLocal&&localStorage.getItem('shoops.store');if(o)return new URL(o,location.href).href}catch(e){}return'https://textdb.dev/api/data/'})();
H.url=k=>base+encodeURIComponent(FBN.Keys(id).base+'-'+k);   /* STOOPIDS textdb records (bets, requests, presence, chat, commish) live under this league's shoops1- keys */
const lsJ=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const getJ=async u=>{const r=await fetch(u+(u.includes('?')?'&':'?')+'v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
const TD=window.TEAMS_DATA||{teams:[],meta:{}};const TEAMS={},POOL=[];
TD.teams.forEach(r=>{TEAMS[r[0]]={name:r[1],short:r[2],abbr:r[3],color:r[4],alt:r[5],logo:r[6],logo_dark:r[6],mascot:r[7]||'',espn_id:r[0]};POOL.push(r[0])});
const CATS={entry:'playoff_entry',win:'playoff_wins',champ:'nba_champion',cup_final4:'cup_final4',cup_win:'cup_knockout_wins',cup_champion:'cup_champion'};
const CAT_LABELS={win:'Wins',playoff_entry:'Playoff entry (seeds 1-8)',playoff_wins:'Playoff wins',nba_champion:'NBA champion',cup_final4:'NBA Cup Final 4',cup_knockout_wins:'NBA Cup knockout wins',cup_champion:'NBA Cup champion',adjust:'Commissioner adjustment'};
function uniqNames(MG){const seen={};return MG.map(m=>{let n=String(m.name||m.team||'Manager').trim().slice(0,24)||'Manager';let k=n,i=2;while(seen[k])k=n+' '+(i++);seen[k]=1;return k})}
function rankLabel(v){return v==null?null:+v}
/* One page for every Stoopids Hoops league, now and in future seasons: the league comes only from ?l=<code> (its own shoops1-<code>- keys, its own name, managers and
   rosters; this device's keys under shoops1.<code>.). Nothing here names or assumes one league. Without a code (or with an unknown one) the page is the landing:
   start a new draft, join one, or open a league this device has used. */
const myLeagues=()=>{const a=lsJ('shoops.leagues');return Array.isArray(a)?a.filter(x=>x&&typeof x.id==='string'&&/^[A-Za-z0-9]{2,40}$/.test(x.id)):[]};
H.remember=function(name,role){try{const a=myLeagues().filter(x=>x.id!==id);const old=myLeagues().find(x=>x.id===id)||{};a.unshift({id,name:String(name||old.name||id),role:old.role||role||'manager',ts:Date.now()});localStorage.setItem('shoops.leagues',JSON.stringify(a.slice(0,12)))}catch(e){}};
H.landingHtml=function(){const ls=myLeagues();
  return `<div class="card"><h3>${id?'League not found':'Stoopids Hoops'}</h3><p class="prof-note">${id?'No league with the code '+esc(id)+'. Check the link, or start a new one.':'Every NBA draft gets its own league page. Start a new draft or open one of yours.'}</p>
   <p style="margin:12px 0 0;line-height:2.4"><a class="btn" href="setup.html">Start a new NBA draft</a> <a class="btn sec" href="join.html">Join with a code</a></p></div>`+
   (ls.length?`<div class="card"><h3>Your leagues on this device</h3>${ls.map(l=>`<p style="margin:12px 0 0;line-height:2.4"><a class="btn sec" href="league.html?l=${encodeURIComponent(l.id)}">STOOPIDS PRESENTS ${esc(String(l.name||l.id).toUpperCase())}</a></p>`).join('')}</div>`:'')};
H.load=async function(){
  if(!id){H.err='nolink';H.setTitle('Stoopids Hoops');throw new Error('no league code')}
  const L=await FBNLeague.load(id,{pool:POOL});if(!L.meta){H.err='notfound';H.setTitle('Stoopids Hoops');throw new Error('league not found')}
  H.remember(L.meta.name);
  try{const t=(location.hash||'').replace(/^#/,'').split('/')[0];localStorage.setItem('shoops.lastsite',JSON.stringify({id,t:/^[a-z]{3,12}$/.test(t)?t:'standings',at:Date.now()}))}catch(e){}
  H.L=L;H.meta=L.meta;
  /* heading: STOOPIDS PRESENTS <league name the commish set at league setup> (shoops1- league record) */
  H.setTitle(L.meta.name);const MG=L.managers.filter(m=>m&&m.mid);const keys=uniqNames(MG);const keyOf={},mOf={};MG.forEach((m,i)=>{keyOf[m.mid]=keys[i];mOf[keys[i]]=m});H.keyOf=keyOf;H.mOf=mOf;
  /* who am I: only this device's own manager link (shoops.me.<league> = {mid,k}, set by the draft room / a private link), checked against the seat's claim hash */
  H.mid=null;H.me=null;try{const me=lsJ('shoops.me.'+id);if(me&&me.mid&&me.k){const c=FBN.joinedList(L.meta,L.claims).find(x=>x.mid===me.mid);if(c&&await FBN.checkMgrSecret(c,me.k)){H.mid=me.mid;H.me=keyOf[me.mid]||null}}}catch(e){}
  /* presence ('Who are you?') remembers this device's own manager, so a manager opening their own link is not asked */
  try{if(H.me&&!localStorage.getItem(HK+'who'))localStorage.setItem(HK+'who',H.me)}catch(e){}
  try{const cm=localStorage.getItem('shoops.cm.'+id);H.cmOk=!!(cm&&await FBN.checkPass(L.meta,cm))}catch(e){H.cmOk=false}
  H.cmName=(MG.find(m=>m.mid===L.meta.cm)||MG[0]||{}).name||'';
  let SC=null,TN=null;try{SC=await getJ('data/scores.json');if(SC&&SC.sample)SC=null}catch(e){}try{TN=await getJ('data/tournament.json');if(TN&&TN.sample)TN=null}catch(e){}
  const st=L.state||{},roster=((st.roster&&st.roster.length)?st.roster:(st.real&&st.real.length)?st.real:st.picks)||[];
  const rosterF=roster.filter(p=>p&&p.tid!=null);
  H._ctx={L,MG,keyOf,mOf,st,roster:rosterF,TN};
  if(window.LSCHED){LSCHED.init({ids:()=>POOL.slice(),enabled:()=>true,onUpdate:()=>{H.applySched()}});SC=LSCHED.merge(SC)}
  H._ctx.SC=SC;H.publish(SC);if(window.LSCHED)LSCHED.start();return H.D};
H.publish=function(SC){const C=H._ctx;if(!C)return null;SC=SC||C.SC;C.SC=SC;const L=C.L,MG=C.MG,keyOf=C.keyOf,mOf=C.mOf,st=C.st,roster=C.roster,TN=C.TN;
  const B=FBNLeagueD.build({leagueName:L.meta.name,managers:MG,roster,order:st.order||L.meta.order,teams:TEAMS,SC,TN,demo:false,season:'2026-27'});
  const nm=mid=>keyOf[mid]||'';const games=(B.games||[]).map(g=>{const sd=s=>Object.assign({},s,{pool:!!s.owners.length,owners:s.owners.length?[nm((roster.find(p=>String(p.tid)===String(s.id))||{}).owner)]:[]});
    const o=Object.assign({},g,{home:sd(g.home),away:sd(g.away),line:g.line||null,upset:null,src:'espn'});o.h2h=!!(o.home.owners.length&&o.away.owners.length&&o.home.owners[0]!==o.away.owners[0]);o.civil=!!(o.home.owners.length&&o.away.owners.length&&o.home.owners[0]===o.away.owners[0]);return o});
  const team_games={};Object.keys(B.team_games||{}).forEach(t=>{team_games[t]=(B.team_games[t]||[]).map(r=>Object.assign({src:'espn'},r))});
  const owners=(B.owners||[]).map(o=>{const key=nm(o.mid);const teams=(o.teams||[]).map(t=>{const by={win:t.wins||0};const items=[];(team_games[t.tid]||[]).filter(r=>r.res==='W'&&(r.kind==='reg'||r.kind==='cup')).forEach(r=>items.push({cat:'win',pts:1,day:r.day,note:'W vs '+r.opp+' ('+r.us+'-'+r.them+')',auto:true,game:r.id}));
      (t.events||[]).forEach(e=>{const c=CATS[e.kind]||'adjust';by[c]=(by[c]||0)+(+e.pts||0);items.push({cat:c,pts:+e.pts||0,day:'',note:e.label||'',auto:true})});
      return{tid:String(t.tid),window:{start:null,end:null},status:'active',wins_counted:t.wins||0,by,total:(t.wins||0)+(t.tpts||0),items}});
    const by={};Object.keys(o.by_cat||{}).forEach(k=>{if(o.by_cat[k])by[k]=o.by_cat[k]});return{name:key,team_name:o.team_name||key,emoji:o.emoji||'🏀',total:o.total||0,by_cat:by,teams,rank:o.rank,_mid:o.mid}});
  owners.sort((a,b)=>a.rank-b.rank);
  /* display names: team on top, the manager's real name under it ([REDACTED] OWNER_DISP), from the joins; nothing hardcoded */
  const OD=window.HOOPS_OWNER_DISP;Object.keys(OD).forEach(k=>delete OD[k]);owners.forEach(o=>{OD[o.name]={team:o.team_name||o.name,person:o.name}});
  /*<PAUL-e>*/H.archiveLink(owners.map(o=>o.name));/*</PAUL-e>*/
  const records={};Object.keys(B.records||{}).forEach(t=>{records[t]=Object.assign({conf_w:0,conf_l:0},B.records[t])});
  const checklist={};Object.keys(B.checklist||{}).forEach(t=>{const c=B.checklist[t]||{};checklist[t]=Object.assign({},c)});
  const meta0=TD.meta||{};const ranks={teams:{},sources:{}};const sp=Object.keys(meta0).filter(k=>meta0[k]&&meta0[k].sp!=null).sort((a,b)=>meta0[b].sp-meta0[a].sp);
  POOL.forEach(t=>{const m=meta0[t]||{};ranks.teams[t]={ap:rankLabel(m.o),net:rankLabel(m.wr),kenpom:m.sp!=null?Math.round(+m.sp):null,stoopid:rankLabel(m.sr!=null?m.sr:m.p),stoopid_current:rankLabel(m.sr!=null?m.sr:m.p)}});
  const P=Object.assign({},(window.FBNScore&&FBNScore.POINTS)||{});
  const now=new Date(),gen=SC&&SC.generated_at_utc?SC.generated_at_utc:now.toISOString();   /*<BUG-3>*/ /* as_of is a date-only Eastern day; a full ISO UTC stamp is what Standings' Updated line needs */ /*</BUG-3>*/
  const D={meta:{app:'Stoopids Hoops',league:L.meta.name,season:'2026-27',mode:'live',today_et:now.toISOString().slice(0,10),generated_at_utc:gen,generated_at_wib:'',games_loaded:games.length,final_games:games.filter(g=>g.status==='final').length,
      roster_source:'draft room',sheet_ok:true,sheet_error:null,standings_ok:true,fetch:{days_total:0,days_fetched:0,days_cached:0,days_espn_failed:0,days_ncaa_fallback:0,days_failed_both:0},odds:{games_needing_line:0,lines_found:0,missing_line_ids:[]},
      assets:{missing_color:[],missing_alt_color:[],missing_logo:[]},warnings:[],sources:{scores:'ESPN NBA scoreboard',rosters:'Stoopids Hoops draft room'},
      points:{win:P.rs_win||1,playoff_entry:P.playoff_entry||2,playoff_wins:P.playoff_win||2,nba_champion:P.nba_champion||4,cup_final4:P.cup_final4||2,cup_knockout_wins:P.cup_knockout_win||1,cup_champion:P.cup_champion||2},
      rules:{upset_games:[],upset_first_four:false,first_four_loser_penalty:false,count_non_d1_wins:true},redraft:null,overrides_active:{},field:{locked:false,teams_seen:0},games_view:{},ranks_fetch:{at:gen}},
    owners,teams:TEAMS,records,team_games,checklist,upset_audit:[],conf_audit:[],
    bets:{currency:{code:'',display_unit:1,suffix:'',prefix:''},people:[],bets:[],tallies:{all:{all:{ids:[],matrix:{}}}},fines:{},coverage:{total:0,settled:0,settled_with_assumptions:0,wash:0,open:0,unparsed:0,with_money:0,with_items:0},imported_at:null},
    games,cat_labels:CAT_LABELS,windows:{},ranks};
  owners.forEach(o=>{D.windows[o.name]=o.teams.map(t=>({tid:t.tid,start:null,end:null,sheet_name:(TEAMS[t.tid]||{}).short||t.tid}))});
  /* Recap > Draft results: [REDACTED] DRAFT27 slots / order / picks from this league's draft */
  const n=MG.length,picks=(st.picks||[]).filter(p=>p&&p.tid!=null),order=(st.order||L.meta.order||[]).filter(m=>keyOf[m]);
  const D27=window.HOOPS_DRAFT27;D27.slots.length=0;Object.keys(D27.order).forEach(k=>delete D27.order[k]);order.forEach(mid=>{D27.slots.push([keyOf[mid],mid]);D27.order[keyOf[mid]]=picks.filter(p=>p.owner===mid).map(p=>String(p.tid))});
  const R=window.HOOPS_DRAFT27_RESULTS;R.league=L.meta.name;R.completed_at=(L.meta.status==='complete'&&L.meta.endedAt)?new Date(L.meta.endedAt).toISOString():null;R.draft_date=L.meta.startedAt?new Date(L.meta.startedAt).toISOString():null;R.draft={type:(L.meta.settings||{}).type||'snake',rounds:(L.meta.settings||{}).rounds||Math.ceil(picks.length/Math.max(1,n)),managers:n};
  R.order=order.map((mid,i)=>({manager:keyOf[mid],mid,slot:i+1,owner_name:keyOf[mid],team_name:(mOf[keyOf[mid]]||{}).team||keyOf[mid]}));
  R.picks=picks.map((p,i)=>({overall:i+1,round:Math.floor(i/Math.max(1,n))+1,pick:i%Math.max(1,n)+1,manager:keyOf[p.owner],teamId:String(p.tid),team:(TEAMS[p.tid]||{}).short||String(p.tid)}));
  if(H.dataName)window[H.dataName]=D;H.D=D;return D};
H.applySched=function(){if(!window.LSCHED||!H._ctx)return H.D;H.publish(LSCHED.merge(H._ctx.SC));if(typeof H.onSched==='function')try{H.onSched(H.D)}catch(e){}return H.D};
/* commissioner passcode (this league's meta.pass; same check as the draft room) */
/* h1 = league name in the STOOPIDS two-tone title style (last word in the accent span, like STOOP<span>IDS</span>); shrinks to fit one line */
H.setTitle=function(name){const h=document.getElementById('hoopsLg');if(!h)return;const n=String(name||'Stoopids Hoops').trim().toUpperCase().replace(/\s+/g,' ');const i=n.lastIndexOf(' ');
  h.textContent='';if(i>0){h.appendChild(document.createTextNode(n.slice(0,i+1)));const sp=document.createElement('span');sp.textContent=n.slice(i+1);h.appendChild(sp)}else h.textContent=n;
  h.style.whiteSpace='nowrap';h.style.fontSize='';const fit=()=>{h.style.fontSize='';const w=h.parentNode?h.parentNode.clientWidth-(document.getElementById('s12Share')||{offsetWidth:0}).offsetWidth*0:0;let fs=parseFloat(getComputedStyle(h).fontSize);let k=0;while(w&&h.scrollWidth>w&&fs>16&&k++<40){fs-=2;h.style.fontSize=fs+'px'}};fit();if(!H._fit){H._fit=1;addEventListener('resize',fit)}};
H.cmUnlock=async function(pass){if(!H.meta||!pass)return false;const ok=await FBN.checkPass(H.meta,pass);if(ok){try{localStorage.setItem('shoops.cm.'+id,pass)}catch(e){}H.cmOk=true}return ok};
H.cmLock=function(){try{localStorage.removeItem('shoops.cm.'+id)}catch(e){}H.cmOk=false;H.nl.url=''};
/* commissioner 'Make a new link for [manager]': only with a valid commissioner passcode (re-checked right before writing). New secret -> FBN.reissueSeat (new claim hash) -> that seat's key,
   read back; the old link stops verifying. Shows the new private link with Copy / Share. Same as the draft room's tool. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
H.newLinkHtml=function(){if(!H.cmOk||!H.L)return'';const N=H.nl;const seats=FBN.joinedList(H.meta,H.L.claims).filter(c=>c&&H.keyOf[c.mid]&&!(H.meta.over&&H.meta.over[c.mid]&&H.meta.over[c.mid].bot));
  const cmL=(()=>{try{const c=localStorage.getItem('shoops.cm.'+id);if(!c)return'';const u=new URL('room.html',location.href);u.search='?l='+encodeURIComponent(id);u.hash='cm='+encodeURIComponent(c);return u.href}catch(e){return''}})();
  const give=cmL?`<div class="cm-nl" id="cmGive" style="margin-top:12px"><b>Give commish to someone else</b><p class="prof-note">Whoever has this link can run the league: start, pause, undo, change the order and make new manager links. It does not sign them in as your team. Send it only to the person taking over.</p>${H.nl.give?`<input type="text" id="cmGiveUrl" class="sb-in" readonly value="${esc(cmL)}" aria-label="Commissioner-only link" style="width:100%;margin:6px 0"><button type="button" class="btn" id="cmGiveCopy">Copy commish link</button>${navigator.share?' <button type="button" class="btn sec" id="cmGiveShare">Share…</button>':''}`:'<button type="button" class="btn sec" id="cmGiveShow">Give commish to someone else</button>'}</div>`:'';   /* sh10 (Paul): commissioner-only link; the combined link stays the default */
  return give+`<div class="cm-nl" id="cmNewLink" style="margin-top:12px"><b>Private manager links</b><p class="prof-note">For a manager who lost their link. Makes a new private link; their old link stops working.</p>${seats.map(c=>`<button type="button" class="btn sec" style="margin:4px 6px 0 0" data-hnl="${esc(c.mid)}"${N.busy?' disabled':''}>Make a new link for ${esc(H.keyOf[c.mid])}</button>`).join('')}${N.msg?`<div class="prof-note" role="alert">${esc(N.msg)}</div>`:''}
   ${N.url?`<div class="card" id="cmNewOut" style="margin-top:10px"><b>New link for ${esc(N.who)}</b><div class="prof-note">Send this private link to ${esc(N.who)} only. The old link no longer works. Anyone who has this one can act as them.</div><input type="text" id="cmNewUrl" class="sb-in" readonly value="${esc(N.url)}" aria-label="New private link" style="width:100%;margin:6px 0"><button type="button" class="btn" id="cmNewCopy">Copy link</button>${navigator.share?' <button type="button" class="btn sec" id="cmNewShare">Share…</button>':''}</div>`:''}</div>`};
H.newLink=async function(mid){const N=H.nl;N.msg='';const cm=(()=>{try{return localStorage.getItem('shoops.cm.'+id)}catch(e){return null}})();
  if(!H.meta||!cm||!(await FBN.checkPass(H.meta,cm))){H.cmOk=false;N.msg='Commissioner tools are locked.';H.rerender();return}
  const c=FBN.joinedList(H.meta,H.L.claims).find(x=>x.mid===mid);const who=H.keyOf[mid]||'manager';if(!c){N.msg='That manager has no seat.';H.rerender();return}
  if(!confirm('Make a new link for '+who+'? Their old link (and any phone using it) stops working.'))return;
  N.busy=true;H.rerender();try{const r=await FBN.reissueSeat(c),key=FBN.Keys(id).slot(c.i,c.gen);await Store.set(key,JSON.stringify(r.claim));const back=FBN.parseClaim(await Store.get(key));
    if(!back||back.sh!==r.claim.sh)throw new Error('race');H.L.claims[c.i]=back;const u=new URL('room.html',location.href);u.search='?l='+encodeURIComponent(id);u.hash='as='+encodeURIComponent(mid)+'&k='+encodeURIComponent(r.k);N.url=u.href;N.who=who;
    const me=lsJ('shoops.me.'+id);if(me&&me.mid===mid)try{localStorage.setItem('shoops.me.'+id,JSON.stringify({mid,k:r.k}))}catch(e){}}catch(e){N.msg='Could not make a new link. Try again.'}N.busy=false;H.rerender()};
H.copyNew=function(b){const u=H.nl.url;if(!u)return;const ok=()=>{if(b)b.textContent='Copied'};try{navigator.clipboard.writeText(u).then(ok,()=>{const i=document.getElementById('cmNewUrl');if(i){i.select();document.execCommand('copy');ok()}})}catch(e){}};
H.shareNew=function(){if(H.nl.url&&navigator.share)navigator.share({title:'Your Stoopids Hoops link',url:H.nl.url}).catch(()=>{})};
/* buttons above: one delegated listener (no inline handlers in this file) */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target:null;if(!t)return;const b=t.closest('[data-hnl]');if(b){e.preventDefault();H.newLink(b.getAttribute('data-hnl'));return}
  if(t.closest('#cmGiveShow')){e.preventDefault();H.nl.give=true;H.rerender();return}if(t.closest('#cmGiveCopy')){e.preventDefault();const i=document.getElementById('cmGiveUrl');const b=t.closest('#cmGiveCopy');if(i){const ok=()=>{b.textContent='Copied ✓'};try{navigator.clipboard.writeText(i.value).then(ok,()=>{i.select();document.execCommand('copy');ok()})}catch(x){}}return}
  if(t.closest('#cmGiveShare')){e.preventDefault();const i=document.getElementById('cmGiveUrl');if(i&&navigator.share)navigator.share({title:'Commissioner link',url:i.value}).catch(()=>{});return}
  if(t.closest('#cmNewCopy')){e.preventDefault();H.copyNew(t.closest('#cmNewCopy'));return}if(t.closest('#cmNewShare')){e.preventDefault();H.shareNew()}});
H.saveLastSite=function(tab){if(!id)return;const t=String(tab||(location.hash||'').replace(/^#/,'').split('/')[0]||'standings');try{localStorage.setItem('shoops.lastsite',JSON.stringify({id,t:/^[a-z]{3,12}$/.test(t)?t:'standings',at:Date.now()}))}catch(e){}};
addEventListener('hashchange',function(){try{H.saveLastSite()}catch(e){}});
H.rerender=function(){try{window.render&&window.render()}catch(e){}try{if(typeof render==='function')render()}catch(e){}};
})();
