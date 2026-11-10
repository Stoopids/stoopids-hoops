/* sh12: League settings in the lobby can switch 6 <-> 5 managers.
   Teams each options update when Managers changes (5 managers: 5 or 6 allowed).
   Mock store only. Never writes to textdb.dev.
   node tests/e2e_nba_settings.js */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){try{puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core')}catch(e2){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}}
const {spawn}=require('child_process');const path=require('path');const fs=require('fs');
const F=require('../js/core.js');
const ROOT=path.resolve(__dirname,'..');const PORT=+process.env.PORT||8862;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const API=APP+'/api/data/';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);c.on('error',rej);setTimeout(()=>rej(new Error('mock timeout '+b)),8000)})}

async function seedLobby(api,o){o=o||{};
  const N=o.managers||6,joined=o.joined||2;
  const post=(k,v)=>fetch(api+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'text/plain'},body:typeof v==='string'?v:JSON.stringify(v)});
  const id=F.makeLeagueId();const K=F.Keys(id);
  const s={name:o.name||'TEST sh12 settings',mgrName:'TEST Commish',teamName:'TEST Team 1',managers:N,rounds:F.roundsFor(N),type:'snake',startAt:null,startMode:'manual',orderMode:'manual',clockSecs:0,autoPick:true,warn15:true};
  const people=[];const cmSecret=F.newSecret();
  for(let i=0;i<joined;i++){const mid=F.hexId(12),k=F.newSecret();people.push({mid,k,name:i===0?'TEST Commish':'TEST Seat '+(i+1),team:'TEST Team '+(i+1)})}
  const meta=F.defaultMeta(id,s,people[0].mid);meta.pass=await F.makePass(cmSecret);
  for(let i=0;i<people.length;i++){const p=people[i];await post(K.slot(i+1,0),F.makeClaim({mid:p.mid,i:i+1,name:p.name,team:p.team,sh:await F.mgrHash(p.mid,p.k),w:i===0?'cm':''}));await post(K.mgr(p.mid),F.makeProfile({mid:p.mid,name:p.name,team:p.team}))}
  await post(K.meta,meta);
  return{id,cmSecret,people,N,joined,K};
}

let tot=0,bad=0;const fails=[];
function ok(name,c,x){tot++;if(c)console.log('  ok  '+name);else{bad++;fails.push(name);console.log('FAIL  '+name,x!==undefined?String(x).slice(0,500):'')}}

(async()=>{
  const mock=await startMock();
  const seeded=await seedLobby(API,{managers:6,joined:2});
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const ctx=await browser.createBrowserContext();const p=await ctx.newPage();
  await p.setViewport({width:1280,height:900,deviceScaleFactor:1});
  await p.setBypassServiceWorker(true).catch(()=>{});
  await p.evaluateOnNewDocument(()=>{try{localStorage.setItem('shoops.store','/api/data/')}catch(e){}});
  const textdb=[];p.on('request',req=>{if(/textdb\.dev/i.test(req.url()))textdb.push(req.url())});
  const me=seeded.people[0];
  await p.goto(APP+'/room.html?l='+seeded.id+'#as='+me.mid+'&k='+me.k+'&cm='+seeded.cmSecret,{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#mgrs',{timeout:30000});
  await p.waitForFunction(()=>/2 of 6 joined/.test((document.querySelector('#joinedct')||{}).innerText||''),{timeout:20000});

  await p.click('#editsettings');
  await p.waitForSelector('#s_mgrs',{timeout:10000});
  const st0=await p.evaluate(()=>({m:s_mgrs.value,r:s_rounds.value,ropts:[...s_rounds.options].map(o=>+o.value)}));
  ok('opens at 6 managers, 5 teams each, options 1-5',st0.m==='6'&&st0.r==='5'&&st0.ropts.includes(5)&&Math.max(...st0.ropts)===5,st0);

  await p.select('#s_mgrs','5');
  await sleep(200);
  const st1=await p.evaluate(()=>({m:s_mgrs.value,r:s_rounds.value,ropts:[...s_rounds.options].map(o=>+o.value)}));
  ok('changing Managers to 5 updates Teams each options to include 5 and 6',st1.ropts.includes(5)&&st1.ropts.includes(6)&&Math.max(...st1.ropts)===6,st1);
  ok('Teams each defaults to 6 (fills the 30-team pool)',st1.r==='6',st1);

  await p.select('#s_rounds','6');
  await p.click('#savesettings');
  await p.waitForFunction(()=>!document.querySelector('#s_mgrs')&&/2 of 5 joined/.test((document.querySelector('#joinedct')||{}).innerText||''),{timeout:20000});
  await sleep(400);
  const after=await p.evaluate(()=>{
    const order=[...document.querySelectorAll('#orderlist .mrow')].map(e=>({no:(e.querySelector('.no')||{}).textContent,nm:((e.querySelector('.nm')||{}).textContent||'').trim(),empty:e.classList.contains('emptyrow')}));
    const line=[...document.querySelectorAll('#lobbycard .small.mut')].map(e=>e.innerText).join(' | ');
    return{joined:(document.querySelector('#joinedct')||{}).innerText,order,empty:order.filter(r=>r.empty).length,line,err:(document.querySelector('.err, #s_err')||{}).innerText||''};
  });
  ok('no textdb.dev requests',textdb.length===0,textdb);
  ok('lobby shows 2 of 5 joined and exactly 5 rows (3 empty)',/2 of 5 joined/.test(after.joined)&&after.order.length===5&&after.empty===3,JSON.stringify(after));
  ok('settings line says 6 teams each',/6 teams each/.test(after.line),after.line);
  ok('no error after save',!after.err,after.err);

  await p.click('#editsettings');
  await p.waitForSelector('#s_mgrs',{timeout:10000});
  await p.select('#s_mgrs','6');
  await sleep(200);
  const st2=await p.evaluate(()=>({m:s_mgrs.value,r:s_rounds.value,ropts:[...s_rounds.options].map(o=>+o.value)}));
  ok('changing back to 6 updates Teams each (max 5, default 5)',st2.m==='6'&&st2.r==='5'&&Math.max(...st2.ropts)===5,st2);
  await p.click('#savesettings');
  await p.waitForFunction(()=>!document.querySelector('#s_mgrs')&&/2 of 6 joined/.test((document.querySelector('#joinedct')||{}).innerText||''),{timeout:20000});
  const back=await p.evaluate(()=>({joined:(document.querySelector('#joinedct')||{}).innerText,n:document.querySelectorAll('#orderlist .mrow').length}));
  ok('switching back 5->6 works: 2 of 6 joined, 6 rows',/2 of 6 joined/.test(back.joined)&&back.n===6,back);

  await p.click('#editsettings');
  await p.waitForSelector('#s_mgrs',{timeout:10000});
  await p.select('#s_mgrs','5');
  await sleep(200);
  await p.select('#s_rounds','6');
  await p.click('#savesettings');
  await p.waitForFunction(()=>!document.querySelector('#s_mgrs')&&/2 of 5 joined/.test((document.querySelector('#joinedct')||{}).innerText||''),{timeout:20000});

  await p.click('#startbtn');
  await p.waitForSelector('#cfyes',{timeout:10000});
  await p.click('#cfyes');
  await p.waitForFunction(async()=>{try{const F=window.FBN;const l=new URLSearchParams(location.search).get('l');const m=F.parseJ(await Store.get(F.Keys(l).meta));return m&&m.status==='live'&&m.order.length===5}catch(e){return false}},{timeout:45000});
  const live=await p.evaluate(async()=>{
    const F=window.FBN;const l=new URLSearchParams(location.search).get('l');const m=F.parseJ(await Store.get(F.Keys(l).meta));
    return{status:m.status,orderLen:m.order.length,managers:m.settings.managers,rounds:m.settings.rounds,ph:Object.keys(m.over||{}).filter(k=>m.over[k]&&m.over[k].ph).length};
  });
  ok('start is a 5-seat draft, 6 rounds, 3 placeholders',live.status==='live'&&live.orderLen===5&&live.managers===5&&live.rounds===6&&live.ph===3,live);

  await browser.close();
  try{mock.kill()}catch(e){}
  console.log('\n'+(tot-bad)+'/'+tot+' passed');
  if(bad){console.log('FAILED: '+fails.join(' | '));process.exit(1)}
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(2)});
