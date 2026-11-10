/* s28i: League All teams STOOPID column = the plain hand-set STOOPID rank (assets/teams.js meta.p), never the 50/50 F.blendRank; its sort follows meta.p.
   The blend stays for mock draft bots (FBNBots.consensus wo=0.5 / F.blendRank) and draft grades (FBNPowerGen strength). APP / API env (mock store). */
const L=require('./lib.js');const {seed}=require('./seed_league.js');
let n=0,bad=0;function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
(async()=>{try{const id=await seed();const info=seed.info;
  for(const w of [390,1280]){const P=await L.phone('st'+w,{desktop:w>=760,w,h:900});
    await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});
    await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id+'#teams');await P.page.waitForSelector('#allteams .obr',{timeout:25000});await L.sleep(1200);
    const rd=()=>P.page.evaluate(()=>{const M=window.TEAMS_DATA.meta;const BR=FBN.blendRank(M,0.5);return[...document.querySelectorAll('#allteams .obr')].map(r=>{const c=r.querySelectorAll('.ats');const t=r.dataset.tid;const m=M[t]||{};return{t,st:c[0].innerText.trim(),p:+m.p>0?String(+m.p):'–',b:BR[t]>0?String(BR[t]):'–'}})});
    const a=await rd();const tag=w+'px All teams';
    ok(tag+': STOOPID column = meta.p on every row',a.length>0&&a.every(x=>x.st===x.p),a.filter(x=>x.st!==x.p).slice(0,5));
    ok(tag+': test is meaningful (blend differs from p on some shown row)',a.some(x=>x.b!==x.p),a.slice(0,4));
    const hdr=await P.page.evaluate(()=>[...document.querySelectorAll('#allteams .obh .s27-sort button')].map(b=>b.dataset.k+':'+b.innerText.replace(/\s+/g,' ').trim()));
    ok(tag+': sort header labels STOOPID/ST and KenPom/KP',hdr.length===2&&/^sr:.*(STOOPID|ST)/i.test(hdr[0])&&/^kp:.*(KenPom|KP)/i.test(hdr[1]),hdr);
    await P.page.click('#allteams button[data-k="sr"]');await L.sleep(400);const s=await rd();const nums=s.map(x=>x.st).filter(x=>x!=='–').map(Number);
    ok(tag+': STOOPID sort ascending by meta.p, unranked last',nums.length>0&&nums.every((v,i)=>!i||nums[i-1]<=v)&&s.slice(nums.length).every(x=>x.st==='–')&&s.every(x=>x.st===x.p),s.slice(0,6));
    const nt=await P.page.evaluate(()=>document.querySelector('#allteams').parentElement.innerText);ok(tag+': note says Sorted by STOOPID rank',/Sorted by STOOPID rank/.test(nt));
    if(w===390){await P.page.addScriptTag({url:L.APP+'/js/mock-bots.js'});
      const r=await P.page.evaluate(()=>{const M=window.TEAMS_DATA.meta;const BR=FBN.blendRank(M,0.5);const ids=Object.keys(M).filter(t=>+M[t].p>0||+M[t].o>0);
        const byB=ids.slice().sort((a,b)=>(BR[a]||1e9)-(BR[b]||1e9)||(a<b?-1:a>b?1:0));const byP=ids.slice().sort((a,b)=>(+M[a].p||1e9)-(+M[b].p||1e9)||(a<b?-1:a>b?1:0));
        const bots=FBNBots.consensus(ids,M,0.5);
        const ts=ids.slice(0,40).every(t=>{const r=BR[t];return FBN.teamStrength(t,M)===((r>0&&r<100)?100-r:0)});
        const MG=[...Array(8)].map((_,i)=>({mid:'m'+i,name:'N'+i}));const picks=[];byP.slice(0,48).forEach((t,k)=>picks.push({n:k+1,tid:t,owner:'m'+(k%8)}));
        const g=FBNPowerGen.generate({managers:MG,picks,meta:M,teams:{}});const PG=FBNPowerGen;
        const exp=MG.map(m=>{const mine=picks.filter(p=>p.owner===m.mid);return{mid:m.mid,b:PG.strengthOf(mine.map(p=>Object.assign({},M[p.tid],BR[p.tid]>0?{p:BR[p.tid]}:{}))),r:PG.strengthOf(mine.map(p=>M[p.tid]))}});
        return{botsBlend:JSON.stringify(bots.slice(0,30))===JSON.stringify(byB.slice(0,30)),blendNeP:JSON.stringify(byB.slice(0,30))!==JSON.stringify(byP.slice(0,30)),ts,
          gOk:!!g&&g.every(x=>{const e=exp.find(z=>z.mid===x._mid);return e&&x.strength===e.b}),gDiff:exp.some(e=>e.b!==e.r)}});
      ok('mock bots (FBNBots.consensus wo=0.5) still rank by the 50/50 blend',r.botsBlend&&r.blendNeP,r);
      ok('F.teamStrength still uses the blend',r.ts,r);
      ok('draft grades (FBNPowerGen strength) still use the blend, not raw p',r.gOk&&r.gDiff,r)}
    ok(tag+': no page errors',!P.errs.length,P.errs);await P.close()}
}catch(e){bad++;console.log('FAIL  exception '+(e&&e.stack||e))}finally{await L.close();console.log(`\n${n-bad}/${n} passed`);process.exit(bad?1:0)}})();
