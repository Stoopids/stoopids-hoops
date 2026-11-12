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

ok('build is sh22', /FBN_BUILD='2026-11-12sh22'/.test(ver), ver.slice(0, 80));
ok('picker CSS is 4 equal columns', /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(css) && /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(html) && /html body \.b27-opps,html body \.rq-to\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/.test(uicss));
ok('grid util always appends Select all and Clear as end tiles', /return\{inn:b27UtilBtn\(all,'Select all'\)\+b27UtilBtn\(clear,'Clear'\)/.test(html) && /return\{inn:allB\+clearB,below:/.test(ui));
ok('pool default ticks only the creator and lists every owner', /U\.pp=me\?\[me\]:\[\]/.test(html) && /function b27PoolForm\(me\)\{const names=b27OwnerNames\(\)/.test(html));
ok('pool parts are the ticked tiles only', /const b27PoolParts=\(\)=>b27OwnerNames\(\)\.filter\(n=>U\.pp\.includes\(n\)\)/.test(html));
ok('card hides "Payouts not entered yet." when places exist', /st==='open'&&!b\.back&&!b\.places\)h\+=`[\s\S]*POOL_TXT\.noPay/.test(html) && /st==='open'&&!b\.back&&!b\.places/.test(bets));
ok('card buy-in line uses $ and Total', /line:'Buy-in \$\{buy\} each · Total \$\{tot\}'/.test(html) && /line:'Buy-in \$\{buy\} each · Total \$\{tot\}'/.test(bets));
ok('card payout amounts use $', /s26fPlaceName\(i\)\+' \$'\+b27Num\(a\)/.test(html) && /placeName\(i\)\+' \$'\+num\(a\)/.test(bets));
ok('unsettled pool copy is Pool #n · Unsettled', /back\?'Settled':'Unsettled'/.test(html) && /POOL_TXT\.stUnsettled/.test(html));
ok('unsettled pool card pill is Unsettled', /stUnsettled:'Unsettled'/.test(html) && /b\.back\?POOL_TXT\.stDone:POOL_TXT\.stUnsettled/.test(html));
ok('Write It Up switches to All Bets after a save', /try\{OB_VIEW='all'\}catch\(e\)\{\}U\.justPlaced/.test(html));
ok('placed highlight scrolls the new card into view', /el\.scrollIntoView\(\{block:'center'\}\)/.test(html) && /function s25PlacedFx/.test(html));
ok('pool copy helper still uses the six-line format with $', /function b27PoolClipText/.test(html) && /Buy-in \$'/.test(html) && /Members: '/.test(html));
ok('Build on the pool form routes to b27PoolPlace', /function b27Place\(\)\{\/\*<POOL>\*\/if\(U\.kind==='pool'\)return b27PoolPlace\(\);/.test(html));
ok('pool button label is Write It Up', /build:'Write It Up'/.test(html) && /build:'Write It Up'/.test(bets));
ok('Write it Up placeholder is an NBA example', /placeholder="e\.g\. Knicks -4 beats Celtics"/.test(html));
ok('open 1v1 copy uses the bomb emoji', /replace\(\/💥\/g,'💣'\)/.test(html));

if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('all ok');
