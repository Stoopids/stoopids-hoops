const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fs=require('fs');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const out={};
 for(const [vw,w,h,mob] of [['desktop',1280,900,false],['mobile',390,844,true]]){const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});
  await p.setRequestInterception(true);p.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))r.abort();else r.continue()});
  await p.goto('https://stoopids.github.io/stoopids/',{waitUntil:'networkidle2',timeout:45000}).catch(()=>{});await sleep(2500);
  out[vw+'_who']=await p.evaluate(()=>{const m=[...document.querySelectorAll('div')].find(d=>/Who are you\?/.test(d.innerText)&&d.querySelector('.box'));return m?m.outerHTML.slice(0,3000):null});
  await p.screenshot({path:`who-${vw}.png`});
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button')].find(e=>/Just watching/i.test(e.innerText));if(g)g.click()});await sleep(1200);
  out[vw+'_nav']=await p.evaluate(()=>document.getElementById('nav').outerHTML.slice(0,4000));
  out[vw+'_hdr']=await p.evaluate(()=>document.querySelector('header').outerHTML.slice(0,3000));
  out[vw+'_fixed']=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const c=getComputedStyle(e);return c.position==='fixed'&&e.offsetWidth>0}).map(e=>e.outerHTML.slice(0,1500)));
  if(mob){await p.evaluate(()=>{const m=[...document.querySelectorAll('#nav button,#nav a')].find(e=>/More/.test(e.innerText));if(m)m.click()});await sleep(1000);await p.screenshot({path:'more-mobile.png'});
    out.more=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const c=getComputedStyle(e);return (c.position==='fixed'||c.position==='absolute')&&e.offsetWidth>100&&/Rules|Archive/.test(e.innerText)}).map(e=>e.outerHTML.slice(0,2500)).slice(0,2))}
  // collect CSS rules matching key selectors
  if(!mob)out.css=await p.evaluate(()=>{const keep=[];for(const ss of document.styleSheets){let rs;try{rs=ss.cssRules}catch(e){continue}const walk=(rs,pre)=>{for(const r of rs){if(r.cssRules&&r.media){walk(r.cssRules,'@media '+r.media.mediaText+' ');continue}const t=r.cssText;if(/#nav|\.nmore|\.nm-|onl-|\.onl|#onl|chatFab|\.cfab|#who|\.who-|s12-share|\.titlebar|\.s27-pres|header h1|\.hero|\.lpres|\.box h2/.test(r.selectorText||''))keep.push(pre+t)}};walk(rs,'')}return keep.join('\n')});
  await ctx.close()}
 fs.writeFileSync('dump.json',JSON.stringify(out,null,1));fs.writeFileSync('stoopids-ui.css',out.css||'');await b.close();console.log(Object.keys(out).map(k=>k+':'+JSON.stringify(out[k]).length).join(' '))})();
