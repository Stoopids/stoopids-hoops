/* Lobby League settings: commish may switch 5 <-> 6 managers before the draft starts.
   Rounds auto-fill the 30-team pool when the count changes (6 mgr x 5, or 5 mgr x 6).
   After the count is saved, 5 managers may also choose 5 teams each (25 picks).
   node tests/test_nba_settings.js */
const fs=require('fs'),path=require('path');
const F=require('../js/core.js');
let n=0,bad=0;
function ok(name,c,x){n++;if(c)console.log('  ok  '+name);else{bad++;console.log('FAIL  '+name,x!==undefined?String(x).slice(0,500):'')}}

function meta6(){return F.defaultMeta('TESTSETTINGS0001',{name:'TEST settings switch',managers:6,rounds:5,type:'snake',startAt:null,startMode:'manual',orderMode:'manual',clockSecs:0,autoPick:true,warn15:true},'aaaa')}
const two=[{mid:'aaaa',i:1,gen:0,name:'A',team:'TA'},{mid:'bbbb',i:2,gen:0,name:'B',team:'TB'}];
const twoMids=two.map(x=>x.mid);

ok('maxRounds / roundsFor for 30 teams: 5 mgr -> 6, 6 mgr -> 5',F.maxRounds(5,30)===6&&F.roundsFor(5)===6&&F.maxRounds(6,30)===5&&F.roundsFor(6)===5);

const rFill=F.mSettings(meta6(),{managers:5},two,30,1e12);
ok('6->5 with 2 joined saves (no error)',rFill.state&&!rFill.error,rFill.error);
ok('6->5 with no Teams each in the patch auto-fills to 6 (fills the 30-team pool)',rFill.state&&rFill.state.settings.managers===5&&rFill.state.settings.rounds===6,rFill.state&&rFill.state.settings);
const r5=F.mSettings(meta6(),{managers:5,rounds:5},two,30,1e12);
ok('6->5 together with Teams each 5 keeps 5 (25 picks), because 5 is valid for 5 managers',r5.state&&r5.state.settings.managers===5&&r5.state.settings.rounds===5,r5.state&&r5.state.settings);
const rBoth=F.mSettings(meta6(),{managers:5,rounds:6},two,30,1e12);
ok('6->5 together with Teams each 6 keeps 6 (30 picks)',rBoth.state&&rBoth.state.settings.managers===5&&rBoth.state.settings.rounds===6,rBoth.state&&rBoth.state.settings);
/* rest of lobbyOrder checks use rFill (auto 6 teams each) */
const r5fill=rFill;
const lo5=F.lobbyOrder(rFill.state,twoMids);
ok('lobbyOrder after 6->5 is exactly 5 rows (2 joined + 3 empty)',lo5.length===5&&lo5[0]==='aaaa'&&lo5[1]==='bbbb'&&lo5.slice(2).join()==='e1,e2,e3',lo5);
ok('joinedList still sees both humans (2 of 5)',F.joinedList(rFill.state,{1:two[0],2:two[1]}).length===2);

const back=F.mSettings(rFill.state,{managers:6,rounds:6},two,30,1e12);
ok('5->6 in the lobby works and auto-fills Teams each to 5',back.state&&back.state.settings.managers===6&&back.state.settings.rounds===5,back.error||(back.state&&back.state.settings));
const lo6=F.lobbyOrder(back.state,twoMids);
ok('lobbyOrder after 5->6 is exactly 6 rows (2 joined + 4 empty)',lo6.length===6&&lo6.slice(2).join()==='e1,e2,e3,e4',lo6);

const keep=F.mSettings(r5.state,{managers:5,rounds:5},two,30,1e12);
ok('once already at 5 managers, Teams each can be set to 5 (25 picks)',keep.state&&keep.state.settings.managers===5&&keep.state.settings.rounds===5,keep.error||(keep.state&&keep.state.settings));
const v=F.validateSettings(Object.assign({name:'TEST'},keep.state.settings),{poolSize:30,now:1e12});
ok('5 managers x 5 rounds is valid for a 30-team pool',!v.errors.rounds&&!v.errors.managers,v.errors);

const six=[{mid:'aaaa',i:1},{mid:'bbbb',i:2},{mid:'cccc',i:3},{mid:'dddd',i:4},{mid:'eeee',i:5},{mid:'ffff',i:6}];
const shrinkFull=F.mSettings(meta6(),{managers:5},six,30,1e12);
ok('cannot shrink below the number already joined',!!shrinkFull.error&&/join/i.test(shrinkFull.error),shrinkFull.error||shrinkFull.state&&shrinkFull.state.settings);

const room=fs.readFileSync(path.join(__dirname,'../js/room.js'),'utf8');
ok('League settings sheet has a Managers select of 5 and 6',/id="s_mgrs"/.test(room)&&/o\(\[5,6\],s\.managers\)/.test(room));
ok('League settings sheet has a Teams each select',/id="s_rounds"/.test(room));
ok('Teams each options update when Managers changes in the sheet',/function updateRoundsOptions/.test(room)&&/addEventListener\('change',updateRoundsOptions\)/.test(room));

const phMap={e1:'p1',e2:'p2',e3:'p3'};
const all=twoMids.concat(Object.values(phMap));
const st=F.mStart(rFill.state,all,1e12,'seed',30,{phMap,fixed:true});
ok('start after 6->5 is a 5-seat live draft with 3 placeholders',st.state&&st.state.status==='live'&&st.state.order.length===5&&st.state.settings.managers===5&&st.state.settings.rounds===6,st.error||(st.state&&{status:st.state.status,order:st.state.order,s:st.state.settings}));
ok('snake order is the two humans then the three placeholders',st.state&&st.state.order.join()==='aaaa,bbbb,p1,p2,p3',st.state&&st.state.order);
const owners=[];
for(let i=1;i<=30;i++){const sl=F.slotAt(st.state.order,i,'snake',6);owners.push(sl.owner)}
ok('30 snake picks: rounds 1,3,5 go aaaa..p3; rounds 2,4,6 reverse',owners.slice(0,5).join()==='aaaa,bbbb,p1,p2,p3'&&owners.slice(5,10).join()==='p3,p2,p1,bbbb,aaaa'&&owners.slice(10,15).join()==='aaaa,bbbb,p1,p2,p3',owners.join('|'));

console.log('\n'+(n-bad)+'/'+n+' passed');
process.exit(bad?1:0);
