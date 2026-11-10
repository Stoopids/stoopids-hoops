/* s27qa: 'STOOPIDS PRESENTS' kicker directly above #ltitle in #lhead, once, muted small caps letter-spaced, centered over the title; no overflow at 320/390/1280. SHOTS=dir -> hero-<w>.png */
const L=require('./lib.js'),path=require('path');const {seed}=require('./seed_league.js');
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,500):''))}}
(async()=>{try{const id=await seed(null,{name:"Ball Don't Lie"});const SH=process.env.SHOTS;
  for(const w of [320,390,1280]){const P=await L.phone('hp'+w,{desktop:w>=760,w,h:w>=760?900:844});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id);await P.page.waitForSelector('#ltitle',{timeout:25000});await L.sleep(1200);
    const r=await P.page.evaluate(()=>{const p=document.querySelectorAll('.s27-pres'),t=document.getElementById('ltitle');const e=p[0];if(!e)return{n:0};const cs=getComputedStyle(e),a=e.getBoundingClientRect(),b=t.getBoundingClientRect();
      return{n:p.length,all:(document.body.innerText.match(/stoopids presents/ig)||[]).length,txt:e.innerText.trim(),fv:cs.fontVariantCaps,ls:parseFloat(cs.letterSpacing),col:cs.color,fs:cs.fontSize,tfs:parseFloat(getComputedStyle(t).fontSize),th:b.height,tlh:parseFloat(getComputedStyle(t).lineHeight)||parseFloat(getComputedStyle(t).fontSize),tsw:t.scrollWidth,tcw:t.clientWidth,ttxt:t.innerText.trim(),fw:cs.fontWeight,h:a.height,lh:parseFloat(cs.lineHeight),esw:e.scrollWidth,ecw:e.clientWidth,mut:getComputedStyle(document.documentElement).getPropertyValue('--mut').trim(),next:e.nextElementSibling&&e.nextElementSibling.contains(t),gap:b.top-a.bottom,cx:Math.abs((a.left+a.right)/2-(innerWidth/2)),sw:document.documentElement.scrollWidth,iw:innerWidth}});
    ok(w+'px one STOOPIDS PRESENTS line on the page, in #lhead directly above the league name',r.n===1&&r.all===1&&r.next&&r.gap>=0&&r.gap<16&&/^stoopids presents$/i.test(r.txt),r);
    ok(w+'px muted small caps, letter-spaced, centered',r.fv==='small-caps'&&r.ls>1&&r.cx<4,r);
    ok(w+'px kicker/title ratio 0.45-0.55 (s28j --kicker-ratio .5), weight 900, title > 56px max at 1280',r.fs&&parseFloat(r.fs)/r.tfs>=0.45&&parseFloat(r.fs)/r.tfs<=0.55&&r.fw==='900'&&(w<1280||r.tfs>56),r);
    ok(w+'px kicker and "Ball Don\'t Lie" title each on one line, no element overflow',/^ball don't lie$/i.test(r.ttxt)&&r.h<r.lh*1.5&&r.th<r.tlh*1.5&&r.esw<=r.ecw&&r.tsw<=r.tcw,r);
    ok(w+'px no horizontal overflow',r.sw<=r.iw,r);ok(w+'px no page errors',!P.errs.length,P.errs);
    if(SH)await P.page.screenshot({path:path.join(SH,'hero-'+w+'.png')});await P.close()}
  {/* s28g: long names shrink (titleFit) to stay on one line, floor 60% of the CSS size, wrap only below the floor; s28j: kicker follows the fitted title (0.5 x, min 11px). Tabs +12%, >=44px, no overflow */
    const KP={320:23,390:27.69,1280:49},TB={320:13.5,390:13.5,1280:14};
    for(const nm of ['Stoopids Fantasy Hoops 2026','The Extremely Long League Name Of Forty!']){const idl=await seed(null,{name:nm});
      for(const w of [320,390,1280]){const P=await L.phone('hl'+w,{desktop:w>=760,w,h:w>=760?900:844});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+idl);await P.page.waitForSelector('#ltitle',{timeout:25000});await L.sleep(1200);
        const r=await P.page.evaluate(()=>{const t=document.getElementById('ltitle'),c=getComputedStyle(t),p=document.querySelector('.s27-pres');const base=Math.min(72,Math.max(34,innerWidth*.105));
          return{txt:t.innerText,fs:parseFloat(c.fontSize),base,lines:Math.round(t.getBoundingClientRect().height/parseFloat(c.lineHeight)),tsw:t.scrollWidth,tcw:t.clientWidth,pfs:parseFloat(getComputedStyle(p).fontSize),sw:document.documentElement.scrollWidth,iw:innerWidth}});
        const one=r.lines===1&&r.tsw<=r.tcw+1;
        ok(w+'px "'+nm+'": one line when it fits at >=60% of the CSS size, else wraps at the 60% floor; no overflow',(one&&r.fs>=Math.ceil(r.base*0.6)&&r.fs<=r.base+0.5)||(r.lines>1&&Math.abs(r.fs-Math.ceil(r.base*0.6))<0.6),r);
        if(nm.startsWith('Stoopids')&&w===1280)ok('1280 "Stoopids Fantasy Hoops 2026" on one line',one,r);
        ok(w+'px "'+nm+'": kicker = max(11px, 0.5 x fitted title '+r.fs+'px) (s28j), no page overflow',Math.abs(r.pfs-Math.max(11,0.5*r.fs))<0.1&&r.sw<=r.iw,r);
        if(SH&&w===1280&&nm.startsWith('Stoopids'))await P.page.screenshot({path:path.join(SH,'longname-1280.png'),clip:{x:0,y:0,width:1280,height:700}});await P.close()}}
    for(const w of [320,390,1280]){const P=await L.phone('ht'+w,{desktop:w>=760,w,h:w>=760?900:844});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id);await P.page.waitForSelector('#ltabs a.tb',{timeout:25000});await L.sleep(800);
      const r=await P.page.evaluate(()=>{const nv=document.getElementById('ltabs'),a=[...nv.querySelectorAll('a.tb')];return{fs:a.map(x=>parseFloat(getComputedStyle(x).fontSize)),h:Math.min(...a.map(x=>x.getBoundingClientRect().height)),w:Math.min(...a.map(x=>x.getBoundingClientRect().width)),ov:a.some(x=>x.scrollWidth>x.clientWidth+1),nsw:nv.scrollWidth,ncw:nv.clientWidth,sw:document.documentElement.scrollWidth,iw:innerWidth}});
      ok(w+'px tabs +12% (S29D-NAV) font ('+TB[w]+'px), tap targets >=44px, no tab/bar/page overflow (s28g)',r.fs.every(f=>Math.abs(f-TB[w])<0.1)&&r.h>=44&&r.w>=44&&!r.ov&&r.nsw<=r.ncw&&r.sw<=r.iw,r);await P.close()}}
  {/* s28g: footer 'see the demo' link removed; ?demo=1 still works; Standings note gone */
    const P=await L.phone('hdm',{w:390,h:844});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id);await P.page.waitForSelector('#foot',{timeout:25000});await L.sleep(800);
    const r=await P.page.evaluate(()=>({link:!!document.getElementById('demolink'),ft:document.getElementById('foot').innerText,main:document.getElementById('main').innerText}));
    ok('s28g: no "see the demo" link or its dot in the footer',!r.link&&!/see the demo|last season replay/i.test(r.ft)&&!/·\s*·/.test(r.ft),r.ft);
    ok('s28g: no "full breakdown" / "Struck-through" note on Standings',!/full breakdown|struck-through/i.test(r.main));
    await P.go('league.html?l='+id+'&demo=1');await L.sleep(2500);const d=await P.page.evaluate(()=>({bar:!!document.getElementById('demobar'),ft:(document.getElementById('foot')||{}).innerText||''}));
    ok('s28g: ?demo=1 still opens the demo (demo bar, back link)',d.bar&&/back to the real league/.test(d.ft),d);ok('s28g demo: no page errors',!P.errs.length,P.errs);await P.close()}
  {/* default hero: brand-new league with no banner (no hero key, no settings.photo) -> arena photo assets/hero-banner.jpg (F.HERO.file) + kicker */
    const id2=await seed(null,{name:'Fresh League No Banner'});const P=await L.phone('hpd',{w:390,h:844});await P.page.setBypassServiceWorker(true);await P.go('league.html?l='+id2);await P.page.waitForSelector('#ltitle',{timeout:25000});await L.sleep(1500);
    const st=await (await fetch(L.API+encodeURIComponent('fbn.'+id2+'.hero'))).text().catch(()=>'');
    const r=await P.page.evaluate(()=>{const h=document.getElementById('hero');const bg=getComputedStyle(h).backgroundImage;const R=h.getBoundingClientRect();return{bg,file:FBN.HERO.file,h:R.height,pres:(document.querySelector('#lhead .s27-pres')||{}).innerText||''}});
    ok('no-banner league: default hero is the arena photo ('+r.file+'), visible',/hero-banner\.jpg/.test(r.bg)&&r.h>80,r);
    ok('no-banner league: STOOPIDS PRESENTS above the name',/stoopids presents/i.test(r.pres),r);
    ok('no-banner league: no page errors',!P.errs.length,P.errs);if(SH)await P.page.screenshot({path:path.join(SH,'hero-default-390.png')});await P.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}await L.close();console.log('\n'+(n-bad)+' / '+n+' checks passed'+(bad?' — FAILED':''));process.exit(bad?1:0)})();
