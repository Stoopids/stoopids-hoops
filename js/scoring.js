/* Scoring for Stoopids Hoops (NBA). Pure functions, no DOM, no network: loaded as FBNScore and in Node via require().
   Paul's rules (all bonuses stack — flagged assumptions below):
     1 pt per regular-season win
     2 pt playoff entry (official seeds 1-8 after play-in; play-in losers get 0)
     2 pts per playoff win
     4 pts NBA champion
     2 pts NBA Cup final 4
     1 pt per Cup win in final rounds (QF / SF / Final)
     2 pts Cup champion
   Assumptions (flag in the UI; confirm with Paul if needed):
     - Cup final-4, cup-win, and cup-champion points stack with each other.
     - NBA champion +4 stacks with playoff-entry and playoff-win points.
     - Play-in winners who become official 7/8 seeds get the entry bonus; play-in losers get 0.
     - Play-in games themselves award no regular-season and no playoff-win points.
     - Cup group-play wins count only as regular-season wins (1 pt).
     - Cup knockout games also count as regular-season wins, so a knockout win is 1 RS + 1 cup-win.
   Inputs: games (data/scores.json -> games[]), owners {teamId: managerId}, managers [{mid,name,...}],
           field (data/tournament.json -> field of official seeds; seed_lock true after play-in). */
(function(root){
'use strict';
const S={};
S.ROUNDS=['First Round','Conference Semifinals','Conference Finals','NBA Finals'];
S.CUP_ROUNDS=['Cup Quarterfinals','Cup Semifinals','Cup Championship'];
S.POINTS={
  rs_win:1,
  playoff_entry:2,
  playoff_win:2,
  nba_champion:4,
  cup_final4:2,
  cup_knockout_win:1,
  cup_champion:2,
  /* aliases kept so older league-site labels that still read S.POINTS.win / .champ / .final4 / .entry do not explode */
  entry:2, win:2, champ:4, final4:2, playin_win:0, upset:0, missed:0, conf_reg:0, conf_tourn:0
};
S.SEASON_WIN=1;
S.ASSUMPTIONS=[
  'Final-4, cup-win, and cup-champion points stack with each other.',
  'NBA champion +4 stacks with playoff-entry and playoff-win points.',
  'Playoff-entry +2 only for official seeds 1-8, including play-in winners; play-in losers get 0.',
  'Play-in games award no regular-season and no playoff-win points.',
  'Cup group-play wins are regular-season wins only (1 pt).',
  'Cup final rounds = quarterfinals, semifinals, championship.',
  'Cup knockout games also count as regular-season wins, so a knockout win is 1 RS + 1 cup-win.'
];
const num=v=>(typeof v==='number'&&isFinite(v))?v:null;
S.isFinal=g=>g&&g.status==='final'&&g.home&&g.away&&num(g.home.score)!=null&&num(g.away.score)!=null&&g.home.score!==g.away.score;
S.winnerSide=g=>!S.isFinal(g)?null:(g.home.score>g.away.score?g.home:g.away);
S.loserSide=g=>!S.isFinal(g)?null:(g.home.score>g.away.score?g.away:g.home);
S.roundIndex=r=>S.ROUNDS.indexOf(r);
S.ownerMap=function(picks){const m={};(picks||[]).forEach(p=>{m[String(p.tid)]=p.owner});return m};
S.isUpset=function(){return false}; /* no upset bonus in Paul's NBA rules */
S.isRs=g=>g&&(g.kind==='reg'||g.kind==='cup'); /* cup knockout also counts as RS (assumption) */
S.isPlayoff=g=>g&&g.kind==='playoff';
S.isCupKo=g=>g&&g.kind==='cup';
S.isPlayIn=g=>g&&g.kind==='playin';
/* official 1-8 seeds (post play-in). field[tid].seed or games/standings. seed_lock (or field.official) required for entry before any playoff game. */
S.officialSeeds=function(field,games){
  const out={};
  const F=field||{};
  Object.keys(F).forEach(tid=>{const s=F[tid]&&num(F[tid].seed);if(s>=1&&s<=8)out[String(tid)]=s});
  (games||[]).forEach(g=>{if(!S.isPlayoff(g))return;[g.home,g.away].forEach(side=>{if(!side||side.id==null)return;const s=num(side.seed);if(s>=1&&s<=8&&out[String(side.id)]==null)out[String(side.id)]=s})});
  return out};
S.seedLocked=function(field,scores){if(field&&(field.seed_lock===true||field.official===true||field.locked===true))return true;if(scores&&(scores.seed_lock===true||scores.official===true))return true;const n=Object.keys(S.officialSeeds(field,scores&&scores.games)).length;return n>=16}; /* 8 per conference */
S.rank=function(list,keyf){let prev=null,place=0;list.forEach((r,i)=>{const k=JSON.stringify(keyf(r));if(k!==prev){place=i+1;prev=k}r.place=place;r.tied=false});list.forEach(r=>{r.tied=list.filter(x=>x.place===r.place).length>1});return list};
/* ---------- Regular season (reg + cup knockout games) ---------- */
S.fullSeason=function(games,owners,managers){const rows={};managers.forEach(m=>{rows[m.mid]={mid:m.mid,name:m.name,wins:0,losses:0,diff:0,teams:{}}});
  (games||[]).forEach(g=>{if(!S.isRs(g)||!S.isFinal(g))return;const w=S.winnerSide(g),l=S.loserSide(g),d=Math.abs(g.home.score-g.away.score);
    [[w,1],[l,0]].forEach(([side,won])=>{const o=owners[String(side.id)];if(!o||!rows[o])return;const r=rows[o];const t=r.teams[side.id]||(r.teams[side.id]={tid:String(side.id),w:0,l:0,diff:0});
      if(won){r.wins++;t.w++;r.diff+=d;t.diff+=d}else{r.losses++;t.l++;r.diff-=d;t.diff-=d}})});
  const list=Object.values(rows).map(r=>{const gp=r.wins+r.losses;r.pct=gp?r.wins/gp:0;r.gp=gp;r.score=r.wins*S.SEASON_WIN;r.teamList=Object.values(r.teams).sort((a,b)=>b.w-a.w||b.diff-a.diff);return r});
  list.sort((a,b)=>b.wins-a.wins||b.pct-a.pct||b.diff-a.diff||a.name.localeCompare(b.name));return S.rank(list,r=>[r.wins,r.pct,r.diff])};
/* ---------- Playoffs: official seed entry + playoff wins + NBA champion ---------- */
S.playoffs=function(games,field,owners,managers,points,scores){const P=Object.assign({},S.POINTS,points||{});const rows={};managers.forEach(m=>{rows[m.mid]={mid:m.mid,name:m.name,score:0,wins:0,upsets:0,events:[],teams:{}}});
  const seeds=S.officialSeeds(field,games);const locked=S.seedLocked(field,scores)||Object.keys(seeds).length>0;
  const team=(o,tid)=>{const r=rows[o];return r.teams[tid]||(r.teams[tid]={tid:String(tid),pts:0,w:0,upsets:0,rounds:[],entered:false})};
  const add=(o,tid,pts,label,extra)=>{if(!o||!rows[o]||!pts)return;const r=rows[o];r.score+=pts;const t=team(o,tid);t.pts+=pts;r.events.push(Object.assign({tid:String(tid),pts,label},extra||{}))};
  if(locked)Object.keys(seeds).forEach(tid=>{const o=owners[tid];if(!o||!rows[o])return;team(o,tid).entered=true;add(o,tid,P.playoff_entry,'Made the playoffs (seed '+seeds[tid]+')',{kind:'entry',seed:seeds[tid]})});
  const po=(games||[]).filter(S.isPlayoff).filter(S.isFinal).slice().sort((a,b)=>(a.day||'').localeCompare(b.day||'')||S.roundIndex(a.round)-S.roundIndex(b.round));
  po.forEach(g=>{const w=S.winnerSide(g),l=S.loserSide(g),ow=owners[String(w.id)];const rnd=g.round||'';
    if(ow&&rows[ow]){const r=rows[ow];const t=team(ow,w.id);t.rounds.push(rnd);r.wins++;t.w++;add(ow,w.id,P.playoff_win,'Won '+(rnd||'a playoff game'),{kind:'win',round:rnd,vs:l.id})}});
  po.forEach(g=>{if((g.round==='NBA Finals'||g.round==='Finals'||g.round==='NBA Championship')&&S.isFinal(g)){const w=S.winnerSide(g),o=owners[String(w.id)];if(o&&rows[o]&&!rows[o].events.some(e=>e.kind==='champ'&&e.tid===String(w.id)))add(o,w.id,P.nba_champion,'NBA champion',{kind:'champ'})}});
  if(field&&field.champion){const tid=String(field.champion);const o=owners[tid];if(o&&rows[o]&&!rows[o].events.some(e=>e.kind==='champ'&&e.tid===tid))add(o,tid,P.nba_champion,'NBA champion',{kind:'champ'})}
  const list=Object.values(rows).map(r=>{r.teamList=Object.values(r.teams).sort((a,b)=>b.pts-a.pts);return r});
  list.sort((a,b)=>b.score-a.score||b.wins-a.wins||a.name.localeCompare(b.name));
  S.rank(list,r=>[r.score,r.wins]);list.locked=locked;list.missed=[];return list};
/* alias so leftover NCAA call sites (S.tournament) still produce playoff points, not conference-tourney math */
S.tournament=function(games,field,owners,managers,points){return S.playoffs(games,field,owners,managers,points)};
S._finish=function(rows){return Object.values(rows||{})};
S.upsets=function(){return[]};
S.teamTourney=function(tid,games,field){tid=String(tid);const f=(field||{})[tid];let seed=f&&f.seed!=null?f.seed:null;
  const g=(games||[]).filter(x=>S.isPlayoff(x)&&x.home&&x.away&&(String(x.home.id)===tid||String(x.away.id)===tid));
  g.forEach(x=>{const sd=String(x.home.id)===tid?x.home:x.away;if(seed==null&&sd.seed!=null)seed=sd.seed});
  if(!g.length&&!f)return{seed:null,state:'none',round:null};
  const fin=g.filter(S.isFinal).sort((a,b)=>S.roundIndex(a.round)-S.roundIndex(b.round)||(a.day||'').localeCompare(b.day||''));
  const lost=fin.find(x=>String(S.loserSide(x).id)===tid);
  if(lost)return{seed,state:'out',round:lost.round};
  const champ=fin.find(x=> (x.round==='NBA Finals'||x.round==='Finals')&&String(S.winnerSide(x).id)===tid);if(champ)return{seed,state:'champ',round:'NBA Finals'};
  const next=g.filter(x=>!S.isFinal(x)).sort((a,b)=>S.roundIndex(a.round)-S.roundIndex(b.round))[0];
  if(next)return{seed,state:'alive',round:next.round};
  const last=fin[fin.length-1];return{seed,state:seed?'alive':'none',round:last?S.ROUNDS[Math.min(S.roundIndex(last.round)+1,S.ROUNDS.length-1)]:'First Round'}};
/* ---------- NBA Cup knockout (final rounds only) ---------- */
S.cupRound=function(g){const r=(g&&g.round)||'';if(/champ/i.test(r))return'Cup Championship';if(/semi/i.test(r))return'Cup Semifinals';if(/quarter|qf|final 8|final eight/i.test(r))return'Cup Quarterfinals';return r};
S.cupPoints=function(games,field,owners,managers,points){const P=Object.assign({},S.POINTS,points||{});const rows={};managers.forEach(m=>{rows[m.mid]={mid:m.mid,name:m.name,score:0,events:[],teams:{}}});
  const team=(o,tid)=>{const r=rows[o];return r.teams[tid]||(r.teams[tid]={tid:String(tid),pts:0})};
  const add=(o,tid,pts,label,kind)=>{if(!o||!rows[o]||!pts)return;const r=rows[o];if(r.events.some(e=>e.tid===String(tid)&&e.kind===kind&&(kind!=='cup_win'||e.label===label)))return;r.score+=pts;const t=team(o,tid);t.pts+=pts;r.events.push({tid:String(tid),pts,label,kind})};
  const f4=new Set();const cups=(games||[]).filter(S.isCupKo);
  cups.forEach(g=>{const rnd=S.cupRound(g);if(rnd==='Cup Semifinals'||rnd==='Cup Championship')[g.home,g.away].forEach(s=>{if(s&&s.id!=null)f4.add(String(s.id))});
    if(rnd==='Cup Quarterfinals'&&S.isFinal(g))f4.add(String(S.winnerSide(g).id))});
  if(field&&Array.isArray(field.cup_final4))field.cup_final4.forEach(t=>f4.add(String(t)));
  if(field&&field.cup&&Array.isArray(field.cup.final4))field.cup.final4.forEach(t=>f4.add(String(t)));
  f4.forEach(tid=>{const o=owners[tid];if(o)add(o,tid,P.cup_final4,'Reached the NBA Cup Final 4','cup_final4')});
  cups.filter(S.isFinal).forEach(g=>{const w=S.winnerSide(g),ow=owners[String(w.id)];const rnd=S.cupRound(g);
    if(ow)add(ow,w.id,P.cup_knockout_win,'Won '+(rnd||'an NBA Cup knockout game'),'cup_win');
    if(rnd==='Cup Championship'&&ow)add(ow,w.id,P.cup_champion,'NBA Cup champion','cup_champion')});
  const champ=field&&(field.cup_champion||(field.cup&&field.cup.champion));
  if(champ){const tid=String(champ),o=owners[tid];if(o&&rows[o]&&!rows[o].events.some(e=>e.kind==='cup_champion'))add(o,tid,P.cup_champion,'NBA Cup champion','cup_champion')}
  return Object.values(rows)};
/* no conference titles in the NBA rules */
S.confStarted=function(){return false};
S.confPoints=function(confTeams,games,owners,managers){const rows={};(managers||[]).forEach(m=>{rows[m.mid]={mid:m.mid,name:m.name,score:0,events:[],teams:{}}});return Object.values(rows)};
/* League total = RS wins + playoff (entry/wins/champ) + cup (final4 / knockout / champ). */
S.leagueTotals=function(season,tour,cup){const by=(l)=>Object.fromEntries((l||[]).map(r=>[r.mid,r]));const T=by(tour),C=by(cup);
  const ev=(row,kind)=>(row.events||[]).filter(e=>e.kind===kind).reduce((a,e)=>a+e.pts,0);
  const list=(season||[]).map(r=>{const t=T[r.mid]||{score:0,wins:0,events:[]},c=C[r.mid]||{score:0,events:[]};
    const breakdown={
      season_wins:r.wins*S.SEASON_WIN,
      playoff_entry:ev(t,'entry'),
      playoff_wins:ev(t,'win'),
      nba_champion:ev(t,'champ'),
      cup_final4:ev(c,'cup_final4'),
      cup_knockout_wins:ev(c,'cup_win'),
      cup_champion:ev(c,'cup_champion')
    };
    /* compat aliases used by league-d / older breakdowns */
    breakdown.ncaa=t.score||0;breakdown.conf_reg=0;breakdown.conf_tourn=0;
    const total=breakdown.season_wins+breakdown.playoff_entry+breakdown.playoff_wins+breakdown.nba_champion+breakdown.cup_final4+breakdown.cup_knockout_wins+breakdown.cup_champion;
    return{mid:r.mid,name:r.name,wins:r.wins,pct:r.pct,diff:r.diff,breakdown,total}});
  list.sort((a,b)=>b.total-a.total||b.wins-a.wins||b.pct-a.pct||b.diff-a.diff||a.name.localeCompare(b.name));return S.rank(list,r=>[r.total,r.wins,r.pct,r.diff])};
/* score one team from an aggregated record (used by unit tests / feasibility parity). */
S.scoreTeam=function(rec){rec=rec||{};const parts={
  rs_win_pts:(rec.rs_wins||0)*S.POINTS.rs_win,
  playoff_entry_pts:(rec.playoff_seed>=1&&rec.playoff_seed<=8)?S.POINTS.playoff_entry:0,
  playoff_win_pts:(rec.playoff_wins||0)*S.POINTS.playoff_win,
  nba_champion_pts:rec.nba_champion?S.POINTS.nba_champion:0,
  cup_final4_pts:rec.cup_final4?S.POINTS.cup_final4:0,
  cup_knockout_win_pts:(rec.cup_knockout_wins||0)*S.POINTS.cup_knockout_win,
  cup_champion_pts:rec.cup_champion?S.POINTS.cup_champion:0
};parts.total=Object.values(parts).reduce((a,b)=>a+b,0);return parts};
S.gamesView=function(games,owners,opt){opt=opt||{};const mine=g=>{const a=owners[String(g.home&&g.home.id)],b=owners[String(g.away&&g.away.id)];return{a,b,any:!!(a||b)}};
  const inv=(games||[]).filter(g=>g&&g.home&&g.away).map(g=>Object.assign({},g,{_o:mine(g)})).filter(g=>g._o.any).filter(g=>!opt.mid||g._o.a===opt.mid||g._o.b===opt.mid).filter(g=>!opt.kind||g.kind===opt.kind||(opt.kind==='post'&&(g.kind==='playoff'||g.kind==='playin'||g.kind==='cup')));
  const res=inv.filter(g=>g.status==='final').sort((a,b)=>(b.start||b.day||'').localeCompare(a.start||a.day||''));
  const up=inv.filter(g=>g.status==='scheduled'||g.status==='live').sort((a,b)=>(a.start||a.day||'').localeCompare(b.start||b.day||''));
  return{results:res,upcoming:up,total:inv.length}};
S.validateScores=function(d){if(!d||typeof d!=='object'||!Array.isArray(d.games))return'The scores file is missing or not in the expected format.';
  for(const g of d.games){if(!g||!g.home||!g.away||g.home.id==null||g.away.id==null)return'The scores file has a game without two teams.'}return null};
S.validateTournament=function(d){if(!d||typeof d!=='object'||typeof d.field!=='object'||d.field==null||Array.isArray(d.field))return'The playoff-seed file is missing or not in the expected format.';return null};
if(typeof module!=='undefined'&&module.exports)module.exports=S;else root.FBNScore=S;
})(typeof window!=='undefined'?window:globalThis);
