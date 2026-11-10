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
