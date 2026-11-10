# Pending Paste a bet case (Paul via NCAA, 2026-11-02). Do NOT run until Wednesday.
Input: `ken bets paul $5 2-1 virg -5 duke`
Expected parse: Ken vs Paul (Ken backs) · amount 5 · odds 2-1 · Virginia -5 vs Duke · matched to the Virginia/Duke game.
Today (s28j): 'virg' is not read as Virginia, and no game is matched.
Note: '$5' must be read as amount 5 without putting a money symbol into shipped text.
