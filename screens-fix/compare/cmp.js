const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');
const OUT=__dirname;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pages=[
 ['stoopids','https://stoopids.github.io/stoopids/'],
 ['hoops-league','https://stoopids.github.io/stoopids-hoops/league.html?demo=1'],
 ['hoops-mock','https://stoopids.github.io/stoopids-hoops/mock.html'],
 ['hoops-index','https://stoopids.github.io/stoopids-hoops/'],
];
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const info={};
 for(const [vw,w,h,mob] of [['desktop',1280,900,false],['mobile',390,844,true]])for(const [name,url] of pages){
  const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob,deviceScaleFactor:1});
  await p.setRequestInterception(true);p.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='HEAD'&&r.method()!=='OPTIONS'){console.log('BLOCKED write',r.method(),r.url());r.abort()}else r.continue()});
  await p.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(e=>console.log('goto',name,e.message));await sleep(2500);
  await p.screenshot({path:`${OUT}/${name}-${vw}.png`});
  if(vw==='desktop')info[name]=await p.evaluate(()=>{const cs=e=>e?getComputedStyle(e):{};const body=cs(document.body);const btn=document.querySelector('button,.btn');const tabs=[...document.querySelectorAll('[data-tab],[data-t],nav a,nav button,.tabs button,.tab')].map(e=>(e.innerText||'').trim()).filter(Boolean).slice(0,20);
    const hdr=document.querySelector('header,.hdr,.top,h1');return{title:document.title,tabs,font:body.fontFamily,bg:body.backgroundColor,color:body.color,btn:btn&&{t:btn.innerText.slice(0,30),r:cs(btn).borderRadius,bg:cs(btn).backgroundColor,c:cs(btn).color,fw:cs(btn).fontWeight,fs:cs(btn).fontSize,pad:cs(btn).padding},hdr:hdr&&{tag:hdr.tagName,cls:hdr.className,t:hdr.innerText.slice(0,80),fs:cs(hdr).fontSize,bg:cs(hdr).backgroundColor}}});
  if(name==='stoopids'){const tabs=await p.$$('[data-tab]');for(const t of tabs){const k=await t.evaluate(e=>e.dataset.tab);if(k!=='tally')continue;await t.click().catch(()=>{});await sleep(1500);await p.screenshot({path:`${OUT}/stoopids-tally-${vw}.png`})}}
  await ctx.close()}
 console.log(JSON.stringify(info,null,1));await b.close()})();
