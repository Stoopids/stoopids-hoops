/* sh6c: queue add / reorder (▲) / remove (✕) in the Teams tab, saved to the manager's pref doc, and used by auto-pick (top queued team still available). Local mock_textdb only. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path');const DC=require('./nba_draftcheck.js');
const ROOT=path.resolve(__dirname,'..');const PORT=+process.env.PORT||8890;const APP='http://127.0.0.1:'+PORT;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let n=0,bad=0;const fails=[];const ok=(t,c,x)=>{n++;if(c)console.log('  ok  '+t);else{bad++;fails.push(t);console.log('FAIL  '+t,x===undefined?'':String(x).slice(0,400))}};
function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),8000)})}
(async()=>{const mock=await startMock();const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 try{const p=await browser.newPage();await p.setViewport({width:1280,height:900});await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.healthOn','1')});
  await p.goto(APP+'/mock.html?managers=5&clock=60&seat=5&order=snake');await p.waitForSelector('#startmock');await p.click('#startmock');
  await p.waitForFunction(()=>/room\.html/.test(location.href),{timeout:30000});await p.waitForSelector('.board',{timeout:30000});
  await p.evaluate(()=>document.querySelector('[data-t=teams]').click());await p.waitForSelector('[data-a=q]',{timeout:20000});
  const ids=await p.evaluate(()=>{const M=TEAMS_DATA.meta;const by=r=>Object.keys(M).find(t=>+M[t].o===r);return[by(20),by(22),by(24)]});const [A,B,C]=ids;
  for(const t of ids){await p.click('[data-a=q][data-t="'+t+'"]');await sleep(400)}
  const panel=()=>p.evaluate(()=>[...document.querySelectorAll('#qpanel .qrow')].map(r=>r.dataset.t));
  await p.waitForFunction(()=>document.querySelectorAll('#qpanel .qrow').length===3,{timeout:8000}).catch(()=>{});
  ok('add: queue panel shows the 3 teams in order added',JSON.stringify(await panel())===JSON.stringify([A,B,C]),await panel());
  for(let i=0;i<2;i++){await p.click('#qpanel [data-a=qm][data-t="'+C+'"][data-d="-1"]');await sleep(500)}
  ok('reorder: ▲ twice moves the 3rd team to the top',JSON.stringify(await panel())===JSON.stringify([C,A,B]),await panel());
  await p.click('#qpanel [data-a=qrm][data-t="'+A+'"]');await sleep(600);
  ok('remove: ✕ takes a team out',JSON.stringify(await panel())===JSON.stringify([C,B]),await panel());
  const stored=async()=>p.evaluate(async()=>{const l=new URLSearchParams(location.search).get('l');const me=JSON.parse(localStorage.getItem('shoops.me.'+l)).mid;const d=FBN.parseJ(await Store.get(FBN.Keys(l).pref(me)));return d&&d.queue});
  let sq=null;for(let i=0;i<20;i++){sq=await stored();if(JSON.stringify((sq||[]).map(String))===JSON.stringify([C,B]))break;await sleep(500)}
  ok('queue saved to the store in the new order',JSON.stringify((sq||[]).map(String))===JSON.stringify([C,B]),JSON.stringify(sq));
  await p.evaluate(()=>{const e=document.querySelector('#autotog');if(e&&!e.checked)e.click()});
  await p.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=5||true,{timeout:1000});
  let d=null;for(let i=0;i<60;i++){d=await DC.readDraft(p);if(d.picks&&d.picks[4])break;await sleep(1000)}const banner=await p.evaluate(()=>((document.querySelector('#banner')||{}).innerText||'').replace(/\s+/g,' ').slice(0,200));
  ok('auto-pick at pick #5 took the top queued team (after reorder/remove)',d.picks[4]&&d.picks[4].tid===C&&d.picks[4].by==='auto',JSON.stringify(d.picks.slice(0,6).map(x=>x&&[x.n,x.by,x.tid]))+' want '+C+' status '+d.status+' banner '+banner);
  for(let i=0;i<30;i++){d=await DC.readDraft(p);if(d.picks&&d.picks[5])break;await sleep(1000)}
  ok('next auto-pick (#6, snake) took the next queued team',d.picks[5]&&d.picks[5].tid===B,JSON.stringify(d.picks[5])+' want '+B);
 }finally{await browser.close();mock.kill()}
 console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
