const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const APP=process.env.APP||'http://127.0.0.1:8971';const pages=(process.argv[2]||'index.html,mock.html').split(',');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 for(const [vw,w,h,mob] of [['desktop',1280,900,false],['mobile',390,844,true]])for(const pg of pages){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('shoops.store','/api/data/')});p.on('pageerror',e=>console.log('ERR',pg,e.message));
  await p.goto(APP+'/'+pg,{waitUntil:'networkidle2'});await sleep(1200);await p.screenshot({path:__dirname+'/'+pg.replace(/[^a-z0-9]+/gi,'_')+'-'+vw+'.png'});await p.close()}
 await b.close()})();
