/* sh49: mirror STOOPIDS 30d7d4e (PR91+PR92). SYNTHETIC league, mock store, shoops1- keys only, TEST names, synthetic games injected in-page; nothing real is read or written.
   (a) season bet: Who won?/Confirm under Details for both, not Ready/red; (b) due game bet with a 0-0 final: Who won? for both; (c) final game bet: Ready + red outline + Confirm.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh49.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh49',HP=+(process.env.HP||9951),BUILD=process.env.BUILD||'2026-11-24sh49',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[Object.assign({id:'v25t49a',n:1,odds:{a:1,b:1},text:'Ana finishes ahead of Ben this season',rd:{k:'manual'}},base,{wk:'season'}),
    Object.assign({id:'v25t49b',n:2,odds:{a:1,b:1},text:'Testville -3.5 vs Mocktown, Nov 22',rd:{k:'spread',t:'Testville',o:'Mocktown',l:-3.5,sp:'mcbb',d:'2026-11-22'}},base),
    Object.assign({id:'v25t49c',n:3,odds:{a:1,b:1},text:'Fakeburg -3.5 vs Dummyton, Nov 22',rd:{k:'spread',t:'Fakeburg',o:'Dummyton',l:-3.5,sp:'mcbb',d:'2026-11-22'}},base)]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  for(const [vi,WHO] of [[0,'Ana'],[1,'Ben']]){
  const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__cp=[];const w=t=>{window.__cp.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:w},configurable:true})}catch(e){}},{id,me:{mid:M[vi].id,k:M[vi].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});await p.evaluate(()=>obView('all'));await sleep(900);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  await p.evaluate(()=>{const G=(t,o,ts,os)=>({id:'t'+t,day:'2026-11-22',start:'2026-11-23T00:00:00Z',status:'final',home:{short:o,score:os},away:{short:t,score:ts}});D.games.push(G('Testville','Mocktown',0,0),G('Fakeburg','Dummyton',110,100));render()});await sleep(900);
  const r=await p.evaluate(()=>{const out={};for(const n of [1,2,3]){const b=U.doc.bets.find(x=>x.n===n),c=[...document.querySelectorAll('.card.b27-c')].find(x=>x.innerText.startsWith('Bet #'+n+' '));if(!c){out[n]=null;continue}const d=c.querySelector('details.b27-early');
    out[n]={ready:c.classList.contains('b27-ready'),inReady:!!c.closest('#b27Ready'),details:!!d,detailsHand:!!(d&&d.querySelector('[data-hand-pick]')&&d.querySelector('[data-hand-ok]')),hand:!!c.querySelector('[data-hand-settle]'),handOpen:!!c.querySelector('[data-hand-settle]')&&!c.querySelector('[data-hand-settle]').closest('details'),s25ok:!!c.querySelector('[data-s25-ok]'),sug:/Suggested winner/.test(c.innerText),head:c.innerText.split('\n')[0]}}return out});
  console.log(WHO,JSON.stringify(r));
  ok(WHO+' (a) season #1: Who won?/Confirm under Details, not Ready/red',r[1]&&r[1].detailsHand&&!r[1].ready&&!r[1].inReady,r[1]);
  ok(WHO+' (b) 0-0 final #2: Who won? + Confirm shown (open, no suggestion)',r[2]&&r[2].handOpen&&!r[2].sug,r[2]);
  ok(WHO+' (c) final #3: Ready + red outline + suggestion Confirm',r[3]&&r[3].ready&&r[3].inReady&&r[3].s25ok&&r[3].sug,r[3]);
  if(vi===0){await p.evaluate(()=>{const c=[...document.querySelectorAll('.card.b27-c')].find(x=>x.innerText.startsWith('Bet #1 '));const d=c&&c.querySelector('details.b27-early');if(d)d.open=true;c&&c.scrollIntoView({block:'start'});window.scrollBy(0,-70)});await sleep(400);await p.screenshot({path:`${OUT}/sh49-notdue-details-mobile.png`});
    await p.evaluate(()=>{const c=document.querySelector('#b27Ready .card.b27-c');c&&c.scrollIntoView({block:'start'});window.scrollBy(0,-110)});await sleep(400);await p.screenshot({path:`${OUT}/sh49-due-mobile.png`});console.log('shots',OUT)}
  ok(WHO+' no page errors',!errs.length,errs);await c.close();
  }
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
