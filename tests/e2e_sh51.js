/* sh51: mirror STOOPIDS 4b61e37 (PR94). SYNTHETIC league, mock store, shoops1- keys only, TEST names, synthetic games injected in-page.
   Season bet #1: pick winner, tap Confirm, refresh the scores (D.games change + redraw), tap again: still saves. Stoopid bet #2: Copy is '💥 $5 A v B 💥 · #2 / proposition / date'; headers never end in a bare dot.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh51.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh51',HP=+(process.env.HP||9971),BUILD=process.env.BUILD||'2026-11-24sh51',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[Object.assign({id:'v25t51a',n:1,odds:{a:1,b:1},text:'Ana finishes ahead of Ben this season',rd:{k:'manual'}},base,{wk:'season'}),
    Object.assign({id:'v25t51b',n:2,odds:{a:1,b:1},text:"Stoopid bet: Ana's teams win more than Ben's from Nov 20 through Nov 22 on Nov 22.",rd:{k:'manual'}},base)]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  for(const [vi,WHO] of [[1,'Ben']]){
  const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__cp=[];const w=t=>{window.__cp.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:w},configurable:true})}catch(e){}},{id,me:{mid:M[vi].id,k:M[vi].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});await p.evaluate(()=>obView('all'));await sleep(900);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  await p.evaluate(()=>{const G=(t,o,ts,os)=>({id:'t'+t,day:'2026-11-22',start:'2026-11-23T00:00:00Z',status:'final',home:{short:o,score:os},away:{short:t,score:ts}});D.games.push(G('Testville','Mocktown',0,0),G('Fakeburg','Dummyton',110,100));render()});await sleep(900);
  const card=n=>p.locator('.card.b27-c',{hasText:'Bet #'+n+' '}).first();
  const heads=await p.evaluate(()=>[...document.querySelectorAll('.card.b27-c .s24hd>b')].map(x=>x.textContent.trim()));console.log('HEADS',JSON.stringify(heads));
  ok('headers end in a status, never a bare dot',heads.length>=2&&heads.every(h=>!/[·.]\s*$/.test(h)&&/ · (Unsettled|Settled|Cancelled|Wash|.* won)$/.test(h)),heads);
  const cp=await p.evaluate(()=>b27ClipText(U.doc.bets.find(x=>x.n===2)));console.log('STOOP>>>\n'+cp+'\n<<<');
  ok("Stoopid-bet copy '💥 $5 Ana v Ben 💥 · #2 / proposition / date'",cp==="\uD83D\uDCA5 $5 Ana v Ben \uD83D\uDCA5 · #2\nAna's teams win more than Ben's from Nov 20 through Nov 22\nNov 22",cp);
  await card(2).scrollIntoViewIfNeeded();await p.evaluate(x=>{const d=document.createElement('pre');d.style.cssText='position:fixed;left:8px;right:8px;bottom:80px;z-index:99999;background:#111;color:#fff;border:2px solid #ffd400;border-radius:10px;padding:12px;font:15px/1.4 system-ui;white-space:pre-wrap';d.id='cpbox';d.textContent='Copied (Bet #2, Stoopid bet):\n'+x;document.body.appendChild(d)},cp);
  await p.evaluate(()=>{const c=[...document.querySelectorAll('.card.b27-c')].find(x=>x.innerText.startsWith('Bet #2 '));c.scrollIntoView({block:'start'});window.scrollBy(0,-70)});await sleep(300);
  await p.screenshot({path:`${OUT}/sh51-stoopid-copy-mobile.png`});console.log('shot',`${OUT}/sh51-stoopid-copy-mobile.png`);await p.evaluate(()=>document.getElementById('cpbox').remove());
  await p.evaluate(()=>document.querySelectorAll('details.b27-early').forEach(x=>x.open=true));
  await card(1).locator('[data-hand-pick="backer"]').click();await sleep(200);await p.evaluate(()=>document.querySelectorAll('details.b27-early').forEach(x=>x.open=true));await card(1).locator('[data-hand-ok]').click();await sleep(200);await p.evaluate(()=>document.querySelectorAll('details.b27-early').forEach(x=>x.open=true));
  await p.evaluate(()=>{const g=D.games.find(x=>x.id==='tTestville');g.home.score=5;g.away.score=9;g.status='in';render();g.away.score=12;render()});await sleep(400);
  await p.evaluate(()=>{const d=[...document.querySelectorAll('details.b27-early')];d.forEach(x=>x.open=true)});
  const lab=await card(1).locator('[data-hand-ok]').innerText();ok('after score refresh still "Tap again to confirm #1"',/Tap again to confirm #1/.test(lab),lab);
  await card(1).locator('[data-hand-ok]').click();
  await p.waitForFunction(()=>{const b=U.doc.bets.find(x=>x.n===1);return b&&b.status!=='open'},null,{timeout:15000}).catch(()=>{});await sleep(300);
  const st=await p.evaluate(()=>U.doc.bets.find(x=>x.n===1).status);ok('bet #1 saved after the score refresh',st==='backer',st);
  ok(WHO+' no page errors',!errs.length,errs);await c.close();
  }
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
