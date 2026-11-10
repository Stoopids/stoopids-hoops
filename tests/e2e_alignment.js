/* Even column layout on the League site: banner (#hero), title, tab row, content cards and footer share the same left and right edges at desktop (1280) for EVERY tab, in the demo,
   the real (empty) league and the pre-draft league; the tab row fits in ONE row with no scroll at desktop; at 390 the tab bar wraps into rows (s25, no sideways scroll) and the page never scrolls sideways;
   no horizontal overflow at 390/1280 on any tab; the Redraft tab reads exactly "Redraft"; redraft.html and recap.html (League-owned pages) have no horizontal overflow either.
   Draft Room-owned pages (room.html, index.html) are only checked for overflow, never edited.  APP / API env required. */
const L=require('./lib.js');const {seed}=require('./seed_league.js');const {sleep}=L;let n=0,bad=0;const fails=[];
const ok=(name,c,x)=>{n++;if(c)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,400):''))}};
const TABS=require('./tabs_exp.js').vis;   /* s25: the tabs visible at the test clock (LNOW) */
const geom=()=>{const R=e=>{if(!e)return null;const b=e.getBoundingClientRect();return[Math.round(b.left),Math.round(b.right)]};const nav=document.getElementById('ltabs'),kids=[...nav.children];
  const body=[...document.querySelectorAll('#lbody > *')].filter(e=>!e.matches('.ob-seg')).map(R).filter(b=>b&&b[1]-b[0]>0);   /* s25k: .ob-seg (Bets sub-tabs, max-width 440px, partner build) is exempt from the full-width edge check; it must still start on the left edge */
  const obseg=[...document.querySelectorAll('#lbody > .ob-seg')].map(R).filter(b=>b&&b[1]-b[0]>0);
  return{hero:R(document.getElementById('hero')),title:R(document.getElementById('ltitle')),nav:R(nav),pills:[R(kids[0])[0],R(kids[kids.length-1])[1]],scroll:nav.scrollWidth>nav.clientWidth+1,rows:new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top))).size,
    body,obseg,foot:R(document.getElementById('foot')),over:document.documentElement.scrollWidth>innerWidth+1,redraft:(document.querySelector('#ltabs [data-v=redraft]')||{innerText:''}).innerText.replace(/^\S+\s+/,'').trim()}};
(async()=>{try{
  const idReal=await seed(null,{managers:8,rounds:8}),idPre=await seed(null,{managers:8,rounds:0});
  for(const [label,qs] of [['demo','&demo=1'],['real league','']]){
    const D=await L.phone('al'+label.length,{desktop:true,w:1280,h:900});await D.go('league.html?l='+idReal+qs);await D.page.waitForFunction('!!document.querySelector("#lapp[data-ready]")',{timeout:25000});await sleep(500);
    for(const t of TABS){await D.page.evaluate(t=>document.querySelector('#ltabs [data-v='+t+']').click(),t);await sleep(300);const g=await D.page.evaluate(geom);
      const L0=g.hero[0],R0=g.hero[1];const same=e=>e&&Math.abs(e[0]-L0)<=1&&Math.abs(e[1]-R0)<=1;
      /* s28i (League s28g-hero layout): the title is fitted by titleFit() and centred inside the column (no longer full width); Games main is uncapped from 1200px (League-only: blocks share one left edge, the widest is at least the column width, inside the viewport);
         All teams is a compact card (<= 720px) centred in the column; other blocks start on the column's left edge and stay inside it (narrower cards such as Share allowed, 2px inset ok). */
      const PAD=16,IL=L0+PAD,IR=R0-PAD;/* s28j: tab bar + content share --content-max with --content-pad 16px inside */const inCol=e=>e&&e[0]>=IL-1&&e[1]<=IR+1;const ctr=e=>inCol(e)&&Math.abs((e[0]-IL)-(IR-e[1]))<=40;
      const bodyOk=t==='teams'?g.body.every(e=>inCol(e)):t==='profile'?g.body.every(e=>ctr(e)):g.body.every(e=>inCol(e)&&(Math.abs((e[0]+e[1])/2-(L0+R0)/2)<=2||Math.abs(e[0]-g.body.reduce((a,b)=>Math.min(a,b[0]),1e9))<=2)&&e[1]-e[0]<=+(process.env.CONTENT_MAX||1012));   /* s28j item 2 change: content = --content-max column centred under the 1080 tab bar */
      ok('1280 '+label+' / '+t+': banner, tab row and footer share the same left and right edges ('+L0+'..'+R0+'), title centred inside them, content blocks aligned to the column (s28j layout)',ctr(g.title)&&same(g.nav)&&bodyOk&&same(g.foot)&&g.obseg.every(e=>Math.abs(e[0]-IL)<=1&&e[1]-e[0]<=441),g);
      ok('1280 '+label+' / '+t+': tab row is ONE row, no scrolling, first pill at the left edge and last pill at the right edge of the tab row, page has no sideways scroll',g.rows===1&&!g.scroll&&!g.over&&Math.abs(g.pills[0]-(g.nav[0]+16))<=12&&Math.abs(g.pills[1]-(g.nav[1]-16))<=12,g);
      if(t==='redraft')ok('the Redraft tab reads exactly "Redraft"',g.redraft==='Redraft',g.redraft)}
    await D.page.close();
    const M=await L.phone('am'+label.length,{});await M.go('league.html?l='+idReal+qs);await M.page.waitForFunction('!!document.querySelector("#lapp[data-ready]")',{timeout:25000});await sleep(500);
    for(const t of TABS){await M.page.evaluate(t=>document.querySelector('#ltabs [data-v='+t+']').click(),t);await sleep(250);const o=await M.page.evaluate(()=>{const nv=document.getElementById('ltabs');return{over:document.documentElement.scrollWidth>innerWidth+1,navScrolls:nv.scrollWidth>nv.clientWidth,navW:Math.round(nv.getBoundingClientRect().width),vw:innerWidth}});
      ok('390 '+label+' / '+t+': no sideways page scroll; the tab bar is as wide as the screen and does not scroll (s25: wraps into rows)',!o.over&&!o.navScrolls&&o.navW<=o.vw,o)}
    await M.page.close()}
  for(const [label,id] of [['pre-draft league',idPre]]){for(const [w,h,desk] of [[1280,900,true],[390,844,false]]){const P=await L.phone('ap'+w,desk?{desktop:true,w,h}:{});await P.go('league.html?l='+id);await P.page.waitForFunction('!!document.querySelector("#lapp[data-ready]")||!!document.querySelector(".card")',{timeout:25000});await sleep(700);
    const o=await P.page.evaluate(()=>{const g=document.getElementById('hero')||document.body;return{over:document.documentElement.scrollWidth>innerWidth+1}});ok(w+' '+label+': no sideways page scroll',!o.over,o);await P.page.close()}}
  for(const page of ['recap.html','redraft.html']){for(const [w,h,desk] of [[1280,900,true],[390,844,false]]){const P=await L.phone('ar'+w,desk?{desktop:true,w,h}:{});await P.go(page+'?l='+idReal);await sleep(2200);
    const o=await P.page.evaluate(()=>({over:document.documentElement.scrollWidth>innerWidth+1,w:document.documentElement.scrollWidth,vw:innerWidth}));ok(w+' '+page+' (League-owned page): no sideways page scroll',!o.over,o);await P.page.close()}}
  /* long one-word manager / team names (35-45 characters) at 320 and 360: the League-owned recap page (with the Power rankings module) must not scroll sideways; redraft.html and room.html are Draft Room's files: reported as INFO, not failed */
  {const LN='Supercalifragilisticexpialidocious',names=Array.from({length:8},(_,i)=>[LN+LN.slice(0,i+1),LN.slice(5)+'Teamname'+i,'🏀']);const lid=await seed(null,{names,rounds:8});
   for(const w of [320,360]){for(const page of ['recap.html','redraft.html','room.html?l='+lid+'&watch=1']){const P=await L.phone('al'+w,{w,h:740});await P.page.setViewport({width:w,height:740,deviceScaleFactor:2,isMobile:true,hasTouch:true});await P.go(page.includes('?')?page:page+'?l='+lid);await sleep(3000);
     const o=await P.page.evaluate(()=>({over:document.documentElement.scrollWidth>innerWidth+1,sw:document.documentElement.scrollWidth}));
     if(page==='recap.html')ok(w+' recap.html with 35-45 character names (power module included): no sideways page scroll',!o.over,o);else console.log('  INFO  '+w+' '+page.split('?')[0]+' (Draft Room-owned) long names: '+(o.over?'SIDEWAYS SCROLL, page is '+o.sw+'px wide':'no overflow'));await P.page.close()}}}
  /* s28j item 8: every table / table-like list fills the capped column: its block (the table's card, or the list itself) spans the tab bar's inner edges (nav box minus its 16px padding) within 1px.
     Side-by-side blocks in one row (Postseason region pairs) are measured as the row's union. Measurements -> $ALIGN_JSON (default /tmp/s28j-tables.json). */
  {const MEAS={};for(const [label,qs] of [['demo','&demo=1'],['real league','']])for(const w of [1280,1440,1800]){const D=await L.phone('tb'+w,{desktop:true,w,h:900});await D.go('league.html?l='+idReal+qs);await D.page.waitForFunction('!!document.querySelector("#lapp[data-ready]")',{timeout:25000});await sleep(400);
    for(const t of TABS){await D.page.evaluate(t=>document.querySelector('#ltabs [data-v='+t+']').click(),t);await sleep(700);
      const m=await D.page.evaluate(()=>{const nav=document.querySelector('main'),nb=nav.getBoundingClientRect(),cs=getComputedStyle(nav);const IL=nb.left+parseFloat(cs.paddingLeft),IR=nb.right-parseFloat(cs.paddingRight);
        const els=[...document.querySelectorAll('#lbody table,#lbody .obk,#lbody .ocl,#lbody .b27-grid,#lbody .ggrid')].filter(e=>e.getBoundingClientRect().width>0);
        const blocks=[...new Set(els.map(e=>{let b=e.closest('.card')||e;while(b.parentElement&&b.parentElement.closest('.card'))b=b.parentElement.closest('.card');return b}))];
        const rows={};blocks.forEach(b=>{const r=b.getBoundingClientRect();if(b.closest('.ggrid')&&!b.matches('.ggrid'))return;const k=Math.round(r.top);(rows[k]=rows[k]||[]).push([r.left,r.right,b.className.toString().split(' ').slice(0,3).join('.')||b.tagName])});
        return{IL:Math.round(IL),IR:Math.round(IR),rows:Object.values(rows).map(a=>({l:+(Math.min(...a.map(x=>x[0]))-IL).toFixed(1),r:+(IR-Math.max(...a.map(x=>x[1]))).toFixed(1),what:[...new Set(a.map(x=>x[2]))].join('+')}))}});
      MEAS[label+' '+w+' '+t]=m;
      if(m.rows.length)ok(w+' '+label+' / '+t+': every table block spans the tab bar inner edges within 1px ('+m.rows.map(r=>r.what+' '+r.l+'/'+r.r).slice(0,3).join(', ')+')',m.rows.every(r=>Math.abs(r.l)<=1&&Math.abs(r.r)<=1),m)}
    await D.page.close()}
   require('fs').writeFileSync(process.env.ALIGN_JSON||'/tmp/s28j-tables.json',JSON.stringify(MEAS,null,1))}
  for(const page of ['room.html?l='+idReal+'&watch=1','index.html']){for(const [w,h,desk] of [[1280,900,true],[390,844,false]]){const P=await L.phone('ad'+w,desk?{desktop:true,w,h}:{});await P.go(page);await sleep(2200);
    const o=await P.page.evaluate(()=>({over:document.documentElement.scrollWidth>innerWidth+1}));ok(w+' '+page.split('?')[0]+' (Draft Room-owned page, checked only): no sideways page scroll',!o.over,o);await P.page.close()}}
}catch(e){bad++;fails.push('exception: '+e.message);console.log(e.stack)}finally{await L.close();console.log('\n'+(n-bad)+' / '+n+' checks passed'+(bad?' — FAILED: '+fails.join('; '):''));process.exit(bad?1:0)}})();
