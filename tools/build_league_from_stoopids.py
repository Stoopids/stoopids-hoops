#!/usr/bin/env python3
"""Build Stoopids Hoops league.html = STOOPIDS index.html copied verbatim, plus ONLY these NBA / data-layer swaps.
Source (read-only): /workspace/stoopids-src (Stoopids/stoopids). Every swap below is an exact-text replace that must match
the expected number of times, so a STOOPIDS update that moves code fails loudly instead of silently diverging.
Run: python3 tools/build_league_from_stoopids.py [stoopids_src_dir]"""
import re, sys, os, json, shutil
SRC = sys.argv[1] if len(sys.argv) > 1 else '/workspace/stoopids-src'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
LOG = []
def rep(old, new, n=1, why=''):
    global s
    c = s.count(old)
    if c != n: raise SystemExit(f'expected {n} x {old[:80]!r}, found {c}')
    s = s.replace(old, new); LOG.append((why or old[:60], c))
def rerep(pat, new, n=1, why='', flags=0):
    global s
    s2, c = re.subn(pat, new if '\\1' in new else (lambda m: new), s, flags=flags)
    if c != n: raise SystemExit(f'expected {n} x /{pat[:80]}/, found {c}')
    s = s2; LOG.append((why or pat[:60], c))
def literal_end(start):
    k = start
    while s[k] not in '{[': k += 1
    d = 0; q = None; p = k
    while True:
        ch = s[p]
        if q:
            if ch == '\\': p += 2; continue
            if ch == q: q = None
        elif ch in '"\'`': q = ch
        elif ch in '{[': d += 1
        elif ch in '}]':
            d -= 1
            if d == 0: return k, p + 1
        p += 1
def swap_literal(decl, expr, why):
    global s
    i = s.find(decl)
    if i < 0 or s.count(decl) != 1: raise SystemExit('missing ' + decl)
    k, e = literal_end(i + len(decl) - 1)
    s = s[:k] + expr + s[e:]; LOG.append((why, 1))

dn = re.search(r'D=window\.(\w+_DATA);', s).group(1)

# 1) data layer: Hoops modules + adapter load before the page script; D comes from the Hoops league instead of data.js
rep('<script src="archive.js?v=1"></script>',
    '<script src="js/version.js"></script><script src="js/core.js"></script><script src="js/scoring.js"></script><script src="js/league-d.js"></script>'
    '<script src="js/store.js"></script><script src="assets/teams.js"></script><script src="js/power-apply.js"></script><script src="js/league.js"></script>'
    '<script src="js/hoops-stoopids.js"></script><script>HOOPS.dataName=' + json.dumps(dn) + ';</script>',
    why='Hoops data layer instead of archive.js (no past Hoops seasons yet: Archive shows its empty state)')
rep("const s=document.createElement('script');s.src=(DEMO?'demo/':'')+'data.js?v='+Date.now();\n  s.onload=()=>{D=window.",
    "const s=document.createElement('script');s.src='js/version.js?v='+Date.now();\n  s.onload=async()=>{try{await HOOPS.load()}catch(e){if(!D){$('#main').innerHTML=HOOPS.landingHtml();if(typeof cb==='function')cb();return}}D=window.",
    why='load(): build D from the Hoops league (re-read every 2 min, so drafted rosters appear automatically)')
rep("const D27_START='2026-11-01T13:00:00Z',D27_OWNERS=8,D27_ROUNDS=8,D27_TOTAL=D27_OWNERS*D27_ROUNDS;", "const D27_START='2000-01-01T00:00:00Z';let D27_OWNERS=8,D27_ROUNDS=8,D27_TOTAL=D27_OWNERS*D27_ROUNDS;", why='draft size from the Hoops league (set in load)')
rep("D=window."+dn+";", "D=window."+dn+";{const R=window.HOOPS_DRAFT27_RESULTS.draft;D27_OWNERS=R.managers||D27_OWNERS;D27_ROUNDS=R.rounds||D27_ROUNDS;D27_TOTAL=D27_OWNERS*D27_ROUNDS}", why='draft size from the Hoops league')
rep('<p class="d27sub">8 owners · snake draft', '<p class="d27sub">${D27_OWNERS} owners · ${esc((DRAFT27_RESULTS.draft||{}).type||\'snake\')} draft', why='draft results subtitle')
# 2) textdb records -> this league's shoops1- keys
rep("url:'https://textdb.dev/api/data/stoopids-presence-23658198955328729a557ddb'", "url:HOOPS.url('stoopids-presence-0')", why='presence key')
rep("url:'https://textdb.dev/api/data/stoopids-bets-2627-9eaa4f66'", "url:HOOPS.url('bets-2627')", why='bets ledger key')
rep("const REQ_URL='https://textdb.dev/api/data/stoopids-requests-2627-9eaa4f66'", "const REQ_URL=HOOPS.url('requests-2627')", why='bet requests key')
rep("const CM_URL='https://textdb.dev/api/data/stoopids-commish-2627-9eaa4f66'", "const CM_URL=HOOPS.url('commish-2627')", why='commissioner settings key')
# 3) this device's localStorage keys are per Hoops league (same origin as the real STOOPIDS site)
rerep(r"'stoopids[_.]([A-Za-z0-9_.]*)'", r"(HK+'\1')", n=s.count("'stoopids_") + s.count("'stoopids."), why="localStorage 'stoopids_*' -> HK (shoops1.<league>.*)")
rep("'stoopids-bets-backup-", "HK+'bets-backup-", n=s.count("'stoopids-bets-backup-"), why='bets backup key')
# 4) hardcoded STOOPIDS crew -> names from the Hoops league joins
swap_literal('const OWNER_DISP=', 'window.HOOPS_OWNER_DISP', 'OWNER_DISP from the league')
swap_literal('const OLD_PN=', 'window.HOOPS_OLD_PN', 'no 2025-26 side-bet people')
swap_literal('const LEGACY_OWNER=', 'window.HOOPS_LEGACY_OWNER', 'no legacy owner renames')
swap_literal('const DRAFT27=', 'window.HOOPS_DRAFT27', 'draft slots/order from the Hoops draft')
swap_literal('const DRAFT27_RESULTS=', 'window.HOOPS_DRAFT27_RESULTS', 'draft picks from the Hoops draft')
swap_literal('const RECAPS=', '[]', 'no weekly write-ups yet')
rep('<p>Commissioner: Paul</p>', '<p>Commissioner: ${esc(HOOPS.cmName)}</p>', n=2, why='commissioner name from the league')
rep("One small step for man, one giant brick for Murf.", "One small step for man, one giant brick for the bench.", why='tagline without a STOOPIDS name')
# 5) identity: actions use this device's own manager link (Paul #11 = no act-as-anyone). The Who are you? picker only remembers on this device.
rep("const b27Who=()=>{const w=PS.who||legacyOwner(lsGet((HK+'who')));", "const b27Who=()=>{const w=HOOPS.me;", why='bets: only the link-verified manager')
rep("function chatWho(){const w=PS.who||legacyOwner(lsGet((HK+'who')));", "function chatWho(){const w=HOOPS.me;", why='chat: only the link-verified manager')
# 6) commissioner: this league's passcode (meta.pass) + 'Make a new link for [manager]'
rep("function profCmUnlocked(){return lsGet(PROF_CM_TOK)===PROF_CM_HASH}", "function profCmUnlocked(){return !!HOOPS.cmOk}", why='commish unlock = league passcode')
rep("if(hash===PROF_CM_HASH){PROFCM.tries=0;PROFCM.msg='';lsSet(PROF_CM_TOK,PROF_CM_HASH);render();return}",
    "if(await HOOPS.cmUnlock(pass)){PROFCM.tries=0;PROFCM.msg='';render();return}", why='commish passcode check')
rep("function profCmLock(){try{localStorage.removeItem(PROF_CM_TOK)}catch(e){}", "function profCmLock(){try{localStorage.removeItem(PROF_CM_TOK)}catch(e){}HOOPS.cmLock();", why='commish lock')
rep("cmToolsHtml()}<button type=\"button\" class=\"btn sec\" style=\"margin-top:8px\" onclick=\"profCmLock()\">Lock</button>",
    "cmToolsHtml()}${HOOPS.newLinkHtml()}<button type=\"button\" class=\"btn sec\" style=\"margin-top:8px\" onclick=\"profCmLock()\">Lock</button>", why="commish 'Make a new link for [manager]'")
rerep(r"DRAFT_URL='https://stoopids\.github\.io/stoopids/draft2/'", "DRAFT_URL=HOOPS.draftUrl", why='Draft room link -> this league\'s Hoops draft room')
rep('title="AP Top 25: #', 'title="ESPN BPI: #', why='chip rank badge: BPI')
rep("<b>AP Top 25</b>", "<b>ESPN BPI Power Ranking</b>", why='rankings card title')
# Paul: with 5-6 managers every manager's team chips sit on ONE line (desktop + mobile); chips shrink instead of wrapping
rep('</style>\n</head>', '''/*<HOOPS-CHIPS-1LINE>*/
html body .card.oc .chips.school-grid{--rows:1!important;min-height:0!important;grid-template-columns:none!important;grid-auto-flow:column!important;grid-auto-columns:minmax(0,1fr)!important;grid-template-rows:40px!important;grid-auto-rows:40px!important}
html body .card.oc .chips.school-grid .chip{min-width:0!important}
html body .card.oc .chips.school-grid .chip .cn{display:none!important}html body .card.oc .chips.school-grid .chip .cab{display:block!important;grid-column:2!important;grid-row:1!important}
@media (max-width:699px){html body .card.oc .chips.school-grid{gap:3px!important}
html body .card.oc .chips.school-grid .chip{position:relative!important;overflow:visible!important;grid-template-columns:auto minmax(0,1fr)!important;padding:0 2px 0 2px!important;column-gap:2px!important}
html body .card.oc .chips.school-grid .chip img,html body .card.oc .chips.school-grid .chip .nologo{width:15px!important;height:15px!important}
html body .card.oc .chips.school-grid .chip .cab{font-size:10.5px!important;letter-spacing:0!important}html body .card.oc .chips.school-grid .chip .cr{font-size:8px!important;letter-spacing:-.04em!important}
html body .card.oc .chips.school-grid .chip>.aprk{position:static!important;grid-column:2!important;grid-row:2!important;justify-self:end!important;align-self:center!important;white-space:nowrap!important;font-size:7.5px!important;padding:0 1.5px!important;letter-spacing:-.02em!important;line-height:1.25!important;margin:0!important}
html body .card.oc .chips.school-grid .chip .cr{grid-column:2!important;grid-row:2!important;justify-self:start!important}}
/*</HOOPS-CHIPS-1LINE>*/</style>
</head>''', why='Standings chips on one line for 5-6 managers (Paul)')
# 7) NBA: header, live scores, rankings, scoring rows, breakdown columns, postseason checklist, no upset rule
rep('<title>', '<title>', why='(title below)')
rerep(r'<title>[^<]*</title>', '<title>Stoopids Hoops · NBA Fantasy</title>', why='title')
rep('<h1>STOOP<span>IDS</span></h1>', '<h1 id="hoopsLg">STOOP<span>IDS</span></h1>', why="heading: STOOPIDS' own 'Stoopids presents' kicker + the league name the commish set (h1 text only; filled by js/hoops-stoopids.js)")
rep("live:['Where college basketball knowledge goes to be humbled.'", "live:['Where NBA knowledge goes to be humbled.'", why='tagline: NBA')
rep("Somebody\\u2019s mid-major is carrying them. Somebody\\u2019s blue blood is not.", "Somebody\\u2019s small-market team is carrying them. Somebody\\u2019s superteam is not.", why='tagline: NBA')
rep("'?dates='+day.replace(/-/g,'')+'&groups=50&limit=500'", "'?dates='+day.replace(/-/g,'')+'&limit=500'", why='ESPN NBA scoreboard has no D1 group')
rerep(r"const SITE_TITLE='[^']*';", "const SITE_TITLE='Stoopids Hoops · NBA Fantasy';", why='browser tab title')
rerep(r'aria-label="The \w+ crew\. Tap to enlarge the photo\."', 'aria-label="Stoopids Hoops banner. Tap to enlarge the photo."', why='hero label')
rep("assets/hero-wide.jpg?v=4", "assets/hoops-hero-wide.jpg?v=1", n=s.count("assets/hero-wide.jpg?v=4"), why='NBA hero (not the STOOPIDS crew photo)')
rep("assets/hero-mobile.jpg?v=4", "assets/hoops-hero-mobile.jpg?v=1", n=s.count("assets/hero-mobile.jpg?v=4"), why='NBA hero mobile')
rep("sports/basketball/mens-college-basketball/scoreboard", "sports/basketball/nba/scoreboard", n=s.count("sports/basketball/mens-college-basketball/scoreboard"), why='ESPN NBA live scores')
rep("sports/basketball/mens-college-basketball/rankings", "sports/basketball/nba/rankings", why='no AP poll in the NBA (falls back to BPI from D.ranks)')
rerep(r"if\(n>=1&&n<=25\)\{m\[String\(t\.espn_id\|\|tid\)\]=n;", "if(n>=1&&n<=30){m[String(t.espn_id||tid)]=n;", why='BPI ranks all 30 teams')
rep("['ap','AP','AP Top 25']", "['ap','BPI','ESPN BPI Power Ranking (26-27)']", why='rank column: BPI')
rep("['net','NET','NCAA NET']", "['net','<span class=\"s27-lf\">Win rank</span><span class=\"s27-ls\">WR</span>','Last season win rank (25-26)']", why='rank column: last-season win rank')
rep("'STOOPID rank (Draft Room)'", "'Stoopids Rank (Draft Room)'", n=2, why='rank column title')
for a,b in [("'ap','AP','AP Top 25'","'ap','BPI','ESPN BPI Power Ranking (26-27)'"),("'net','NET','NCAA NET'","'net','<span class=\"s27-lf\">Win rank</span><span class=\"s27-ls\">WR</span>','Last season win rank (25-26)'"),
             ("'kp','<span class=\"s27-lf\">KenPom</span><span class=\"s27-ls\">KP</span>','KenPom rank'","'kp','<span class=\"s27-lf\">Proj pts</span><span class=\"s27-ls\">PJ</span>','Projected Stoopids points (BPI)'")]:
    rep(a, b, n=s.count(a), why='All teams column: '+b.split(',')[1])
swap_literal('const S27_RANKS=', '{}', 'Stoopids Rank / projection come from D.ranks (assets/teams.js)')
rep("ap:'AP',net:'NET',sr:'STOOPID',kp:'KenPom'", "ap:'BPI',net:'Win rank',sr:'Stoopids Rank',kp:'Proj pts'", why='sort label')
rerep(r" STOOPID = STOOPID rank from the Draft Room preseason team list\. KenPom = KenPom \$\{esc\(S27_KP_SEASON\)\} ratings rank\. Rec = full season record \(regular season \+ conference tournaments \+ postseason as ESPN counts it\)\. AP = .*?\\u2014 = unranked\.",
      " STOOPID = Stoopids Rank from the Draft Room (expected fantasy points from ESPN BPI projections). Proj pts = those projected points. Rec = season record as ESPN counts it. BPI = ESPN BPI Power Ranking 26-27. Pts = Stoopids Hoops points this season (team totals from Standings > Points). Conf = conference · division. Win rank = rank by last season's wins (25-26). \\u2014 = unranked.", why='All teams note: NBA sources')
rep("fetch('data/net.json',", "fetch('data/hoops-net.json',", why='rank file: NBA win rank + divisions (built below from assets/teams.js)')
rep("return d>='2027-01-06'&&d<='2027-01-20'}", "return false}", why='no redraft in Stoopids Hoops')
rep("const end=tvNext(M.title_game)||'2027-04-06';return d>='2027-03-01'&&d<=end}", "const end=tvNext(M.title_game)||'2027-06-30';return d>='2027-04-14'&&d<=end}", why='Postseason tab: NBA play-in to Finals')
for a in ["sports/basketball/mens-college-basketball/summary","www.espn.com/mens-college-basketball/boxscore","www.espn.com/mens-college-basketball/team/_/id/","basketball/mens-college-basketball/scoreboard?dates="]:
    rep(a, a.replace('mens-college-basketball','nba'), n=s.count(a), why='ESPN NBA links: '+a.split('/')[-2])
swap_literal('const PCOLS=', "[['W','Regular-season wins',b=>b.win],['PO','Playoff entry (seeds 1-8)',b=>b.playoff_entry],['PW','Playoff wins',b=>b.playoff_wins],['Ch','NBA champion',b=>b.nba_champion],['C4','NBA Cup Final 4',b=>b.cup_final4],['CW','NBA Cup knockout wins',b=>b.cup_knockout_wins],['CC','NBA Cup champion',b=>b.cup_champion],['±','Commissioner adjustment',b=>b.adjust||0]]", 'Breakdown columns: NBA scoring')
i = s.find("const rows=[['Win (reg season + conf tourney, any opponent)'"); k, e = literal_end(i + len('const rows='))
s = s[:k] + "[['Regular-season win (includes NBA Cup group play and Cup knockout games)',P.win],['Playoff entry (official seeds 1–8 after the play-in)',P.playoff_entry],['Each playoff win',P.playoff_wins],['NBA champion',P.nba_champion],['NBA Cup Final 4',P.cup_final4],['Each NBA Cup knockout win',P.cup_knockout_wins],['NBA Cup champion',P.cup_champion]]" + s[e:]; LOG.append(('Rules scoring rows: NBA', 1))
rep("  ${vUpsets()}\n", "", why='no upset rule in the NBA rules')
i = s.find('<b>What is automatic</b>'); j = s.find("${''/*</RULES-ONLY>*/}", i)
blk = s[i:j]
new_blk = ("<b>What is automatic</b><ul class=\"it\">\n   <li><b>Playoff entry:</b> the official seeds 1–8 in each conference once the play-in is over.</li>\n</ul>\n   <b>Automatic</b>: wins, losses, playoff entry, playoff wins, NBA champ, NBA Cup Final 4, Cup knockout wins, Cup champ.<br>\n   <b>By hand</b>: any corrections or rulings from the commissioner.</div>`:`<div class=\"card\"><b>What is automatic</b><ul class=\"it\">\n   <li><b>Playoff entry:</b> the official seeds 1–8 in each conference once the play-in is over.</li>\n</ul>\n   <b>Automatic</b>: wins, losses, playoff entry, playoff wins, NBA champ, NBA Cup Final 4, Cup knockout wins, Cup champ.<br>\n   <b>By hand</b>: any corrections or rulings from the commissioner.</div>`}\n  ")
s = s[:i] + new_blk + s[j:]; LOG.append(('What is automatic: NBA', 1))
i = s.find('<div class="card"><b>House interpretations'); j = s.find('</ul></div>', i) + len('</ul></div>')
s = s[:i] + ('<div class="card"><b>House interpretations</b><ul class="it">\n   <li><b>Teams are held all season:</b> every team is drafted once and stays with its owner for the whole season (no drops, adds or swaps).</li>\n   <li>Every category stacks: a team that wins the title also has its playoff entry, each playoff win and its regular-season wins.</li>\n'
             '   <li>Play-in games count as regular-season wins only; play-in losers get no playoff entry.</li>\n   <li>NBA Cup group games count as regular-season wins; Cup knockout wins also earn the Cup bonus.</li>\n'
             '   <li>Postponed or canceled games give nothing.</li></ul></div>') + s[j:]; LOG.append(('House interpretations: NBA', 1))
i = s.find('function vChecklist(){'); j = s.find('\n  return h}', i)
s = s[:i] + ("function vChecklist(){\n  let h=`<div class=\"swipe\">↔ Swipe sideways to see every column</div><div class=\"card sc\"><table><tr><th>Team</th><th>Stoop</th><th>Playoff entry</th><th class=\"n\">Playoff wins</th><th>NBA champ</th><th>Cup Final 4</th><th class=\"n\">Cup wins</th><th>Cup champ</th></tr>`;\n"
             "  D.owners.forEach(o=>o.teams.filter(t=>t.status!=='dropped').forEach(t=>{const c=D.checklist[t.tid]||{};\n"
             "    h+=`<tr><td>${chip(t.tid)}</td><td>${esc(PN(o.name))}</td><td>${mark(c.playoff_entry||c.ncaa_entry)}</td><td class=\"n\">${c.playoff_wins||0}</td><td>${mark(c.champ)}</td><td>${mark(c.final4)}</td><td class=\"n\">${c.cup_wins||0}</td><td>${mark(c.cup_champ)}</td></tr>`}));\n"
             "  h+=`</table></div><p class=\"note\">✅ yes (from ESPN) · ⏳ not decided yet · · no</p>`;") + s[j:]; LOG.append(('Postseason checklist: NBA', 1))
import subprocess
T = json.loads(subprocess.check_output(['node', '-e', "global.window=global;require(process.argv[1]);process.stdout.write(JSON.stringify(window.TEAMS_DATA))", os.path.join(ROOT, 'assets', 'teams.js')]))
rows = [{'school': r[1], 'tid': r[0], 'net': (T['meta'].get(r[0]) or {}).get('wr'), 'conf': ((T['meta'].get(r[0]) or {}).get('c', '') + ' · ' + (T['meta'].get(r[0]) or {}).get('d', '')).strip(' ·')} for r in T['teams']]
json.dump({'format': 1, 'season': 'Last season win rank (25-26)', 'as_of': T.get('built', ''), 'rows': [x for x in rows if isinstance(x['net'], int)]}, open(os.path.join(ROOT, 'data', 'hoops-net.json'), 'w'), indent=0)
# sh9 (Paul): bet-number jump, frozen Bets / Games rows. Kept in tools/hoops_sh9_fixes.html until STOOPIDS ships its own fixes.
rep('</script>\n</body>', '</script>\n' + open(os.path.join(ROOT, 'tools', 'hoops_sh9_fixes.html'), encoding='utf-8').read() + '</body>', why='sh9 fixes: bet-number jump + frozen Bets / Games rows')
open(os.path.join(ROOT, 'league.html'), 'w', encoding='utf-8').write(s)
# shared/ui.js + ui.css: STOOPIDS' own shared module, copied verbatim except the rankings footnote link (NBA BPI instead of the college AP poll)
os.makedirs(os.path.join(ROOT, 'shared'), exist_ok=True)
u = open(os.path.join(SRC, 'shared', 'ui.js'), encoding='utf-8').read()
a = '# Rankings: <a href="https://www.espn.com/mens-college-basketball/rankings" target="_blank" rel="noopener">AP Top 25 (ESPN)</a>'
if u.count(a) != 1: raise SystemExit('shared/ui.js footnote moved')
open(os.path.join(ROOT, 'shared', 'ui.js'), 'w', encoding='utf-8').write(u.replace(a, '# Rankings: <a href="https://www.espn.com/nba/bpi" target="_blank" rel="noopener">BPI (ESPN)</a>')); LOG.append(('shared/ui.js: rankings footnote -> ESPN NBA BPI', 1))
shutil.copy(os.path.join(SRC, 'shared', 'ui.css'), os.path.join(ROOT, 'shared', 'ui.css')); LOG.append(('shared/ui.css: verbatim', 1))
print('league.html built from STOOPIDS index.html with', len(LOG), 'swaps:'); [print(' -', w, c) for w, c in LOG]
