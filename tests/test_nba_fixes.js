/* Unit checks for sh5 bug fixes: tagline count, 5/6-manager power recap, past-games day sort, NBA ESPN URLs, no NCAA AP request. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const F=require('../js/core.js');
const root=path.resolve(__dirname,'..');
let n=0,bad=0;
function ok(name,cond,extra){n++;if(cond)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name,extra!==undefined?String(extra).slice(0,400):'')}}

ok('tagline for 5 managers keeps the same style',F.leagueTagline(5)==="5 managers. One season. Let's play.");
ok('tagline for 6 managers keeps the same style',F.leagueTagline(6)==="6 managers. One season. Let's play.");
ok('tagline falls back to 5 when count is missing or not 6',F.leagueTagline()==="5 managers. One season. Let's play."&&F.leagueTagline(8)==="5 managers. One season. Let's play.");

const past=F.sortGamesList([
  {id:1,day:'2026-05-01',start:'2026-05-01T00:00:00Z'},
  {id:2,day:'2026-04-30',start:'2026-04-30T02:00:00Z'},
  {id:3,day:'2026-05-01',start:'2026-05-01T03:00:00Z'},
  {id:4,day:'2026-05-03',start:'2026-05-03T00:00:00Z'}
],{mode:'scores',key:g=>g.day,start:g=>g.start});
const pastDays=[...new Set(past.map(g=>g.day))];
ok('past games newest day first, days grouped (no repeats)',pastDays.join()==='2026-05-03,2026-05-01,2026-04-30'&&past.filter(g=>g.day==='2026-05-01').map(g=>g.id).join()==='3,1',pastDays+' '+past.map(g=>g.id));

const up=F.sortGamesList([
  {id:1,day:'2026-11-12',start:'2026-11-12T01:00:00Z'},
  {id:2,day:'2026-11-10',start:'2026-11-10T03:00:00Z'},
  {id:3,day:'2026-11-10',start:'2026-11-10T01:00:00Z'}
],{mode:'upcoming',key:g=>g.day,start:g=>g.start});
ok('upcoming games chronological by day then start',up.map(g=>g.id).join()==='3,2,1',up.map(g=>g.id));

ok('F.espnUrl points at NBA team pages',F.espnUrl('25')==='https://www.espn.com/nba/team/_/id/25'&&F.espnUrl('abc')===null&&F.espnUrl(25)===null);
const pr=fs.readFileSync(path.join(root,'js/power-render.js'),'utf8');
// sh24: js/leaguehome.js deleted (dead file, no page loaded it); its ESPN-link check is gone with it
const ld=fs.readFileSync(path.join(root,'js/league-d.js'),'utf8');
ok('power-render fallback ESPN links are NBA, not college',/https:\/\/www\.espn\.com\/nba\/team\/_\/id\/'/.test(pr)&&!/mens-college-basketball\/team/.test(pr));
ok('league-d.js does not request NCAA AP rankings',!/mens-college-basketball\/rankings/.test(ld)&&!/site\.api\.espn\.com\/apis\/site\/v2\/sports\/basketball\/mens-college-basketball/.test(ld));

const _ts=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');
const TD=JSON.parse(_ts.slice(_ts.indexOf('{'),_ts.lastIndexOf('}')+1));
const teams={};TD.teams.forEach(r=>{teams[r[0]]={id:r[0],espn_id:r[0],name:r[1],short:r[2]}});
function loadGen(){
  const ctx={console,TEAMS_DATA:TD,FBN:F};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/power-gen.js'),'utf8'),ctx);
  return ctx.FBNPowerGen;
}
const Gen=loadGen();
function league(nMgr){
  const rounds=Math.floor(30/nMgr);
  const managers=Array.from({length:nMgr},(_,i)=>({mid:'m'+i,name:'Mgr'+i,team:'Team'+i}));
  const tids=TD.teams.map(t=>String(t[0]));
  const picks=[];let n=0;
  for(let r=0;r<rounds;r++){
    const row=r%2===0?managers:managers.slice().reverse();
    for(const m of row){picks.push({n:++n,owner:m.mid,tid:tids[n-1]})}
  }
  return {managers,picks,teams,meta:TD.meta};
}
let threw=null,rows5=null;
try{rows5=Gen.generate(league(5))}catch(e){threw=e}
ok('power-gen returns 5 rows for a 5-manager draft and does not throw',!threw&&rows5&&rows5.length===5&&rows5.every((r,i)=>r.rank===i+1&&r.generated&&r.schools.length===6),threw|| (rows5&&rows5.length));
let rows6=null;threw=null;
try{rows6=Gen.generate(league(6))}catch(e){threw=e}
ok('power-gen returns 6 rows for a 6-manager draft and does not throw',!threw&&rows6&&rows6.length===6&&rows6.every(r=>r.schools.length===5),threw||(rows6&&rows6.length));
ok('power-gen recap text uses the actual manager count',rows5&&rows5.every(r=>/\b5\b/.test(r.short+r.recap)&&!/\b8 rosters\b/.test(r.short+r.recap)),rows5&&rows5[0]&&(rows5[0].short+' '+rows5[0].recap).slice(0,200));
ok('power-gen rejects 4 or 8 managers',Gen.generate(league(4))==null&&Gen.generate(league(8))==null);

console.log(bad?'FAILED '+bad+'/'+n:'All '+n+' checks passed');
process.exit(bad?1:0);
