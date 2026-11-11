# sh6c / sh6d progress (Stoopids Hoops draft fixes)

## Root causes
1. sh6c (live, df2f2a5): store.js sent every request around `Store.fetchT`, so the draft room's store-health timer never saw an answer; 12 s after a page opened on the live store it decided the store had stalled and froze every HUMAN auto-pick (switch on or clock run-out) at 0:00 AUTO-PICKING. Bots were exempt since sh6b, which is why only your seat stuck.
2. sh6d: found in live TEST draft D5. textdb kept failing reads of one pick key (#22, saved to its backup spot). Every page re-reads it, the health timer counted each failure as a store-wide stall, and auto-pick froze on #23 on all 6 pages. Pick-key failures no longer count (backup-spot rules handle them).

## Done
- Auto-pick rule (human, switch on or clock out): top queued team still available, else best Power Ranking (ESPN BPI). Verified local + live.
- Queue add / reorder / remove saved and used by auto-pick (tests/e2e_nba_queue.js).
- 'Pick a team' pop-up removed: button opens Teams tab (2 columns desktop), sort starts on Power Ranking each visit.
- Tests: unit all pass (test_nba_sh6 27, sh6c 11, scoring 9, fixes 13, sorts 17, autodraft 22); e2e_nba_bots 15/15, e2e_nba_mock 18/18, e2e_nba_humanauto 13/13 (sh6c), e2e_nba_queue 6/6, e2e_nba_badslot 3/3 (fails on sh6c code = reproduces the freeze).
- Screenshots: teams-on-clock-desktop.png, teams-on-clock-mobile.png (+ live-*.png from live runs).
- sh6d committed+pushed: 40ec8f1
- 17:03 live runs started on sh6d (logs /tmp/ldA.log D1-D3, /tmp/ldB.log D4-D5)
- 17:18 D5 live froze at #2: textdb 500 on unwritten pick key -> slot 'stuck' -> clock-run-out auto-pick was blocked by design (NCAA s28 R2). Fix in progress: run-out also goes after the 15s stuck hold via backup spot.
- sh6e (local, testing): run-out clock auto-picks a stuck slot after the 15 s hold; failing LATER key no longer blocks. tests/e2e_nba_stuckexpire.js fails on sh6d (3/3), passes on sh6e (3/3).
- Live runs on sh6d: D1 pass (one 79 s gap at #30), D2 pass, D3 pass, D4 pass, D5 FROZE at #2 (the bug above). TEST league HKNB… and M0MA… cleaned; practice MKF8/MKZE/MK6W cleaned.
- Note: textdb today answers 500 (not empty) for unwritten pick keys, so each pick waits for retries: ~13 s per pick on live (was ~5 s earlier today).
- 17:35 box rebooted (lost /tmp); deps reinstalled at /workspace/nba-e2e-deps; rerunning e2e suite on sh6e (logs screens-fix/logs/)
- 17:43 divisions filter + subtitle added into sh6e (unit 11/11); screenshots division-filter-*.png, division-northwest-*.png, teams-on-clock-*.png (local sh6e)
- 17:47 sh6e pushed baadee2, live version.js=sh6e
- 17:53 live D1 practice on sh6e: 30/30, no stall, owners ok, human auto = queue/BPI (MKGQ). sh6f bot strategies pushed b2ab5ba, live sh6f; unit 12/12, e2e mock 18/18, bots 15/15.
- 18:02 item 4 (read-only compare): screenshots in screens-fix/compare/ (SBS-*.png). No changes built.

## rb1 rebuild (STOOPIDS look) — 10 Nov 2026 18:15 (WIB)
- Branch rebuild-stoopids-look. Source Stoopids/stoopids cloned read-only to /workspace/stoopids-src (push URL disabled).
- League site: STOOPIDS nav (rounded-rect tabs, Tally + Archive tabs, mobile 4 + More sheet), Share pill, Online/Last seen strip, floating Chat pill, Who are you? picker (real leagues, no sign-in).
- App pages (home, setup, join, mock, room, recap, help): STOOPIDS header (banner, Stoopids presents, big yellow title), rounded-rect buttons and room tabs.
- Local check tests/rb_shots.js 31/31 (full local mock draft, synthetic labeled data). Screens in screens-rebuild/.
- 18:30 sh7 pushed 73fee99, live 2026-11-10sh7. e2e mock 18/18, bots 15/15, humanauto 13/13, queue 6/6, sorts 26/26, badslot 3/3, stuckexpire 3/3, rb_shots 31/31, NBA unit all pass. Live D1 practice on sh7: 30/30, no stall, auto = queue/BPI (MKYY). Parity audit: screens-rebuild/compare/DIFF-SUMMARY.md lists 14 open non-NBA differences.
