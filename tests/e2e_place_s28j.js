/* s28j item 11: Standings with every manager on 0 points: all 8 show 'T-1' (STOOPIDS rankTxt), rows in league config order; owner card '(T-1)'. SHOTS=dir -> place-<w>.png */
const L=require('./lib.js');const {seed}=require('./seed_league.js');const {sleep}=L;const SH=process.env.SHOTS||'';
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,500):''))}}
(async()=>{try{const id=await seed(null,{rounds:8});const info=seed.info;
  for(const w of [390,1280]){const P=await L.phone('pl'+w,{desktop:w>=760,w,h:900});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id+'#standings');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(900);
    const r=await P.page.evaluate(()=>({pl:[...document.querySelectorAll('#lbody .ocl .strow .place')].map(e=>e.innerText.trim()),mids:[...document.querySelectorAll('#lbody .ocl .strow')].map(e=>e.dataset.mid)}));
    ok(w+'px: all 0 points -> every manager T-1 ('+r.pl.length+')',r.pl.length===8&&r.pl.every(x=>x==='T-1'),r.pl);
    ok(w+'px: tied rows keep league config order',r.mids.join()===info.managers.map(m=>m.id).join(),{got:r.mids,cfg:info.managers.map(m=>m.id)});
    if(SH)await P.page.screenshot({path:SH+'/place-'+w+'.png'});
    await P.page.evaluate(()=>{const r=document.querySelector('#lbody .ocl .strow .lb');if(r)r.click()});await P.page.waitForSelector('#ownercard',{timeout:25000});await sleep(400);const oc=await P.page.$eval('#ownercard',e=>e.innerText);ok(w+'px: owner card shows (T-1)',/\(T-1\)/.test(oc),oc.slice(0,200));await P.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
