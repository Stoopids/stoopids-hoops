/* The ONLY module that talks to the shared store. Same host as the NCAA app (textdb.dev),
   but every key is NBA-only: F.KEY_PREFIX shoops1- (never fbn1-). No API keys.
   Tests must set localStorage shoops.store to a same-origin path (e.g. /api/data/) and run
   tools/mock_textdb.js so nothing is written to textdb.dev. */
(function(){
const DEFAULT_BASE='https://textdb.dev/api/data/';
const STORE_CONFIG={
  NAMESPACE:'shoops1',
  DEFAULT_BASE:DEFAULT_BASE,
  REMOTE_BASE:DEFAULT_BASE,
  USE_LOCAL_FALLBACK:false,
  LS_PREFIX:'shoops.kv.'
};
window.STORE_CONFIG=STORE_CONFIG;
const isLocalHost=()=>{try{return location.hostname==='localhost'||location.hostname==='127.0.0.1'}catch(e){return true}};
/* Test hook, honoured ONLY on localhost / 127.0.0.1 and only as a same-origin path (e.g. /api/data/).
   Never read fbn.store — that key belongs to the NCAA app. */
let override=null;try{const o=localStorage.getItem('shoops.store');if(o&&/^\/[A-Za-z0-9/_.-]*$/.test(o)&&isLocalHost())override=location.origin+o}catch(e){}
const remoteBase=override||STORE_CONFIG.REMOTE_BASE||DEFAULT_BASE||null;
const useLocal=!remoteBase;
const LS=STORE_CONFIG.LS_PREFIX;
function lsGet(key){try{const v=localStorage.getItem(LS+key);return v==null?'':v}catch(e){return ''}}
function lsSet(key,text){try{if(text==='')localStorage.removeItem(LS+key);else localStorage.setItem(LS+key,text);return text}catch(e){throw new Error('HTTP 500')}}
const remote={
  async fetchT(url,opt,ms){const ac=new AbortController();const to=setTimeout(()=>ac.abort(),ms);try{const r=await fetch(url,Object.assign({},opt,{signal:ac.signal}));if(!r.ok)throw new Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(to)}},
  url(key){return remoteBase+encodeURIComponent(key)},
  get(key,ms){return this.fetchT(this.url(key),{cache:'no-store'},ms||8000)},
  set(key,obj,ms){return this.fetchT(this.url(key),{method:'POST',headers:{'Content-Type':'text/plain'},body:typeof obj==='string'?obj:JSON.stringify(obj)},ms||10000)},
};
const local={
  async get(key){return lsGet(key)},
  async set(key,obj){const t=typeof obj==='string'?obj:JSON.stringify(obj);return lsSet(key,t)},
};
const backend=useLocal?local:remote;
const Store={base:useLocal?'localStorage://shoops':remoteBase,real:!override,config:STORE_CONFIG,
  fetchT:remote.fetchT.bind(remote),
  url(key){return useLocal?('local:'+key):remote.url(key)},
  get(key,ms){return backend.get(key,ms)},
  set(key,obj,ms){return backend.set(key,obj,ms)},
  blank(key){return this.set(key,'')}};
/* ---- Pick-slot resilience (same rules as the NCAA app). Applies ONLY to pick-slot keys (<id>-e<epoch>-p<n>). ---- */
const PICKRE=/-e\d+-p(\d+)$/,ALTS=[1,2,3],BADMS=20000,ALTGAP=12000;
const rawGet=Store.get.bind(Store),rawSet=Store.set.bind(Store);Store.rawGet=rawGet;Store.rawSet=rawSet;
Store.delays=[350,800];
const okEntry=t=>{try{let d=JSON.parse(t);if(typeof d==='string')d=JSON.parse(d);return!!(d&&typeof d==='object'&&typeof d.id==='string'&&+d.n>0&&typeof d.owner==='string'&&d.tid!=null)}catch(e){return false}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const transient=e=>{const m=/^HTTP (\d+)/.exec((e&&e.message)||'');return m?(+m[1]>=500||+m[1]===429||+m[1]===408):true};
const PS={};const ps=k=>PS[k]||(PS[k]={badR:0,badW:0,src:0,state:'ok',at:0,n:0});
function note(key,state){const q=ps(key);const m=PICKRE.exec(key);q.n=m?+m[1]:0;const was=q.state;q.state=state;q.at=Date.now();if(state==='fail'&&was!=='fail')q.since=Date.now();if(was!==state)fire(key,state,was)}
function fire(key,state,was){try{window.dispatchEvent(new CustomEvent('shoops:pickstate',{detail:{key,state,was,n:ps(key).n,src:ps(key).src}}))}catch(e){}}
async function tries(fn,n){let err;const d=Store.delays;for(let i=0;i<n;i++){try{return await fn()}catch(e){err=e;if(!transient(e)||i===n-1)break;await wait(d[Math.min(i,d.length-1)])}}throw err}
Store.isPickKey=k=>PICKRE.test(String(k));
Store.altKey=(k,a)=>k+'-a'+a;
Store.stuck=function(){const now=Date.now();return Object.keys(PS).map(k=>({key:k,n:PS[k].n,state:PS[k].state,since:PS[k].since,at:PS[k].at})).filter(x=>x.state==='fail'&&now-x.at<45000).sort((a,b)=>a.n-b.n)};
Store.pickInfo=k=>PS[k]?Object.assign({},PS[k]):null;
Store.retryNow=function(){Object.keys(PS).forEach(k=>{PS[k].badR=0;PS[k].badW=0})};
Store.get=async function(key,ms,o){if(!PICKRE.test(String(key)))return rawGet(key,ms);o=o||{};const q=ps(key);let origErr=null,junk='';
  if(q.badR>Date.now())origErr=q.err||new Error('HTTP 500');
  else{try{const v=await tries(()=>rawGet(key,ms),q.badR?1:3);q.badR=0;if(v){if(okEntry(v)){q.src=0;note(key,'ok');return v}junk=v}}
    catch(e){if(!transient(e))throw e;origErr=e;q.err=e;q.badR=Date.now()+BADMS}}
  if(!origErr&&!o.write&&q.src===0&&q.altAt&&Date.now()-q.altAt<ALTGAP){note(key,'ok');return junk}
  q.altAt=Date.now();
  const rd=async a=>{try{return{a,v:await rawGet(Store.altKey(key,a),ms)}}catch(e){return{a,err:e}}};
  let rs=await Promise.all((origErr?ALTS:[1]).map(rd));
  if(!origErr&&rs[0].err)rs=rs.concat(await Promise.all(ALTS.slice(1).map(rd)));
  const hit=rs.filter(r=>r.v&&okEntry(r.v)).sort((x,y)=>x.a-y.a)[0];
  if(hit){q.src=hit.a;note(key,'ok');return hit.v}
  if(!origErr){q.src=0;note(key,'ok');return junk}
  if(o.write&&rs.some(r=>r.v===''&&!r.err)){q.src=0;note(key,'fail');return''}
  note(key,'fail');const e=new Error(origErr.message||'HTTP 500');e.stuck=true;throw e};
Store.set=async function(key,obj,ms){if(!PICKRE.test(String(key)))return rawSet(key,obj,ms);const q=ps(key);const now=Date.now();
  const useAlt=q.src>0||q.badR>now||q.badW>now;let origErr=null;
  if(!useAlt){let r;try{r=await tries(()=>rawSet(key,obj,ms),3)}catch(e){if(!transient(e))throw e;origErr=e;q.badW=Date.now()+BADMS}
    if(!origErr){let rbErr=null;try{await rawGet(key,ms)}catch(e){if(/^HTTP 5\d\d/.test((e&&e.message)||''))rbErr=e}
      if(!rbErr){note(key,'ok');return r}
      q.badR=Date.now()+BADMS;q.err=rbErr;origErr=rbErr}}
  const order=q.src>0?[q.src].concat(ALTS.filter(a=>a!==q.src)):ALTS;let last=origErr;
  for(const a of order){try{const r=await tries(()=>rawSet(Store.altKey(key,a),obj,ms),3);q.src=a;note(key,'ok');fire(key,'alt',q.state);return r}catch(e){last=e;if(!transient(e))throw e}}
  note(key,'fail');throw last};
window.Store=Store;
})();
