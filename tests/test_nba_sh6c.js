/* sh6c regression (unit, no browser):
   1) every store read/write goes through Store.fetchT, so the draft room's store-health timer sees it (before: it never did, so after 12 s on the live store it
      reported a stall and froze human auto-pick at 0:00 AUTO-PICKING);
   2) human auto-pick = top queued team still available, else best Power Ranking (BPI meta.o) still available;
   3) the room has no 'Pick a team' pop-up any more and starts on Power Ranking. */
const fs=require('fs'),path=require('path'),vm=require('vm');const ROOT=path.resolve(__dirname,'..');
let n=0,bad=0;const ok=(t,c,x)=>{n++;if(c)console.log('ok   '+t);else{bad++;console.log('FAIL '+t,x===undefined?'':JSON.stringify(x))}};
(async()=>{
 const calls=[];const ls={};const win={location:{hostname:'stoopids.github.io',origin:'https://stoopids.github.io'},localStorage:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},
  dispatchEvent(){},CustomEvent:function(){},fetch:async(u,o)=>{calls.push(['raw',u,(o&&o.method)||'GET']);return{ok:true,status:200,text:async()=>''}},AbortController,setTimeout,clearTimeout,console};
 win.window=win;const F=require('../js/core.js');win.FBN=F;const ctx=vm.createContext(win);vm.runInContext(fs.readFileSync(path.join(ROOT,'js/store.js'),'utf8'),ctx);const Store=win.Store;
 ok('store is the real textdb host on the live site',Store.real===true&&/textdb\.dev/.test(Store.base),Store.base);
 const seen=[];const f0=Store.fetchT;Store.fetchT=function(u,o,ms){seen.push(u);return f0.call(this,u,o,ms)};/* exactly what room.js HL does */
 await Store.get('shoops1-abc-meta');await Store.set('shoops1-abc-meta',{a:1});await Store.get('shoops1-abc-e1-p3');await Store.set('shoops1-abc-e1-p3',JSON.stringify({id:'x',n:3,owner:'m',tid:'1'})).catch(()=>{});
 ok('Store.get / Store.set (meta and pick keys) all pass through the wrapped Store.fetchT',seen.length>=4&&seen.length===calls.length,{seen:seen.length,raw:calls.length});
 /* 2: auto choice */
 const meta={};for(let i=1;i<=30;i++)meta[String(i)]={o:31-i};/* team '30' is BPI #1, '29' #2 ... */
 const pool=Object.keys(meta);const pr=t=>meta[t].o;const st=(picks,q)=>({picks:picks.map((t,i)=>({n:i+1,tid:t,owner:'x'})),queues:{me:q||[]}});
 F.takenMap=F.takenMap||(s=>{const m={};s.picks.forEach(p=>m[p.tid]=p);return m});
 let c=F.autoChoice(st([],[]),'me',pool,()=>0.5,pr);ok('no queue: best BPI (#1) team',c.tid==='30'&&c.from==='power',c);
 c=F.autoChoice(st(['30','29'],[]),'me',pool,()=>0.5,pr);ok('no queue, #1 and #2 gone: BPI #3',c.tid==='28',c);
 c=F.autoChoice(st([],['12','20']),'me',pool,()=>0.5,pr);ok('queue first: top queued team',c.tid==='12'&&c.from==='queue',c);
 c=F.autoChoice(st(['12'],['12','20']),'me',pool,()=>0.5,pr);ok('queued team taken: next queued team',c.tid==='20',c);
 c=F.autoChoice(st(['12','20'],['12','20']),'me',pool,()=>0.5,pr);ok('whole queue taken: best BPI left',c.tid==='30'&&c.from==='power',c);
 /* 3: room source */
 const room=fs.readFileSync(path.join(ROOT,'js/room.js'),'utf8');
 ok('Pick a team opens the Teams tab (no pop-up is built)',/function openPick\(\)\{[^\n]*setTab\('teams'\)/.test(room)&&!/el\.id='pickov'/.test(room));
 ok('Teams sort starts on Power Ranking every visit',/mode:'kenpom'\/\*/.test(room));
 ok('human auto-pick freezes only on a real store stall (health timer wraps Store.fetchT)',/const f0=Store\.fetchT;Store\.fetchT=function/.test(room));
 console.log(bad?bad+' failed':n+' passed, 0 failed');process.exit(bad?1:0)})();
