/* sh6d: textdb can answer 500 for pick keys that are not written yet. (a) a failing LATER key must not block the pick on the clock;
   (b) a failing ON-CLOCK key with Auto-pick OFF: when the clock runs out the pick is still made (backup spot) after the short stuck hold. Local mock_textdb only. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path');const DC=require('./nba_draftcheck.js');
const ROOT=process.env.ROOT||path.resolve(__dirname,'..');const PORT=+process.env.PORT||8878;const APP='http://127.0.0.1:'+PORT;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let n=0,bad=0;const fails=[];const ok=(t,c,x)=>{n++;if(c)console.log('  ok  '+t);else{bad++;fails.push(t);console.log('FAIL  '+t,x===undefined?'':String(x).slice(0,400))}};
function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(__dirname,'../tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),8000)})}
(async()=>{const mock=await startMock();
 /* pick #2 (the human's, seat 2) original key: every read and write answers 500, from the start */
 await fetch('http://127.0.0.1:'+(PORT+1)+'/__cfg?fail='+encodeURIComponent('-e1-p2$')+'&code=500');
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 try{const p=await browser.newPage();await p.setViewport({width:1280,height:900});await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.healthOn','1')});
  await p.goto(APP+'/mock.html?managers=5&clock=30&seat=2&order=snake');await p.waitForSelector('#startmock');await p.click('#startmock');
  await p.waitForFunction(()=>/room\.html/.test(location.href),{timeout:30000});await p.waitForSelector('.board',{timeout:30000});const t0=Date.now();
  let d=null;for(;Date.now()-t0<30000;){d=await DC.readDraft(p);if(d.picks&&d.picks[0])break;await sleep(1000)}
  ok('(a) bot pick #1 is made although the next key (#2) answers 500',d.picks&&d.picks[0]&&d.picks[0].by==='auto',JSON.stringify((d.picks||[]).slice(0,2)));
  for(;Date.now()-t0<110000;){d=await DC.readDraft(p);if(d.picks&&d.picks[1])break;await sleep(2000)}
  const dt=Math.round((Date.now()-t0)/1000);
  ok('(b) human pick #2, Auto-pick OFF, key failing: picked for when the clock ran out ('+dt+'s), via the backup spot',d.picks&&d.picks[1]&&d.picks[1].by==='auto',JSON.stringify((d.picks||[]).slice(0,3)));
  const me=await p.evaluate(()=>{const l=new URLSearchParams(location.search).get('l');return JSON.parse(localStorage.getItem('shoops.me.'+l)).mid});
  const r=DC.check(Object.assign({},d,{picks:d.picks.slice(0,2)}),new Set([me]),null);ok('(b) it took the best BPI team left',r.errs.length===0,r.errs.join('; ')+JSON.stringify(r.human));
 }finally{await browser.close();mock.kill()}
 console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
