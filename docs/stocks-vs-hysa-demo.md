# Finance Assistant: team additions and demo walkthrough

## What we added

The comparison tool, `show_savings_vs_investing`, compares a HYSA with three hypothetical stock paths over 6 or 12 months. The existing four finance tools remain. No live market data, ticker predictions, or bank-rate lookup is needed.

The starter supplied chat, the Express/CopilotKit runtime, the AG-UI adapter, existing charts, and the tool-rendering pattern. Our contributions are the Stocks vs. HYSA tool with conversation display modes, the Savings Goal Planner, and the Explain my current scenario action. There are six backend finance tools total: four original tools and two new tools. Explain is a UI action, not another backend tool. We also added shared deterministic calculations, validation, tests, and a stable growth-chart title.

## Full presentation walkthrough (about five minutes, plus model response time)

Before recording, open http://localhost:5173 with both development servers running. Use a fresh chat so old preferences do not affect the demonstration. If servers are stopped, run `npm run dev` from the root; do not launch duplicate servers on the same ports. Authenticate with `ant auth login` if your credentials expired.

| Step | What to do | What to explain |
| --- | --- | --- |
| 1. Introduce | Show the chat page | “The starter supplied chat, streaming, an agent connection, and four visual tools. We added two tools and an explicit chart-to-chat action.” |
| 2. Compare | Paste the Stocks vs. HYSA prompt below | “Claude chooses the tool and inputs; our code calculates the results. These are scenarios, not predictions.” |
| 3. Interact | Switch the chart horizon from 6 to 12 months | “This recalculates locally without a model request; the original assistant text does not change.” |
| 4. Set preference | Say “Remove stocks; show HYSA only.” Then “What about six months?” | “The preference carries into the next turn of this chat. Older charts remain unchanged. It is not a permanent user profile.” |
| 5. Plan a goal | Say “I have $500 saved toward $3,000 and can save $250/month. Show the savings goal planner without interest.” | “Our second tool calculates $2,500 remaining and 10 months, using a simple no-interest model.” |
| 6. Send current state | Move the goal slider to $500/month, then click Explain my current scenario | “The card now says five months. This button explicitly sends the current inputs and results as a new user message. The assistant explains the updated scenario without resetting the card.” |
| 7. Show verification | Run `npm test`, show the test summary, and point to the shared math files | “Eighteen automated tests cover our calculations and contracts. We also verified tool rendering and preference changes in the browser.” |

Optional, if time allows: show the original growth chart, change $500/month to $750/month and use Explain. The updated projection is about $390,695 over 20 years at the starter's assumed 7% nominal annual rate.

Close with: “We are demonstrating tested interactive agent integration, not a financial prediction service. Live rates, permanent profiles, authentication, and public deployment are outside this submission.”

## Before submitting

- Rehearse the sequence yourself and record the demo.
- Add the recording link and any required submission artifacts.
- Finish documented live regression checks for the original budget and generic comparison tools. Debt payoff was exercised through its starter question.
- If cost/latency evidence is required, measure it; do not present estimates as recorded usage.
- A forced network-failure UI test remains outstanding.
- Review and merge the feature branch if main is the submission branch. Do not assume pushing a feature branch merges it.

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

Eighteen automated tests cover APY conversion at both horizons, zero returns, month-end deposit timing, an independent annuity formula, negative returns, empty balances, invalid inputs, schema coercion/bounds, and equality between the server result and browser calculation.

Browser checks cover live agent tool selection/rendering, 6/12-month switching, monthly-contribution and APY controls, and the zero-input scenario above. The existing large-bundle Vite warning is non-blocking.

## Demo questions

**Why not just use a general chatbot?** A general chatbot can answer this question. Our project demonstrates embedding an agent in an application, rendering structured tool calls as interactive components, and verifying the calculations with repeatable tests.

**Are these forecasts?** No. They are user-editable scenarios with no assigned probabilities. Real losses or gains can exceed the chosen scenarios.

**Does Claude know when I move a slider?** Not automatically. Click “Explain my current scenario” to send the current inputs and calculated results as a new user message. This is available on growth, Stocks vs. HYSA, and savings-goal cards.

**Is every starter tool independently calculated?** No. The existing generic comparison tool displays agent-provided values. Our new comparison tool computes balances in shared application code and supplies those results to the agent.

## Display preference within the same chat

Use “remove stocks” for `displayMode: hysa`, “remove HYSA” for `displayMode: stocks`, or “show both” for `displayMode: both`. Follow-up questions should retain the most recent explicit mode via managed-session conversation context. Each agent call creates a new chart; older charts retain their own state. This is conversation context, not a persistent profile or a guarantee about every possible model response. New chats and server restarts may lose the preference.

The local Display selector changes only that card. It does not send a preference to the agent. State preferences in chat to affect future responses. Hidden rates are retained as assumptions so showing both again can reuse them.

Preference demo: request stocks only for six months → “What about twelve months?” → “Remove stocks; show HYSA only” → “What about six months?” → “Show both again” → “What about twelve months?” Check the latest chart and verify the previous cards do not change.

Live browser verification on November 12, 2026: the six-turn sequence above produced modes `stocks, stocks, hysa, hysa, both, both`. Earlier chart selectors retained their original modes, confirming that new chat requests did not mutate old cards. All twelve automated tests, workspace typechecks, and the production build passed.

## Additional extensions

### Savings Goal Planner

New tool: `show_savings_goal`. Prompt: “I have $500 saved toward $3,000 and can save $250/month. Show the savings goal planner without interest.” Expected: $2,500 remaining, 10 months. Move monthly savings to $500: 5 months. Set it to zero: no completion date. Already-reached goals report 0 months. No interest, fees or withdrawals; money is rounded to cents before arithmetic.

Files: `shared/savingsGoal.ts` (math), `server/src/vizTools.ts` (agent contract and result), `web/src/viz/SavingsGoal.tsx` (UI), `web/src/viz/renderers.tsx` (registration).

### Explain my current scenario

The button on growth, Stocks vs. HYSA, and savings-goal cards sends a NEW user message through the existing CopilotKit agent, containing current inputs, computed outputs and assumptions. It is a UI action, not a seventh backend tool. It requests a short text explanation rather than another chart. The source card is preserved. It is disabled while the agent is busy, guards rapid repeat clicks, and shows an error on a rejected request while leaving calculations usable. Forced connection-failure and recovery checks passed on November 13, 2026; see the verification section below.

Files: `web/src/viz/ExplainCurrentScenario.tsx` (message submission), `web/src/viz/scenarioMessage.ts` (payload), plus the three card components. The growth title now uses a stable label and the actual calculation horizon rather than an agent-generated title that could retain stale amounts.

Automated coverage adds goal rounding, reached/zero-contribution cases, cent precision, invalid values, backend results, and serialization of current rather than initial inputs.

Live extension checks: the savings goal changed from 10 to 5 months when its contribution changed from $250 to $500; Explain sent and explained the updated five-month result without resetting the card. Growth Explain sent $750/month and $390,694.99 after the slider change. HYSA Explain sent only the visible HYSA result with $500/month and $8,123.68.

## Suggested questions before the first message

`web/src/StarterQuestions.tsx` registers six static CopilotKit suggestions, scoped to `financial-assistant` and available only `before-first-message`. `App.tsx` mounts this component inside the provider. The buttons are Compare stocks and savings, Plan a savings goal, Explore debt payoff, Project investment growth, Break down my budget, and Compare savings scenarios. Clicking one fills and focuses the editable message box. Only Send or Enter submits the draft; buttons disappear once the conversation starts. These are predefined prompts, so generating them does not consume model calls. Submitting the draft still starts a normal paid agent turn.

For the demo, click Compare stocks and savings instead of pasting the first prompt. Start a fresh chat to show the other starter buttons.

Earlier immediate-send version: verified four buttons in fresh browser chats: debt payoff rendered a 20-month plan; the savings goal rendered 10 months; investment growth rendered $260,463; Stocks vs. HYSA rendered all four six-month scenarios. Each click sent its configured message and hid the starter buttons. Typechecking and production build passed.

## Final browser verification — November 13, 2026

- Budget breakdown: income $3,000, rent $1,200, groceries $400, transport $200, utilities $150, savings $500. The card showed $550 unallocated (18% rounded).
- Over-budget case: income $1,000, rent $900, food $300. The card showed $200 over budget (20%).
- Generic scenario comparison: supplied Option A $1,000 and Option B $1,500 with dollar units. Both labels, values, and bars rendered. This tool displays supplied values rather than computing projections.
- Explanation failure: stopped the local backend after rendering a savings-goal card, then clicked Explain. The original implementation silently swallowed the failed request because CopilotKit reports failures through events as well as promise rejection. Added scoped failure-event subscriptions.
- Button recovery: fixed stale disabled state by tracking agent lifecycle events directly. Previously, the button could remain disabled until a slider caused another render.
- Retest with backend stopped: a visible error appeared and the button became available again. Moving monthly savings to $0 still recalculated the card to “No completion date.”
- Recovery: restarted the backend and clicked Explain again. The error cleared, the current $0/month values were sent, and the assistant explained the unreachable goal. The chart retained its state and the button became available after completion.

Reproduce the failure test only against your local dev server: generate a goal card, stop the backend while keeping the frontend open, click Explain, change a slider, restart the backend, then click Explain again. Failed attempts remain visible as user messages; retry sends the current card state as a new message.

Validation: all 18 automated tests, both workspace typechecks, and the production build passed. Vite still reports its existing large-chunk warning. These are manual browser checks, not automated end-to-end tests. Model prose can include additional illustrative assumptions despite the prompt, so use the card's calculated figures as the demo's numerical source of truth.

Current editable-suggestion verification: all six buttons populated the draft without sending. Edited the budget prompt to $500 groceries, pressed Send, and verified the rendered chart used $500 groceries and showed $500 unallocated.
