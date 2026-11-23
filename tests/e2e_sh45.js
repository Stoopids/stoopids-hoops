/* sh45: mirror STOOPIDS c297fe1 (3640a5c): accepted/open bet Copy uses 💥 both ends, no Exp. SYNTHETIC league, mock store, shoops1- keys only, TEST names.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh42.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh45',HP=+(process.env.HP||9891),BUILD=process.env.BUILD||'2026-11-23sh45',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[Object.assign({id:'v25t45a',n:1,odds:{a:1,b:1},text:'Charlotte +7.5 vs Atlanta -7.5, Nov 24',rd:{k:'spread',t:'Charlotte',o:'Atlanta',l:7.5,sp:'mcbb',d:'2026-11-24'}},base),
    Object.assign({id:'v25t45b',n:2,odds:{a:2,b:1},text:'Charlotte ML v Atlanta',rd:{k:'ml',ml:1,t:'Charlotte',o:'Atlanta',l:null,sp:'mcbb',d:'2026-11-24',fav:'Atlanta'}},base)]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__cp=[];const w=t=>{window.__cp.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:w},configurable:true})}catch(e){}},{id,me:{mid:M[0].id,k:M[0].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});await p.evaluate(()=>obView('all'));await sleep(900);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  await p.screenshot({path:`${OUT}/sh45-bets-mobile.png`});console.log('shot',`${OUT}/sh45-bets-mobile.png`);
  const t=await p.evaluate(()=>{const g=n=>s29eCopyText(U.doc.bets.find(x=>x.n===n));return {sp:g(1),ml:g(2)}});
  const btn=p.locator('.b27-c',{hasText:'Bet #1 '}).locator('button',{hasText:'Copy'}).first();if(await btn.count()){await btn.click();await sleep(600)}
  const clip=await p.evaluate(()=>window.__cp.slice());
  console.log('SPREAD>>>\n'+t.sp+'\n<<<\nML>>>\n'+t.ml+'\n<<<\nCLIP '+JSON.stringify(clip));
  const E=/^\uD83D\uDCA5 [^\n]*\uD83D\uDCA5\n/;
  ok('open written-up spread Copy: 💥 both ends, no Exp, ET date last',E.test(t.sp)&&!/Exp/.test(t.sp)&&/Nov 24$/.test(t.sp)&&/\$5/.test(t.sp),t.sp);
  ok('open written-up ML Copy: 💥 both ends, no Exp, ET date last',E.test(t.ml)&&!/Exp/.test(t.ml)&&/Nov 24$/.test(t.ml),t.ml);
  console.log('NOTE ML line present: '+/\nML · /.test(t.ml)+' (stored rd loses ml/fav on read in s25ValidExtra, upstream code)');
  ok('card Copy button copies the same text',clip.length&&clip[clip.length-1]===t.sp,clip);
  await p.evaluate(x=>{const d=document.createElement('pre');d.id='cpshow';d.style.cssText='position:fixed;left:8px;right:8px;top:90px;z-index:99999;background:#111;color:#fff;border:2px solid #ffd400;border-radius:10px;padding:12px;font:15px/1.4 system-ui;white-space:pre-wrap';d.textContent='Copied (Bet #1, spread):\n'+x.sp+'\n\nCopied (Bet #2, ML):\n'+x.ml;document.body.appendChild(d)},t);
  await p.screenshot({path:`${OUT}/sh45-copy-mobile.png`});console.log('shot',`${OUT}/sh45-copy-mobile.png`);
  ok('no page errors',!errs.length,errs);await c.close();
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
