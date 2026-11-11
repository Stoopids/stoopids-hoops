const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const {spawn}=require('child_process');
const PORT=8896,APP=process.env.APP||'http://127.0.0.1:'+PORT,LIVE=!!process.env.APP;const OUT='/workspace/nba-league/screens-fix/';const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let m=null;if(!LIVE){m=spawn(process.execPath,['/workspace/nba-league/tools/mock_textdb.js',String(PORT),'/workspace/nba-league']);await sleep(1500)}
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 for(const [w,h,tag] of [[1280,860,'desktop'],[390,844,'mobile']]){const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:w<500,hasTouch:w<500});
  await p.setBypassServiceWorker(true);if(!LIVE)await p.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/')});
  await p.goto(APP+'/mock.html?clock=0&seat=1');await p.waitForSelector('#startmock');await p.click('#startmock');
  await p.waitForFunction(()=>/room\.html/.test(location.href),{timeout:60000});await p.waitForSelector('#pickbtn',{visible:true,timeout:60000});await sleep(800);
  await p.click('#pickbtn');await p.waitForSelector('[data-a=draftrow]',{timeout:15000});await sleep(1200);await p.screenshot({path:OUT+'teams-on-clock-'+tag+'.png'});
  await p.click('[data-a=tconfopen]');await sleep(600);await p.screenshot({path:OUT+'division-filter-'+tag+'.png'});
  await p.click('[data-a=tconf][data-c=Northwest]');await sleep(800);await p.evaluate(()=>window.scrollBy(0,0));await p.screenshot({path:OUT+'division-northwest-'+tag+'.png'});
  const info=await p.evaluate(()=>({build:window.FBN_BUILD,rows:[...document.querySelectorAll('[data-a=draftrow]')].map(r=>r.innerText.replace(/\s+/g,' ')).slice(0,6)}));console.log(tag,JSON.stringify(info));await ctx.close()}
 await b.close();if(m)m.kill()})();
