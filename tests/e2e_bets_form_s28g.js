/* s28g New bet form: (1) 'This will be auto-settled after completion.' under the preview when readBet() reads a clear claim AND the League schedule has a not-final game
   between those teams ('Kansas -4 beats Duke' vs a mock Kansas-Duke game: shown; 'Ana eats a pepper': not shown); the placed card shows it too.
   (2) 'One side vs another' | 'Pool / buy-in' equal width, filling the row, one line, ~12.1px (11px <=350px), >=44px; 320/390 no overflow. (3) no AUTO-SETTLE badge in the form.
   APP=... API=... node tests/e2e_bets_form_s28g.js   (SHOTS=dir -> betform-<w>.png) */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');const SH=process.env.SHOTS||'';
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const KU='2305',DUKE='150';
const rest=TD.teams.map(t=>t[0]).filter(t=>t!==KU&&t!==DUKE);const NAMES=[['Ana','Aces','🏀'],['Ben','Blazers','🔥'],['Cy','Comets','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];
const R=[KU,...rest.slice(0,7),DUKE,...rest.slice(7,62)];const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));
const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');const now=Date.now();
const GAMES=[{id:'kd1',day:'2000-01-01',start:iso(now+864e5),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:KU,score:null,seed:null},away:{id:DUKE,score:null,seed:null}}];
async function open(id,info,w){const P=await L.phone('bf'+w+Math.random().toString(36).slice(2,5),{desktop:w>=760,w,h:900});
  await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});
  await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);
  P.page.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});
    else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
  await P.go('league.html?l='+id+'#bets');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await P.page.waitForSelector('#b27Text',{timeout:20000});await sleep(500);return P}
const typeText=async(P,t)=>{await P.page.$eval('#b27Text',e=>{e.value=''});await P.page.type('#b27Text',t);await sleep(300)};
(async()=>{try{const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;
  for(const w of [320,390,1280]){const P=await open(id,info,w);
    const k=await P.page.evaluate(()=>{const b=[...document.querySelectorAll('.b27-kind>button')],row=document.querySelector('.b27-kind').getBoundingClientRect();return{n:b.length,b:b.map(x=>{const r=x.getBoundingClientRect(),c=getComputedStyle(x);return{t:x.innerText,w:r.width,h:r.height,fs:c.fontSize,sw:x.scrollWidth,cw:x.clientWidth,lh:parseFloat(c.lineHeight)||parseFloat(c.fontSize)*1.3}}),rw:row.width,sw:document.documentElement.scrollWidth,iw:innerWidth,
      form:document.getElementById('b27Form').innerText}});
    const fsW=w<=350?11:12.1;
    ok(w+'px bet type buttons: 2 equal widths filling the row, one line, '+fsW+'px, >=44px, no overflow',k.n===2&&Math.abs(k.b[0].w-k.b[1].w)<=1&&k.b[0].w+k.b[1].w>=k.rw-8&&k.b.every(b=>b.h>=44&&b.sw<=b.cw&&Math.abs(parseFloat(b.fs)-fsW)<0.05)&&k.sw<=k.iw,k);
    ok(w+'px no AUTO-SETTLE badge/label in the New bet form',!/auto[- ]?settle/i.test(k.form.replace(/This will be auto-settled after completion\./,'')),k.form.slice(0,400));
    if(w!==1280){await typeText(P,'Kansas -4 beats Duke');if(SH)await P.page.screenshot({path:path.join(SH,'betform-'+w+'.png'),clip:await P.page.$eval('#b27Form',e=>{const r=e.getBoundingClientRect();return{x:0,y:r.top+scrollY,width:innerWidth,height:Math.min(900,r.height)}})})}
    if(w===390){
      const a=await P.page.$eval('#b27AutoN',e=>e.innerText.trim());ok('"Kansas -4 beats Duke" + mock Kansas-Duke game: note under the preview',a==='This will be auto-settled after completion.',a);
      await typeText(P,'Ana eats a pepper');const b=await P.page.$eval('#b27AutoN',e=>e.innerText.trim());ok('"Ana eats a pepper": no auto-settle note',b==='',b);
      const r=await P.page.evaluate(()=>({c:LBETS._t.readBet('Kansas -4 beats Duke'),g:!!LBETS._t.autoGame(LBETS._t.readBet('Kansas -4 beats Duke'),true),p:LBETS._t.readBet('Ana eats a pepper')}));
      ok('readBet reads "Kansas -4 beats Duke" as a spread claim and finds the game; pepper reads as nothing',r.c&&r.c.t==='margin'&&r.g&&!r.p,r);
      const tp=async q=>{await P.page.$eval(q,e=>e.click());await sleep(250)};await P.page.evaluate(()=>scrollTo(0,0));await tp('[data-lb=oppclear]').catch(()=>{});await tp('[data-lb=opp][data-mid="'+info.managers[1].id+'"]');await typeText(P,'Kansas -4 beats Duke');await tp('[data-lb=amt][data-v="10"]');
      await P.page.$eval('#b27Place',e=>e.click());await sleep(400);const cf=await P.page.evaluate(()=>{const c=document.getElementById('b27Confirm');const g=i=>(document.getElementById(i)||{}).innerText;return c?c.innerText:'NOCONFIRM hint='+g('b27Hint')+' sum='+g('b27Sum')+' msg='+g('b27Msg')+' dis='+(document.getElementById('b27Place')||{}).disabled});
      ok('confirm step shows the note under "We read this as"',/We read this as[\s\S]*This will be auto-settled after completion\./.test(cf),cf);
      await P.page.$eval('[data-lb=confirm]',e=>e.click());await P.page.waitForFunction('/Placed/.test((document.getElementById("b27Msg")||{}).innerText||"")',{timeout:15000}).catch(()=>{});await sleep(800);const card=await P.page.evaluate(()=>{const c=[...document.querySelectorAll('#lbody [id^=bet-],#lbody .b27-card,#lbody .card')].filter(x=>/Bet #1\b/.test(x.innerText)&&/Kansas -4 beats Duke/.test(x.innerText)&&!x.closest('#b27Form')).pop();return c?c.innerText:'NOCARD '+document.getElementById('lbody').innerText.slice(0,1500)});
      ok('placed bet card shows the note',/This will be auto-settled after completion\./.test(card),card.slice(0,400))}
    ok(w+'px no page errors',!P.errs.length,P.errs);await P.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}await L.close();console.log('\n'+(n-bad)+' / '+n+' checks passed'+(bad?' — FAILED':''));process.exit(bad?1:0)})();
