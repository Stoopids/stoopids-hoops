/* stoopids-copy parity screenshots: STOOPIDS live (writes blocked) vs Hoops local (mock store, seeded test league). */
const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fs=require('fs'),path=require('path');
const {spawn}=require('child_process');const ROOT='/workspace/nba-league';const PORT=8991;const OUT=__dirname;
const TABS=[['standings','standings'],['games','games'],['bets27','bets'],['tally','tally'],['teams','teams'],['recap','recap'],['about','rules'],['archive','archive'],['profile','profile']];/* same page, same tab ids on both sides */
const INV_SRC=0;
const INV=()=>{const m=document.getElementById('lbody')||document.getElementById('main');if(!m)return{};const vis=e=>e.offsetParent!==null;const T=e=>(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim().slice(0,60);
 const uniq=a=>[...new Set(a.filter(Boolean))];return{h:uniq([...m.querySelectorAll('h1,h2,h3,b.ttl,.card>b:first-child,summary')].filter(vis).map(T)).slice(0,40),ctl:uniq([...m.querySelectorAll('button,select,input,[role=tab],.tabs>*')].filter(vis).map(e=>e.tagName==='SELECT'?'select['+[...e.options].map(o=>o.text).slice(0,6).join('/')+']':e.tagName==='INPUT'?'input:'+(e.placeholder||e.type):T(e))).slice(0,60),th:uniq([...m.querySelectorAll('th')].map(T)).slice(0,30)}};
(async()=>{const mock=spawn(process.execPath,[ROOT+'/tools/mock_textdb.js',String(PORT),ROOT]);await sleep(1500);
 const {seed}=require(ROOT+'/tests/seed_league.js');const lid=await seed('http://127.0.0.1:'+PORT+'/api/data/',{managers:5,rounds:6,name:'Friday Hoops',rosters:require('/workspace/sc/rosters.js')(5,6)});
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const rep={};
 for(const [vw,w,h,mob] of [['desktop',1280,900,false],['mobile',390,844,true]]){
  const c1=await b.createBrowserContext();const s=await c1.newPage();await s.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});await s.setRequestInterception(true);s.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))r.abort();else r.continue()});
  await s.goto('https://stoopids.github.io/stoopids/',{waitUntil:'networkidle2',timeout:60000}).catch(()=>{});await sleep(2000);await s.evaluate(()=>{const g=document.querySelector('#pwho .guest');if(g)g.click()});await sleep(800);
  const c2=await b.createBrowserContext();const hpg=await c2.newPage();await hpg.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});await hpg.setBypassServiceWorker(true);await hpg.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/')});
  await hpg.goto('http://127.0.0.1:'+PORT+'/league.html?l='+lid,{waitUntil:'networkidle2'});await sleep(2000);await hpg.evaluate(()=>{const g=document.querySelector('#pwho .guest');if(g)g.click()});
  for(const [st,ht] of TABS){
   await s.evaluate(t=>{if(typeof s24NavClick==='function')s24NavClick({preventDefault(){}},t);else{const a=document.querySelector('#nav [data-tab="'+t+'"]');if(a)a.click()}},st).catch(()=>{});await sleep(1800);await s.evaluate(()=>window.scrollTo(0,0));
   await hpg.evaluate(t=>{if(typeof s24NavClick==='function')s24NavClick({preventDefault(){}},t);else{const a=document.querySelector('#nav [data-tab="'+t+'"]');if(a)a.click()}},st).catch(()=>{});await sleep(1800);await hpg.evaluate(()=>window.scrollTo(0,0));
   const fs1=OUT+`/s-${ht}-${vw}.png`,fs2=OUT+`/h-${ht}-${vw}.png`;await s.screenshot({path:fs1,fullPage:false});await hpg.screenshot({path:fs2,fullPage:false});
   rep[ht+'-'+vw]={stoopids:await s.evaluate('('+INV.toString()+')()'),hoops:await hpg.evaluate('('+INV.toString()+')()')}}
  await c1.close();await c2.close()}
 fs.writeFileSync(OUT+'/inventory.json',JSON.stringify(rep,null,1));await b.close();mock.kill();
 const {execSync}=require('child_process');execSync(`python3 - <<'PY'
from PIL import Image,ImageDraw
import glob,os
d='${OUT}'
for f in sorted(glob.glob(d+'/s-*.png')):
  k=os.path.basename(f)[2:];g=d+'/h-'+k
  A,B=Image.open(f).convert('RGB'),Image.open(g).convert('RGB');im=Image.new('RGB',(A.width+B.width+20,max(A.height,B.height)+26),(40,40,40));im.paste(A,(0,26));im.paste(B,(A.width+20,26))
  dr=ImageDraw.Draw(im);dr.text((6,6),'STOOPIDS live (read-only) '+k,fill=(255,210,63));dr.text((A.width+26,6),'Stoopids Hoops = STOOPIDS page copy, local synthetic test league '+k,fill=(255,210,63));im.save(d+'/SBS-'+k)
PY`);console.log('done',lid)})();
