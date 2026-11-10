/* s28j #19: ACCEPT_FLOW off (League default) = STOOPIDS: a placed bet is Open at once, no Accept/Decline/Waiting, no "Waiting on me"; the SAME stored pending event shows Waiting + Accept with the flag on (preview build). */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');const F=require('../js/core.js');
const SH=process.env.SHOTS||'';const API=L.API;
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const DUKE='150',UVA='258';
const rest=TD.teams.map(t=>t[0]).filter(t=>t!==DUKE&&t!==UVA);
const NAMES=[['Ken','Kings','🏀'],['Paul','Pirates','🔥'],['Ana','Aces','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];
const R=[DUKE,...rest.slice(0,7),UVA,...rest.slice(7,62)];const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));
const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');const now=Date.now();
const GAMES=[{id:'dv1',day:'2000-01-01',start:iso(now+864e5),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:UVA,score:null,seed:null},away:{id:DUKE,score:null,seed:null}}];
async function open(id,info,w,mi){const P=await L.phone('pz'+w+Math.random().toString(36).slice(2,5),{desktop:w>=760,w,h:900,tz:'Asia/Jakarta',acceptFlow:!!open.af});
  await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[mi].id,k:info.managers[mi].k});
  await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);P.posts=[];
  P.page.on('request',r=>{const u=new URL(r.url());if(r.method()!=='GET'&&/\/api\/data\//.test(u.pathname))P.posts.push(decodeURIComponent(u.pathname));if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});
    else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
  await P.go('league.html?l='+id+'#bets');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await P.page.waitForSelector('#b27PzT',{timeout:20000});await sleep(500);return P}
const paste=async(P,t)=>{await P.page.$eval('#b27PzT',e=>{e.value=''});await P.page.type('#b27PzT',t);await P.page.click('#b27PzRead');await sleep(400)};
const logOf=async(id,mid)=>{try{const r=await fetch(API+encodeURIComponent(F.Keys(id).base+'-bets-'+mid));if(!r.ok)return[];const j=JSON.parse(await r.text());return(j&&j.ev)||[]}catch(e){return[]}};
const view=P=>P.page.evaluate(()=>{const c=[...document.querySelectorAll('.b27-c[data-bet]:not(.b27-pool)')][0];return c?{t:c.innerText,acc:!!c.querySelector('[data-lb=accept],[data-lb=decline]'),wait:/Waiting/.test(c.innerText),open:/\bOpen\b/.test(c.innerText),
  waitOpt:!!document.querySelector('option[value=waiting]')}:null});
(async()=>{try{const w=390;const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;const M=info.managers.map(m=>m.id);
  open.af=false;const K=await open(id,info,w,0);await paste(K,'ken v paul 2-1 odds, duke +4 v Virginia');await K.page.$eval('[data-lb=pzamt][data-v="10"]',e=>e.scrollIntoView({block:'center'}));await sleep(150);await K.page.click('[data-lb=pzamt][data-v="10"]');await sleep(300);
  await K.page.$eval('#b27PzOk',e=>e.scrollIntoView({block:'center'}));await sleep(150);await K.page.click('#b27PzOk');await K.page.waitForFunction('/Placed!/.test((document.getElementById("b27Msg")||{}).innerText||"")',{timeout:12000}).catch(async()=>{console.log('DBG',await K.page.evaluate(()=>[(document.getElementById('b27Msg')||{}).innerText,(document.getElementById('b27PzSum')||{}).innerText,(document.getElementById('b27PzOk')||{}).disabled].join(' | ')))});
  const msg=await K.page.$eval('#b27Msg',e=>e.innerText);ok('flag off: placed message says open (no "waiting")',/open between/.test(msg)&&!/waiting/i.test(msg),msg);
  let v=await view(K);ok('flag off: the new bet is Open immediately for the poster, no Waiting',v&&v.open&&!v.wait,v);
  {const ev=await logOf(id,M[0]);const p=ev.find(e=>e.k==='p');ok('stored event is the normal propose (to Paul, postedBy Ken + postedAt), nothing rewritten',ev.length===1&&p&&p.to===M[1]&&p.postedBy===M[0]&&p.postedAt>0,ev)}
  await K.close();
  const P=await open(id,info,w,1);v=await view(P);ok('flag off: Paul sees it Open, no Accept/Decline, no "Waiting on me" filter',v&&v.open&&!v.acc&&!v.wait&&!v.waitOpt,v);await P.close();
  open.af=true;const Q=await open(id,info,w,1);v=await view(Q);ok('flag on (preview build): the same stored bet is Waiting with Accept/Decline for Paul (flow unchanged)',v&&v.wait&&v.acc&&v.waitOpt,v);await Q.close();
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
