/* sh6c: one pick key that the store keeps failing (textdb 500 on every read and write of pick #2) must not freeze human auto-pick:
   pick #2 goes to its backup spot (-a1), then the human (seat 3, Auto-pick for me on) is still picked for, and the draft finishes. Local mock_textdb only. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path');const DC=require('./nba_draftcheck.js');
const ROOT=process.env.ROOT||path.resolve(__dirname,'..');const PORT=+process.env.PORT||8866;const APP='http://127.0.0.1:'+PORT;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let n=0,bad=0;const fails=[];const ok=(t,c,x)=>{n++;if(c)console.log('  ok  '+t);else{bad++;fails.push(t);console.log('FAIL  '+t,x===undefined?'':String(x).slice(0,400))}};
function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(__dirname,'../tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),8000)})}
(async()=>{const mock=await startMock();
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 try{const p=await browser.newPage();await p.setViewport({width:1280,height:900});await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.healthOn','1')});
  await p.goto(APP+'/mock.html?managers=5&clock=60&seat=5&order=snake');await p.waitForSelector('#startmock');await p.click('#startmock');
  await p.waitForFunction(()=>/room\.html/.test(location.href),{timeout:30000});await p.waitForSelector('.board',{timeout:30000});
  const keep=setInterval(()=>p.evaluate(()=>{const e=document.querySelector('#autotog');if(e&&!e.checked)e.click()}).catch(()=>{}),1000);
  let d=null;const t0=Date.now();for(;Date.now()-t0<60000;){d=await DC.readDraft(p);if(d.picks&&d.picks[1])break;await sleep(500)}
  /* like the live TEST draft: once pick #2 is saved, every READ of its key fails from then on */
  await fetch('http://127.0.0.1:'+(PORT+1)+'/__cfg?fail='+encodeURIComponent('-e1-p2$')+'&failm=GET&code=500');
  for(;Date.now()-t0<120000;){d=await DC.readDraft(p);if(d.picks&&d.picks[5])break;await sleep(1500)}
  ok('pick #2 key keeps failing, yet human auto-picks #5 and #6 still happen (no 0:00 AUTO-PICKING freeze)',d.picks&&d.picks[4]&&d.picks[5]&&d.picks[4].by==='auto'&&d.picks[5].by==='auto',JSON.stringify((d.picks||[]).slice(0,6).map(x=>x&&[x.n,x.by,x.tid])));
  const roomUrl=p.url().split('#')[0];
  for(;Date.now()-t0<240000;){try{if(!/room\.html/.test(p.url()))await p.goto(roomUrl,{waitUntil:'domcontentloaded'}),await sleep(2000);d=await DC.readDraft(p);if(d.status==='complete')break}catch(e){}await sleep(3000)}clearInterval(keep);
  if(!/room\.html/.test(p.url())){await p.goto(roomUrl,{waitUntil:'domcontentloaded'});await sleep(2000)}d=await DC.readDraft(p);
  const me=await p.evaluate(()=>{const l=new URLSearchParams(location.search).get('l');return JSON.parse(localStorage.getItem('shoops.me.'+l)).mid});
  const r=DC.check(d,new Set([me]),null);ok('draft finished 30/30, right owners, no duplicates',d.status==='complete'&&r.errs.filter(e=>!/human auto/.test(e)).length===0,d.status+' '+r.errs.join('; '));
  ok('human auto-picks = queue first, else best BPI',r.errs.filter(e=>/human auto/.test(e)).length===0,r.errs.join('; '));
 }finally{await browser.close();mock.kill()}
 console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
