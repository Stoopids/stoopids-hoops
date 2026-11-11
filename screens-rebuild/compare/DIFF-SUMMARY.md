# STOOPIDS (live, read-only) vs Hoops league site, build sh7: differences that are NOT NBA-required

How this was checked: `audit_all.js` opens every tab on both sites (desktop 1280 and mobile 390).
- STOOPIDS was opened with every write blocked.
- Hoops ran locally against a seeded TEST league.
- For each tab the script records the headings, controls and table headers (`inventory.json`) and takes a side-by-side screenshot (`SBS-<tab>-<desktop|mobile>.png`).

A byte-for-byte file diff doesn't apply here. STOOPIDS is one 600 KB `index.html` for a single league with a hard-coded crew. The Hoops league site is split into `js/leaguehome.js`, `league-bets.js`, `shared-s25.js` and `css/league-app.css`, and serves any league code. So the comparison is feature by feature.

## Now the same (sh7)
- Header:
  - banner
  - "Stoopids presents"
  - big yellow title
  - tagline
  - Share pill
- Rounded-rect tab bar in the same order, with Tally and Archive. On mobile: 4 tabs + More sheet.
- Online / Last seen strip, the floating yellow Chat pill, and the "Who are you?" picker.
- Standings: League / Breakdown.
- Rules: scoring table.
- Tally: the who-owes-who ledger.

## Differences still open: 14 that are not NBA-required (target 0)
| # | Tab | STOOPIDS has | Hoops sh7 has |
|---|---|---|---|
| 1 | Standings | "↻ Refresh" button + "Updated N min ago" | none |
| 2 | Games | "All Stoops" select, "Stoop vs Stoop" toggle, team search box, ↻ refresh, Quick bet on each game | "All owners" select, "Pool only", no search, no Quick bet |
| 3 | Bets | 3 sub-tabs: Request or Write it up / All Bets / Tally | 2 sub-tabs: Write it Up / Tally, plus a "Watching only" card |
| 4 | Tally | one Person × Person table with Bets / Won / Lost / Net columns; "If settled today"; settled-bets list with person filter, search, reactions | a Person table + a separate "Who Owes Who" matrix + settle lines; no settled-bets list |
| 5 | All teams | owner chips + a sortable table (Team, Stoop, Rec, Pts, Conf, AP, NET, STOOPID, KenPom) | owner chips + cards, one "Win rank" sort |
| 6 | Recap | Weekly write-ups first, then Draft grades, "Draft results (by roster)" table | Draft grades, Power rankings, Weekly recaps (different order and sections) |
| 7 | Rules | "The upset rule", "What is automatic", "House interpretations" sections | "League rules", "Assumptions", "No upset bonus" |
| 8 | Archive | season selector, Final standings, Rosters & points, All-time table | "No past seasons yet" (no past Hoops seasons exist) |
| 9 | Profile | My season, Notifications (sound/alerts), Commissioner passcode, Share | Share only |
| 10 | Share | Share menu includes Tally | Share menu has no Tally |
| 11 | Who are you? | picking a name signs you in (no password) | picking a name is remembered only on that device; chat/bets still need the manager link |
| 12 | Tally on desktop | hidden on desktop (it's under Bets) | shown on desktop |
| 13 | Mobile header | shorter banner and title | taller banner, larger title |
| 14 | Footer / live bar | "Refresh Live Games" bar under the tabs | none |

### NBA-required differences (expected)
- Teams, logos and divisions.
- ESPN NBA data and the season calendar.
- NBA scoring (and Rules text).
- Rank columns: BPI and Stoopids Rank instead of AP, NET and KenPom.
- No upset rule.
- Managers come from each league, not a fixed crew.
- `shoops1-` store keys.

### Why 11 differs on purpose
STOOPIDS has no secrets, so anyone can act as any name. Hoops leagues protect each manager with a link secret. Copying the STOOPIDS behaviour would let anyone post or bet as anyone. That needs Paul's explicit OK.
