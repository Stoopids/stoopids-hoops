/* sh38: BUG-8 Bets pin keeps the scrolled distance (no jump back when the header leaves) + BUG-9 league title never flashes the default name, fits beside Share.
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. ESPN/textdb blocked. Desktop 1280x800 + 1440x900, mobile 412x915.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh38.js   (ROOT=<other checkout> SHOTS=before to shoot the old build) */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=process.env.ROOT||path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/screens-sh38',HP=+(process.env.HP||9861),TAG=process.env.SHOTS||'after',BUILD=process.env.BUILD||'2026-11-20sh38';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const DEF=String.fromCharCode(83,84,79,79,80,73,68,83)+' HOOPS';
(async()=>{const mock=await srv([process.execPath,path.join(__dirname,'../tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(__dirname,'seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'STOOP HOOPS',names:NAMES});const M=seed.info.managers;
  await fetch(API+'shoops1-'+id.toLowerCase()+'-bets-2627',{method:'POST',headers:{'Content-Type':'text/plain'},body:fs.readFileSync(path.join(__dirname,'fixtures_sh38_bets.json'),'utf8')});
  async function ctx(vp,o={}){const mobile=vp.w<=500;const c=await br.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,timezoneId:'Asia/Jakarta'});
   await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   if(o.slowMeta)await c.route(/-meta(\?|$)/,async r=>{await sleep(1500);r.continue()});
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me));
     window.__fr=[];const t=()=>{const h=document.getElementById('hoopsLg');if(h){const r=h.getBoundingClientRect(),b=document.getElementById('s12Share'),br=b&&b.getBoundingClientRect();window.__fr.push({t:h.textContent.trim(),vis:getComputedStyle(h).visibility,hr:Math.round(r.right),sl:br?Math.round(br.left):null,sw:h.scrollWidth,cw:h.clientWidth})}if(window.__fr.length<4000)requestAnimationFrame(t)};requestAnimationFrame(t)},{id,me:{mid:M[0].id,k:M[0].k}});
   return c}
  const ready=p=>p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who(),{timeout:40000});
  /* ---------- BUG-9 title ---------- */
  if(TAG==='after'){const c=await ctx({w:412,h:915},{slowMeta:1});const p=await c.newPage();
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#standings`);await ready(p);await sleep(800);
   ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
   let fr=await p.evaluate(()=>window.__fr);const shownDef=fr.filter(f=>f.vis==='visible'&&f.t===DEF);
   ok('first visit (no cached name, slow meta): the default '+DEF.split(' ')[0].slice(0,5)+'… title is never painted',fr.length>3&&!shownDef.length,{frames:fr.length,shownDef:shownDef.length,first:fr[0]});
   ok('first visit: league name shows once meta loads, and is cached',fr[fr.length-1].t==='STOOP HOOPS'&&fr[fr.length-1].vis==='visible'&&(await p.evaluate(i=>localStorage.getItem('shoops.lname.'+i.toLowerCase()),id))==='STOOP HOOPS',fr[fr.length-1]);
   await p.reload();await ready(p);await sleep(800);
   fr=await p.evaluate(()=>window.__fr);const vis=fr.filter(f=>f.vis==='visible');
   ok('repeat visit: every painted frame shows the cached league name (no swap)',vis.length>0&&vis.every(f=>f.t==='STOOP HOOPS')&&fr.findIndex(f=>f.vis==='visible')<=1,{firstVisibleFrame:fr.findIndex(f=>f.vis==='visible'),names:[...new Set(vis.map(f=>f.t))]});
   const col=fr.filter(f=>f.vis==='visible'&&(f.sl!=null&&f.hr>f.sl||f.sw>f.cw+1));
   ok('mobile: the title never overlaps the Share button while loading or after',!col.length,col.slice(0,2));
   await p.evaluate(()=>{HOOPS.setTitle('TEST LONG LEAGUE NAME HERE')});await sleep(200);
   const lg=await p.evaluate(()=>{const h=document.getElementById('hoopsLg'),b=document.getElementById('s12Share');return {fs:h.style.fontSize,cfs:getComputedStyle(h).fontSize,ls:getComputedStyle(h).letterSpacing,txt:h.textContent,hr:Math.round(h.getBoundingClientRect().right),sl:Math.round(b.getBoundingClientRect().left),sw:h.scrollWidth,cw:h.clientWidth}});
   ok('mobile: a long league name shrinks to fit beside Share',lg.hr<=lg.sl&&lg.sw<=lg.cw+1,lg);
   await p.evaluate(()=>{HOOPS.setTitle('STOOP HOOPS');scrollTo(0,0)});await sleep(200);await p.screenshot({path:`${OUT}/sh38-title-mobile.png`,clip:{x:0,y:0,width:412,height:260}});console.log('shot',`${OUT}/sh38-title-mobile.png`);
   const plain=await br.newContext({viewport:{width:412,height:915}});const pp=await plain.newPage();await plain.route(/textdb\.dev|espn\.com/,r=>r.abort());await pp.goto(`http://127.0.0.1:${HP}/league.html`);await sleep(1500);
   ok('no league link: the default title still shows',await pp.evaluate(d=>{const h=document.getElementById('hoopsLg');return h.textContent.trim().toUpperCase()===d&&getComputedStyle(h).visibility==='visible'},DEF));await plain.close();
   await c.close()}
  /* ---------- BUG-8 scroll ---------- */
  for(const [vp,tag] of [[{w:1280,h:800},'desktop'],[{w:1440,h:900},'desktop1440'],[{w:412,h:915},'mobile']]){
   for(const step of [60,250]){const c=await ctx(vp);const p=await c.newPage();await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets27`);await ready(p);
    await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
    const st=()=>p.evaluate(()=>{const m=document.getElementById('main'),n=document.getElementById('nav'),sub=[...m.querySelectorAll(':scope>.tabs.ob-seg')].find(e=>e.getClientRects().length);
     const k=[...m.querySelectorAll('.card')].find(c=>/Bet #10\b/.test(c.innerText));const R=e=>e?e.getBoundingClientRect():{top:NaN,bottom:NaN};
     return {y:Math.round(scrollY),mt:Math.round(m.scrollTop),max:m.scrollHeight-m.clientHeight,away:document.body.classList.contains('hdr-away'),nav:Math.round(R(n).top),navb:Math.round(R(n).bottom),sub:Math.round(R(sub).top),subb:Math.round(R(sub).bottom),mtop:Math.round(R(m).top),k:Math.round(R(k).top)}});
    await p.mouse.move(vp.w/2,vp.h*0.6);let prev=await st();const bad=[];let pinned=null;
    for(let i=0;i<10;i++){await p.mouse.wheel(0,step);await sleep(160);const s=await st();const moved=prev.k-s.k;const atEnd=s.away&&s.mt>=s.max-1;if(!(s.k===s.k)||(!atEnd&&Math.abs(moved-step)>1))bad.push({i,moved,s});if(s.away&&!pinned)pinned=s;prev=s}
    ok(`${tag} wheel ${step}px: the list moves exactly ${step}px every step, also across the pin (no jump/skip)`,!bad.length,bad.slice(0,2));
    ok(`${tag} wheel ${step}px: bars freeze at the top — nav at 0, Bets bar right under it, list right under the bar`,!!pinned&&prev.nav===0&&prev.sub===prev.navb&&prev.mtop===prev.subb,pinned&&{nav:prev.nav,navb:prev.navb,sub:prev.sub,subb:prev.subb,mtop:prev.mtop});
    if(step===60){await sleep(700);const b0=await st();await sleep(700);const b=await st();if(b.mt!==b0.mt)console.log('note: still settling',b0.mt,b.mt);await p.evaluate(()=>render());await sleep(600);const a=await st();ok(`${tag}: a background refresh (render) keeps the pinned list where it is`,a.k===a.k&&Math.abs(a.k-b.k)<=1&&a.away,{before:b.k,after:a.k,mt:[b.mt,a.mt],max:[b.max,a.max],mtop:[b.mtop,a.mtop]});
     const nm=tag==='desktop1440'?null:`${OUT}/sh38-${TAG}-bets-scrolled-${tag==='desktop'?'desktop':'mobile'}.png`;if(nm){await p.screenshot({path:nm});console.log('shot',nm)}}
    await c.close()}}
 }catch(e){nf++;console.log('FAIL exception',e&&e.stack||e)}finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})();
