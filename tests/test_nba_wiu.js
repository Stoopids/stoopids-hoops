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

ok('build is sh20', /FBN_BUILD='2026-11-12sh20'/.test(ver), ver.slice(0, 80));
ok('grid util helper lives in the league page', /const b27GridUtil=/.test(html));
ok('pool form shows every owner including the creator', /function b27PoolForm\(me\)\{const names=b27OwnerNames\(\)/.test(html) && /names\.map\(\(n,i\)/.test(html) && !/function b27PoolForm\(me\)\{const others=b27Others\(\)/.test(html));
ok('pool default ticks only the creator', /U\.pp=me\?\[me\]:\[\]/.test(html) && /U\.ppSeed/.test(html));
ok('pool parts are the ticked tiles only', /const b27PoolParts=\(\)=>b27OwnerNames\(\)\.filter\(n=>U\.pp\.includes\(n\)\)/.test(html));
ok('pool Select all ticks every owner', /function b27PoolAll\(\)\{U\.pp=b27OwnerNames\(\)\.slice\(\)/.test(html));
ok('pool form has a settle-date whenBox defaulting to season', /b27PoolEst/.test(html) && /kind:U\.whenPick\?U\.wk:'season'/.test(html) && /function b27Kind\(k\)\{[^}]*U\.wk='season'/.test(html));
ok('saved pool record keeps when fields', /b27WhenFields\(\{wk:U\.whenPick\?U\.wk:'season'/.test(html) && /\.\.\.b27WhenFields\(x\)\}/.test(html));
ok('Write it Up placeholder is an NBA example', /placeholder="e\.g\. Knicks -4 beats Celtics"/.test(html));
ok('no Kansas -4 beats Duke placeholder on the league page', !/Kansas -4 beats Duke/.test(html));
ok('Request chips use gridUtil (empty slot or a row under)', /function chips\(f\)\{var list=A\.others\(\);var util=SHARED_UI\.gridUtil\(list\.length/.test(ui) && /SHARED_UI\.gridUtil=function/.test(ui));
ok('phone and inlined CSS force a 3-column manager grid', /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(css) && /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(html));
ok('shared/ui.css forces 3 equal columns with !important at every width', /html body \.b27-opps,html body \.rq-to\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/.test(uicss));
ok('shared/ui.css no longer forces 2 columns under 360px', !/max-width:359px\)\{html body \.b27-opps,html body \.rq-to\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/.test(uicss));
ok('Build on the pool form routes to b27PoolPlace', /function b27Place\(\)\{\/\*<POOL>\*\/if\(U\.kind==='pool'\)return b27PoolPlace\(\);/.test(html));
ok('pool button label is Write It Up', /build:'Write It Up'/.test(html) && /build:'Write It Up'/.test(bets));
ok('1v1 submit label is Write It Up', /U\.editOf\?'Update bet':'Write It Up'/.test(html) && />Write It Up<\/button>/.test(bets));
ok('pool copy helper uses the approved six-line format', /function b27PoolClipText/.test(html) && /Pool #'\+\(b\.n\|\|''\)\+' · '/.test(html) && /Payouts not entered yet\./.test(html) && /Buy-in \$'/.test(html) && /Members: '/.test(html));
ok('open 1v1 copy uses the bomb emoji', /replace\(\/💥\/g,'💣'\)/.test(html));
ok('league-bets pool form lists every owner and defaults to the creator', /function poolFormHtml\(me\)\{const all=owners\(\)/.test(bets) && /S\.p\.pp=me\?\[me\]:\[\]/.test(bets) && /const poolParts=\(\)=>owners\(\)\.map\(o=>o\.mid\)\.filter\(m=>S\.p\.pp\.includes\(m\)\)/.test(bets) && /b27PoolEst/.test(bets));

if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('all ok');
