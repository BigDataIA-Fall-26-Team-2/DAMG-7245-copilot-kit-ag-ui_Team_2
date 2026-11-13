import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payoffSchedule } from '../web/src/viz/finance.ts';

test('lowering debt APR reduces payoff time and interest at the same payment', () => {
  const high = payoffSchedule(5000, 20, 300);
  const low = payoffSchedule(5000, 10, 300);
  const zero = payoffSchedule(5000, 0, 300);
  assert.ok(low.months < high.months);
  assert.ok(low.totalInterest < high.totalInterest);
  assert.equal(zero.months, 17);
  assert.equal(zero.totalInterest, 0);
});

test('raising APR can make an unchanged payment insufficient', () => {
  assert.equal(payoffSchedule(5000, 10, 100).paysOff, true);
  const insufficient = payoffSchedule(5000, 40, 100);
  assert.equal(insufficient.paysOff, false);
  assert.equal(insufficient.coversInterest, false);
  assert.ok(insufficient.balances.at(-1)! > 5000);
});

test('increasing the what-if payment restores payoff at the new APR', () => {
  const result = payoffSchedule(5000, 40, 300);
  assert.equal(result.paysOff, true);
  assert.equal(result.coversInterest, true);
  assert.equal(result.balances.at(-1), 0);
});

test('debt tool supplies chart-exact results and rejects invalid payments', async () => {
  const { vizTools } = await import('../server/src/vizTools.ts');
  const tool = vizTools.find(t => t.name === 'show_payoff_timeline')!;
  const args = { title: 'Debt', principal: 5000, aprPercent: 20, monthlyPayment: 300 };
  const result = JSON.parse(await tool.handler(args));
  assert.equal(result.plan.months, 20);
  assert.equal(result.plan.totalInterestInProjection, 906.81);
  assert.match(await tool.handler({ ...args, monthlyPayment: 0 }), /Invalid/);
  assert.match(await tool.handler({ ...args, aprPercent: Infinity }), /Invalid/);
  assert.match(await tool.handler({ ...args, comparisonPayment: -1 }), /Invalid/);
  assert.equal(JSON.parse(await tool.handler({ ...args, comparisonPayment: 1 })).comparison.months, null);
});
