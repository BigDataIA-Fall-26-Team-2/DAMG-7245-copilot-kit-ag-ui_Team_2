/**
 * Generative-UI tools: custom tools the agent calls with the numbers it wants
 * to show. Registered on each session by @ag-ui/claude-managed-agents as
 * backend tools: the adapter streams each call to the browser as AG-UI
 * TOOL_CALL events, CopilotKit renders it as an interactive React component
 * (see web/src/viz), and the handler's ack goes back to the session so the
 * turn keeps flowing. The rendering IS the result, so the handlers ignore
 * their input and just confirm.
 */
import { projectBalance } from '../../shared/savingsProjection.ts';
import type { BackendCustomTool } from '@ag-ui/claude-managed-agents';

const rendered = (name: string) => () =>
  `Rendered "${name}" to the user as an interactive visual.`;

export const vizTools: BackendCustomTool[] = [
  {
    name: 'show_savings_vs_investing',
    description: 'Render 6/12-month savings/investing projections. Set displayMode="hysa" for "remove stocks" or "HYSA only"; "stocks" for "remove HYSA" or "stocks only"; "both" for "show both". Keep the most recent explicit preference on follow-up questions in this same conversation until the user changes it. Use this tool for all three modes, even stock-only follow-ups. Each call creates a NEW chart; never claim to modify old charts. Retain prior amounts and rate assumptions unless changed; hidden rates are still inputs for later comparison. Rates are effective ANNUAL percentages, not horizon returns. Ask for missing starting amount/contribution. If rates are unspecified, label 4% HYSA APY, -20% stock downside and 10% upside as illustrative assumptions, not current rates or forecasts. Do not recommend stocks or imply guarantees/probabilities. Call directly, not inside repl.',

    parameters: {
      type: 'object',
      properties: {
        displayMode: { type: 'string', enum: ['both', 'hysa', 'stocks'], description: 'Use the latest explicit display preference from this conversation; default both when none.' },
        includeStocks: { type: 'boolean', description: 'False hides all stock scenarios; honor the user preference from earlier turns. Defaults to true.' },
        initialAmount: { type: 'number', minimum: 0, maximum: 10000000 },
        monthlyContribution: { type: 'number', minimum: 0, maximum: 100000 },
        months: { type: 'integer', enum: [6, 12] },
        hysaApyPercent: { type: 'number', minimum: 0, maximum: 20 },
        stockDownsidePercent: { type: 'number', minimum: -99, maximum: 0 },
        stockUpsidePercent: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['initialAmount', 'monthlyContribution', 'months', 'hysaApyPercent', 'stockDownsidePercent', 'stockUpsidePercent'],
    },
    handler: (input) => {
      const args = input as Record<string, unknown>;
      const names = ['initialAmount', 'monthlyContribution', 'months', 'hysaApyPercent', 'stockDownsidePercent', 'stockUpsidePercent'];
      if (!args || names.some((key) => typeof args[key] !== 'number' || !Number.isFinite(args[key]))) return 'Invalid comparison inputs: provide finite numbers for all six parameters.';
      const { initialAmount: initial, monthlyContribution: monthly, months, hysaApyPercent: apy, stockDownsidePercent: downside, stockUpsidePercent: upside } = args as Record<string, number>;
      if (initial! < 0 || initial! > 10000000 || monthly! < 0 || monthly! > 100000 || ![6, 12].includes(months!) || apy! < 0 || apy! > 20 || downside! < -99 || downside! > 0 || upside! < 0 || upside! > 100) return 'Invalid comparison inputs: use the tool schema bounds.';
      if (args.includeStocks !== undefined && typeof args.includeStocks !== 'boolean') return 'Invalid includeStocks: use a boolean.';
      const mode = args.displayMode ?? (args.includeStocks === false ? 'hysa' : 'both');
      if (!['both', 'hysa', 'stocks'].includes(String(mode))) return 'Invalid displayMode: choose both, hysa or stocks.';
      const results = [['HYSA', apy!], ['Stocks downside', downside!], ['Stocks flat', 0], ['Stocks upside', upside!]].filter(([label]) => label === 'HYSA' ? mode !== 'stocks' : mode !== 'hysa').map(([label, rate]) => {
        const result = projectBalance(initial!, monthly!, Number(rate), months!);
        return { label, annualPercent: rate, balance: Number(result.balance.toFixed(2)), contributed: result.contributed, gain: Number(result.gain.toFixed(2)) };
      });
      return JSON.stringify({ months, displayMode: mode, results, preference: `Current preference: ${mode}. Keep this mode for follow-up questions in this chat until explicitly changed. Explain only the displayed scenarios. Older charts are unchanged.`, instructions: 'Use these exact calculated results for the original inputs, not mental estimates. HYSA assumes unchanged APY, not guaranteed interest; no bank or insurance eligibility has been verified. Stock paths are hypothetical, not forecasts, probability bounds or recommendations. Deposits occur at month-end; taxes, fees and inflation excluded. User slider changes remain local and do not update these original results.' });
    },
  },
  {
    name: 'show_payoff_timeline',
    description:
      'Render an interactive debt-payoff chart in the chat: remaining balance by month, ' +
      'payoff date, and total interest, with a payment slider the user can drag to explore ' +
      '"what if I paid more". Use whenever you discuss paying down a specific debt. ' +
      'Pass a comparisonPayment to contrast two plans (e.g. minimum vs aggressive).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short chart title, e.g. "Credit card payoff"' },
        principal: { type: 'number', exclusiveMinimum: 0, description: 'Current balance in dollars' },
        aprPercent: { type: 'number', minimum: 0, maximum: 100, description: 'Annual interest rate, e.g. 22 for 22% APR' },
        monthlyPayment: { type: 'number', exclusiveMinimum: 0, description: 'Planned monthly payment in dollars' },
        comparisonPayment: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Optional second payment amount to compare against',
        },
      },
      required: ['title', 'principal', 'aprPercent', 'monthlyPayment'],
    },
    handler: rendered('show_payoff_timeline'),
  },
  {
    name: 'show_growth_projection',
    description:
      'Render an interactive compound-growth chart in the chat: projected value over the ' +
      'years versus total contributed, with sliders for monthly contribution and return rate. ' +
      'Use whenever you discuss investing, retirement pace, or "what will this grow to".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short chart title, e.g. "Roth IRA at 7%"' },
        initialAmount: { type: 'number', minimum: 0, description: 'Starting balance in dollars' },
        monthlyContribution: { type: 'number', minimum: 0, description: 'Monthly contribution in dollars' },
        annualReturnPercent: { type: 'number', minimum: 0, maximum: 30, description: 'Assumed annual return, e.g. 7' },
        years: { type: 'integer', minimum: 1, maximum: 50, description: 'Projection horizon in years' },
      },
      required: ['title', 'initialAmount', 'monthlyContribution', 'annualReturnPercent', 'years'],
    },
    handler: rendered('show_growth_projection'),
  },
  {
    name: 'show_budget_breakdown',
    description:
      'Render a budget bar chart in the chat: each spending category as a share of monthly ' +
      'income, with anything unallocated shown as a remainder. Use when reviewing how ' +
      "someone's income is divided or proposing a budget.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short chart title, e.g. "Monthly budget"' },
        monthlyIncome: { type: 'number', exclusiveMinimum: 0, description: 'Monthly take-home income in dollars' },
        items: {
          type: 'array',
          description: 'Spending categories; keep to at most 8',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Category name, e.g. "Rent"' },
              amount: { type: 'number', description: 'Monthly dollars' },
            },
            required: ['category', 'amount'],
          },
        },
      },
      required: ['title', 'monthlyIncome', 'items'],
    },
    handler: rendered('show_budget_breakdown'),
  },
  {
    name: 'show_comparison',
    description:
      'Render a small bar comparison of 2-5 scenarios in the chat, e.g. total interest under ' +
      'avalanche vs snowball, or renting vs buying over five years. Use when the point is ' +
      '"option A vs option B" and a number captures each option.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short chart title' },
        unit: {
          type: 'string',
          enum: ['dollars', 'months', 'percent'],
          description: 'Unit of the values',
        },
        options: {
          type: 'array',
          description: '2-5 scenarios to compare',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Scenario name' },
              value: { type: 'number', description: 'The number to compare' },
              note: { type: 'string', description: 'Optional one-line note' },
            },
            required: ['label', 'value'],
          },
        },
      },
      required: ['title', 'unit', 'options'],
    },
    handler: rendered('show_comparison'),
  },
];
