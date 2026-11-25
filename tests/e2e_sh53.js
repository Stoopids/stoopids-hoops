/* sh53: mirror STOOPIDS f25f12a (PR99): on a phone the Bets sub-tab row stays in the page (sticky) after the header scrolls away, fully visible and tappable; All Bets opens.
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. 390x844 mobile.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh53.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh53',HP=+(process.env.HP||9991),BUILD=process.env.BUILD||'2026-11-25sh53',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[1,2,3,4,5,6].map(n=>Object.assign({id:'v25t53'+n,n,odds:{a:1,b:1},text:'Ana beats Ben at HORSE round '+n,rd:{k:'manual'}},base,{wk:'season'}))};
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
  await p.locator('button:visible',{hasText:/^Write it Up$/}).first().click();await sleep(600);
  for(let i=0;i<6;i++){await p.mouse.wheel(0,400);await sleep(250)}await sleep(600);
  const r=await p.evaluate(()=>{const t=[...document.querySelectorAll('#main>.tabs.ob-seg')].find(x=>x.getBoundingClientRect().height>0);if(!t)return {none:true};const R=t.getBoundingClientRect(),btns=[...t.querySelectorAll('button')].filter(x=>x.offsetParent),all=btns.find(x=>/^All Bets$/i.test(x.textContent.trim()));const a=all&&all.getBoundingClientRect();const hit=a&&document.elementFromPoint(a.left+a.width/2,a.top+a.height/2);
    return {away:document.body.classList.contains('hdr-away'),scrollY:Math.round(scrollY),pos:getComputedStyle(t).position,rect:[R.left,R.top,R.right,R.bottom].map(Math.round),cls:t.className,n:document.querySelectorAll('#main>.tabs.ob-seg').length,vw:innerWidth,vh:innerHeight,labels:btns.map(x=>x.textContent.trim()),allHit:!!(hit&&all&&(hit===all||all.contains(hit))),allRect:a&&[a.left,a.top,a.right,a.bottom].map(Math.round)}});
  console.log(JSON.stringify(r));
  ok('header scrolled away',r.away&&r.scrollY>100,r);
  ok('sub-tab row fully on screen',!r.none&&r.rect[0]>=0&&r.rect[1]>=0&&r.rect[2]<=r.vw&&r.rect[3]<=r.vh,r.rect);
  ok('every sub-tab button inside the viewport and All Bets tappable (top element at its center)',r.allHit&&r.allRect[2]<=r.vw,r.allRect);
  await p.screenshot({path:`${OUT}/sh53-subtabs-scrolled-mobile.png`});console.log('shot',`${OUT}/sh53-subtabs-scrolled-mobile.png`);
  await p.locator('#main>.tabs.ob-seg button:visible',{hasText:/^All Bets$/}).first().click();await sleep(700);
  const v=await p.evaluate(()=>({view:typeof OB_VIEW!=='undefined'?OB_VIEW:'',h:!!document.querySelector('.b27-allh')}));ok('tapping All Bets opens All Bets',v.view==='all'&&v.h,v);
  ok(WHO+' no page errors',!errs.length,errs);await c.close();
  }
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
