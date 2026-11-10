/* s28j (Paul preview fixes): (1) 'Stoopids presents' kicker = 0.45-0.55 of the rendered (fitted) title at 390/1280/1440, >= 11px, ratio from --kicker-ratio;
   (2) every League tab's content (#lbody / main) is centred and as wide as the tab bar (nav#ltabs) at 390/1280/1440/1800 (--content-max 1080, 1440 from 1700);
   Games grid columns 1 @390, 3 @1280/1440, 4 @1800; All teams + Share cards centred; (3) Bets Pool card Copy button top-right on the header line at 390/1280,
   '· N managers' below/left of it; (4) no 'Anyone' button / text in the bet form, help.html or league JS.
   APP=... API=... node tests/e2e_layout_s28j.js   (SHOTS=dir -> s28j-<tab>-<w>.png) */
const CAP=+(process.env.CONTENT_MAX||1012),NAVM0=1080,COLS=w=>Math.max(1,Math.floor((Math.min(w,CAP)-32+16)/336));   /* s28j item 2 change: content = --content-max (STOOPIDS Standings column, value pending), nav keeps 1080; Games auto-fill 320px + 16px gap */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');const F=require('../js/core.js');
const SH=process.env.SHOTS||'';const API=L.API;
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,600):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const TIDS=TD.teams.map(t=>t[0]);
const NAMES=[['Ana','Aces','🏀'],['Ben','Blazers','🔥'],['Cy','Comets','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];const R=TIDS.slice(0,64);const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));const own=(m,k)=>R[m*8+k];
const now=Date.now(),D=864e5;const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');
const G=(id,h,a,t)=>({id,day:'2000-01-01',start:iso(t),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:h,score:null,seed:null},away:{id:a,score:null,seed:null}});
const GAMES=[];for(let i=0;i<12;i++)GAMES.push(G('u'+i,own(i%8,i%8===7?1:0),own((i+1)%8,2),now+(i+1)*36e5));
async function open(id,info,w,tab){const P=await L.phone('j'+w+Math.random().toString(36).slice(2,5),{desktop:w>=760,w,h:900,tz:'Asia/Jakarta'});
  await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:info.managers[0].id,k:info.managers[0].k});
  await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);
  P.page.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});
    else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
  await P.go('league.html?l='+id+'#'+tab);await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(1000);return P}
const TABS=['standings','games','bets','teams','recap','rules','profile'];
(async()=>{try{const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;const M=info.managers.map(m=>m.id);
  /* one pool built by Ana (bets log = base-bets-<mid>) */
  await fetch(API+encodeURIComponent(F.Keys(id).base+'-bets-'+M[0]),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({ev:[{k:'pl',u:'ru000001',ts:now-6e5,v:25,id:'upool00001',parts:M.slice(0,8),amt:10,text:'Who wins the whole thing',places:[50,30]}]})});
  const RES={};
  /* (4) static: no 'Anyone' button anywhere */
  {const lb=fs.readFileSync(path.join(root,'js/league-bets.js'),'utf8'),hp=fs.readFileSync(path.join(root,'help.html'),'utf8'),lh=fs.readFileSync(path.join(root,'js/leaguehome.js'),'utf8');
    ok("static: no data-lb=anyone / 'Anyone' button in league-bets.js, leaguehome.js, help.html",!/data-lb="?anyone|🌍 Anyone|anyone:\s*\(\)=>/.test(lb+lh)&&!/\bAnyone\b(?! with| who)/.test(hp)&&!/\bAnyone\b/.test(lb))}
  for(const w of [390,1280,1440,1800]){RES[w]={};
    for(const tab of TABS){const P=await open(id,info,w,tab);if(tab==='teams')await P.page.waitForSelector('#lbody .obk.atk',{timeout:10000}).catch(()=>{});
      const r=await P.page.evaluate(()=>{const nav=document.getElementById('ltabs'),m=document.querySelector('main'),b=document.getElementById('lbody');const nb=nav.getBoundingClientRect(),mb=m.getBoundingClientRect(),bb=b.getBoundingClientRect();
        const t=document.getElementById('ltitle'),k=document.getElementById('lpres');const cs=getComputedStyle(document.documentElement);
        const g=document.querySelector('#lbody .ggrid');let cols=0;if(g){cols=getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length}
        const cen=sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return Math.round(Math.abs((r.left+r.right)/2-(bb.left+bb.right)/2))};
        return{iw:innerWidth,sw:document.documentElement.scrollWidth,nav:[Math.round(nb.left),Math.round(nb.width)],main:[Math.round(mb.left),Math.round(mb.width)],body:[Math.round(bb.left),Math.round(bb.width)],
          navPad:getComputedStyle(nav).paddingLeft,mainPad:getComputedStyle(m).paddingLeft,cmax:cs.getPropertyValue('--content-max').trim(),kr:cs.getPropertyValue('--kicker-ratio').trim(),
          tfs:parseFloat(getComputedStyle(t).fontSize),kfs:parseFloat(getComputedStyle(k).fontSize),cols,gap:g?getComputedStyle(g).columnGap:'',
          allc:cen('#lbody .card.atk, #lbody .obk.atk'),share:cen('#sharecard, #lbody .s29sh')}});
      RES[w][tab]=r;const mid=r.iw/2;
      ok(`${w}px ${tab}: content centred (width ${r.main[1]}, tab bar ${r.nav[1]}), same side padding, no overflow`,r.navPad===r.mainPad&&Math.abs(r.nav[1]-Math.min(r.iw,r.iw>=1700?1440:NAVM0))<=1&&Math.abs(r.main[0]+r.main[1]/2-mid)<=1&&r.sw<=r.iw,r);
      ok(`${w}px ${tab}: content width = min(viewport, --content-max ${CAP})`,Math.abs(r.main[1]-Math.min(r.iw,CAP))<=1&&r.cmax===CAP+'px',r);
      if(tab==='standings'&&w!==1800){const q=r.kfs/r.tfs;ok(`${w}px kicker/title ratio ${q.toFixed(3)} in 0.45-0.55, kicker >= 11px, --kicker-ratio .5`,q>=0.45&&q<=0.55&&r.kfs>=11&&parseFloat(r.kr)===0.5,r)}
      if(tab==='games'){const want=COLS(w);ok(`${w}px Games grid: ${r.cols} columns (want ${want}), gap 16px`,r.cols===want&&r.gap==='16px',r)}
      if(tab==='teams')ok(`${w}px All teams card centred in the column (off ${r.allc}px)`,r.allc!=null&&r.allc<=2,r);
      if(tab==='profile')ok(`${w}px Share card centred in the column (off ${r.share}px)`,r.share!=null&&r.share<=2,r);
      if(tab==='bets'&&(w===390||w===1280)){
        const p=await P.page.evaluate(()=>{const c=document.querySelector('.b27-pool');if(!c)return null;const h=c.querySelector('.s24hd'),b=h.querySelector('.s27-copy'),wh=h.querySelector('.b27-pwho'),ti=h.querySelector('b');const hb=h.getBoundingClientRect(),bb=b.getBoundingClientRect(),wb=wh.getBoundingClientRect(),tb=ti.getBoundingClientRect(),cb=c.getBoundingClientRect();
          const any=!!document.querySelector('[data-lb=anyone]'),sel=(document.querySelector('.b27-selbar')||{}).innerText||'';return{right:Math.round(hb.right-bb.right),top:Math.round(bb.top-hb.top),cright:Math.round(cb.right-bb.right),btop:Math.round(bb.top),ttop:Math.round(tb.top),tb:Math.round(tb.bottom),bh:Math.round(bb.height),wright:Math.round(wb.right),bleft:Math.round(bb.left),any,sel}});
        ok(`${w}px Pool card: Copy pinned top-right of the header line, managers text never under/over it`,p&&p.right<=1&&p.top<=1&&p.btop<=p.ttop+2&&p.wright<=p.bleft&&p.bh>=44,p);
        ok(`${w}px bet form: no 'Anyone' button; Select all + Clear present`,p&&!p.any&&!/Anyone/.test(p.sel)&&/Select all/.test(p.sel)&&/Clear/.test(p.sel),p&&p.sel);
        {const v=await P.page.evaluate(async()=>{document.querySelector('[data-lb=oppclear]').click();const t=document.getElementById('b27Text');t.value='Ana makes a three';t.dispatchEvent(new Event('input',{bubbles:true}));const a=document.querySelector('[data-lb=amt]');if(a)a.click();await new Promise(r=>setTimeout(r,200));document.getElementById('b27Place').click();await new Promise(r=>setTimeout(r,400));return{confirm:!!document.querySelector('[data-lb=confirm]'),txt:document.getElementById('lbody').innerText}});
          ok(`${w}px bet form: no opponent -> not placed, 'Choose who you are betting against.'`,!v.confirm&&/Choose who you are betting against/.test(v.txt),v.confirm)}
      }
      if(SH&&(['games','bets','standings'].includes(tab)||w!==1800)&&!(w===1800&&tab!=='games'))await P.page.screenshot({path:path.join(SH,'s28j-'+tab+'-'+w+'.png'),fullPage:false});
      if(P.errs.length)ok(`${w}px ${tab}: no page errors`,false,P.errs);
      await P.close()}}
  fs.writeFileSync(process.env.RESJSON||'/tmp/s28j-layout.json',JSON.stringify(RES,null,1));
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
