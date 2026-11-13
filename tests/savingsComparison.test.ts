import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectBalance, savingsComparisonSchema } from '../web/src/viz/savingsMath.ts';
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
test('APY yields exactly 4% after a year, not nominal monthly compounding', () => close(projectBalance(5000, 0, 4, 12).balance, 5200));
test('six-month APY uses the square root of the annual factor', () => close(projectBalance(5000, 0, 4, 6).balance, 5000 * Math.sqrt(1.04)));
test('zero return preserves all deposits for both horizons', () => {
  for (const months of [6, 12]) {
    const result = projectBalance(5000, 300, 0, months);
    close(result.balance, 5000 + 300 * months); close(result.gain, 0);
  }
});
test('deposits earn growth only after the deposit month', () => {
  close(projectBalance(100, 50, 12, 1).balance, 100 * 1.12 ** (1 / 12) + 50);
});
test('monthly deposits match the independent annuity formula', () => {
  const r = 1.04 ** (1 / 12) - 1;
  close(projectBalance(5000, 300, 4, 12).balance, 5000 * 1.04 + 300 * (1.04 - 1) / r);
});
test('negative stock scenario produces loss and a positive remaining balance', () => {
  const result = projectBalance(5000, 0, -20, 12);
  close(result.balance, 4000); close(result.gain, -1000);
});
test('empty account and zero contribution remain zero', () => close(projectBalance(0, 0, 10, 6).balance, 0));
test('invalid numerical inputs fail explicitly', () => {
  for (const args of [[-1, 0, 4, 6], [0, -1, 4, 6], [0, 0, -100, 6], [NaN, 0, 4, 6], [0, 0, Infinity, 6], [0, 0, 4, 6.5], [0, 0, 4, 13]]) {
    assert.throws(() => projectBalance(...args as [number, number, number, number]), RangeError);
  }
});
test('tool payload coerces strings and rejects unsupported horizons/rates', () => {
  const args = { initialAmount: '5000', monthlyContribution: '300', months: '6', hysaApyPercent: '4', stockDownsidePercent: '-20', stockUpsidePercent: '10' };
  assert.equal(savingsComparisonSchema.parse(args).months, 6);
  for (const patch of [{ months: 9 }, { hysaApyPercent: -1 }, { stockDownsidePercent: 5 }, { stockUpsidePercent: -10 }]) {
    assert.equal(savingsComparisonSchema.safeParse({ ...args, ...patch }).success, false);
  }
});

test('agent tool returns the same numbers as the chart and rejects invalid input', async () => {
  const { vizTools } = await import('../server/src/vizTools.ts');
  const tool = vizTools.find((tool) => tool.name === 'show_savings_vs_investing')!;
  const args = { initialAmount: 5000, monthlyContribution: 300, months: 6, hysaApyPercent: 4, stockDownsidePercent: -20, stockUpsidePercent: 10 };
  const result = JSON.parse(await tool.handler(args));
  assert.equal(result.results[0].balance, 6913.82);
  assert.equal(result.results[1].balance, 6191.24);
  assert.match(await tool.handler({ ...args, months: 9 }), /Invalid/);
});

test('HYSA-only tool result excludes stocks and preserves the HYSA calculation', async () => {
  const { vizTools } = await import('../server/src/vizTools.ts');
  const tool = vizTools.find((tool) => tool.name === 'show_savings_vs_investing')!;
  const args = { initialAmount: 5000, monthlyContribution: 300, months: 6, hysaApyPercent: 4, stockDownsidePercent: 0, stockUpsidePercent: 0, includeStocks: false };
  assert.equal(savingsComparisonSchema.parse(args).includeStocks, false);
  const result = JSON.parse(await tool.handler(args));
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].label, 'HYSA');
  assert.equal(result.results[0].balance, 6913.82);
  assert.match(await tool.handler({ ...args, includeStocks: 'false' }), /Invalid/);
});

test('all display modes return exactly the requested scenarios', async () => {
  const { vizTools } = await import('../server/src/vizTools.ts');
  const tool = vizTools.find((tool) => tool.name === 'show_savings_vs_investing')!;
  const args = { initialAmount: 5000, monthlyContribution: 300, months: 12, hysaApyPercent: 4, stockDownsidePercent: -20, stockUpsidePercent: 10 };
  for (const [displayMode, expected] of [['both', 4], ['hysa', 1], ['stocks', 3]] as const) {
    assert.equal(savingsComparisonSchema.parse({ ...args, displayMode }).displayMode, displayMode);
    const result = JSON.parse(await tool.handler({ ...args, displayMode }));
    assert.equal(result.results.length, expected);
    assert.equal(result.results.some((r: {label: string}) => r.label === 'HYSA'), displayMode !== 'stocks');
  }
  assert.match(await tool.handler({ ...args, displayMode: 'neither' }), /Invalid/);
  assert.equal(savingsComparisonSchema.safeParse({ ...args, displayMode: 'neither' }).success, false);
});
