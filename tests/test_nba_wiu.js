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

const html = read('league.html');
const css = read('css/league-app.css');
const ui = read('shared/ui.js');
const uicss = read('shared/ui.css');
const bets = read('js/league-bets.js');
const ver = read('js/version.js');

ok('build is sh19', /FBN_BUILD='2026-11-12sh19'/.test(ver), ver.slice(0, 80));
ok('WIU form does not inject All/Clear as a util tile', !/others\.length%4\?b27UtilTile/.test(html));
ok('WIU and Pool use b27SelRow under the manager grid', (html.match(/b27SelRow\(/g) || []).length >= 2);
ok('Write it Up placeholder is an NBA example', /placeholder="e\.g\. Knicks -4 beats Celtics"/.test(html));
ok('no Kansas -4 beats Duke placeholder on the league page', !/Kansas -4 beats Duke/.test(html));
ok('Request chips are a manager grid plus a selbar, not a length%4 util tile', /function chips\(f\)\{var list=A\.others\(\);return '<div class="b27-opps rq-to"/.test(ui) && /class="b27-selbar"/.test(ui) && !/list\.length%4/.test(ui) && !/A\.others\(\)\.length%4/.test(ui));
ok('phone CSS uses an even 3-column manager grid', /@media \(max-width:599px\)\{\.b27-opps\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(css) && /@media \(max-width:599px\)\{\.b27-opps\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(html));
ok('shared/ui.css phone grid is 3 equal columns with !important', /max-width:599px\)\{html body \.b27-opps,html body \.rq-to\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/.test(uicss));
ok('shared/ui.css no longer forces 4 columns with !important', !/html body \.b27-opps,html body \.rq-to\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/.test(uicss));
ok('Build on the pool form routes to b27PoolPlace', /function b27Place\(\)\{\/\*<POOL>\*\/if\(U\.kind==='pool'\)return b27PoolPlace\(\);/.test(html));
ok('pool button label is Write It Up', /build:'Write It Up'/.test(html) && /build:'Write It Up'/.test(bets));
ok('1v1 submit label is Write It Up', /U\.editOf\?'Update bet':'Write It Up'/.test(html) && />Write It Up<\/button>/.test(bets));
ok('pool copy helper uses the approved six-line format', /function b27PoolClipText/.test(html) && /Pool #'\+\(b\.n\|\|''\)\+' · '/.test(html) && /Payouts not entered yet\./.test(html) && /Buy-in \$'/.test(html) && /Members: '/.test(html));
ok('open 1v1 copy uses the bomb emoji', /replace\(\/💥\/g,'💣'\)/.test(html));

if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('all ok');
