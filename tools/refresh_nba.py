#!/usr/bin/env python3
"""Refresh Stoopids Hoops data/*.json from ESPN's public NBA JSON.

Writes scores.json (games + standings/playoffSeed), tournament.json (official
seeds once the play-in is done), and data/power.json (ESPN BPI ranks, mapped by
numeric ESPN team id). On a BPI fetch failure the existing power.json / teams.js
fallback ranks are left in place. Does NOT write SYNTHETIC/demo files.

Usage:
  python3 tools/refresh_nba.py                # last 7 days + today (scoreboard) + BPI
  python3 tools/refresh_nba.py --power-only   # ESPN BPI into data/power.json (and teams.js ranks)
  python3 tools/refresh_nba.py --start 2025-10-21 --end 2026-06-26 --merge
  python3 tools/refresh_nba.py --out /tmp/nba-data

ESPN endpoints (unofficial, can change or block; CORS * on scoreboard/standings):
  https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
  https://site.api.espn.com/apis/v2/sports/basketball/nba/standings

Season types: 2 regular (includes NBA Cup), 5 play-in, 3 playoffs.
Cup knockout is still type 2; detected from notes ("NBA Cup - Semifinals", etc.).
"""
from __future__ import annotations
import argparse, json, re, sys, urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
STAND = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings"
BPI_URL = "https://site.web.api.espn.com/apis/fitt/v3/sports/basketball/nba/powerindex?region=us&lang=en&contentorigin=espn&limit=30"
UA = "StoopidsHoops/0.1 (local refresh; friends league)"

def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def load_ids(teams_js: Path) -> set[str]:
    txt = teams_js.read_text()
    data = json.loads(txt.split("window.TEAMS_DATA=", 1)[1].rstrip().rstrip(";"))
    return {row[0] for row in data["teams"]}

def status_of(comp, ev) -> str | None:
    n = ((comp.get("status") or ev.get("status") or {}).get("type") or {}).get("name") or ""
    if n == "STATUS_FINAL":
        return "final"
    if n == "STATUS_SCHEDULED":
        return "scheduled"
    if re.search(r"POSTPONED|CANCELED|CANCELLED|SUSPENDED", n):
        return None
    return "live" if n else "scheduled"

def score_of(x):
    s = x.get("score")
    if isinstance(s, dict):
        v = s.get("value", s.get("displayValue"))
    else:
        v = s
    if v is None or v == "":
        return None
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None

def kind_round(ev, comp) -> tuple[str, str]:
    stype = (ev.get("season") or {}).get("type") or 2
    note = ""
    notes = comp.get("notes") or []
    if notes:
        note = (notes[0] or {}).get("headline") or ""
    if stype == 5 or re.search(r"play-?in", note, re.I):
        return "playin", note or "Play-In"
    if re.search(r"NBA Cup", note, re.I) and re.search(r"quarter|semi|champ", note, re.I):
        if re.search(r"champ", note, re.I):
            return "cup", "Cup Championship"
        if re.search(r"semi", note, re.I):
            return "cup", "Cup Semifinals"
        return "cup", "Cup Quarterfinals"
    if stype == 3:
        tail = note.split(" - ")[-1] if note else "First Round"
        return "playoff", tail
    return "reg", ""

def parse_event(ev, pool: set[str]):
    comps = ev.get("competitions") or []
    if not comps:
        return None
    c = comps[0]
    stype = (ev.get("season") or {}).get("type") or 2
    if stype == 1:
        return None
    st = status_of(c, ev)
    if not st:
        return None
    kind, rnd = kind_round(ev, c)
    sides = c.get("competitors") or []
    if len(sides) != 2:
        return None
    def side(x):
        t = x.get("team") or {}
        tid = str(t.get("id") or x.get("id") or "")
        seed = (x.get("curatedRank") or {}).get("current")
        return {
            "id": tid,
            "score": None if st == "scheduled" else score_of(x),
            "seed": seed if kind in ("playoff", "playin") and isinstance(seed, int) and 0 < seed < 99 else None,
            "short": str(t.get("abbreviation") or t.get("shortDisplayName") or t.get("location") or "")[:40],
        }
    home = next((x for x in sides if x.get("homeAway") == "home"), sides[0])
    away = next((x for x in sides if x.get("homeAway") == "away"), sides[1])
    h, a = side(home), side(away)
    if not h["id"] or not a["id"] or h["id"] == a["id"]:
        return None
    if h["id"] not in pool and a["id"] not in pool:
        return None
    start = ev.get("date") or c.get("date")
    if not start:
        return None
    if st == "final" and (h["score"] is None or a["score"] is None or h["score"] == a["score"]):
        return None
    day = start[:10]
    try:
        # ESPN dates are UTC ISO; game day is the calendar date in the payload
        day = datetime.fromisoformat(start.replace("Z", "+00:00")).date().isoformat()
    except Exception:
        pass
    return {
        "id": str(ev.get("id")),
        "day": day,
        "start": start,
        "status": st,
        "kind": kind,
        "round": rnd,
        "neutral": bool(c.get("neutralSite")),
        "home": h,
        "away": a,
    }

def fetch_days(start: date, end: date, pool: set[str]) -> list[dict]:
    games, seen = [], set()
    d = start
    while d <= end:
        url = f"{BASE}/scoreboard?dates={d.strftime('%Y%m%d')}&limit=200"
        try:
            js = get(url)
        except Exception as e:
            print(f"warn {d}: {e}", file=sys.stderr)
            d += timedelta(days=1)
            continue
        for ev in js.get("events") or []:
            g = parse_event(ev, pool)
            if g and g["id"] not in seen:
                seen.add(g["id"])
                games.append(g)
        d += timedelta(days=1)
    return games

def fetch_standings() -> dict:
    out = {}
    try:
        js = get(STAND)
    except Exception as e:
        print("warn standings:", e, file=sys.stderr)
        return out
    def walk(node):
        if isinstance(node, dict):
            entries = node.get("entries") or node.get("standings", {}).get("entries") or []
            for e in entries:
                t = (e.get("team") or {})
                tid = str(t.get("id") or "")
                if not tid:
                    continue
                stats = {s.get("name"): s for s in (e.get("stats") or [])}
                def n(k):
                    s = stats.get(k) or {}
                    v = s.get("value")
                    try:
                        return int(v)
                    except (TypeError, ValueError):
                        return None
                seed = n("playoffSeed")
                out[tid] = {
                    "w": n("wins") or 0,
                    "l": n("losses") or 0,
                    "playoffSeed": seed,
                    "conference": (t.get("displayName") and None) or None,
                }
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(js)
    return out

def seed_lock(games: list[dict], standings: dict) -> bool:
    # After any play-in final exists, treat seeds as official if 16 teams have seeds 1-8.
    if any(g["kind"] == "playin" and g["status"] == "final" for g in games):
        seeds = [s.get("playoffSeed") for s in standings.values() if s.get("playoffSeed") in range(1, 9)]
        return len(seeds) >= 16
    return False

def fetch_bpi(pool: set[str]):
    """Return a power.json document, or None if the request or parse fails."""
    try:
        raw = get(BPI_URL)
    except Exception as e:
        print(f"BPI fetch failed: {e}", file=sys.stderr)
        return None
    names = None
    for c in raw.get("categories") or []:
        if c.get("name") == "bpi":
            names = c.get("names") or []
            break
    if not names:
        print("BPI fetch: no bpi category", file=sys.stderr)
        return None
    teams, ranks, bpi = [], {}, {}
    for row in raw.get("teams") or []:
        tm = row.get("team") or {}
        try:
            tid = str(int(tm.get("id")))
        except (TypeError, ValueError):
            continue
        cat = next((c for c in (row.get("categories") or []) if c.get("name") == "bpi"), None)
        vals = dict(zip(names, cat.get("values") or [])) if cat else {}
        try:
            rank = int(tm.get("rankValue") or vals.get("bpirank") or 0)
        except (TypeError, ValueError):
            rank = 0
        if rank <= 0:
            continue
        teams.append({
            "id": tid,
            "abbr": tm.get("abbreviation"),
            "name": tm.get("displayName"),
            "rank": rank,
            "bpi": vals.get("bpi"),
            "bpi_off": vals.get("bpioffense"),
            "bpi_def": vals.get("bpidefense"),
        })
        ranks[tid] = rank
        if vals.get("bpi") is not None:
            bpi[tid] = vals["bpi"]
    teams.sort(key=lambda r: r["rank"])
    if len(ranks) < 20:
        print(f"BPI fetch: only {len(ranks)} ranks, not writing", file=sys.stderr)
        return None
    missing = sorted(pool - set(ranks)) if pool else []
    if missing:
        print(f"BPI warning: no rank for ESPN ids {missing}", file=sys.stderr)
    return {
        "format": 1,
        "source": "ESPN BPI",
        "season": (raw.get("currentSeason") or {}).get("displayName") or "2026-27",
        "fetched": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated": raw.get("lastUpdated"),
        "url": BPI_URL,
        "ranks": ranks,
        "bpi": bpi,
        "teams": teams,
    }

def apply_bpi_to_teams_js(teams_js: Path, power: dict) -> None:
    """Bake BPI ranks into assets/teams.js meta.o / meta.p. Leaves meta.f (static fallback) alone."""
    txt = teams_js.read_text()
    m = re.search(r"window\.TEAMS_DATA=(.*);\s*$", txt, re.S)
    if not m:
        print("teams.js: TEAMS_DATA not found, skipped bake", file=sys.stderr)
        return
    data = json.loads(m.group(1))
    ranks = power.get("ranks") or {}
    n = 0
    meta = data.setdefault("meta", {})
    for tid, row in meta.items():
        if tid in ranks:
            if "f" not in row and row.get("o"):
                row["f"] = row["o"]
            row["o"] = ranks[tid]
            row["p"] = ranks[tid]
            n += 1
    data["rank_note"] = "ESPN BPI (2026-27). Auto-pick, mock bots, and league power rankings use this list (lower is better). If BPI is missing, the static 2024-25 regular-season win rank in meta.f is the fallback."
    data["rank_source"] = "espn-bpi"
    head = txt[:txt.find("window.TEAMS_DATA=")]
    teams_js.write_text(head + "window.TEAMS_DATA=" + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"baked BPI into {n} teams in {teams_js}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start")
    ap.add_argument("--end")
    ap.add_argument("--merge", action="store_true")
    ap.add_argument("--out", default=None)
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--power-only", action="store_true", help="Only refresh ESPN BPI into data/power.json")
    args = ap.parse_args()
    root = Path(args.root)
    outdir = Path(args.out) if args.out else root / "data"
    outdir.mkdir(parents=True, exist_ok=True)
    pool = load_ids(root / "assets/teams.js")
    power = fetch_bpi(pool)
    if power:
        (outdir / "power.json").write_text(json.dumps(power, indent=2) + "\n")
        apply_bpi_to_teams_js(root / "assets/teams.js", power)
        print(f"wrote BPI {len(power.get('ranks') or {})} ranks -> {outdir / 'power.json'}")
    else:
        print("BPI unchanged (fetch failed); using existing data/power.json and teams.js fallback ranks")
    if args.power_only:
        return
    today = date.today()
    start = date.fromisoformat(args.start) if args.start else today - timedelta(days=7)
    end = date.fromisoformat(args.end) if args.end else today
    games = fetch_days(start, end, pool)
    if args.merge:
        prev = outdir / "scores.json"
        if prev.exists():
            old = json.loads(prev.read_text())
            have = {g["id"] for g in games}
            for g in old.get("games") or []:
                if g.get("id") not in have:
                    games.append(g)
    games.sort(key=lambda g: (g.get("day") or "", g.get("id") or ""))
    standings = fetch_standings()
    locked = seed_lock(games, standings)
    field = {}
    if locked:
        for tid, s in standings.items():
            seed = s.get("playoffSeed")
            if seed in range(1, 9):
                field[tid] = {"seed": seed}
    scores = {
        "format": 1,
        "sample": False,
        "label": "",
        "season": "2026-27",
        "as_of": today.isoformat(),
        "source": "espn",
        "seed_lock": locked,
        "standings": standings,
        "games": games,
    }
    tour = {
        "format": 1,
        "sample": False,
        "label": "",
        "year": 2027,
        "as_of": today.isoformat() if locked else None,
        "seed_lock": locked,
        "field": field,
        "cup": {},
    }
    (outdir / "scores.json").write_text(json.dumps(scores, indent=2) + "\n")
    (outdir / "tournament.json").write_text(json.dumps(tour, indent=2) + "\n")
    print(f"wrote {len(games)} games, {len(standings)} standings, seed_lock={locked} -> {outdir}")

if __name__ == "__main__":
    main()
