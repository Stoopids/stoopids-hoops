/* sh27: full-site check after the catch-up to [REDACTED] 4c3c4d4, on a SYNTHETIC league in the local mock store (never textdb.dev).
   Live ESPN NBA reads are allowed (public, read-only) so the live scores path is exercised. Mobile (Android size) + desktop.
   NODE_PATH=/tmp/node_modules OUT=/workspace/nba-league/screens-st node tests/e2e_sh27.js */
const { chromium } = require('playwright-core');
const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||8971);fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+(typeof x==='string'?x:JSON.stringify(x)):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const names=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh27',names});const me=seed.info.managers[0],cm=seed.info.cmSecret;
  const VP=[['mobile',412,915,true],['desktop',1280,900,false]];
  for(const v of VP){
   const c=await br.newContext({viewport:{width:v[1],height:v[2]},deviceScaleFactor:v[3]?2:1,isMobile:v[3],hasTouch:v[3],timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.route(/textdb\.dev/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:me.id,k:me.k}});
   const p=await c.newPage();const errs=[],bad=[],espn=[];
   p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/\/api\/ping$/.test((m.location()||{}).url||''))errs.push('console '+m.text()+' @ '+((m.location()||{}).url||''))});
   p.on('response',r=>{const u=r.url();if(/espn\.com/.test(u))espn.push(r.status()+' '+u.replace(/\?.*/,''));if(r.status()>=400&&!/textdb\.dev/.test(u)&&!/\/api\/ping$/.test(u)/* local mock only: league.html skips api/ping on *.github.io */)bad.push(r.status()+' '+u)});
   p.on('requestfailed',r=>{const u=r.url();if(!/textdb\.dev/.test(u)&&!/ERR_ABORTED/.test((r.failure()||{}).errorText||''))bad.push('failed '+(r.failure()||{}).errorText+' '+u)});
   const T=v[0];
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#standings`);
   const raw=await (await fetch(`http://127.0.0.1:${HP}/league.html`)).text();ok(T+' static h1 in the page source is the Hoops default (no bare [REDACTED] flash)',/<h1 id="hoopsLg">STOOPIDS <span>HOOPS<\/span><\/h1>/.test(raw)&&!/STOOP<span>IDS<\/span><\/h1>/.test(raw));let h0=null;for(let k=0;k<5&&h0==null;k++){try{h0=await p.evaluate(()=>document.getElementById('hoopsLg')&&document.getElementById('hoopsLg').textContent)}catch(e){await sleep(800)}}/* first visit: the service worker takes control and the page reloads once */ok(T+' title element present',!!h0,h0);
   await sleep(2500);await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who(),{timeout:40000});await sleep(2500);
   const h1=await p.evaluate(()=>document.getElementById('hoopsLg').textContent);ok(T+' title shows the league name',/TEST SYNTHETIC sh27/i.test(h1),h1);
   const ver=await p.evaluate(()=>window.FBN_BUILD);ok(T+' build',ver==='2026-11-14sh27',ver);
   await p.screenshot({path:`${OUT}/sh27-standings-${T}.png`});
   // draft room nav item
   const dn=await p.evaluate(()=>{const a=document.querySelector('#nav a.nd');return a?{href:a.getAttribute('href'),more:a.classList.contains('nm-x'),txt:a.textContent}:null});
   ok(T+' Draft room link wired (phone: in More; wider: hidden so 8 tabs keep full labels)',!!dn&&/room\.html\?l=/.test(dn.href)&&(T==='mobile'?dn.more:true),dn);
   const cut=await p.evaluate(()=>[...document.querySelectorAll('#nav > a')].filter(a=>a.offsetParent).map(a=>{const f=a.querySelector('.nl.f');return f&&getComputedStyle(f).display!=='none'&&f.scrollWidth>f.clientWidth+1?f.textContent:''}).filter(Boolean));ok(T+' no cut-off nav labels',cut.length===0,cut);
   if(T==='mobile'){await p.click('#nav .nm-b');await sleep(400);const items=await p.evaluate(()=>[...document.querySelectorAll('.nm-sh .nm-i')].map(b=>b.textContent.trim()));ok('mobile More sheet lists Draft',items.some(x=>/Draft/.test(x)),items);
    await p.screenshot({path:`${OUT}/sh27-more-mobile.png`});await p.keyboard.press('Escape');await sleep(300)}
   // games + live scores
   await p.evaluate(()=>{tab='games';render()});await sleep(4000);
   const g=await p.evaluate(()=>({cards:document.querySelectorAll('#main .gcard, #main [data-gid], #main .g').length,wk:/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(day)?\b/.test(document.getElementById('main').innerText),txt:typeof S29G==='object'?Object.keys(S29G).length:0}));
   ok(T+' Games tab has game cards',g.cards>0||g.txt>0,g);ok(T+' Games: no weekday names',!g.wk);
   const gt=await p.evaluate(()=>{const ks=Object.keys(S29G||{});const owned=ks.map(k=>S29G[k]).find(x=>x&&x.away&&x.home&&((x.away.owners||[]).length||(x.home.owners||[]).length));const up=ks.map(k=>S29G[k]).find(x=>x&&x.status!=='final'&&x.status!=='live'&&Date.parse(x.start)>Date.now()),fin=ks.map(k=>S29G[k]).find(x=>x&&x.status==='final');return ks.length?{any:s29GameText(S29G[ks[0]]),owned:owned?s29GameText(owned):'',up:up?s29GameText(up):'',fin:fin?s29GameText(fin):''}:null});console.log('   game copy:',JSON.stringify(gt));
   ok(T+' game-card Copy is plain text, no bombs',gt&&!/💣|💥/.test(gt.any+gt.owned),gt);ok(T+' game-card Copy names the manager in parentheses',gt&&/\((Ana|Ben|Cy|Dee|Eli|Fay)\)/.test(gt.owned),gt&&gt.owned);
   let lv=null;for(let k=0;k<30;k++){lv=await p.evaluate(()=>({polls:LV.polls,events:LV.events,matched:LV.matched,busy:LV.busy,err:LV.err,live:(D.games||[]).filter(g=>g.status==='live').map(g=>g.away.short+' '+g.away.score+'-'+g.home.score+' '+g.home.short)}));if(lv.events>0&&!lv.busy)break;await sleep(1000)}
   ok(T+' live ESPN poll applied (events matched to the NBA schedule)',lv.events>0&&lv.matched>0&&!lv.err,lv);ok(T+' live games show scores',lv.live.every(x=>!/null|undefined/.test(x)),lv.live);
   await p.evaluate(()=>render());await sleep(500);
   await p.screenshot({path:`${OUT}/sh27-games-${T}.png`});
   // bets: Make A Bet
   await p.evaluate(()=>{tab='bets27';OB_VIEW='form';render()});await sleep(1500);
   const mb=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)];const desk=q('.ob-desk button, .ob-desk a').filter(b=>b.offsetParent).map(b=>({t:b.textContent.trim(),w:Math.round(b.getBoundingClientRect().width)}));
     const rq=document.getElementById('rqForm');const chips=rq?[...rq.querySelectorAll('.b27-amt, [aria-label="Odds"] .b27-chip')].map(b=>b.textContent.trim()):[];const mode=rq&&rq.querySelector('[data-rq-in="mode"]');const when=rq&&rq.querySelector('select.rq-when');
     const all=document.getElementById('main').innerText;return {desk,chips,mode:mode&&mode.value,when:when&&when.value,whenSel:!!when,wiuToggle:q('#main .entry-hd button, #main .entry-hd [role=tab], #main .entry-hd .b27-kind').map(b=>b.textContent.trim()).join(' | '),parlay:q('#main [data-rq="parlay"], #main [data-wiu="parlay"]').length,
       disclaimer:/settled in pullups|just for fun/i.test(all),hasRq:!!rq}});
   ok(T+' Request form present',mb.hasRq);ok(T+' Request chips: 5 10 20 25 Custom, Even 2-1 3-1 4-1 Custom (no 50, no 5-1)',mb.chips.join(',')==='5,10,20,25,Custom,Even,2-1,3-1,4-1,Custom',mb.chips);
   ok(T+' Request defaults: Expires Tipoff',mb.mode==='start',mb.mode);ok(T+' Request settle is a dropdown, default End of game',mb.whenSel&&mb.when==='game',mb.when);
   ok(T+' Write It Up toggle says Stoop v Stoop · Pool/Buy-In',/Stoop v Stoop/.test(mb.wiuToggle)&&/Pool\/Buy-In/.test(mb.wiuToggle),mb.wiuToggle);
   ok(T+' Parlay builder on Request and Write It Up',mb.parlay>=2,mb.parlay);ok(T+' no bets disclaimer',!mb.disclaimer);
   if(T==='desktop'){ok('desktop sub-tabs Make A Bet, All Bets, Stoopid Bet, Tally',mb.desk.map(x=>x.t).join(',')==='Make A Bet,All Bets,Stoopid Bet,Tally',mb.desk);ok('desktop sub-tabs equal width',new Set(mb.desk.map(x=>x.w)).size===1,mb.desk.map(x=>x.w))}
   await p.screenshot({path:`${OUT}/sh27-bets-makeabet-${T}.png`,fullPage:T==='desktop'});
   const wiuWhen=await p.evaluate(()=>{const s=[...document.querySelectorAll('#main select.rq-when, #main select[aria-label="When can this be settled?"]')].map(x=>x.value);return s});ok(T+' Write It Up settle default End of game',wiuWhen.length>=2&&wiuWhen.every(x=>x==='game'),wiuWhen);
   if(T==='desktop'){await p.evaluate(()=>window.scrollTo(0,1400));await sleep(600);const st=await p.evaluate(()=>{const n=document.getElementById('nav').getBoundingClientRect(),o=document.querySelector('.ob-desk').getBoundingClientRect();return {nav:Math.round(n.top),sub:Math.round(o.top)}});
    ok('desktop main tabs + sub-tabs freeze on scroll',st.nav>=-2&&st.nav<80&&st.sub>=0&&st.sub<160,st);await p.screenshot({path:`${OUT}/sh27-bets-sticky-desktop.png`});await p.evaluate(()=>window.scrollTo(0,0))}
   // parlay builder opens
   let pyo={};for(const sel of ['#main [data-rq="parlay"]','#main [data-wiu="parlay"]']){await p.evaluate(x=>{OB_VIEW=/rq/.test(x)&&innerWidth<1000?'request':'form';render()},sel);await sleep(500);const b=await p.$(sel+':visible');if(b){await b.click();await sleep(1300)/* [REDACTED] holds re-renders 0.9 s after a form press (parlay click fix) */}pyo[sel]=await p.evaluate(s=>{const x=document.querySelector(s);return !!x&&x.getAttribute('aria-expanded')==='true'&&!!x.closest('.py-wrap').querySelector('select, .py-leg, button:not(.ln-go)')},sel)}
   ok(T+' parlay builder opens on Request and Write It Up',Object.values(pyo).length===2&&Object.values(pyo).every(Boolean),pyo);await p.screenshot({path:`${OUT}/sh27-bets-parlay-${T}.png`,fullPage:T==='desktop'});
   // pool form
   await sleep(1000);await p.evaluate(()=>{OB_VIEW='form';b27Kind('pool');render()});await sleep(600);const pool=await p.evaluate(()=>document.querySelectorAll('.pool-pick [data-b27-pp]').length);ok(T+' Pool/Buy-In form lists every manager',pool===6,pool);
   await p.evaluate(()=>{b27Kind('bet');render()});await sleep(300);
   // all bets / tally
   for(const ov of ['all','tally']){await p.evaluate(o=>{OB_VIEW=o;render()},ov);await sleep(900);const t=await p.evaluate(()=>document.getElementById('main').innerText.length);ok(T+' Bets '+ov+' renders',t>100,t);await p.screenshot({path:`${OUT}/sh27-bets-${ov}-${T}.png`})}
   // Stoopid Bet
   await p.evaluate(()=>{OB_VIEW='stoopid';render()});let sb=null;for(let k=0;k<20;k++){await sleep(700);sb=await p.evaluate(()=>({n:document.querySelectorAll('#main .sb-card, #main [data-sb-id], #main .sb-idea').length,ideas:(window.SB&&SB.ideas||[]).length,txt:(window.SB&&SB.ideas||[]).slice(0,40).map(i=>i.text),pills:[...document.querySelectorAll('#main .sb-own')].map(b=>b.textContent.trim()),opp:[...document.querySelectorAll('#main .sb-opp option')].map(o=>o.textContent)}));if(sb.ideas>8)break}
   ok(T+' Stoopid Bet has ideas',sb.ideas>=8,sb.ideas);ok(T+' Stoopid Bet ideas: no NET / NCAA wording',!sb.txt.some(x=>/\bNET\b|NCAA|college|seed/i.test(x)),sb.txt.filter(x=>/\bNET\b|NCAA|college|seed/i.test(x)));
   ok(T+' Stoopid Bet pills',sb.pills.join(',').startsWith('Stoop vs Stoop,Props,Parlay,Season'),sb.pills);console.log('   sample ideas:',JSON.stringify(sb.txt.slice(0,6)));
   const nbaTeam=await p.evaluate(()=>{const names=Object.values(D.teams||{}).map(t=>t.short||t.name).filter(Boolean);return (SB.ideas||[]).some(i=>names.some(n=>i.text.includes(n)))});ok(T+' Stoopid Bet ideas name NBA teams',nbaTeam);
   await p.screenshot({path:`${OUT}/sh27-bets-stoopid-${T}.png`,fullPage:T==='desktop'});
   for(const k of ['seed','month','duo','team']){await p.evaluate(k=>{SB.extra=true;sbCat(k)},k);await sleep(300)}
   const bpi=await p.evaluate(()=>(SB.ideas||[]).filter(i=>i.cat==='seed').map(i=>i.text).slice(0,3));console.log('   BPI ideas:',JSON.stringify(bpi));
   // pick an idea -> fills Request (nothing posted)
   const before=await p.evaluate(()=>(RQ&&RQ.S&&RQ.S.list||[]).length);await p.evaluate(()=>sbCat('vs'));await sleep(300);
   const filled=await p.evaluate(()=>{const b=document.querySelector('#main [onclick^="sbFill"]');if(!b)return 'no button';b.click();return 'ok'});await sleep(900);
   const rf=await p.evaluate(()=>({view:OB_VIEW,txt:(RQ&&RQ.S&&RQ.S.f&&RQ.S.f.text)||'',n:(RQ&&RQ.S&&RQ.S.list||[]).length,mode:(document.querySelector('#rqForm [data-rq-in="mode"]')||{}).value}));ok(T+' Stoopid Bet Request fills the Request form, nothing posted',filled==='ok'&&/Stoopid bet|beats|wins|rides|loses|gets/.test(rf.txt)&&rf.n===before,Object.assign({filled},rf));
   // other tabs
   for(const t of ['teams','about','archive','checklist','profile']){await p.evaluate(t=>{tab=t;render()},t);await sleep(1200);const r=await p.evaluate(()=>({tab,len:document.getElementById('main').innerText.length,wk:/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/.test(document.getElementById('main').innerText)}));ok(T+' tab '+t+' renders',r.len>50,r);await p.screenshot({path:`${OUT}/sh27-${t}-${T}.png`})}
   // commissioner tools (synthetic passcode)
   await p.evaluate(async c=>{await HOOPS.cmUnlock(c);tab='profile';render()},cm);await sleep(1200);const cmr=await p.evaluate(()=>({nl:!!document.getElementById('cmNewLink'),give:!!document.getElementById('cmGive'),draft:[...document.querySelectorAll('#cmTools a')].map(a=>a.getAttribute('href')).filter(h=>/room/.test(h)),name:/Paul/.test(document.getElementById('main').innerText)}));
   ok(T+' commish: private manager links in the Commissioner card',cmr.nl,cmr);ok(T+' commish Draft room pill opens this league\'s room',cmr.draft.length>0,cmr.draft);ok(T+' no hardcoded [REDACTED] commissioner name',!cmr.name);
   await p.screenshot({path:`${OUT}/sh27-profile-commish-${T}.png`,fullPage:true});await p.evaluate(()=>{profCmLock();render()});
   // chat
   const chat=await p.evaluate(()=>!!document.querySelector('#chatBar, .chat-bar, [id^=chat]'));ok(T+' chat bar present',chat);
   // live scores
   ok(T+' live ESPN NBA calls succeed (site.web.api)',espn.some(x=>/^200 .*site\.web\.api\.espn\.com.*\/nba\/scoreboard/.test(x)),espn.slice(0,4));ok(T+' no browser call to site.api.espn.com',!espn.some(x=>/\/\/site\.api\.espn\.com/.test(x)),espn.filter(x=>/\/\/site\.api/.test(x)).slice(0,3));
   ok(T+' no page/console errors',errs.length===0,errs.slice(0,8));ok(T+' no failed/4xx requests (besides blocked textdb)',bad.length===0,[...new Set(bad)].slice(0,8));
   // draft room, setup, join
   for(const [pg,sh] of [[`room.html?l=${id}`,'room'],['setup.html','setup'],[`join.html?l=${id}`,'join'],['index.html','home']]){const e2=[];const q=await c.newPage();q.on('pageerror',e=>e2.push(e.message));q.on('console',m=>{if(m.type()==='error'&&!/textdb|ERR_FAILED/.test(m.text()))e2.push(m.text())});await q.goto(`http://127.0.0.1:${HP}/${pg}`);await sleep(3500);ok(T+' '+sh+' loads without errors',e2.length===0,e2.slice(0,4));await q.screenshot({path:`${OUT}/sh27-${sh}-${T}.png`});await q.close()}
   await c.close()}
 }finally{await br.close();mock.kill()}console.log(nf?nf+' failed':'all passed');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
