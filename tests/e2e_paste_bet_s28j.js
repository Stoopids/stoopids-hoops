/* s28j 'Paste a bet' (spec /workspace/s28j-paste-bet-spec.md) + 'Posted by' on every placed bet, at 390 and 1280:
   example line fills both managers, 2-1, Duke +4 and the Duke v Virginia game; summary line exact; missing amount -> inline ask + Confirm disabled; nothing saved before Confirm;
   Confirm places via the normal save path; unknown name asks; garbage -> "Couldn't read that" and the form still works; a bet posted by a manager not in it shows 'Posted by X · time'.
   APP=... API=... node tests/e2e_paste_bet_s28j.js   (SHOTS=dir -> paste-<step>-<w>.png) */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');const F=require('../js/core.js');
const SH=process.env.SHOTS||'';const API=L.API;
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const DUKE='150',UVA='258';
const rest=TD.teams.map(t=>t[0]).filter(t=>t!==DUKE&&t!==UVA);
const NAMES=[['Ken','Kings','🏀'],['Paul','Pirates','🔥'],['Ana','Aces','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];
const R=[DUKE,...rest.slice(0,7),UVA,...rest.slice(7,62)];const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));
const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');const now=Date.now();
const GAMES=[{id:'dv1',day:'2000-01-01',start:iso(now+864e5),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:UVA,score:null,seed:null},away:{id:DUKE,score:null,seed:null}}];
async function open(id,info,w,mi){const P=await L.phone('pz'+w+Math.random().toString(36).slice(2,5),{desktop:w>=760,w,h:900,tz:'Asia/Jakarta'});
  await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[mi].id,k:info.managers[mi].k});
  await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);P.posts=[];
  P.page.on('request',r=>{const u=new URL(r.url());if(r.method()!=='GET'&&/\/api\/data\//.test(u.pathname))P.posts.push(decodeURIComponent(u.pathname));if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});
    else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
  await P.go('league.html?l='+id+'#bets');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await P.page.waitForSelector('#b27PzT',{timeout:20000});await sleep(500);return P}
const paste=async(P,t)=>{await P.page.$eval('#b27PzT',e=>{e.value=''});await P.page.type('#b27PzT',t);await P.page.click('#b27PzRead');await sleep(400)};
const st=P=>P.page.evaluate(()=>{const q=s=>document.querySelector(s);return{sum:(q('#b27PzSum')||{}).innerText||'',game:(q('#b27PzGame')||{}).innerText||'',bad:(q('#b27PzBad')||{}).innerText||'',okDis:q('#b27PzOk')?q('#b27PzOk').disabled:null,
  asks:[...document.querySelectorAll('[data-pzq]')].map(e=>e.dataset.pzq),text:(q('#b27Text')||{}).value,opp:[...document.querySelectorAll('[data-lb=opp][aria-pressed=true]')].map(e=>e.innerText.trim()),odds:[...document.querySelectorAll('[data-lb=odds][aria-pressed=true]')].map(e=>e.dataset.v),
  form:!!q('#b27Form')&&!!q('#b27Place')&&!!q('#b27Text'),sw:document.documentElement.scrollWidth,iw:innerWidth}});
const shot=async(P,nm)=>{if(SH)await P.page.screenshot({path:path.join(SH,nm+'.png'),clip:await P.page.$eval('#b27Form',e=>{const r=e.getBoundingClientRect();return{x:0,y:Math.max(0,r.top+scrollY-8),width:innerWidth,height:Math.min(900,r.height+16)}})})};
const logOf=async(id,mid)=>{try{const r=await fetch(API+encodeURIComponent(F.Keys(id).base+'-bets-'+mid));if(!r.ok)return[];const j=JSON.parse(await r.text());return(j&&j.ev)||[]}catch(e){return[]}};
(async()=>{try{
  for(const w of [390,1280]){const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;const M=info.managers.map(m=>m.id);
    const P=await open(id,info,w,0);
    await paste(P,'ken v paul 2-1 odds, duke +4 v Virginia');let s=await st(P);await shot(P,'paste-example-'+w);
    ok(w+'px example: summary exactly "Ken bets Paul: Duke +4 vs Virginia, 2-1"',s.sum==='Ken bets Paul: Duke +4 vs Virginia, 2-1',s);
    ok(w+'px example: form filled (Paul selected, odds 2-1, bet text "Duke +4 vs Virginia")',s.opp.length===1&&/Paul/.test(s.opp[0])&&s.odds.join()==='2-1'&&s.text==='Duke +4 vs Virginia',s);
    ok(w+'px example: matched the Duke v Virginia game',/Duke/.test(s.game)&&/Virginia/.test(s.game)&&!/Couldn/.test(s.game),s.game);
    ok(w+'px example: amount not in the line -> inline Amount ask only, Confirm disabled',s.asks.join()==='amt'&&s.okDis===true,s);
    ok(w+'px nothing saved before Confirm (no POST, empty log)',!P.posts.length&&!(await logOf(id,M[0])).length,P.posts);
    await P.page.$eval('[data-lb=pzamt][data-v="10"]',e=>e.scrollIntoView({block:'center'}));await sleep(150);await P.page.click('[data-lb=pzamt][data-v="10"]');await sleep(300);s=await st(P);
    ok(w+'px amount answered -> summary adds it, Confirm enabled',s.sum==='Ken bets Paul: Duke +4 vs Virginia, 2-1, 10 pushups'&&s.okDis===false&&!s.asks.length,s);
    ok(w+'px still nothing saved before Confirm',!P.posts.length,P.posts);
    await P.page.$eval('#b27PzOk',e=>e.scrollIntoView({block:'center'}));await sleep(150);await P.page.click('#b27PzOk');await P.page.waitForFunction('/Placed!/.test((document.getElementById("b27Msg")||{}).innerText||"")',{timeout:12000});
    {const ev=await logOf(id,M[0]);const p=ev.find(e=>e.k==='p');ok(w+'px Confirm saved ONE bet through the normal path: to Paul, 10, 2-1, text, claim plus, postedBy Ken + postedAt',ev.length===1&&p&&p.to===M[1]&&p.amt===10&&p.a===2&&p.b===1&&p.text==='Duke +4 vs Virginia'&&p.c&&p.c.op==='plus'&&p.c.a===DUKE&&p.postedBy===M[0]&&p.postedAt>now-6e5&&!p.for,ev)}
    {const c=await P.page.evaluate(()=>{const c=document.querySelector('.b27-c[data-bet]:not(.b27-pool)');return c?{t:c.innerText,p:(c.querySelector('.b27-posted')||{}).innerText||''}:null});ok(w+'px bet card shows "Posted by Ken · <time>"',c&&/^Posted by Ken · \w{3} \d{1,2}, \d{1,2}:\d{2} [AP]M$/.test(c.p),c)}
    await shot(P,'paste-placed-'+w);
    /* unknown name */
    await paste(P,'ken v zed 2-1, duke +4 v virginia');s=await st(P);ok(w+'px unknown name "zed" -> asks who (quick buttons), Confirm disabled',s.asks.includes('b')&&s.okDis===true&&/Who is “zed”/.test(await P.page.$eval('[data-pzq=b]',e=>e.innerText)),s);
    await shot(P,'paste-unknown-'+w);
    /* garbage */
    await paste(P,'lol what ??? 🤷');s=await st(P);ok(w+'px garbage -> "Couldn’t read that" note, no Confirm, form intact, no overflow',/Couldn’t read that/.test(s.bad)&&s.okDis===null&&s.form&&s.sw<=s.iw,s);
    await shot(P,'paste-garbage-'+w);
    await paste(P,'paul evens, duke beats virginia');s=await st(P);ok(w+'px one name = the opponent, the device manager bets: "Ken bets Paul: Duke beats Virginia, evens"',s.sum==='Ken bets Paul: Duke beats Virginia, evens'&&s.asks.join()==='amt',s);
    ok(w+'px no extra save from the unknown / garbage pastes',(await logOf(id,M[0])).length===1);
    await P.close();
    /* posted by a manager not in the bet: Ana posts Ken v Paul */
    const A=await open(id,info,w,2);await paste(A,'ken v paul evens for 20, duke +4 v virginia');s=await st(A);
    ok(w+'px Ana pastes Ken v Paul evens for 20: summary "Ken bets Paul: Duke +4 vs Virginia, evens, 20 pushups", Confirm enabled',s.sum==='Ken bets Paul: Duke +4 vs Virginia, evens, 20 pushups'&&s.okDis===false,s);
    await A.page.$eval('#b27PzOk',e=>e.scrollIntoView({block:'center'}));await sleep(150);await A.page.click('#b27PzOk');await A.page.waitForFunction('/Placed!/.test((document.getElementById("b27Msg")||{}).innerText||"")',{timeout:12000});await sleep(300);
    {const ev=await logOf(id,M[2]);const p=ev.find(e=>e.k==='p');ok(w+'px saved in Ana\'s log: for Ken, to Paul, postedBy Ana',p&&p.for===M[0]&&p.to===M[1]&&p.postedBy===M[2]&&p.a===1&&p.b===1&&p.amt===20,ev)}
    {const c=await A.page.evaluate(()=>{const c=[...document.querySelectorAll('.b27-c[data-bet]:not(.b27-pool)')].find(x=>/Posted by Ana/.test(x.innerText));return c?{t:c.innerText,p:c.querySelector('.b27-posted').innerText,m:(c.querySelector('.b27-m')||{}).innerText}:null});
      ok(w+'px card: bettors Ken vs Paul, separate "Posted by Ana · <time>" line',c&&/^Posted by Ana · \w{3} \d{1,2}, \d{1,2}:\d{2} [AP]M$/.test(c.p)&&/Ken|Kings/.test(c.m)&&/Paul|Pirates/.test(c.m)&&!/Ana|Aces/.test(c.m),c)}
    if(SH)await A.page.screenshot({path:path.join(SH,'posted-by-'+w+'.png'),fullPage:false});await A.close();
    /* Ken sees it and must accept; Paul too; then it is open */
    const K=await open(id,info,w,0);{const t=await K.page.evaluate(()=>{const c=[...document.querySelectorAll('.b27-c[data-bet]')].find(x=>/Posted by Ana/.test(x.innerText));return c?{t:c.innerText,acc:!!c.querySelector('[data-lb=accept]')}:null});ok(w+'px Ken (bettor A, not the poster) is asked to accept the posted bet',t&&t.acc&&/Ana posted this bet for Ken and Paul/.test(t.t),t)}
    await K.close()}
  /* view-only: no paste box */
  {const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const P=await L.phone('pzv',{w:390});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id+'&view=1#bets');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(1500);
    ok('view-only: no Paste a bet box',!(await P.page.$('#b27PzT')));await P.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
