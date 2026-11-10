/* sh6: practice-draft bots pick in ~1-3s (never the full clock), are computer seats, and the draft can finish. Local mock_textdb only. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const PORT=process.env.PORT||8788;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';

function startMock(){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});
  let buf='';
  const on=d=>{buf+=d;if(/mock app origin on/.test(buf))resolve(child)};
  child.stdout.on('data',on);child.stderr.on('data',on);
  child.on('error',reject);
  child.on('exit',c=>{if(c)reject(new Error('mock_textdb exited '+c+': '+buf))});
  setTimeout(()=>reject(new Error('mock_textdb start timeout: '+buf)),8000);
})}

let n=0,bad=0;const fails=[];
function ok(name,cond,extra){n++;if(cond)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,extra!==undefined?String(extra).slice(0,500):'')}}

async function pickCount(page){return page.evaluate(()=>document.querySelectorAll('.board .chip, .board td .chip').length)}
async function boardNames(page){return page.evaluate(()=>[...document.querySelectorAll('.board thead th')].slice(1).map(th=>({name:(th.childNodes&&th.innerText)||th.innerText,html:th.innerText})))}

(async()=>{
  let mock=null;
  try{mock=await startMock();console.log('serving',APP)}catch(e){if(!/EADDRINUSE/.test(String(e)))throw e;console.log('port in use, reusing',APP)}
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const ctx=await browser.createBrowserContext();
  const page=await ctx.newPage();
  try{
    await page.setViewport({width:1100,height:800});
    await page.setBypassServiceWorker(true).catch(()=>{});
    await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/')}catch(e){}});
    const textdbHits=[];page.on('request',req=>{if(/textdb\.dev/i.test(req.url()))textdbHits.push(req.url())});
    // seat=1 so the human is on the clock first; 60s clock would show if a bot waited it out
    await page.goto(APP+'/mock.html?managers=5&clock=60&seat=1&order=snake',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#startmock',{timeout:15000});
    await page.click('#startmock');
    await page.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:20000});
    ok('landed in the draft room',/room\.html\?l=/.test(page.url()));
    await page.waitForSelector('.board',{timeout:25000});
    const live=await page.waitForFunction(()=>/your pick/i.test(document.body.innerText)||!!document.querySelector('[data-a=draftrow]'),{timeout:25000}).then(()=>true).catch(()=>false);
    ok('human is on the clock (seat 1)',live, await page.evaluate(()=>document.body.innerText.slice(0,400)));

    const names=await boardNames(page);
    const blob=names.map(x=>x.html||x.name).join(' | ');
    ok('practice bots are computer seats, not Ken/Kurt/Mark/Murf names',
      /Bot \d| bot/i.test(blob)&&!/Kentut|Kurmoji|Dirty Draymond|Cockchalkrock/.test(blob),blob);
    ok('bot team labels use a personality (e.g. Division spread bot)',
      /Power bot|Points bot|Proven bot|Division spread bot|Upside bot|Conference stack bot/.test(blob),blob);

    // human pick #1 from the Teams tab, then return to the Board to count chips
    await page.evaluate(()=>{const tab=document.querySelector('[data-a=tab][data-t=teams],[data-t=teams]');if(tab)tab.click()});
    await page.waitForSelector('[data-a=draftrow]',{timeout:10000});
    await page.click('[data-a=draftrow]');
    await page.waitForSelector('#confirmpick',{timeout:8000});
    await page.click('#confirmpick');
    const tPick=Date.now();
    await page.evaluate(()=>{const tab=document.querySelector('[data-a=tab][data-t=board],[data-t=board]');if(tab)tab.click()});
    await page.waitForFunction(()=>document.querySelectorAll('.board .chip').length>=1,{timeout:10000});
    ok('human pick #1 landed',(await pickCount(page))>=1,await pickCount(page));

    // next three bot picks should each arrive in well under the 60s clock (~1-3s + write)
    const gaps=[];
    let last=tPick;let count=await pickCount(page);
    for(let i=0;i<3;i++){
      const want=count+1;
      const got=await page.waitForFunction(w=>document.querySelectorAll('.board .chip').length>=w, {timeout:8000}, want).then(()=>true).catch(()=>false);
      const now=Date.now();const gap=now-last;
      gaps.push(gap);
      if(!got){ok('bot pick '+(count+1)+' arrived within 8s (not the 60s clock)',false,'still '+ (await pickCount(page))+' after '+gap+'ms');break;}
      ok('bot pick #'+want+' arrived in '+gap+'ms (<8s, not the 60s clock)',got&&gap<8000,gap);
      last=now;count=want;
    }
    ok('no bot waited out the 60s pick clock',gaps.length===3&&gaps.every(g=>g<8000),gaps);

    // Teams tab labels: short seasons. Go to teams even mid-draft.
    await page.evaluate(()=>{const tab=document.querySelector('[data-a=tab][data-t=teams],[data-t=teams]');if(tab)tab.click()});
    await sleep(400);
    const legend=await page.evaluate(()=>{
      const el=document.querySelector('#tlegend, #tlegendP, .tnote');
      const rec=[...document.querySelectorAll('.tr .rec')].map(x=>x.textContent).slice(0,3);
      return {note:el?el.innerText:'',rec,src:(window.FBN&&FBN.RANK_SRC)||''};
    });
    ok('legend says record = 25-26 season',/record = 25-26 season/.test(legend.note),legend);
    ok('BPI / Power Ranking label is (26-27)',/26-27/.test(legend.note+legend.src)&&!/2026-27/.test(legend.note+legend.src),legend);
    ok('record chips use 64-18 (25-26) style, not (2025-26)',legend.rec.some(r=>/\(\d{2}-\d{2}\)/.test(r))&&!legend.rec.some(r=>/2025-26|2026-27/.test(r)),legend.rec);

    // finish the draft: turn on auto-draft for the human
    const enableAuto=async()=>page.evaluate(()=>{
      const click=sel=>{const e=document.querySelector(sel);if(!e)return false;if(!e.checked)e.click();return true};
      const tab=document.querySelector('[data-a=tab][data-t=my]');if(tab&&!document.querySelector('#autodraft'))tab.click();
      return click('#autotog')||click('#autodraft');
    }).catch(()=>false);
    let on=false;const t0=Date.now();
    while(Date.now()-t0<20000){if(await enableAuto()){on=true;break}await sleep(400)}
    ok('Auto-draft switched on so the remaining human picks do not stall',on);
    const keeper=setInterval(()=>{enableAuto().catch(()=>{})},1000);
    const finished=await page.waitForFunction(()=>!!document.querySelector('#finalbanner')||!!document.querySelector('#rcsite')||/recap\.html/.test(location.href),{timeout:180000}).then(()=>true).catch(()=>false);
    clearInterval(keeper);
    await page.evaluate(()=>{const tab=document.querySelector('[data-a=tab][data-t=board],[data-t=board]');if(tab)tab.click()});
    await sleep(400);
    const done=await page.evaluate(()=>{
      const el=document.querySelector('#finallbl, #finalbanner, #rcsite');
      return {href:location.href,text:el?el.innerText:(document.body.innerText||'').slice(0,400),picks:document.querySelectorAll('.board .chip').length};
    });
    ok('full mock draft completed',finished&&(/30 of 30|FINAL|recap\.html/.test(done.href+' '+done.text)||done.picks===30),JSON.stringify(done));
    ok('did not call textdb.dev',textdbHits.length===0,textdbHits.join(' '));
  }finally{
    await browser.close();
    if(mock&&mock.kill)mock.kill('SIGTERM');
  }
  console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');
  process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
