/** No interest, fees, or withdrawals. Money is rounded to cents. */
export function savingsGoal(targetAmount: number, currentSavings: number, monthlyContribution: number) {
  if (![targetAmount, currentSavings, monthlyContribution].every(Number.isFinite) || targetAmount <= 0 || currentSavings < 0 || monthlyContribution < 0 || Math.max(targetAmount, currentSavings, monthlyContribution) > 10000000) throw new RangeError('Use a positive target and nonnegative amounts up to $10 million.');
  const target = Math.round(targetAmount * 100);
  const current = Math.round(currentSavings * 100);
  const monthly = Math.round(monthlyContribution * 100);
  if (target === 0) throw new RangeError('Target must be at least one cent.');
  const remaining = Math.max(0, target - current);
  return { remaining: remaining / 100, months: remaining === 0 ? 0 : monthly === 0 ? null : Math.ceil(remaining / monthly), progressPercent: Math.min(100, current / target * 100) };
}
