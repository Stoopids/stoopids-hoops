/* sh40: mirror STOOPIDS 531503a (PR #83). Moneyline in Quick bet and Request on NBA data (ESPN aml/hml), half-step odds, $5 minimum, one-row Request tools.
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. NODE_PATH=/tmp/node_modules node tests/e2e_sh40.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh40',HP=+(process.env.HP||9961),BUILD='2026-11-21sh40',NOW='2026-11-20T12:00:00Z',GID='401909305';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh40',names:NAMES});const M=seed.info.managers;
  const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[0].id,k:M[0].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#games`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(800);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  const q=await p.evaluate(g=>{const x=D.games.find(x=>String(x.id)===g);return {line:x&&x.line,q:x&&SHARED_UI.mlQuote(x),qbOk:x&&qbOk(x)}},GID);
  ok('NBA game has ESPN moneyline and quotes 2-1 (Charlotte +217)',!!q.q&&q.q.label==='2-1'&&q.qbOk,q);
  // Quick bet sheet
  await p.evaluate(g=>{tab='games';render();qbToggle(g)},GID);await sleep(700);
  const qb=await p.evaluate(()=>{const s=document.querySelector('.qbd');return s?s.innerText.replace(/\s+/g,' '):''});
  ok('Quick bet shows ML pills with $5 / $10 and no Change the line',/ML/.test(qb)&&/\$5 to win \$10/.test(qb)&&/\$10 to win \$5/.test(qb)&&!/Change the line/.test(qb),qb);
  const l=p.locator('.qbd');await l.scrollIntoViewIfNeeded();await sleep(300);await l.screenshot({path:`${OUT}/sh40-1-quickbet-mobile.png`});console.log('shot',`${OUT}/sh40-1-quickbet-mobile.png`);
  // tap Charlotte ML (away, i=0) -> Request prefilled with moneyline
  await p.locator('.qbd button',{hasText:/to win \$10/}).first().click();await sleep(1000);
  const rf=await p.evaluate(()=>{const f=RQ.S.f;return {text:f.text,odds:f.odds,kind:f.lineKind,rd:f.rd,amt:f.amt,tools:[...document.querySelectorAll('.rq-tools .rq-tool')].map(b=>b.textContent),body:(document.querySelector('.rq-form')||document.body).innerText.replace(/\s+/g,' ')}});
  ok('Quick bet ML opens Request with Charlotte ML v Atlanta at 2-1',rf.kind==='ml'&&/Charlotte ML v Atlanta/.test(rf.text)&&JSON.stringify(rf.odds)==='[2,1]'&&rf.rd&&rf.rd.ml===1,{text:rf.text,odds:rf.odds,rd:rf.rd});
  ok('Request: one row of pills Parlay · Moneyline · Change the line',JSON.stringify(rf.tools)==='["Parlay","Moneyline","Change the line"]',rf.tools);
  const m=rf.body.match(/[^.]*risks \$[\d.]+ to win \$[\d.]+[^.]*\.[^.]*\./);
  ok('Request payout: Ana risks $5 to win $10; the other side risks $10 to win $5',!!m&&/risks \$5 to win \$10 if Charlotte wins/.test(m[0])&&/risks \$10 to win \$5 if Atlanta wins/.test(m[0]),m&&m[0]);
  const pills=p.locator('.rq-tools');await pills.scrollIntoViewIfNeeded();await sleep(200);
  await p.screenshot({path:`${OUT}/sh40-2-request-pills-mobile.png`});console.log('shot',`${OUT}/sh40-2-request-pills-mobile.png`);
  // open the Moneyline pill to show both sides with odds/amounts
  await p.locator('.rq-tools .rq-tool',{hasText:'Moneyline'}).click();await sleep(600);
  const body=await p.evaluate(()=>{const b=document.querySelector('.rq-tool-body');return b?b.innerText.replace(/\s+/g,' '):''});
  ok('Moneyline open: Charlotte $5 to win $10 and Atlanta $10 to win $5',/Charlotte \$5 to win \$10/.test(body)&&/Atlanta \$10 to win \$5/.test(body),body);
  await p.locator('.rq-tool-body').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollBy?0:0);await sleep(200);
  await p.screenshot({path:`${OUT}/sh40-3-moneyline-selected-mobile.png`});console.log('shot',`${OUT}/sh40-3-moneyline-selected-mobile.png`);
  ok('no page errors',!errs.length,errs);await c.close();
 }catch(e){nf++;console.log('FAIL exception',e&&e.stack||e)}finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})();
