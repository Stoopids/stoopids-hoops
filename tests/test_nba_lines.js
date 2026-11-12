/* g.line is parsed from ESPN scoreboard odds / summary pickcenter and stored on scores.json. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..');
const py=path.join(root,'tools/refresh_nba.py');
const src=fs.readFileSync(py,'utf8');
assert.ok(src.includes('def parse_line('), 'refresh_nba.py parses ESPN odds');
assert.ok(src.includes('g["line"] = line'), 'parse_event stores g.line');
assert.ok(src.includes('def backfill_lines('), 'live games backfill from summary pickcenter');
assert.ok(/if og and og\.get\("line"\) and not g\.get\("line"\)/.test(src), '--merge keeps a stored line when a later fetch omits it');

const fixture=path.join('/tmp','test_nba_line_fixture.py');
fs.writeFileSync(fixture, `
import importlib.util, json, sys
from pathlib import Path
root=sys.argv[1]
spec=importlib.util.spec_from_file_location('refresh_nba', str(Path(root)/'tools/refresh_nba.py'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
comp={"odds":[{"provider":{"name":"DraftKings","priority":1},"details":"IND -3.5","overUnder":227.5,"spread":-3.5,
 "homeTeamOdds":{"favorite":True,"underdog":False,"team":{"id":"11","abbreviation":"IND"}},
 "awayTeamOdds":{"favorite":False,"underdog":True,"team":{"id":"27","abbreviation":"WSH"}},
 "pointSpread":{"home":{"close":{"line":"-3.5"}},"away":{"close":{"line":"+3.5"}}},
 "moneyline":{"home":{"close":{"odds":"-154"}},"away":{"close":{"odds":"+130"}}}}]}
home={"team":{"id":"11","abbreviation":"IND"}}
away={"team":{"id":"27","abbreviation":"WSH"}}
ln=m.parse_line(comp, home, away)
assert ln and ln["fav"]=="11" and ln["dog"]=="27" and ln["sp"]==3.5 and ln["ou"]==227.5, ln
assert ln["fav_name"]=="IND" and ln["aml"]==130 and ln["hml"]==-154 and ln["p"]=="DraftKings", ln
# away favorite: ESPN spread is the home line (+)
comp2={"odds":[{"provider":{"name":"DraftKings","priority":1},"details":"BOS -4.5","overUnder":215.5,"spread":4.5,
 "homeTeamOdds":{"favorite":False},"awayTeamOdds":{"favorite":True},
 "pointSpread":{"home":{"close":{"line":"+4.5"}},"away":{"close":{"line":"-4.5"}}}}]}
home2={"team":{"id":"28","abbreviation":"TOR"}}
away2={"team":{"id":"2","abbreviation":"BOS"}}
ln2=m.parse_line(comp2, home2, away2)
assert ln2["fav"]=="2" and ln2["sp"]==4.5 and ln2["fav_name"]=="BOS", ln2
print("parse_line fixture: ok")
`)
const r=spawnSync('python3',[fixture,root],{encoding:'utf8'});
assert.equal(r.status,0, 'parse_line fixture failed: '+(r.stdout||'')+(r.stderr||''));
process.stdout.write(r.stdout);

const scores=JSON.parse(fs.readFileSync(path.join(root,'data/scores.json'),'utf8'));
assert.equal(scores.games.length,1200, 'full season kept');
const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const night=scores.games.filter(g=>g.day===today);
assert.ok(night.length>=1, 'tonight has games on '+today);
const lined=night.filter(g=>g.line&&g.line.sp!=null&&g.line.ou!=null);
assert.equal(lined.length, night.length, 'every tonight game has a line ('+lined.length+'/'+night.length+')');
const djs=fs.readFileSync(path.join(root,'js/league-d.js'),'utf8');
assert.ok(djs.includes('if(L0.fav_name)o.line.fav_name=String(L0.fav_name)'), 'FBNLeagueD.build keeps fav_name so the card can show the favorite and spread');
console.log('test_nba_lines: ok ('+lined.length+'/'+night.length+' on '+today+')');

