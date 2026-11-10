# STOOPIDS template: how Stoopids Hoops maps to the master site

**Master (hard copy):** `Stoopids/stoopids` (live: https://stoopids.github.io/stoopids/). It is read-only. Clone it to a separate folder and never push to it or touch its textdb keys.
**This site:** `Stoopids/stoopids-hoops`, build `2026-11-10sh7`. It uses textdb keys with the `shoops1-` prefix only.

## How the two sites differ in architecture

STOOPIDS is one league in one big `index.html`:
- `D` comes from `data.js`, which `refresh.py` builds in a GitHub workflow.
- `config.json` names the crew.

Hoops runs many leagues and has no workflows:
- Each league lives behind a league code (`league.html?l=CODE`).
- The managers come from the league's own store, with no names hard-coded.
- The data is static JSON refreshed by `tools/refresh_nba.py`, plus a live ESPN overlay in the browser.

So the STOOPIDS page is reproduced as a set of files that carry the same markup, CSS and behaviour, not as a byte copy.

## STOOPIDS page/section → Hoops file

| STOOPIDS (index.html / shared/) | Hoops file | Status |
|---|---|---|
| `<header>`: hero photo, `.titlebar`, `.s27-pres` "Stoopids presents", big yellow `h1`, `.tag` tagline | `js/leaguehome.js` `header()`, `css/league-app.css` | Same markup and classes. **NBA change:** default banner `assets/hero-banner.jpg` (an arena, not the crew photo); title = league name. |
| `.s12-share` 🔗 Share pill beside the title | `leaguehome.js` `header()` + action `sharesite`; CSS block "rb1" in `league-app.css` | Copied (sh7). Shares a view-only link to the league. |
| `nav#nav` tabs (`a.nt`, `.nm5`, `.nm-x`, `.nm-b` More, `.nm-bd/.nm-sh/.nm-i` sheet) | `leaguehome.js` `navHtml()` / `moreSheet()` (`nav#ltabs`) + "rb1" CSS | Copied (sh7). The tab order matches STOOPIDS (Standings, Games, Bets, Tally, All teams, Recap, Rules, Archive, Profile). On mobile: 4 tabs + More. **Deviation:** Tally is also shown on desktop (Paul asked for a Tally tab). |
| Standings (League / Breakdown) | `leaguehome.js` `vStandings` + `js/scoring.js` | Same layout. **NBA change:** scoring = 1 per regular-season win; 2 for playoff entry (seeds 1-8 incl. play-in winners); 2 per playoff win; 4 for the champion. NBA Cup: 2 for the final four, 1 per Cup knockout win, 2 for the Cup champion. All bonuses stack. |
| Games (Upcoming / Past, filters) | `leaguehome.js` `vGames`, `js/league-sched.js` | Same layout. **NBA change:** ESPN NBA scoreboard, season calendar from Nov 2026. **Gaps:** the "All Stoops / Stoop vs Stoop" filter names and the Quick bet button on game cards. |
| Bets (Request or Write it up / All Bets / Tally), pool bets | `js/league-bets.js` (+ `js/shared-s25.js` = STOOPIDS `S25` core) | Same ledger and event format. **NBA change:** versus + pool bets only. **Gap:** the 3-way sub-tab labels (Hoops has Write it Up / Tally). |
| Tally (rows owe columns, Bets / Won / Lost / Net, settle lines) | `league-bets.js` `tallyHtml()` + `tallyView()` (own tab since sh7) | Copied. |
| All teams | `leaguehome.js` `vTeams` + `js/power-*.js` | Same table. **NBA change:** 30 NBA teams, ESPN logos, divisions, BPI / Stoopids Rank. |
| Recap | `leaguehome.js` `vRecap` + `js/recap.js` | Same. **NBA change:** draft grades from the NBA draft. |
| Rules (`about`) | `leaguehome.js` `vRules` + `js/rules.js` | Same layout; the text is NBA scoring. |
| Archive | `leaguehome.js` `vArchive` | Tab restored (sh7). It reads the league meta `archive`. |
| Profile | `leaguehome.js` `vProfile` | **Gap:** the STOOPIDS My season / Notifications / Commissioner cards. Hoops shows Share + manager links. |
| `#onlStrip` Online / Last seen (`shared/ui.js` `U.onlineStrip`) | `leaguehome.js` `onlHtml()` / `paintOnl()` + "rb1" CSS | Copied (sh7). It reads each manager's presence key (`shoops1-…-pr-<mid>`). |
| `#chat` bar + `.chat-off` floating 💬 Chat pill | `leaguehome.js` `chatBar()` + "rb1" CSS | Copied (sh7). Same chat key as the draft room. |
| `#pwho` "Who are you? 👋" picker | `leaguehome.js` `whoPicker()` + "rb1" CSS | Copied (sh7). **Deviation (security):** a picked name is only remembered on this device. Chatting and betting still need that manager's own link. It is not shown in practice (mock) leagues. |
| Ball loader, taglines (`S25.TAGLINES`), reactions, settle sounds | `js/shared-s25.js`, `leaguehome.js` `LLOADER` | Copied earlier (s25). |
| Draft room (`draft2/`) | `room.html` + `js/room.js` (sh6f engine), `mock.html` + `js/mock.js` + `js/mock-bots.js` | **NBA change:** the Hoops engine is kept: queue → BPI auto-pick, the stuck-slot fix, divisions, bot strategies, fast bots, Pick a team → Teams tab. sh7 restyles the room to the STOOPIDS header and rounded-rect tabs. |
| Home / setup / join / help / recap pages | `js/ui.js` `U.header()` + "rb1" block in `css/app.css` | sh7: the STOOPIDS header (banner, Stoopids presents, big yellow STOOPIDS HOOPS) and rounded-rect buttons. STOOPIDS has no home/setup pages (it is single-league), so these are Hoops-only. |
| `data.js` / `refresh.py` / `.github/workflows/refresh.yml` | `data/*.json` + `tools/refresh_nba.py` | **NBA change:** ESPN NBA endpoints, no workflow (the Hoops repo must not push workflows). |
| textdb keys `stoopids-*` | `shoops1-*` (`js/core.js` `F.Keys`) | **Never** share keys with STOOPIDS or fantasy-bball. |

## Files changed for NBA vs untouched (relative to the STOOPIDS-derived league site)

- **NBA-specific (edit these for a new sport):**
  - `assets/teams.js` (teams, logos, divisions, BPI)
  - `js/scoring.js`
  - `js/rules.js`
  - `data/*.json`
  - `tools/refresh_nba.py`
  - `js/power-apply.js`
  - `js/mock-bots.js` (bot strategies)
  - `js/league-sched.js` (calendar)
  - the text in `js/version.js` and `js/core.js` (`FBN_NAME`, the `shoops1-` key prefix)
- **STOOPIDS look/behaviour (keep in sync with the master; do not redesign):**
  - `css/league-app.css`
  - `css/app.css` (the "rb1" block)
  - `js/leaguehome.js` (header, nav, chat, presence, picker)
  - `js/league-bets.js`
  - `js/shared-s25.js`
  - `js/ui.js` `U.header`
- **Hoops engine (multi-league draft):** `js/room.js`, `js/store.js`, `js/core.js` (draft state), `js/mock.js`, `js/setup.js`, `js/join.js`.

## Remaining deviations from STOOPIDS (next batch, needs Paul's OK)

1. Bets sub-tabs: Request or Write it up / All Bets / Tally (Hoops: Write it Up / Tally).
2. Games filters "All Stoops / Stoop vs Stoop" and the Quick bet button on game cards.
3. Profile cards: My season, Notifications, Commissioner passcode.
4. On mobile, the STOOPIDS hero and title are shorter.
5. STOOPIDS hides Tally on desktop (it lives under Bets); Hoops shows it on desktop too.

## How to make the next site the same way

1. Copy the Hoops repo.
2. Swap only the NBA-specific files above.
3. Change the key prefix.
4. Re-run `tests/rb_shots.js` and the `e2e_nba_*` suites.
5. Compare against STOOPIDS with `screens-rebuild/parity/audit.js` (read-only; it blocks every write).
