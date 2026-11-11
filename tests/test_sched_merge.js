/* Unit test: schedule merge upgrades stale non-final scores.json games and adds missing ones.
   File finals still win. node tests/test_sched_merge.js */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/league-sched.js'),'utf8');
const ctx={window:{},console,Date,Math,Object,Array,Set,Map,JSON,isNaN,parseInt,parseFloat,String,Number,Boolean};
ctx.window=ctx;ctx.globalThis=ctx;
ctx.S25={etDay:ms=>{const d=new Date(ms);const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day}};
ctx.LTIME={dayKey:ms=>ctx.S25.etDay(ms)};
vm.runInNewContext(src,ctx,{filename:'league-sched.js'});
const L=ctx.window.LSCHED;
if(!L){console.log('FAIL no LSCHED');process.exit(1)}
let n=0,bad=0;
function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name,x!=null?x:'')}}
const fileG=(o)=>Object.assign({kind:'reg',round:'',neutral:false,home:{id:'18',score:null,seed:null,short:'NY'},away:{id:'15',score:null,seed:null,short:'MIL'}},o);
const schedG=(o)=>Object.assign({kind:'reg',round:'',neutral:false,home:{id:'18',score:null,seed:null,short:'NY'},away:{id:'15',score:null,seed:null,short:'MIL'}},o);
L.init({ids:()=>['18','25'],enabled:()=>true});
L.state.cache['18']=[
  schedG({id:'401909960',day:'2026-11-10',start:'2026-11-11T00:30Z',status:'final',home:{id:'18',score:110,seed:null,short:'NY'},away:{id:'15',score:99,seed:null,short:'MIL'}}),
  schedG({id:'401909967',day:'2026-11-11',start:'2026-11-12T00:00Z',status:'scheduled',home:{id:'18',score:null,seed:null,short:'NY'},away:{id:'5',score:null,seed:null,short:'CLE'}})
];
L.state.cache['25']=[
  schedG({id:'401909975',day:'2026-11-11',start:'2026-11-12T03:00Z',status:'scheduled',home:{id:'22',score:null,seed:null,short:'POR'},away:{id:'25',score:null,seed:null,short:'OKC'}})
];
const SC={format:1,sample:false,season:'2026-27',as_of:'2026-11-10',games:[
  fileG({id:'401909960',day:'2026-11-11',start:'2026-11-11T00:30Z',status:'scheduled'}),
  fileG({id:'401909959',day:'2026-11-10',start:'2026-11-10T03:00Z',status:'live',home:{id:'9',score:106,seed:null,short:'GS'},away:{id:'3',score:63,seed:null,short:'NO'}})
]};
// also a published final that the schedule tries to change
L.state.cache['18'].push(schedG({id:'oldfinal',day:'2026-11-08',start:'2026-11-09T00:00Z',status:'scheduled',home:{id:'18',score:null,seed:null,short:'NY'},away:{id:'2',score:null,seed:null,short:'BOS'}}));
SC.games.push(fileG({id:'oldfinal',day:'2026-11-08',start:'2026-11-09T00:00Z',status:'final',home:{id:'18',score:88,seed:null,short:'NY'},away:{id:'2',score:80,seed:null,short:'BOS'}}));
const M=L.merge(SC);
const by=id=>M.games.find(g=>g.id===id);
ok('stale scheduled game is upgraded to final with scores',by('401909960').status==='final'&&by('401909960').home.score===110&&by('401909960').away.score===99);
ok('tonight CLE @ NY is added',!!by('401909967')&&by('401909967').status==='scheduled');
ok('tonight OKC @ POR is added',!!by('401909975'));
ok('published final is not overwritten by a scheduled schedule copy',by('oldfinal').status==='final'&&by('oldfinal').home.score===88);
ok('unrelated stale live with no schedule match is kept',by('401909959').status==='live');
console.log((n-bad)+' / '+n+' checks passed');
process.exit(bad?1:0);
