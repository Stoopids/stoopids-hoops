/* ?l= must stay in league.html URLs so a refresh does not drop the visitor on the home page. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','league.html'),'utf8');
assert.ok(html.includes('function hoopsLeagueId'), 'hoopsLeagueId helper');
assert.ok(/function s24Url\(h,share\)\{[^}]*q\.set\('l',l\)/.test(html), 's24Url keeps ?l=');
assert.ok(/function s29ViewUrl\(h\)\{[^}]*q\.set\('l',l\)/.test(html), 'view-only share links keep ?l=');
assert.ok(/function s12PublicUrl\([\s\S]*?searchParams\.set\('l',l\)/.test(html), 'header share keeps ?l=');
console.log('test_nba_league_url: ok');
