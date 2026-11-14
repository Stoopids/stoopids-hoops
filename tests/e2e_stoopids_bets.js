/* stoopids-bets: the STOOPIDS bet code + Paul-approved Hoops additions, end to end on a synthetic league in the local mock store (never textdb.dev).
   NODE_PATH=/tmp/node_modules node tests/e2e_stoopids_bets.js */
const { chromium } = require('playwright-core');
const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||path.join(HROOT,'screens-st'),HP=8951;fs.mkdirSync(OUT,{recursive:true});
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
let FAILS=0;const ok=(n,v,x)=>{if(!v)FAILS++;console.log((v?'PASS ':'FAIL ')+n+(x?' :: '+x:''))};
(async()=>{const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
try{const {seed}=require(path.join(HROOT,'tests/seed_league.js'));const API=`http://127.0.0.1:${HP+1}/api/data/`;
 const id=await seed(API,{managers:6,name:'TEST stoopids-bets flow',names:[['Paul','Party Paul','💩'],['Kurmoji','Kurmoji','🦠'],['Nasty','Peacocks','🦚'],['Stock','Stock Rising','📈'],['Murf','Rocks','🪨'],['Kentut','Gas','💨']]});
 if(/CABMTCKF3H94Y8SA/i.test(id))throw 0;const me=seed.info.managers[0];
 const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await br.newContext({viewport:{width:390,height:860},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
 await ctx.route(/textdb\.dev|espn\.com/,r=>r.abort());
 await ctx.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.lid,JSON.stringify(o.me))},{lid:id,me:{mid:me.id,k:me.k}});
 const p=await ctx.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
 await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#bets27`);await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&b27Who(),{timeout:40000});
 const cp=await p.evaluate(()=>{const r={id:'rqt1',by:'Paul',to:['Kurmoji'],amt:5,odds:[2,1],txt:'Dallas +9.5 vs Minnesota -9.5, Nov 12',lab:'Dallas +9.5',date:'Nov 12',game:'Dallas vs Minnesota',exp:Date.now()+864e5,start:new Date(Date.now()+864e5).toISOString(),status:'open',dec:[],took:[],cov:'game'};
   return [RQ.waText(r,'new'),RQ.waText(Object.assign({},r,{odds:[1,1]}),'new'),RQ.waText(Object.assign({},r,{txt:'Mavs cover (Dallas vs Minnesota), Nov 12'}),'new')]});
 ok('request copy text is exactly Paul\'s format',cp[0]==='💣 $5 Paul v Kurmoji 💣\nDallas +9.5 vs Minnesota -9.5\nNov 12, 2-1\nExpires at tipoff',JSON.stringify(cp[0]));
 ok('even odds: the third line is just the date',cp[1]==='💣 $5 Paul v Kurmoji 💣\nDallas +9.5 vs Minnesota -9.5\nNov 12\nExpires at tipoff',JSON.stringify(cp[1]));
 ok('typed text keeps the game once, date on its own line',cp[2]==='💣 $5 Paul v Kurmoji 💣\nMavs cover (Dallas vs Minnesota)\nNov 12, 2-1\nExpires at tipoff',JSON.stringify(cp[2]));
 // pool form
 await p.evaluate(()=>{OB_VIEW='form';b27Kind('pool')});await p.waitForTimeout(300);
 const f=await p.evaluate(()=>({names:[...document.querySelectorAll('.pool-pick [data-b27-pp]')].map(b=>b.getAttribute('data-b27-name')+':'+b.getAttribute('aria-pressed')),util:!!document.querySelector('.pool-pick .b27-util'),when:[...document.querySelectorAll('[data-when]')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed')),cols:getComputedStyle(document.querySelector('.pool-pick')).gridTemplateColumns.split(' ').length,btn:document.getElementById('b27Place').textContent}));
 ok('pool picker lists all 6 managers, creator ticked, others not',f.names.length===6&&f.names.filter(x=>/:true$/.test(x)).join()==='Paul:true'/* sh27: order follows D.owners (standings), not creator-first */,f.names.join(' '));
 ok('pool picker Select all / Clear is a cell inside the grid',f.util);ok('pool picker 3 across (as STOOPIDS)',f.cols===3,f.cols);
 ok('settle-date step defaults to End Of Season',f.when.some(x=>x==='End Of Season:true'),f.when.join(' | '));ok('pool button says Write it up (as STOOPIDS)',/^\s*Write it up\s*$/.test(f.btn),f.btn);
 await p.fill('#b27Text','TEST end of season winner');const tick=f.names.map((x,i)=>[x,i]).filter(([x])=>!/^Paul:/.test(x)).slice(0,2).map(([,i])=>i);for(const i of tick)await p.click('[data-b27-pp="'+i+'"]');await p.fill('#b27En','50');await p.waitForTimeout(200);
 const pot=await p.evaluate(()=>(document.getElementById('s26Pot')||{}).textContent);ok('pot counts only ticked (3 x 50)',/150/.test(pot),pot);
 await p.screenshot({path:path.join(OUT,'hoops-pool-form.png'),fullPage:true});
 // payouts not summing to pot are refused
 const pr=await p.$$('[id^=s26p]');await p.evaluate(()=>{U.places=['100','20'];render()});await p.waitForTimeout(200);
 await p.click('#b27Place');await p.waitForTimeout(300);const err=await p.evaluate(()=>(document.getElementById('s26ePay')||{}).textContent);ok('payouts must add up to the pot',/pot is 150/.test(err),err);
 await p.evaluate(()=>{U.places=['120','30'];render()});await p.waitForTimeout(200);await p.click('#b27Place');await p.waitForTimeout(300);
 const cf=await p.evaluate(()=>!!document.querySelector('.b27-confirm'));ok('confirm step shown',cf);
 await p.evaluate(()=>b27Confirm());await p.waitForFunction(()=>!U.busy,{timeout:20000});await p.waitForTimeout(800);
 const a=await p.evaluate(()=>({view:OB_VIEW,sub:S24.sub,hl:!!document.querySelector('.s24-hl,.dl-hl,[class*="hl"]'),msg:U.msg,pool:(U.doc.bets.find(b=>b.kind==='pool')||{}),clip:U.clip}));
 let clip='';try{clip=await p.evaluate(()=>navigator.clipboard.readText())}catch(e){clip='(clipboard read failed) '+e.message}
 ok('pool saved',!!a.pool.id,JSON.stringify(a.pool.id));ok('pool saved with wk season',a.pool.wk==='season',a.pool.wk);
 ok('pool copy text auto-copied',/^Pool #\d+ · Unsettled/.test(clip),JSON.stringify(clip));console.log('msg:',a.msg);
 ok('pool save message is exactly "Pool #n posted 💥"',a.msg==='Pool #'+a.pool.n+' posted 💥',a.msg);
 await p.screenshot({path:path.join(OUT,'hoops-after-write-it-up-pool.png')});
 // settle by places
 const pid=a.pool.id;await p.evaluate(()=>{OB_VIEW='all';render()});await p.waitForTimeout(400);await p.evaluate(id=>{U.placeWho=U.placeWho||{};const mem=U.doc.bets.find(b=>b.id===id).parts.filter(n=>n!=='Paul');U.placeWho[id]=mem.slice(0,2);window.__mem=mem;render()},pid);await p.waitForTimeout(200);
 await p.evaluate(id=>s26fPlaceGo(id),pid);await p.waitForTimeout(900);await p.evaluate(id=>s26fPlaceGo(id),pid);await p.waitForTimeout(300);await p.waitForFunction(()=>!U.busy,{timeout:20000});await p.waitForTimeout(500);
 const s=await p.evaluate(id=>U.doc.bets.find(b=>b.id===id),pid);ok('settle by places pays planned payouts, unplaced get 0',(()=>{const m=(s.parts||[]).filter(n=>n!=='Paul');return s.back&&s.back[m[0]]===120&&s.back[m[1]]===30&&s.back.Paul===0})(),JSON.stringify(s.back));
 // 1v1 write it up
 await p.evaluate(()=>{OB_VIEW='form';b27Kind('bet');S24.sub=null;render()});await p.waitForTimeout(300);
 const b1=await p.evaluate(()=>document.getElementById('b27Place').textContent);ok('1v1 button says Write it up (as STOOPIDS)',/^\s*Write it up\s*$/.test(b1),b1);
 await p.evaluate(()=>{U.opps=['Kurmoji'];U.text='Knicks -4 beats Celtics';U.amt=5;U.odds=[2,1];U.wk='season';U.whenPick=true;render()});await p.waitForTimeout(200);
 await p.evaluate(()=>b27Place());await p.waitForTimeout(200);const fe=await p.evaluate(()=>b27FormOK());await p.evaluate(()=>b27Confirm());await p.waitForFunction(()=>!U.busy,{timeout:20000});await p.waitForTimeout(800);
 const c=await p.evaluate(()=>({view:OB_VIEW,sub:S24.sub,b:U.doc.bets.filter(b=>b.kind!=='pool').pop(),msg:U.msg}));let clip2='';try{clip2=await p.evaluate(()=>navigator.clipboard.readText())}catch(e){clip2='ERR '+e.message}
 ok('1v1 bet saved',!!(c.b&&c.b.id),'formErr='+fe);ok('1v1 copy text auto-copied',/💥 \$5 Paul v Kurmoji 💥/.test(clip2),JSON.stringify(clip2));
 ok('request copy (awaiting acceptance) uses 💣',/^💣 .* 💣\n/.test(cp[0]),cp[0].split('\n')[0]);
 const cc=await p.evaluate(b=>({open:s29eCopyText(b),bk:s29eCopyText(Object.assign({},b,{status:'backer'})),ot:s29eCopyText(Object.assign({},b,{status:'other'})),pu:s29eCopyText(Object.assign({},b,{status:'push'}))}),c.b);
 ok('agreed/unsettled card Copy: 💥 at both ends, no 💣',/^💥 \$5 Paul v Kurmoji · 2–1 💥\n/.test(cc.open)&&!/💣/.test(cc.open),JSON.stringify(cc.open));
 ok('settled Copy: 🎉 at both ends, no bombs (backer wins)',cc.bk.split('\n')[0]==='🎉 Bet #'+c.b.n+' · Settled · Paul won 🎉'&&!/💣|💥/.test(cc.bk),JSON.stringify(cc.bk));
 ok('settled Copy: 🎉 at both ends, no bombs (other side wins)',cc.ot.split('\n')[0]==='🎉 Bet #'+c.b.n+' · Settled · Kurmoji won 🎉'&&!/💣|💥/.test(cc.ot),JSON.stringify(cc.ot));
 ok('wash Copy unchanged (💦, no bombs)',/^💦 Bet #\d+ · Wash\n/.test(cc.pu)&&!/💣|💥/.test(cc.pu),cc.pu.split('\n')[0]);
 ok('numbering continues (pool #1, bet #2)',a.pool.n===1&&c.b&&c.b.n===2,a.pool.n+','+(c.b&&c.b.n));
 await p.screenshot({path:path.join(OUT,'hoops-after-write-it-up-1v1.png')});
 const wd=await p.evaluate(()=>{const t=document.body.innerText;const m=t.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(day)?\b,? /g);return m});ok('no weekday names on the Bets page',!wd,JSON.stringify(wd));
 await br.close();
}catch(e){console.error(e);FAILS++}mock.kill('SIGKILL');console.log(FAILS?FAILS+' failed':'all passed');process.exit(FAILS?1:0)})();
