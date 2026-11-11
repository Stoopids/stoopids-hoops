/* Games tab slate: Eastern game days, live overlay can add missing ESPN games, stale scores.json days were UTC. */
'use strict';
const assert = require('assert');
const {pathToFileURL} = require('url');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const ETK = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/New_York'});
const etDay = x => ETK.format(new Date(x));

// A 7:00 PM ET tip is 00:00Z the next calendar day. Game day must be Eastern, not UTC.
assert.strictEqual(etDay('2026-11-11T00:30Z'), '2026-11-10');
assert.strictEqual(etDay('2026-11-11T01:00Z'), '2026-11-10');
assert.strictEqual(etDay('2026-11-12T00:00Z'), '2026-11-11');
assert.strictEqual(etDay('2026-11-12T03:00Z'), '2026-11-11');

const scores = JSON.parse(fs.readFileSync(path.join(root, 'data/scores.json'), 'utf8'));
assert.ok(scores.as_of <= '2026-11-11', 'fixture scores.json is the stale snapshot this bug was found on');
const staleUpcoming = (scores.games || []).filter(g => g.status !== 'final');
assert.ok(staleUpcoming.length >= 1, 'stale snapshot still has non-final games');
// Those non-finals are last night's (or earlier) games stored with a UTC day.
for (const g of staleUpcoming) {
  if (g.start && /T0[0-4]:/.test(g.start)) {
    const et = etDay(g.start);
    assert.notStrictEqual(g.day, et, g.id + ' stored UTC day, not Eastern: ' + g.day + ' vs ' + et);
  }
}

// tonight's ESPN Nov 11 ET slate is not in the published file
const tonightIds = ['401909966','401909967','401909968','401909969','401909970','401909971','401909972','401909973','401909974','401909975'];
const have = new Set((scores.games || []).map(g => String(g.id)));
const missing = tonightIds.filter(id => !have.has(id));
assert.strictEqual(missing.length, tonightIds.length, 'tonight\'s slate should be absent from the stale file (the live overlay must add them)');

const html = fs.readFileSync(path.join(root, 'league.html'), 'utf8');
assert.ok(html.includes('js/league-sched.js'), 'league.html must load league-sched.js');
assert.ok(html.includes('function lvFromEvent') && html.includes('lvAdd(ng)'), 'live overlay must be able to add unmatched scoreboard games');
assert.ok(html.includes('function lvEtDay'), 'scoreboard days must use Eastern start times, not the UTC day field');

const hoops = fs.readFileSync(path.join(root, 'js/hoops-stoopids.js'), 'utf8');
assert.ok(hoops.includes('LSCHED.init') && hoops.includes('LSCHED.merge') && hoops.includes('H.applySched'), 'hoops data layer must merge team schedules');

const sched = fs.readFileSync(path.join(root, 'js/league-sched.js'), 'utf8');
assert.ok(sched.includes('if(f.status===\'final\')return f'), 'schedule merge may update stale non-finals, not only append');

const py = fs.readFileSync(path.join(root, 'tools/refresh_nba.py'), 'utf8');
assert.ok(py.includes('America/New_York'), 'refresh_nba.py game day must be Eastern');
assert.ok(py.includes('timedelta(days=14)'), 'refresh window must include upcoming days, not only today');

console.log('test_nba_games_slate: ok');
