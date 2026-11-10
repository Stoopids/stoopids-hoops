/* End-to-end: solo mock draft for 5 and 6 managers, then recap "Go to League" and standings.
   Serves the app + a local textdb stand-in via tools/mock_textdb.js. Sets shoops.store=/api/data/
   so the page never talks to textdb.dev. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const http=require('http');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const PORT=process.env.PORT||8775;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';

function contentType(f){return ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.txt':'text/plain'})[path.extname(f)]||'application/octet-stream'}
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
function ok(name,cond,extra){n++;if(cond)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,extra!==undefined?String(extra).slice(0,400):'')}}

async function runOne(browser,managers){
  const tag=managers+'mgr';
  const ctx=await browser.createBrowserContext();
  const page=await ctx.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await page.setBypassServiceWorker(true).catch(()=>{});
  await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/')}catch(e){}});
  const logs=[];page.on('pageerror',e=>logs.push('pageerror '+e.message));
  const textdbHits=[];page.on('request',req=>{if(/textdb\.dev/i.test(req.url()))textdbHits.push(req.url())});
  page._textdbHits=textdbHits;
  await page.goto(APP+'/mock.html?managers='+managers+'&clock=30',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#startmock',{timeout:15000});
  const src=await page.$eval('#mocksrc',e=>e.innerText).catch(()=>'');
  ok(tag+' mock page shows '+managers+' managers',new RegExp(managers+' managers').test(src)||await page.$eval('#m_mgrs',e=>e.value).catch(()=>'')===String(managers),src);
  await page.click('#startmock');
  await page.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:20000});
  const id=new URL(page.url()).searchParams.get('l');
  ok(tag+' landed in a new room',!!id,id);
  // Turn on Auto-pick / Auto-draft as soon as either switch appears (banner or My Team).
  const t0=Date.now();
  let autod=false;
  const enableAuto=async()=>{
    return page.evaluate(()=>{
      const click=sel=>{const e=document.querySelector(sel);if(!e)return false;if(!e.checked)e.click();return!!e.checked||e.checked===undefined};
      const tab=document.querySelector('[data-a=tab][data-t=my]');if(tab&&!document.querySelector('#autodraft'))tab.click();
      return click('#autotog')||click('#autodraft');
    }).catch(()=>false);
  };
  while(Date.now()-t0<30000){
    if(await enableAuto()){autod=true;break}
    await sleep(400);
  }
  // keep re-checking in the background in case a re-render unchecks it
  const keeper=setInterval(()=>{enableAuto().catch(()=>{})},1000);
  ok(tag+' Auto-draft / Auto-pick is on',autod);
  // wait for the draft to finish (bots + autodraft ~2s per pick, 30 picks)
  const finished=await page.waitForFunction(()=>!!document.querySelector('#finalbanner')||!!document.querySelector('#rcsite')||/recap\.html/.test(location.href),{timeout:240000}).then(()=>true).catch(()=>false);
  clearInterval(keeper);
  const picks=await page.evaluate(()=>{const el=document.querySelector('#finallbl')||document.querySelector('#finalbanner');return el?el.innerText:document.body.innerText.slice(0,200)});
  ok(tag+' draft finished',finished,picks);
  const expected=30; // all 30 teams
  ok(tag+' all 30 teams drafted (or recap reached)',/30 of 30|FINAL/.test(picks)||/recap\.html/.test(page.url()),picks);
  // Recap → Go to League
  if(!/recap\.html/.test(page.url())){
    const recap=APP+'/recap.html?l='+encodeURIComponent(id);
    await page.goto(recap,{waitUntil:'domcontentloaded'});
  }
  await page.waitForSelector('#rcsite',{timeout:25000});
  const lab=await page.$eval('#rcsite',e=>e.innerText);
  ok(tag+' recap has Go to League',/Go to/i.test(lab),lab);
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{}),page.click('#rcsite')]);
  await page.waitForFunction(()=>/league\.html/.test(location.href),{timeout:20000}).catch(()=>{});
  ok(tag+' league.html loaded',/league\.html/.test(page.url()),page.url());
  // standings should render (zeros are fine without demo data; look for standings UI)
  await sleep(800);
  const body=await page.evaluate(()=>document.body.innerText);
  const hasStand=/Standings|pts|points|Season wins|No points yet|Everyone starts at 0/i.test(body);
  ok(tag+' league site shows standings UI',hasStand,body.slice(0,300));
  ok(tag+' did not call textdb.dev',page._textdbHits.length===0,page._textdbHits.join(' '));
  await ctx.close();
  return {id,logs};
}

(async()=>{
  let mock=null;
  try{mock=await startMock();console.log('serving',APP,'from',ROOT,'via mock_textdb.js')}catch(e){if(!/EADDRINUSE/.test(String(e)))throw e;console.log('port in use, reusing',APP)}
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    await runOne(browser,5);
    await runOne(browser,6);
  }finally{
    await browser.close();
    if(mock&&mock.kill)mock.kill('SIGTERM');
  }
  console.log(bad?'FAILED '+bad+'/'+n+': '+fails.join(', '):'All '+n+' checks passed');
  process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
