/* sh24 screenshots on SYNTHETIC local data only (mock store, never textdb.dev). Every league is named "TEST SYNTHETIC ...".
   NODE_PATH=/tmp/node_modules MODE=board|archive|pick TAG=before|after OUT=dir node tests/shots_sh24.js */
const { chromium } = require('playwright-core');
const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',MODE=process.env.MODE||'board',TAG=process.env.TAG||'after',HP=+(process.env.HP||8961);fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const archKey=c=>{let h=0x811c9dc5;c=String(c||'').toUpperCase();for(let i=0;i<c.length;i++){h^=c.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return ('0000000'+h.toString(16)).slice(-8)};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const VP=[['mobile',390,860,true],['desktop',1280,900,false]];
  async function ctxFor(v,init){const c=await br.newContext({viewport:{width:v[1],height:v[2]},deviceScaleFactor:v[3]?2:1,isMobile:v[3],hasTouch:v[3],timezoneId:'America/New_York'});
   await c.route(/textdb\.dev|espn\.com|espncdn/,r=>r.abort());await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');if(o)for(const k in o)localStorage.setItem(k,o[k])},init||null);return c}
  if(MODE==='board'||MODE==='pick'){
   const names=[['Ana','TEST Aces','🏀'],['Ben','TEST A Very Long Team Name For Width','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers of the East','🦅'],['Eli','TEST E','🐻'],['Fay','TEST Flyers','🚀']];
   const id=await seed(API,{managers:6,rounds:5,live:true,clockSecs:3600,picksMade:MODE==='pick'?8:14,name:'TEST SYNTH 24 board',names});const cmS=seed.info.cmSecret,me=seed.info.managers[0];
   for(const v of VP){if(MODE==='pick'&&v[0]==='desktop'&&!process.env.PICKDESK)continue;const c=await ctxFor(v);const p=await c.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
    await p.goto(`http://127.0.0.1:${HP}/room.html?l=${id}#as=${me.id}&k=${me.k}&cm=${cmS}`);await sleep(3500);
    if(MODE==='board'){await p.evaluate(()=>{const t=document.querySelector('#tab_board');if(t)t.click()});await sleep(1500);
     await p.screenshot({path:`${OUT}/sh24-board-${TAG}-${v[0]}.png`,fullPage:true});console.log('shot',`sh24-board-${TAG}-${v[0]}.png`);
     const m=await p.evaluate(()=>{const th=[...document.querySelectorAll('table.board thead th:not(.rh)')].map(x=>Math.round(x.getBoundingClientRect().width));const td=[...document.querySelectorAll('table.board tbody tr:first-child td:not(.rh)')].map(x=>Math.round(x.getBoundingClientRect().width));
       const nm=[...document.querySelectorAll('table.board thead th:not(.rh) .tn')].map(x=>Math.round(x.getBoundingClientRect().width));const chips=[...document.querySelectorAll('table.board tbody td .chip')].map(x=>Math.round(x.getBoundingClientRect().width));return {th,td,nm,chipMin:Math.min(...chips),chipMax:Math.max(...chips)}});
     console.log(v[0],JSON.stringify(m))}
    else{await p.evaluate(()=>{const t=document.querySelector('#tab_more');if(t)t.click()});await sleep(1200);
     const el=await p.$('#cmpickcard');await p.evaluate(()=>{const c=document.querySelector('#cmpickcard');if(c)c.scrollIntoView({block:'center'})});await sleep(400);
     const r0=await p.evaluate(()=>({btn:(document.querySelector('#cmpickgo')||{}).textContent,dis:(document.querySelector('#cmpickgo')||{}).disabled}));console.log('on-clock',JSON.stringify(r0));await p.screenshot({path:`${OUT}/sh24-pickteam-${v[0]}.png`,fullPage:true});console.log('shot',`sh24-pickteam-${v[0]}.png`);
     if(el){await p.selectOption('#cmpickmgr',{index:1}).catch(()=>{});await sleep(300);const bb=await p.evaluate(()=>{const r=document.querySelector('#cmpickcard').getBoundingClientRect();return {x:r.left,y:r.top+scrollY,width:r.width,height:r.height}});await p.screenshot({path:`${OUT}/sh24-pickteam-card-${v[0]}.png`,fullPage:true,clip:{x:Math.max(0,bb.x-8),y:Math.max(0,bb.y-8),width:bb.width+16,height:bb.height+16}});
      const r=await p.evaluate(()=>({btn:(document.querySelector('#cmpickgo')||{}).textContent,dis:(document.querySelector('#cmpickgo')||{}).disabled,note:(document.querySelector('#cmpicknote')||{}).textContent}));console.log(JSON.stringify(r))
      const oc=await p.evaluate(()=>[...document.querySelectorAll('#cmpickmgr option')].find(o=>/on the clock/.test(o.textContent)).value);await p.selectOption('#cmpickmgr',oc);await sleep(300);const want=await p.evaluate(()=>{const s=document.querySelector('#cmpickteam');return s.options[s.selectedIndex].textContent});
      await p.evaluate(()=>document.querySelector('#cmpickgo').click());let t='';for(let k=0;k<20&&!/drafted/.test(t);k++){await sleep(300);t=await p.evaluate(()=>(document.getElementById('toast')||{}).innerText||'')}
      const on2=await p.evaluate(()=>[...document.querySelectorAll('#cmpickmgr option')].find(o=>/on the clock/.test(o.textContent)).value);console.log('pick saved',/drafted/.test(t)&&on2!==oc?'PASS':'FAIL',JSON.stringify({toast:t,want}))}}
    await c.close()}}
  if(MODE==='archive'){
   const names=[['Kentut','TEST Gas','💨'],['Mark','TEST Dubs','🌉'],['Jake','TEST Sixers','🔔'],['Kurmoji','TEST Chitwoods','🦠'],['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥']];
   const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTH 24',names});const me=seed.info.managers[4];
   const real=fs.readFileSync(path.join(HROOT,'js/hoops-archive.js'),'utf8');const k0=/HOOPS_ARCHIVES=\{"([0-9a-f]{8})"/.exec(real)[1];
   for(const v of VP){const c=await ctxFor(v,{['shoops.me.'+id]:JSON.stringify({mid:me.id,k:me.k})});
    /* the synthetic league shows the real sheet data: the archive file is re-keyed to the synthetic league code (local only) */
    await c.route(/js\/hoops-archive\.js/,async r=>{r.fulfill({status:200,contentType:'application/javascript',body:real.replace('"'+k0+'"','"'+archKey(id)+'"')})});
    const p=await c.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
    await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#archive`);await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok',{timeout:40000}).catch(()=>{});await sleep(2500);
    await p.evaluate(()=>{document.querySelectorAll('body *').forEach(e=>{const c=getComputedStyle(e);if(c.position==='fixed'&&e.getBoundingClientRect().top>innerHeight/2)e.style.visibility='hidden'})});/* full-page shot only: the floating Online bar and Chat button would otherwise be painted over the middle of the long page */await p.screenshot({path:`${OUT}/sh24-archive-${v[0]}.png`,fullPage:true});console.log('shot',`sh24-archive-${v[0]}.png`);
    await p.evaluate(()=>{archSel='2023-24';render()});await sleep(800);await p.evaluate(()=>{document.querySelectorAll('body *').forEach(e=>{const c=getComputedStyle(e);if(c.position==='fixed'&&e.getBoundingClientRect().top>innerHeight/2)e.style.visibility='hidden'})});await p.screenshot({path:`${OUT}/sh24-archive-2023-24-${v[0]}.png`,fullPage:true});
    await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#standings`);await sleep(3500);
    const tr=await p.evaluate(()=>{const A=window.ARCHIVE;return {alltime:(A.alltime||[]).map(x=>x.person+'>'+(x.current_owner||'-')+':'+x.title_seasons.length),gold:D.owners.map(o=>o.name+':'+goldN(o.name)),txt:[...document.querySelectorAll('#main *')].filter(e=>/🏆/.test(e.textContent)&&e.children.length===0).slice(0,4).map(e=>e.parentElement.textContent.replace(/\s+/g,' ').slice(0,80))}});console.log(v[0],JSON.stringify(tr));
    await p.screenshot({path:`${OUT}/sh24-archive-trophies-${v[0]}.png`,fullPage:false});
    await c.close()}}
 }finally{await br.close();mock.kill()}process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
