const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 for(const [vw,w,h,mob] of [['desktop',1280,900,false],['mobile',390,844,true]]){const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});
  await p.setRequestInterception(true);p.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method())||/textdb/.test(r.url())&&!/\/api\/data\//.test(r.url())&&r.method()!=='GET'){console.log('BLOCKED',r.method(),r.url());r.abort()}else r.continue()});
  await p.goto('https://stoopids.github.io/stoopids/',{waitUntil:'networkidle2',timeout:45000}).catch(()=>{});await sleep(2000);
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button')].find(e=>/Just watching/i.test(e.innerText));if(g)g.click()});await sleep(1500);
  await p.screenshot({path:`stoopids-${vw}.png`});
  for(const k of ['tally','games']){await p.evaluate(k=>{const t=document.querySelector(`[data-tab="${k}"]`);if(t)t.click()},k);await sleep(2000);await p.screenshot({path:`stoopids-${k}-${vw}.png`})}
  if(vw==='desktop'){console.log(JSON.stringify(await p.evaluate(()=>{const t=document.querySelector('[data-tab="tally"]');const cs=getComputedStyle(t);const h1=document.querySelector('header h1, h1');const hc=h1&&getComputedStyle(h1);
    return{tab:{r:cs.borderRadius,bg:cs.backgroundColor,pad:cs.padding,fs:cs.fontSize,fw:cs.fontWeight,ff:cs.fontFamily},h1:h1&&{t:h1.innerText,fs:hc.fontSize,ff:hc.fontFamily,c:hc.color,ls:hc.letterSpacing},tally:(document.querySelector('#tally,[data-pane="tally"],.tally')||document.body).innerText.slice(0,700)}})))}
  await ctx.close()}await b.close()})();
