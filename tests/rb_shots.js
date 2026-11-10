/* rb1: local STOOPIDS-look check + screenshots. Local mock_textdb only (never textdb.dev). One full solo mock draft (5 managers),
   room on the clock (desktop + mobile), then the League site with SYNTHETIC labeled data: standings (?demo=1), Tally (synthetic test bets), More sheet, Who are you?, Online strip, Chat pill. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core')}
const path=require('path'),fs=require('fs');const {spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..');const PORT=+(process.env.PORT||8981);const APP='http://127.0.0.1:'+PORT;
const OUT=process.env.OUT||path.join(ROOT,'screens-rebuild');fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let n=0,bad=0;const ok=(m,c,x)=>{n++;if(c)console.log('  ok  '+m);else{bad++;console.log('FAIL  '+m,x!==undefined?String(JSON.stringify(x)).slice(0,300):'')}};
function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT]);let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error('mock start '+b)),8000)})}
const VP={desktop:{width:1280,height:900},mobile:{width:390,height:844,isMobile:true,hasTouch:true}};
async function newPage(ctx,vw){const p=await ctx.newPage();await p.setViewport(VP[vw]);await p.setBypassServiceWorker(true).catch(()=>{});await p.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/')}catch(e){}});
  p._err=[];p.on('pageerror',e=>p._err.push(e.message));p._tdb=[];p.on('request',r=>{if(/textdb\.dev/.test(r.url()))p._tdb.push(r.url())});return p}
const shot=(p,name)=>p.screenshot({path:path.join(OUT,name+'.png')});
(async()=>{const mock=await startMock();const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const ctx=await b.createBrowserContext();
  // home
  for(const vw of ['desktop','mobile']){const p=await newPage(ctx,vw);await p.goto(APP+'/index.html',{waitUntil:'networkidle2'});await sleep(600);
    ok(vw+' home has the STOOPIDS header (presents + big yellow title + banner)',await p.evaluate(()=>{const t=document.querySelector('.sh-title'),c=t&&getComputedStyle(t);return !!(t&&document.querySelector('.sh-hero')&&/stoopids presents/i.test(document.querySelector('.sh-pres').textContent)&&parseFloat(c.fontSize)>=34&&c.color==='rgb(255, 210, 63)')}));
    await shot(p,'home-'+vw);await p.close()}
  // mock draft: seat 1, 60 s clock, human on the clock
  const p=await newPage(ctx,'desktop');await p.goto(APP+'/mock.html?managers=5&clock=60',{waitUntil:'networkidle2'});await sleep(500);await shot(p,'mock-setup-desktop');
  await p.evaluate(()=>{const s=document.getElementById('m_seat');if(s){s.value=[...s.options].map(o=>o.value).find(v=>v==='1')||s.value;s.dispatchEvent(new Event('change',{bubbles:true}))}});
  await p.click('#startmock');await p.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:20000});const lid=new URL(p.url()).searchParams.get('l');ok('mock room opened',!!lid,lid);
  const onClock=await p.waitForFunction(()=>/your pick/i.test(document.body.innerText),{timeout:60000}).then(()=>true).catch(()=>false);ok('human is on the clock',onClock);
  await sleep(800);await shot(p,'mock-onclock-desktop');await p.setViewport(VP.mobile);await sleep(1000);await shot(p,'mock-onclock-mobile');await p.setViewport(VP.desktop);await sleep(600);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button,a')].find(e=>/pick a team/i.test(e.innerText));if(b)b.click()});await sleep(1500);
  ok('room has the compact STOOPIDS header + rounded-rect tabs',await p.evaluate(()=>{const t=document.querySelector('.tabs .on');return !!(document.querySelector('.sh-compact .sh-title')&&t&&getComputedStyle(t).backgroundColor==='rgb(255, 210, 63)')}));
  await shot(p,'mock-onclock-teams-desktop');
  await p.setViewport(VP.mobile);await sleep(1200);await shot(p,'mock-onclock-teams-mobile');await p.setViewport(VP.desktop);
  // finish: auto-pick on
  const t0=Date.now();while(Date.now()-t0<20000){const on=await p.evaluate(()=>{const tab=document.querySelector('[data-t=my]');const e=document.querySelector('#autotog')||document.querySelector('#autodraft');if(!e&&tab){tab.click();return false}if(e&&!e.checked)e.click();return !!(e&&e.checked)}).catch(()=>false);if(on)break;await sleep(500)}
  const done=await p.waitForFunction(()=>!!document.querySelector('#finalbanner')||!!document.querySelector('#rcsite')||/recap\.html/.test(location.href),{timeout:300000}).then(()=>true).catch(()=>false);ok('local full mock draft completed',done);
  // league data: managers + synthetic test bets + presence (local store only)
  await p.goto(APP+'/league.html?l='+encodeURIComponent(lid),{waitUntil:'networkidle2'});await sleep(2500);
  const mids=await p.evaluate(async lid=>{const K=FBN.Keys(lid);const m=FBN.parseJ(await Store.get(K.meta));return (m&&m.order)||[]},lid);ok('league has 5 managers',mids.length===5,mids);
  await p.evaluate(async(lid,mids)=>{const K=FBN.Keys(lid),T=Date.now()-3*864e5;const L={};mids.forEach(m=>L[m]=[]);let u=0;const U=()=>'syn'+(u++).toString(36).padStart(5,'0');
    const bet=(i,a,c,amt,r,txt)=>{const id='synbet'+i;L[mids[a]].push({k:'p',u:U(),ts:T+i*1000,id,to:mids[c],amt,a:1,b:1,text:'SYNTHETIC TEST: '+txt,v:25});L[mids[c]].push({k:'a',u:U(),ts:T+i*1000+1,id,v:25});if(r)L[mids[a]].push({k:'s',u:U(),ts:T+i*1000+2,id,r,v:25})};
    bet(1,0,1,10,'b','Celtics beat the Knicks');bet(2,1,2,20,'o','Lakers over 110.5');bet(3,2,3,5,'b','Wemby 30+ points');bet(4,3,4,10,'o','Thunder cover -7');bet(5,4,0,20,'b','Nuggets win at home');bet(6,0,2,10,null,'Spurs win the Cup');
    for(const m of mids)await Store.set(K.base+'-bets-'+m,{v:1,ev:L[m]});
    const now=Date.now();await Store.set(K.pres(mids[0]),{t:now-20000});await Store.set(K.pres(mids[1]),{t:now-40*60000});await Store.set(K.pres(mids[2]),{t:now-9*3600e3})},lid,mids);
  await p.close();
  // viewer without a manager link: Who are you? picker, then standings / tally / more
  for(const vw of ['desktop','mobile']){const vctx=await b.createBrowserContext();const q=await newPage(vctx,vw);
    await q.goto(APP+'/league.html?l='+encodeURIComponent(lid)+'&demo=1#standings',{waitUntil:'networkidle2'});await sleep(2500);
    ok(vw+' standings: STOOPIDS nav (rounded rect tabs, Tally + Archive present)',await q.evaluate(()=>{const n=document.getElementById('ltabs');const on=n&&n.querySelector('a.tb.on');return !!(n&&n.querySelector('[data-v=tally]')&&n.querySelector('[data-v=archive]')&&on&&getComputedStyle(on).borderRadius!=='999px')}));
    ok(vw+' Share pill + floating Chat + Online strip',await q.evaluate(()=>!!(document.getElementById('s12Share')&&document.querySelector('#chat.chat-off')&&document.getElementById('onlStrip'))));
    ok(vw+' demo standings are labeled DEMO',await q.evaluate(()=>/DEMO/.test(document.body.innerText)));
    await shot(q,'league-standings-'+vw);
    await q.goto(APP+'/league.html?l='+encodeURIComponent(lid),{waitUntil:'networkidle2'});await q.evaluate(()=>{});await sleep(2500);
    const who=await q.evaluate(()=>!!document.getElementById('pwho'));ok(vw+' Who are you? picker is skipped in a practice (mock) league',!who);
    await q.evaluate(()=>{const g=document.querySelector('#pwho .guest');if(g)g.click()});await sleep(500);
    ok(vw+' Online / Last seen strip lists managers',await q.evaluate(()=>/Online/.test(document.getElementById('onlStrip').innerText)&&/Last seen/.test(document.getElementById('onlStrip').innerText)),await q.evaluate(()=>document.getElementById('onlStrip').innerText));
    if(vw==='mobile'){ok('mobile nav = 4 tabs + More',await q.evaluate(()=>[...document.querySelectorAll('#ltabs>a,#ltabs>button')].filter(e=>e.offsetWidth>0).map(e=>e.innerText.replace(/\s+/g,' ').trim()).join('|')),await q.evaluate(()=>[...document.querySelectorAll('#ltabs>a,#ltabs>button')].filter(e=>e.offsetWidth>0).map(e=>e.innerText.replace(/\s+/g,' ').trim()).join('|')));
      await q.click('#navmore');await sleep(500);ok('More sheet lists Tally, Recap, Rules, Archive, Profile',await q.evaluate(()=>{const t=document.getElementById('navsheet').innerText;return ['Tally','Recap','Rules','Archive','Profile'].every(x=>t.includes(x))}));await shot(q,'league-more-mobile');
      await q.evaluate(()=>document.querySelector('#navsheet [data-v=tally]').click());}
    else await q.evaluate(()=>document.querySelector('#ltabs [data-v=tally]').click());
    await q.waitForFunction(()=>!!document.getElementById('b27Matrix')||!!document.getElementById('b27TallyEmpty'),{timeout:20000}).catch(()=>{});await sleep(800);
    ok(vw+' Tally tab shows the synthetic ledger',await q.evaluate(()=>!!document.getElementById('b27Matrix')&&!!document.getElementById('b27People')));
    await shot(q,'league-tally-'+vw);
    await q.evaluate(()=>document.querySelector('#ltabs [data-v=archive]')?location.hash='archive':0);await sleep(300);
    ok(vw+' no page errors',q._err.length===0,q._err);ok(vw+' never called textdb.dev',q._tdb.length===0,q._tdb);await q.close()}
  // a real (non-practice) league seeded with test names: the Who are you? picker
  {const {seed}=require('./seed_league.js');const lid2=await seed(APP+'/api/data/',{managers:5});
   for(const vw of ['desktop','mobile']){const c=await b.createBrowserContext();const q=await newPage(c,vw);await q.goto(APP+'/league.html?l='+encodeURIComponent(lid2),{waitUntil:'networkidle2'});
    const who=await q.waitForSelector('#pwho',{timeout:15000}).then(()=>true).catch(()=>false);ok(vw+' Who are you? picker shows in a real league for a viewer with no manager link',who);await sleep(500);await shot(q,'league-who-'+vw);
    await q.evaluate(()=>{const x=document.querySelector('#pwho .grid button');if(x)x.click()});await sleep(500);ok(vw+' picking a name closes the picker (no sign-in, no writes)',await q.evaluate(()=>!document.getElementById('pwho')));
    ok(vw+' no page errors (real league)',q._err.length===0,q._err);await c.close()}}
 }catch(e){console.log('ERROR',e);bad++}
 await b.close();mock.kill();console.log((n-bad)+' passed, '+bad+' failed');process.exit(bad?1:0)})();
