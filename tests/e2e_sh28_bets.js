/* sh28 PAUL-j / PAUL-k: Bets page sections and the toast, on a SYNTHETIC league in the local mock store (never textdb.dev, no real league).
   Two managers' views (the settler and the non-settler), phone 412x915 and desktop 1280x900.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh28_bets.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||9011);fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const ORDER=['Requested By A Stoopid','Requested By Me','Ready For Me to Settle','Ready For Someone Else to Settle','All Bets'];
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh28 bets',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
  const M=seed.info.managers;
  async function open(mi,w,h,mob){const c=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:mob?2:1,isMobile:mob,hasTouch:mob,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.route(/textdb\.dev|espn\.com\/apis/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/api\/ping|textdb|espn|ERR_FAILED/.test(m.text()+((m.location()||{}).url||'')))errs.push(m.text())});
   for(let k=0;k<3;k++){try{await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets27`);await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});break}catch(e){await sleep(1000)}}
   await sleep(2000);return {c,p,errs}}
  async function postReq(p,label){await p.evaluate(()=>{tab='bets27';OB_VIEW=innerWidth<1000?'request':'form';render()});await sleep(1200);
   const gid=await p.evaluate(()=>{const g=(D.games||[]).filter(g=>g.status==='scheduled'&&Date.parse(g.start)>Date.now()+3*3600e3)[2];return String(g.id)});
   const b=await p.evaluate(()=>(RQ.S.list||[]).length);
   await p.evaluate(o=>{Object.assign(RQ.S.f,{gid:o.gid,cov:'game',text:o.label,amt:10,amtC:false,to:[],parlay:false});render.rqSelf=true;try{render()}finally{render.rqSelf=false}},{gid,label});await sleep(500);
   await p.evaluate(()=>{const x=document.querySelector('#rqForm [data-rq="send"]');x.click()});await sleep(2500);return p.evaluate(b=>({n:(RQ.S.list||[]).length-b,msg:RQ.S.msg,bad:RQ.S.bad}),b)}
  // 1) each side posts one request (shared mock store), so each view has one by me and one by a Stoopid
  let A=await open(0,412,915,true),B=await open(1,412,915,true);
  const ra=await postReq(A.p,'TEST Ana request: Boston wins'),rb=await postReq(B.p,'TEST Ben request: Denver wins');ok('synthetic requests posted by Ana and Ben',ra.n>=1&&rb.n>=1,{ra,rb});
  // 2) synthetic agreed bets, written through the page's own ledger write to the mock store
  const nm=await A.p.evaluate(()=>({me:b27Who(),all:b27OwnerNames()}));const [Ana,Ben,Cy,Dee]=['Ana','Ben','Cy','Dee'];ok('synthetic manager names present',['Ana','Ben','Cy','Dee'].every(n=>nm.all.includes(n))&&nm.me==='Ana',nm);
  await A.p.evaluate(async o=>{const today=SHARED_UI.estToday(),now=new Date().toISOString(),fut='2026-12-24';const mk=(i,backer,other,est,text)=>({id:'t28bet'+i,n:900+i,backer,other,amt:5,odds:{a:1,b:1},text,status:'open',created_at:now,wk:'date',est,postedBy:backer,postedAt:now});
    const add=[mk(1,o.Ana,o.Ben,today,'TEST Minnesota -5.5 vs Dallas +5.5'),mk(2,o.Ben,o.Ana,today,'TEST Boston -3 vs Miami +3'),mk(3,o.Cy,o.Dee,today,'TEST Denver beats Utah'),mk(4,o.Ana,o.Cy,fut,'TEST Knicks win 50 games'),mk(5,o.Ben,o.Ana,fut,'TEST Wemby 30 points tonight')];
    const back=await b27Write(cur=>cur.filter(b=>!/^t28bet/.test(b.id)).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));b27Apply(back)},{Ana,Ben,Cy,Dee});
  await A.c.close();await B.c.close();
  for(const [T,w,h,mob] of [['mobile',412,915,true],['desktop',1280,900,false]]){
   for(const [who,mi] of [['settler',0],['nonsettler',1]]){
    const V=await open(mi,w,h,mob);const p=V.p;
    await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1800);
    const r=await p.evaluate(()=>{const hs=[...document.querySelectorAll('#main h2')].map(x=>({t:x.textContent.replace(/\s+/g,' ').trim(),y:x.getBoundingClientRect().top}));
      const sec=id=>{const s=document.getElementById(id);return s?[...s.querySelectorAll('.b27-c .s24hd b')].map(b=>b.textContent.trim()):null};
      const pin=document.getElementById('rqPinned');const rq=pin?[...pin.querySelectorAll('.rq-h')].map(h=>({t:h.textContent.trim(),n:h.nextElementSibling&&h.nextElementSibling.matches('.rq-grid')?h.nextElementSibling.children.length:(h.nextElementSibling.nextElementSibling||{children:[]}).children.length})):[];
      return {me:b27Who(),heads:hs.map(x=>x.t),rq,mine:sec('b27Ready'),other:sec('b27Ready2'),okCard:!!document.querySelector('#main .card.b27-ok'),cardStyle:[...document.querySelectorAll('#b27Ready .b27-c, #b27Ready2 .b27-c')].map(c=>c.className)}});
    console.log('  ',T,who,JSON.stringify(r));
    const order=ORDER.map(t=>r.heads.findIndex(x=>x.startsWith(t)));
    ok(`${T} ${who}: five sections in Paul's order with counts`,order.every(i=>i>=0)&&order.every((v,i)=>!i||v>order[i-1])&&/Requested By A Stoopid 1/.test(r.heads.join('|'))&&/Requested By Me 1/.test(r.heads.join('|'))&&/Ready For Me to Settle 1/.test(r.heads.join('|'))&&/Ready For Someone Else to Settle 1/.test(r.heads.join('|')),r.heads);
    const mineN=who==='settler'?'TEST Minnesota':'TEST Boston',othN=who==='settler'?'TEST Boston':'TEST Minnesota';
    const txt=await p.evaluate(()=>({m:(document.getElementById('b27Ready')||{}).innerText||'',o:(document.getElementById('b27Ready2')||{}).innerText||''}));
    ok(`${T} ${who}: Ready For Me to Settle has only the bet I settle (with the Who won? buttons)`,txt.m.includes(mineN)&&!txt.m.includes(othN)&&/Who won\?/.test(txt.m),txt.m.slice(0,160));
    ok(`${T} ${who}: Ready For Someone Else to Settle has the bet the other side settles ("Only X can enter result.")`,txt.o.includes(othN)&&!txt.o.includes(mineN)&&/Only .+ can enter result/.test(txt.o)&&!/Who won\?/.test(txt.o),txt.o.slice(0,160));
    const allTxt=await p.evaluate(()=>document.body.innerText);ok(`${T} ${who}: a ready bet I am not in (Cy v Dee) is under All Bets, not in either Ready list`,/TEST Denver/.test(allTxt)&&!txt.m.includes('Denver')&&!txt.o.includes('Denver'));
    ok(`${T} ${who}: same STOOPIDS card style in both Ready sections`,r.cardStyle.length===2&&r.cardStyle.every(c=>/card b27-c b27-ready/.test(c)),r.cardStyle);
    await p.evaluate(()=>{const s=document.getElementById('rqPinned');(s||document.getElementById('main')).scrollIntoView({block:'start'});window.scrollBy(0,-130)});await sleep(500);
    await p.screenshot({path:`${OUT}/sh28-bets-sections-${who}-${T}.png`,fullPage:true});
    if(who==='settler'&&T==='mobile'){
      // toast: settle my ready bet (two taps, as on the card) -> 'Saved.' pops up, no status bar card
      await p.evaluate(()=>{b27Ask('t28bet1','backer')});await sleep(400);const pre=await p.evaluate(()=>({ask:U.askSettle,me:b27Who(),b:(U.doc.bets||[]).find(b=>b.id==='t28bet1')}));console.log('   pre-settle',JSON.stringify(pre).slice(0,300));await p.evaluate(()=>{b27SetStatus('t28bet1','backer')});
      let t=null;for(let k=0;k<30&&!(t&&t.vis);k++){await sleep(150);t=await p.evaluate(()=>{const x=document.getElementById('s24t');return {vis:!!x&&!x.hidden,txt:x?x.textContent:'',bar:!!document.querySelector('#main .card.b27-ok')}})}
      await p.screenshot({path:`${OUT}/sh28-bets-toast-saved-${T}.png`});
      console.log('   after',JSON.stringify(await p.evaluate(()=>({msg:U.msg,bad:U.msgBad,st:((U.doc.bets||[]).find(b=>b.id==='t28bet1')||{}).status}))));ok('mobile: settling shows the "Saved." toast and no status bar card',t&&t.vis&&/Saved\./.test(t.txt)&&!t.bar,t);
      await sleep(3200);const gone=await p.evaluate(()=>{const x=document.getElementById('s24t');return !x||x.hidden});ok('mobile: the toast goes away by itself',gone);
      // put the bet back open for the other views (synthetic only)
      await p.evaluate(async()=>{const back=await b27Write(cur=>cur.map(b=>b.id==='t28bet1'?Object.assign({},b,{status:'open',settled_at:null}):b),cur=>cur.some(b=>b.id==='t28bet1'&&b.status==='open'));b27Apply(back)});
    }
    ok(`${T} ${who}: no page errors`,V.errs.length===0,V.errs.slice(0,3));await V.c.close()}}
 }finally{await br.close();mock.kill()}console.log(nf?nf+' failed':'all passed');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
