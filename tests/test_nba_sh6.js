/* sh6: bot auto-pick delay, NBA personalities, empty-seat defaults, short season labels. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const F=require('../js/core.js');
const Bots=require('../js/mock-bots.js');
const src=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');
const D=JSON.parse(src.slice(src.indexOf('{'),src.lastIndexOf('}')+1));
const POOL=D.teams.map(r=>String(r[0]));
const META=D.meta||{};

let n=0,bad=0;
function t(m,c,x){n++;if(c)console.log('ok   '+m);else{bad++;console.log('FAIL '+m+(x!==undefined?' -> '+JSON.stringify(x).slice(0,400):''))}}

t('PRESET_MANAGERS is empty (no hardcoded league members)',Array.isArray(F.PRESET_MANAGERS)&&F.PRESET_MANAGERS.length===0,F.PRESET_MANAGERS);
const appJs=['js/core.js','js/setup.js','js/mock.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const banned=/Kentut|Kurmoji|Dirty Draymond|Cockchalkrock|Party Paul/;
t('setup/mock/core defaults no longer embed the old manager nicknames',!banned.test(appJs.replace(/==='Party Paul'/g,'').replace(/==='Paul'/g,'')));
t('placeholder name for an unnamed empty seat is Seat N',F.placeholderName({},'e1',2)==='Seat 2');

t('seasonShort turns 2025-26 into 25-26 and 2026-27 into 26-27',F.seasonShort('2025-26')==='25-26'&&F.seasonShort('2026-27')==='26-27'&&F.seasonShort('25-26')==='25-26');
t('recLabel is 64-18 (25-26)',F.recLabel('64-18','2025-26')==='64-18 (25-26)'&&F.recLabel('64-18')==='64-18 (25-26)');
t('recLabel empty is em dash',F.recLabel('')==='—'&&F.recLabel(null)==='—');
t('RANK_SRC uses short (26-27)',F.RANK_SRC==='ESPN BPI (26-27)');
t('REC_SRC stays canonical 2025-26 for data',F.REC_SRC==='2025-26');

t('expired auto-pick delay is 0',F.autoDelayMs('expired',true,0.5)==='0'||F.autoDelayMs('expired',true,0.5)===0);
t('human auto/away delay stays 2s',F.autoDelayMs('away',false)===2000&&F.autoDelayMs('auto',false)===2000);
t('bot delay is 1-3s from rnd (0 / 0.5 / 1)',F.autoDelayMs('away',true,0)===1000&&F.autoDelayMs('away',true,0.5)===2000&&F.autoDelayMs('away',true,1)===3000);
const d1=F.autoDelayMs('away',true,null,'mid-aaa'),d2=F.autoDelayMs('away',true,null,'mid-bbb'),d3=F.autoDelayMs('away',true,null,'mid-aaa');
t('bot delay without rnd is stable per mid and in 1000-3000ms',d1===d3&&d1>=1000&&d1<=3000&&d2>=1000&&d2<=3000, {d1,d2,d3});
const uniq=new Set(['a','b','c','d','e','f','g','h'].map(x=>F.autoDelayMs('away',true,null,'bot-'+x)));
t('bot delays vary across seats (not all identical)',uniq.size>=2, [...uniq]);
t('bot delay never equals a 60s clock',![d1,d2,F.autoDelayMs('away',true,1)].some(x=>x>=10000));

function stFor(owner,over){
  const order=[owner,'me','c','d','e'];
  const now=Date.now();
  const meta={id:'m',mock:true,status:'live',paused:false,startedAt:now,resumeAt:now,epoch:1,order,orderSet:true,over:over||{},voided:[],settings:{type:'snake',rounds:6,clockSecs:60,autoPick:true,managers:5}};
  const st=F.deriveState(meta,{},{},new Set(POOL));
  return st;
}
{const owner='bot1';const st=stFor(owner,{bot1:{bot:true,away:true}});
 t('autoReason is away when over.away is set',F.autoReason(st,Date.now(),0)==='away');
 const st2=stFor(owner,{bot1:{bot:true}});st2.away={};
 t('autoReason is away for a bot even if st.away was lost',F.autoReason(st2,Date.now()+1000,0)==='away',F.autoReason(st2,Date.now()+1000,0));
 const st3=stFor('me',{});
 t('a human on the clock is not auto-picked before the deadline',F.autoReason(st3,Date.now(),0)===null,F.autoReason(st3,Date.now(),0)+' dl='+st3.deadline);
}

t('NBA meta is detected for East/West',Bots.isNba(META)===true);
t('NBA big-conference lean is East or West',{}.toString&&['East','West'].includes(Bots.powerConfs(META)[0]),Bots.powerConfs(META));
const mids=['b1','b2','b3','b4'];
const dealt=Bots.deal('mocktest',mids);
t('deal assigns a known personality to each bot',mids.every(m=>Bots.BY[dealt[m]]),dealt);
Bots.PERSONALITIES.forEach(p=>{
  const missed=[];
  for(let r=1;r<=6;r++){
    const rng=Bots.mul(Bots.hash32('t:'+p.key+':'+r));
    const c=Bots.choose({key:p.key,avail:POOL.slice(),meta:META,round:r,mine:[],rng,mockId:'mocktest',mid:'botx'});
    if(!c||POOL.indexOf(String(c.tid))<0)missed.push({r,c});
  }
  t('NBA '+p.label+' choose() always returns a pool team',missed.length===0,missed);
});
{const taken=new Set([POOL[0],POOL[1]]);const avail=POOL.filter(t=>!taken.has(t));
 const c=Bots.choose({key:'power',avail,meta:META,round:1,mine:[],rng:()=>0.5,mockId:'x',mid:'y'});
 t('choose skips already-taken teams',c&&!taken.has(c.tid),c);
}

console.log((n-bad)+' passed, '+bad+' failed');
process.exit(bad?1:0);
