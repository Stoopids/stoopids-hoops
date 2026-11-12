#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failed = 0;
function ok(name, cond, extra) {
  if (cond) console.log('ok  ' + name);
  else { failed++; console.log('FAIL  ' + name + (extra != null ? ' :: ' + extra : '')); }
}

const ui = read('shared/ui.js');
const html = read('league.html');
const ver = read('js/version.js');
const core = read('js/core.js');
const djs = read('js/league-d.js');
const bets = read('js/league-bets.js');

ok('build is sh22', /FBN_BUILD='2026-11-12sh22'/.test(ver), ver.slice(0, 80));

// Load shared helpers in node (file already targets globalThis).
const g = globalThis;
g.window = g;
g.document = undefined;
require(path.join(ROOT, 'shared/ui.js'));
const U = g.SHARED_UI;
ok('SHARED_UI helpers exported', !!(U && U.withGameCtx && U.descLines && U.etDate && U.etStamp));

const spread = 'Dallas +9.5 vs Minnesota -9.5, Nov 12';
ok('spread text already has teams+date: no parenthetical', U.withGameCtx(spread, 'Dallas', 'Minnesota', 'Nov 12') === spread, U.withGameCtx(spread, 'Dallas', 'Minnesota', 'Nov 12'));
ok('winner text already has teams+date: no parenthetical', U.withGameCtx('Dallas beats Minnesota, Nov 12', 'Dallas', 'Minnesota', 'Nov 12') === 'Dallas beats Minnesota, Nov 12');
ok('OU text already has teams+date: no parenthetical', U.withGameCtx('Over 226.5 vs Under 226.5, Dallas v Minnesota, Nov 12', 'Dallas', 'Minnesota', 'Nov 12') === 'Over 226.5 vs Under 226.5, Dallas v Minnesota, Nov 12');
ok('hand-typed without the other team gets game context', U.withGameCtx('I take Dallas', 'Dallas', 'Minnesota', 'Nov 12') === 'I take Dallas (Dallas vs Minnesota, Nov 12)');
ok('hand-typed with no game names gets game context', U.withGameCtx('They cover', 'Dallas', 'Minnesota', 'Nov 12') === 'They cover (Dallas vs Minnesota, Nov 12)');

const lines = U.descLines(spread, [2, 1]);
ok('1v1 odds sit on their own line without at', lines.length === 2 && lines[0] === spread && lines[1] === '2-1', JSON.stringify(lines));
ok('even odds omit the odds line', U.descLines(spread, [1, 1]).join('|') === spread);
ok('odds already in the text are not repeated', U.descLines(spread + ' 2-1', [2, 1]).join('|') === spread + ' 2-1');

// Thu night US game: 2026-11-12 19:30 ET = 2026-11-13 00:30 UTC = 07:30 Nov 13 in Jakarta
const tip = '2026-11-13T00:30:00.000Z';
ok('ET game date is Nov 12 even from a UTC Friday instant', U.etDate(tip) === 'Nov 12', U.etDate(tip));
ok('etDate has no weekday', !/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/.test(U.etDate(tip, true) + ' ' + U.etStamp(tip)));

ok('pick() uses withGameCtx instead of always appending', /txt:SHARED_UI\.withGameCtx\(tt,A\.tname\(g\.away\),A\.tname\(g\.home\),A\.dateET\(g\)\)/.test(ui));
ok('waText joins money, terms, odds, Expires as separate lines', /return \['💣 '\+money\+' 💣'\]\.concat\(desc\)\.concat\(\['Expires '\+expTxt/.test(ui));
ok('descLine no longer appends at odds on the same line', !/return \(t\?t\+' ':''\)\+'at '\+od/.test(ui));

ok('fmtDate never prefixes a weekday', html.includes("function fmtDate(k,wd){") && html.includes("return MON[+m[2]-1]+' '+(+m[3])+', '+m[1]}") && !/wd\?DOW/.test(html));
ok('quick-bet date uses ET key and strips the year only', /const qbDate=g=>etLabel\(etKey\(g\)\)/.test(html));
ok('pool copy Posted date is Eastern Time', /SHARED_UI\.etDate\(at\)|timeZone:'America\/New_York'/.test(html));
ok('b27Day is Eastern Time, no weekday', /function SHARED_UI\.etDate|SHARED_UI\.etDate\(d\)/.test(html) && /const b27Day=/.test(html));
ok('open 1v1 copy puts odds on their own line', /od=\(aa===1&&bb===1\)\?'':aa\+'-'\+bb;\s*return \['\\uD83D\\uDCA3 \$'\+b\.amt\+' '\+PN\(b\.backer\)\+' v '\+who\+' \\uD83D\\uDCA3',line2,od,/.test(html));
ok('LTIME day formatters have no weekday option', !/weekday:'short'/.test(djs) && !/weekday:'long'/.test(djs));
ok('core time formatters have no weekday option', !/weekday:/.test(core));
ok('league-bets qbDate uses America/New_York', /timeZone:'America\/New_York'/.test(bets));

if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('all ok');
