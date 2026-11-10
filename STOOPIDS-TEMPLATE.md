# STOOPIDS template: how Stoopids Hoops maps to the master site

**Master:** `Stoopids/stoopids` (live: https://stoopids.github.io/stoopids/). It is read-only: clone it to a separate folder, never push to it, never touch its textdb keys.
**This site:** `Stoopids/stoopids-hoops`, build `2026-11-10sh8`. It uses textdb keys with the `shoops1-` prefix only.

## sh8: the league site IS the STOOPIDS page (Paul)
`league.html` is the STOOPIDS `index.html` copied verbatim by `tools/build_league_from_stoopids.py`
(run: `python3 tools/build_league_from_stoopids.py /path/to/stoopids-clone`). The build applies ONLY a list of exact, counted text swaps
(it stops if any swap no longer matches, so a STOOPIDS update can't silently drift). All STOOPIDS markup, CSS, JS and features stay as they are.
`shared/ui.css` is copied verbatim; `shared/ui.js` is copied verbatim except one footnote link (AP poll -> ESPN NBA BPI).

One page serves every Stoopids Hoops league, now and in future seasons: the league comes only from `league.html?l=<code>`.
Each league has its own `shoops1-<code>-` keys, its own commish-chosen name (shown as "STOOPIDS PRESENTS <league name>"), managers and rosters,
and its own device keys (`shoops1.<code>.*`). Nothing names or assumes one league. Without a code the page shows a landing card
(Start a new NBA draft, Join with a code, Your leagues on this device).

### What changed (the swaps, all in the build script)
| Area | STOOPIDS | Stoopids Hoops |
|---|---|---|
| Data | `data.js` from `refresh.py` | `js/hoops-stoopids.js` builds the same `D` from the Hoops league (managers from the joins, rosters from the draft picks) + `data/scores.json`, `data/tournament.json`, NBA scoring (`js/scoring.js` via `js/league-d.js`). Re-read every 2 min (STOOPIDS' own reload), so drafted rosters appear by themselves. |
| textdb | `stoopids-*` keys | presence, chat, bets, bet requests, commish settings under `shoops1-<code>-*` |
| Device storage | `stoopids_*` | `shoops1.<code>.*` (same origin as STOOPIDS, so renamed) |
| Crew names | `OWNER_DISP`, `OLD_PN`, `LEGACY_OWNER`, `DRAFT27`, `DRAFT27_RESULTS`, `RECAPS`, "Commissioner: Paul" | filled from the league / empty |
| Heading | "Stoopids presents" + h1 STOOPIDS | same kicker + h1 = the league name (last word in the accent span), shrinks to one line |
| Hero | crew photo | Hoops basketball banner (`assets/hoops-hero-*.jpg`) |
| Identity | Who are you? picker | bets + chat act only as the manager whose private link is on this device (#11 = no act-as-anyone); the picker only remembers on this device |
| Commish | STOOPIDS passcode hash | the league's own commish passcode (same check as the draft room) + "Make a new link for [manager]" (new secret, claim hash replaced, old link stops working; Copy / Share) |
| NBA | ESPN college scoreboard / box scores / team links, AP, NET, KenPom, NCAA scoring, upset rule, postseason window Mar 1 - Apr 6 | ESPN NBA; BPI, last-season win rank, Stoopids Rank, projected points (`data/hoops-net.json` from `assets/teams.js`); NBA scoring rows, Breakdown columns, Postseason checklist (play-in to Finals, Apr 14 - Jun 30); no upset rule; no redraft tab |
| Standings chips | 4 per row, 2 rows | one line for 5-6 managers (abbreviation, record + rank badge, smaller on phones) |
| Draft room link | STOOPIDS draft2 | `room.html?l=<code>` |

### Untouched
Everything else in the STOOPIDS page: layout, tabs (Standings, Games, Bets, All teams, Recap, Rules, Archive, Profile), CSS, bets, chat, presence, live games, sorting, share, profile.
The Draft Room (`room.html`, `js/room.js`) is kept as is apart from the commish "Make a new link for [manager]" label + Share button.

## Tests
- `node tests/e2e_stoopids_copy.js` (local mock store): room draft -> League page fills the rosters by itself -> room link opens the STOOPIDS copy with the exact rosters; heading; chips on one line (5 and 6 managers, desktop + phone); commish new link; two leagues side by side + landing.
- `screens-copy/audit_copy.js`: side-by-side screenshots of every tab, STOOPIDS live (read-only, writes blocked) vs the copy (local synthetic league).
