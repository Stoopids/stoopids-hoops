/* sh6f: NBA divisions in the Teams filter and team subtitles (unit). */
global.window=global;require('../assets/teams.js');const F=require('../js/core.js');const D=window.TEAMS_DATA;
let n=0,bad=0;const ok=(t,c,x)=>{n++;if(c)console.log('ok   '+t);else{bad++;console.log('FAIL '+t,x===undefined?'':JSON.stringify(x))}};
const want={Atlantic:'BKN BOS NYK PHI TOR',Central:'CHI CLE DET IND MIL',Southeast:'ATL CHA MIA ORL WAS',Northwest:'DEN MIN OKC POR UTA',Pacific:'GSW LAC LAL PHX SAC',Southwest:'DAL HOU MEM NOP SAS'};
const ab={};D.teams.forEach(t=>ab[t[0]]=t[3]);const ids=Object.keys(ab);
const list=F.confFilterList(D.meta,ids);ok('filter list = East, West, then the 6 divisions',JSON.stringify(list)===JSON.stringify(['East','West','Atlantic','Central','Southeast','Northwest','Pacific','Southwest']),list);
for(const dv in want){const got=ids.filter(t=>F.confMatch(D.meta[t],dv)).map(t=>ab[t]).sort().join(' ');ok(dv+' = '+want[dv],got===want[dv],got)}
ok('East filter = 15 teams, West = 15',ids.filter(t=>F.confMatch(D.meta[t],'East')).length===15&&ids.filter(t=>F.confMatch(D.meta[t],'West')).length===15);
const okc=ids.find(t=>ab[t]==='OKC');ok("OKC subtitle 'West · Northwest'",F.confSub(D.meta[okc])==='West · Northwest',F.confSub(D.meta[okc]));
ok('no filter matches all',ids.every(t=>F.confMatch(D.meta[t],'')));
const room=require('fs').readFileSync(__dirname+'/../js/room.js','utf8');ok('room uses the shared filter list, match and subtitle',/F\.confFilterList\(META,POOL\)/.test(room)&&/F\.confMatch\(META\[t\],TF\.conf\)/.test(room)&&/F\.confSub\(m\)/.test(room));
console.log(bad?bad+' failed':n+' passed, 0 failed');process.exit(bad?1:0);
