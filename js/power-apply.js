/* Overlay ESPN BPI ranks, current-season records, and Stoopids Rank onto TEAMS_DATA.meta.
   Power Ranking = meta.o / meta.p from data/power.json (BPI).
   Win rank / record = data/last_season.json (final 2025-26 regular-season records).
   Stoopids Rank = data/stoopids.json expected fantasy points.
   If a fetch fails, baked values in teams.js are kept. */
(function(){
const SRC='ESPN BPI (2026-27)';
const FALLBACK='Prior-season win rank (fallback: static 2024-25 regular-season wins; ESPN BPI unavailable)';
function ping(){try{window.dispatchEvent(new Event('hoops-meta-updated'))}catch(e){}}
function applyPower(data){
  const META=(window.TEAMS_DATA&&TEAMS_DATA.meta)||{};
  const ranks=(data&&data.ranks)||{};
  let n=0;
  Object.keys(ranks).forEach(id=>{
    const r=+ranks[id];
    if(!(r>0)||!META[id])return;
    if(META[id].f==null&&META[id].o>0)META[id].f=META[id].o;
    META[id].o=r;META[id].p=r;n++;
  });
  if(n){
    if(window.FBN)FBN.RANK_SRC=SRC;
    if(window.TEAMS_DATA){TEAMS_DATA.rank_note=SRC;TEAMS_DATA.rank_source='espn-bpi'}
  }
  return n;
}
function fallbackNote(){
  const META=(window.TEAMS_DATA&&TEAMS_DATA.meta)||{};
  const has=Object.keys(META).some(id=>META[id]&&META[id].o>0);
  if(window.FBN&&has&&!((window.TEAMS_DATA||{}).rank_source==='espn-bpi'))FBN.RANK_SRC=FALLBACK;
}
function applyStandings(data){
  const META=(window.TEAMS_DATA&&TEAMS_DATA.meta)||{};
  const st=(data&&data.standings)||{};
  const rows=[];
  Object.keys(META).forEach(id=>{
    const s=st[id];
    if(!s||(s.w==null&&s.l==null))return;
    const w=+s.w||0,l=+s.l||0;
    if(META[id].r0==null)META[id].r0=META[id].r;
    META[id].r=w+'-'+l;
    META[id].w=w;META[id].l=l;
    META[id].pct=(w+l)?w/(w+l):0;
    if(s.conference==='East'||s.conference==='West')META[id].c=s.conference;
    rows.push({id,w,l,pct:META[id].pct});
  });
  rows.sort((a,b)=>b.w-a.w||b.pct-a.pct||a.l-b.l||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
  rows.forEach((row,i)=>META[row.id].wr=i+1);
  if(rows.length&&window.FBN)FBN.REC_SRC=(data&&data.season)||'2025-26';
  return rows.length;
}
function applyStoopids(data){
  const META=(window.TEAMS_DATA&&TEAMS_DATA.meta)||{};
  const pts=(data&&data.pts)||{};
  const ranks=(data&&data.ranks)||{};
  let n=0;
  const ids=new Set([].concat(Object.keys(ranks),Object.keys(pts)));
  ids.forEach(id=>{
    if(!META[id])return;
    if(ranks[id]!=null)META[id].sr=+ranks[id];
    if(pts[id]!=null)META[id].sp=+pts[id];
    n++;
  });
  if(data&&window.FBN){
    if(data.note)FBN.STOOP_NOTE=data.note;
  }
  return n;
}
window.FBNApplyPower=applyPower;
window.FBNApplyStandings=applyStandings;
window.FBNApplyStoopids=applyStoopids;
if(window.HOOPS_POWER)applyPower(window.HOOPS_POWER);
else fallbackNote();
if(window.HOOPS_STANDINGS)applyStandings(window.HOOPS_STANDINGS);
if(window.HOOPS_STOOPIDS)applyStoopids(window.HOOPS_STOOPIDS);
const b=window.FBN_BUILD||'';
const q='?b='+encodeURIComponent(b);
function get(url){return fetch(url+q,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)}
Promise.all([
  get('data/power.json').then(d=>{if(d)applyPower(d);else fallbackNote()}),
  get('data/last_season.json').then(d=>{if(d)applyStandings(d)}),
  get('data/stoopids.json').then(d=>{if(d)applyStoopids(d)})
]).then(ping);
})();
