/* s28g new-bets badge on the Bets tab: count of bets placed after this device's last look (localStorage fbn.betsSeen.<league>), not my own.
   first load = 0; another manager's bet -> 1; my own bet stays 0; opening Bets clears it; ?view=1 works with no non-GET request; badge + tab fit at 320. */
const L=require('./lib.js');const {seed}=require('./seed_league.js');const {sleep}=L;
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,500):''))}}
async function open(id,info,i,o){o=o||{};const P=await L.phone('nb'+Math.random().toString(36).slice(2,6),{w:o.w||390,h:844});await P.page.setBypassServiceWorker(true);
  if(i!=null)await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[i].id,k:info.managers[i].k});
  P.writes=[];P.page.on('request',r=>{if(!/^(GET|HEAD|OPTIONS)$/.test(r.method()))P.writes.push(r.method()+' '+r.url())});
  await P.go('league.html?l='+id+(o.q||'')+(o.h||'#standings'));await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(1500);return P}
const badge=P=>P.page.evaluate(()=>{const b=document.querySelector('#ltabs [data-v=bets] .nb');if(!b)return{n:0};const c=getComputedStyle(b),t=b.closest('a').getBoundingClientRect(),r=b.getBoundingClientRect(),nv=document.getElementById('ltabs');
  return{n:+b.innerText,bg:c.backgroundColor,col:c.color,acc:(()=>{const d=document.createElement('i');d.style.background='var(--acc)';document.body.appendChild(d);const v=getComputedStyle(d).backgroundColor;d.remove();return v})(),inTab:r.left>=t.left-1&&r.right<=t.right+1,nsw:nv.scrollWidth,ncw:nv.clientWidth,sw:document.documentElement.scrollWidth,iw:innerWidth}});
const reload=async P=>{await P.page.reload({waitUntil:'domcontentloaded'});await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(1800)};
async function place(P,mid,text){await P.page.evaluate(()=>{const a=document.querySelector('#ltabs [data-v=bets]');a.click()});await P.page.waitForSelector('#b27Text',{timeout:20000});await sleep(300);
  const c=async q=>{await P.page.$eval(q,e=>e.click());await sleep(250)};await c('[data-lb=opp][data-mid="'+mid+'"]');await P.page.type('#b27Text',text);await c('[data-lb=amt][data-v="10"]');await c('#b27Place');await c('[data-lb=confirm]');
  await P.page.waitForFunction('/Placed/.test((document.getElementById("b27Msg")||{}).innerText||"")',{timeout:15000});await sleep(500)}
(async()=>{try{const id=await seed();const info=seed.info;const M=info.managers.map(m=>m.id);
  const A=await open(id,info,0,{w:320});let b=await badge(A);ok('first load: no badge (0) and fbn.betsSeen.<league> set',b.n===0&&await A.page.evaluate(id=>!!localStorage.getItem('fbn.betsSeen.'+id),id),b);
  const V=await open(id,info,null,{q:'&view=1'});ok('view mode first load: 0',(await badge(V)).n===0);
  const B=await open(id,info,1);await place(B,M[0],'Duke beats Kansas');await B.close();
  await reload(A);b=await badge(A);ok('another manager\'s new bet -> badge 1 on Bets, yellow pill (var(--acc), dark text)',b.n===1&&b.bg===b.acc&&/rgb\(1[0-9]?, 1[0-9]?, 1[0-9]?\)|rgb\(17, 17, 17\)/.test(b.col),b);
  ok('320px: badge inside the Bets tab, no tab-bar / page overflow',b.inTab&&b.nsw<=b.ncw&&b.sw<=b.iw,b);
  await reload(V);ok('view mode: badge 1 from the loaded bets',(await badge(V)).n===1);ok('view mode: no non-GET request',!V.writes.length,V.writes);
  await place(A,M[1],'Kansas beats Duke');await A.page.evaluate(()=>document.querySelector('#ltabs [data-v=standings]').click());await sleep(500);
  b=await badge(A);ok('opening Bets cleared it, and my own bet keeps it at 0',b.n===0,b);await reload(A);ok('after reload still 0 (own bet excluded)',(await badge(A)).n===0);
  ok('no page errors',!A.errs.length&&!V.errs.length,[A.errs,V.errs]);await A.close();await V.close()
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}await L.close();console.log('\n'+(n-bad)+' / '+n+' checks passed'+(bad?' — FAILED':''));process.exit(bad?1:0)})();
