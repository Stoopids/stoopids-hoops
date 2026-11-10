/* s28j item 9: Share tab: 'Read-only link for friends and family' subtitle on the view-only link (?view=1 + l only); a separate small 'Managers: use the regular link'
   line with the clean league URL (?l=<id> only: no view, admin, key, commish, token params, no hash) and its own Copy; both Copy buttons copy the right URL and show 'Copied';
   the managers line is hidden in view-only mode. 390 + 1280.  APP=... API=... node tests/e2e_share_s28j.js */
const L=require('./lib.js');const {seed}=require('./seed_league.js');const {sleep}=L;const SH=process.env.SHOTS||'';const path=require('path');
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const clip=()=>{window.__clip=[];try{Object.defineProperty(navigator,'share',{value:undefined,configurable:true})}catch(e){}try{Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__clip.push(t);return Promise.resolve()}},configurable:true})}catch(e){}};
(async()=>{try{const id=await seed(null,{rounds:8});const info=seed.info;
  for(const w of [390,1280]){
    const P=await L.phone('sj'+w,{desktop:w>=760,w,h:900});await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});await P.page.evaluateOnNewDocument(clip);
    await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id+'#share');await P.page.waitForSelector('#sharecard',{timeout:25000});await sleep(600);
    const r=await P.page.evaluate(()=>({sub:(document.getElementById('s29shSub')||{}).innerText,mg:(document.querySelector('#s29shMg .s29sh-ml')||{}).innerText,mu:(document.getElementById('s29shMgUrl')||{}).innerText,fu:document.getElementById('s29shUrl').innerText,
      mgSep:!!document.getElementById('s29shMg')&&!document.getElementById('s29shMg').contains(document.getElementById('s29shUrl')),btnH:[...document.querySelectorAll('#sharecard button')].map(b=>b.getBoundingClientRect().height),sw:document.documentElement.scrollWidth,iw:innerWidth}));
    ok(w+'px: subtitle "Read-only link for friends and family"',r.sub==='Read-only link for friends and family',r);
    ok(w+'px: separate line "Managers: use the regular link" + URL',r.mg==='Managers: use the regular link'&&r.mgSep&&!!r.mu,r);
    {const u=new URL(r.mu);const keys=[...u.searchParams.keys()];ok(w+'px: managers URL = ?l=<id> only (no view / admin / key / commish / token / k / cm, no hash)',keys.join()==='l'&&u.searchParams.get('l')===id&&!u.hash&&!/[?&](view|admin|key|commish|cm|k|token)=/i.test(r.mu),r.mu)}
    {const u=new URL(r.fu);ok(w+'px: friends link = ?l=<id>&view=1 only (+ route hash)',[...u.searchParams.keys()].sort().join()==='l,view'&&u.searchParams.get('view')==='1',r.fu)}
    await P.page.click('#s29shBtn');await sleep(250);const b1=await P.page.evaluate(()=>({c:window.__clip.slice(),t:document.getElementById('s29shBtn').innerText}));
    ok(w+'px: friends Copy copies the ?view=1 link and shows "Copied"',b1.c[b1.c.length-1]===r.fu&&b1.t==='Copied',b1);
    await P.page.$eval('#s29shMgCopy',e=>e.scrollIntoView({block:'center'}));await sleep(150);await P.page.click('#s29shMgCopy');await sleep(250);const b2=await P.page.evaluate(()=>({c:window.__clip.slice(),t:document.getElementById('s29shMgCopy').innerText}));
    ok(w+'px: managers Copy copies the regular link and shows "Copied"',b2.c[b2.c.length-1]===r.mu&&b2.t==='Copied',b2);
    ok(w+'px: no overflow, buttons >= 44px',r.sw<=r.iw&&r.btnH.every(h=>h>=43.5),r);
    if(SH)await P.page.screenshot({path:path.join(SH,'share-'+w+'.png')});await P.close();
    const V=await L.phone('sv'+w,{desktop:w>=760,w,h:900});await V.page.setBypassServiceWorker(true);await V.go('league.html?l='+id+'&view=1#share');await V.page.waitForSelector('#sharecard',{timeout:25000});await sleep(600);
    const v=await V.page.evaluate(()=>{const m=document.getElementById('s29shMg');return{m:!!m&&m.getBoundingClientRect().height>0,sub:(document.getElementById('s29shSub')||{}).innerText}});
    ok(w+'px view-only: managers line hidden, friends subtitle shown',!v.m&&v.sub==='Read-only link for friends and family',v);await V.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
