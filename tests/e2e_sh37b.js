/* sh37b: PAUL-n puts request stakes back to "$5" (STOOPIDS f9077b2 had switched them to "5K"); the rest of f9077b2 stays.
   Also reproduces the live "some Stoops can't see it" report with a TEST copy of the real record's shape
   (open to every other manager, slots:2, took:null, sp 'mcbb', expires at tip) viewed by each other manager before tip.
   Checks: no "<n>K" stake text anywhere on Bets (All Bets, Tally, Request form) and request cards read "$5" / payouts "$10".
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. ESPN/textdb blocked. Mobile 412x915, desktop 1280x800.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh37b.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/screens-sh37b',HP=+(process.env.HP||9801),PRE=process.env.PRE||'sh37b',BUILD=process.env.BUILD||'2026-11-19sh37b';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const QGID='401910019',NOW='2026-11-19T12:00:00Z',KRE=/(^|[^\w$])\d+(?:\.\d+)?K\b/;
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh37b',names:NAMES});const M=seed.info.managers;
  async function open(mi,vp){const mobile=vp.w<=500;const c=await br.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,timezoneId:'Asia/Jakarta'});
   await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets27`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1000);return {c,p,errs}}
  let V=await open(0,{w:412,h:915});let p=V.p;
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  await p.evaluate(async o=>{const q=(D.games||[]).find(x=>String(x.id)===o.qgid),exp=Date.parse(q.start),at=Date.now()-3600e3;
   const others=['Ben','Cy','Dee','Eli','Fay'];
   const reqs=[ // same shape as the live record: by the creator, to every other manager, slots:2, took:null, n:null
    {id:'sh37brq1',n:null,by:'Ana',to:others,slots:2,amt:5,odds:[1,1],txt:'New York -1.5 vs Minnesota +1.5, Nov 19',exp,start:q.start,status:'open',dec:[],took:null,gid:o.qgid,wk:'game',cov:'game',rd:{k:'spread',t:'Golden State',o:'Memphis',l:-1.5,sp:'mcbb',d:q.day},date:'Nov 19',at},
    {id:'sh37brq2',n:2,by:'Ben',to:['Ana','Cy','Dee','Eli','Fay'],amt:5,odds:[2,1],txt:'Memphis -4.5 vs Golden State +4.5',lab:'Memphis -4.5 vs Golden State +4.5',exp,start:q.start,status:'open',dec:[],took:[],cov:'game',wk:'game',gid:o.qgid,rd:{k:'spread',t:'Memphis',o:'Golden State',l:-4.5,d:q.day},at}];
   await fetch(HOOPS.url('requests-2627'),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({v:1,reqs})});if(RQ.load)await RQ.load()},{qgid:QGID});
  await V.c.close();
  // visibility: every other manager sees the creator's open request before tip
  const seen={};for(let mi=1;mi<6;mi++){V=await open(mi,{w:412,h:915});p=V.p;await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1200);
   seen[NAMES[mi][0]]=await p.evaluate(()=>[...document.querySelectorAll('.rq-card')].some(c=>/TEST Aces/.test(c.innerText)));await V.c.close()}
  ok('every other manager sees the open request (live record shape, before tip)',Object.values(seen).every(Boolean),seen);
  for(const [vp,tag] of [[{w:412,h:915},'mobile'],[{w:1280,h:800},'desktop']]){
   V=await open(1,vp);p=V.p;const hits=[];
   for(const v of ['all','tally','request']){await p.evaluate(v=>{tab='bets27';OB_VIEW=v;render()},v);await sleep(1000);const t=await p.evaluate(()=>document.getElementById('main').innerText);const m=t.split('\n').filter(l=>KRE.test(l));if(m.length)hits.push([v,m.slice(0,3)])}
   ok(tag+' PAUL-n: no "K" stake text anywhere on Bets',!hits.length,hits);
   await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1200);
   const cards=await p.evaluate(()=>[...document.querySelectorAll('.rq-card')].map((c,i)=>{c.id='sh37bc'+i;return {id:c.id,t:c.innerText.replace(/\s+/g,' ')}}));
   const mine=cards.find(c=>/TEST Blazers/.test(c.t)),ana=cards.find(c=>/TEST Aces/.test(c.t));
   ok(tag+' PAUL-n: request cards read $5',!!(mine&&/\$5 Memphis -4\.5/.test(mine.t)&&ana&&/\$5 Golden State -1\.5/.test(ana.t)),[mine&&mine.t.slice(0,80),ana&&ana.t.slice(0,80)]);
   ok(tag+' PAUL-n: 2-1 payout reads $10',!!(mine&&/\$10\b/.test(mine.t)),mine&&mine.t.slice(0,200));
   ok(tag+' f9077b2 kept: open request says Awaiting acceptance',!!(ana&&/Awaiting acceptance/.test(ana.t)));
   if(ana){const l=p.locator('#'+ana.id);await l.scrollIntoViewIfNeeded();await l.screenshot({path:`${OUT}/${PRE}-request-other-manager-${tag}.png`});console.log('shot',`${OUT}/${PRE}-request-other-manager-${tag}.png`)}
   if(mine){const l=p.locator('#'+mine.id);await l.scrollIntoViewIfNeeded();await l.screenshot({path:`${OUT}/${PRE}-request-own-2to1-${tag}.png`});console.log('shot',`${OUT}/${PRE}-request-own-2to1-${tag}.png`)}
   ok(tag+' no page errors',!V.errs.length,V.errs);await V.c.close()}
 }catch(e){nf++;console.log('FAIL exception',e&&e.stack||e)}finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})();
