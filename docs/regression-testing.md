# Regression testing — November 13, 2026

Scope: local working tree, live Anthropic agent calls through the local runtime, and an EC2 HTTPS reachability check. These local changes have not been deployed.

## Results

- Automated: 22 tests passed; frontend/backend type checks passed; production build passed; git diff whitespace check passed. Build retains the existing large-chunk warning.
- Suggestions: all six buttons filled the draft without submitting. Enter submitted the selected draft and removed the welcome suggestions. Editing and Send were also verified during the preceding suggestion change.
- Debt: $5,000 / 20% APR / $300 monthly produced 20 months and $906.81 interest in both chart math and final agent text. APR 0% produced 17 months and zero interest. APR 40% with $1 what-if payment displayed no payoff and a warning. Increasing payment recalculated correctly. Explain sent current APR/payment/results and returned an accurate explanation.
- Savings comparison: six-month balances matched expected values; 12 months / $325 monthly produced HYSA $9,170.99 (displayed $9,171). HYSA-only, stocks-only, and both filtered chart rows and rate controls correctly.
- Conversation modes: HYSA-only persisted to an unspecified-mode 12-month follow-up. Stocks-only persisted from six to twelve months. “Show both” restored both. Earlier cards retained their local values.
- Savings goal: $3,000 target / $500 saved / $250 monthly displayed ten months. Zero monthly savings displayed no completion date; Explain serialized null months and explained the unchanged gap.
- Growth: $500 monthly / 20 years / 7% displayed $260,463. Setting return to zero displayed $120,000 contributed/value and zero growth. Explain used the modified zero-return snapshot.
- Budget: $4,000 income against $4,200 expenses displayed $200 over budget. The preceding edited-suggestion check verified $500 unallocated for a $3,500 budget.
- Generic comparison: $200/$300/$400 monthly over six months displayed $1,200/$1,800/$2,400.
- Failure recovery: stopped local backend deliberately, clicked Explain, observed clear inline error; changed contribution while offline and saw chart recalculate. Restored backend and retried. Error cleared and response correctly used $325 monthly and HYSA-only ending balance $9,170.99.
- EC2: https://107.22.124.221/ returned HTTP 200 with TLS verification enabled. This was reachability only, not a regression of the new local code on EC2.

## Fixes from this round

1. Replaced debt's agent-supplied title with a stable “Debt payoff” heading, avoiding a stale APR after slider edits.
2. Debt tool now validates input and returns exact results from the same math as the chart. Previously it only acknowledged rendering, and the agent estimated 19 months / about $830 while the chart showed 20 months / $907. Rechecked live: 20 months / $906.81.
3. Labeled interest totals for non-paying-off debt as covering the projected months, not a lifetime payoff total.
4. Moved existing finance math into shared/finance.ts, preserving the frontend import through a re-export. Added a backend debt-result regression test.

## Known limitations

Backend restarts lose the in-memory thread/session mapping. A development restart during this round caused the agent to ask again for earlier amounts. Preferences were retested without a restart and worked. This does not implement persistent history. Model wording remains variable; sliders update cards locally, not already-written prose. Use Explain for current values.
