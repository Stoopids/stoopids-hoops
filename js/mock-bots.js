/* s26mo4: MOCK-ONLY bot personalities. Used only by js/mock.js for bots in a mock draft created on this device; real leagues never call this.
   Paul: edit the PERSONALITIES table below (label, how far it may reach, how strongly it leans). Picks are always inside a guard window:
   the top N available teams by consensus (power rank), N = win[0] + win[1]*(round-1), capped at WIN_MAX. Weight = exp(-position/temp) * lean.
   Randomness is seeded by the mock id + bot + pick number, so a mock replays identically. */
(function(root){
const POWER=['SEC','Big Ten','Big 12','ACC'],P5=POWER.concat(['Big East']),WIN_MAX=14;
/* NBA teams use East/West, not NCAA conferences. bigconf leans on the conference with more top-10 power-rank teams; upside boosts teams outside the top 10; value compares last-season win rank (or NET) to power rank. */
function isNba(meta){const cs=[...new Set(Object.keys(meta||{}).map(t=>((meta[t]||{}).c||'')).filter(Boolean))];return cs.length>0&&cs.every(c=>c==='East'||c==='West')}
function powerConfs(meta){if(!isNba(meta))return POWER;const ids=Object.keys(meta).filter(t=>meta[t]&&(+meta[t].o>0||+meta[t].p>0));
  const top=ids.slice().sort((a,b)=>(+meta[a].o||+meta[a].p||99)-(+meta[b].o||+meta[b].p||99)).slice(0,10);
  const n={};top.forEach(t=>{const c=meta[t].c;if(c)n[c]=(n[c]||0)+1});
  const best=Object.keys(n).sort((a,b)=>n[b]-n[a]||a.localeCompare(b))[0];return best?[best]:['West']}
/* sh6f (Paul): NBA practice-bot strategies, dealt at random per mock draft (distinct per bot), each with a little random noise.
   score = lower is better; noise = up to NOISE score units; o = Power Ranking (BPI), sp = Stoopids projected points, wr = last-season win rank, pp = P(make playoffs). */
const NOISE=2.5;
const PERSONALITIES=[
 {key:'power',    label:'Power'},            /* best BPI left */
 {key:'points',   label:'Points'},           /* best Stoopids projected points (league scoring) */
 {key:'proven',   label:'Proven'},           /* best last-season record */
 {key:'divspread',label:'Division spread'},  /* divisions it does not own yet first, then BPI */
 {key:'upside',   label:'Upside'},           /* leans to BPI ranks ~11-20 that still have a playoff chance */
 {key:'confstack',label:'Conference stack'}  /* leans East or West (seeded per bot) */
];
const BY={};PERSONALITIES.forEach(p=>BY[p.key]=p);
let NET=null;/* tid -> NET rank (data/net.json), loaded by mock.js on mock rooms only */
function setNet(j){try{const m={};(j.ranks||[]).forEach(r=>{m[String(r.id)]=+r.rank});NET=m}catch(e){}}
function hash32(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* deal personalities to the bots of one mock: all six once (shuffled), extra bots get a random one */
function deal(mockId,mids){const r=mul(hash32('deal:'+mockId));const k=PERSONALITIES.map(p=>p.key);for(let i=k.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[k[i],k[j]]=[k[j],k[i]]}
  const o={};mids.forEach((m,i)=>{o[m]=i<k.length?k[i]:k[Math.floor(r()*k.length)]});return o}
function forBot(mockId,mid,dealt){const k=dealt&&dealt[mid];if(k&&BY[k])return k;return PERSONALITIES[hash32('pers:'+mockId+':'+mid)%PERSONALITIES.length].key}
/* s26c14 (Paul 'more variety'): consensus = blended rank wo*o (KenPom) + (1-wo)*p (STOOPID rank), wo per personality (0.3-0.7); no p -> behind every ranked team (p = maxP + o).
   wo omitted -> the old p order (power rank first, unranked after, stable by id). */
const BCACHE=new WeakMap();
function blendRank(meta,wo){let c=BCACHE.get(meta);if(!c){c={};BCACHE.set(meta,c)}if(c[wo])return c[wo];const ids=Object.keys(meta).filter(t=>meta[t]&&typeof meta[t]==='object');const maxP=ids.reduce((a,t)=>Math.max(a,+meta[t].p>0?+meta[t].p:0),0);
  const O=t=>+meta[t].o>0?+meta[t].o:(+meta[t].p>0?366+(+meta[t].p):999);const sc={};ids.forEach(t=>{const p=+meta[t].p>0?+meta[t].p:maxP+O(t);sc[t]=wo*O(t)+(1-wo)*p});
  const r={};ids.slice().sort((a,b)=>(+meta[b].p>0)-(+meta[a].p>0)||sc[a]-sc[b]||O(a)-O(b)||(a<b?-1:1)).forEach((t,i)=>{r[t]=i+1});return c[wo]=r}
function consensus(avail,meta,wo){if(wo!=null){const r=blendRank(meta,+wo);return avail.slice().sort((a,b)=>(r[a]||1e9)-(r[b]||1e9)||(a<b?-1:a>b?1:0))}const p=t=>+((meta[t]||{}).p)||0;return avail.slice().sort((a,b)=>{const x=p(a),y=p(b);if(x&&y)return x-y;if(x)return-1;if(y)return 1;return a<b?-1:a>b?1:0})}
let ERANK=null;function eRank(meta){if(!ERANK){ERANK={};Object.keys(meta).filter(t=>meta[t].e!=null).sort((a,b)=>meta[b].e-meta[a].e).forEach((t,i)=>ERANK[t]=i+1)}return ERANK}
function homerConf(mockId,mid,meta){const c=[...new Set(Object.keys(meta).filter(t=>+meta[t].p>0&&+meta[t].p<=60).map(t=>meta[t].c))].sort();return c[hash32('homer:'+mockId+':'+mid)%c.length]}
/* o: {key, avail, meta, round, mine:[tid], rng, mockId, mid} -> {tid, pos, n} */
function stackConf(mockId,mid){return hash32('stack:'+mockId+':'+mid)%2?'East':'West'}
function score(key,t,meta,mine,o){const m=meta[t]||{};const O=+m.o||+m.p||31;
  if(key==='points')return m.sp!=null?-(+m.sp)/2:O;                       /* ~2 points ≈ 1 rank */
  if(key==='proven')return +m.wr||O;
  if(key==='divspread'){const own=new Set((mine||[]).map(x=>(meta[x]||{}).d).filter(Boolean));return(m.d&&own.has(m.d)?12:0)+O}
  if(key==='upside'){const pp=m.pp!=null?+m.pp:(O<=20?0.5:0.1);return(O<=10?O+8:O<=20?O-4:O+4)-4*pp}
  if(key==='confstack')return O+(m.c&&m.c!==stackConf(o.mockId,o.mid)?6:0);
  return O}
function choose(o){const meta=o.meta||{};const key=BY[o.key]?o.key:'power';const av=(o.avail||[]).slice().sort();if(!av.length)return null;const rng=o.rng||Math.random;
  const sc=av.map(t=>({t,s:score(key,t,meta,o.mine,o)+rng()*NOISE}));sc.sort((a,b)=>a.s-b.s||(a.t<b.t?-1:1));
  const base=av.slice().sort((a,b)=>(+((meta[a]||{}).o)||99)-(+((meta[b]||{}).o)||99));return{tid:sc[0].t,pos:base.indexOf(sc[0].t),n:av.length,key}}
const api={PERSONALITIES,BY,deal,forBot,choose,consensus,blendRank,setNet,hash32,mul,label:k=>(BY[k]||{}).label||'',homerConf,stackConf,score,NOISE,_net:()=>NET,isNba,powerConfs};
root.FBNBots=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
