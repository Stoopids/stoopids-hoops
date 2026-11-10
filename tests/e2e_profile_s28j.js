/* s28j item 10: '👤 Profile' tab replaces Share in the same (last) nav slot; #share -> #profile; sections top to bottom: profile-who ("You're using the site as", team on top,
   real name under), profile-settings ('My settings', opens the existing Draft Room My settings: room.html?l=…&settings=1, same save rules), profile-notify
   ('Notifications · Coming soon', no controls), profile-share (item 9). Save from Profile -> new team name shown on Profile; duplicate team name (any case) blocked;
   view mode: only "You're viewing a read-only link" + friends share (no settings, no managers line). Content width cap at 390 / 1280.
   APP=... API=... node tests/e2e_profile_s28j.js   (SHOTS=dir -> profile-<w>.png, profile-view-<w>.png) */
const L=require('./lib.js');const {seed}=require('./seed_league.js');const {sleep}=L;const SH=process.env.SHOTS||'';const path=require('path');
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
(async()=>{try{const id=await seed(null,{rounds:8});const info=seed.info;
  for(const w of [390,1280]){
    const P=await L.phone('pf'+w,{desktop:w>=760,w,h:900});await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});await P.page.setBypassServiceWorker(true);
    await P.go('league.html?l='+id+'#share');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(900);
    const r=await P.page.evaluate(()=>{const tabs=[...document.querySelectorAll('#ltabs [data-v]')];const sec=[...document.querySelectorAll('#lbody section')].map(s=>s.id);const nav=document.getElementById('ltabs').getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();
      return{hash:location.hash,last:tabs[tabs.length-1].dataset.v,lab:tabs[tabs.length-1].innerText.replace(/\s+/g,' ').trim(),share:tabs.some(t=>t.dataset.v==='share'),act:(document.querySelector('#ltabs [aria-current=page], #ltabs .on')||{dataset:{}}).dataset.v,sec,
        who:(document.getElementById('profile-who')||{}).innerText||'',team:(document.getElementById('profileTeam')||{}).innerText,nm:(document.getElementById('profileName')||{}).innerText,notify:(document.getElementById('profile-notify')||{}).innerText,notifyCtl:document.querySelectorAll('#profile-notify button,#profile-notify input,#profile-notify select').length,
        edit:(document.getElementById('profileEdit')||{}).href||'',heading:(document.querySelector('#profile-settings h2')||{}).innerText,mg:!!document.getElementById('s29shMg'),navW:Math.round(nav.width),mW:Math.round(m.width),navL:Math.round(nav.left),mL:Math.round(m.left),sw:document.documentElement.scrollWidth,iw:innerWidth}});
    ok(w+'px: last nav tab is "👤 Profile" (Share slot), no Share tab',r.last==='profile'&&/^👤\s*Profile$/.test(r.lab)&&!r.share,r);
    ok(w+'px: #share lands on #profile',r.hash==='#profile',r.hash);
    ok(w+'px: sections in order who, settings, notify, share',r.sec.join()==='profile-who,profile-settings,profile-notify,profile-share',r.sec);
    ok(w+'px: "You\'re using the site as" team on top, real name under (Ana)',/You're using the site as/.test(r.who)&&r.team===(w===390?'Aces':'Profile Pandas')&&r.nm==='Ana',r);
    ok(w+'px: "My settings" opens the existing Draft Room My settings (room.html?l=…&settings=1)',r.heading==='My settings'&&/room\.html\?l=/.test(r.edit)&&/settings=1/.test(r.edit),r.edit);
    ok(w+'px: "Notifications · Coming soon", no controls',r.notify.trim()==='Notifications · Coming soon'&&r.notifyCtl===0,r.notify);
    ok(w+'px: managers line shown for a manager',r.mg);
    ok(w+'px: content width '+r.mW+' = min(viewport, --content-max), no overflow',r.mW===Math.min(w,+(process.env.CONTENT_MAX||1012))&&r.sw<=r.iw,r);
    if(SH)await P.page.screenshot({path:path.join(SH,'profile-'+w+'.png'),fullPage:true});
    if(w===390){/* save from Profile: Edit -> My settings sheet -> new team -> Save -> back to Profile */
      await P.page.$eval('#profileEdit',e=>e.scrollIntoView({block:'center'}));await sleep(100);await Promise.all([P.page.waitForNavigation({waitUntil:'domcontentloaded'}),P.page.click('#profileEdit')]);await P.page.waitForSelector('#ms_team',{timeout:25000});await sleep(500);
      await P.page.$eval('#ms_team',e=>{e.value=''});await P.page.type('#ms_team','bLaZeRs');await P.page.click('#mssave');await sleep(600);
      const dup=await P.page.$eval('#msteamerr',e=>e.innerText).catch(()=>'');ok('duplicate team name "bLaZeRs" (Ben has Blazers) blocked',/already uses/.test(dup),dup);
      await P.page.$eval('#ms_team',e=>{e.value=''});await P.page.type('#ms_team','Profile Pandas');await P.page.click('#mssave');await P.page.waitForFunction('!document.getElementById("mysheet")',{timeout:15000}).catch(()=>{});await sleep(400);
      await P.go('league.html?l='+id+'#profile');await P.page.waitForSelector('#profileTeam',{timeout:25000});await sleep(1200);const t=await P.page.$eval('#profileTeam',e=>e.innerText);ok('saved from Profile: Profile now shows "Profile Pandas"',t==='Profile Pandas',t)}
    await P.close();
    const V=await L.phone('pv'+w,{desktop:w>=760,w,h:900});await V.page.setBypassServiceWorker(true);await V.go('league.html?l='+id+'&view=1#share');await V.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(900);
    const v=await V.page.evaluate(()=>({hash:location.hash,sec:[...document.querySelectorAll('#lbody section')].map(s=>s.id),ro:(document.getElementById('profileRo')||{}).innerText,set:!!document.getElementById('profile-settings'),mg:(()=>{const m=document.getElementById('s29shMg');return!!m&&m.getBoundingClientRect().height>0})(),sub:(document.getElementById('s29shSub')||{}).innerText}));
    ok(w+'px view mode: only "You\'re viewing a read-only link" + friends share; no settings, no managers line',v.hash==='#profile'&&v.ro==="You're viewing a read-only link"&&!v.set&&!v.mg&&v.sub==='Read-only link for friends and family'&&v.sec.join()==='profile-who,profile-share',v);
    if(SH)await V.page.screenshot({path:path.join(SH,'profile-view-'+w+'.png'),fullPage:true});await V.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
