/* sh28 before/after shots only (SYNTHETIC league, local mock store; ESPN blocked so the dressed games stay put).
   APP=<site root to serve> PRE=<screenshot prefix> CHECKS=0|1 NODE_PATH=/tmp/node_modules node tests/e2e_sh28_focus.js
   e.g. APP=/tmp/hoops-sh27 PRE=sh27-before CHECKS=0 (a worktree of the live sh27 commit) */
const { chromium } = require('playwright-core');const path=require('path');const { spawn } = require('child_process');
const S28=require('./sh28_checks.js');const sleep=S28.sleep;
const HERE=path.join(__dirname,'..'),APP=process.env.APP||HERE,PRE=process.env.PRE||'sh28',CHECKS=process.env.CHECKS!=='0',OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||8991);
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HERE,'tools/mock_textdb.js'),String(HP),APP,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HERE,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC '+PRE,names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});const me=seed.info.managers[0];
  for(const [T,w,h,m] of [['mobile',412,915,true],['desktop',1280,900,false]]){
   const c=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:m?2:1,isMobile:m,hasTouch:m,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
   await c.route(/textdb\.dev|espn\.com\/apis/,r=>r.abort());
   await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:me.id,k:me.k}});
   const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   for(let k=0;k<3;k++){try{await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#games`);await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&D&&D.games&&D.games.length&&typeof RQ!=='undefined',{timeout:40000});break}catch(e){await sleep(1000)}}
   await sleep(2500);console.log(T,'build',await p.evaluate(()=>window.FBN_BUILD));
   await S28.gameCards(p,T,ok,OUT,PRE,{checks:CHECKS});
   if(T==='mobile')await S28.secondHalf(p,T,ok,OUT,PRE,{checks:CHECKS});
   ok(T+' no page errors',errs.length===0,errs.slice(0,4));await c.close()}
 }finally{await br.close();mock.kill()}console.log(nf?nf+' failed':'all passed');process.exit(nf?1:0)})().catch(e=>{console.error(e);process.exit(1)});
