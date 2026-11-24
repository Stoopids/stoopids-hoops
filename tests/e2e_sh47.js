/* sh47: mirror STOOPIDS f90f764: short manager names on bet/request headers + Copy line 1.
   REAL league STOOP HOOPS opened READ-ONLY as a guest (every non-GET to textdb aborted), plus synthetic objects evaluated in-page (never saved).
   NODE_PATH=/tmp/node_modules node tests/e2e_sh47.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const {spawn}=require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh47',HP=+(process.env.HP||9931),BUILD='2026-11-24sh47';fs.mkdirSync(OUT,{recursive:true});
let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const s=spawn('python3',['-m','http.server',String(HP),'--bind','127.0.0.1'],{cwd:HROOT});await new Promise(r=>setTimeout(r,800));
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});const writes=[];
 try{const c=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/New_York',serviceWorkers:'block'});
  await c.route(/textdb\.dev/,r=>{if(r.request().method()!=='GET'){writes.push(r.request().method()+' '+r.request().url());return r.abort()}return r.continue()});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=CABMTCKF3H94Y8SA#bets`);await p.waitForFunction(()=>window.U&&U.doc&&(U.doc.bets||[]).length&&document.querySelector('.card'),null,{timeout:60000}).catch(()=>{});await p.waitForTimeout(1500);await p.getByText('Just watching (guest)').click().catch(()=>{});await p.waitForTimeout(800);await p.locator('button:visible',{hasText:/^All Bets$/}).first().click().catch(()=>{});await p.waitForTimeout(1200);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  const r=await p.evaluate(()=>{const names=Object.values((window.U&&U.doc&&U.doc.bets)||[]).length;
    const mg=[...new Set((U.doc.bets||[]).flatMap(b=>[b.backer,b.other,...(b.opponents||[])]).filter(Boolean))].map(n=>[n,PN(n),SHARED_UI.mgrShort(PN(n))]);
    const heads=[...document.querySelectorAll('.card')].filter(x=>x.offsetParent).map(x=>x.innerText.split('\n').filter(Boolean).slice(0,2).join(' | ')).filter(t=>/ v /.test(t)).slice(0,6);
    const syn=Object.assign({id:'t',n:9,amt:5,odds:{a:1,b:1},status:'open',wk:'game',backer:'Paul',other:'Jim',opponents:['Jim'],postedBy:'Paul',text:'Charlotte -3.5 vs Atlanta'});
    return {mg,heads,face:b27FaceWhoStake(syn),copy1:s29eCopyText(syn).split('\n')[0],sh:['Paul E','Party Paul','Jake','Murph','Kurmoji','Kentut','Mark'].map(n=>n+'→'+SHARED_UI.mgrShort(n))}});
  console.log(JSON.stringify(r,null,1));
  ok('real managers resolve to a short name',r.mg.length>=6&&r.mg.every(x=>x[2]&&x[2].length),r.mg);
  ok('synthetic header Paul v Jim · $5',r.face==='Paul v Jim · $5',r.face);
  ok('synthetic Copy line 1 short names',/^\S+ \$5 Paul v Jim \S+$/.test(r.copy1),r.copy1);
  await p.evaluate(()=>{const c=[...document.querySelectorAll('.card')].find(x=>x.offsetParent&&/ v /.test(x.innerText)&&/^Bet #/.test(x.innerText));if(c)c.scrollIntoView({block:'start'});window.scrollBy(0,-60)});await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/sh47-bets-mobile.png`});
  ok('every write blocked (read-only); only presence pings tried',writes.every(w=>/presence/.test(w)),writes);ok('no page errors',errs.length===0,errs);
 }finally{await br.close();s.kill()}console.log(nf?'FAILURES '+nf:'ALL PASS');process.exit(nf?1:0)})();
