# Stocks vs. HYSA: team feature and demo

## What we added

One tool, `show_savings_vs_investing`, compares a HYSA with three hypothetical stock paths over 6 or 12 months. The existing four finance tools remain. No live market data, ticker predictions, or bank-rate lookup is needed.

The starter supplied chat, the Express/CopilotKit runtime, the AG-UI adapter, existing charts, and the tool-rendering pattern. Our contribution is the comparison tool, editable comparison component, shared deterministic calculation, input validation, and tests.

## Follow one request through the code

1. `web/src/App.tsx`: existing chat sends the question.
2. `server/src/index.ts`: existing runtime connects to Claude and registers `vizTools`.
3. `server/src/vizTools.ts`: Claude selects our tool and supplies six inputs. The handler validates the inputs and returns exact calculated balances to Claude for its explanation.
4. `web/src/viz/renderers.tsx`: matches the tool name to `SavingsComparison` and validates/coerces streamed parameters through `savingsMath.ts`.
5. `web/src/viz/SavingsComparison.tsx`: renders a line chart, results table, horizon selector, and five sliders.
6. `shared/savingsProjection.ts`: server and browser use the same function. Changing a slider recalculates locally, without another agent request.

The tool descriptions are registered per session, so this addition does not require editing or re-provisioning the hosted agent. Restart the server after changing its code; the development watcher handles that automatically.

## Explain the calculation

All rates are effective annual assumptions. For both HYSA APY and the hypothetical annual stock return:

```
monthly factor = (1 + annual percent / 100)^(1/12)
next balance = current balance × monthly factor + monthly contribution
contributed = starting amount + monthly contribution × months
gain or loss = ending balance − contributed
```

The contribution is added at month-end. This is a smooth hypothetical path, not a model of real stock volatility. Different return sequences can produce different outcomes when making deposits. HYSA APY is assumed unchanged; it is not a current rate quote or guaranteed future interest. No particular bank or insurance eligibility is verified. Taxes, fees, inflation, and withdrawals are excluded.

## Three-minute demonstration

Paste this prompt:

> Compare stocks versus a HYSA starting with $5,000 and adding $300 monthly for 6 months. Use an illustrative 4% HYSA APY and hypothetical annual stock scenarios of -20%, 0%, and 10%. Show the interactive savings versus investing tool and summarize its calculated results.

Expected chart balances (whole-dollar display):

| Scenario | 6 months | 12 months |
| --- | ---: | ---: |
| HYSA 4% APY | $6,914 | $8,866 |
| Stocks -20% annual | $6,191 | $7,257 |
| Stocks 0% | $6,800 | $8,600 |
| Stocks +10% annual | $7,080 | $9,262 |
| Total deposited | $6,800 | $8,600 |

1. Explain that Claude chose the component and supplied inputs; code computed the balances.
2. Switch to 12 months. The title, table, and chart should update together.
3. Set monthly contribution to $0 and HYSA APY to 0%. At 12 months, HYSA and flat stocks should remain $5,000, downside should be $4,000, and upside $5,500.
4. Explain why a downside balance can rise while still showing a loss when deposits are nonzero: additional deposits can outweigh investment losses. Gain/loss is measured against all money deposited.
5. Restore $300/month, 4% APY, and 6 months.

## Testing

Run from the repository root:

```
npm test
npm run typecheck
npm run build
```

Twelve automated tests cover APY conversion at both horizons, zero returns, month-end deposit timing, an independent annuity formula, negative returns, empty balances, invalid inputs, schema coercion/bounds, and equality between the server result and browser calculation.

Browser checks cover live agent tool selection/rendering, 6/12-month switching, monthly-contribution and APY controls, and the zero-input scenario above. The existing large-bundle Vite warning is non-blocking.

## Demo questions

**Why not just use a general chatbot?** A general chatbot can answer this question. Our project demonstrates embedding an agent in an application, rendering structured tool calls as interactive components, and verifying the calculations with repeatable tests.

**Are these forecasts?** No. They are user-editable scenarios with no assigned probabilities. Real losses or gains can exceed the chosen scenarios.

**Does Claude know when I move a slider?** No. Its reply describes the original tool inputs. Local changes are explicitly labelled as local; sending them back is outside this feature's scope.

**Is every starter tool independently calculated?** No. The existing generic comparison tool displays agent-provided values. Our new comparison tool computes balances in shared application code and supplies those results to the agent.

## Display preference within the same chat

Use “remove stocks” for `displayMode: hysa`, “remove HYSA” for `displayMode: stocks`, or “show both” for `displayMode: both`. Follow-up questions should retain the most recent explicit mode via managed-session conversation context. Each agent call creates a new chart; older charts retain their own state. This is conversation context, not a persistent profile or a guarantee about every possible model response. New chats and server restarts may lose the preference.

The local Display selector changes only that card. It does not send a preference to the agent. State preferences in chat to affect future responses. Hidden rates are retained as assumptions so showing both again can reuse them.

Preference demo: request stocks only for six months → “What about twelve months?” → “Remove stocks; show HYSA only” → “What about six months?” → “Show both again” → “What about twelve months?” Check the latest chart and verify the previous cards do not change.

Live browser verification on November 12, 2026: the six-turn sequence above produced modes `stocks, stocks, hysa, hysa, both, both`. Earlier chart selectors retained their original modes, confirming that new chat requests did not mutate old cards. All twelve automated tests, workspace typechecks, and the production build passed.
