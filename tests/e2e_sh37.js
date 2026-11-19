/* sh37: re-pin to STOOPIDS main 60a3280 (ui.js 1.86.4). Checks the three upstream changes Paul approved plus the Copy fix:
   d630bd1 settled copy = "🎉 Bet #n · Settled · X won 🎉" / one-sided spread / date / "$5 A v B" (wash 💦 both ends);
   f9077b2 an open multi-spot request stays "Awaiting acceptance" after one spot is taken, and request stakes read "5K";
   bbda85b All Bets no longer scroll-snaps, and an open spread bet card shows one side ("Minnesota -5.5 v Dallas");
   6457e61/6d30c54 request Copy is a compact 59x36 button (now upstream, no Hoops patch).
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. ESPN/textdb blocked. Mobile 412x915, desktop 1280x800.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh37.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/screens-sh37',HP=+(process.env.HP||9701),PRE=process.env.PRE||'sh37',BUILD=process.env.BUILD||'2026-11-19sh37',UIV='shared/ui.js?v=1.86.4.sh37';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const GID='401909978',QGID='401910019',NOW='2026-11-19T12:00:00Z',WEEKDAY=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/;
const SETTLED='🎉 Bet #701 · Settled · Ana won 🎉\nMinnesota -5.5 v Dallas\nNov 12\n$5 Ana v Ben';
const WASH='💦 Bet #702 · Wash 💦\nMinnesota -5.5 v Dallas\nNov 12\n$5 Ana v Ben\nResult: 💦: nobody owes anything';
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh37',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});const M=seed.info.managers;
  async function open(mi,vp,hash){const mobile=vp.w<=500;const c=await br.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,timezoneId:'Asia/Jakarta'});
   await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));window.__clip=[];const cl=navigator.clipboard;if(cl){cl.writeText=t=>{window.__clip.push(String(t));return Promise.resolve()}}},{id,me:{mid:M[mi].id,k:M[mi].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1000);return {c,p,errs}}
  // seed as Ana: settled + wash + open spread bets, and requests (multi-spot with one spot taken, single from Ben)
  let V=await open(0,{w:412,h:915});let p=V.p;
  const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is '+BUILD,ver===BUILD,ver);
  const uiv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/shared\/ui\.js/.test(s)));ok('shared/ui.js is the Hoops copy of 1.86.4',uiv===UIV,uiv);
  const sbv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/stoopid-bet\.js/.test(s)));ok('no Stoopid Bet redesign (stoopid-bet.js still v14)',/stoopid-bet\.js\?v=14\./.test(sbv||''),sbv);
  await p.evaluate(async o=>{const now='2026-11-12T20:00:00.000Z',settled='2026-11-13T12:00:00.000Z',g=(D.games||[]).find(x=>String(x.id)===o.gid),q=(D.games||[]).find(x=>String(x.id)===o.qgid);
   const rdSp={k:'spread',t:'Minnesota',o:'Dallas',l:-5.5,sp:'mcbb',d:'2026-11-12'};
   const base=(id,n,extra)=>Object.assign({id,n,backer:'Ana',other:'Ben',amt:5,odds:{a:1,b:1},text:'Minnesota -5.5 vs Dallas +5.5, Nov 12',status:'open',created_at:now,wk:'game',cov:'game',gid:o.gid,start:g.start,date:g.day,rd:rdSp,postedBy:'Ana',postedAt:now},extra||{});
   const add=[base('sh37b01',701,{status:'backer',settled_at:settled}),base('sh37b02',702,{status:'push',settled_at:settled}),
    base('sh37o01',703,{text:'Golden State -3.5 vs Memphis +3.5',gid:o.qgid,start:q.start,date:q.day,rd:{k:'spread',t:'Golden State',o:'Memphis',l:-3.5,sp:'mcbb',d:q.day}})];
   const back=await b27Write(cur=>cur.filter(b=>!/^sh37/.test(b.id)).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));b27Apply(back,'force');
   const exp=Date.parse(q.start);
   const reqs=[{id:'sh37rq1',n:1,by:'Ana',to:['Ben','Cy','Dee','Eli','Fay'],slots:3,amt:5,odds:[1,1],txt:'Golden State +6.5 vs Memphis -6.5',lab:'Golden State +6.5 vs Memphis -6.5',exp,start:q.start,status:'open',dec:[],took:[{m:'Ben',at:'2026-11-19T11:00:00.000Z'}],cov:'game',wk:'game',gid:o.qgid,rd:{k:'spread',t:'Golden State',o:'Memphis',l:6.5,d:q.day}},
    {id:'sh37rq2',n:2,by:'Ben',to:['Ana','Cy','Dee','Eli','Fay'],amt:5,odds:[1,1],txt:'Memphis -4.5 vs Golden State +4.5',lab:'Memphis -4.5 vs Golden State +4.5',exp,start:q.start,status:'open',dec:[],took:[],cov:'game',wk:'game',gid:o.qgid,rd:{k:'spread',t:'Memphis',o:'Golden State',l:-4.5,d:q.day}}];
   await fetch(HOOPS.url('requests-2627'),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({v:1,reqs})});if(RQ.load)await RQ.load()},{gid:GID,qgid:QGID});
  await V.c.close();
  for(const [vp,tag] of [[{w:412,h:915},'mobile'],[{w:1280,h:800},'desktop']]){
   V=await open(0,vp);p=V.p;
   // ---- d630bd1: settled + wash copy text, and the Copy button on the settled card
   const txt=await p.evaluate(()=>{const f=i=>s29eCopyText((U.doc.bets||[]).find(b=>b.id===i));return {s:f('sh37b01'),w:f('sh37b02')}});
   ok(tag+' d630bd1: settled copy is 🎉 / one-sided spread / date / $5 Ana v Ben',txt.s===SETTLED,txt.s);
   ok(tag+' d630bd1: wash copy keeps 💦 at both ends',txt.w===WASH,txt.w);
   ok(tag+' dates only in copy',!WEEKDAY.test(txt.s+txt.w));
   await p.evaluate(()=>{tab='bets27';OB_VIEW='tally';render()});await sleep(900);
   const tb=p.locator('[data-s27-copy="sh37b01"]').first();await tb.waitFor({state:'visible',timeout:10000});await tb.scrollIntoViewIfNeeded();await tb.click();
   await p.waitForFunction(()=>{const b=document.querySelector('[data-s27-copy="sh37b01"]');return b&&b.textContent==='Copied'},{timeout:5000}).catch(()=>{});
   const clip=await p.evaluate(()=>window.__clip.slice(-1)[0]||'');ok(tag+' d630bd1: settled card Copy copies that text',clip===SETTLED,clip);
   const card=p.locator('[data-s27-copy="sh37b01"]').first().locator('xpath=ancestor::*[contains(@class,"card")][1]');
   await card.screenshot({path:`${OUT}/${PRE}-settled-copied-${tag}.png`});console.log('shot',`${OUT}/${PRE}-settled-copied-${tag}.png`);
   // ---- All Bets: f9077b2 request cards + bbda85b
   await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
   const rq=await p.evaluate(()=>[...document.querySelectorAll('.rq-card')].map((c,i)=>{c.id='sh37rqc'+i;const cp=[...c.querySelectorAll('button')].find(b=>b.textContent.trim()==='Copy');const r=cp&&cp.getBoundingClientRect();return {id:c.id,t:c.innerText.replace(/\s+/g,' ').trim(),spots:!!c.querySelector('[data-rq="close"]'),copy:r?Math.round(r.width)+'x'+Math.round(r.height):''}}));
   const multi=rq.find(x=>x.spots),other=rq.find(x=>/Memphis -4\.5/.test(x.t));
   ok(tag+' f9077b2: multi-spot request with a spot taken still says Awaiting acceptance',multi&&/Awaiting acceptance/.test(multi.t)&&!/Awaiting settlement/.test(multi.t),multi&&multi.t.slice(0,120));
   ok(tag+' f9077b2: request stakes read 5K',multi&&/\b5K Golden State \+6\.5/.test(multi.t)&&other&&/\b5K Memphis -4\.5/.test(other.t),[multi&&multi.t.slice(0,90),other&&other.t.slice(0,90)]);
   ok(tag+' Copy is a compact 59x36 button on the Spots / Close card and on someone else\'s card',multi&&multi.copy==='59x36'&&other&&other.copy==='59x36',[multi&&multi.copy,other&&other.copy]);
   if(multi){const l=p.locator('#'+multi.id);await l.scrollIntoViewIfNeeded();await l.screenshot({path:`${OUT}/${PRE}-multispot-taken-${tag}.png`});console.log('shot',`${OUT}/${PRE}-multispot-taken-${tag}.png`)}
   const open1=await p.evaluate(()=>{const c=[...document.querySelectorAll('.b27-c, .card')].find(x=>/#703\b/.test(x.innerText||''));return c?c.innerText.replace(/\s+/g,' '):''});
   ok(tag+' bbda85b: open spread bet card shows one side (Golden State -3.5 v Memphis)',/Golden State -3\.5 v Memphis/.test(open1)&&!/Memphis \+3\.5/.test(open1),open1.slice(0,160));
   await p.evaluate(()=>{const m=document.getElementById('main');window.scrollTo(0,600);if(m)m.scrollTop=400});await sleep(700);
   const snap=await p.evaluate(()=>{const m=document.getElementById('main');const kids=[...m.querySelectorAll(':scope>.card,:scope>h2,:scope .b27-grid>.card')].slice(0,30);return {main:getComputedStyle(m).scrollSnapType,align:[...new Set(kids.map(k=>getComputedStyle(k).scrollSnapAlign))],away:document.body.classList.contains('hdr-away')}});
   ok(tag+' bbda85b: All Bets has no scroll snapping',(snap.main==='none'||snap.main==='')&&snap.align.every(a=>a==='none'),snap);
   await p.evaluate(()=>{window.scrollTo(0,0);const m=document.getElementById('main');if(m)m.scrollTop=0});await sleep(500);
   await p.screenshot({path:`${OUT}/${PRE}-allbets-${tag}.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-allbets-${tag}.png`);
   ok(tag+' no page errors',!V.errs.length,V.errs);await V.c.close()}
 }catch(e){nf++;console.log('FAIL exception',e&&e.stack||e)}finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})();
