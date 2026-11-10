/* s28j item 7: Games card Copy text = what the card shows: no 'Lines: <book>' line, owner lines '<School>: <emoji> <manager>' (no 'Owner,'),
   and every copied date/time (game date + tip time, bet/pool 'Posted by … · <stamp>') = the card's own LTIME string in the device zone; s28j item 12: no zone label anywhere (screen or copy).
   Late-evening-ET game (10:00 PM ET = 03:00Z next day) checked with the browser in Asia/Jakarta and in America/New_York.
   APP=... API=... node tests/e2e_copy_tz_s28j.js */
const L=require('./lib.js');const fs=require('fs'),path=require('path');const {seed}=require('./seed_league.js');const {sleep}=L;const root=path.join(__dirname,'..');const F=require('../js/core.js');const API=L.API;
let n=0,bad=0;function ok(t,c,x){n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,700):''))}}
const tsrc=fs.readFileSync(path.join(root,'assets/teams.js'),'utf8');const TD=JSON.parse(tsrc.slice(tsrc.indexOf('{'),tsrc.lastIndexOf('}')+1));const TIDS=TD.teams.map(t=>t[0]);
const NAMES=[['Ana','Aces','🏀'],['Ben','Blazers','🔥'],['Cy','Comets','⭐'],['Dee','Dunkers','🦅'],['Eli','Eagles','🐻'],['Fay','Flyers','🚀'],['Gus','Gators','🐊'],['Hal','Hawks','🦅']];const R=TIDS.slice(0,64);const rosters=()=>NAMES.map((_,i)=>R.slice(i*8,i*8+8));const own=(m,k)=>R[m*8+k];
const ZRE=/\bWIB\b|GMT[+-]?\d*|\bET\b|\bEST\b|\bEDT\b/;const d0=new Date(Date.now()+2*864e5);const T10=Date.UTC(d0.getUTCFullYear(),d0.getUTCMonth(),d0.getUTCDate(),3,0,0);   /* 03:00Z = 10:00 PM EST the evening before */
const iso=ms=>new Date(ms).toISOString().replace(/\.\d+Z/,'Z');
const GAMES=[{id:'late1',day:'2000-01-01',start:iso(T10),status:'scheduled',kind:'reg',round:'',neutral:false,home:{id:own(1,0),score:null,seed:null},away:{id:own(0,0),score:null,seed:null},line:{fav:own(1,0),sp:3.5,src:'DraftKings',ou:141.5}}];
(async()=>{try{const id=await seed(null,{names:NAMES,rosters:rosters(),rounds:8});const info=seed.info;const M=info.managers.map(m=>m.id);
  await fetch(API+encodeURIComponent(F.Keys(id).base+'-bets-'+M[0]),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({ev:[
    {k:'p',u:'ru000001',ts:T10-864e5,v:25,id:'ubet000001',to:M[1],amt:10,a:2,b:1,text:'Aces school wins',postedBy:M[0],postedAt:T10},
    {k:'pl',u:'ru000002',ts:T10-864e5+1,v:25,id:'upool00001',parts:M.slice(0,3),amt:5,text:'Pool of three',postedBy:M[0],postedAt:T10}]})});
  for(const tz of ['Asia/Jakarta','America/New_York']){
    const P=await L.phone('tz'+tz.length,{desktop:true,w:1280,h:900,tz});await P.page.evaluateOnNewDocument((id,me)=>{localStorage.setItem('fbn.me.'+id,JSON.stringify(me))},id,{mid:M[2],k:info.managers[2].k});
    await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);
    P.page.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/data/scores.json')r.respond({status:200,contentType:'application/json',body:JSON.stringify({format:1,sample:false,label:'',season:'2026-27',as_of:'2026-11-01',source:'test',games:GAMES})});else if(u.hostname==='site.api.espn.com')r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"events":[]}'});else r.continue()});
    await P.go('league.html?l='+id+'#games');await P.page.waitForSelector('#lapp[data-ready]',{timeout:25000});await sleep(1200);
    const r=await P.page.evaluate(new Function(`const T=${T10};const c=[...document.querySelectorAll('#lbody .gm')].find(x=>x.querySelector('.s27-copy'));if(!c)return null;const grid=c.closest('.ggrid');let h=grid&&grid.previousElementSibling;while(h&&!h.classList.contains('gday'))h=h.previousElementSibling;
      return{copy:c.querySelector('.s27-copy').dataset.t,time:c.querySelector('.gtm').innerText.trim(),day:h?h.firstChild.textContent.trim():'',zone:h?(h.querySelector('.gtz')||{}).textContent:'',ltTime:LTIME.time(T),ltKey:LTIME.dayKey(T)}`));
    const lines=r?r.copy.split('\n'):[];const dayShown=r?r.day.replace(/^(Today|Tomorrow|Yesterday) · /,''):'';
    ok(tz+': copied date · time = the card ("'+(lines[1]||'')+'" vs card "'+dayShown+'" + "'+(r&&r.time)+'")',r&&lines[1]===dayShown+' · '+r.time&&r.time===r.ltTime,r);
    ok(tz+': no zone label in the copied game text or on the card (item 12)',r&&!ZRE.test(r.copy)&&!ZRE.test(r.time)&&!r.zone,r&&{c:r.copy,t:r.time,z:r.zone});
    {const wantDay=tz==='Asia/Jakarta'?new Date(T10).toISOString().slice(0,10):new Date(T10-864e5).toISOString().slice(0,10);ok(tz+': late-evening-ET game on the local calendar day ('+wantDay+')',r&&r.ltKey===wantDay,r&&r.ltKey)}
    ok(tz+': no "Lines:" line, owner lines "<School>: <emoji> <manager>" (no "Owner,")',r&&!/^Lines:/m.test(r.copy)&&!/DraftKings/.test(r.copy)&&!/^Owner/m.test(r.copy)&&/^[^:\n]+: 🏀 Ana$/m.test(r.copy)&&/^[^:\n]+: 🔥 Ben$/m.test(r.copy),r&&r.copy);
    /* bets + pool: Posted line in the copy = the card's Posted line */
    await P.page.evaluate(()=>document.querySelector('#ltabs [data-v=bets]').click());await P.page.waitForSelector('.b27-posted',{timeout:15000});await sleep(500);
    const b=await P.page.evaluate(()=>[...document.querySelectorAll('.b27-c[data-bet]')].map(c=>({pool:c.classList.contains('b27-pool'),posted:(c.querySelector('.b27-posted')||{}).textContent||'',copy:(c.querySelector('.s27-copy')||{dataset:{}}).dataset.t||''})));
    for(const k of [false,true]){const x=b.find(y=>y.pool===k);ok(tz+': '+(k?'pool':'bet')+' copy ends with the spec line Posted <card local date, year> by Ana · <league> (s29e paste_bet_spec item 6)',x&&x.posted&&/^Posted by Ana · \w{3} \d{1,2}, \d{1,2}:\d{2} [AP]M$/.test(x.posted)&&(m=>!!m&&new RegExp('^Posted '+m[1]+', \\d{4} by Ana · \\S.*$').test(x.copy.split('\n').pop()))(x.posted.match(/· (\w{3} \d{1,2}),/)),x)}
    /* item 12: every League tab, DOM text and every copy string (data-t) + the clipboard after a Copy: 0 zone labels */
    {const hits=[];for(const t of ['standings','games','bets','teams','rosters','recap','redraft','rules','profile']){await P.page.evaluate(t=>{const b=document.querySelector('#ltabs [data-v='+t+']');if(b)b.click()},t);await sleep(700);
      const x=await P.page.evaluate(()=>({dom:document.body.innerText,cp:[...document.querySelectorAll('[data-t]')].map(e=>e.dataset.t).join('\n')}));const m=(x.dom+'\n'+x.cp).match(new RegExp(ZRE.source,'g'));if(m)hits.push(t+': '+m.join(','))}
      ok(tz+': 0 zone labels (WIB / GMT±N / ET / EST / EDT) in the DOM text and copy strings of every tab',hits.length===0,hits)}
    {await P.page.evaluate(()=>document.querySelector('#ltabs [data-v=bets]').click());await sleep(600);await P.page.evaluate(()=>{window.__clip=[];const w=navigator.clipboard;try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{window.__clip.push(t);return Promise.resolve()}}})}catch(e){}});
      await P.page.evaluate(()=>{const c=document.querySelector('.b27-c[data-bet] .s27-copy');if(c)c.click()});await sleep(500);const clip=await P.page.evaluate(()=>(window.__clip||[]).join('\n'));ok(tz+': clipboard text after a bet Copy has 0 zone labels',!ZRE.test(clip),clip.slice(0,300))}
    if(P.errs.length)ok(tz+': no page errors',false,P.errs);await P.close()}
}catch(e){bad++;console.log('FAIL exception: '+(e&&e.stack||e))}console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);await L.close();process.exit(bad?1:0)})();
