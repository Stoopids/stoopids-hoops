const L=require('./lib.js');const F=require('../js/core.js');const {sleep}=L;const API=L.API;const SD=process.env.SHOTDIR||'/tmp';const OLD=process.env.OLD||'';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(c)console.log('  ok  '+m);else{bad++;console.log('FAIL  '+m+(x!==undefined?'  -> '+JSON.stringify(x).slice(0,500):''))}};
const post=(k,v)=>fetch(API+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(v)});const gj=async k=>F.parseJ(await (await fetch(API+encodeURIComponent(k))).text());
async function lobby(o){o=o||{};const id=F.makeLeagueId();const K=F.Keys(id);const s0={name:'Start CD test',mgrName:'A',teamName:'A',managers:8,rounds:2,type:'snake',startAt:null,startMode:'manual',orderMode:'manual',clockSecs:o.clock===undefined?30:o.clock,autoPick:true};
  const meta=F.defaultMeta(id,s0,null);const cm=F.newSecret();meta.pass=await F.makePass(cm);const ms=[];
  for(let i=1;i<=8;i++){const mid=F.hexId(12),k=F.newSecret();ms.push({id:mid,k});await post(K.slot(i,0),F.makeClaim({mid,i,name:'M'+i,team:'T'+i,sh:await F.mgrHash(mid,k)}));await post(K.mgr(mid),F.makeProfile({mid,name:'M'+i,team:'T'+i}))}
  meta.cm=ms[0].id;meta.order=ms.map(x=>x.id);meta.orderSet=true;if(o.away1)meta.over[ms[0].id]={away:true};await post(K.meta,meta);return{id,K,cm,ms}}
async function ph2(name,w,sk){const P=await L.phone(name,w>700?{desktop:true,w,h:900}:{w,h:844});await P.page.setBypassServiceWorker(true);await P.page.setRequestInterception(true);
 P.page.on('request',r=>{if(sk!=null&&r.method()==='HEAD'&&/room\.html/.test(r.url()))return r.respond({status:200,headers:{date:new Date(Date.now()+sk).toUTCString()},body:''});if(/textdb\.dev/.test(r.url()))return r.abort();r.continue()});
 await P.page.evaluateOnNewDocument(()=>{window.__b=[];const A=window.AudioContext||window.webkitAudioContext;if(A){const o=A.prototype.createOscillator;A.prototype.createOscillator=function(){const x=o.call(this);const s=x.start.bind(x);x.start=(...a)=>{const c=document.getElementById('cdv');window.__b.push([Date.now(),c?c.textContent.slice(0,5):'']);return s(...a)};return x}}});return P}

/* s28g: seat 1's page gets a Date header SKEW ahead of real time (its server time is ahead of the commissioner who stamps the start); no seeded timestamps.
   Commissioner page: Start, confirm, Start now. Seat 1 (present human, not picking) must get the 3 turn-start beeps and the countdown beeps, a clock that counts down,
   and no auto-pick sooner than the full 30 s clock. Cases +3h, +90s, 0, -3h (env SKEWS, seconds). Mock store only. APP/API env. */
const CLK=30;
async function one(SK){const tag='skew '+(SK/1000)+'s:';const {id,K,cm,ms}=await lobby({clock:CLK});
 const C=await ph2('cm'+SK,390,null);await C.go('room.html?l='+id+'&stay=1#cm='+cm);
 const S=await ph2('seat1'+SK,1280,SK);await S.go('room.html?l='+id+'&stay=1#as='+ms[0].id+'&k='+ms[0].k);await sleep(5000);
 await C.page.evaluate(()=>document.querySelector('#startbtn').click());await sleep(700);await C.page.evaluate(()=>document.querySelector('#cfyes').click());await sleep(3000);
 await C.page.evaluate(()=>{location.hash='#tab=board'});await sleep(500);await C.page.evaluate(()=>document.getElementById('startnow').click());const tClick=Date.now();
 let e=null,at=0;const cds=[];for(let t=0;t<60&&!e;t++){await sleep(1000);const mm=await gj(K.meta);const x=await gj(K.pick(mm.epoch||1,1));cds.push(await S.page.evaluate(()=>(document.getElementById('cdv')||{}).textContent||'').catch(()=>'?'));if(x&&x.tid){e=x;at=Date.now()}}
 const b=await S.page.evaluate(()=>window.__b);const secs=cds.map(c=>{const m=/(\d+):(\d\d)/.exec(c);return m?+m[1]*60+ +m[2]:null}).filter(x=>x!=null);
 console.log('   info '+tag+' pick1 '+(e?e.by+' at '+((at-tClick)/1000).toFixed(1)+' s':'none')+'; beeps '+b.length+'; cdv '+cds.slice(0,32).join(' '));
 ok(tag+' pick 1 made (clock-out auto-pick)',!!e&&e.by==='auto',e);ok(tag+' no auto-pick sooner than the full clock (>= 29 s after Start now)',!!e&&at-tClick>=29000,(at-tClick)/1000);
 ok(tag+' 3 turn-start beeps + countdown beeps (>= 10)',b.length>=10,b.map(x=>x[1]));ok(tag+' 3 turn-start beeps before 0:20 and beeps in the last 10 s',b.filter(x=>!/0:[01]\d/.test(x[1])).length>=3&&b.some(x=>/0:0\d/.test(x[1])),b.map(x=>x[1]));
 ok(tag+' clock never above 0:30 and counts down below 0:10',secs.length>10&&Math.max(...secs)<=CLK&&Math.min(...secs)<=9,cds);
 for(const P of [C,S]){ok(tag+' '+P.name+' no page errors',!P.errs.length,P.errs);await P.close()}}
(async()=>{try{const sk=(process.env.SKEWS||'10800,90,0,-10800').split(',').map(x=>+x*1000);await Promise.all(sk.map(one))}catch(err){bad++;console.log('FAIL exception',err&&err.stack)}finally{await L.close();console.log(bad?`${bad} of ${n} FAILED`:`ALL ${n} PASSED`);process.exit(bad?1:0)}})();
