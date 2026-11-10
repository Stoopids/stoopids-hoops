/* sh6f: practice-bot strategies (Power, Points, Proven, Division spread, Upside, Conference stack). */
const fs=require('fs'),path=require('path');
const Bots=require('../js/mock-bots.js');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');
const D=JSON.parse(src.slice(src.indexOf('{'),src.lastIndexOf('}')+1));
const POOL=D.teams.map(r=>String(r[0]));const META=JSON.parse(JSON.stringify(D.meta||{}));
const S=require('../data/stoopids.json');(S.teams||[]).forEach(x=>{const m=META[x.id];if(m){if(m.sp==null&&x.pts!=null)m.sp=+x.pts;m.pp=+x.p_playoff}});
let n=0,bad=0;function t(m,c,x){n++;if(c)console.log('ok   '+m);else{bad++;console.log('FAIL '+m+(x!==undefined?' -> '+JSON.stringify(x).slice(0,400):''))}}
const keys=Bots.PERSONALITIES.map(p=>p.key);
t('six strategies with the agreed labels',Bots.PERSONALITIES.map(p=>p.label).join(',')==='Power,Points,Proven,Division spread,Upside,Conference stack');
const z=()=>0;const pick=(key,avail,mine,mid)=>Bots.choose({key,avail:avail||POOL.slice(),meta:META,round:1,mine:mine||[],rng:z,mockId:'m1',mid:mid||'b'}).tid;
const best=f=>POOL.slice().sort((a,b)=>f(a)-f(b))[0];
t('Power takes the best BPI left',pick('power')===best(x=>+META[x].o),pick('power'));
t('Points takes the most projected points',pick('points')===best(x=>-META[x].sp),pick('points'));
t('Proven takes the best last-season record',pick('proven')===best(x=>+META[x].wr),pick('proven'));
{const own=pick('power');const d=META[own].d;const nx=pick('divspread',POOL.filter(x=>x!==own),[own]);t('Division spread avoids a division it already owns',META[nx].d!==d,{own,d,nx,nd:META[nx].d})}
{const u=pick('upside');t('Upside takes a BPI 11-20 team with a playoff chance',+META[u].o>=11&&+META[u].o<=20&&META[u].pp>0,{u,o:META[u].o,pp:META[u].pp})}
{const ok=['m1','m2','m3','m4'].every(mid=>{const c=Bots.stackConf('m1',mid);const ts=[];let av=POOL.slice();for(let i=0;i<4;i++){const p=Bots.choose({key:'confstack',avail:av,meta:META,round:1,mine:ts,rng:z,mockId:'m1',mid}).tid;ts.push(p);av=av.filter(x=>x!==p)}return ts.filter(x=>META[x].c===c).length>=3});
 t('Conference stack leans to its conference',ok)}
const firsts=new Set(keys.map(k=>pick(k)));t('strategies differ (first picks are not all the same)',firsts.size>=3,[...firsts]);
/* full drafts: 5 or 6 bots, snake, 30 teams, many seeds */
let dup=0,incomplete=0,distinctDeal=0,noiseVar=new Set();
for(let s=0;s<200;s++){const N=s%2?5:6;const mids=[...Array(N)].map((_,i)=>'bot'+i);const id='mock'+s;const dealt=Bots.deal(id,mids);
  if(new Set(Object.values(dealt)).size===N)distinctDeal++;
  let av=POOL.slice();const picks=[];const R=30/N;
  for(let r=0;r<R;r++)for(let k=0;k<N;k++){const mid=mids[r%2?N-1-k:k];const rng=Bots.mul(Bots.hash32(id+':'+picks.length));
    const c=Bots.choose({key:Bots.forBot(id,mid,dealt),avail:av,meta:META,round:r+1,mine:picks.filter(p=>p.mid===mid).map(p=>p.tid),rng,mockId:id,mid});
    if(!c||av.indexOf(c.tid)<0){dup++;continue}picks.push({mid,tid:c.tid});av=av.filter(x=>x!==c.tid)}
  if(picks.length!==30||new Set(picks.map(p=>p.tid)).size!==30)incomplete++;
  noiseVar.add(picks.slice(0,6).map(p=>p.tid).join(','));}
t('200 full drafts: no duplicate or invalid picks',dup===0,dup);
t('200 full drafts all complete (30 distinct teams)',incomplete===0,incomplete);
t('each mock deals distinct strategies to its bots',distinctDeal===200,distinctDeal);
t('random deal + noise vary the drafts (many different first rounds)',noiseVar.size>=50,noiseVar.size);
console.log((n-bad)+' passed, '+bad+' failed');process.exit(bad?1:0);
