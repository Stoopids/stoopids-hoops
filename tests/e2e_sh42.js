/* sh42: mirror STOOPIDS PR #86 (712232c): anyone in the bet can settle. SYNTHETIC league, mock store, shoops1- keys only, TEST names.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh42.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh42',HP=+(process.env.HP||9871),BUILD=process.env.BUILD||'2026-11-23sh42',NOW='2026-11-23T05:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh42',names:NAMES});const M=seed.info.managers;
  const at='2026-11-20T01:00:00.000Z',base={amt:5,odds:{a:1,b:1},created_at:at,postedAt:at,status:'open',settled_at:null,wk:'date',est:'2026-11-21',rd:{k:'manual'}};
  const bets={v:1,bets:[Object.assign({id:'v25t42a',n:1,backer:'Ana',other:'Ben',postedBy:'Ana',text:'TEST Ana beats Ben at HORSE'},base),Object.assign({id:'v25t42b',n:2,backer:'Cy',other:'Dee',postedBy:'Ana',text:'TEST Cy beats Dee at HORSE'},base)]};
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(bets)});
  async function view(i,vp){const mobile=vp.w<=500;const c=await br.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,timezoneId:'America/New_York'});
   await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   const posts=[];c.on('request',q=>{if(q.method()!=='GET'&&/bets-2627/.test(q.url()))posts.push(q.url())});
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[i].id,k:M[i].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&U.doc&&U.doc.bets&&U.doc.bets.length,{timeout:40000});
   await p.evaluate(()=>{obView('all')});await sleep(900);return {c,p,errs,posts}}
  const card=(p,n)=>p.evaluate(n=>{const b=U.doc.bets.find(x=>x.n===n);const el=document.getElementById('bet-'+b.id)||[...document.querySelectorAll('.b27-c')].find(e=>e.innerText.includes('Bet #'+n+' '));return el?el.innerText.replace(/\s+/g,' '):''},n);
  // 1) Ben = participant who is not the backer
  for(const [tag,vp] of [['mobile',{w:412,h:915}],['desktop',{w:1280,h:800}]]){const v=await view(1,vp);const p=v.p;
   const r=await p.evaluate(()=>({who:b27Who(),ready:(document.getElementById('b27Ready')||{}).innerText||''}));
   if(tag==='mobile'){ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
    ok('Ben (other side, not backer, not poster) gets bet #1 in Ready For Me to Settle with Who won?',r.who==='Ben'&&/Ready For Me to Settle/.test(r.ready)&&/Bet #1/.test(r.ready)&&/Who won\?/.test(r.ready)&&/Ana won/.test(r.ready)&&/Ben won/.test(r.ready)&&!/Only people/.test(r.ready),r.ready.replace(/\s+/g,' ').slice(0,300))}
   const sec=p.locator('#b27Ready');await sec.scrollIntoViewIfNeeded();await sleep(300);const f=`${OUT}/sh42-ben-ready-${tag}.png`;await p.screenshot({path:f});console.log('shot',f);
   if(tag==='desktop'){await p.locator('#b27Ready button',{hasText:'Ben won'}).first().click();await sleep(400);await p.locator('#b27Ready button',{hasText:/Tap again to settle #1/}).first().click();await sleep(3500);
    const st=await p.evaluate(()=>({st:U.doc.bets.find(x=>x.n===1).status,msg:U.msg}));ok('Ben settles #1 (two taps) -> status other',st.st==='other',st)}
   ok(tag+': no page errors',!v.errs.length,v.errs);await v.c.close()}
  // 2) Eli = not in either bet
  {const v=await view(4,{w:412,h:915});const t=await card(v.p,2);const ready=await v.p.evaluate(()=>!!document.getElementById('b27Ready'));
   ok('Eli (not in the bet) sees "Only people in the bet can settle it." and no Who won?',/Only people in the bet can settle it\./.test(t)&&!/Who won\?/.test(t)&&!ready,t.slice(0,240));await v.c.close()}
  // 3) Ana posted #2 but is not in it
  {const v=await view(0,{w:412,h:915});const t=await card(v.p,2);
   const r=await v.p.evaluate(async()=>{const b=U.doc.bets.find(x=>x.n===2);const can=b27CanSettle(b,'Ana');U.askSettle={id:b.id,what:'backer',terms:b27Terms(b),at:Date.now()};await b27SetStatus(b.id,'backer');return {can,msg:U.msg,st:U.doc.bets.find(x=>x.n===2).status}});
   ok('Ana (poster, not in #2) cannot settle: no Who won?, note shown, b27SetStatus refused, no save',!r.can&&/Only people in the bet can settle it\./.test(t)&&!/Who won\?/.test(t)&&r.msg==='Only people in the bet can settle it.'&&r.st==='open'&&!v.posts.length,{r,posts:v.posts.length,t:t.slice(0,200)});await v.c.close()}
 }catch(e){nf++;console.log('ERR',e.message)}finally{await br.close();mock.kill()}console.log(nf?'FAILED '+nf:'ALL PASS');process.exit(nf?1:0)})();
