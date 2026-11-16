/* sh31: PAUL-l (Copy text on a bet in "Ready For Someone Else to Settle") + STOOPIDS 59c9dc1 (ui.js 1.85.0: the shown expiry / "Not sure yet" count as the pick on an unmatched Request).
   SYNTHETIC league in the local mock store (never textdb.dev, no real league, shoops1- keys only). ESPN blocked so the baked schedule is used.
   Game 401909978 = Dallas at Minnesota, final Nov 12 (ET). Mobile 412x915.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh31.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||9051),PRE=process.env.PRE||'sh31',BUILD=process.env.BUILD||'2026-11-16sh31';fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const GID='401909978',NOW='2026-11-16T12:00:00Z',WEEKDAY=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/;
const FREE='Ana outscores Ben in league points this week';
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh31',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
  const M=seed.info.managers;
  async function open(mi,when,hash){const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.clock.install({time:new Date(when||NOW)});
   await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1500);
   return {c,p,errs}}
  const clip=p=>p.evaluate(()=>navigator.clipboard.readText().catch(()=>''));
  const copyOf=(p,bid)=>p.evaluate(i=>s29eCopyText((U.doc.bets||[]).find(b=>b.id===i)),bid);
  const openCopy=(p,bid)=>p.evaluate(i=>s29eOpenCopy((U.doc.bets||[]).find(b=>b.id===i)),bid);

  // ---------- synthetic bets (written through the page's own ledger write to the mock store)
  let V=await open(0);let p=V.p;
  const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is '+BUILD,ver===BUILD,ver);
  const uiv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/shared\/ui\.js/.test(s)));ok('shared/ui.js is the Hoops copy of 1.85.0',uiv==='shared/ui.js?v=1.85.0.sh31',uiv);
  await p.evaluate(async o=>{const now='2026-11-12T20:00:00.000Z',g=(D.games||[]).find(x=>String(x.id)===o.gid);
    const gm=(i,backer,other,text,extra)=>Object.assign({id:'t31bet'+i,n:910+i,backer,other,amt:5,odds:{a:1,b:1},text,status:'open',created_at:now,wk:'game',cov:'game',gid:o.gid,start:g.start,date:g.day,postedBy:backer,postedAt:now},extra||{});
    const add=[gm(1,'Ana','Ben','Minnesota -5.5 vs Dallas +5.5'),gm(2,'Cy','Dee','Dallas +5.5 vs Minnesota -5.5'),gm(3,'Ana','Ben','Minnesota vs Dallas over 226.5',{odds:{a:2,b:1}}),
      {id:'t31bet4',n:914,backer:'Ana',other:'Ben',amt:10,odds:{a:1,b:1},text:'TEST Knicks win 50 games',status:'open',created_at:now,wk:'season',postedBy:'Ana',postedAt:now}];
    const back=await b27Write(cur=>cur.filter(b=>!/^t31bet/.test(b.id)).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));b27Apply(back)},{gid:GID});
  // Ana placed bets 1 and 3: Ana's view = "Ready For Me to Settle", copy unchanged
  await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
  const anaSec=await p.evaluate(()=>({m:[...document.querySelectorAll('#b27Ready .b27-c .s24hd b')].map(x=>x.textContent),o:[...document.querySelectorAll('#b27ReadyElse .b27-c .s24hd b')].map(x=>x.textContent)}));
  ok('Ana (settler): bets #911 and #913 are in Ready For Me to Settle',anaSec.m.some(t=>/#911/.test(t))&&anaSec.m.some(t=>/#913/.test(t))&&!anaSec.o.length,anaSec);
  const anaCopy=await copyOf(p,'t31bet1'),anaOpen=await openCopy(p,'t31bet1');
  ok('Ana (settler): Copy text is unchanged (💥 money line + game + date)',anaCopy===anaOpen&&/^💥 \$5 Ana v Ben 💥\n/.test(anaCopy),anaCopy);
  ok('no page errors (Ana)',!V.errs.length,V.errs);await V.c.close();

  // ---------- Ben's view: bets 1 and 3 are "Ready For Someone Else to Settle" (Ana settles)
  V=await open(1);p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
  const benSec=await p.evaluate(()=>({m:[...document.querySelectorAll('#b27Ready .b27-c .s24hd b')].map(x=>x.textContent),o:[...document.querySelectorAll('#b27ReadyElse .b27-c .s24hd b')].map(x=>x.textContent),only:(document.getElementById('b27ReadyElse')||{}).innerText||''}));
  ok('Ben: bets #911 and #913 are in Ready For Someone Else to Settle, card says Only Ana can enter result',benSec.o.some(t=>/#911/.test(t))&&benSec.o.some(t=>/#913/.test(t))&&/Only Ana can enter result/.test(benSec.only),benSec);
  const open1=await openCopy(p,'t31bet1'),c1=await copyOf(p,'t31bet1'),L1=c1.split('\n'),O1=open1.split('\n');
  console.log('INFO before (sh30) copy:\n'+open1+'\nINFO after (sh31) copy:\n'+c1);
  ok('PAUL-l: line 1 is "Hey Ana, settle this bet!"',L1[0]==='Hey Ana, settle this bet!',L1[0]);
  ok('PAUL-l: line 2 is the game/team line, unchanged',L1[1]===O1[1]&&L1[1]==='Minnesota -5.5 v Dallas',L1[1]);
  ok('PAUL-l: line 3 is the date + expiry, unchanged (ET game date, no weekday)',L1[2]===O1[2]&&L1[2]==='Nov 12 \u00b7 Exp: Tip'&&!WEEKDAY.test(c1),L1[2]);
  ok('PAUL-l: exactly 3 lines, no emoji, no amount, nothing after',L1.length===3&&!/\$|💥|💣|🎉|💦/.test(c1)&&!/\s$/.test(c1),c1);
  const c3=await copyOf(p,'t31bet3');ok('PAUL-l: a total bet with odds also gets the 3 lines (no odds/amount line)',/^Hey Ana, settle this bet!\nOver 226\.5 v Under 226\.5\nNov 12 · Exp: Tip$/.test(c3),c3);
  const c2=await copyOf(p,'t31bet2'),o2=await openCopy(p,'t31bet2');ok('a ready bet Ben is not in (Cy v Dee, under All Bets): Copy unchanged',c2===o2&&/^💥 \$5 Cy v Dee 💥/.test(c2),c2);
  const c4=await copyOf(p,'t31bet4'),o4=await openCopy(p,'t31bet4');ok('a bet that is not ready yet (season): Copy unchanged',c4===o4&&/^💥 \$10 Ana v Ben 💥/.test(c4),c4);
  // tap the real Copy button on the card
  await p.evaluate(()=>navigator.clipboard.writeText(''));
  const btnSel='#b27ReadyElse [data-s27-copy="t31bet1"]';ok('the card in Ready For Someone Else to Settle has a Copy button',await p.$(btnSel)!==null);
  await p.evaluate(()=>{const s=document.getElementById('b27ReadyElse');s.scrollIntoView({block:'start'});window.scrollBy(0,-70)});await sleep(400);
  await p.screenshot({path:`${OUT}/${PRE}-ready-else-card-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-ready-else-card-mobile.png`);
  await p.tap(btnSel);await sleep(250);const pasted=await clip(p);
  ok('tapping Copy puts the new text on the clipboard',pasted===c1,pasted);
  // test-only: show the clipboard text under the section so the screenshot shows what was copied (not part of the app)
  await p.evaluate(t=>{const d=document.createElement('div');d.id='t31paste';d.style.cssText='margin:10px 0;padding:10px;border:2px dashed #888;border-radius:10px;background:#fff;color:#111;font:15px/1.4 system-ui;white-space:pre-wrap';d.textContent='TEST ONLY · clipboard after tapping Copy on Bet #911:\n\n'+t;const s=document.getElementById('b27ReadyElse');s.querySelector('.b27-grid').before(d)},pasted);
  await sleep(200);await p.screenshot({path:`${OUT}/${PRE}-ready-else-copied-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-ready-else-copied-mobile.png`);
  ok('no page errors (Ben)',!V.errs.length,V.errs);await V.c.close();

  // ---------- STOOPIDS 59c9dc1: the shown expiry (3 days) and "Not sure yet" count as the pick on unmatched text
  V=await open(0,NOW,'bets27');p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='request';RQ.S.f.gid='';render()});await sleep(700);
  await p.fill('#rqForm [data-rq-in="text"]',FREE);await sleep(300);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#rqForm .b27-amt')].find(x=>x.textContent.trim()==='5');if(b)b.click()});await sleep(500);
  const shown=await p.evaluate(()=>({mode:(document.querySelector('#rqForm [data-rq-in="mode"]')||{}).value,wk:(document.querySelector('#rqForm [data-rq-in="wkMenu"]')||{}).value,f:{mode:RQ.S.f.mode,n:RQ.S.f.n,wk:RQ.S.f.wk,expPick:!!RQ.S.f.expPick,whenPick:!!RQ.S.f.whenPick}}));
  ok('unmatched text: the form shows a 3-day expiry and Not sure yet',shown.f.mode==='d'&&+shown.f.n===3&&shown.f.wk==='unknown',shown);
  // re-tapping the already shown "Not sure yet" (focus + blur, no change event) now counts
  await p.focus('#rqForm [data-rq-in="wkMenu"]');await p.evaluate(()=>document.activeElement.blur());await sleep(400);
  ok('re-selecting the shown "Not sure yet" counts as the pick (blur commits it)',await p.evaluate(()=>!!RQ.S.f.whenPick&&RQ.S.f.wk==='unknown'));
  await p.screenshot({path:`${OUT}/${PRE}-request-notsure-form-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-request-notsure-form-mobile.png`);
  const b0=await p.evaluate(()=>(RQ.S.list||[]).length),t0=await p.evaluate(()=>Date.now());
  await p.evaluate(()=>document.querySelector('#rqForm [data-rq="send"]').click());await sleep(2500);
  const r=await p.evaluate(b=>{const L=RQ.S.list||[],x=L.length>b?L[L.length-1]:null;return {n:L.length-b,msg:RQ.S.msg,last:x&&{gid:x.gid,exp:x.exp,wk:x.wk,free:x.free||0,txt:x.txt}}},b0);
  ok('unmatched text with the shown choices: posts as free text, Not sure yet, expires in 3 days',r.n===1&&r.last.free===1&&!r.last.gid&&r.last.wk==='unknown'&&Math.abs(r.last.exp-(t0+3*86400e3))<300e3&&r.last.txt===FREE,r);
  ok('no page errors (request)',!V.errs.length,V.errs);await V.c.close();
  // BUG-7 still holds on 1.85.0. Game 401909994 = Orlando at Boston, tip 7:00 pm ET Nov 16 (00:00Z Nov 17), still scheduled in the baked schedule.
  const G2='401909994',TIP2=Date.parse('2026-11-17T00:00:00Z'),TYPED='Orlando Magic and Boston Celtics game: over 220.5 pts tonight.',SEASON='Magic finish ahead of the Celtics this season';
  async function req(p,text,gid){await p.evaluate(g=>{tab='bets27';OB_VIEW='request';if(g)RQ.prefill(g,null,0);else RQ.S.f.gid='';render()},gid||'');await sleep(700);
   if(text!=null)await p.fill('#rqForm [data-rq-in="text"]',text);await sleep(300);
   await p.evaluate(()=>{const b=[...document.querySelectorAll('#rqForm .b27-amt')].find(x=>x.textContent.trim()==='5');if(b)b.click()});await sleep(500)}
  async function send(p){const b=await p.evaluate(()=>(RQ.S.list||[]).length);await p.evaluate(()=>document.querySelector('#rqForm [data-rq="send"]').click());await sleep(2200);
   return p.evaluate(b=>{const L=RQ.S.list||[],x=L.length>b?L[L.length-1]:null;return {n:L.length-b,msg:RQ.S.msg,last:x&&{gid:x.gid,exp:x.exp,wk:x.wk,free:x.free||0,txt:x.txt}}},b)}
  V=await open(0,'2026-11-16T20:00:00Z','bets27');p=V.p;
  ok('baked schedule: Orlando at Boston is still scheduled',await p.evaluate(g=>{const x=(D.games||[]).find(x=>String(x.id)===g);return !!x&&x.status==='scheduled'},G2));
  await req(p,TYPED);let r2=await send(p);
  ok('before tip: typed text naming the game links to it, expires at tip, settles at end of game',r2.n===1&&r2.last.gid===G2&&r2.last.exp===TIP2&&r2.last.wk==='game'&&!r2.last.free,r2);
  await req(p,'Over 221.5 total points',G2);ok('before tip: card-picked game is set',await p.evaluate(g=>RQ.S.f.gid===g,G2));
  await V.c.clock.setSystemTime(new Date('2026-11-17T00:30:00Z'));await sleep(300);
  r2=await send(p);ok('BUG-7 kept: a card-picked game sent after tip says "That game has already started."',r2.n===0&&r2.msg==='That game has already started.',r2);
  await req(p,TYPED);r2=await send(p);
  ok('BUG-7 kept: typed started game, shown 3 days + Not sure yet: "That game has already started." and nothing posts',r2.n===0&&r2.msg==='That game has already started.',r2);
  await p.screenshot({path:`${OUT}/${PRE}-request-started-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-request-started-mobile.png`);
  await req(p,SEASON);await p.selectOption('#rqForm [data-rq-in="wkMenu"]','season');await sleep(400);r2=await send(p);
  ok('a season bet that mentions both teams posts as free text once End of season is picked',r2.n===1&&r2.last.free===1&&!r2.last.gid&&r2.last.wk==='season',r2);
  ok('no page errors (started)',!V.errs.length,V.errs);await V.c.close();
 }finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
