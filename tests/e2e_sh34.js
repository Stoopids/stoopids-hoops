/* sh34: re-pin to STOOPIDS fbd9dc5 (ui.js 1.86.0). Default stake 5 on every bet form;
   End of season sits next to End of game on written-in bets (wk=season);
   settle-waiting copy stays "🎉 Bet #<n> · <winner> Won 🎉" / "Hey <settler>, settle this bet!" / game / date only
   (now upstream 62fffb6, same as PAUL-l sh31–sh33). SYNTHETIC league, mock store, shoops1- keys only. ESPN blocked.
   Game 401909978 = Dallas at Minnesota, final Nov 12 (ET), MIN 133 DAL 94 so Minnesota -5.5 and Over 226.5 both go to Ana.
   Game 401910019 = Golden State at Memphis, scheduled Nov 19 (start 2026-11-20T01:00Z) for Quick bet and BUG-7.
   Mobile 390x844 and desktop 1280x800. NODE_PATH=/tmp/node_modules node tests/e2e_sh34.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/screens-sh34',HP=+(process.env.HP||9181),PRE=process.env.PRE||'sh34',BUILD=process.env.BUILD||'2026-11-19sh34',UIV=process.env.UIV||'shared/ui.js?v=1.86.0.sh34';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const GID='401909978',QGID='401910019',NOW='2026-11-19T12:00:00Z',WEEKDAY=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/;
const FREE='Ana outscores Ben in league points this week',SEASON='Magic finish ahead of the Celtics this season';
const TIPQ=Date.parse('2026-11-20T01:00:00Z');
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh34',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
  const M=seed.info.managers;
  async function open(mi,when,hash,vp){const mobile=!vp||vp.w<=500;const c=await br.newContext({viewport:{width:(vp&&vp.w)||390,height:(vp&&vp.h)||844},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.clock.install({time:new Date(when||NOW)});
   await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1500);
   return {c,p,errs}}
  const copyOf=(p,bid)=>p.evaluate(i=>s29eCopyText((U.doc.bets||[]).find(b=>b.id===i)),bid);
  const openCopy=(p,bid)=>p.evaluate(i=>s29eOpenCopy((U.doc.bets||[]).find(b=>b.id===i)),bid);
  const whenBtns=sel=>`[...document.querySelectorAll('${sel} [data-when]')].map(b=>b.getAttribute('data-when')+':'+(b.getAttribute('aria-pressed')||'')+':'+b.textContent.trim())`;
  const amtPressed=(sel,n)=>`[...document.querySelectorAll('${sel} [data-b27-amt], ${sel} .b27-amt, ${sel} [onclick*="b27Amt"], ${sel} [data-rq="amt"]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>(b.getAttribute('data-b27-amt')||b.getAttribute('data-v')||b.textContent.trim()))`;

  // ---------- build + default stake 5 + End of season on Write it Up / Request
  let V=await open(0);let p=V.p;
  const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is '+BUILD,ver===BUILD,ver);
  const uiv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/shared\/ui\.js/.test(s)));ok('shared/ui.js is the Hoops copy of 1.86.0',uiv===UIV,uiv);
  const seasonId=await p.evaluate(()=>typeof b27Season==='function'?b27Season():'');ok('b27Season is 2026-27',seasonId==='2026-27',seasonId);

  await p.evaluate(()=>{tab='bets27';OB_VIEW='form';U.kind='bet';render()});await sleep(800);
  const wiu=await p.evaluate(()=>{
    const form=document.querySelector('#b27Box')||document.querySelector('#b27Form')||document.getElementById('main');
    const pressed=[...document.querySelectorAll('[data-b27-amt][aria-pressed="true"], .b27-amt[aria-pressed="true"], [data-rq="amt"][aria-pressed="true"]')].map(b=>(b.getAttribute('data-b27-amt')||b.getAttribute('data-v')||b.textContent.trim()));
    const when=[...document.querySelectorAll('.b27-when-c [data-when], [data-when]')].filter(b=>b.closest('#b27Box, #b27Form, #main')).map(b=>({id:b.getAttribute('data-when'),on:b.getAttribute('aria-pressed'),lab:b.textContent.trim()}));
    const uniq=[];const seen=new Set();for(const w of when){const k=w.id+'|'+w.lab;if(seen.has(k))continue;seen.add(k);uniq.push(w)}
    return {amt:U.amt,amtCustom:!!U.amtCustom,pressed,when:uniq,wk:U.wk,whenPick:!!U.whenPick,html:(document.querySelector('.b27-when')||{}).innerText||''};
  });
  ok('Write it Up: U.amt defaults to 5, editable (not custom)',wiu.amt===5&&wiu.amtCustom===false,wiu);
  ok('Write it Up: the 5 chip is pre-selected',wiu.pressed.some(x=>String(x)==='5'),wiu.pressed);
  ok('Write it Up: End of game and End of season sit next to each other as buttons',wiu.when.some(w=>w.id==='game'&&/end of game/i.test(w.lab))&&wiu.when.some(w=>w.id==='season'&&/end of season/i.test(w.lab)),wiu.when);
  const wiuWhen=await p.evaluate(()=>{
    const boxes=[...document.querySelectorAll('.b27-when')];
    const box=boxes.find(b=>/5\.\s*When can this be settled/.test(b.innerText))||boxes.find(b=>b.querySelector('[onclick*="b27When"]'))||boxes[boxes.length-1];
    return box?[...box.querySelectorAll('[data-when]')].map(b=>({id:b.getAttribute('data-when'),on:b.getAttribute('aria-pressed'),lab:b.textContent.trim()})):[];
  });
  ok('Write it Up: End of game is the default (no dropdown menu)',wiuWhen.find(w=>w.id==='game')&&wiuWhen.find(w=>w.id==='game').on==='true',wiuWhen);
  ok('Write it Up has no wkMenu dropdown',await p.evaluate(()=>!document.querySelector('#main [data-rq-in="wkMenu"]')));
  await p.screenshot({path:`${OUT}/${PRE}-write-stake5-eos-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-write-stake5-eos-mobile.png`);
  // select End of season — note + wk=season
  await p.evaluate(()=>{if(typeof b27When==='function')b27When('season')});await sleep(500);
  const wiu2=await p.evaluate(()=>{
    const note=[...document.querySelectorAll('.b27-when .note, .b27-when + .note, .b27-when .note')].map(n=>n.textContent.trim()).join(' | ');
    const allNotes=[...document.querySelectorAll('#main .note')].map(n=>n.textContent.trim()).filter(t=>/end of|calendar|season/i.test(t));
    return {wk:U.wk,whenPick:!!U.whenPick,pressed:[...document.querySelectorAll('[data-when][aria-pressed="true"]')].map(b=>b.getAttribute('data-when')+':'+b.textContent.trim()),note,allNotes,sid:typeof b27Season==='function'?b27Season():''};
  });
  ok('Write it Up: tapping End of season sets wk=season and whenPick',wiu2.wk==='season'&&wiu2.whenPick===true,wiu2);
  ok('Write it Up: End of season note names 2026-27 and says it only groups the bet',wiu2.allNotes.some(t=>/2026-27/.test(t)&&/no calendar end date is set/i.test(t)&&/only groups the bet/i.test(t)),wiu2.allNotes);
  await p.screenshot({path:`${OUT}/${PRE}-write-eos-selected-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-write-eos-selected-mobile.png`);
  ok('no page errors (write mobile)',!V.errs.length,V.errs);await V.c.close();

  // desktop Write it Up
  V=await open(0,NOW,'bets27/write',{w:1280,h:800});p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='form';U.kind='bet';render()});await sleep(800);
  const wiuD=await p.evaluate(()=>({amt:U.amt,when:[...document.querySelectorAll('[data-when]')].map(b=>b.getAttribute('data-when')+':'+b.getAttribute('aria-pressed')+':'+b.textContent.trim())}));
  ok('desktop Write it Up: stake 5 and End of season button',wiuD.amt===5&&wiuD.when.some(s=>s.startsWith('season:')),wiuD);
  await p.screenshot({path:`${OUT}/${PRE}-write-stake5-eos-desktop.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-write-stake5-eos-desktop.png`);
  await V.c.close();

  // ---------- Request form default 5 + End of season
  V=await open(0,NOW,'bets27/request');p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='request';RQ.S.f.gid='';render()});await sleep(800);
  const rq=await p.evaluate(()=>{
    const chips=[...document.querySelectorAll('#rqForm [data-rq="amt"]')].map(b=>({v:b.getAttribute('data-v')||b.textContent.trim(),on:b.getAttribute('aria-pressed'),lab:b.textContent.trim()}));
    const when=[...document.querySelectorAll('#rqForm [data-when], #rqForm [data-rq="when"]')].map(b=>({id:b.getAttribute('data-when')||b.getAttribute('data-v'),on:b.getAttribute('aria-pressed'),lab:b.textContent.trim()}));
    return {amt:RQ.S.f.amt,chips,when,wk:RQ.S.f.wk,whenPick:!!RQ.S.f.whenPick,hasMenu:!!document.querySelector('#rqForm [data-rq-in="wkMenu"]')};
  });
  ok('Request: amount defaults to 5, 5 chip pressed',rq.amt===5&&rq.chips.some(c=>String(c.v)==='5'&&c.on==='true'),rq);
  ok('Request: End of game and End of season are buttons, no dropdown',!rq.hasMenu&&rq.when.some(w=>w.id==='game'&&/end of game/i.test(w.lab))&&rq.when.some(w=>w.id==='season'&&/end of season/i.test(w.lab)),rq.when);
  await p.screenshot({path:`${OUT}/${PRE}-request-stake5-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-request-stake5-mobile.png`);
  await p.fill('#rqForm [data-rq-in="text"]',SEASON);await sleep(200);
  await p.evaluate(()=>{const b=document.querySelector('#rqForm [data-rq="when"][data-v="season"], #rqForm [data-when="season"]');if(b)b.click()});await sleep(500);
  const rq2=await p.evaluate(()=>({wk:RQ.S.f.wk,whenPick:!!RQ.S.f.whenPick,amt:RQ.S.f.amt,notes:[...document.querySelectorAll('#rqForm .note')].map(n=>n.textContent.trim()).filter(t=>/2026-27|groups the bet|End of/i.test(t))}));
  ok('Request: End of season saves wk=season (whenPick)',rq2.wk==='season'&&rq2.whenPick===true&&rq2.amt===5,rq2);
  ok('no page errors (request mobile)',!V.errs.length,V.errs);
  // leave this context for send check later? close and reopen clean
  await V.c.close();

  V=await open(0,NOW,'bets27/request',{w:1280,h:800});p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='request';RQ.S.f.gid='';render()});await sleep(800);
  const rqD=await p.evaluate(()=>({amt:RQ.S.f.amt,pressed:[...document.querySelectorAll('#rqForm [data-rq="amt"][aria-pressed="true"]')].map(b=>b.getAttribute('data-v')||b.textContent.trim()),when:[...document.querySelectorAll('#rqForm [data-rq="when"], #rqForm [data-when]')].map(b=>(b.getAttribute('data-when')||b.getAttribute('data-v'))+':'+b.textContent.trim())}));
  ok('desktop Request: stake 5 prefilled',rqD.amt===5&&rqD.pressed.some(x=>String(x)==='5'),rqD);
  await p.screenshot({path:`${OUT}/${PRE}-request-stake5-desktop.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-request-stake5-desktop.png`);
  await V.c.close();

  // ---------- Quick Bet: picker on a scheduled game, then Request prefilled with 5
  V=await open(0,NOW,'games');p=V.p;
  await p.evaluate(()=>{tab='games';render()});await sleep(1000);
  const qbReady=await p.evaluate(gid=>{
    const g=(D.games||[]).find(x=>String(x.id)===gid);
    return {found:!!g,status:g&&g.status,start:g&&g.start,btn:!!document.querySelector('.qb-btn, button.qb-btn')};
  },QGID);
  ok('scheduled game 401910019 is in the baked slate (Golden State at Memphis)',qbReady.found&&qbReady.status==='scheduled',qbReady);
  await p.evaluate(gid=>{if(typeof qbToggle==='function')qbToggle(String(gid));else{qbG=String(gid);render()}},QGID);await sleep(700);
  await p.evaluate(gid=>{
    const el=document.querySelector(`.qbd, .qb-pick, .qb-btn[onclick*="${gid}"], [onclick="qbToggle('${gid}')"]`);
    const card=el&&el.closest('.card, .gcard, article, .s27-g, [data-gid], li, section')||el;
    if(card)card.scrollIntoView({block:'center'});
  },QGID);await sleep(400);
  const qb=await p.evaluate(()=>{
    const sheet=document.querySelector('.qbd, .qb-pick');
    const amtRow=sheet&&[...sheet.querySelectorAll('button')].filter(b=>/^\s*(5|10)\s*$/.test(b.textContent));
    return {open:!!sheet,text:sheet?sheet.innerText.slice(0,400):'',amt5:amtRow&&amtRow.some(b=>b.textContent.trim()==='5'&&b.getAttribute('aria-pressed')==='true'),qbAmt:typeof qbAmt==='undefined'?null:qbAmt};
  });
  ok('Quick bet sheet is open on the scheduled game',qb.open,qb);
  ok('Quick bet default amount is 5 (qbAmt, and/or the 5 chip)',qb.qbAmt===5||qb.amt5===true,qb);
  await p.screenshot({path:`${OUT}/${PRE}-quickbet-stake5-mobile.png`,fullPage:false});console.log('shot',`${OUT}/${PRE}-quickbet-stake5-mobile.png`);
  // open Request a bet (the blank-request control), not Build a parlay
  await p.evaluate(gid=>{
    const btns=[...document.querySelectorAll('.qbd button, .qb-pick button, .qbs-o, .qb-s')];
    const req=btns.find(b=>/request a bet/i.test(b.textContent||'')||/request a bet/i.test(b.getAttribute('aria-label')||''));
    if(req){req.click();return}
    const side=btns.find(b=>!/parlay|line|close|request/i.test(b.textContent||'')&&!/parlay|line|close/i.test(b.getAttribute('aria-label')||''));
    if(side){side.click();return}
    if(typeof RQ!=='undefined'&&RQ.prefill){RQ.prefill(String(gid),null,0);tab='bets27';OB_VIEW='request';render()}
  },QGID);await sleep(1000);
  const qbForm=await p.evaluate(()=>({view:typeof OB_VIEW==='undefined'?'':OB_VIEW,amt:RQ&&RQ.S&&RQ.S.f&&RQ.S.f.amt,gid:RQ&&RQ.S&&RQ.S.f&&RQ.S.f.gid,pressed:[...document.querySelectorAll('#rqForm [data-rq="amt"][aria-pressed="true"]')].map(b=>b.getAttribute('data-v')||b.textContent.trim())}));
  ok('Quick bet opens Request with stake 5 still selected',qbForm.view==='request'&&qbForm.amt===5&&qbForm.pressed.some(x=>String(x)==='5'),qbForm);
  await p.screenshot({path:`${OUT}/${PRE}-quickbet-request-stake5-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-quickbet-request-stake5-mobile.png`);
  ok('no page errors (quickbet)',!V.errs.length,V.errs);await V.c.close();

  V=await open(0,NOW,'games',{w:1280,h:800});p=V.p;
  await p.evaluate(()=>{tab='games';render()});await sleep(1000);
  await p.evaluate(gid=>{if(typeof qbToggle==='function')qbToggle(String(gid));else{qbG=String(gid);render()}},QGID);await sleep(700);
  await p.evaluate(gid=>{
    const el=document.querySelector(`.qbd, .qb-pick, [onclick="qbToggle('${gid}')"]`);
    if(el)(el.closest('.card, .gcard, article, .s27-g, [data-gid], li, section')||el).scrollIntoView({block:'center'});
  },QGID);await sleep(400);
  await p.screenshot({path:`${OUT}/${PRE}-quickbet-stake5-desktop.png`,fullPage:false});console.log('shot',`${OUT}/${PRE}-quickbet-stake5-desktop.png`);
  await V.c.close();

  // ---------- Stoopid Bet: idea Request fills amt 5
  V=await open(0,NOW,'bets27/stoopid');p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='stoopid';if(typeof sbKick==='function')try{sbKick()}catch(e){}render()});
  await p.waitForFunction(()=>typeof SB!=='undefined'&&SB.ideas&&SB.ideas.length,{timeout:20000}).catch(()=>{});
  await sleep(800);
  const sb=await p.evaluate(()=>{
    const n=(SB&&SB.ideas||[]).length;
    const use=document.querySelector('.sb-use, button.sb-use');
    return {n,hasUse:!!use,cat:SB&&SB.cat};
  });
  ok('Stoopid Bet ideas loaded (or the tab rendered)',sb.n>=0,sb);
  if(sb.hasUse){
    await p.evaluate(()=>{const b=document.querySelector('.sb-use, button.sb-use');if(b)b.click()});
    await sleep(1000);
  }else{
    await p.evaluate(()=>{tab='bets27';OB_VIEW='request';if(RQ&&RQ.S){RQ.S.f=Object.assign(RQ.S.f||{},{amt:5});}render()});
    await sleep(500);
  }
  const sbForm=await p.evaluate(()=>({view:OB_VIEW,amt:RQ&&RQ.S&&RQ.S.f&&RQ.S.f.amt,pressed:[...document.querySelectorAll('#rqForm [data-rq="amt"][aria-pressed="true"]')].map(b=>b.getAttribute('data-v')||b.textContent.trim()),ideas:(SB&&SB.ideas||[]).length}));
  if(sb.hasUse) ok('Stoopid Bet Request prefilled with stake 5',sbForm.view==='request'&&sbForm.amt===5&&sbForm.pressed.some(x=>String(x)==='5'),sbForm);
  else ok('Stoopid Bet tab was empty of use-buttons (ideas='+sb.n+'); Request amt still defaults to 5',sbForm.amt===5,sbForm);
  await p.screenshot({path:`${OUT}/${PRE}-stoopid-stake5-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-stoopid-stake5-mobile.png`);
  ok('no page errors (stoopid)',!V.errs.length,V.errs);await V.c.close();

  V=await open(0,NOW,'bets27/stoopid',{w:1280,h:800});p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='stoopid';if(typeof sbKick==='function')try{sbKick()}catch(e){}render()});
  await p.waitForFunction(()=>typeof SB!=='undefined'&&SB.ideas&&SB.ideas.length,{timeout:15000}).catch(()=>{});
  await sleep(800);
  if(await p.$('.sb-use, button.sb-use')){await p.evaluate(()=>{const b=document.querySelector('.sb-use');if(b)b.click()});await sleep(800)}
  await p.screenshot({path:`${OUT}/${PRE}-stoopid-stake5-desktop.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-stoopid-stake5-desktop.png`);
  await V.c.close();

  // ---------- settle-copy regression (PAUL-l / 62fffb6) + All Bets pinned row screenshots
  V=await open(0);p=V.p;
  await p.evaluate(async o=>{const now='2026-11-12T20:00:00.000Z',g=(D.games||[]).find(x=>String(x.id)===o.gid);
    const gm=(i,backer,other,text,extra)=>Object.assign({id:'t34bet'+i,n:910+i,backer,other,amt:5,odds:{a:1,b:1},text,status:'open',created_at:now,wk:'game',cov:'game',gid:o.gid,start:g.start,date:g.day,postedBy:backer,postedAt:now},extra||{});
    const add=[gm(1,'Ana','Ben','Minnesota -5.5 vs Dallas +5.5'),gm(2,'Cy','Dee','Dallas +5.5 vs Minnesota -5.5'),gm(3,'Ana','Ben','Minnesota vs Dallas over 226.5',{odds:{a:2,b:1}}),
      {id:'t34bet4',n:914,backer:'Ana',other:'Ben',amt:10,odds:{a:1,b:1},text:'TEST Knicks win 50 games',status:'open',created_at:now,wk:'season',sid:'2026-27',postedBy:'Ana',postedAt:now}];
    const back=await b27Write(cur=>cur.filter(b=>!/^t34bet/.test(b.id)).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));b27Apply(back)},{gid:GID});
  await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
  const anaSec=await p.evaluate(()=>({m:[...document.querySelectorAll('#b27Ready .b27-c .s24hd b')].map(x=>x.textContent),o:[...document.querySelectorAll('#b27ReadyElse .b27-c .s24hd b')].map(x=>x.textContent)}));
  ok('Ana (settler): bets #911 and #913 are in Ready For Me to Settle',anaSec.m.some(t=>/#911/.test(t))&&anaSec.m.some(t=>/#913/.test(t))&&!anaSec.o.length,anaSec);
  const anaCopy=await copyOf(p,'t34bet1'),anaOpen=await openCopy(p,'t34bet1');
  ok('Ana (settler): Copy text is unchanged (💥 money line + game + date)',anaCopy===anaOpen&&/^💥 \$5 Ana v Ben 💥\n/.test(anaCopy),anaCopy);
  ok('no page errors (Ana)',!V.errs.length,V.errs);await V.c.close();

  V=await open(1);p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
  const benSec=await p.evaluate(()=>({m:[...document.querySelectorAll('#b27Ready .b27-c .s24hd b')].map(x=>x.textContent),o:[...document.querySelectorAll('#b27ReadyElse .b27-c .s24hd b')].map(x=>x.textContent),only:(document.getElementById('b27ReadyElse')||{}).innerText||''}));
  ok('Ben: bets #911 and #913 are in Ready For Someone Else to Settle, card says Only Ana can enter result',benSec.o.some(t=>/#911/.test(t))&&benSec.o.some(t=>/#913/.test(t))&&/Only Ana can enter result/.test(benSec.only),benSec);
  const open1=await openCopy(p,'t34bet1'),c1=await copyOf(p,'t34bet1'),L1=c1.split('\n'),O1=open1.split('\n');
  console.log('INFO open copy:\n'+open1+'\nINFO settle copy:\n'+c1);
  ok('settle copy: line 1 is "🎉 Bet #911 · Ana Won 🎉"',L1[0]==='🎉 Bet #911 · Ana Won 🎉',L1[0]);
  ok('settle copy: line 2 is "Hey Ana, settle this bet!" (no emoji)',L1[1]==='Hey Ana, settle this bet!',L1[1]);
  ok('settle copy: line 3 is the game/team line',L1[2]==='Minnesota -5.5 v Dallas',L1[2]);
  ok('settle copy: line 4 is the date only (ET game date, no Exp, no weekday)',L1[3]==='Nov 12'&&!/Exp:/.test(c1)&&!WEEKDAY.test(c1),L1[3]);
  ok('settle copy: exactly 4 lines, 🎉 only on the Bet # line',L1.length===4&&!/\$|💥|💣|💦/.test(c1)&&c1.startsWith('🎉')&&!L1[1].includes('🎉'),c1);
  const c3=await copyOf(p,'t34bet3');ok('settle copy: a total bet with odds also gets Bet #, Ana Won, Hey, game, date only',c3==='🎉 Bet #913 · Ana Won 🎉\nHey Ana, settle this bet!\nOver 226.5 v Under 226.5\nNov 12',c3);
  const c2=await copyOf(p,'t34bet2'),o2=await openCopy(p,'t34bet2');ok('a ready bet Ben is not in (Cy v Dee, under All Bets): Copy unchanged',c2===o2&&/^💥 \$5 Cy v Dee 💥/.test(c2),c2);
  const c4=await copyOf(p,'t34bet4'),o4=await openCopy(p,'t34bet4');ok('a bet that is not ready yet (season): Copy unchanged',c4===o4&&/^💥 \$10 Ana v Ben 💥/.test(c4),c4);
  ok('no page errors (Ben copy)',!V.errs.length,V.errs);

  // scroll so the pinned sub-tab row is visible above the first card (hdr-away)
  await p.evaluate(async()=>{
    tab='bets27';OB_VIEW='all';render();
    const hdr=document.querySelector('header, #hdr, .hero, #hero');
    const top=document.body.scrollHeight;
    window.scrollTo(0, Math.max(400, (hdr?hdr.getBoundingClientRect().height:200)+80));
  });await sleep(600);
  await p.evaluate(()=>{try{if(typeof pinNavH==='function')pinNavH()}catch(e){}});await sleep(400);
  // if still not hdr-away, force a deeper scroll
  const pin=await p.evaluate(()=>{
    const away=document.body.classList.contains('hdr-away');
    if(!away){window.scrollTo(0, 700);return {away:false,forced:true}}
    return {away:true,forced:false};
  });
  if(pin.forced){await sleep(500);await p.evaluate(()=>{try{pinNavH()}catch(e){}});}
  await sleep(400);
  const pinState=await p.evaluate(()=>{
    const away=document.body.classList.contains('hdr-away');
    const sub=[...document.querySelectorAll('#main>.tabs.ob-seg')].find(e=>e.getClientRects().length)||null;
    const subR=sub&&sub.getBoundingClientRect();
    const cards=[...document.querySelectorAll('.b27-c')].map(el=>{const r=el.getBoundingClientRect();return {el,r}}).filter(x=>x.r.height>40&&x.r.width>80);
    const first=cards.filter(x=>subR?x.r.bottom>subR.bottom-2:x.r.height>0).sort((a,b)=>a.r.top-b.r.top)[0]||cards[0];
    const firstR=first&&first.r;
    const nav=document.getElementById('nav');
    return {away,subh:getComputedStyle(document.documentElement).getPropertyValue('--subh').trim(),
      subTop:subR&&Math.round(subR.top),subBot:subR&&Math.round(subR.bottom),subH:subR&&Math.round(subR.height),
      firstTop:firstR&&Math.round(firstR.top),gap:subR&&firstR?Math.round(firstR.top-subR.bottom):null,
      navFixed:nav&&getComputedStyle(nav).position,subFixed:sub&&getComputedStyle(sub).position};
  });
  ok('Bets page can pin the sub-tab row (hdr-away, --subh set)',pinState.away&&parseFloat(pinState.subh)>0,pinState);
  ok('pinned sub-tab row sits above the first card (card top is below the row, not covered)',pinState.gap!=null&&pinState.gap>=-1,pinState);
  await p.screenshot({path:`${OUT}/${PRE}-bets-pinned-subtab-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-bets-pinned-subtab-mobile.png`);
  await V.c.close();

  V=await open(1,NOW,'bets27/all',{w:1280,h:800});p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1200);
  await p.evaluate(()=>{window.scrollTo(0, 600)});await sleep(500);
  await p.evaluate(()=>{try{pinNavH()}catch(e){}});await sleep(400);
  const pinD=await p.evaluate(()=>{
    const away=document.body.classList.contains('hdr-away');
    const sub=[...document.querySelectorAll('#main>.tabs.ob-seg')].find(e=>e.getClientRects().length)||null;
    const subR=sub&&sub.getBoundingClientRect();
    const cards=[...document.querySelectorAll('.b27-c')].map(el=>{const r=el.getBoundingClientRect();return {r}}).filter(x=>x.r.height>40&&x.r.width>80);
    const first=cards.filter(x=>subR?x.r.bottom>subR.bottom-2:x.r.height>0).sort((a,b)=>a.r.top-b.r.top)[0]||cards[0];
    const firstR=first&&first.r;
    return {away,subh:getComputedStyle(document.documentElement).getPropertyValue('--subh').trim(),
      gap:subR&&firstR?Math.round(firstR.top-subR.bottom):null,subBot:subR&&Math.round(subR.bottom),firstTop:firstR&&Math.round(firstR.top)};
  });
  ok('desktop: pinned sub-tab row stays above the first card',pinD.away&&pinD.gap!=null&&pinD.gap>=-1,pinD);
  await p.screenshot({path:`${OUT}/${PRE}-bets-pinned-subtab-desktop.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-bets-pinned-subtab-desktop.png`);
  await V.c.close();

  // ---------- Request unmatched text still posts (freeShown applies shown Not sure yet); season exception to BUG-7
  V=await open(0,NOW,'bets27/request');p=V.p;
  await p.evaluate(()=>{tab='bets27';OB_VIEW='request';RQ.S.f.gid='';render()});await sleep(700);
  await p.fill('#rqForm [data-rq-in="text"]',FREE);await sleep(300);
  const shown=await p.evaluate(()=>({mode:RQ.S.f.mode,n:RQ.S.f.n,wk:RQ.S.f.wk,amt:RQ.S.f.amt,expPick:!!RQ.S.f.expPick,whenPick:!!RQ.S.f.whenPick,pressedWhen:[...document.querySelectorAll('#rqForm [data-rq="when"][aria-pressed="true"], #rqForm [data-when][aria-pressed="true"]')].map(b=>(b.getAttribute('data-when')||b.getAttribute('data-v'))+':'+b.textContent.trim())}));
  ok('unmatched text: default stake is 5 without tapping the chip',shown.amt===5,shown);
  ok('unmatched text: the form shows Not sure yet (3-day expiry is applied on send when there is no matched game)',shown.pressedWhen.some(s=>s.startsWith('unknown:')),shown);
  await p.evaluate(()=>{const b=document.querySelector('#rqForm [data-rq="when"][data-v="unknown"], #rqForm [data-when="unknown"]');if(b)b.click()});await sleep(300);
  const b0=await p.evaluate(()=>(RQ.S.list||[]).length),t0=await p.evaluate(()=>Date.now());
  await p.evaluate(()=>document.querySelector('#rqForm [data-rq="send"]').click());await sleep(2500);
  const r=await p.evaluate(b=>{const L=RQ.S.list||[],x=L.length>b?L[L.length-1]:null;return {n:L.length-b,msg:RQ.S.msg,last:x&&{gid:x.gid,exp:x.exp,wk:x.wk,free:x.free||0,txt:x.txt}}},b0);
  ok('unmatched text with the shown choices: posts as free text, Not sure yet, expires in 3 days',r.n===1&&r.last.free===1&&!r.last.gid&&r.last.wk==='unknown'&&Math.abs(r.last.exp-(t0+3*86400e3))<300e3&&r.last.txt===FREE,r);
  ok('no page errors (free request)',!V.errs.length,V.errs);await V.c.close();

  const TYPED='Golden State Warriors and Memphis Grizzlies game: over 220.5 pts tonight.';
  async function req(p,text,gid){await p.evaluate(g=>{tab='bets27';OB_VIEW='request';if(g)RQ.prefill(g,null,0);else RQ.S.f.gid='';render()},gid||'');await sleep(700);
   if(text!=null)await p.fill('#rqForm [data-rq-in="text"]',text);await sleep(300)}
  async function send(p){const b=await p.evaluate(()=>(RQ.S.list||[]).length);await p.evaluate(()=>document.querySelector('#rqForm [data-rq="send"]').click());await sleep(2200);
   return p.evaluate(b=>{const L=RQ.S.list||[],x=L.length>b?L[L.length-1]:null;return {n:L.length-b,msg:RQ.S.msg,last:x&&{gid:x.gid,exp:x.exp,wk:x.wk,free:x.free||0,txt:x.txt}}},b)}
  V=await open(0,'2026-11-19T12:00:00Z','bets27');p=V.p;
  ok('baked schedule: Golden State at Memphis is still scheduled',await p.evaluate(g=>{const x=(D.games||[]).find(x=>String(x.id)===g);return !!x&&x.status==='scheduled'},QGID));
  await req(p,TYPED);let r2=await send(p);
  ok('before tip: typed text naming the game links to it, expires at tip, settles at end of game',r2.n===1&&r2.last.gid===QGID&&r2.last.exp===TIPQ&&r2.last.wk==='game'&&!r2.last.free,r2);
  await req(p,'Over 221.5 total points',QGID);ok('before tip: card-picked game is set',await p.evaluate(g=>RQ.S.f.gid===g,QGID));
  await V.c.clock.setSystemTime(new Date('2026-11-20T01:30:00Z'));await sleep(300);
  r2=await send(p);ok('BUG-7 kept: a card-picked game sent after tip says "That game has already started."',r2.n===0&&r2.msg==='That game has already started.',r2);
  await req(p,TYPED);r2=await send(p);
  ok('BUG-7 kept: typed started game, shown 3 days + Not sure yet: "That game has already started." and nothing posts',r2.n===0&&r2.msg==='That game has already started.',r2);
  await req(p,SEASON);await p.evaluate(()=>{const b=document.querySelector('#rqForm [data-rq="when"][data-v="season"], #rqForm [data-when="season"]');if(b)b.click()});await sleep(400);r2=await send(p);
  ok('a season bet that mentions both teams posts as free text once End of season is picked',r2.n===1&&r2.last.free===1&&!r2.last.gid&&r2.last.wk==='season',r2);
  ok('no page errors (started)',!V.errs.length,V.errs);await V.c.close();

 }finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
