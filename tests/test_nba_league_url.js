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

const hoops=fs.readFileSync(path.join(__dirname,'..','js/hoops-stoopids.js'),'utf8');
assert.ok(hoops.includes('function lastOpenedLeague'), 'missing ?l= restores the last league on this device');
assert.ok(hoops.includes("location.replace(u.pathname+u.search+u.hash)"), 'restore rewrites the URL with ?l= before HOOPS.load');
assert.ok(hoops.includes("localStorage.setItem('shoops.lastsite'"), 'league page writes shoops.lastsite');
assert.ok(html.includes("localStorage.setItem('shoops.lastsite'"), 's24Put writes shoops.lastsite on each tab');
assert.ok(!/getRegistrations\)\.then\(function\(r\)\{r\.forEach\(function\(x\)\{x\.unregister/.test(html), 'league.html no longer unregisters every service worker');
assert.ok(html.includes("navigator.serviceWorker.register('sw.js')"), 'league.html registers the service worker');
assert.ok(html.includes("postMessage('skip')"), 'waiting worker is told to skipWaiting');
const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
assert.ok(sw.includes('function isFresh'), 'HTML and scores.json are network-first');
assert.ok(sw.includes("r.mode==='navigate'") && sw.includes('scores.json') && sw.includes('skipWaiting') && sw.includes('clients.claim'), 'navigate/html/scores wait for the network; skipWaiting + clients.claim');
const idx=fs.readFileSync(path.join(__dirname,'..','js/index.js'),'utf8');
assert.ok(idx.includes("navType==='reload'?U.lastPlace()"), 'a reload of the home page resumes the last league');
const ui=fs.readFileSync(path.join(__dirname,'..','js/ui.js'),'utf8');
assert.ok(ui.includes('UI.myLeagues()') && ui.includes("kind:'league'"), 'lastPlace can fall back to this device\'s leagues list');

console.log('test_nba_league_url: ok');

