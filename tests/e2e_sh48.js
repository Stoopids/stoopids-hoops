/* sh48: mirror STOOPIDS 3069696 (PR #90): card header 'Bet #N · A v B · Status'; accepted Copy has 💥, bet # and ET game date, no Exp. SYNTHETIC league, mock store, shoops1- keys only, TEST names.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh42.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh48',HP=+(process.env.HP||9941),BUILD=process.env.BUILD||'2026-11-24sh48',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[Object.assign({id:'v25t48a',n:1,odds:{a:1,b:1},text:'Charlotte -3.5 vs Atlanta, Nov 24',rd:{k:'spread',t:'Charlotte',o:'Atlanta',l:-3.5,sp:'mcbb',d:'2026-11-24'}},base),Object.assign({id:'v25t48b',n:2,odds:{a:1,b:1},text:'Under 220.5 Charlotte vs Atlanta, Nov 24',rd:{k:'total',t:'Charlotte',o:'Atlanta',l:220.5,ou:'u',sp:'mcbb',d:'2026-11-24'}},base,{backer:'Ben',other:'Cy',postedBy:'Ben'})]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__cp=[];const w=t=>{window.__cp.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:w},configurable:true})}catch(e){}},{id,me:{mid:M[0].id,k:M[0].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});await p.evaluate(()=>obView('all'));await sleep(900);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  const r=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.card')].filter(x=>x.offsetParent&&/Bet #\d/.test(x.innerText));return {heads:cards.map(x=>x.innerText.split('\n').filter(Boolean).slice(0,2).join(' ').replace(/\s+Copy$/,'')),copy:b27ClipText(U.doc.bets.find(x=>x.n===1))}});
  console.log('HEADS',JSON.stringify(r.heads));console.log('COPY>>>\n'+r.copy+'\n<<<');
  ok("header 'Bet #1 · Ana v Ben · Status'",r.heads.some(h=>/^Bet #1 · Ana v Ben ·/.test(h)),r.heads);
  const L=r.copy.split('\n');ok('accepted Copy: 💥, #1, ET date Nov 24, no Exp',/^\uD83D\uDCA5 \$5 Ana v Ben \uD83D\uDCA5 · #1$/.test(L[0])&&/Nov 24/.test(r.copy)&&!/Exp/.test(r.copy)&&!/\uD83D\uDCA3/.test(r.copy),L);
  await p.evaluate(()=>{const c=[...document.querySelectorAll('.card')].find(x=>x.offsetParent&&/Bet #\d/.test(x.innerText));c&&c.scrollIntoView({block:'start'});window.scrollBy(0,-150)});await sleep(300);
  await p.evaluate(x=>{const d=document.createElement('pre');d.style.cssText='position:fixed;left:8px;right:8px;bottom:80px;z-index:99999;background:#111;color:#fff;border:2px solid #ffd400;border-radius:10px;padding:12px;font:15px/1.4 system-ui;white-space:pre-wrap';d.textContent='Copied (Bet #1):\n'+x;document.body.appendChild(d)},r.copy);
  await p.screenshot({path:`${OUT}/sh48-bets-copy-mobile.png`});console.log('shot',`${OUT}/sh48-bets-copy-mobile.png`);
  ok('no page errors',!errs.length,errs);await c.close();
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
