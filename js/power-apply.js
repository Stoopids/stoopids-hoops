/* Overlay ESPN BPI ranks from data/power.json onto TEAMS_DATA.meta (o + p).
   Auto-pick, mock bots (blendRank / autoRankOf), and league power rankings all read those fields.
   If the fetch fails or a team is missing, meta.o / meta.p already on teams.js are kept
   (baked BPI, or meta.f / the static 2024-25 win-rank fallback). */
(function(){
const SRC='ESPN BPI (2026-27)';
const FALLBACK='Prior-season win rank (fallback: static 2024-25 regular-season wins; ESPN BPI unavailable)';
function apply(data){
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
window.FBNApplyPower=apply;
if(window.HOOPS_POWER)apply(window.HOOPS_POWER);
else fallbackNote();
try{
  const b=window.FBN_BUILD||'';
  fetch('data/power.json?b='+encodeURIComponent(b),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d)apply(d)}).catch(()=>fallbackNote());
}catch(e){fallbackNote()}
})();
