#!/usr/bin/env python3
"""Refresh Stoopids Hoops data/*.json from ESPN's public NBA JSON.

Writes scores.json (games + current standings/playoffSeed), last_season.json (final 2025-26 records for Win rank), tournament.json (official
seeds once the play-in is done), and data/power.json (ESPN BPI ranks, mapped by
numeric ESPN team id). On a BPI fetch failure the existing power.json / teams.js
fallback ranks are left in place. Does NOT write SYNTHETIC/demo files.

Usage:
  python3 tools/refresh_nba.py                # last 7 days through next 14 days (scoreboard, Eastern today) + BPI
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
from zoneinfo import ZoneInfo
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
        # ESPN timestamps are UTC; NBA game day is the US Eastern calendar date
        day = datetime.fromisoformat(start.replace("Z", "+00:00")).astimezone(ZoneInfo("America/New_York")).date().isoformat()
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

LAST_SEASON = "2025-26"
LAST_SEASON_YEAR = 2026  # ESPN season year = year the season ends


def fetch_standings(season: int | None = None) -> dict:
    """Current NBA standings, or a past season when `season` is the ESPN ending year."""
    out = {}
    url = STAND if not season else f"{STAND}?season={season}&region=us&lang=en"
    try:
        js = get(url)
    except Exception as e:
        print("warn standings:", e, file=sys.stderr)
        return out
    def walk(node, conf=None):
        if isinstance(node, dict):
            name = node.get("abbreviation") or node.get("name") or ""
            if "East" in str(name):
                conf = "East"
            elif "West" in str(name):
                conf = "West"
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
                        try:
                            return int(float(v))
                        except (TypeError, ValueError):
                            return None
                seed = n("playoffSeed")
                out[tid] = {
                    "w": n("wins") or 0,
                    "l": n("losses") or 0,
                    "playoffSeed": seed,
                    "conference": conf,
                }
            for v in node.values():
                walk(v, conf)
        elif isinstance(node, list):
            for v in node:
                walk(v, conf)
    walk(js)
    return out


def last_season_doc(standings: dict) -> dict:
    """Static 2025-26 final regular-season records for draft-room Win rank."""
    rows = []
    for tid, s in standings.items():
        w = int(s.get("w") or 0)
        l = int(s.get("l") or 0)
        pct = (w / (w + l)) if (w + l) else 0
        rows.append((tid, w, pct, l, s))
    rows.sort(key=lambda x: (-x[1], -x[2], x[3], x[0]))
    ranks, st = {}, {}
    for i, (tid, w, pct, l, s) in enumerate(rows, 1):
        ranks[tid] = i
        rec = {"w": w, "l": l, "pct": round(pct, 6), "rank": i}
        if s.get("conference") in ("East", "West"):
            rec["conference"] = s["conference"]
        st[tid] = rec
    return {
        "format": 1,
        "source": "espn",
        "season": LAST_SEASON,
        "seasonYear": LAST_SEASON_YEAR,
        "url": f"{STAND}?season={LAST_SEASON_YEAR}&region=us&lang=en",
        "sample": False,
        "note": "Final 2025-26 regular-season records. Draft-room Win rank uses this list (most wins, then win percentage).",
        "standings": st,
        "ranks": ranks,
    }

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


STOOP_NOTE = (
    "Expected points = proj. regular-season wins + 2×P(make playoffs) "
    "+ 2×E[playoff wins] + 4×P(champion). NBA Cup points omitted: ESPN BPI has no Cup odds."
)

def _cat_values(row, raw_cats, name):
    names = None
    for c in raw_cats or []:
        if c.get("name") == name:
            names = c.get("names") or []
            break
    cat = next((c for c in (row.get("categories") or []) if c.get("name") == name), None)
    if not names or not cat:
        return {}
    return dict(zip(names, cat.get("values") or []))

def _prob(v):
    if v is None:
        return None
    try:
        return float(v) / 100.0
    except (TypeError, ValueError):
        return None

def parse_stoopids(raw, pool: set[str]):
    """Expected Stoopids points from ESPN BPI projections / playoff odds. No Cup terms (none in the feed)."""
    if not raw:
        return None
    rows = []
    cats = raw.get("categories") or []
    for row in raw.get("teams") or []:
        tm = row.get("team") or {}
        try:
            tid = str(int(tm.get("id")))
        except (TypeError, ValueError):
            continue
        pr = _cat_values(row, cats, "projections")
        po = _cat_values(row, cats, "playoffs")
        bpi = _cat_values(row, cats, "bpi")
        proj_w = pr.get("projectedw")
        p_po = _prob(po.get("probmakeplayoffs") if po.get("probmakeplayoffs") is not None else pr.get("probmakeplayoffs"))
        cs = _prob(po.get("probmakeconfsemi"))
        cf = _prob(po.get("probmakeconfchamp"))
        fi = _prob(po.get("probmaketitlegame"))
        ch = _prob(po.get("probwintitle"))
        if proj_w is None or p_po is None or None in (cs, cf, fi, ch):
            continue
        try:
            proj_w = float(proj_w)
        except (TypeError, ValueError):
            continue
        exp_pw = cs + cf + fi + ch
        pts = proj_w + 2 * p_po + 2 * exp_pw + 4 * ch
        try:
            bpi_rank = int(bpi.get("bpirank") or 0) or 99
        except (TypeError, ValueError):
            bpi_rank = 99
        rows.append({
            "id": tid,
            "abbr": tm.get("abbreviation"),
            "name": tm.get("displayName"),
            "pts": round(pts, 4),
            "proj_w": round(proj_w, 3),
            "p_playoff": round(p_po, 5),
            "exp_playoff_wins": round(exp_pw, 4),
            "p_champ": round(ch, 5),
            "p_conf_semi": round(cs, 5),
            "p_conf_finals": round(cf, 5),
            "p_finals": round(fi, 5),
            "bpi_rank": bpi_rank,
        })
    rows.sort(key=lambda r: (-r["pts"], -r["p_champ"], -r["proj_w"], r["bpi_rank"], r["id"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    if len(rows) < 20:
        print(f"stoopids: only {len(rows)} teams, not writing", file=sys.stderr)
        return None
    missing = sorted((pool or set()) - {r["id"] for r in rows})
    if missing:
        print(f"stoopids warning: no projection for ESPN ids {missing}", file=sys.stderr)
    return {
        "format": 1,
        "source": "ESPN BPI projections",
        "season": (raw.get("currentSeason") or {}).get("displayName") or "2026-27",
        "fetched": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated": raw.get("lastUpdated"),
        "url": BPI_URL,
        "note": STOOP_NOTE,
        "cup": "omitted",
        "ranks": {r["id"]: r["rank"] for r in rows},
        "pts": {r["id"]: round(r["pts"], 2) for r in rows},
        "teams": rows,
    }

def fetch_bpi_bundle(pool: set[str]):
    """One ESPN BPI request -> (power.json doc, stoopids.json doc). Either may be None."""
    try:
        raw = get(BPI_URL)
    except Exception as e:
        print(f"BPI fetch failed: {e}", file=sys.stderr)
        return None, None
    return fetch_bpi_from_raw(raw, pool), parse_stoopids(raw, pool)

def fetch_bpi_from_raw(raw, pool: set[str]):
    """Same as fetch_bpi, but from an already-fetched payload."""
    if not raw:
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

def apply_bpi_to_teams_js(teams_js: Path, power: dict, stoopids: dict | None = None, standings: dict | None = None) -> None:
    """Bake BPI ranks, Stoopids Rank, and last-season (2025-26) records into assets/teams.js meta."""
    txt = teams_js.read_text()
    m = re.search(r"window\.TEAMS_DATA=(.*);\s*$", txt, re.S)
    if not m:
        print("teams.js: TEAMS_DATA not found, skipped bake", file=sys.stderr)
        return
    data = json.loads(m.group(1))
    meta = data.setdefault("meta", {})
    n = 0
    ranks = (power or {}).get("ranks") or {}
    for tid, row in meta.items():
        if tid in ranks:
            if "f" not in row and row.get("o"):
                row["f"] = row["o"]
            row["o"] = ranks[tid]
            row["p"] = ranks[tid]
            n += 1
    if power:
        data["rank_note"] = "ESPN BPI (26-27). Auto-pick, mock bots, and Power Ranking use this list (lower is better). If BPI is missing, the static 24-25 regular-season win rank in meta.f is the fallback."
        data["rank_source"] = "espn-bpi"
    ns = 0
    if stoopids:
        sr = stoopids.get("ranks") or {}
        sp = stoopids.get("pts") or {}
        for tid, row in meta.items():
            if tid in sr:
                row["sr"] = sr[tid]
                ns += 1
            if tid in sp:
                row["sp"] = sp[tid]
        data["stoop_note"] = stoopids.get("note") or STOOP_NOTE
    nr = 0
    if standings:
        rows = []
        for tid, row in meta.items():
            s = standings.get(tid)
            if not s or (s.get("w") is None and s.get("l") is None):
                continue
            w = int(s.get("w") or 0)
            l = int(s.get("l") or 0)
            if "r0" not in row:
                row["r0"] = row.get("r")
            row["r"] = f"{w}-{l}"
            row["w"] = w
            row["l"] = l
            row["pct"] = (w / (w + l)) if (w + l) else 0
            rows.append((tid, w, row["pct"], l))
            nr += 1
        rows.sort(key=lambda x: (-x[1], -x[2], x[3], x[0]))
        for i, (tid, *_rest) in enumerate(rows, 1):
            meta[tid]["wr"] = i
        data["rec_source"] = LAST_SEASON
    head = txt[:txt.find("window.TEAMS_DATA=")]
    teams_js.write_text(head + "window.TEAMS_DATA=" + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"baked BPI={n} stoopids={ns} records={nr} into {teams_js}")


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
    power, stoopids = fetch_bpi_bundle(pool)
    if power:
        (outdir / "power.json").write_text(json.dumps(power, indent=2) + "\n")
        print(f"wrote BPI {len(power.get('ranks') or {})} ranks -> {outdir / 'power.json'}")
    else:
        print("BPI unchanged (fetch failed); using existing data/power.json and teams.js fallback ranks")
    if stoopids:
        (outdir / "stoopids.json").write_text(json.dumps(stoopids, indent=2) + "\n")
        print(f"wrote Stoopids Rank for {len(stoopids.get('ranks') or {})} teams -> {outdir / 'stoopids.json'}")
    last_raw = fetch_standings(season=LAST_SEASON_YEAR)
    last_doc = last_season_doc(last_raw) if last_raw else None
    if last_doc and last_doc.get("standings"):
        (outdir / "last_season.json").write_text(json.dumps(last_doc, indent=2) + "\n")
        print(f"wrote last-season records for {len(last_doc['standings'])} teams -> {outdir / 'last_season.json'}")
    elif (outdir / "last_season.json").exists():
        last_doc = json.loads((outdir / "last_season.json").read_text())
        print("last-season fetch failed; keeping existing data/last_season.json")
    apply_bpi_to_teams_js(root / "assets/teams.js", power or {}, stoopids=stoopids, standings=(last_doc or {}).get("standings"))
    if args.power_only:
        return
    today = datetime.now(ZoneInfo("America/New_York")).date()
    start = date.fromisoformat(args.start) if args.start else today - timedelta(days=7)
    end = date.fromisoformat(args.end) if args.end else today + timedelta(days=14)
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
    apply_bpi_to_teams_js(root / "assets/teams.js", power or {}, stoopids=stoopids, standings=(last_doc or {}).get("standings"))
    print(f"wrote {len(games)} games, {len(standings)} current standings, seed_lock={locked} -> {outdir}")

if __name__ == "__main__":
    main()
