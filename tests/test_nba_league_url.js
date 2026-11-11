/* ?l= must stay in league.html URLs so a refresh does not drop the visitor on the home page. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','league.html'),'utf8');
assert.ok(html.includes('function hoopsLeagueId'), 'hoopsLeagueId helper');
assert.ok(/function s24Url\(h,share\)\{[^}]*q\.set\('l',l\)/.test(html), 's24Url keeps ?l=');
assert.ok(/function s29ViewUrl\(h\)\{[^}]*q\.set\('l',l\)/.test(html), 'view-only share links keep ?l=');
assert.ok(/function s12PublicUrl\([\s\S]*?searchParams\.set\('l',l\)/.test(html), 'header share keeps ?l=');
/* current tab stays in the hash and is restored on load */
assert.ok(html.includes('function s24Put'), 's24Put writes the tab hash');
assert.ok(html.includes('s24Read(location.hash)'), 'first load reads the tab from the hash');
assert.ok(/function s24HashOf\(t\)\{return \(\{bets27:'bets'/.test(html), 'Bets tab hash is #bets');
/* Pool / buy-in expands the form, not a toggle-only shell */
assert.ok(/function b27PoolShell\(\)\{if\(U\.confirm\)/.test(html), 'b27PoolShell shows confirm or form');
assert.ok(html.includes('return b27PoolForm(b27Who())'), 'b27PoolShell renders b27PoolForm');
console.log('test_nba_league_url: ok');
