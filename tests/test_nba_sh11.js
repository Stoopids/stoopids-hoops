/* sh11: lobby Managers list must not duplicate empty seats as leftover "Open spot" rows.
   Starting with 2 of 6 joined fills 4 placeholders and keeps a 6-seat draft. */
const fs=require('fs'),path=require('path');
const F=require('../js/core.js');
let n=0,bad=0;
function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name,x!==undefined?String(x).slice(0,400):'')}}

const room=fs.readFileSync(path.join(__dirname,'../js/room.js'),'utf8');
ok('lobbyView no longer appends leftover Open spot rows',!/for\s*\(\s*let i=j\.length;i<N;i\+\+\).*mrow open/.test(room)&&!/class="mrow open"/.test(room)&&!/>Open spot</.test(room));
ok('lobbyView still renders the order list inside the Managers card',/id="mgrs"/.test(room)&&/orderListHTML\(true\)/.test(room)&&/id="joinedct"/.test(room));

const meta=F.defaultMeta('TESTSH11LOBBY01',{name:'TEST sh11 lobby',managers:6,rounds:5,type:'snake',startAt:null,startMode:'manual',orderMode:'manual',clockSecs:0,autoPick:true,warn15:true},'aaaa');
const joined=['aaaa','bbbb'];
const lo=F.lobbyOrder(meta,joined);
ok('lobbyOrder for 2 of 6 is exactly 6 rows (2 joined + e1..e4)',lo.length===6&&lo[0]==='aaaa'&&lo[1]==='bbbb'&&lo.slice(2).join()==='e1,e2,e3,e4',lo);
ok('isEmptyId only on the four empty rows',lo.filter(F.isEmptyId).length===4);

const phMap={e1:'p1',e2:'p2',e3:'p3',e4:'p4'};
const all=joined.concat(Object.values(phMap));
const r=F.mStart(meta,all,1e12,'seed',30,{phMap,fixed:true});
ok('mStart with 2 joined + 4 placeholders is live with a 6-seat order',r.state&&r.state.status==='live'&&r.state.order.length===6&&r.state.settings.managers===6&&r.state.settings.rounds===5,r.error||JSON.stringify(r.state&&{status:r.state.status,order:r.state.order,mgrs:r.state.settings.managers}));
ok('start order is the two humans then the four placeholders, no extras',r.state&&r.state.order.join()==='aaaa,bbbb,p1,p2,p3,p4',r.state&&r.state.order);
ok('exactly four seats marked placeholder',r.state&&Object.keys(r.state.over).filter(k=>r.state.over[k]&&r.state.over[k].ph).length===4);

console.log('\n'+(n-bad)+'/'+n+' passed');
process.exit(bad?1:0);
