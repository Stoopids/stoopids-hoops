/* sh11: lobby Managers list must show exactly settings.managers rows (joined + Empty seat).
   A leftover "Open spot" loop was appending a second set of rows for unfilled seats.
   Mock store only (shoops.store=/api/data/). Never writes to textdb.dev.
   node tests/e2e_nba_lobby_seats.js */
let puppeteer;try{puppeteer=require('puppeteer-core')}catch(e){try{puppeteer=require('/workspace/nba-e2e-deps/node_modules/puppeteer-core')}catch(e2){puppeteer=require('/tmp/nba-e2e-deps/node_modules/puppeteer-core')}}
const {spawn}=require('child_process');const path=require('path');const fs=require('fs');
const F=require('../js/core.js');
const ROOT=path.resolve(__dirname,'..');const PORT=+process.env.PORT||8861;
const APP=process.env.APP||('http://127.0.0.1:'+PORT);
const API=APP+'/api/data/';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const SHOTS=process.env.SHOTS||'';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function startMock(){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(ROOT,'tools/mock_textdb.js'),String(PORT),ROOT],{stdio:['ignore','pipe','pipe']});let b='';const on=d=>{b+=d;if(/mock app origin on/.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);c.on('error',rej);setTimeout(()=>rej(new Error('mock timeout '+b)),8000)})}

async function seedLobby(api,o){o=o||{};
  const N=o.managers||6,joined=o.joined||2;
  const post=(k,v)=>fetch(api+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'text/plain'},body:typeof v==='string'?v:JSON.stringify(v)});
  const id=F.makeLeagueId();const K=F.Keys(id);
  const s={name:o.name||'TEST sh11 lobby',mgrName:'TEST Commish',teamName:'TEST Team 1',managers:N,rounds:F.roundsFor(N),type:'snake',startAt:null,startMode:'manual',orderMode:'manual',clockSecs:0,autoPick:true,warn15:true};
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
  await sleep(800);
  const info=await p.evaluate(()=>{
    const rows=[...document.querySelectorAll('#mgrs .mrow')].map(e=>({cls:e.className,no:(e.querySelector('.no')||{}).textContent,nm:((e.querySelector('.nm')||{}).textContent||'').trim(),open:e.classList.contains('open'),empty:e.classList.contains('emptyrow')}));
    const order=[...document.querySelectorAll('#orderlist .mrow')].map(e=>({cls:e.className,no:(e.querySelector('.no')||{}).textContent,nm:((e.querySelector('.nm')||{}).textContent||'').trim()}));
    return{joined:(document.querySelector('#joinedct')||{}).innerText,wait:(document.querySelector('#waitmgrs')||{}).innerText,note:(document.querySelector('#startnote')||{}).innerText,rows,order,open:rows.filter(r=>r.open).length,empty:rows.filter(r=>r.empty).length};
  });
  if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,'lobby-6mgr-2joined-desktop.png'),fullPage:true})}
  ok('no textdb.dev requests',textdb.length===0,textdb);
  ok('header says 2 of 6 joined',/2 of 6 joined/.test(info.joined),info.joined);
  ok('order list has exactly 6 rows (2 joined + 4 Empty seat)',info.order.length===6,JSON.stringify(info.order));
  ok('Managers card has exactly 6 rows, not a second set of Open spots',info.rows.length===6,JSON.stringify({n:info.rows.length,open:info.open,empty:info.empty,rows:info.rows}));
  ok('no leftover Open spot rows',info.open===0&&!info.rows.some(r=>/Open spot/.test(r.nm)),JSON.stringify(info.rows.filter(r=>r.open||/Open spot/.test(r.nm))));
  ok('four Empty seat rows numbered 3-6',info.empty===4&&info.rows.filter(r=>r.empty).map(r=>r.no).join()==='3,4,5,6',JSON.stringify(info.rows.filter(r=>r.empty)));
  ok('start note says 4 empty seats will be auto-picked if you start now',/4 empty seats will be auto-picked if you start now/.test(info.note),info.note);

  /* starting must fill only the 4 empty seats, for a 6-manager draft — not 10 */
  const start=await p.$('#startbtn');
  if(start){await start.click();
    await p.waitForSelector('#cfyes',{timeout:10000});
    await p.$eval('#cfyes',e=>e.click());
    await p.waitForFunction(async()=>{try{const F=window.FBN;const l=new URLSearchParams(location.search).get('l');if(!F||!window.Store||!l)return false;const m=F.parseJ(await Store.get(F.Keys(l).meta));return m&&m.status==='live'&&Array.isArray(m.order)&&m.order.length===6}catch(e){return false}},{timeout:45000}).catch(()=>null);
    await sleep(800);
    const after=await p.evaluate(async()=>{
      const F=window.FBN;const l=new URLSearchParams(location.search).get('l');const K=F.Keys(l);
      const m=F.parseJ(await Store.get(K.meta));
      const claims=[];for(let i=1;i<=8;i++){const c=F.parseClaim(await Store.get(K.slot(i,0)).catch(()=>''));if(c)claims.push({i,mid:c.mid,w:c.w,name:c.name})}
      return{status:m&&m.status,orderLen:m&&m.order&&m.order.length,managers:m&&m.settings&&m.settings.managers,rounds:m&&m.settings&&m.settings.rounds,claims,ph:(m&&m.over)?Object.keys(m.over).filter(k=>m.over[k]&&m.over[k].ph).length:0};
    });
    ok('start keeps 6 managers / 5 rounds (does not create 10 seats)',after.status==='live'&&after.orderLen===6&&after.managers===6&&after.rounds===5,JSON.stringify(after));
    ok('exactly 6 claimed seats, 4 of them placeholders',after.claims.length===6&&after.claims.filter(c=>String(c.w||'').indexOf('ph:')===0).length===4&&after.ph===4,JSON.stringify(after.claims));
    ok('no claims in seats 7-8',after.claims.every(c=>c.i>=1&&c.i<=6),JSON.stringify(after.claims));
  }else ok('Start button present for commissioner',false);

  await browser.close();
  try{mock.kill()}catch(e){}
  console.log('\n'+(tot-bad)+'/'+tot+' passed');
  if(bad){console.log('FAILED: '+fails.join(' | '));process.exit(1)}
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(2)});
