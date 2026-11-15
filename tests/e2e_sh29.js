/* sh29 BUG-7: Paul's Request text "Minnesota Timberwolves and Chicago Bulls game: over 234.5 pts tonight." finds the game.
   SYNTHETIC league in the local mock store (never textdb.dev, no real league). ESPN blocked so the baked schedule is used.
   Clock set to Nov 14 3pm ET (before the 8pm ET tip), mobile 412x915. A 2nd run at 8:30pm ET checks the "already started" message.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh29.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||9031);fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const TEXT='Minnesota Timberwolves and Chicago Bulls game: over 234.5 pts tonight.';
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh29',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
  const M=seed.info.managers;
  async function open(when){const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.clock.install({time:new Date(when)});
   await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[0].id,k:M[0].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets27`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1500);
   await p.evaluate(()=>{tab='bets27';OB_VIEW=innerWidth<1000?'request':'form';render()});await sleep(1000);
   const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is sh29',ver==='2026-11-15sh29',ver);
   const g=await p.evaluate(()=>{const g=(D.games||[]).find(x=>String(x.id)==='401909984');return g&&{st:g.status,start:g.start,a:g.away.short,h:g.home.short}});ok('Bulls at Timberwolves is in the schedule',!!g&&g.a==='Chicago'&&g.h==='Minnesota',g);
   // type the bet the way Paul did: free text only, no game picked
   await p.evaluate(()=>{RQ.S.f.gid='';});await p.fill('#rqForm [data-rq-in="text"]',TEXT);await sleep(400);
   await p.evaluate(()=>{const b=[...document.querySelectorAll('#rqForm .b27-amt')].find(x=>x.textContent.trim()==='5');if(b)b.click()});await sleep(600);
   return {c,p,errs}}
  // 1) before tip
  let V=await open('2026-11-14T20:00:00Z');let p=V.p;
  const tg=await p.evaluate(()=>{const g=SHARED_UI.tipGame({games:RQ&&RQ.S?(D.games||[]).map(g=>({id:String(g.id),g,start:g.start,status:g.status})):[],text:RQ.S.f.text,now:Date.now(),today:S25.etDay(new Date()),dateFrom:S25.dateFrom,day:S25.etDay});return g&&g.id});
  ok('the typed text resolves to game 401909984',tg==='401909984',tg);
  const pre=await p.evaluate(()=>{const f=document.getElementById('rqForm');return f?f.innerText:''});
  ok('form shows the bet text',pre.includes('234.5'),pre.slice(0,300));
  await p.evaluate(()=>{const f=document.getElementById('rqForm');if(f)f.scrollIntoView({block:'start'})});await sleep(300);
  await p.screenshot({path:`${OUT}/sh29-request-form-mobile.png`,fullPage:true});
  const b=await p.evaluate(()=>(RQ.S.list||[]).length);
  await p.evaluate(()=>{document.querySelector('#rqForm [data-rq="send"]').click()});await sleep(3000);
  const r=await p.evaluate(b=>({n:(RQ.S.list||[]).length-b,msg:RQ.S.msg,bad:RQ.S.bad,last:(RQ.S.list||[]).slice(-1)[0]}),b);
  ok('no "Name the game" error',!/Name the game/.test(r.msg||''),r.msg);
  ok('synthetic request posted, tied to the game, expires at tip',r.n===1&&r.last&&r.last.gid==='401909984'&&r.last.exp===Date.parse('2026-11-15T01:00Z')&&r.last.wk==='game',r.last&&{gid:r.last.gid,game:r.last.game,date:r.last.date,exp:new Date(r.last.exp).toISOString(),wk:r.last.wk,txt:r.last.txt});
  await p.evaluate(()=>{const x=document.querySelector('#main .rq-card, #rqPinned');if(x)x.scrollIntoView({block:'start'});else window.scrollTo(0,0)});await sleep(500);
  await p.screenshot({path:`${OUT}/sh29-request-posted-mobile.png`,fullPage:true});
  await p.evaluate(()=>{OB_VIEW='all';render()});await sleep(1500);
  const card=await p.evaluate(()=>{const c=[...document.querySelectorAll('#main .rq-card, #main [class*="rq-"]')].find(x=>/234\.5/.test(x.innerText));if(c)c.scrollIntoView({block:'center'});return c?c.innerText.slice(0,240):''});
  ok('All Bets shows the posted request',/234\.5/.test(card),card);await sleep(400);
  await p.screenshot({path:`${OUT}/sh29-request-allbets-mobile.png`,fullPage:true});
  ok('no page errors',!V.errs.length,V.errs);await V.c.close();
  // 2) after tip: says it started, nothing posted
  V=await open('2026-11-15T01:30:00Z');p=V.p;
  const b2=await p.evaluate(()=>(RQ.S.list||[]).length);await p.evaluate(()=>{document.querySelector('#rqForm [data-rq="send"]').click()});await sleep(1500);
  const r2=await p.evaluate(b=>({n:(RQ.S.list||[]).length-b,msg:RQ.S.msg}),b2);
  ok('after tip: "That game has already started." and nothing posted',r2.msg==='That game has already started.'&&r2.n===0,r2);
  await p.evaluate(()=>{const f=document.getElementById('rqForm');if(f)f.scrollIntoView({block:'start'})});await sleep(300);
  await p.screenshot({path:`${OUT}/sh29-request-started-mobile.png`,fullPage:true});
  ok('no page errors (after tip)',!V.errs.length,V.errs);await V.c.close();
 }finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
