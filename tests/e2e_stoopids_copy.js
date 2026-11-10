/* sh8 (Paul): league.html = STOOPIDS index.html copied verbatim (tools/build_league_from_stoopids.py) with only the NBA data layer swapped (js/hoops-stoopids.js).
   1) Handoff: a real draft in room.html (5 managers x 6 rounds, all seats on bots, commissioner device open) runs to the end; the League page opened mid-draft fills the
      drafted rosters by itself (its 2-minute reload, no page reload) and the room's League site link opens league.html?l=<code> with the same rosters. Screenshot: handoff-standings-*.png
   2) Heading: 'Stoopids presents' kicker + the league name the commish set (h1). 3) 5 and 6 managers: every manager's chips on ONE line at 1280 and 390 (screens).
   4) Commish 'Make a new link for [manager]': non-commish no tool, wrong passcode does not unlock, commish makes link, claim hash replaced, old link rejected, new link signs in.
   Local mock store only (tools/mock_textdb.js). SHOTS=<dir> (default screens-copy). */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core')}
const {spawn}=require('child_process');const path=require('path'),fs=require('fs');const F=require('../js/core.js');const {seed}=require('./seed_league.js');
const ROOT=path.resolve(__dirname,'..');const PORT=+process.env.PORT||8883;const APP='http://127.0.0.1:'+PORT,API=APP+'/api/data/';const SHOTS=process.env.SHOTS||path.join(ROOT,'screens-copy');fs.mkdirSync(SHOTS,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let n=0,bad=0;const ok=(t,c,x)=>{n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const post=(k,v)=>fetch(API+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(v)});const gj=async k=>F.parseJ(await (await fetch(API+encodeURIComponent(k))).text());
const tsrc=fs.readFileSync(path.join(ROOT,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));
const snake=(N,R)=>{const rk=TD.teams.map(t=>t[0]).sort((a,b)=>((TD.meta[a]||{}).p||99)-((TD.meta[b]||{}).p||99));const out=Array.from({length:N},()=>[]);let k=0;for(let r=0;r<R;r++){const row=[...Array(N).keys()];if(r%2)row.reverse();row.forEach(i=>out[i].push(rk[k++]))}return out};
function startMock(){return new Promise(res=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>res(c),3000)})}
let browser;const errs=[];
async function page(lid,o){o=o||{};const c=await browser.createBrowserContext();const p=await c.newPage();await p.setViewport({width:o.w||1280,height:o.h||900,isMobile:(o.w||1280)<700,hasTouch:(o.w||1280)<700});await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument((lid,me,cm)=>{localStorage.setItem('shoops.store','/api/data/');if(me)localStorage.setItem('shoops.me.'+lid,JSON.stringify(me));if(cm)localStorage.setItem('shoops.cm.'+lid,cm)},lid,o.me||null,o.cm||null);
  p.on('dialog',d=>d.accept());p.on('pageerror',e=>errs.push(e.message));p._c=c;return p}
const guest=p=>p.evaluate(()=>{const g=document.querySelector('#pwho .guest');if(g)g.click()});
const nav=(p,t)=>p.evaluate(t=>{if(typeof s24NavClick==='function')s24NavClick({preventDefault(){}},t)},t);
const rosters=p=>p.evaluate(()=>((typeof D!=='undefined'&&D&&D.owners)||[]).map(o=>o.teams.length));
const oneLine=p=>p.evaluate(()=>[...document.querySelectorAll('#main .card.oc')].map(c=>new Set([...c.querySelectorAll('.chips .chip')].map(x=>Math.round(x.getBoundingClientRect().top))).size));
(async()=>{const mock=await startMock();browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 try{
  /* ---------- 1) handoff from a real room draft ---------- */
  {const lid=await seed(API,{managers:5,rounds:6,live:true,clockSecs:30,picksMade:0,name:'Handoff Test League'});const I=seed.info;const K=F.Keys(lid);const M=await gj(K.meta);
   I.managers.forEach(m=>{M.over[m.id]=Object.assign({},M.over[m.id],{away:true,bot:true})});M.startedAt=M.resumeAt=Date.now()+4000;await post(K.meta,M);
   const lg=await page(lid,{me:{mid:I.managers[1].id,k:I.managers[1].k}});await lg.goto(APP+'/league.html?l='+lid,{waitUntil:'networkidle2'});await sleep(2500);
   ok('league page during the draft: 5 managers listed (names from the joins)',JSON.stringify(await lg.evaluate(()=>D.owners.map(o=>o.name).sort()))===JSON.stringify(I.managers.map(m=>m.name).sort()),await lg.evaluate(()=>D.owners.map(o=>o.name)));
   const before=(await rosters(lg)).reduce((a,b)=>a+b,0);
   const rm=await page(lid,{w:390,h:844});await rm.goto(APP+'/room.html?l='+lid+'#cm='+I.cmSecret,{waitUntil:'networkidle2'});
   const t0=Date.now();let made=0;while(Date.now()-t0<8*60000){await sleep(2000);let k=made;while(k<30){const e=await gj(K.pick(M.epoch,k+1));if(!(e&&e.tid))break;k++}made=k;if(made>=30)break}
   ok('room draft ran to the end (30 picks)',made===30,made);await sleep(4000);
   const ents={};for(let k=1;k<=30;k++)ents[k]=await gj(K.pick(M.epoch,k));const st=F.deriveState(await gj(K.meta),ents,{},new Set(TD.teams.map(t=>t[0])));
   const want={};st.picks.forEach(p=>{(want[p.owner]=want[p.owner]||[]).push(String(p.tid))});
   const t1=Date.now();let filled=false;while(Date.now()-t1<150000){const r=await rosters(lg);if(r.length===5&&r.every(x=>x===6)){filled=true;break}await sleep(3000)}
   ok('open League page (no reload) filled the drafted rosters by itself (had '+before+' teams, now 5 x 6) in '+Math.round((Date.now()-t1)/1000)+' s',filled,await rosters(lg));
   const link=await rm.evaluate(()=>{const a=document.querySelector('#leaguehome2,a[href*="league.html"]');return a?a.getAttribute('href'):''});
   ok('room hands off: League site link -> league.html?l=<code>',/league\.html\?l=/.test(link)&&link.includes(lid),link);
   const lp=await page(lid,{me:{mid:I.managers[0].id,k:I.managers[0].k}});await lp.goto(new URL(link,APP+'/room.html').href,{waitUntil:'networkidle2'});await sleep(3000);
   const got=await lp.evaluate(()=>{const o={};D.owners.forEach(x=>{o[x._mid]=x.teams.map(t=>t.tid)});return o});
   ok('STOOPIDS copy shows exactly the drafted rosters',I.managers.every(m=>JSON.stringify((got[m.id]||[]).slice().sort())===JSON.stringify((want[m.id]||[]).slice().sort())),{got,want});
   ok('STOOPIDS page (verbatim markup): titlebar kicker + h1 + nav tabs',await lp.evaluate(()=>!!document.querySelector('.titlebar #lpres')&&!!document.querySelector('#nav')&&/Stoopids presents/i.test(document.getElementById('lpres').textContent)));
   ok('heading = STOOPIDS PRESENTS + league name the commish set',await lp.evaluate(()=>document.getElementById('hoopsLg').textContent)==='HANDOFF TEST LEAGUE');
   await lp.screenshot({path:SHOTS+'/handoff-standings-desktop.png'});
   const lm=await page(lid,{w:390,h:844,me:{mid:I.managers[0].id,k:I.managers[0].k}});await lm.goto(new URL(link,APP+'/room.html').href,{waitUntil:'networkidle2'});await sleep(3000);await lm.screenshot({path:SHOTS+'/handoff-standings-mobile.png'});
   await rm.screenshot({path:SHOTS+'/handoff-room-end-mobile.png'});
   for(const p of [lg,rm,lp,lm])await p._c.close()}
  /* ---------- 2/3) 5 and 6 managers: chips on one line ---------- */
  for(const N of [5,6]){const R=N===6?5:6;const lid=await seed(API,{managers:N,rounds:R,rosters:snake(N,R),name:'Friday Hoops'});const I=seed.info;
   for(const [w,h,tag] of [[1280,900,'desktop'],[390,844,'mobile']]){const p=await page(lid,{w,h,me:{mid:I.managers[0].id,k:I.managers[0].k}});await p.goto(APP+'/league.html?l='+lid,{waitUntil:'networkidle2'});await sleep(3000);
    const L1=await oneLine(p);ok(N+' managers '+tag+': every manager\'s '+R+' chips on ONE line',L1.length===N&&L1.every(x=>x===1),L1);
    ok(N+' managers '+tag+': no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    ok(N+' managers '+tag+': chip abbreviations not cut',await p.evaluate(()=>[...document.querySelectorAll('#main .card.oc .chip .cab')].every(e=>e.scrollWidth<=e.clientWidth+1)));
    await p.screenshot({path:SHOTS+`/chips-${N}mgr-${tag}.png`});await p._c.close()}}
  /* ---------- 4) commissioner 'Make a new link for [manager]' ---------- */
  {const lid=await seed(API,{managers:5,rounds:6,rosters:snake(5,6),name:'Friday Hoops'});const I=seed.info;const K=F.Keys(lid);const tgt=I.managers[2],other=I.managers[1];
   const claimOf=async i=>F.parseClaim(await (await fetch(API+encodeURIComponent(K.slot(i,0)))).text());
   const prof=async(me,cm)=>{const p=await page(lid,{me,cm});await p.goto(APP+'/league.html?l='+lid,{waitUntil:'networkidle2'});await sleep(2500);await nav(p,'profile');await sleep(800);return p};
   let p=await prof({mid:other.id,k:other.k});ok('manager link signs in (HOOPS.me = their name)',await p.evaluate(()=>HOOPS.me)===other.name);
   ok('non-commissioner: no "Make a new link" tool',!(await p.$('[data-hnl]')));
   await p.type('#profPin','wrong-pass');await p.evaluate(()=>profCmGo());await sleep(800);ok('wrong passcode does not unlock',!(await p.$('[data-hnl]'))&&!(await p.evaluate(()=>HOOPS.cmOk)));
   ok('forged call without passcode is refused',await p.evaluate(async id=>{window.confirm=()=>true;await HOOPS.newLink(id);return !HOOPS.nl.url},tgt.id));await p._c.close();
   p=await prof({mid:I.managers[0].id,k:I.managers[0].k});await p.type('#profPin',I.cmSecret);await p.evaluate(()=>profCmGo());await sleep(1200);
   const btn=await p.$('[data-hnl="'+tgt.id+'"]');ok('commissioner (valid passcode): "Make a new link for '+tgt.name+'"',!!btn&&(await p.evaluate(e=>e.textContent,btn))==='Make a new link for '+tgt.name);
   const before=await claimOf(3);await btn.click();await p.waitForSelector('#cmNewUrl',{timeout:15000}).catch(()=>{});await sleep(300);
   const url=await p.$eval('#cmNewUrl',e=>e.value).catch(()=>'');const hp=new URLSearchParams(url.split('#')[1]||'');const newK=hp.get('k');
   ok('new private link shown with Copy',!!newK&&hp.get('as')===tgt.id&&!!(await p.$('#cmNewCopy')),url);await p.evaluate(()=>{const e=document.getElementById('cmNewOut')||document.getElementById('cmTools');if(e)e.scrollIntoView({block:'center'})});await p.screenshot({path:SHOTS+'/newlink-commish-desktop.png'});
   const after=await claimOf(3);ok('claim hash replaced',before&&after&&before.sh!==after.sh&&after.mid===tgt.id);
   ok('old secret rejected',!(await F.checkMgrSecret(after,tgt.k)));ok('new secret accepted',await F.checkMgrSecret(after,newK));await p._c.close();
   p=await prof({mid:tgt.id,k:tgt.k});ok('OLD link: league page does not sign in',await p.evaluate(()=>HOOPS.me)===null);await p._c.close();
   p=await prof({mid:tgt.id,k:newK});ok('NEW link: league page signs in',await p.evaluate(()=>HOOPS.me)===tgt.name);await p._c.close()}
  /* ---------- 5) one page for every league: two leagues, own names / managers / rosters / keys; landing without a code ---------- */
  {const A=await seed(API,{managers:5,rounds:6,rosters:snake(5,6),name:'Winter Hoops 2026'});const IA=seed.info;const B=await seed(API,{managers:6,rounds:5,rosters:snake(6,5),name:'Summer League 2027',names:[['Zed','Zephyrs','🌀'],['Yan','Yetis','❄️']]});const IB=seed.info;
   const p=await page(A,{me:{mid:IA.managers[0].id,k:IA.managers[0].k}});await p.goto(APP+'/league.html?l='+A,{waitUntil:'networkidle2'});await sleep(2500);
   const a=await p.evaluate(()=>({h:document.getElementById('hoopsLg').textContent,n:D.owners.map(o=>o.name).sort(),me:HOOPS.me,hk:HK}));
   await p.goto(APP+'/league.html?l='+B,{waitUntil:'networkidle2'});await sleep(2500);
   const b=await p.evaluate(()=>({h:document.getElementById('hoopsLg').textContent,n:D.owners.map(o=>o.name).sort(),me:HOOPS.me,hk:HK,keys:[...new Set(performance.getEntriesByType('resource').map(e=>e.name).filter(u=>u.includes('/api/data/')).map(u=>decodeURIComponent(u.split('/api/data/')[1]).split('-')[1]))]}));
   ok('league A: its own name + managers',a.h==='WINTER HOOPS 2026'&&a.n.length===5&&a.me===IA.managers[0].name,a);
   ok('league B: its own name + 6 managers, not signed in with A\'s link',b.h==='SUMMER LEAGUE 2027'&&b.n.length===6&&b.n.includes('Zed')&&b.me===null,b);
   ok('league B reads only its own shoops1-<code>- keys; device keys per league',b.keys.length===1&&b.keys[0]===B.toLowerCase()&&a.hk!==b.hk,b.keys);
   await p.goto(APP+'/league.html',{waitUntil:'networkidle2'});await sleep(2000);
   const L0=await p.evaluate(()=>({h:document.getElementById('hoopsLg').textContent,t:document.getElementById('main').innerText,links:[...document.querySelectorAll('#main a')].map(a=>a.getAttribute('href'))}));
   ok('no code: landing with Start a new NBA draft + both leagues on this device',/Start a new NBA draft/.test(L0.t)&&L0.links.includes('setup.html')&&L0.links.some(h=>h.includes(A))&&L0.links.some(h=>h.includes(B))&&/WINTER HOOPS 2026/.test(L0.t)&&/SUMMER LEAGUE 2027/.test(L0.t),L0);
   await p.screenshot({path:SHOTS+'/landing-no-code-desktop.png'});await p._c.close()}
  ok('no page errors',!errs.length,errs.slice(0,5));
 }catch(e){bad++;console.log('FAIL exception',e.stack)}
 await browser.close();mock.kill();console.log(`\n${n-bad}/${n} passed`);process.exit(bad?1:0)})();
