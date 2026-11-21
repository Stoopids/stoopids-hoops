/* sh39: mirror STOOPIDS 18dd793 Quick bet preselect. Viewer taps Quick bet on a game where another manager owns a team -> that owner is preselected in 'Who is it open to?'.
   SYNTHETIC league, mock store, shoops1- keys only, TEST names. NODE_PATH=/tmp/node_modules node tests/e2e_sh39.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT='/workspace/screens-sh39',HP=+(process.env.HP||9951),BUILD='2026-11-21sh39',NOW='2026-11-19T12:00:00Z';
fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let nf=0;const ok=(n,c,x)=>{if(!c)nf++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' :: '+JSON.stringify(x):''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
  const NAMES=[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']];
  const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh39',names:NAMES});const M=seed.info.managers;
  const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta'});
  await c.clock.install({time:new Date(NOW)});await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
  await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[0].id,k:M[0].k}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#games`);
  await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});await sleep(800);
  ok('build is '+BUILD,(await p.evaluate(()=>window.FBN_BUILD))===BUILD);
  const r=await p.evaluate(()=>{const me=b27Who(),own=s=>(s&&s.owners)||[];
    const g=(D.games||[]).find(g=>qbOk(g)&&!own(g.away).includes(me)&&!own(g.home).includes(me)&&own(g.away).length&&own(g.home).length&&own(g.away)[0]!==own(g.home)[0])
      ||(D.games||[]).find(g=>qbOk(g)&&[...own(g.away),...own(g.home)].some(n=>n!==me));
    if(!g)return null;const exp=[...new Set([...own(g.away),...own(g.home)].filter(n=>n&&n!==me))];qbGo(g.id,null,0);
    return {me,gid:g.id,away:own(g.away),home:own(g.home),exp,to:RQ.S.f.to}});
  ok('Quick bet preselects the other owner(s) on the game, not the viewer',!!r&&r.exp.length>0&&JSON.stringify([...r.to].sort())===JSON.stringify([...r.exp].sort()),r);
  await sleep(1000);await p.screenshot({path:`${OUT}/sh39-quickbet-preselect-mobile.png`});console.log('shot',`${OUT}/sh39-quickbet-preselect-mobile.png`);
  ok('no page errors',!errs.length,errs);await c.close();
 }catch(e){nf++;console.log('FAIL exception',e&&e.stack||e)}finally{await br.close();mock.kill()}
 console.log(nf?nf+' FAILED':'ALL PASS');process.exit(nf?1:0)})();
