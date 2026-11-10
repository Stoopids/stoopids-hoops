# Stoopids Hoops — phase 1 progress

Local only under `/workspace/nba-league/`. No GitHub repo, no push, no writes to live NCAA/STOOPIDS sites or to textdb.dev during tests.

## sh2 (10 Nov 2026, Asia/Jakarta)
- ESPN BPI (2026-27) is the auto-pick / mock-bot / league power-rank source. `data/power.json` written by `tools/refresh_nba.py`; `js/power-apply.js` overlays it; `assets/teams.js` has baked ranks and `meta.f` static 2024-25 win-rank fallback.
- Official ESPN ids corrected (MEM 29, WAS 27, TOR 28, CHA 30). Demo SYNTHETIC ids remapped. Scoring still 9/9.
- Store points at textdb.dev (`DEFAULT_BASE`/`REMOTE_BASE`) with `shoops1-` keys and `shoops.*` device keys (no `fbn.*`). Tests use `tools/mock_textdb.js`.

## Tests
- `node tests/test_nba_scoring.js` — **9/9 passed**.
- `NODE_PATH=/tmp/nba-e2e-deps/node_modules node tests/e2e_nba_mock.js` — **18/18 passed** (5- and 6-manager mocks through recap "Go to League" into `league.html`; no requests to textdb.dev).
- MD5SUMS.txt regenerated for build `2026-11-10sh2`.

## 2026-11-10sh8
- League site is now the STOOPIDS page copied verbatim (tools/build_league_from_stoopids.py) with the NBA data layer (js/hoops-stoopids.js). One page for every league (?l=<code>); landing without a code.
- e2e_stoopids_copy.js: handoff from a real room draft, heading, one-line chips (5/6 managers), commish new link, two leagues + landing.

## 2026-11-10sh9
- Paul's bug fixes: Games bet number opens that exact bet on Bets (right view and filter, scroll, highlight). Frozen Bets sub-tab row and frozen Games Upcoming/Past and filter rows (desktop and mobile). Draft room recap: removed the Redraft countdown line.
- Verified with synthetic labeled bets (mock store); screenshots in screens-sh9/ (not committed). test_nba_* pass, e2e_stoopids_copy 35/35, e2e_nba_mock 18/18.
- sh9b: no redraft anywhere in Hoops. The room "What's next", recap messages, help and Rules now say teams are held all season. Tests are unchanged: test_nba_* pass, 35/35, 18/18.
- sh9c: NBA wording in the recap, room and help (team, not school; playoff, not NCAA tournament). Tests are unchanged.

## 2026-11-10 live test drafts on sh9c (tests/live_drafts_sh9c.js, TEST sh9c Dn leagues, shoops1- keys only)
| Run | Setup | Picks | Wall time | Longest gap between picks | Auto/queue | Handoff (rosters, one-line chips, heading, errors) | Code |
|---|---|---|---|---|---|---|---|
| D1 | 5 snake random | first try: test-script click error before the start (GG5V9QKZAZPAZ195, blanked). Rerun: 30/30 PASS | 273 s (draft 108 s) | 7 s | best BPI PASS, 1 manual pick | PASS desktop + Android | X8SJZN613J7R7CWD |
| D2 | 6 snake set order, 1 manual pick | 30/30 PASS | 289 s (draft 110 s) | 8 s | all auto = best BPI PASS | PASS desktop + Android | 479HQ0G6E23D3CE2 |
| D3 | 5 straight random, seat 3 clock-out | 30/30 PASS | 305 s (draft 132 s) | 35 s (clock-out) | PASS | PASS | FF0486H7HVAPDTMS |
| D4 | 6 snake random, seat 1 queue 3 + clock-out | 30/30 PASS | 436 s (draft 222 s) | 36 s (clock-out) | queue: #1, #12, #13 = queued teams in order, then BPI PASS | PASS | AZBB73MQB35QSPHM |
| D5 | 6 snake set, seat 1 empty queue + auto | 30/30 PASS | 280 s (draft 96 s) | 4 s | best BPI PASS | PASS | MPFBG0B25V02EQDB |
The 1-minute start countdown is by design and not counted as a gap.
| D6 (try 1) | 5 snake, NO clock; seat 1 on the clock closes the page | waited 421 s at pick #1: PASS (no auto-pick for the absent seat). Reopen step failed because the test script built the private link wrong (query instead of #), so it was rerun | - | - | - | - | 90PYV7KVC1X6DTJR (blanked) |
| D6 (rerun) | 5 snake, NO clock; seat 1 on the clock closes its page | waited 344 s at pick #1 (no auto-pick for the absent seat) PASS; reopened with the private link in a fresh browser as seat 1 PASS; pick #1 by hand PASS; then 30/30 PASS | 774 s total (draft after pick #1: 247 s) | 134 s before #3 (auto-on seats whose pages sat idle while waiting; no clock, so nothing forces it) | best BPI PASS | PASS (rosters, one line, heading, no errors) | FCDHBXZJY1VZ67GK |
All TEST sh9c leagues were blanked afterwards (shoops1- keys only). The real league CABMTCKF3H94Y8SA was not touched.
