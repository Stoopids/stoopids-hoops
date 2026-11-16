/* sh32 Task B: screenshot every Bets/Games card kind (synthetic league, mock store, shoops1- keys only).
   Also dumps each card's visible line order and measures the Ready-else gap (Task A, no patch).
   NODE_PATH=/tmp/node_modules node tests/e2e_sh32_cards.js */
const { chromium } = require('playwright-core');const path=require('path'),fs=require('fs');const { spawn } = require('child_process');
const HROOT=path.join(__dirname,'..'),OUT=process.env.OUT||'/workspace/nba-league/screens-st',HP=+(process.env.HP||9071);
fs.mkdirSync(OUT,{recursive:true});
const PRE='sh32-cards';
function srv(a,re){return new Promise((res,rej)=>{const c=spawn(a[0],a.slice(1));let b='';const on=d=>{b+=d;if(re.test(b))res(c)};c.stdout.on('data',on);c.stderr.on('data',on);setTimeout(()=>rej(new Error(b)),9000)})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const GID='401909978', GID2='401909994', NOW='2026-11-16T12:00:00Z';
function linesOf(el){
  const skip=new Set(['SCRIPT','STYLE']);
  function walk(n,acc){
    if(!n)return;
    if(n.nodeType===3){const t=n.textContent.replace(/\s+/g,' ').trim();if(t)acc.push(t);return}
    if(n.nodeType!==1||skip.has(n.nodeName))return;
    const st=getComputedStyle(n);
    if(st.display==='none'||st.visibility==='hidden')return;
    const kids=[...n.childNodes];
    if(!kids.length){const t=(n.innerText||'').replace(/\s+/g,' ').trim();if(t)acc.push(t);return}
    // treat a row as one line when it doesn't clearly stack
    const block=st.display==='block'||st.display==='flex'||st.display==='grid'||n.nodeName==='DIV'||n.nodeName==='P'||n.nodeName==='SECTION';
    if(block && n.childElementCount===0){const t=(n.innerText||'').replace(/\s+/g,' ').trim();if(t)acc.push(t);return}
    if(block){
      const t=(n.innerText||'').replace(/\s+/g,' ').trim();
      // If this element is a short single visual line, keep it as one
      const kidsBlock=[...n.children].filter(c=>{const s=getComputedStyle(c);return s.display==='block'||s.display==='flex'||s.display==='grid'});
      if(!kidsBlock.length){if(t)acc.push(t);return}
    }
    kids.forEach(k=>walk(k,acc));
  }
  const acc=[];walk(el,acc);
  // merge consecutive fragments that were split too finely
  return acc.filter(Boolean);
}
(async()=>{
  const mock=await srv([process.execPath,path.join(HROOT,'tools/mock_textdb.js'),String(HP),HROOT,String(HP+1)],/API origin on[\s\S]*app origin on|app origin on[\s\S]*API origin on/);
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const report={gap:null,cards:[]};
  try{
    const {seed}=require(path.join(HROOT,'tests/seed_league.js'));
    const API=`http://127.0.0.1:${HP+1}/api/data/`;
    const id=await seed(API,{managers:6,rounds:5,name:'TEST SYNTHETIC sh32',names:[['Ana','TEST Aces','🏀'],['Ben','TEST Blazers','🔥'],['Cy','TEST Comets','⭐'],['Dee','TEST Dunkers','🦅'],['Eli','TEST Eagles','🐻'],['Fay','TEST Flyers','🚀']]});
    const M=seed.info.managers;
    async function open(mi,when,hash){
      const c=await br.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Jakarta',permissions:['clipboard-read','clipboard-write']});
      await c.clock.install({time:new Date(when||NOW)});
      await c.route(/textdb\.dev|espn\.com/,r=>r.abort());
      await c.addInitScript(o=>{localStorage.setItem('shoops.store','/api/data/');localStorage.setItem('shoops.me.'+o.id,JSON.stringify(o.me))},{id,me:{mid:M[mi].id,k:M[mi].k}});
      const p=await c.newPage();
      await p.goto(`http://127.0.0.1:${HP}/league.html?l=${id}#${hash||'bets27'}`);
      await p.waitForFunction(()=>typeof U!=='undefined'&&U.state==='ok'&&typeof b27Who==='function'&&b27Who()&&typeof RQ!=='undefined'&&D&&D.games&&D.games.length,{timeout:40000});
      await sleep(1200);
      return {c,p};
    }
    async function shot(p,sel,name){
      const loc=p.locator(sel).first();
      const n=await loc.count();
      if(!n){console.log('MISSING',name,sel);return false}
      await loc.scrollIntoViewIfNeeded();await sleep(200);
      await loc.screenshot({path:`${OUT}/${name}.png`});
      console.log('shot',`${OUT}/${name}.png`);
      return true;
    }
    async function describe(p,sel,kind,section){
      const info=await p.evaluate(({sel,fn})=>{
        const el=document.querySelector(sel);
        if(!el)return {missing:true,sel};
        const skip=new Set(['SCRIPT','STYLE']);
        function walk(n,acc){
          if(!n)return;
          if(n.nodeType===3){const t=n.textContent.replace(/\s+/g,' ').trim();if(t)acc.push(t);return}
          if(n.nodeType!==1||skip.has(n.nodeName))return;
          const st=getComputedStyle(n);
          if(st.display==='none'||st.visibility==='hidden')return;
          const kids=[...n.childNodes];
          const block=st.display==='block'||st.display==='flex'||st.display==='grid'||n.nodeName==='DIV'||n.nodeName==='P'||n.nodeName==='SECTION'||n.nodeName==='H2';
          if(block){
            const kidsBlock=[...n.children].filter(c=>{const s=getComputedStyle(c);return (s.display==='block'||s.display==='flex'||s.display==='grid') && (c.innerText||'').trim()});
            if(!kidsBlock.length){const t=(n.innerText||'').replace(/\s+/g,' ').trim();if(t)acc.push(t);return}
          }
          kids.forEach(k=>walk(k,acc));
        }
        const lines=[];walk(el,lines);
        const tree=[...el.children].map(c=>({tag:c.tagName,cls:c.className,text:(c.innerText||'').replace(/\s+/g,' ').trim().slice(0,160),h:Math.round(c.getBoundingClientRect().height)}));
        return {sel,text:(el.innerText||'').trim(),lines,tree,h:Math.round(el.getBoundingClientRect().height)};
      },{sel});
      if(info&&!info.missing){report.cards.push(Object.assign({kind,section},info));console.log('CARD',kind,'@',section,'lines=',info.lines)}
      else console.log('NO CARD',kind,sel);
    }

    // Seed bets + requests as Ana
    let V=await open(0);let p=V.p;
    const seedInfo=await p.evaluate(async o=>{
      const now='2026-11-12T20:00:00.000Z', placed='2026-11-12T20:00:00.000Z';
      const g=(D.games||[]).find(x=>String(x.id)===o.gid);
      const g2=(D.games||[]).find(x=>String(x.id)===o.gid2);
      const rdSp=(t,opp,l,d)=>({k:'spread',t,o:opp,l,sp:'mcbb',d});
      const gm=(i,backer,other,text,extra)=>Object.assign({id:'t32bet'+i,n:910+i,backer,other,amt:5,odds:{a:1,b:1},text,status:'open',created_at:now,wk:'game',cov:'game',gid:o.gid,start:g&&g.start,date:g&&g.day,rd:rdSp('Minnesota','Dallas',-5.5,'2026-11-12'),postedBy:backer,postedAt:placed},extra||{});
      const add=[
        gm(1,'Ana','Ben','Minnesota -5.5 vs Dallas +5.5',{rd:rdSp('Minnesota','Dallas',-5.5,'2026-11-12')}),
        gm(2,'Cy','Dee','Dallas +5.5 vs Minnesota -5.5',{rd:rdSp('Dallas','Minnesota',5.5,'2026-11-12')}),
        gm(3,'Ana','Ben','Over 226.5 vs Under 226.5, Minnesota v Dallas',{odds:{a:2,b:1},rd:{k:'total',t:'Minnesota',o:'Dallas',l:226.5,ou:'o',sp:'mcbb',d:'2026-11-12'}}),
        {id:'t32bet4',n:914,backer:'Ana',other:'Ben',amt:10,odds:{a:1,b:1},text:'TEST Knicks win 50 games',status:'open',created_at:now,wk:'season',postedBy:'Ana',postedAt:placed},
        gm(5,'Ana','Ben','Minnesota -5.5 vs Dallas +5.5',{status:'backer',settled_at:'2026-11-13T12:00:00.000Z',rd:rdSp('Minnesota','Dallas',-5.5,'2026-11-12')}),
        gm(6,'Ana','Ben','Dallas +5.5 vs Minnesota -5.5',{status:'void',rd:rdSp('Dallas','Minnesota',5.5,'2026-11-12')}),
        gm(7,'Ana','Ben','Minnesota -5.5 vs Dallas +5.5',{status:'backer',settled_at:'2026-11-13T12:00:00.000Z',rd:rdSp('Minnesota','Dallas',-5.5,'2026-11-12'),
          fxh:[{i:'fx1',by:'Ben',r:'other',from:'backer',out:'withdrawn',at:'2026-11-13T13:00:00.000Z'}]}),
        {id:'t32pool1',n:918,kind:'pool',backer:'Ana',parts:['Ana','Ben','Cy'],amt:5,back:null,text:'NBA Cup pool',status:'open',created_at:now,wk:'season',postedBy:'Ana',postedAt:placed},
        {id:'t32pool2',n:919,kind:'pool',backer:'Ana',parts:['Ana','Ben','Cy'],amt:5,back:{Ana:10,Ben:0,Cy:5},text:'Settled cup pool',status:'open',created_at:now,settled_at:'2026-11-13T12:00:00.000Z',wk:'season',postedBy:'Ana',postedAt:placed}
      ];
      const back=await b27Write(cur=>cur.filter(b=>!/^t32/.test(b.id)).concat(add),cur=>add.every(a=>cur.some(b=>b.id===a.id)));
      b27Apply(back);
      const ready=back.filter(b=>typeof b27Ready==='function'&&b27Ready(b)).map(b=>b.id);
      const exp=Date.now()+3*864e5;
      const start2=g2&&g2.start;
      const reqs=[
        {id:'t32rq1',n:1,by:'Ana',to:['Ben','Cy','Dee','Eli','Fay'],amt:5,odds:[1,1],txt:'Orlando +8.5 vs Boston -8.5',lab:'Orlando +8.5 vs Boston -8.5',date:'Nov 16',game:'Orlando vs Boston',exp,start:start2,status:'open',dec:[],took:[],cov:'game',wk:'game',gid:o.gid2,rd:{k:'spread',t:'Orlando',o:'Boston',l:8.5,sp:'mcbb',d:'2026-11-16'}},
        {id:'t32rq2',n:2,by:'Ben',to:['Ana','Cy','Dee','Eli','Fay'],amt:5,odds:[1,1],txt:'Boston -8.5 vs Orlando +8.5',lab:'Boston -8.5 vs Orlando +8.5',date:'Nov 16',game:'Boston vs Orlando',exp,start:start2,status:'open',dec:[],took:[],cov:'game',wk:'game',gid:o.gid2,rd:{k:'spread',t:'Boston',o:'Orlando',l:-8.5,sp:'mcbb',d:'2026-11-16'}},
        {id:'t32rq3',n:3,by:'Ana',to:['Ben'],amt:5,odds:[2,1],txt:'Ana outscores Ben in league points this week',lab:'Ana outscores Ben in league points this week',exp,status:'open',dec:['Ben'],took:[],cov:'game',wk:'unknown',free:1},
        {id:'t32rq4',n:4,by:'Ana',to:['Ben','Cy','Dee','Eli','Fay'],amt:10,odds:[1,1],txt:'TEST Knicks win 50 games',lab:'TEST Knicks win 50 games',exp,status:'open',dec:[],took:[],cov:'game',wk:'season',free:1}
      ];
      const url=HOOPS.url('requests-2627');
      const raw=(await (await fetch(url)).text())||'{"v":1,"reqs":[]}';
      let cur;try{cur=JSON.parse(raw);if(typeof cur==='string')cur=JSON.parse(cur)}catch(e){cur={v:1,reqs:[]}}
      if(Array.isArray(cur))cur={v:1,reqs:cur};
      if(!cur.v)cur.v=1;
      cur.reqs=(cur.reqs||[]).filter(r=>!/^t32rq/.test(r.id)).concat(reqs);
      await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(cur)});
      if(RQ.load)await RQ.load();
      return {gDay:g&&g.day,gStatus:g&&g.status,ready,reqN:(RQ.S.list||[]).length,reqIds:(RQ.S.list||[]).map(r=>r.id),betN:(U.doc.bets||[]).length};
    },{gid:GID,gid2:GID2});
    console.log('SEED',JSON.stringify(seedInfo));
    await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);

    // Ana: Ready For Me, Requested By Me, All Bets settled/pool
    await shot(p,'#b27Ready','sh32-cards-ready-me-section-mobile');
    await shot(p,'#b27Ready .b27-c','sh32-cards-ready-me-mobile');
    await describe(p,'#b27Ready .b27-c','ready-me-1v1','Ready For Me to Settle');
    // Open request cards live at the top of All Bets (RQ.pinned), not on the Request form tab
    const anaReq=await p.evaluate(()=>{
      const root=document.getElementById('rqPinned')||document.querySelector('.rq-pin');
      if(root&&!root.id)root.id='rqPinned';
      return {has:!!root,hs:[...document.querySelectorAll('#rqPinned h2.rq-h, .rq-pin h2.rq-h')].map(h=>h.textContent.trim()),
        cards:[...document.querySelectorAll('#rqPinned .rq-card, .rq-pin .rq-card')].map((c,i)=>{if(!c.id)c.id='anarq-'+i;return {id:c.id,text:c.innerText.slice(0,160)}}),
        listN:(RQ.S.list||[]).length, liveN:(RQ.S.list||[]).filter(r=>r.status==='open').length};
    });
    console.log('ANA REQ',JSON.stringify(anaReq));
    if(anaReq.has)await shot(p,'#rqPinned','sh32-cards-req-ana-sections-mobile');
    for(const c of (anaReq.cards||[])){
      const t=c.text||'';
      const name=/You declined/i.test(t)?'sh32-cards-req-declined-ana-mobile':/Requested By Me|Boston -8.5|Knicks|outscores/.test(t)&&!/Orlando \+8\.5/.test(t)?'sh32-cards-req-by-me-mobile':'sh32-cards-req-by-stoopid-ana-mobile';
      await shot(p,'#'+c.id,name);
      await describe(p,'#'+c.id,/You declined/i.test(t)?'req-declined':/Ben posted|Dallas|Boston -8.5/.test(t)?'req-by-a-stoopid':'req-by-me','All Bets request list (Ana)');
    }
    await V.c.close();

    // Ben's view: Ready For Someone Else, Requested By A Stoopid, declined, All Bets
    V=await open(1);p=V.p;
    await p.evaluate(()=>{tab='bets27';OB_VIEW='all';render()});await sleep(1500);
    await p.screenshot({path:`${OUT}/sh32-cards-sections-ben-mobile.png`,fullPage:true});
    console.log('shot',`${OUT}/sh32-cards-sections-ben-mobile.png`);
    await shot(p,'#b27ReadyElse .b27-c','sh32-cards-ready-else-mobile');
    await shot(p,'#b27ReadyElse .b27-c','sh32-ready-else-card-mobile'); // Task A gap documentation on sh32
    await describe(p,'#b27ReadyElse .b27-c','ready-else-1v1','Ready For Someone Else to Settle');
    // gap measurement
    report.gap=await p.evaluate(()=>{
      const card=document.querySelector('#b27ReadyElse .b27-c');
      if(!card)return {missing:true};
      const ready=card.querySelector('.b27-ready-t');
      const foot=card.querySelector('.b27-foot');
      const rx=card.querySelector('.s25rxr');
      const ts=card.querySelector('.b27-ts');
      const del=card.querySelector('.b27-del');
      const between=[...card.children].map(c=>({tag:c.tagName,cls:String(c.className),h:Math.round(c.getBoundingClientRect().height),mt:getComputedStyle(c).marginTop,text:(c.innerText||'').replace(/\s+/g,' ').trim().slice(0,80)}));
      const cr=card.getBoundingClientRect(), rr=ready?ready.getBoundingClientRect():null, fr=foot?foot.getBoundingClientRect():null, rxr=rx?rx.getBoundingClientRect():null, tr=ts?ts.getBoundingClientRect():null;
      const cs=getComputedStyle(card);
      return {
        cardH:Math.round(cr.height), minHeight:cs.minHeight, display:cs.display, flexDir:cs.flexDirection,
        readyBottom:rr&&Math.round(rr.bottom),
        footTop:fr&&Math.round(fr.top),
        gapPx:rr&&fr?Math.round(fr.top-rr.bottom):null,
        footMt:foot&&getComputedStyle(foot).marginTop,
        footAlign:foot&&getComputedStyle(foot).alignItems,
        rxH:rxr&&Math.round(rxr.height),
        tsTop:tr&&Math.round(tr.top),
        tsH:tr&&Math.round(tr.height),
        delH:del&&Math.round(del.getBoundingClientRect().height),
        delMt:del&&getComputedStyle(del).marginTop,
        emptyKids:between.filter(x=>x.h>0&&!x.text),
        between
      };
    });
    console.log('GAP',JSON.stringify(report.gap,null,2));

    // All Bets cards by id
    await p.evaluate(()=>{OB_VIEW='all';render()});await sleep(800);
    const allMap={
      't32bet2':'sh32-cards-all-ready-outsider-mobile',
      't32bet4':'sh32-cards-all-freetext-mobile',
      't32bet5':'sh32-cards-all-settled-mobile',
      't32bet6':'sh32-cards-all-void-mobile',
      't32bet7':'sh32-cards-fx-withdrawn-mobile',
      't32pool1':'sh32-cards-pool-open-mobile',
      't32pool2':'sh32-cards-pool-settled-mobile'
    };
    const kindMap={
      't32bet2':'all-ready-outsider','t32bet4':'all-freetext-season','t32bet5':'all-settled',
      't32bet6':'all-void','t32bet7':'all-settled-withdrawn-fx','t32pool1':'pool-open','t32pool2':'pool-settled'
    };
    for(const [bid,name] of Object.entries(allMap)){
      const sel=`[data-s24-b="${bid}"], #bet-${bid}, .b27-c[data-id="${bid}"]`;
      // find selector that exists
      const used=await p.evaluate(id=>{
        const el=[...document.querySelectorAll('.b27-c, .b27-pool')].find(c=>c.outerHTML.includes(id) || (c.getAttribute('data-s24-b')===id) || c.id==='bet-'+id);
        if(!el)return null;
        if(!el.id)el.id='shot-'+id;
        return '#'+el.id;
      },bid);
      if(used){
        await shot(p,used,name);
        await describe(p,used,kindMap[bid],'All Bets');
      }else console.log('MISSING bet',bid);
    }

    // Requests as Ben live at the top of All Bets
    const reqSels=await p.evaluate(()=>{
      const root=document.getElementById('rqPinned')||document.querySelector('.rq-pin');
      if(root&&!root.id)root.id='rqPinned';
      const hs=[...document.querySelectorAll('#rqPinned h2.rq-h')].map(h=>h.textContent.trim());
      const cards=[...document.querySelectorAll('#rqPinned .rq-card')].map((c,i)=>{if(!c.id)c.id='rqshot-'+i;return {id:c.id,text:c.innerText.slice(0,160)}});
      return {has:!!root,hs,cards,listN:(RQ.S.list||[]).length};
    });
    console.log('BEN REQ',JSON.stringify(reqSels));
    if(reqSels.has)await shot(p,'#rqPinned','sh32-cards-req-ben-sections-mobile');
    for(const c of (reqSels.cards||[])){
      const tx=c.text||'';
      const name=/You declined/i.test(tx)?'sh32-cards-req-declined-mobile':/Boston -8.5/.test(tx)?'sh32-cards-req-by-me-ben-mobile':'sh32-cards-req-by-stoopid-mobile';
      await shot(p,'#'+c.id,name);
      await describe(p,'#'+c.id, /You declined/i.test(tx)?'req-declined':/Boston -8.5/.test(tx)?'req-by-me':'req-by-a-stoopid','All Bets request list (Ben)');
    }

    // Tally page holds settled bets
    await p.evaluate(()=>{tab='bets27';OB_VIEW='tally';render()});await sleep(1200);
    await p.screenshot({path:`${OUT}/sh32-cards-tally-mobile.png`,fullPage:true});
    console.log('shot',`${OUT}/sh32-cards-tally-mobile.png`);
    for(const [bid,name,kind] of [
      ['t32bet5','sh32-cards-all-settled-mobile','all-settled'],
      ['t32bet7','sh32-cards-fx-withdrawn-mobile','all-settled-withdrawn-fx'],
      ['t32pool2','sh32-cards-pool-settled-mobile','pool-settled']
    ]){
      const used=await p.evaluate(id=>{
        const el=document.getElementById('bet-'+id)||[...document.querySelectorAll('.b27-c, .b27-pool')].find(c=>c.id==='bet-'+id||(c.getAttribute('data-bid')===id));
        if(!el)return null;
        if(!el.id)el.id='shot-'+id;
        return '#'+el.id;
      },bid);
      if(used){await shot(p,used,name);await describe(p,used,kind,'Tally / settled')}
      else console.log('MISSING settled',bid);
    }

    // Games tab
    await p.evaluate(()=>{tab='games';if(typeof showTab==='function')showTab('games');else render()});await sleep(1500);
    await p.screenshot({path:`${OUT}/sh32-cards-games-page-mobile.png`,fullPage:true});
    console.log('shot',`${OUT}/sh32-cards-games-page-mobile.png`);
    const games=await p.evaluate(()=>{
      const cards=[...document.querySelectorAll('.gm')].slice(0,8).map((c,i)=>{
        if(!c.id)c.id='gmshot-'+i;
        return {id:c.id,cls:c.className,text:c.innerText.replace(/\s+/g,' ').trim().slice(0,160),fin:c.classList.contains('gfin')};
      });
      return cards;
    });
    console.log('GAMES',JSON.stringify(games,null,2));
    let didUp=false,didFin=false,didFinOpen=false;
    for(const g of games){
      if(!didUp && !g.fin){
        await shot(p,'#'+g.id,'sh32-cards-game-upcoming-mobile');
        await describe(p,'#'+g.id,'game-upcoming','Games');
        didUp=true;
      }
    }
    await p.evaluate(()=>{gMode='scores';gDay='2026-11-12';tab='games';render()});await sleep(1500);
    await p.screenshot({path:`${OUT}/sh32-cards-games-past-mobile.png`,fullPage:true});
    console.log('shot',`${OUT}/sh32-cards-games-past-mobile.png`);
    const past=await p.evaluate(()=>{
      return [...document.querySelectorAll('.gm')].slice(0,8).map((c,i)=>{
        if(!c.id)c.id='gmpast-'+i;
        return {id:c.id,cls:c.className,text:c.innerText.replace(/\s+/g,' ').trim().slice(0,160),fin:c.classList.contains('gfin')};
      });
    });
    console.log('PAST GAMES',JSON.stringify(past,null,2));
    for(const g of past){
      if(!didFin && g.fin){
        await shot(p,'#'+g.id,'sh32-cards-game-final-mobile');
        await describe(p,'#'+g.id,'game-final-collapsed','Games (past)');
        didFin=true;
        await p.evaluate(id=>{const el=document.getElementById(id);const btn=el&&(el.querySelector('[data-gfin], .gsum, button'));if(btn)btn.click()},g.id);
        await sleep(500);
        await shot(p,'#'+g.id,'sh32-cards-game-final-open-mobile');
        await describe(p,'#'+g.id,'game-final-open','Games (past)');
        didFinOpen=true;
      }
    }
    await V.c.close();

    fs.writeFileSync(`${OUT}/sh32-cards-lines.json`,JSON.stringify(report,null,2));
    console.log('wrote',`${OUT}/sh32-cards-lines.json`,'cards',report.cards.length);
  }finally{await br.close();mock.kill()}
})().catch(e=>{console.error(e);process.exit(1)});
