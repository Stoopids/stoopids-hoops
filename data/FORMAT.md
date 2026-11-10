# Data format for Stoopids Hoops (NBA)

The league site (`league.html`) reads two static JSON files from this folder (and, for the DEMO link only, the same two files from `data/demo/`). Refresh with `python3 tools/refresh_nba.py`. Team ids are **ESPN NBA team ids as strings** (the same ids as `assets/teams.js`).

## `data/scores.json`

```json
{
  "format": 1,
  "sample": false,
  "label": "",
  "season": "2026-27",
  "as_of": "2026-11-10",
  "source": "espn",
  "seed_lock": false,
  "standings": { "25": { "w": 10, "l": 2, "playoffSeed": 1 } },
  "games": []
}
```

| field | meaning |
|---|---|
| `sample` | `true` marks invented data. Files marked `sample` are **never shown for a real league**. Invented data lives only in `data/demo/` (and `data/synthetic/`) and is reachable only through the DEMO link (`league.html?l=<id>&demo=1`). The files in `data/` that ship are empty (no games). |
| `label` | For sample files it starts with `SYNTHETIC` or `SAMPLE`. |
| `games[].kind` | `reg` regular season (includes NBA Cup group play), `cup` NBA Cup knockout (QF/SF/Final), `playin` play-in (ESPN type 5), `playoff` playoffs (ESPN type 3). |
| `games[].round` | For `cup`: `Cup Quarterfinals`, `Cup Semifinals`, `Cup Championship`. For `playoff`: `First Round`, `Conference Semifinals`, `Conference Finals`, `NBA Finals`. |
| `seed_lock` | `true` after the play-in, when official seeds 1–8 are set. Play-in losers do not appear in `tournament.json` `field`. |

## `data/tournament.json`

`field` is official seeds 1–8 after play-in (keyed by ESPN id). `cup.final4` / `cup.champion` and `champion` (NBA title) are optional overrides; games usually supply them.

## Scoring (`js/scoring.js`) — Paul's rules

All bonuses **stack** (assumptions, flagged in the Rules tab):

| event | points |
|---|---|
| Regular-season win (and, by assumption, a Cup knockout win also counts here) | 1 |
| Playoff entry (official seeds 1–8, including play-in winners) | 2 |
| Each playoff win | 2 |
| NBA champion | 4 |
| NBA Cup Final 4 | 2 |
| Each Cup knockout win (QF / SF / Final) | 1 |
| NBA Cup champion | 2 |

Play-in games award no regular-season and no playoff-win points. Play-in losers get 0 entry points.

## `data/power.json`

ESPN BPI ranks for the current NBA season (2026-27), written by `python3 tools/refresh_nba.py` (or `--power-only`). Mapped by official ESPN numeric team id (same ids as `assets/teams.js`).

```json
{
  "format": 1,
  "source": "ESPN BPI",
  "season": "2026-27",
  "ranks": { "24": 1, "25": 2 },
  "bpi": { "24": 9.396 }
}
```

`js/power-apply.js` overlays `ranks` onto `TEAMS_DATA.meta.o` and `meta.p` (auto-pick, mock bots, league power rankings). If the fetch fails, the baked ranks in `assets/teams.js` stay; `meta.f` is the static 2024-25 win-total fallback. `data/power-rankings.json` is not a team list — it is an optional prewritten manager recap; when empty, the league site generates recaps from each roster using these BPI ranks.
