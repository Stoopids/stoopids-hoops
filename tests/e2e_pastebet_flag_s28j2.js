const pp=require('puppeteer-core');(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});let bad=0;
for(const [lab,port,want] of [['build (flag off)',9893,false],['preview (flag on)',9891,true]])for(const w of [390,1280]){const p=await b.newPage();await p.setViewport(w===390?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1280,height:900});
await p.goto(`http://127.0.0.1:${port}/league-preview/league.html?l=7MMR2DG4T78XTJG3&pvme=1#bets`,{waitUntil:'networkidle2'}).catch(()=>{});await new Promise(r=>setTimeout(r,2000));
const r=await p.evaluate(()=>({pz:!!document.getElementById('b27Pz'),ta:!!document.getElementById('b27PzT'),readIt:[...document.querySelectorAll('button')].some(x=>/Read it/.test(x.textContent)),form:!!document.getElementById('b27Form'),flag:window.LPASTE_BET===true}));
const ok=r.pz===want&&r.ta===want&&r.readIt===want&&r.form;if(!ok)bad++;console.log((ok?'ok  ':'FAIL ')+lab+' '+w+'px',JSON.stringify(r));await p.close()}
console.log(bad?bad+' FAILED':'4/4 passed');await b.close()})();
