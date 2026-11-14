/* sh28 checks, shared by tests/e2e_sh28.js (full site) and tests/e2e_sh28_focus.js (before/after shots).
   SYNTHETIC only: games are re-dressed in the page's memory (D.games), requests go to the local mock store. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const LONG=[['Oklahoma City','Golden State',3,'5:12 - 3rd','live'],['Philadelphia','San Antonio',2,'Halftime','live'],['New Orleans','LA Clippers',4,'1:03 - 4th','live'],['Sacramento','Minnesota',4,'Final','final'],['Los Angeles','Portland',5,'Final/OT','final'],['Utah','Miami',3,'8:02 - 3rd','live']];
async function dress(p){return p.evaluate(L=>{const by=n=>Object.keys(D.teams).find(k=>D.teams[k].short===n);const now=Date.now();const out=[];
  const pool=(D.games||[]).filter(g=>g.status==='scheduled'&&Date.parse(g.start)>now&&!g._t28);
  L.forEach((x,i)=>{const g=pool[i];if(!g)return;g._t28=1;const A=by(x[0]),H=by(x[1]);if(!A||!H)return;
    for(const [s,t] of [[g.away,A],[g.home,H]]){s.id=t;s.short=D.teams[t].short;s.name=D.teams[t].name||s.short}
    const n=x[2],a=[31,28,30,27,9].slice(0,n),h=[29,33,26,30,12].slice(0,n);g.status=x[4];g.start=new Date(now-(x[4]==='final'?3.5:1.2)*3600e3).toISOString();
    g.away.score=a.reduce((p,q)=>p+q,0);g.home.score=h.reduce((p,q)=>p+q,0);g.away.win=g.status==='final'&&g.away.score>g.home.score;g.home.win=g.status==='final'&&!g.away.win;
    g._lv={detail:x[3],status:g.status,ls:{a,h}};out.push({id:String(g.id),away:x[0],home:x[1],n,st:x[4]})});
  return out},LONG)}
async function rowsOf(p,ids){return p.evaluate(ids=>{const res=[];document.querySelectorAll('.gside').forEach(r=>{if(!r.querySelector('.hsg'))return;const c=r.querySelector('.chip'),cn=c&&c.querySelector('.cn'),cab=c&&c.querySelector('.cab');const vis=x=>x&&getComputedStyle(x).display!=='none';
    const card=r.closest('.card,[data-gid]');res.push({name:cn?cn.textContent:'',shown:vis(cn)?'name':vis(cab)?'abbr':'none',abbr:cab?cab.textContent:'',cut:vis(cn)&&cn.scrollWidth>cn.clientWidth+1,recCut:(()=>{const g=c&&c.querySelector('.grec');if(!g)return false;const cr=c.getBoundingClientRect(),gr=g.getBoundingClientRect();return gr.right>cr.right-3||g.scrollWidth>g.clientWidth+1})(),heads:[...r.querySelectorAll('[data-h]')].map(e=>e.dataset.h).join(','),colW:Math.round((r.querySelector('.hsq')||{getBoundingClientRect:()=>({width:0})}).getBoundingClientRect().width),fs:parseFloat(getComputedStyle(r.querySelector('.sc2')).fontSize),card:card?card.innerText.slice(0,40).replace(/\n/g,' '):''})});return res},ids)}
async function shotAt(p,name,path){/* the scored card for that team, plus the cards around it (its day grid) */
  const h=await p.evaluateHandle(n=>{const a=[...document.querySelectorAll('.gside .chip')].find(c=>(c.getAttribute('title')||'').includes(n)&&c.closest('.gside').querySelector('.hsg'));const card=a&&a.closest('.card,[data-gid]');if(!card)return null;card.parentElement&&[...card.parentElement.querySelectorAll('img')].forEach(i=>{i.loading='eager'});return card.parentElement||card},name);
  const el=h.asElement();if(!el){await p.screenshot({path});return}
  await el.scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.gside img')].every(i=>i.complete),null,{timeout:5000}).catch(()=>{});await sleep(400);
  const vw=await p.evaluate(()=>innerWidth);if(vw>=700){await el.screenshot({path});return}
  /* phone: the day grid is one long column, so frame ~1.9 screens starting at that card */
  const y=await p.evaluate(n=>{const a=[...document.querySelectorAll('.gside .chip')].find(c=>(c.getAttribute('title')||'').includes(n)&&c.closest('.gside').querySelector('.hsg'));const b=a.closest('.card,[data-gid]').getBoundingClientRect();return Math.max(0,b.top+scrollY-30)},name);
  await p.screenshot({path,fullPage:true,clip:{x:0,y,width:vw,height:1750}})}
async function gameCards(p,T,ok,OUT,PRE,opt={}){
  const ids=await dress(p);ok(T+' sh28: dressed 6 synthetic games (5 with long names)',ids.length===6,ids.map(x=>x.away+'@'+x.home));
  await p.evaluate(()=>{tab='games';gMode='upcoming';gDay='all';gOwner='all';render()});await sleep(1200);
  let R=(await rowsOf(p)).filter(r=>/Oklahoma|Golden|Philadelphia|San Antonio|New Orleans|LA Clippers|Utah|Miami/.test(r.name));
  console.log('   '+T+' live rows:',JSON.stringify(R.map(r=>[r.name,r.shown,r.abbr,r.cut,r.recCut,r.colW,r.heads])));
  await shotAt(p,'Oklahoma City',`${OUT}/${PRE}-games-longnames-live-${T}.png`);
  await p.evaluate(()=>{gMode='scores';render()});await sleep(1200);
  let F=(await rowsOf(p)).filter(r=>/Sacramento|Minnesota|Los Angeles|Portland/.test(r.name));
  console.log('   '+T+' final rows:',JSON.stringify(F.map(r=>[r.name,r.shown,r.abbr,r.cut,r.recCut,r.heads,r.card])));
  const fl=await p.evaluate(()=>{const lab=n=>{const a=[...document.querySelectorAll('.gside .chip')].find(c=>(c.getAttribute('title')||'').includes(n));const card=a&&a.closest('.card,[data-gid]');return card?(/FINAL\/OT/i.test(card.innerText)?'FINAL/OT':/FINAL/i.test(card.innerText)?'FINAL':'?'):'none'};
    const tx=n=>{const g=(D.games||[]).find(g=>g._t28&&g.away.short===n);return g?s29GameText(g).split('\n')[0]:''};return {reg:lab('Sacramento'),ot:lab('Los Angeles'),regTxt:tx('Sacramento'),otTxt:tx('Los Angeles')}});
  await shotAt(p,'Sacramento',`${OUT}/${PRE}-games-longnames-final-${T}.png`);
  if(opt.checks!==false){
    const all=R.concat(F);
    ok(T+' sh28: team names and records on scored game cards are never cut ("N…"): full name or the abbreviation',all.length>=10&&all.every(r=>!r.cut&&!r.recCut&&r.shown!=='none'),all.map(r=>r.name+':'+r.shown+(r.cut?':CUT':'')+(r.recCut?':REC-CUT':'')));
    ok(T+' sh28: linescore heads Q1-Q4 (+OT), T',R.some(r=>r.heads==='Q1,Q2,Q3,Q4,T')&&F.some(r=>r.heads==='Q1,Q2,Q3,Q4,OT,T'),[...new Set(all.map(r=>r.heads).filter(Boolean))]);
    ok(T+' sh28: a 4-quarter final says FINAL, only an overtime final says FINAL/OT (card + Copy text)',fl.reg==='FINAL'&&fl.ot==='FINAL/OT'&&/Final$/.test(fl.regTxt)&&/Final\/OT$/.test(fl.otTxt),fl);
    ok(T+' sh28: short names that fit keep the full name (abbreviation only when tight)',(T==='mobile'?all.filter(r=>/Utah|Miami/.test(r.name)).every(r=>r.shown==='name'):all.some(r=>/Utah/.test(r.name)&&r.shown==='name'))&&all.some(r=>/Utah/.test(r.name)),all.filter(r=>r.shown==='name').map(r=>r.name));
  }
  await p.evaluate(()=>{gMode='upcoming';render()});return {R,F,fl}}
const DRESS=o=>{const now=Date.now();for(const g of (D.games||[])){const id=String(g.id);
  if(id===o.half){g.status='live';g.start=new Date(now-75*60000).toISOString();g.away.score=53;g.home.score=55;g._lv={detail:'Halftime',status:'live',ls:{a:[25,28],h:[30,25]}};g._t28=1}
  if(id===o.q3){g.status='live';g.start=new Date(now-60*60000).toISOString();g.away.score=70;g.home.score=66;g._lv={detail:'11:41 - 3rd',status:'live',ls:{a:[25,28,17],h:[30,25,11]}};g._t28=1}}};
async function sendReq(p,gid,label,ids){
  await p.evaluate(()=>{tab='bets27';OB_VIEW=innerWidth<1000?'request':'form';render()});await sleep(1200);
  const before=await p.evaluate(()=>(RQ.S.list||[]).length);
  await p.evaluate(o=>{Object.assign(RQ.S.f,{gid:o.gid,cov:'2h',text:o.label,amt:10,amtC:false,to:[],parlay:false});RQ.S.msg='';RQ.S.bad=false;render.rqSelf=true;try{render()}finally{render.rqSelf=false}},{gid,label});await sleep(600);
  /* re-dress right before Send: the full-site run reloads data/scores.json and the live poll, which replaces the in-memory games */
  if(ids)await p.evaluate(`(${DRESS.toString()})(${JSON.stringify(ids)})`);
  await p.evaluate(()=>{const b=document.querySelector('#rqForm [data-rq="send"]');b.scrollIntoView({block:'center'});b.click()});await sleep(2500);
  return p.evaluate(b=>({msg:RQ.S.msg||'',bad:!!RQ.S.bad,posted:(RQ.S.list||[]).length-b,last:((RQ.S.list||[]).slice(-1)[0]||{}).cov||'',lg:((RQ.S.list||[]).slice(-1)[0]||{}).gid||'',ls:((RQ.S.list||[]).slice(-1)[0]||{}).start||''}),before)}
async function secondHalf(p,T,ok,OUT,PRE,opt={}){
  /* two synthetic games re-dressed in memory: one at halftime 75 min after the listed start, one 11:41 into Q3 only 60 min after the start (a quick first half) */
  const g=await p.evaluate(()=>{const now=Date.now();const pool=(D.games||[]).filter(g=>g.status==='scheduled'&&Date.parse(g.start)>now&&!g._t28);const a=pool[0],b=pool[1];a._t28=b._t28=1;
    a.status='live';a.start=new Date(now-75*60000).toISOString();a.away.score=53;a.home.score=55;a._lv={detail:'Halftime',status:'live',ls:{a:[25,28],h:[30,25]}};
    b.status='live';b.start=new Date(now-60*60000).toISOString();b.away.score=70;b.home.score=66;b._lv={detail:'11:41 - 3rd',status:'live',ls:{a:[25,28,17],h:[30,25,11]}};
    return {half:String(a.id),q3:String(b.id),halfLab:a.away.short+' vs '+a.home.short,q3Lab:b.away.short+' vs '+b.home.short}});
  const h=await sendReq(p,g.half,'TEST '+g.halfLab.split(' vs ')[0]+' wins the 2nd half',g);
  console.log('   '+T+' 2nd-half request at HALFTIME:',JSON.stringify(h));
  await p.screenshot({path:`${OUT}/${PRE}-2h-halftime-form-${T}.png`});
  await sleep(1200);for(const v of ['request','all']){await p.evaluate(v=>{OB_VIEW=v;render()},v);await sleep(900);const f=await p.evaluate(()=>{const c=[...document.querySelectorAll('#main .pill')].find(x=>/2nd half/.test(x.textContent));if(!c)return false;(c.closest('.card')||c).scrollIntoView({block:'center'});return true});if(f)break}
  await sleep(400);await p.screenshot({path:`${OUT}/${PRE}-2h-halftime-${T}.png`});
  const q=await sendReq(p,g.q3,'TEST '+g.q3Lab.split(' vs ')[0]+' wins the 2nd half',g);
  console.log('   '+T+' 2nd-half request in Q3:',JSON.stringify(q));
  await p.screenshot({path:`${OUT}/${PRE}-2h-q3-${T}.png`});
  if(opt.checks!==false){
    ok(T+' sh28: a 2nd-half request can still be posted at halftime (period 2 done, Q3 not started)',h.posted===1&&!h.bad&&h.last==='2h',h);
    ok(T+' sh28: a 2nd-half request is refused once Q3 has started',q.posted===0&&q.bad&&/half has already started/i.test(q.msg),q);
    const per=await p.evaluate(o=>{const G=RQ&&typeof RQ==='object'?null:null;return (D.games||[]).filter(g=>o.includes(String(g.id))).map(g=>({id:g.id,ls:g._lv&&g._lv.ls?Math.max(g._lv.ls.a.length,g._lv.ls.h.length):null}))},[g.half,g.q3]);console.log('   periods from the live linescore:',JSON.stringify(per));
  }
  return {h,q}}
module.exports={gameCards,secondHalf,sleep};
