/* Node unit test: Paul's NBA rules vs the SYNTHETIC feasibility checks in /workspace/nba-feasibility. */
const S=require('../js/scoring.js');
const fs=require('fs');const path=require('path');
let n=0,bad=0;
function ok(name,cond,extra){n++;if(cond)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name,extra!==undefined?extra:'')}}
const rec=JSON.parse(fs.readFileSync('/workspace/nba-feasibility/SYNTHETIC_results.json','utf8'));
const nyk=S.scoreTeam(rec.team_records.NYK);
ok('NYK cup-champ path = 44',nyk.total===44,nyk);
const okc=S.scoreTeam(rec.team_records.OKC);
ok('OKC NBA-champ path = 56',okc.total===56,okc);
const atl=S.scoreTeam(rec.team_records.ATL);
ok('ATL play-in loser = 7, no entry',atl.total===7&&atl.playoff_entry_pts===0,atl);
ok('assumptions listed',Array.isArray(S.ASSUMPTIONS)&&S.ASSUMPTIONS.length>=5);

/* Replay demo games: one manager owns NYK only, one owns OKC only, one owns ATL only. */
const demo=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/demo/scores.json'),'utf8'));
const field=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/demo/tournament.json'),'utf8'));
ok('demo is clearly SYNTHETIC',demo.sample===true&&/^SYNTHETIC/.test(demo.label));
ok('shipped scores.json is not sample and has no games',(()=>{const s=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/scores.json'),'utf8'));return s.sample===false&&s.games.length===0})());
const mgrs=[{mid:'m1',name:'NYK owner'},{mid:'m2',name:'OKC owner'},{mid:'m3',name:'ATL owner'}];
const owners={'18':'m1','25':'m2','1':'m3'}; /* ESPN ids: NYK 18, OKC 25, ATL 1 */
const sea=S.fullSeason(demo.games,owners,mgrs);
const po=S.playoffs(demo.games,field.field,owners,mgrs,null,demo);
const cup=S.cupPoints(demo.games,field,owners,mgrs);
const tot=S.leagueTotals(sea,po,cup);
const by=Object.fromEntries(tot.map(r=>[r.mid,r]));
ok('demo NYK total 44',by.m1&&by.m1.total===44,by.m1&&by.m1.breakdown);
ok('demo OKC total 56',by.m2&&by.m2.total===56,by.m2&&by.m2.breakdown);
ok('demo ATL total 7 (no entry)',by.m3&&by.m3.total===7&&by.m3.breakdown.playoff_entry===0,by.m3&&by.m3.breakdown);
console.log(bad?'FAILED '+bad+'/'+n:'All '+n+' checks passed');
process.exit(bad?1:0);
