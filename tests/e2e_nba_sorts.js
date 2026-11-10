/* Headless mock draft: every Teams sort/filter with 30 NBA teams. Local mock store only. */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}
const path=require('path');const {spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const PORT=process.env.PORT||8776;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';

function startMock(){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});
  let buf='';
  const on=d=>{buf+=d;if(/mock app origin on/.test(buf))resolve(child)};
  child.stdout.on('data',on);child.stderr.on('data',on);
  child.on('error',reject);
  child.on('exit',c=>{if(c)reject(new Error('mock_textdb exited '+c+': '+buf))});
  setTimeout(()=>reject(new Error('mock_textdb start timeout: '+buf)),8000);
})}

let n=0,bad=0;const fails=[];
function ok(name,cond,extra){n++;if(cond)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,extra!==undefined?String(extra).slice(0,400):'')}}

(async()=>{
  const child=await startMock();
  let browser;
  try{
    browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    const page=(await browser.createBrowserContext()).newPage?await (await browser.createBrowserContext()).newPage():null;
    const ctx=await browser.createBrowserContext();
    const p=await ctx.newPage();
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await p.setBypassServiceWorker(true).catch(()=>{});
    await p.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/');localStorage.removeItem('shoops.tmode')}catch(e){}});
    const hits=[];p.on('request',req=>{if(/textdb\.dev/i.test(req.url()))hits.push(req.url())});
    await p.goto(APP+'/mock.html?managers=5&clock=180',{waitUntil:'domcontentloaded'});
    await p.waitForSelector('#startmock',{timeout:15000});
    await p.click('#startmock');
    await p.waitForFunction(()=>/room\.html\?l=/.test(location.href),{timeout:20000});
    // Teams tab
    const tab=await p.waitForFunction(()=>{
      const b=document.querySelector('[data-a="tab"][data-t="teams"],#tab_teams,button[data-t="teams"]');
      if(b){b.click();return true}return false;
    },{timeout:20000}).then(()=>true).catch(()=>false);
    ok('opened Teams tab',tab);
    await p.waitForSelector('#tlist .trow',{timeout:15000});
    await p.waitForFunction(()=>{
      const b=[...document.querySelectorAll('#tsort [data-a="tsort"]')];
      const leg=document.getElementById('tlegend');
      return b.length>=6&&b.every(x=>(x.textContent||'').trim())&&leg&&/Power Ranking/.test(leg.textContent||'');
    },{timeout:15000});
    await sleep(1000);

    const ui=await p.evaluate(()=>{
      const pills=[...document.querySelectorAll('#tsort [data-a="tsort"]')].map(b=>({m:b.dataset.m,t:(b.textContent||'').trim(),on:b.classList.contains('on')}));
      const ph=(document.querySelector('#tq')||{}).placeholder||'';
      const aria=(document.querySelector('#tq')||{}).getAttribute('aria-label')||'';
      const leg=(document.getElementById('tlegend')||{}).textContent||'';
      const rec=[...document.querySelectorAll('#tlist .trow .tr small')].map(s=>s.innerText);
      const rows=[...document.querySelectorAll('#tlist .trow')].map(r=>({
        k:r.dataset.k, pr:(r.querySelector('.rks')||{}).innerText, sr:(r.querySelector('.rko')||{}).innerText,
        rec:(r.querySelector('.rec')||{}).innerText, sub:(r.querySelector('.cf')||{}).textContent, year:(r.querySelector('.tr small')||{}).textContent
      }));
      const body=document.body.innerText;
      return {pills,ph,aria,leg,rec,rows,n:rows.length,bodyHasAuto:/Auto-pick rank/i.test(body),bodyHasWinPct:/\bWin %\b/.test(body),shown:(document.querySelector('#tlist')||{}).innerText};
    });
    ok('search placeholder is NBA-appropriate',ui.ph==='Search team or city'&&/team or city/i.test(ui.aria),ui.ph+' / '+ui.aria);
    const labels=ui.pills.map(x=>x.t.replace(/\s*↓$/,''));
    ok('sort buttons are Power Ranking, Stoopids Rank, Win rank, A–Z, Conference, Tiers',
      labels.join('|')==='Power Ranking|Stoopids Rank|Win rank|A–Z|Conference|Tiers',labels);
    ok('no Win % button',!labels.includes('Win %')&&!ui.bodyHasWinPct,labels);
    ok('default sort is Power Ranking', (ui.pills.find(x=>x.on)||{}).m==='kenpom' && /Power Ranking/.test((ui.pills.find(x=>x.on)||{}).t), ui.pills);
    ok('no Auto-pick rank label',!ui.bodyHasAuto&&!labels.some(x=>/auto-pick rank/i.test(x)));
    ok('legend names Power Ranking, Stoopids Rank, 2025-26 season record, and no-Cup note',
      /Power Ranking/.test(ui.leg)&&/Stoopids Rank/.test(ui.leg)&&/record = 2025-26 season/.test(ui.leg)&&/Cup/.test(ui.leg)&&!/record = 2026-27/.test(ui.leg),ui.leg);
    ok('lists all 30 NBA teams (none picked yet, or almost)',ui.n===30,ui.n);
    ok('records show 64-18 (2025-26) style last-season marks',ui.rows.length&&ui.rows.every(r=>/^\d+-\d+ \(2025-26\)$/.test((r.rec||'').trim()))&&!ui.rows.some(r=>/2026-27/.test((r.rec||'')+(r.year||''))),JSON.stringify(ui.rows.slice(0,2)));
    ok('projected points appear on team cards',ui.rows.filter(r=>/\d+(\.\d+)?\s*pts/.test(r.sub||'')).length>=20,JSON.stringify(ui.rows.slice(0,3)));

    const clickSort=async m=>{
      await p.evaluate(m=>{
        const b=document.querySelector('#tsort [data-a="tsort"][data-m="'+m+'"]');
        if(!b)return;
        const on=b.classList.contains('on');
        const desc=/↓/.test(b.textContent||'');
        if(!on)b.click();
        else if(desc)b.click(); /* undo a reverse sort */
      },m);
      await sleep(400);
      return p.evaluate(()=>[...document.querySelectorAll('#tlist .trow')].map(r=>({
        k:r.dataset.k, pr:+((/#(\d+)/.exec((r.querySelector('.rks')||{}).innerText||'')||[])[1]||0),
        sr:+((/#(\d+)/.exec((r.querySelector('.rko')||{}).innerText||'')||[])[1]||0),
        name:((r.querySelector('.tm')||r).innerText||'').split('\n')[0],
        rec:(r.querySelector('.rec')||{}).innerText, sub:(r.querySelector('.cf')||{}).innerText,
        grp:((r.closest('.tgrid')||{}).previousElementSibling||{}).innerText||''
      })));
    };
    let rows=await clickSort('kenpom');
    ok('Power Ranking: 30 teams, PR #1 first, ascending',rows.length===30&&rows[0].pr===1&&rows.every((r,i,a)=>!i||a[i-1].pr<=r.pr),JSON.stringify(rows.slice(0,3)));

    rows=await clickSort('stoopid');
    ok('Stoopids Rank: 30 teams, SR #1 first, ascending rank',rows.length===30&&rows[0].sr===1&&rows.every((r,i,a)=>!i||!a[i-1].sr||!r.sr||a[i-1].sr<=r.sr),rows.slice(0,5).map(r=>[r.sr,r.sub]));

    rows=await clickSort('power');
    ok('Win rank: 30 teams, last-season records, OKC 64-18 first',rows.length===30&&rows.every(r=>/^\d+-\d+ \(2025-26\)$/.test((r.rec||'').trim()))&&/^64-18/.test(rows[0].rec||'')&&/Thunder|Oklahoma/i.test(rows[0].name||'')&&/^62-20/.test(rows[1].rec||'')&&/^60-22/.test(rows[2].rec||''),rows.slice(0,3).map(r=>[r.name,r.rec]));

    rows=await clickSort('alpha');
    ok('A–Z: 30 teams, names non-decreasing',rows.length===30&&rows.every((r,i,a)=>!i||a[i-1].name.localeCompare(r.name)<=0),rows.slice(0,3).map(r=>r.name));

    rows=await clickSort('conf');
    const confs=await p.evaluate(()=>[...document.querySelectorAll('#tlist .grp span')].map(s=>s.innerText));
    ok('Conference: groups East and West only',confs.join()==='East,West'||confs.slice().sort().join()==='East,West',confs);
    ok('Conference: 30 teams across both',rows.length===30,rows.length);

    rows=await clickSort('tiers');
    const tiers=await p.evaluate(()=>[...document.querySelectorAll('#tlist .grp span')].map(s=>s.innerText));
    ok('Tiers: Elite, Contender, Mid, Fringe, Longshot',tiers.join()==='Elite,Contender,Mid,Fringe,Longshot',tiers);
    ok('Tiers: 30 teams (5×6)',rows.length===30,rows.length);

    // All conf filter
    await p.evaluate(()=>{const b=document.querySelector('[data-a="tconfopen"]');if(b)b.click()});
    await sleep(200);
    const confBtns=await p.evaluate(()=>[...document.querySelectorAll('#tconf [data-a="tconf"]')].map(b=>b.innerText.trim()));
    ok('All conf. menu is All conf., East, West',confBtns.join()==='All conf.,East,West',confBtns);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#tconf [data-a="tconf"]')].find(x=>x.dataset.c==='East');if(b)b.click()});
    await sleep(300);
    const east=await p.evaluate(()=>({n:document.querySelectorAll('#tlist .trow').length,note:(document.querySelector('.tnote2')||{}).innerText,subs:[...document.querySelectorAll('#tlist .cf')].map(s=>s.innerText)}));
    ok('East filter shows 15 Eastern teams',east.n===15&&east.subs.every(s=>/East/.test(s))&&/East/.test(east.note||''),east);
    await p.evaluate(()=>{const b=document.querySelector('[data-a="tconfopen"]');if(b)b.click()});
    await sleep(200);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#tconf [data-a="tconf"]')].find(x=>x.dataset.c==='West');if(b)b.click()});
    await sleep(300);
    const west=await p.evaluate(()=>document.querySelectorAll('#tlist .trow').length);
    ok('West filter shows 15 Western teams',west===15,west);
    await p.evaluate(()=>{const b=document.querySelector('[data-a="tconfopen"]');if(b)b.click()});
    await sleep(200);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#tconf [data-a="tconf"]')].find(x=>x.dataset.c==='');if(b)b.click()});
    await sleep(300);
    const all=await p.evaluate(()=>document.querySelectorAll('#tlist .trow').length);
    ok('All conf. shows 30 again',all===30,all);

    // search city
    await clickSort('alpha');
    await p.evaluate(()=>{const i=document.querySelector('#tq');i.value='Oklahoma';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('keyup',{bubbles:true}))});
    // room may listen to input on #tq — trigger the same handler if needed
    await p.evaluate(()=>{const i=document.querySelector('#tq');if(!i)return;const ev=new Event('input',{bubbles:true});i.dispatchEvent(ev);if(window.TF){/* no */}});
    // fire whatever handler is bound: look at oninput or keyup in room
    await sleep(400);
    // Some rooms bind via addEventListener on tq. If not updated, set TF.q through click path.
    const searched=await p.evaluate(()=>{
      const i=document.querySelector('#tq');
      if(i){
        i.focus();i.value='Oklahoma';
        i.dispatchEvent(new Event('input',{bubbles:true}));
        i.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'a'}));
      }
      return [...document.querySelectorAll('#tlist .trow')].map(r=>(r.innerText||''));
    });
    // If the app reads #tq on input through a delegated handler, it should work. We'll retry via evaluate of typical room pattern after sleep.
    await sleep(300);
    const after=await p.evaluate(()=>[...document.querySelectorAll('#tlist .trow')].map(r=>({k:r.dataset.k,t:r.innerText})));
    ok('search for city Oklahoma finds the Thunder',after.some(r=>/Thunder|Oklahoma/i.test(r.t))&&after.length<=5,after);

    // Queued + Show picked exist and toggle
    const q=await p.evaluate(()=>{const b=document.querySelector('#tqchip');if(!b)return null;b.click();return b.classList.contains('on')||b.getAttribute('aria-pressed')});
    ok('Queued chip toggles on (empty queue message or list)',q==='true'||q===true,q);
    await p.evaluate(()=>{const b=document.querySelector('#tqchip');if(b)b.click()});
    const sp=await p.evaluate(()=>{const b=document.querySelector('#tspk');if(!b)return null;const before=b.getAttribute('aria-pressed');b.click();return{before,after:b.getAttribute('aria-pressed'),on:b.classList.contains('on')}});
    ok('Show picked chip toggles',sp&&sp.after==='true',sp);

    ok('no requests to textdb.dev',hits.length===0,hits);
  }finally{
    if(browser)await browser.close();
    try{child.kill()}catch(e){}
  }
  console.log((n-bad)+' passed, '+bad+' failed');
  if(fails.length)console.log('failed:',fails.join('; '));
  process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
