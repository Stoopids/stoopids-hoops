/* sh29 BUG-7: a bet that names an NBA team any common way finds its game. Node only, no network, no league data.
   node tests/bug7_teams.js */
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..');
const ctx={console,Intl,Date,window:{}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
for(const f of ['assets/teams.js','js/shared-s25.js','shared/ui.js'])vm.runInContext(fs.readFileSync(path.join(R,f),'utf8'),ctx,{filename:f});
const U=ctx.SHARED_UI,S25=ctx.S25,T=ctx.TEAMS_DATA.teams;let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const ESPN={'3':'NO','9':'GS','18':'NY','24':'SA','26':'UTAH','27':'WSH'};const code=t=>ESPN[t[0]]||t[3];
const NOW=Date.parse('2026-11-14T20:00:00Z');   // Nov 14, 3pm ET: before the 8pm ET Bulls v Timberwolves tip
const tip=(o)=>U.tipGame(Object.assign({now:NOW,today:S25.etDay(new Date(NOW)),dateFrom:S25.dateFrom,day:S25.etDay},o));
// Paul's case, shaped like data/scores.json (ESPN codes only on each side)
const chimin={id:'401909984',start:'2026-11-15T01:00Z',status:'scheduled',home:{id:'16',short:'MIN'},away:{id:'4',short:'CHI'}};
const other={id:'x2',start:'2026-11-15T00:30Z',status:'scheduled',home:{id:'5',short:'CLE'},away:{id:'6',short:'DAL'}};
const gs=[other,chimin];
const paul='Kurt: Minnesota Timberwolves and Chicago Bulls game: over 234.5 pts tonight.';
ok('Paul\'s text finds Bulls v Timberwolves',(tip({games:gs,text:paul})||{}).id==='401909984');
for(const t of ['Timberwolves vs Bulls over 230','Bulls ML','Minnesota -3','CHI +3 tonight','MIN v CHI','T-Wolves cover','Wolves win','Chicago and Minnesota over 234.5'])ok('finds it: '+t,(tip({games:gs,text:t})||{}).id==='401909984');
ok('a team not playing finds nothing',tip({games:gs,text:'Lakers win'})===null);
// the page itself shows the city as side.short (js/league-d.js shortOf): Chicago / Minnesota
const city=g=>Object.assign({},g,{home:Object.assign({},g.home,{short:T.find(t=>t[0]===g.home.id)[2]}),away:Object.assign({},g.away,{short:T.find(t=>t[0]===g.away.id)[2]})});
for(const t of ['Bulls ML','Timberwolves vs Bulls over 230','T-Wolves cover','CHI +3'])ok('page shape (city names) finds it: '+t,(tip({games:gs.map(city),text:t})||{}).id==='401909984');
ok('wrapped like the page games() list ({id,g,start,status})',(tip({games:gs.map(g=>({id:g.id,g,start:g.start,status:g.status})),text:paul})||{}).id==='401909984');
// every NBA team, every name: full, city (not "Los Angeles"), nickname, both abbreviations
const opp=T.find(t=>t[0]==='17');let miss=[];
for(const t of T){if(t[0]===opp[0])continue;const g={id:'g'+t[0],start:'2026-11-15T01:00Z',status:'scheduled',home:{id:t[0],short:code(t)},away:{id:opp[0],short:'BKN'}};
  const filler={id:'f',start:'2026-11-15T01:00Z',status:'scheduled',home:{id:'99',short:'ZZZ'},away:{id:'98',short:'YYY'}};
  const forms=[t[1],t[7],t[3],code(t)].concat(t[0]==='13'?[]:[t[2]]);
  for(const n of forms){if(String(n).length<3)continue;const r=tip({games:[filler,g],text:n+' win'});if(!r||r.id!==g.id)miss.push(t[1]+' as "'+n+'"')}}
ok('all 30 NBA teams match by full name, city, nickname and both abbreviations',miss.length===0,miss);
// Lakers v Clippers on one night: "Los Angeles Clippers" is the Clippers, not both
const lal={id:'lal',start:'2026-11-15T03:00Z',status:'scheduled',home:{id:'13',short:'LAL'},away:{id:'21',short:'PHX'}},lac={id:'lac',start:'2026-11-15T03:30Z',status:'scheduled',home:{id:'12',short:'LAC'},away:{id:'30',short:'CHA'}};
ok('"Los Angeles Clippers" -> the Clippers game',(tip({games:[lal,lac],text:'Los Angeles Clippers win'})||{}).id==='lac');
ok('"Los Angeles Lakers" -> the Lakers game',(tip({games:[lal,lac],text:'Los Angeles Lakers win'})||{}).id==='lal');
// started game: not a tipoff game, but {live:true} still finds it so the form can say it started
const late=Date.parse('2026-11-15T01:30Z');
ok('after tip, tipGame skips it (unchanged)',U.tipGame({games:gs,text:paul,now:late,day:S25.etDay})===null);
ok('after tip, {live:true} finds it',(U.tipGame({games:gs,text:paul,now:late,live:true,day:S25.etDay})||{}).id==='401909984');
console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0);
