import React, { useState } from 'react';
import { z } from 'zod';
import { savingsGoal } from '../../../shared/savingsGoal';
import { fmtUsd, fmtMonths } from './theme';
import { ExplainScenario } from './ExplainCurrentScenario';

export const savingsGoalSchema = z.object({
  targetAmount: z.coerce.number().min(0.01).max(10000000),
  currentSavings: z.coerce.number().min(0).max(10000000),
  monthlyContribution: z.coerce.number().min(0).max(10000000),
});
export const SavingsGoal: React.FC<z.infer<typeof savingsGoalSchema>> = (props) => {
  const [monthly, setMonthly] = useState(props.monthlyContribution);
  const result = savingsGoal(props.targetAmount, props.currentSavings, monthly);
  return <section className="viz-card" aria-label="Savings goal planner">
    <h4>Savings goal · {fmtUsd(props.targetAmount)}</h4>
    <p>{fmtUsd(props.currentSavings)} saved · {fmtUsd(result.remaining)} remaining</p>
    <progress aria-label="Savings goal progress" max={100} value={result.progressPercent} style={{width:'100%'}} />
    <p><strong>{result.months === 0 ? 'Goal already reached' : result.months === null ? 'No completion date at $0/month' : `Goal reached in ${fmtMonths(result.months)}`}</strong></p>
    <label className="viz-slider">Monthly savings: <b>{fmtUsd(monthly)}</b><input aria-label="Monthly savings" type="range" min={0} max={Math.min(10000000, Math.max(1000, props.monthlyContribution * 3))} step={25} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} /></label>
    <p className="viz-sub">Assumes steady monthly deposits, no interest, fees, or withdrawals. Amounts are calculated to cents; displayed dollars are rounded.</p>
    <ExplainScenario scenario={{type:'savings_goal', targetAmount:props.targetAmount, currentSavings:props.currentSavings, monthlyContribution:monthly, ...result, assumptions:'No interest, fees, or withdrawals. Null months means unreachable at the current contribution.'}} />
  </section>;
};
