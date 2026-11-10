/* Unit checks for Stoopids Hoops draft-room sorts (30 NBA teams). */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const F=require('../js/core.js');
const src=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');
const D=JSON.parse(src.slice(src.indexOf('{'),src.lastIndexOf('}')+1));
const TEAMS={},POOL=[];D.teams.forEach(r=>{TEAMS[r[0]]={espn_id:r[0],name:r[1],short:r[2],abbr:r[3],mascot:r[7]};POOL.push(String(r[0]))});
const META=D.meta||{};
let n=0,bad=0;
function t(m,c,x){n++;if(c)console.log('ok   '+m);else{bad++;console.log('FAIL '+m+(x!==undefined?' -> '+JSON.stringify(x).slice(0,300):''))}}

const modes=Object.fromEntries(F.TMODES);
t('TMODES has Power Ranking, Stoopids Rank, Win rank; no Win % / Last season',
  modes.kenpom==='Power Ranking'&&modes.stoopid==='Stoopids Rank'&&modes.power==='Win rank'&&!modes.record&&F.TMODES.length===6,modes);
t('default-ish first TMODE is Power Ranking',F.TMODES[0][0]==='kenpom'&&F.TMODES[0][1]==='Power Ranking');
t('30 NBA teams',POOL.length===30,POOL.length);
t('conferences are only East/West',[...new Set(Object.values(META).map(m=>m.c))].sort().join()==='East,West');
t('5 BPI tiers of 6',F.TIERS.length===5&&F.TIERS.every((x,i)=>x.max===(i+1)*6));
t('tierOf(1)=Elite, tierOf(25)=Longshot, tierOf(0)=Unranked',
  F.tierOf(1).label==='Elite'&&F.tierOf(7).label==='Contender'&&F.tierOf(25).label==='Longshot'&&F.tierOf(0).label==='Unranked');

const ids=mode=>F.teamView({teams:TEAMS,meta:META,pool:POOL,mode}).flatMap(g=>g.tids);
t('every mode lists each of 30 once',F.TMODES.every(([m])=>{const a=ids(m);return a.length===30&&new Set(a).size===30}));

const pr=ids('kenpom');
t('Power Ranking is ascending BPI / meta.o',pr.every((id,i,a)=>!i||(META[a[i-1]].o||99)<=(META[id].o||99)),pr.slice(0,5).map(id=>[TEAMS[id].abbr,META[id].o]));

const wr=ids('power');
if(Object.values(META).some(m=>m.wr)){
  t('Win rank is ascending meta.wr (current season)',wr.every((id,i,a)=>!i||(META[a[i-1]].wr||99)<=(META[id].wr||99)),wr.slice(0,5).map(id=>[TEAMS[id].abbr,META[id].wr,META[id].r]));
}else t('Win rank present after standings bake (wr missing — refresh not applied yet?)',false);

const sr=ids('stoopid');
if(Object.values(META).some(m=>m.sp!=null)){
  t('Stoopids Rank is descending projected points',sr.every((id,i,a)=>!i||(META[a[i-1]].sp||0)>=(META[id].sp||0)),sr.slice(0,5).map(id=>[TEAMS[id].abbr,META[id].sp,META[id].sr]));
  t('Stoopids #1 matches highest pts',META[sr[0]].sr===1);
}else t('Stoopids points baked',false);

const az=ids('alpha');
t('A–Z follows full team name',az.every((id,i,a)=>!i||TEAMS[a[i-1]].name.localeCompare(TEAMS[id].name)<=0));

const cg=F.teamView({teams:TEAMS,meta:META,pool:POOL,mode:'conf'});
t('Conference groups are East then West',cg.map(g=>g.label).join()==='East,West'&&cg.every(g=>g.tids.length===15),cg.map(g=>[g.label,g.tids.length]));

const tg=F.teamView({teams:TEAMS,meta:META,pool:POOL,mode:'tiers'});
t('Tiers: 5 groups of 6',tg.length===5&&tg.every(g=>g.tids.length===6),tg.map(g=>[g.label,g.note,g.tids.length]));

const city=Object.values(TEAMS).find(x=>x.short&&x.short!==x.name.split(' ')[0])||TEAMS[pr[0]];
const q=city.short;
t('search matches city ('+q+')',F.teamView({teams:TEAMS,meta:META,pool:POOL,q}).flatMap(g=>g.tids).some(id=>TEAMS[id].short===q));

{const bare={};POOL.forEach(id=>{bare[id]={...META[id]};delete bare[id].sp;delete bare[id].sr});
 const fb=F.teamView({teams:TEAMS,meta:bare,pool:POOL,mode:'stoopid'}).flatMap(g=>g.tids);
 t('Stoopids Rank falls back to Power Ranking when projections are missing',JSON.stringify(fb)===JSON.stringify(pr),fb.slice(0,3));}

console.log((n-bad)+' passed, '+bad+' failed');
process.exit(bad?1:0);
