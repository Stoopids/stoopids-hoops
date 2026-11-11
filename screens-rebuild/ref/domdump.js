const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fs=require('fs');
const TABS=['standings','games','bets27','tally','teams','recap','about','archive','profile'];
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1280,height:900});
 await p.setRequestInterception(true);p.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))r.abort();else r.continue()});
 await p.goto('https://stoopids.github.io/stoopids/',{waitUntil:'networkidle2',timeout:60000});await sleep(2000);await p.evaluate(()=>{const g=document.querySelector('#pwho .guest');if(g)g.click()});await sleep(800);
 fs.writeFileSync('dom/gamesTop.html',await p.evaluate(()=>document.getElementById('gamesTop').outerHTML));
 for(const t of TABS){await p.evaluate(t=>s24NavClick({preventDefault(){}},t),t);await sleep(2000);fs.writeFileSync('dom/'+t+'.html',await p.evaluate(()=>document.getElementById('main').innerHTML));
   if(t==='bets27'){for(const v of ['all','tally']){await p.evaluate(v=>{const b=[...document.querySelectorAll('#main button')].find(e=>v==='all'?/All Bets/.test(e.innerText):/^Tally/.test(e.innerText.trim()));if(b)b.click()},v);await sleep(1500);fs.writeFileSync('dom/bets27-'+v+'.html',await p.evaluate(()=>document.getElementById('main').innerHTML))}}
   if(t==='standings'){await p.evaluate(()=>{const b=[...document.querySelectorAll('#main button')].find(e=>/Breakdown/.test(e.innerText));if(b)b.click()});await sleep(1200);fs.writeFileSync('dom/standings-breakdown.html',await p.evaluate(()=>document.getElementById('main').innerHTML))}
 }
 // all CSS text from stylesheets
 fs.writeFileSync('dom/all.css',await p.evaluate(()=>{let o='';for(const ss of document.styleSheets){try{for(const r of ss.cssRules)o+=r.cssText+'\n'}catch(e){}}return o}));
 await b.close();console.log('ok')})();
