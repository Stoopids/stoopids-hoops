/* sh52: mirror STOOPIDS 2c25b0e (PR95 suggestion confirm binds to bet+winner; PR96/97 no ML on Write It Up, Quick bet + Request keep ML; PR98 no inline 'Placed!' banner).
   SYNTHETIC league, mock store, shoops1- keys only, TEST names, synthetic games injected in-page.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh52.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh52',HP=+(process.env.HP||9981),BUILD=process.env.BUILD||'2026-11-24sh52',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-23T01:00:00.000Z',base={amt:5,created_at:at,postedAt:at,status:'open',settled_at:null,wk:'game',backer:'Ana',other:'Ben',postedBy:'Ana'};
  const bets={v:1,bets:[Object.assign({id:'v25t52a',n:1,odds:{a:1,b:1},text:'Fakeburg -3.5 vs Dummyton, Nov 22',rd:{k:'spread',t:'Fakeburg',o:'Dummyton',l:-3.5,sp:'mcbb',d:'2026-11-22'}},base)]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  for(const [vi,WHO] of [[1,'Ben']]){
  const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__cp=[];const w=t=>{window.__cp.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:w},configurable:true})}catch(e){}},{id,me:{mid:M[vi].id,k:M[vi].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});await p.evaluate(()=>obView('all'));await sleep(900);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  await p.evaluate(()=>{const G=(t,o,ts,os)=>({id:'t'+t,day:'2026-11-22',start:'2026-11-23T00:00:00Z',status:'final',home:{short:o,score:os},away:{short:t,score:ts}});D.games.push(G('Fakeburg','Dummyton',110,100),{id:'tUp',day:'2026-11-24',start:'2026-11-25T00:30:00Z',status:'scheduled',home:{short:'Mocktown',id:'m1'},away:{short:'Testville',id:'t1'},line:{fav:'m1',sp:4.5,ou:221.5,hml:-180,aml:150}});render()});await sleep(900);
  const card=()=>p.locator('.card.b27-c',{hasText:'Bet #1 '}).first();
  // (a) suggestion confirm survives a re-render with the same winner (score changes, Fakeburg still covers)
  await card().locator('[data-s25-ok]').click();await sleep(300);
  await p.evaluate(()=>{const g=D.games.find(x=>x.id==='tFakeburg');g.away.score=112;render();g.away.score=115;render()});await sleep(400);
  const lab=await card().locator('[data-s25-ok]').innerText();ok('(a) same winner after score change: still "Tap again to confirm #1"',/Tap again to confirm #1/.test(lab),lab);
  await card().locator('[data-s25-ok]').click();
  await p.waitForFunction(()=>{const b=U.doc.bets.find(x=>x.n===1);return b&&b.status!=='open'},null,{timeout:15000}).catch(()=>{});await sleep(300);
  const st=await p.evaluate(()=>U.doc.bets.find(x=>x.n===1).status);ok('(a) bet #1 saved on the second tap',st==='backer',st);
  // (b) ML: Write It Up none; Quick bet + Request keep it
  await p.locator('button:visible',{hasText:/^Write it Up$/}).first().click();await sleep(500);
  await p.evaluate(()=>{U.text='Testville beats Mocktown';render()});await sleep(400);
  const w=await p.evaluate(()=>({mlRow:!!document.querySelector('#main [onclick^="b27Ml("]'),mlFn:typeof b27MlHtml==='function'&&b27MlHtml().length>0}));
  ok('(b) Write It Up shows no ML preset (an ML-ready game exists)',!w.mlRow&&w.mlFn,w);
  await p.evaluate(()=>{window.scrollTo(0,0);document.querySelectorAll("#betc,.toast,[role=status]").forEach(x=>x.hidden=true)});await sleep(3500);await p.screenshot({path:`${OUT}/sh52-writeitup-mobile.png`});console.log('shot',`${OUT}/sh52-writeitup-mobile.png`);
  const q=await p.evaluate(()=>{const g=D.games.find(x=>x.id==='tUp');qbG='tUp';const h=qbHtml(g);return {ok:qbOk(g),len:h.length,ml:/qbMl\(/.test(h),head:h.slice(0,200)}});ok('(b) Quick bet sheet still has ML',q.ml,q);
  await p.evaluate(()=>{qbG=null;qbMl('tUp',1)});await sleep(700);
  const r=await p.evaluate(()=>({tool:!!document.querySelector('.rq-tool[data-v="ml"]'),txt:(document.querySelector('#main')||document.body).innerText.match(/ML[^\n]{0,60}/g)}));
  ok('(b) Request (from Quick bet ML) still has ML',r.tool||(r.txt&&r.txt.length>0),r);
  // (c) place a Write It Up bet: no inline 'Placed!' banner
  await p.locator('button:visible',{hasText:/^Write it Up$/}).first().click();await sleep(500);
  await p.evaluate(()=>{U.opps=['Ana'];U.text='Ben makes more free throws than Ana';U.amt=5;U.wk='season';U.whenPick=true;render()});await sleep(400);
  const clicks=[];for(let i=0;i<3;i++){const pb=p.locator('#b27Place');if(await pb.count()&&await pb.isEnabled()){clicks.push(await pb.innerText());await pb.click()}else{const t=p.locator('button:visible',{hasText:/Yes, place it/}).first();if(await t.count()){clicks.push('alt:'+await t.innerText());await t.click()}}await sleep(900);if(await p.evaluate(()=>U.doc.bets.length>1))break}
  await p.waitForFunction(()=>U.doc.bets.length>1,null,{timeout:8000}).catch(()=>{});await sleep(500);console.log('CLICKS',JSON.stringify(clicks));
  const pl=await p.evaluate(()=>({msg:U.msg,view:OB_VIEW,ok:b27FormOK(),pb:!!document.getElementById('b27Place'),n:U.doc.bets.length,placed:/Placed!/.test(document.body.innerText),err:(document.getElementById('b27Hint')||{}).textContent||'',pop:(()=>{const t=document.getElementById('betc');return t&&!t.hidden?t.textContent:''})()}));console.log(JSON.stringify(pl));
  ok('(c) bet placed, no inline "Placed!" banner',pl.n===2&&!pl.placed,pl);
  ok(WHO+' no page errors',!errs.length,errs);await c.close();
  }
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
