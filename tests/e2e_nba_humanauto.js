/* sh6c: in a practice draft the HUMAN seat is picked for (a) within a few seconds when 'Auto-pick for me' is on at pick #1,
   and (b) when its pick clock runs out with the switch off. Then the whole draft finishes. Local mock_textdb only (or APP=live URL for a live check). */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path');
const ROOT=path.resolve(__dirname,'..');const PORT=process.env.PORT||8796;const LIVE=!!process.env.APP;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const MODE=process.env.MODE||'both';const LAT=+process.env.LAT||0;
const DC=require('./nba_draftcheck.js');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function startMock(){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});
  let buf='';const on=d=>{buf+=d;if(/mock app origin on/.test(buf))resolve(child)};child.stdout.on('data',on);child.stderr.on('data',on);child.on('error',reject);
  setTimeout(()=>reject(new Error('mock start timeout '+buf)),8000)})}
let n=0,bad=0;const fails=[];function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,x!==undefined?String(x).slice(0,600):'')}}
const chips=p=>p.evaluate(()=>document.querySelectorAll('.board .chip').length);
async function open(browser,clock){const ctx=await browser.createBrowserContext();const page=await ctx.newPage();await page.setViewport({width:1100,height:800});
  await page.setBypassServiceWorker(true).catch(()=>{});
  if(!LIVE)await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.healthOn','1')}catch(e){}});/* run the live store-health check on the mock too (it is what froze the human seat) */
  page.on('pageerror',e=>console.log('  pageerror',String(e).slice(0,200)));
  await page.goto(APP+'/mock.html?managers=5&clock='+clock+'&seat=1&order=snake',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#startmock',{timeout:20000});await page.click('#startmock');
  await page.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:30000});await page.waitForSelector('.board',{timeout:30000});
  await page.waitForFunction(()=>/your pick/i.test(document.body.innerText)||!!document.querySelector('[data-a=draftrow]')||!!document.querySelector('#autotog'),{timeout:30000}).catch(()=>{});
  return {ctx,page}}
const queue=async(page,tid)=>{await page.evaluate(()=>{const t=document.querySelector('[data-a=tab][data-t=teams],[data-t=teams]');if(t)t.click()});
  await page.waitForSelector('[data-a=q][data-t="'+tid+'"]',{timeout:15000});const on=await page.$eval('[data-a=q][data-t="'+tid+'"]',e=>e.classList.contains('on'));if(!on)await page.click('[data-a=q][data-t="'+tid+'"]');
  await page.waitForFunction(t=>{const b=document.querySelector('[data-a=q][data-t="'+t+'"]');return b&&b.classList.contains('on')},{timeout:8000},tid).catch(()=>{});
  await page.evaluate(()=>{const t=document.querySelector('[data-a=tab][data-t=board],[data-t=board]');if(t)t.click()})};
const humanMid=page=>page.evaluate(()=>{const l=new URLSearchParams(location.search).get('l');try{return JSON.parse(localStorage.getItem('shoops.me.'+l)||'{}').mid||JSON.parse(localStorage.getItem('shoops.mockopts.'+l)||'{}').me}catch(e){return null}});
function verify(label,d,me,qlog,upto){const r=DC.check(Object.assign({},d,upto?{picks:d.picks.slice(0,upto)}:{}),new Set([me]),qlog);
  ok(label+': every pick made, right owner, no duplicate team',r.errs.filter(e=>!/human auto-pick/.test(e)).length===0,r.errs.join('; '));
  ok(label+': human auto-picks = queue first, else best BPI available',r.human.length>0&&r.errs.filter(e=>/human auto-pick/.test(e)).length===0,r.errs.join('; ')+' '+JSON.stringify(r.human));
  console.log('     human picks:',r.human.map(h=>'#'+h.n+' '+h.by+' '+h.tid+'(BPI '+h.bpi+')'+(h.expected?' exp '+h.expected+' via '+h.why:'')).join(' | '));return r}
const autoOn=page=>page.evaluate(()=>{const e=document.querySelector('#autotog')||document.querySelector('#autodraft');if(!e)return false;if(!e.checked)e.click();return true}).catch(()=>false);
(async()=>{let mock=null;if(!LIVE){try{mock=await startMock()}catch(e){if(!/EADDRINUSE/.test(String(e)))throw e}
  if(LAT)await fetch(APP.replace(/:\d+$/,':'+(+PORT+1))+'/__cfg?lat='+LAT).catch(()=>{})}
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    if(MODE==='both'||MODE==='auto'){console.log('A: Auto-pick for me ON at pick #1 (human seat)');
      const {ctx,page}=await open(browser,60);
      ok('pick #1 not made yet',(await chips(page))===0,await chips(page));
      await queue(page,'18');/* BPI #5: the queue must win over BPI #1 */
      let on=false;const t0=Date.now();while(Date.now()-t0<15000){if(await autoOn(page)){on=true;break}await sleep(300)}
      ok('Auto-pick for me switched on',on);const tOn=Date.now();
      const got=await page.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=1,{timeout:15000}).then(()=>true).catch(()=>false);
      const dt=Date.now()-tOn;ok('human auto-pick #1 made within 15s ('+dt+'ms)',got&&dt<15000,await page.evaluate(()=>document.body.innerText.slice(0,500)));
      const keep=setInterval(()=>autoOn(page),1500);
      const fin=await page.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=30||!!document.querySelector('#finalbanner'),{timeout:LIVE?300000:180000}).then(()=>true).catch(()=>false);
      clearInterval(keep);ok('full practice draft finished with human auto-pick on (30 picks)',fin,await chips(page));
      {const me=await humanMid(page);const d=await DC.readDraft(page);const q={};d.order&&d.picks.forEach((e,i)=>{q[i+1]=['18']});const r=verify('A',d,me,q);
       ok('A: pick #1 was the queued team (18), not BPI #1',r.human[0]&&r.human[0].tid==='18',JSON.stringify(r.human[0]))}
      await ctx.close()}
    if(MODE==='both'||MODE==='expire'){console.log('B: switch OFF, human clock runs out (30s clock)');
      const {ctx,page}=await open(browser,30);const t0=Date.now();await queue(page,'10');/* BPI #4 */
      const got=await page.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=1,{timeout:60000}).then(()=>true).catch(()=>false);
      const dt=Date.now()-t0;ok('human pick #1 auto-made after its clock ran out ('+dt+'ms)',got,await page.evaluate(()=>document.body.innerText.slice(0,500)));
      ok('...not before the clock (>=25s)',dt>=25000,dt);
      const got10=await page.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=10,{timeout:150000}).then(()=>true).catch(()=>false);
      ok('B: human pick #10 auto-made after its clock ran out',got10,await chips(page));
      {const me=await humanMid(page);const d=await DC.readDraft(page);const r=verify('B',d,me,{1:['10'],10:['10']},10);
       ok('B: pick #1 = queued 10, pick #10 = best BPI left',r.human[0]&&r.human[0].tid==='10'&&r.human[1]&&r.human[1].by==='auto',JSON.stringify(r.human))}
      await ctx.close()}
  }finally{await browser.close();if(mock)mock.kill('SIGTERM')}
  console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
