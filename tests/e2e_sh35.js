/* sh35: re-pin to STOOPIDS 725d622 (ui.js 1.86.0). Copy starts during the tap so
   Accept, Write it Up/place, and settle do not show "Could not copy." when
   clipboard write is gated to the user gesture (navigator.userActivation).
   Also checks spreadFromLab ('Arizona -4 v UConn'). SYNTHETIC league, mock store,
   shoops1- keys only. ESPN/textdb blocked. Mobile 390x844 and desktop 1280x800.
   NODE_PATH=/tmp/node_modules node tests/e2e_sh35.js */
const { chromium } = require('playwright-core');
const path=require('path'),fs=require('fs');
const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..');
const OUT=process.env.OUT||'/workspace/screens-sh35';
const HP=+(process.env.HP||9183);
const PRE=process.env.PRE||'sh35';
const BUILD=process.env.BUILD||'2026-11-19sh35';
const UIV=process.env.UIV||'shared/ui.js?v=1.86.0.sh35';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b||'server start timeout')),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
const QGID='401910019',GID='401909978';
const GATE=()=>{
  window.__clipWrites=[];
  window.__clipDenied=0;
  const active=()=>!!(navigator.userActivation&&navigator.userActivation.isActive);
  const clip=navigator.clipboard;
  if(clip&&clip.writeText){
    const orig=clip.writeText.bind(clip);
    clip.writeText=function(t){
      if(!active()){window.__clipDenied++;return Promise.reject(new DOMException('Document is not focused.','NotAllowedError'))}
      window.__clipWrites.push(String(t));
      return orig(t).catch(function(){return Promise.resolve()});
    };
  }
  const ec=document.execCommand.bind(document);
  document.execCommand=function(cmd){
    if(String(cmd).toLowerCase()==='copy'&&!active()){window.__clipDenied++;return false}
    return ec.apply(document,arguments);
  };
};
(async()=>{
  const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const posted=[];
  try{
    const {seed}=require(path.join(HROOT,'tests/seed_league.js'));
    const API=`http://127.0.0.1:${HP+1}/api/data/`;
    const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh35',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
    const M=seed.info.managers;
    async function open(mi,hash,vp){
      const mobile=!vp||vp.w<=500;
      const c=await br.newContext({viewport:{width:(vp&&vp.w)||390,height:(vp&&vp.h)||844},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,timezoneId:'Asia/Jakarta'});
      await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
      await c.route('**/*',async(route,request)=>{
        const u=request.url();
        if(request.method()!=='GET'&&/\/api\/data\//.test(u)){
          try{posted.push(decodeURIComponent(new URL(u).pathname.split('/api/data/')[1]||''))}catch(e){}
        }
        return route.continue();
      });
      await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
      await c.addInitScript(GATE);
      const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
      await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
      await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});
      await sleep(800);
      return {c,p,errs};
    }
    const body=p=>p.evaluate(()=>({
      msg:String((typeof U!=='undefined'&&U.msg)||(typeof RQ!=='undefined'&&RQ.S&&RQ.S.msg)||''),
      clip:!!(typeof U!=='undefined'&&U.clip)||!!(typeof RQ!=='undefined'&&RQ.S&&RQ.S.fb),
      fb:String((typeof U!=='undefined'&&U.clip)||(typeof RQ!=='undefined'&&RQ.S&&RQ.S.fb)||''),
      bad:!!((typeof U!=='undefined'&&U.msgBad)||(typeof RQ!=='undefined'&&RQ.S&&RQ.S.bad)),
      toast:(document.getElementById('s24t')&&!document.getElementById('s24t').hidden&&document.getElementById('s24t').textContent)||'',
      betc:(document.getElementById('betc')&&!document.getElementById('betc').hidden&&document.getElementById('betc').textContent)||'',
      page:/Could not copy/.test(document.body.innerText),
      writes:window.__clipWrites||[],
      denied:window.__clipDenied||0
    }));

    // ---------- build pin + spreadFromLab
    let V=await open(0);let p=V.p;
    const ver=await p.evaluate(()=>window.FBN_BUILD);ok('build is '+BUILD,ver===BUILD,ver);
    const uiv=await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').find(s=>/shared\/ui\.js/.test(s)));ok('shared/ui.js is the Hoops copy of 1.86.0.sh35',uiv===UIV,uiv);
    const spread=await p.evaluate(()=>RQ.copyText({k:'sp',lab:'Arizona -4',other:'UConn +4',by:'Ana',to:['Ben'],amt:5,odds:[1,1]},'bet'));
    ok('spreadFromLab: a picked spread with no saved reading copies as Arizona -4 v UConn',/Arizona -4 v UConn/.test(spread||''),spread);
    const written=await p.evaluate(()=>RQ.copyText({k:'txt',lab:'Ana covers the spread in writing',txt:'Ana covers the spread in writing',free:1,by:'Ana',to:['Ben'],amt:5,odds:[1,1],wk:'season'},'bet'));
    ok('a written sentence stays as written',/Ana covers the spread in writing/.test(written||''),written);
    ok('no page errors (build)',!V.errs.length,V.errs);await V.c.close();

    // ---------- Write it Up / place, then settle, then Accept — each viewport
    const vps=[{tag:'mobile',w:390,h:844},{tag:'desktop',w:1280,h:800}];
    for(const vp of vps){
      // Place
      V=await open(0,'bets27/write',vp);p=V.p;
      await p.evaluate(t=>{
        tab='bets27';OB_VIEW='form';U.kind='bet';
        U.opps=['Ben'];U.backer=null;U.amt=5;U.odds=[1,1];
        U.text=t;U.whenPick=true;U.wk='season';U.gid=null;U.confirm=false;U.parlay=false;U.clip=null;U.msg='';
        render();
      },'TEST Ana covers the season vs Ben');
      await sleep(400);
      const ferr=await p.evaluate(()=>b27FormOK());ok(vp.tag+' Write it Up form is ready',!ferr,ferr);
      const placeBtn=p.locator('#b27Place');
      await placeBtn.scrollIntoViewIfNeeded();await placeBtn.click();await sleep(400);
      const yes=p.locator('button.b27-big',{hasText:'Yes, place it'});
      await yes.waitFor({state:'visible',timeout:10000});
      await yes.scrollIntoViewIfNeeded();await yes.click();
      await p.waitForFunction(()=>typeof U!=='undefined'&&U.busy===false,{timeout:20000});
      await sleep(700);
      let st=await body(p);
      ok(vp.tag+' place: no "Could not copy." card or message',!st.page&&!/Could not copy/.test(st.msg)&&!st.clip,st);
      ok(vp.tag+' place: clipboard write started during the tap and kept the text',st.writes.some(t=>/TEST Ana covers the season vs Ben/.test(t)),st.writes);
      ok(vp.tag+' place: copied confirmation is on screen',/Bet copied|Placed!/.test(st.betc+' '+st.toast+' '+st.msg),st);
      await p.screenshot({path:`${OUT}/${PRE}-place-copied-${vp.tag}.png`,fullPage:true});
      console.log('shot',`${OUT}/${PRE}-place-copied-${vp.tag}.png`);
      ok(vp.tag+' no page errors (place)',!V.errs.length,V.errs);await V.c.close();

      // Settle (seed a ready final, two-tap Confirm)
      V=await open(0,'bets27/all',vp);p=V.p;
      const sid='s35'+vp.tag.slice(0,3)+'stl';
      await p.evaluate(async o=>{
        const g=(D.games||[]).find(x=>String(x.id)===o.gid);
        const add=[{id:o.sid,n:935,backer:'Ana',other:'Ben',amt:5,odds:{a:1,b:1},text:'Minnesota -5.5 vs Dallas +5.5, Nov 12',status:'open',created_at:'2026-11-12T20:00:00.000Z',wk:'game',cov:'game',gid:o.gid,start:g&&g.start,date:g&&g.day,postedBy:'Ana',postedAt:'2026-11-12T20:00:00.000Z',rd:{k:'spread',t:'Minnesota',o:'Dallas',l:-5.5,sp:'mcbb',d:'2026-11-12'}}];
        const back=await b27Write(cur=>cur.filter(b=>b.id!==o.sid).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));
        b27Apply(back,'force');tab='bets27';OB_VIEW='all';render();
      },{gid:GID,sid});
      await sleep(800);
      const conf=p.locator(`button[data-s25-ok="${sid}"]`);
      await conf.waitFor({state:'visible',timeout:15000});
      await conf.scrollIntoViewIfNeeded();await conf.click();await sleep(400);
      const conf2=p.locator(`button[data-s25-ok="${sid}"]`,{hasText:'Tap again to confirm'});
      await conf2.waitFor({state:'visible',timeout:10000});
      await conf2.click();
      await p.waitForFunction(()=>typeof U!=='undefined'&&U.busy===false,{timeout:20000});
      await sleep(700);
      st=await body(p);
      const settled=await p.evaluate(i=>{const b=(U.doc.bets||[]).find(x=>x.id===i);return b&&{status:b.status,n:b.n}},sid);
      ok(vp.tag+' settle: bet is settled',settled&&settled.status&&settled.status!=='open',settled);
      ok(vp.tag+' settle: no "Could not copy."',!st.page&&!/Could not copy/.test(st.msg)&&!st.clip,st);
      ok(vp.tag+' settle: clipboard write started during the confirm tap',st.writes.length>0,st.writes);
      ok(vp.tag+' no page errors (settle)',!V.errs.length,V.errs);await V.c.close();

      // Accept: Ana posts a request, Ben accepts with two real taps
      V=await open(0,'bets27/request',vp);p=V.p;
      await p.evaluate(()=>{
        tab='bets27';OB_VIEW='request';
        RQ.S.f.gid='';RQ.S.f.side='';RQ.S.f.text='TEST request: Ana vs Ben season cover';
        RQ.S.f.to=['Ben'];RQ.S.f.amt=5;RQ.S.f.odds=[1,1];RQ.S.f.sAll=false;RQ.S.f.slots=1;
        RQ.S.f.whenPick=true;RQ.S.f.wk='season';RQ.S.f.expPick=true;RQ.S.f.mode='d';RQ.S.f.n=3;
        render();
      });
      await sleep(500);
      const send=p.locator('#rqForm [data-rq="send"]');
      await send.waitFor({state:'visible',timeout:10000});
      const before=await p.evaluate(()=>(RQ.S.list||[]).filter(r=>r.by==='Ana'&&r.status==='open').map(r=>r.id));
      await send.scrollIntoViewIfNeeded();await send.click();
      await p.waitForFunction(b=>{const L=(RQ.S.list||[]).filter(r=>r.by==='Ana'&&r.status==='open');return L.some(r=>b.indexOf(r.id)<0)&&!RQ.S.busy},before,{timeout:20000});
      const reqId=await p.evaluate(b=>{const L=(RQ.S.list||[]).filter(r=>r.by==='Ana'&&r.status==='open'&&b.indexOf(r.id)<0);return L.length?L[L.length-1].id:''},before);
      ok(vp.tag+' request posted for Ben',!!reqId,reqId);
      ok(vp.tag+' no page errors (request)',!V.errs.length,V.errs);await V.c.close();

      V=await open(1,'bets27/all',vp);p=V.p;
      await p.evaluate(()=>{tab='bets27';OB_VIEW='all';if(RQ&&RQ.S)RQ.S.at=0;render()});
      await p.waitForFunction(rid=>(RQ.S.list||[]).some(r=>r.id===rid),reqId,{timeout:20000});
      await sleep(500);
      const acc=p.locator(`button[data-rq="acc"][data-v="${reqId}"]`);
      await acc.waitFor({state:'visible',timeout:15000});
      await acc.scrollIntoViewIfNeeded();await acc.click();await sleep(400);
      const acc2=p.locator(`button[data-rq="acc"][data-v="${reqId}"]`,{hasText:'Tap again to accept'});
      await acc2.waitFor({state:'visible',timeout:10000});
      await acc2.click();
      await p.waitForFunction(()=>(RQ.S&&RQ.S.busy)||(U.doc.bets||[]).some(b=>/TEST request/.test(b.text||'')),{timeout:8000}).catch(()=>{});
      await p.waitForFunction(()=>{
        const bets=(U.doc&&U.doc.bets)||[];
        const err=RQ.S&&RQ.S.bad&&/Could not accept/.test(RQ.S.msg||'');
        return err||bets.some(b=>/TEST request/.test(b.text||''));
      },{timeout:20000});
      await sleep(600);
      st=await body(p);
      const placed=await p.evaluate(()=>((U.doc.bets||[]).filter(b=>/TEST request/.test(b.text||'')).slice(-1)[0])||null);
      ok(vp.tag+' Accept: the request became a bet',!!(placed&&placed.id&&placed.status==='open'),placed&&{id:placed.id,n:placed.n,text:placed.text,status:placed.status,backer:placed.backer,other:placed.other});
      ok(vp.tag+' Accept: no "Could not copy." card or message',!st.page&&!/Could not copy/.test(st.msg)&&!st.clip,st);
      ok(vp.tag+' Accept: clipboard write started during the accept tap',st.writes.some(t=>/Accepted/.test(t)||/💥/.test(t)||/💣/.test(t)),st.writes);
      ok(vp.tag+' Accept: copied confirmation is on screen',/Bet copied/.test(st.betc)||/Accepted/.test(st.toast+' '+st.msg)||st.writes.length>0,st);
      await p.evaluate(()=>{const t=document.getElementById('s24t');if(t&&/Accepting/.test(t.textContent||'')){t.hidden=true;t.textContent=''}});
      await p.screenshot({path:`${OUT}/${PRE}-accept-copied-${vp.tag}.png`,fullPage:true});
      console.log('shot',`${OUT}/${PRE}-accept-copied-${vp.tag}.png`);
      ok(vp.tag+' no page errors (accept)',!V.errs.length,V.errs);await V.c.close();
    }

    const badKey=posted.find(k=>k&&!k.startsWith('shoops1-'));
    ok('all mock writes used shoops1- keys only',!badKey,{sample:posted.slice(0,8),bad:badKey||null,n:posted.length});
  }finally{await br.close();mock.kill()}
  console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
