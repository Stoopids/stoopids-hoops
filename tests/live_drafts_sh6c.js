/* sh6c: full test drafts with mixed options (practice mock.html and a real-league TEST draft), checked from the store:
   every pick made, right owner for the order, no duplicate team, human auto-picks = queue first else best Power Ranking (BPI).
   APP=https://stoopids.github.io/stoopids-hoops node tests/live_drafts_sh6c.js D1 [D2 ...]   (default APP = local mock_textdb on PORT)
   Real-league runs are named "TEST sh6c Dn" and every key they wrote (shoops1-<id>…) is blanked afterwards. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path');const fs=require('fs');
const F=require('../js/core.js');const DC=require('./nba_draftcheck.js');
const ROOT=path.resolve(__dirname,'..');const PORT=+process.env.PORT||8850;const LIVE=!!process.env.APP;const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const API=LIVE?'https://textdb.dev/api/data/':('http://127.0.0.1:'+PORT+'/api/data/');const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const SHOTS=process.env.SHOTS||'';const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const DESK={width:1280,height:860},MOB={width:390,height:844,isMobile:true,hasTouch:true};
/* human policies per round (index = round-1); last entry repeats. manual = Pick a team -> Teams tab -> 3rd row -> Draft it; auto = switch on; expire = switch off, clock runs out; queue+auto / queue+expire = queue a mid-ranked team first */
const RUNS={
 D1:{kind:'mock',managers:5,order:'snake',seat:1,clock:30,vp:DESK,human:['manual','queue+auto','expire','auto']},
 D2:{kind:'mock',managers:6,order:'straight',seat:6,clock:30,vp:MOB,human:['queue+expire','manual','auto']},
 D3:{kind:'mock',managers:5,order:'straight',seat:3,clock:30,vp:DESK,human:['auto']},
 D4:{kind:'league',managers:5,type:'snake',orderMode:'manual',clock:30,seats:[['manual','auto'],['auto'],['expire','auto'],['queue+auto'],['manual']],vps:[DESK,DESK,DESK,DESK,MOB]},
 D5:{kind:'league',managers:6,type:'linear',orderMode:'random',clock:30,seats:[['auto'],['queue+expire','auto'],['manual','expire','auto'],['auto'],['expire','manual','auto'],['queue+auto']],vps:[MOB,DESK,DESK,MOB,DESK,DESK]}};
let tot=0,bad=0;const fails=[];function ok(name,c,x){tot++;if(c)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,x!==undefined?String(x).slice(0,700):'')}}
function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error('mock timeout '+b)),8000)})}
async function newPage(browser,vp){const ctx=await browser.createBrowserContext();const p=await ctx.newPage();await p.setViewport(Object.assign({deviceScaleFactor:1},vp));await p.setBypassServiceWorker(true).catch(()=>{});
  if(!LIVE)await p.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.healthOn','1')}catch(e){}});
  p.on('pageerror',e=>console.log('   pageerror',String(e).slice(0,160)));p.on('dialog',d=>d.accept().catch(()=>{}));return {ctx,p}}
const st=p=>p.evaluate(()=>{try{const F=window.FBN;const b=document.body.innerText;return{href:location.href,picks:document.querySelectorAll('.board .chip').length,txt:b.slice(0,0)}}catch(e){return{}}}).catch(()=>({}));
/* the page's own view of the draft (shared Store + FBN), cheap: meta + count of picks via the board isn't reliable off the Board tab, so read the store */
async function onClock(p){return p.evaluate(async()=>{const F=window.FBN;const l=new URLSearchParams(location.search).get('l');if(!l||!window.Store)return null;const K=F.Keys(l);const m=F.parseJ(await Store.get(K.meta));if(!m||m.status==='lobby')return{status:m&&m.status};
  let n=1;const tot=m.order.length*m.settings.rounds;for(;n<=tot;n++){const e=F.parseEntry(await Store.get(K.pick(m.epoch,n)).catch(()=>''));if(!e)break}
  const me=(()=>{try{return JSON.parse(localStorage.getItem('shoops.me.'+l)||'{}').mid}catch(e){return null}})();const s=n<=tot?F.slotAt(m.order,n,m.settings.type,m.settings.rounds):null;
  return{status:m.status,type:m.settings.type,n,tot,owner:s&&s.owner,round:s&&s.round,me,order:m.order}}).catch(()=>null)}
const setAuto=(p,on)=>p.evaluate(on=>{const e=document.querySelector('#autotog')||document.querySelector('#autodraft');if(!e)return false;if(e.checked!==on)e.click();return true},on).catch(()=>false);
async function queueTeam(p,rank){/* queue the team at BPI rank `rank` (or the next one still free) */
  await p.evaluate(()=>{const t=document.querySelector('[data-a=tab][data-t=teams],[data-t=teams]');if(t)t.click()});await p.waitForSelector('[data-a=q]',{timeout:20000}).catch(()=>{});
  const tid=await p.evaluate(rank=>{const M=(window.TEAMS_DATA||{}).meta||{};const btns=[...document.querySelectorAll('[data-a=q]')].map(b=>b.dataset.t);const c=btns.filter(t=>(+((M[t]||{}).o)||99)>=rank).sort((a,b)=>M[a].o-M[b].o)[0];
    const b=c&&document.querySelector('[data-a=q][data-t="'+c+'"]');if(b&&!b.classList.contains('on'))b.click();return c},rank);
  await sleep(1500);return tid}
async function manualPick(p,shot){/* the real flow: Pick a team button -> Teams tab -> tap the 3rd team -> Draft it */
  await p.waitForSelector('#pickbtn',{visible:true,timeout:60000});await p.click('#pickbtn');await p.waitForSelector('[data-a=draftrow]',{timeout:15000});await sleep(600);
  const r=await p.evaluate(()=>({tab:document.body.dataset.tab,popup:!!document.getElementById('pickov'),sort:(document.querySelector('[data-a=tsort].on')||{}).innerText||''}));
  if(shot)await p.screenshot({path:shot}).catch(()=>{});
  const tid=await p.evaluate(()=>{const rows=[...document.querySelectorAll('[data-a=draftrow]')];const b=rows[Math.min(2,rows.length-1)];b.scrollIntoView({block:'center'});b.click();return b.dataset.t});
  await p.waitForSelector('#confirmpick',{timeout:10000});await p.click('#confirmpick');return Object.assign(r,{tid})}
async function wizard(p,o){await p.goto(APP+'/setup.html',{waitUntil:'domcontentloaded'});await p.waitForSelector('#f_name',{timeout:30000});
  const typeIn=async(s,v)=>{await p.$eval(s,e=>{e.value=''});await p.type(s,v)};await typeIn('#f_name',o.name);await typeIn('#f_mgr','TEST Commish');await typeIn('#f_team','TEST Team 1');
  const want={managers:String(o.managers),type:o.type,whenMode:'now',startMode:'manual',orderMode:o.orderMode,clockSecs:String(o.clock),autoPick:'true'};
  for(let i=0;i<20;i++){if(await p.$('#create'))break;await p.evaluate(want=>{for(const g in want){const b=document.querySelector('[data-a=pick][data-g="'+g+'"][data-v="'+want[g]+'"]');if(b&&b.getAttribute('aria-pressed')!=='true')b.click()}},want);await sleep(300);
    await p.evaluate(()=>{const n=document.querySelector('#next');if(n)n.click()});await sleep(700)}
  await p.click('#create');await p.waitForSelector('#made',{timeout:90000});
  const L=await p.evaluate(()=>{const g=k=>{const a=document.querySelector('#lnk_'+k+' a.url');return a&&a.href};return{invite:g('invite'),room:g('room'),commish:g('commish'),code:(document.querySelector('#code')||{}).innerText}});return L}
async function blankLeague(id,N){const K=F.Keys(id);const keys=[K.meta,K.chat,K.hero];const m=F.parseJ(await (await fetch(API+encodeURIComponent(K.meta))).text())||{};const ep=m.epoch||1;
  for(let i=1;i<=N;i++)for(let g=0;g<3;g++)keys.push(K.slot(i,g));(m.order||[]).forEach(mid=>{keys.push(K.mgr(mid),K.pref(mid),K.pres(mid),K.rd(mid))});
  for(let e=1;e<=ep;e++)for(let n=1;n<=N*F.roundsFor(N)+2;n++){keys.push(K.pick(e,n));for(let a=1;a<=3;a++)keys.push(K.pick(e,n)+'-a'+a)}
  let cleaned=0;for(const k of keys){try{const v=await (await fetch(API+encodeURIComponent(k))).text();if(v){await fetch(API+encodeURIComponent(k),{method:'POST',headers:{'content-type':'text/plain'},body:''});cleaned++}}catch(e){}}return{checked:keys.length,cleaned}}
async function drive(pages,policyOf,label,maxMs){/* pages: [{p,mid}]; loop until the draft is complete */
  const t0=Date.now();const PG=PROG;const acts=PG.acts;const ref=pages[0].p;let info=null;
  while(Date.now()-t0<maxMs){info=await onClock(ref);if(!info||info.status!=='live'){if(info&&info.status==='complete')break;await sleep(1500);continue}
    if(info.n!==PG.n){PG.n=info.n;PG.at=Date.now()}else if(Date.now()-PG.at>(+process.env.STALL||75000)){PG.stall++;console.log('   STALL at #'+info.n+' ('+Math.round((Date.now()-PG.at)/1000)+'s no pick)');PG.at=Date.now();PG.stalls.push(info.n);if(PG.stall>2){PG.dead=true;return{status:'stalled',n:info.n}}}
    const owner=info.owner;const pg=pages.find(x=>x.mid===owner);
    for(const x of pages){/* every human sets the switch for ITS next turn ahead of time */const pol=policyOf(x.mid,nextRound(info,x.mid));if(!pol)continue;const wantAuto=/auto$/.test(pol);await setAuto(x.p,wantAuto)}
    if(pg){const pol=policyOf(owner,info.round)||'';const key=owner+':'+info.n;if(pol==='manual'&&!acts[key]){acts[key]=1;try{const r=await manualPick(pg.p,SHOTS&&!acts.shot?SHOTS+'-'+label+'-teams-on-clock.png':'');acts.shot=1;
      ok(label+' #'+info.n+' Pick a team opens the Teams tab (no pop-up), Power Ranking sort',r.tab==='teams'&&!r.popup&&/Power Ranking/.test(r.sort),JSON.stringify(r))}catch(e){ok(label+' manual pick #'+info.n,false,String(e))}}}
    await sleep(1200)}
  return info}
function nextRound(info,mid){/* round of this manager's next turn at or after pick info.n */for(let n=info.n;n<=info.tot;n++){const s=F.slotAt(info.order,n,info.type||'snake',1e9);if(s&&s.owner===mid)return Math.floor((n-1)/info.order.length)+1}return null}
async function runMock(browser,name,o){resetProg();console.log('\n'+name+': practice, '+o.managers+' managers, '+o.order+', seat '+o.seat+', clock '+o.clock+'s, '+(o.vp.isMobile?'mobile 390':'desktop 1280')+', human: '+o.human.join(' / '));
  const {ctx,p}=await newPage(browser,o.vp);const t0=Date.now();
  await p.goto(APP+'/mock.html?managers='+o.managers+'&clock='+o.clock+'&seat='+o.seat+'&order='+o.order,{waitUntil:'domcontentloaded'});await p.waitForSelector('#startmock',{timeout:30000});await p.click('#startmock');
  await p.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:40000});await p.waitForSelector('.board',{timeout:40000});
  let info=null;for(let i=0;i<40&&!(info&&info.status==='live'&&info.me);i++){info=await onClock(p);await sleep(1000)}const me=info&&info.me;
  const type=o.order==='snake'?'snake':'linear';const pol=(mid,round)=>mid!==me||!round?null:o.human[Math.min(round,o.human.length)-1];
  /* queue policies: queue a mid-ranked team before that round's turn */
  const qrounds=o.human.map((x,i)=>/^queue/.test(x)?i+1:0).filter(Boolean);let queued=null;
  if(qrounds.includes(1)){queued=await queueTeam(p,12);console.log('   queued '+queued+' (BPI #'+'8+) before round 1')}
  const pages=[{p,mid:me}];let doneQ=!!queued;
  const policyOf=(mid,round)=>pol(mid,round);
  const wrapped=async()=>{const t=Date.now();let inf=null;while(Date.now()-t<15*60000){inf=await onClock(p);if(inf&&inf.status==='complete')break;
      if(inf&&inf.status==='live'){inf.type=type;const nr=nextRound(inf,me);if(!doneQ&&qrounds.includes(nr)&&inf.owner!==me){queued=await queueTeam(p,20);doneQ=true;console.log('   queued '+queued+' before round '+nr)}}
      const r=await drive(pages,policyOf,name,4000);if(r&&r.status==='complete'){inf=r;break}if(PROG.dead)break}return inf};
  info=await wrapped();
  const d=await DC.readDraft(p);const r=DC.check(d,new Set([me]),null);report(name,d,r,t0,{});if(SHOTS)await p.screenshot({path:SHOTS+'-'+name+'-end.png'}).catch(()=>{});if(d.lid){const b=await blankLeague(d.lid,o.managers).catch(e=>({err:String(e)}));console.log('   cleanup: blanked '+b.cleaned+' of '+b.checked+' shoops1-'+String(d.lid).slice(0,4)+'… practice keys');RES[RES.length-1].cleanup=b}await ctx.close();return r}
function report(name,d,r,t0,extra){try{fs.appendFileSync('/tmp/live_ids.txt',name+' '+d.lid+'\n')}catch(e){}ok(name+': no stall (no 75 s without a pick)',PROG.stalls.length===0,JSON.stringify(PROG.stalls));const got=d.picks?d.picks.filter(Boolean).length:0;
  ok(name+': draft complete, '+got+'/'+d.tot+' picks',d.status==='complete'&&got===d.tot,d.status+' '+got+'/'+d.tot);
  ok(name+': right owner for every pick ('+d.type+'), no duplicate team',r.errs.filter(e=>!/human auto-pick/.test(e)).length===0,r.errs.join('; '));
  ok(name+': human auto-picks = queue first, else best BPI available',r.errs.filter(e=>/human auto-pick/.test(e)).length===0,r.errs.join('; '));
  console.log('   human picks: '+r.human.map(h=>'#'+h.n+' '+h.by+' '+h.tid+'(BPI '+h.bpi+')'+(h.expected?' exp '+h.expected+'/'+h.why:'')).join(' | '));
  console.log('   time '+Math.round((Date.now()-t0)/1000)+'s; league '+(d.lid||'').slice(0,4)+'…');
  RES.push({name,complete:d.status==='complete'&&got===d.tot,picks:got+'/'+d.tot,errs:r.errs,human:r.human,secs:Math.round((Date.now()-t0)/1000)})}
const RES=[];let PROG={n:0,at:Date.now(),stall:0,stalls:[],acts:{}};const resetProg=()=>{PROG={n:0,at:Date.now(),stall:0,stalls:[],acts:{}}};
/* qlog for real-league / mock: the queue lists in the store prefs (queues are only ever set before that manager's auto turn here) */
const _check=DC.check;DC.check=function(d,humans,q){if(!q&&d.prefs){q={};d.picks.forEach((e,i)=>{if(e&&d.prefs[e.owner]&&Array.isArray(d.prefs[e.owner].queue))q[i+1]=d.prefs[e.owner].queue.map(String)})}return _check(d,humans,q)};
async function runLeague(browser,name,o){resetProg();console.log('\n'+name+': REAL league (TEST), '+o.managers+' managers, '+(o.type==='linear'?'straight':'snake')+', order '+(o.orderMode==='manual'?'set (join order)':'random')+', clock '+o.clock+'s, seats: '+o.seats.map((s,i)=>(i+1)+'='+s.join('/')+(o.vps[i].isMobile?'@390':'')).join(' '));
  const t0=Date.now();const pg=[];for(let i=0;i<o.managers;i++)pg.push(await newPage(browser,o.vps[i]));
  const L=await wizard(pg[0].p,{name:'TEST sh6c '+name,managers:o.managers,type:o.type,orderMode:o.orderMode,clock:o.clock});const id=F.parseCode(String(L.code||'').replace(/[^0-9A-Z]/g,''))||(/[?&]l=([^&#]+)/.exec(L.room||'')||[])[1];
  console.log('   league TEST sh6c '+name+' code '+String(id).slice(0,4)+'…');try{fs.appendFileSync('/tmp/live_ids.txt',name+' '+id+' league\n')}catch(e){}let r=null,d=null;
  try{for(let i=1;i<o.managers;i++){const p=pg[i].p;await p.goto(L.invite,{waitUntil:'domcontentloaded'});await p.waitForSelector('#jform',{timeout:40000});
      await p.$eval('#f_name',e=>e.value='');await p.type('#f_name','TEST Seat '+(i+1));await p.$eval('#f_team',e=>e.value='');await p.type('#f_team','TEST Team '+(i+1));await p.click('#joinbtn');await p.waitForSelector('#joined',{timeout:90000})}
    for(let i=0;i<o.managers;i++)await pg[i].p.goto(APP+'/room.html?l='+id,{waitUntil:'domcontentloaded'});
    const c=pg[0].p;await c.waitForFunction(n=>new RegExp(n+' of '+n+' joined').test((document.querySelector('#joinedct')||{}).innerText||''),{timeout:120000},o.managers);
    const mids=[];for(let i=0;i<o.managers;i++)mids.push(await pg[i].p.evaluate(l=>{try{return JSON.parse(localStorage.getItem('shoops.me.'+l)||'{}').mid}catch(e){return null}},id));
    const pol={};mids.forEach((m,i)=>pol[m]=o.seats[i]);const policyOf=(mid,round)=>{const a=pol[mid];return a&&round?a[Math.min(round,a.length)-1]:null};
    /* queue seats queue before the start */
    await sleep(1500);for(let i=0;i<o.managers;i++)if(/^queue/.test(o.seats[i][0])){const t=await queueTeam(pg[i].p,10+i);console.log('   seat '+(i+1)+' queued '+t)}
    await c.evaluate(()=>{const t=document.querySelector('[data-t=board]');if(t)t.click()});await c.waitForSelector('#startbtn',{visible:true,timeout:30000});await c.click('#startbtn');await c.waitForSelector('#cfyes',{timeout:10000});await c.click('#cfyes');
    await c.waitForFunction(()=>!document.querySelector('#startbtn'),{timeout:60000}).catch(()=>{});
    const pages=mids.map((m,i)=>({p:pg[i].p,mid:m}));let info=null;const tt=Date.now();
    while(Date.now()-tt<25*60000){info=await onClock(c);if(info&&info.status==='complete')break;if(info&&info.status==='live'){info.type=o.type}const x=await drive(pages.map(z=>z),policyOf,name,5000);if(x&&x.status==='complete'){info=x;break}if(PROG.dead)break}
    d=await DC.readDraft(c);ok(name+': order is '+(o.orderMode==='manual'?'the set (join) order':'a random order of all seats'),o.orderMode==='manual'?JSON.stringify(d.order)===JSON.stringify(mids):d.order.slice().sort().join()===mids.slice().sort().join(),JSON.stringify({order:d.order,mids}));
    r=DC.check(d,new Set(mids),null);report(name,d,r,t0);if(SHOTS)await c.screenshot({path:SHOTS+'-'+name+'-end.png'}).catch(()=>{});
  }finally{if(id){const b=await blankLeague(id,o.managers).catch(e=>({err:String(e)}));console.log('   cleanup: blanked '+b.cleaned+' of '+b.checked+' shoops1-'+String(id).slice(0,4)+'… keys');RES.length&&(RES[RES.length-1].cleanup=b)}for(const x of pg)await x.ctx.close().catch(()=>{})}return r}
(async()=>{let mock=null;if(!LIVE){try{mock=await startMock()}catch(e){if(!/EADDRINUSE/.test(String(e)))throw e}}
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const which=process.argv.slice(2).length?process.argv.slice(2):Object.keys(RUNS);
  try{for(const k of which){const o=RUNS[k];try{if(o.kind==='mock')await runMock(browser,k,o);else await runLeague(browser,k,o)}catch(e){ok(k+' ran without a harness error',false,e&&e.stack)}}}
  finally{await browser.close();if(mock)mock.kill('SIGTERM')}
  fs.writeFileSync('/tmp/live_drafts_'+(LIVE?'live':'local')+'.json',JSON.stringify(RES,null,1));
  console.log(bad?'FAILED '+bad+'/'+tot+': '+fails.join(', '):'All '+tot+' checks passed');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
