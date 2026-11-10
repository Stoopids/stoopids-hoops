# Stoopids Hoops

NBA friends-league app, built from the NCAA Fantasy BBALL structure with NBA teams and scoring. Live site: https://stoopids.github.io/stoopids-hoops/. Repo: https://github.com/Stoopids/stoopids-hoops. Do not change the live NCAA (`Stoopids/fantasy-bball`) or STOOPIDS (`Stoopids/stoopids`) sites from this repo.

**Name:** Stoopids Hoops.

## What this is

A static site (no build step). Pages: index, setup, join, room (draft), mock, recap, redraft, league, time, help.

- **30 NBA teams** in `assets/teams.js` (ESPN ids, abbreviations, `a.espncdn.com` logos).
- **5 or 6 managers** (commissioner option at setup and in the lobby). Default five: Ken (Kentut), Paul (Party Paul), Kurt (Kurmoji), Mark (Murnane / Dirty Draymond), Murf (Cockchalkrock). A sixth seat can stay empty until the draft. 5 managers × 6 rounds or 6 × 5; snake or straight; random or set order; pick clock same as NCAA (30/60/90/120/180s or none, default 60).
- **Paul's scoring** in `js/scoring.js` (replaces NCAA scoring entirely). Assumptions are flagged on the Rules tab.
- **Bets:** versus and pool only. Playoff-series and NBA Cup champion bets are not built (pending Paul's OK).
- **Storage:** same textdb.dev host as the NCAA app (`DEFAULT_BASE` / `REMOTE_BASE` = `https://textdb.dev/api/data/`), no API keys, but every store key uses `shoops1-` (never NCAA `fbn1-`). Device localStorage/sessionStorage keys use the `shoops.` prefix (never `fbn.`). Tests must use `tools/mock_textdb.js` and set `shoops.store` to `/api/data/` — they must not write to textdb.dev.
- **Data:** shipped `data/scores.json` and `data/tournament.json` are empty (`sample: false`). SYNTHETIC demo data is only in `data/demo/` (and `data/synthetic/`) and is labeled SYNTHETIC; the league site shows it only with `?demo=1`. Refresh script: `python3 tools/refresh_nba.py` (ESPN NBA JSON).
- Auto-pick, mock bots, and league power rankings use **ESPN BPI (2026-27)** from `data/power.json` (`python3 tools/refresh_nba.py --power-only`), mapped by official ESPN team id. If that fetch fails, the static 2024-25 regular-season win rank in `assets/teams.js` (`meta.f`) is the fallback.

## Run locally

```
cd /workspace/nba-league
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

```
node tests/test_nba_scoring.js          # Paul's rules vs SYNTHETIC feasibility checks
node tests/e2e_nba_mock.js              # starts tools/mock_textdb.js; mock draft 5 and 6 managers → recap Go to League → standings
```

Build tag: `2026-11-10sh2`. Cache name: `shoops-2026-11-10sh2`. Bump `js/version.js` and the `sw.js` cache prefix on every change, regenerate `MD5SUMS.txt`, and log it in `CHANGED-FILES.md`.
