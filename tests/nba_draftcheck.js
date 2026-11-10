/* sh6c: read a draft's picks from inside the room page (the app's own Store + FBN), and check them:
   every slot filled, right owner for snake/straight order, no duplicate team, and every HUMAN auto-pick = top queued team still available, else best Power Ranking (BPI, meta.o) still available. */
async function readDraft(page){return page.evaluate(async()=>{const F=window.FBN;const lid=new URLSearchParams(location.search).get('l');const K=F.Keys(lid);
  const meta=F.parseJ(await Store.get(K.meta));if(!meta)return{err:'no meta'};const N=(meta.order||[]).length,R=meta.settings.rounds,tot=N*R;
  const picks=[];for(let n=1;n<=tot;n++){let e=null;try{e=F.parseEntry(await Store.get(K.pick(meta.epoch,n)))}catch(x){}picks.push(e)}
  const prefs={};for(const mid of meta.order){try{prefs[mid]=F.parseJ(await Store.get(K.pref(mid)))||{}}catch(x){prefs[mid]={}}}
  const MT=(window.TEAMS_DATA||{}).meta||{};const o={};Object.keys(MT).forEach(t=>o[t]=+MT[t].o||0);
  const bots={};const ov=(meta.over||{});Object.keys(ov).forEach(m=>{if(ov[m]&&ov[m].bot)bots[m]=1});
  return{lid,prefs,status:meta.status,type:meta.settings.type,orderMode:meta.settings.orderMode,N,R,tot,order:meta.order,picks,o,bots,voided:meta.voided||[]}})}
/* qlog: {n: [queued tids at the time]} recorded by the test for human turns; humans: set of human mids */
function check(d,humans,qlog){const out={errs:[],human:[]};if(d.err){out.errs.push(d.err);return out}
  const F=require('../js/core.js');const seen={};
  d.picks.forEach((e,i)=>{const n=i+1;if(!e){out.errs.push('missing pick #'+n);return}
    const s=F.slotAt(d.order,n,d.type,d.R);if(!s||s.owner!==e.owner)out.errs.push('pick #'+n+' owner '+e.owner+' expected '+(s&&s.owner));
    if(seen[e.tid])out.errs.push('duplicate team '+e.tid+' at #'+n+' and #'+seen[e.tid]);seen[e.tid]=n});
  d.picks.forEach((e,i)=>{if(!e||!humans.has(e.owner))return;const n=i+1;const taken=new Set(d.picks.slice(0,i).filter(Boolean).map(p=>p.tid));
    const q=((qlog&&qlog[n])||[]).filter(t=>!taken.has(String(t)));const best=Object.keys(d.o).filter(t=>d.o[t]>0&&!taken.has(t)).sort((a,b)=>d.o[a]-d.o[b])[0];
    const exp=q.length?String(q[0]):best;const rec={n,by:e.by,tid:e.tid,expected:e.by==='auto'?exp:null,why:q.length?'queue':'bpi',bpi:d.o[e.tid]};
    if(e.by==='auto'&&e.tid!==exp)out.errs.push('human auto-pick #'+n+' took '+e.tid+' (BPI #'+d.o[e.tid]+') expected '+exp+' ('+rec.why+', BPI #'+d.o[exp]+')');out.human.push(rec)});
  return out}
module.exports={readDraft,check};
