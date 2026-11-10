/* s28g = STOOPIDS s29d S29D-GF: Upcoming | Past games = plain .rkseg/.rkseg-b toggle at natural width (= Standings toggle values), slim .gf2 row under it (Owner, Month, Day, + Owner vs owner on Upcoming), no card; Games grid 1/2/3/4 columns. Was: s28c Games tab (STOOPIDS design, Paul via NCAA): one full-width row of 4 equal controls = Upcoming | Past games (.rkseg/.rkseg-b toggle, .on = active)
   + owners <select> + months <select> (no month buttons, no day select); no counts, no emoji on the toggles; no 'Times in your time zone' / favorite-underdog
   note and no 'Betting lines posted so far' note; 'Owner vs owner' compact under the row. Month filter works. 320/390/1280: no overflow, taps >= 44px tall.
   TZ=Asia/Jakarta APP=... API=... node tests/e2e_games_s28c.js   (SHOTS=dir, SHOTTAG=before|after for screenshots only) */
const CAP=+(process.env.CONTENT_MAX||1012),NAVM=1080,COLS=w=>Math.max(1,Math.floor((Math.min(w,CAP)-32+16)/336));   /* s28j item 2 change: content = --content-max (STOOPIDS Standings column, value pending), nav keeps 1080; Games auto-fill 320px + 16px gap */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');
const TZ=process.env.TZ||'Asia/Jakarta';const SH=process.env.SHOTS||'',TAG=process.env.SHOTTAG||'after';
let n=0,bad=0;function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const TIDS=TD.teams.map(t=>t[0]);
const NAMES=[['Ana','Aces','🏀'],['Ben','Blazers','🔥'],['Cy','Comets','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];const R=TIDS.slice(0,64);const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));const own=(m,k)=>R[m*8+k];
const now=Date.now(),D=864e5;const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');
const G=(id,h,a,t,o)=>Object.assign({id,day:'2000-01-01',start:iso(t),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:h,score:null,seed:null},away:{id:a,score:null,seed:null}},o||{});
const FIN=(id,h,a,t)=>G(id,h,a,t,{status:'final',home:{id:h,score:70,seed:null},away:{id:a,score:64,seed:null}});
const GAMES=[FIN('f1',own(1,1),own(0,1),now-D),FIN('f2',own(2,1),own(3,1),now-2*D),G('u1',own(1,0),own(0,0),now+D,{line:{fav:own(1,0),sp:3.5}}),G('u2',own(2,0),own(3,0),now+2*D),G('u3',own(2,2),own(0,2),now+40*D),G('u4',own(3,3),own(1,3),now+70*D)];
const mk=t=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit'}).format(new Date(t));
async function open(id,info,w){const P=await L.phone('g8'+Math.random().toString(36).slice(2,6),{desktop:w>=760,w,h:900,tz:TZ});
  await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});
  await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);
  P.page.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});
    else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
  await P.go('league.html?l='+id+'#games');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(900);return P}
const ST=e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect();return{h:Math.round(b.height),pad:c.padding,fs:c.fontSize,fw:c.fontWeight,rad:c.borderRadius,bg:c.backgroundColor,col:c.color}};
const row=P=>P.page.evaluate((STs)=>{const ST=eval(STs);const t=document.querySelector('#lbody .rkseg.gctl'),f=document.querySelector('#lbody .gf2');if(!t||!f)return null;const tb=t.getBoundingClientRect(),fb=f.getBoundingClientRect(),lb=document.getElementById('lbody').getBoundingClientRect();
  const kids=[...t.children].map(e=>Object.assign(ST(e),{txt:e.innerText.trim(),cls:e.className,ap:e.getAttribute('aria-pressed'),w:Math.round(e.getBoundingClientRect().width)}));
  const fk=[...f.children].map(e=>{const b=e.getBoundingClientRect();return{id:e.id,a:e.dataset.a||'',tag:e.tagName,w:Math.round(b.width),h:Math.round(b.height),top:Math.round(b.top),left:Math.round(b.left)}});
  return{kids,tw:Math.round(tb.width),tleft:Math.round(tb.left-lb.left),fk,ftop:Math.round(fb.top),tbot:Math.round(tb.bottom),fleft:Math.round(fb.left-lb.left),lw:Math.round(lb.width),fh:Math.round(fb.height),
   inCard:!!t.closest('.card')||!!f.closest('.card'),fcard:getComputedStyle(f).backgroundColor,day:!!document.getElementById('gDaySel'),sw:document.documentElement.scrollWidth,iw:innerWidth,text:document.getElementById('lbody').innerText,
   small:[...document.querySelectorAll('#lbody button,#lbody select,#lbody input,#lbody label')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&!e.closest('.gm')&&b.height<43.5}).map(e=>e.className||e.id||e.tagName)}},ST.toString());
const shot=async(P,w)=>{if(!SH)return;const c=await P.page.evaluate(()=>{const e=document.querySelector('#lbody');const r=e.getBoundingClientRect();return{x:0,y:Math.max(0,r.top+scrollY-8),width:innerWidth,height:Math.min(700,r.height+16)}});
  const f=path.join(SH,TAG+'_games_'+w+'.png');await P.page.screenshot({path:f,clip:c});console.log('  shot '+f)};
(async()=>{try{const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;
  if(SH&&TAG==='before'){for(const w of [390,1280]){const P=await open(id,info,w);await shot(P,w);await P.close()}await L.close();process.exit(0)}
  for(const w of [320,390,1280]){const P=await open(id,info,w);let r=await row(P);
    ok(w+'px: toggle row = Upcoming | Past games only (.rkseg/.rkseg-b = STOOPIDS s29d S29D-GF), natural width, left-aligned',r&&r.kids.length===2&&r.kids[0].txt==='Upcoming'&&r.kids[1].txt==='Past games'&&r.kids.every(k=>/^rkseg-b( on)?$/.test(k.cls))&&r.tw<r.lw*0.9&&r.tleft<=1,r&&{k:r.kids,tw:r.tw,lw:r.lw,tl:r.tleft});
    ok(w+'px: aria-pressed on the active toggle',r&&r.kids[0].ap==='true'&&r.kids[1].ap==='false',r&&r.kids);
    ok(w+'px: Upcoming filters row directly below the toggle: owners, month, day, Owner vs owner; left-aligned; no card, small Day select',r&&r.fk.map(k=>k.id||k.a).join()==='gOwnerSel,gMonthSel,gDaySel,gh2h'&&r.ftop>=r.tbot-1&&r.ftop-r.tbot<=12&&r.fleft<=1&&!r.inCard&&r.day,r&&{fk:r.fk,ftop:r.ftop,tbot:r.tbot,inCard:r.inCard,day:r.day});
    ok(w+'px: slim filter row (1 line at 1280, at most 3 on phones = reference .gf2 wrap, s28j item 13)',r&&(w>=760?new Set(r.fk.map(k=>k.top)).size===1:new Set(r.fk.map(k=>k.top)).size<=3),r&&r.fk);
    ok(w+'px: no time-zone/favorite note and no Betting lines note',r&&!/Times in your time zone|betting favorite|underdog|Betting lines posted/i.test(r.text));
    ok(w+'px: no horizontal overflow; controls >= 44px tall',r&&r.sw<=r.iw&&r.kids.every(k=>k.h>=44)&&r.fk.every(k=>k.h>=44)&&!r.small.length,r&&{sw:r.sw,iw:r.iw,small:r.small});
    {const sg=await P.page.evaluate(async(STs)=>{const ST=eval(STs);const g=[...document.querySelectorAll('#lbody .rkseg.gctl .rkseg-b')].map(ST);document.querySelector('#ltabs [data-v=standings]').click();await new Promise(r=>setTimeout(r,500));
      const s=[...document.querySelectorAll('#lbody .segv .seg')].map(ST);document.querySelector('#ltabs [data-v=games]').click();await new Promise(r=>setTimeout(r,500));return{g,s}},ST.toString());
      ok(w+'px: Games toggle = Standings toggle (height, padding, font-size, weight, radius, on/off colours)',sg.s.length===2&&sg.g.length===2&&[0,1].every(i=>['h','pad','fs','fw','rad','bg','col'].every(k=>sg.g[i][k]===sg.s[i][k])),sg)}
    if(w===390){const mo=await P.page.$$eval('#gMonthSel option',o=>o.map(x=>[x.value,x.text,x.disabled]));const want=new Set(GAMES.filter(g=>g.status!=='final').map(g=>mk(Date.parse(g.start)).slice(5)));
      ok('months select (s29d): Month + Nov..Apr, months without games disabled',mo[0][0]===''&&mo[0][1]==='Month'&&mo.slice(1).map(x=>x[1]).join()==='Nov,Dec,Jan,Feb,Mar,Apr'&&mo.slice(1).filter(x=>!x[2]).length===want.size,mo);
      const last=mo.filter(x=>x[0]&&!x[2]).pop();await P.page.select('#gMonthSel',last[0]);await sleep(400);const ids=await P.page.$$eval('#lbody .gm',e=>e.map(x=>x.dataset.gid));
      ok('month jumps to the first game day of that month, select turns .on',ids.length>=1&&ids.every(i=>{const g=GAMES.find(g=>g.id===i);return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(g.start))===last[0]})&&await P.page.$eval('#gMonthSel',e=>e.classList.contains('on')),{ids,last});
      await P.page.select('#gDaySel','all');await sleep(300);
      await P.page.click('[data-a=gh2h]');await sleep(300);ok('Owner vs owner toggles .on',await P.page.$eval('[data-a=gh2h]',e=>e.classList.contains('on')&&e.getAttribute('aria-pressed')==='true'));await P.page.click('[data-a=gh2h]');await sleep(300);
      await P.page.click('[data-a=gmode][data-v=scores]');await sleep(400);r=await row(P);
      ok('Past games: pressed moves, finished games listed; its filter row = owners + month + day (no Owner vs owner)',r.kids[1].ap==='true'&&r.kids[0].ap==='false'&&await P.page.$$eval('#lbody .gsum',e=>e.length)===2&&r.fk.map(k=>k.id||k.a).join()==='gOwnerSel,gMonthSel,gDaySel',r.fk);
      if(SH)await shot(P,'390-past');
      await P.page.click('[data-a=gmode][data-v=upcoming]');await sleep(400)}
    if(w!==320)await shot(P,w);await P.close()}
  for(const [w,want] of [1800,1440,1280,1000,700,390].map(w=>[w,COLS(w)])){const P=await open(id,info,w);const r=await P.page.evaluate(()=>{const g=document.querySelector('#lbody .ggrid'),m=document.querySelector('main');if(!g)return null;
      const cards=[...document.querySelectorAll('#lbody .ggrid>.gm')];const bad=cards.flatMap(c=>{const cb=c.getBoundingClientRect();return[...c.querySelectorAll('button,a')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&(r.right>cb.right+1||r.left<cb.left-1||(b.matches('.qb-btn')&&r.height<43.5))}).map(b=>b.className)});
      return{cols:getComputedStyle(g).gridTemplateColumns.split(' ').length,mw:Math.round(m.getBoundingClientRect().width),cw:Math.round(cards[0]&&cards[0].getBoundingClientRect().width),bad,sw:document.documentElement.scrollWidth,iw:innerWidth}});
    ok(w+'px Games grid: '+want+' column(s), cards >= 240px wide, Copy / Quick bet inside the card, Quick bet >=44px (Copy 32px = STOOPIDS), no overflow; main = --content-max column (s28j: auto-fill 320px, 3 at 1280/1440, 4 at 1800)',r&&r.cols===want&&r.cw>=240&&!r.bad.length&&r.sw<=r.iw&&r.mw===Math.min(w,CAP),r);
    if((w===1280||w===1440)&&SH){const f=path.join(SH,TAG+'_games_grid_'+w+'.png');await P.page.screenshot({path:f});console.log('  shot '+f)}await P.close()}
}catch(e){bad++;console.log('FAIL  crashed: '+(e&&e.stack||e))}
console.log('\n'+(n-bad)+' / '+n+' checks passed'+(bad?' — FAILED':''));await L.close();process.exit(bad?1:0)})();
