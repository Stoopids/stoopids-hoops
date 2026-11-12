#!/usr/bin/env python3
"""Build js/hoops-archive.js (Archive tab data, STOOPIDS archive.js format) from Paul's season sheet.
Source: https://docs.google.com/spreadsheets/d/17bGI6dTfmP-wbChPAvR_F2RQGTjRJOgEGEGKGu5BV_I (one tab per season),
saved as data/archive/<season>.csv. Invents nothing: each results row (1st, 2nd, ...) is matched to the roster block
whose team wins add up to the same total. No manager names live in this file; the page links a sheet name to a
manager of the league at load time (js/hoops-stoopids.js), so trophies follow the league's own joins.
The archive is keyed by a hash of the league code, so only that league shows it and the code is not in the repo.
Run: python3 tools/archive_from_sheet.py <LEAGUE_CODE>"""
import csv, io, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEET = 'https://docs.google.com/spreadsheets/d/17bGI6dTfmP-wbChPAvR_F2RQGTjRJOgEGEGKGu5BV_I'
SEASONS = ['2024-25', '2023-24']   # newest first, like STOOPIDS

def fnv(s):   # same as HOOPS archive key in js/hoops-stoopids.js
    h = 0x811c9dc5
    for ch in s.upper():
        h ^= ord(ch); h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')

def soft(n):
    n = re.sub(r'[\U0001F947\U0001F3C6]+', '', re.sub(r'\s+', ' ', str(n or ''))).strip()
    if n and n == n.upper() and re.search(r'[A-Z]{2}', n):
        n = ' '.join(w.capitalize() for w in n.split())
    return n

def num(v):
    v = str(v or '').strip().replace(',', '')
    if not v: return None
    x = float(v); return int(x) if x == int(x) else x

def parse(path, season):
    rows = list(csv.reader(io.StringIO(path.read_text(encoding='utf-8-sig'))))
    w = max(len(r) for r in rows); rows = [r + [''] * (w - len(r)) for r in rows]
    blocks, standings, i = [], [], 0
    while i < len(rows):
        r = rows[i]; c0 = r[0].strip()
        if re.match(r'^(1st|2nd|3rd|\d+th)$', c0, re.I) and num(r[1]) is not None and r[2].strip():
            standings.append({'rank': int(re.sub(r'\D', '', c0)), 'total': num(r[1]), 'name': r[2].strip()}); i += 1; continue
        tcs = [j for j, v in enumerate(r) if v.strip() == 'TEAM']
        if tcs and any(v.strip() == 'Vegas Predicted' for v in r):
            gs = [{'name': r[tc - 2].strip(), 'tc': tc, 'teams': []} for tc in tcs if r[tc - 2].strip()]
            i += 1
            while i < len(rows) and any(re.match(r'^\d+$', rows[i][g['tc'] - 1].strip()) for g in gs):
                for g in gs:
                    rr = rows[i]; pk = rr[g['tc'] - 1].strip()
                    if re.match(r'^\d+$', pk) and rr[g['tc']].strip():
                        g['teams'].append({'pick': int(pk), 'name': rr[g['tc']].strip(), 'pred': num(rr[g['tc'] + 1]), 'wins': num(rr[g['tc'] + 2])})
                i += 1
            blocks += gs; continue
        i += 1
    owners, used = [], set()
    for st in sorted(standings, key=lambda x: x['rank']):
        hit = [k for k, g in enumerate(blocks) if k not in used and sum(t['wins'] or 0 for t in g['teams']) == st['total']]
        if len(hit) != 1: raise SystemExit(f'{season}: results row {st} matches {len(hit)} roster blocks')
        used.add(hit[0]); g = blocks[hit[0]]
        person = soft(g['name']); aliases = [person] + ([soft(st['name'])] if soft(st['name']).lower() != person.lower() else [])
        owners.append({'person': person, 'aliases': aliases, 'team_name': '', 'rank': st['rank'], 'tie': False, 'champ': st['rank'] == 1, 'total': st['total'],
                       'teams': [dict(t, pts=t['wins']) for t in g['teams']]})
    if len(used) != len(blocks): raise SystemExit(f'{season}: roster blocks without a results row')
    ranks = [o['rank'] for o in owners]
    for o in owners: o['tie'] = ranks.count(o['rank']) > 1
    for o in owners: o['champ'] = o['rank'] == 1 and not o['tie']
    return {'season': season, 'pool': True, 'notes': [], 'owners': owners, 'champion': [o['person'] for o in owners if o['rank'] == 1], 'top_total': owners[0]['total']}

def main():
    if len(sys.argv) < 2: raise SystemExit('usage: archive_from_sheet.py <LEAGUE_CODE>')
    seasons = [parse(ROOT / 'data' / 'archive' / f'{s}.csv', s) for s in SEASONS]
    people = {}
    for S in reversed(seasons):
        for o in S['owners']:
            p = people.setdefault(o['person'].lower(), {'person': o['person'], 'aliases': [], 'seasons': 0, 'title_seasons': []})
            p['aliases'] += [a for a in o['aliases'] if a not in p['aliases']]; p['seasons'] += 1
            if o['champ']: p['title_seasons'].append(S['season'])
    alltime = sorted(people.values(), key=lambda p: (-len(p['title_seasons']), -p['seasons'], p['person']))
    A = {'source': SHEET, 'built_by': 'tools/archive_from_sheet.py', 'excludes': 'money notes and the All-Star break table', 'seasons_played': len(seasons), 'seasons': seasons, 'alltime': alltime}
    out = ROOT / 'js' / 'hoops-archive.js'
    out.write_text('/* Archive tab data built by tools/archive_from_sheet.py from Paul\'s season sheet (data/archive/*.csv). Keyed by a hash of the league code. */\n'
                   'window.HOOPS_ARCHIVES={' + json.dumps(fnv(sys.argv[1])) + ':' + json.dumps(A, ensure_ascii=False, separators=(',', ':')) + '};\n', encoding='utf-8')
    print('wrote', out, [(S['season'], [(o['rank'], o['person'], o['total']) for o in S['owners']]) for S in seasons], [(p['person'], p['title_seasons']) for p in alltime])

if __name__ == '__main__': main()
