/* sh30: STOOPIDS PR #72 (shared/ui.js 1.84.0) free-written requests, ported to Hoops, plus BUG-7 (started game) on top.
   SYNTHETIC league in the local mock store (never textdb.dev, no real league). ESPN blocked so the baked schedule is used.
   Game 401909984 = Chicago at Minnesota, tip 8:00 pm ET Nov 14 (01:00Z Nov 15). Mobile 412x915.
   1) before tip: matched text links + expires at tip; unmatched text asks for expiry, then settle, then posts as free text;
      a card-picked game (Quick bet) links even when the words name no team.
   2) after tip: typed text naming the started game is blocked ("That game has already started.") with or without a hand-picked expiry;
      a card-picked started game is blocked too; settle "End of season" lets a season bet that mentions a team post as free text.
   3) Teams table: no Stoopids Rank column, opens on Proj pts highest first.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh30.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||9041),PRE=process.env.PRE||'sh30',BUILD=process.env.BUILD||'2026-11-16sh30';fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const GID='401909984',TIP=Date.parse('2026-11-15T01:00:00Z');
const MATCHED='Minnesota Timberwolves and Chicago Bulls game: over 234.5 pts tonight.';
const FREE='Ana outscores Ben in league points this week';
const SEASON='Bulls finish ahead of the Timberwolves this season';
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh30',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
  const M=seed.info.managers;
  async function open(when,hash){const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.clock.install({time:new Date(when)});
   await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[0].id,k:M[0].k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
   await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(1500);
   return {c,p,errs}}
  async function form(p,text,gid){await p.evaluate(g=>{tab='bets27';OB_VIEW='request';RQ.S.f=Object.assign(RQ.S.f,{});if(g)RQ.prefill(g,null,0);else{RQ.S.f.gid=''}render()},gid||'');await sleep(700);
   if(text!=null)await p.fill('#rqForm [data-rq-in="text"]',text);await sleep(300);
   await p.evaluate(()=>{const b=[...document.querySelectorAll('#rqForm .b27-amt')].find(x=>x.textContent.trim()==='5');if(b)b.click()});await sleep(500)}
  async function send(p){const b=await p.evaluate(()=>(RQ.S.list||[]).length);await p.evaluate(()=>{navigator.clipboard.writeText('')});await p.evaluate(()=>document.querySelector('#rqForm [data-rq="send"]').click());await sleep(2500);
   return p.evaluate(b=>{const L=RQ.S.list||[],last=L.length>b?L[L.length-1]:null;return {n:L.length-b,msg:RQ.S.msg,bad:RQ.S.bad,last:last&&{gid:last.gid,game:last.game,date:last.date,exp:last.exp,wk:last.wk,free:last.free||0,txt:last.txt,lab:last.lab,rd:last.rd||null}}},b)}
  const clip=p=>p.evaluate(()=>navigator.clipboard.readText().catch(()=>''));
  async function shot(p,name,sel){await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:'start'});else window.scrollTo(0,0)},sel||'#rqForm');await sleep(400);await p.screenshot({path:`${OUT}/${PRE}-${name}.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-${name}.png`)}

  // ---------- 1) before tip (3:00 pm ET Nov 14)
  let V=await open('2026-11-14T20:00:00Z');let p=V.p;
  const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is '+BUILD,ver===BUILD,ver);
  const uiv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/shared\/ui\.js/.test(s)));ok('shared/ui.js is the Hoops copy of 1.84.0',uiv==='shared/ui.js?v=1.84.0.sh30',uiv);
  // a) matched text
  await form(p,MATCHED);await shot(p,'request-matched-form-mobile');
  let r=await send(p);let cp=await clip(p);
  ok('matched text: posted, linked to the game, expires at tip, settles at end of game',r.n===1&&r.last.gid===GID&&r.last.exp===TIP&&r.last.wk==='game'&&!r.last.free,r);
  ok('matched text: copy text names the bet',/234\.5/.test(cp),cp);
  await p.evaluate(()=>{OB_VIEW='all';render()});await sleep(1200);
  await shot(p,'request-matched-posted-mobile','#main .rq-card');
  // PAUL-1 kept on STOOPIDS' one copy builder: 💣 on a request, 💥 on a written-up / accepted bet
  const cx=await p.evaluate(()=>{const me=b27Who(),to=(RQ.S.list||[]).slice(-1)[0].to;const r={by:me,to:to.slice(0,1),amt:5,odds:[2,1],rd:{k:'spread',t:'Chicago',o:'Minnesota',l:-4,sp:'mcbb',d:'2026-11-14'},cov:'game',exp:Date.parse('2026-11-15T01:00Z'),wk:'game'};return {nw:RQ.copyText(r,'new'),bet:RQ.copyText(r,'bet'),acc:RQ.copyText(r,'acc',to[0])}});
  ok('copy: request 💣, written-up bet 💥, accepted 💥',/^💣 .* 💣\n/.test(cx.nw)&&/^💥 .* 💥\n/.test(cx.bet)&&/^💥 .* 💥\n/.test(cx.acc)&&/Chicago -4 v Minnesota/.test(cx.bet),cx);
  // b) unmatched text: asks for expiry, then settle, then posts the free text as written
  await form(p,FREE);
  const tg=await p.evaluate(t=>SHARED_UI.tipGame({games:(D.games||[]).map(g=>({id:String(g.id),g,start:g.start,status:g.status})),text:t,now:Date.now(),today:S25.etDay(new Date()),dateFrom:S25.dateFrom,day:S25.etDay}),FREE);
  ok('unmatched text matches no game',!tg,tg&&tg.id);
  const note=await p.evaluate(()=>document.getElementById('rqForm').innerText);ok('form says Tipoff needs a matched game',/Pick an expiry\. Tipoff needs a matched game\./.test(note),note.slice(0,400));
  r=await send(p);ok('unmatched, nothing picked: "Pick when it expires." and nothing posted',r.n===0&&r.msg==='Pick when it expires.',r);
  await shot(p,'request-free-pick-expiry-mobile');
  await p.selectOption('#rqForm [data-rq-in="mode"]','d');await sleep(400);await p.fill('#rqForm [data-rq-in="n"]','2');await sleep(300);
  r=await send(p);ok('unmatched, expiry picked: "Pick when it can be settled." and nothing posted',r.n===0&&r.msg==='Pick when it can be settled.',r);
  const wkShown=await p.evaluate(()=>{const s=document.querySelector('#rqForm [data-rq-in="wkMenu"]');return s&&s.value});console.log('INFO settle menu shows before a pick:',wkShown);
  await shot(p,'request-free-pick-settle-mobile');
  await p.selectOption('#rqForm [data-rq-in="wkMenu"]','season');await sleep(400);
  const now1=await p.evaluate(()=>Date.now());r=await send(p);cp=await clip(p);
  ok('unmatched, expiry + settle picked: posts the free text, no game, free=1, hand-picked expiry and settle',r.n===1&&!r.last.gid&&!r.last.game&&r.last.free===1&&r.last.wk==='season'&&Math.abs(r.last.exp-(now1+2*86400e3))<120e3&&r.last.txt===FREE,r);
  ok('free request copy text carries the written words',cp.includes(FREE),cp);
  ok('free request copy: starts with the bomb and $5, has Exp:, no weekday, no Tipoff',cp.indexOf('\uD83D\uDCA3 $5 ')===0&&/Exp: /.test(cp)&&!/Tipoff|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(cp),cp);
  await p.evaluate(()=>{OB_VIEW='all';render()});await sleep(1200);
  const fc=await p.evaluate(t=>{const c=[...document.querySelectorAll('#main .rq-card')].find(x=>x.innerText.includes(t));if(c)c.scrollIntoView({block:'center'});return c?c.innerText:''},FREE);
  ok('free request shows on the Bets page',fc.includes(FREE),fc.slice(0,300));await sleep(300);
  await p.screenshot({path:`${OUT}/${PRE}-request-free-posted-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-request-free-posted-mobile.png`);
  // c) card-picked game (Quick bet path) still links even when the words name no team
  const other=await p.evaluate(g=>{const n=Date.now();const x=(D.games||[]).filter(x=>x.status==='scheduled'&&Date.parse(x.start)>n+3600e3&&String(x.id)!==g).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))[0];return x&&{id:String(x.id),start:x.start,a:x.away.short,h:x.home.short}},GID);
  await p.evaluate(g=>{qbGo(g,null,0)},other.id);await sleep(900);
  const pre=await p.evaluate(()=>({gid:RQ.S.f.gid,text:RQ.S.f.text}));ok('Quick bet opens Request with the game picked',pre.gid===other.id,pre);
  await p.fill('#rqForm [data-rq-in="text"]','Over 221.5 total points');await sleep(300);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#rqForm .b27-amt')].find(x=>x.textContent.trim()==='5');if(b)b.click()});await sleep(400);
  await shot(p,'request-card-picked-form-mobile');
  r=await send(p);ok('card-picked game: posted and linked to that game, expires at its tip, not free',r.n===1&&r.last.gid===other.id&&r.last.exp===Date.parse(other.start)&&!r.last.free&&r.last.wk==='game',{other,r});
  ok('no page errors (before tip)',!V.errs.length,V.errs);await V.c.close();

  // ---------- 2) after tip (8:30 pm ET Nov 14)
  V=await open('2026-11-15T01:30:00Z');p=V.p;
  await form(p,MATCHED);r=await send(p);
  ok('started game, typed, nothing picked: "That game has already started." and nothing posted',r.n===0&&r.msg==='That game has already started.',r);
  await shot(p,'request-started-mobile');
  await p.selectOption('#rqForm [data-rq-in="mode"]','h');await sleep(300);await p.fill('#rqForm [data-rq-in="n"]','2');await sleep(300);
  r=await send(p);ok('started game, typed, expiry picked by hand: still blocked',r.n===0&&r.msg==='That game has already started.',r);
  await p.selectOption('#rqForm [data-rq-in="wkMenu"]','game');await sleep(300);
  r=await send(p);ok('started game, typed, expiry + "End of game" picked: still blocked',r.n===0&&r.msg==='That game has already started.',r);
  await p.selectOption('#rqForm [data-rq-in="wkMenu"]','unknown');await sleep(300);
  r=await send(p);ok('started game, typed, expiry + "Not sure yet": still blocked',r.n===0&&r.msg==='That game has already started.',r);
  await shot(p,'request-started-hand-picked-mobile');
  // card-picked started game (form opened before tip, sent after)
  await form(p,'Over 234.5',GID);r=await send(p);
  ok('card-picked started game: "That game has already started." and nothing posted',r.n===0&&r.msg==='That game has already started.',r);
  // a season bet that names both teams of the started game: blocked until settle is End of season, then posts as free text
  await form(p,SEASON);
  const sg=await p.evaluate(t=>{const o={games:(D.games||[]).map(g=>({id:String(g.id),g,start:g.start,status:g.status})),text:t,now:Date.now(),today:S25.etDay(new Date()),dateFrom:S25.dateFrom,day:S25.etDay};const a=SHARED_UI.tipGame(o),b=SHARED_UI.tipGame(Object.assign({live:true},o));return {upcoming:a&&String(a.id),live:b&&String(b.id)}},SEASON);
  ok('season text: no upcoming match, live match is the started game',!sg.upcoming&&sg.live===GID,sg);
  r=await send(p);ok('season text, nothing picked: "That game has already started."',r.n===0&&r.msg==='That game has already started.',r);
  await p.selectOption('#rqForm [data-rq-in="mode"]','w');await sleep(300);await p.fill('#rqForm [data-rq-in="n"]','1');await sleep(300);
  await p.selectOption('#rqForm [data-rq-in="wkMenu"]','season');await sleep(300);
  r=await send(p);ok('season text, expiry + End of season: posts as free text',r.n===1&&r.last.free===1&&!r.last.gid&&r.last.wk==='season'&&r.last.txt===SEASON,r);
  ok('no page errors (after tip)',!V.errs.length,V.errs);await V.c.close();

  // ---------- 3) Teams table (STOOPIDS 39c21df)
  V=await open('2026-11-14T20:00:00Z','teams');p=V.p;
  await p.evaluate(()=>{tab='teams';render()});await sleep(1500);
  const tt=await p.evaluate(()=>{const t=document.querySelector('#main .s27-rk table, #main table');if(!t)return null;const hs=[...t.querySelectorAll('tr:first-child th')].map(x=>x.innerText.replace(/[↕▲▼]/g,'').trim());const col=hs.findIndex(h=>/Proj pts|PJ/.test(h));
    const raw=[...t.querySelectorAll('tr')].slice(1).map(r=>(r.children[col]||{}).textContent||'');const vals=raw.map(v=>parseFloat(String(v).replace(/[^0-9.\-]/g,''))).filter(v=>!isNaN(v));window.__raw=raw.slice(0,6);const note=[...document.querySelectorAll('#main p.note')].map(x=>x.innerText).find(x=>/Proj pts/.test(x))||'';return {raw:window.__raw,col,hs,vals:vals.slice(0,6),sorted:vals.every((v,i)=>!i||vals[i-1]>=v),k:S27T.k,d:S27T.d,note}});
  ok('Teams table: no Stoopids Rank column',tt&&!tt.hs.some(h=>/Stoopid|STOOPID|STP/.test(h)),tt&&tt.hs);
  ok('Teams table: opens on Proj pts, highest first',tt&&tt.k==='kp'&&tt.d===-1&&tt.sorted&&tt.vals.length>0,tt&&{k:tt.k,d:tt.d,col:tt.col,raw:tt.raw,vals:tt.vals});
  ok('Teams note names the NBA sources',tt&&/Proj pts = projected Stoopids points from ESPN BPI/.test(tt.note)&&/BPI = ESPN BPI Power Ranking/.test(tt.note)&&!/KenPom|NET|AP Top 25/.test(tt.note),tt&&tt.note);
  await shot(p,'teams-table-mobile','#main');
  await p.evaluate(()=>{const w=document.querySelector('#main .s27-rk')||document.querySelector('#main table').parentElement;w.scrollLeft=9999});await sleep(300);await p.screenshot({path:`${OUT}/${PRE}-teams-table-projpts-mobile.png`,fullPage:true});console.log('shot',`${OUT}/${PRE}-teams-table-projpts-mobile.png`);
  ok('no page errors (teams)',!V.errs.length,V.errs);await V.c.close();
 }finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
