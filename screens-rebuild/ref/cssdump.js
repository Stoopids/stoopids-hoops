const puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core');const fs=require('fs');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const p=await b.newPage();
 await p.setRequestInterception(true);p.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))r.abort();else r.continue()});
 await p.goto('https://stoopids.github.io/stoopids/',{waitUntil:'networkidle2',timeout:60000});
 const out=await p.evaluate(()=>{const o=[];const walk=(rs,media)=>{for(const r of rs){if(r.media&&r.cssRules){walk(r.cssRules,(media?media+' and ':'')+r.media.mediaText);continue}if(r.cssRules&&r.conditionText){walk(r.cssRules,media);continue}if(r.selectorText)o.push([media||'',r.selectorText,r.style.cssText]);else o.push([media||'','@raw',r.cssText])}};for(const ss of document.styleSheets){try{walk(ss.cssRules,'')}catch(e){}}return o});
 fs.writeFileSync('dom/rules.json',JSON.stringify(out));console.log(out.length);await b.close()})();
