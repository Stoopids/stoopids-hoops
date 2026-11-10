/* s28j item 11: placeRanks / placeLabel (js/leaguehome.js) = STOOPIDS score.py 388-393 + index.html rankTxt. node tests/unit_place_s28j.js */
const fs=require('fs');const src=fs.readFileSync(__dirname+'/../js/leaguehome.js','utf8');
const f=src.slice(src.indexOf('function placeRanks('),src.indexOf('window.LPLACE='));const {placeRanks,placeLabel}=new Function(f+';return{placeRanks,placeLabel}')();
let n=0,bad=0;const ok=(t,c,x)=>{n++;if(c)console.log('  ok  '+t);else{bad++;console.log('FAIL  '+t+'  -> '+JSON.stringify(x))}};
const mk=a=>a.map((t,i)=>({mid:'m'+(i+1),total:t}));const run=a=>placeRanks(mk(a),o=>o.total);const lab=r=>r.map(placeLabel);
let r=run([0,0,0,0,0,0,0,0]);ok('all 0: T-1 for all 8',lab(r).every(x=>x==='T-1'),lab(r));ok('all 0: config order kept',r.map(o=>o.mid).join()==='m1,m2,m3,m4,m5,m6,m7,m8',r.map(o=>o.mid));
r=run([10,10,5]);ok('[10,10,5] -> T-1,T-1,3',lab(r).join()==='T-1,T-1,3',lab(r));
r=run([5,10,10]);ok('[5,10,10] -> m2,m3 T-1 (config order), m1 3',r.map(o=>o.mid+':'+placeLabel(o)).join()==='m2:T-1,m3:T-1,m1:3',r.map(o=>o.mid+':'+placeLabel(o)));
r=run([1,2,3,4,5,6,7,8]);ok('no ties -> 1..8',lab(r).join()==='1,2,3,4,5,6,7,8'&&r[0].mid==='m8',lab(r));
r=run([9,7,7,7,3,3,1,0]);ok('competition ranking 1,T-2,T-2,T-2,T-5,T-5,7,8',lab(r).join()==='1,T-2,T-2,T-2,T-5,T-5,7,8',lab(r));
const inp=mk([1,2]);placeRanks(inp,o=>o.total);ok('pure: input untouched',inp[0].rank===undefined&&inp[0].mid==='m1');
console.log(`\n${n-bad} / ${n} checks passed${bad?' — FAILED':''}`);process.exit(bad?1:0);
