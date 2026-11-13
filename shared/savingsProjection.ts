/** Constant effective monthly growth, contributions at month-end; no taxes/fees.
 * Stock paths are illustrative scenarios, not forecasts or probability bounds.
 */
export function projectBalance(initial: number, monthly: number, annualPercent: number, months: number) {
  if (![initial, monthly, annualPercent, months].every(Number.isFinite) || initial < 0 || monthly < 0 || annualPercent <= -100 || !Number.isInteger(months) || months < 1 || months > 12) {
    throw new RangeError('Invalid projection inputs');
  }
  const factor = (1 + annualPercent / 100) ** (1 / 12);
  const balances = [initial];
  let balance = initial;
  for (let month = 1; month <= months; month++) {
    balance = balance * factor + monthly;
    balances.push(balance);
  }
  const contributed = initial + monthly * months;
  return { balances, balance, contributed, gain: balance - contributed };
}
