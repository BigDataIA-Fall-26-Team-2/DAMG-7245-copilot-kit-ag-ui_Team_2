/**
 * Interactive debt payoff: balance-over-time lines for the agent's plan and a
 * draggable what-if payment, with payoff time and total interest stat tiles.
 */
import React, { useMemo, useState } from 'react';
import { payoffSchedule, minimumViablePayment, type PayoffResult } from './finance';
import { ExplainScenario } from './ExplainCurrentScenario';
import { LineChart } from './LineChart';
import { SERIES, fmtUsd, fmtUsdCompact, fmtMonths } from './theme';

export interface PayoffArgs {
  title: string;
  principal: number;
  aprPercent: number;
  monthlyPayment: number;
  comparisonPayment?: number;
}

const payoffLabel = (r: PayoffResult): string =>
  r.paysOff ? fmtMonths(r.months)
  : r.coversInterest ? '50+ years'
  : 'never pays off';

export const PayoffTimeline: React.FC<PayoffArgs> = ({
  title,
  principal,
  aprPercent,
  monthlyPayment,
  comparisonPayment,
}) => {
  const [apr, setApr] = useState(aprPercent);
  const minPay = minimumViablePayment(principal, aprPercent);
  const maxPay = Math.max(
    monthlyPayment * 3,
    comparisonPayment ?? 0,
    Math.ceil(principal / 6),
    minPay + 100,
  );
  // Clamp into the slider's range so the thumb position never lies.
  const [whatIf, setWhatIf] = useState(() =>
    Math.min(maxPay, Math.max(minPay, comparisonPayment ?? monthlyPayment)),
  );

  const plan = useMemo(
    () => payoffSchedule(principal, apr, monthlyPayment),
    [principal, apr, monthlyPayment],
  );
  const alt = useMemo(
    () => payoffSchedule(principal, apr, whatIf),
    [principal, apr, whatIf],
  );
  const showAlt = whatIf !== monthlyPayment;

  return (
    <div className="viz-card">
      <h4>Debt payoff</h4>
      <p className="viz-sub">
        {fmtUsd(principal)} at {apr}% APR
      </p>
      <div className="viz-stats">
        <div>
          <span className="viz-stat-label">Plan: {fmtUsd(monthlyPayment)}/mo</span>
          <span className="viz-stat-value" style={{ color: SERIES.blue }}>
            {payoffLabel(plan)}
          </span>
          <span className="viz-stat-note">{fmtUsd(plan.totalInterest)} interest{!plan.paysOff && ` over ${plan.months} projected months`}</span>
        </div>
        {showAlt && (
          <div>
            <span className="viz-stat-label">What-if: {fmtUsd(whatIf)}/mo</span>
            <span className="viz-stat-value" style={{ color: SERIES.yellow }}>
              {payoffLabel(alt)}
            </span>
            <span className="viz-stat-note">
              {fmtUsd(alt.totalInterest)} interest{!alt.paysOff && ` over ${alt.months} projected months`}
              {plan.paysOff && alt.paysOff && alt.totalInterest < plan.totalInterest ?
                ` (saves ${fmtUsd(plan.totalInterest - alt.totalInterest)})`
              : ''}
            </span>
          </div>
        )}
      </div>
      <LineChart
        series={[
          { label: `${fmtUsd(monthlyPayment)}/mo`, color: SERIES.blue, values: plan.balances, area: !showAlt },
          ...(showAlt ? [{ label: `${fmtUsd(whatIf)}/mo`, color: SERIES.yellow, values: alt.balances }] : []),
        ]}
        fmtX={(m) => (m % 12 === 0 ? `Yr ${m / 12}` : `${m}mo`)}
        fmtY={fmtUsdCompact}
      />
      <label className="viz-slider">
        Annual interest rate (APR): <b>{apr}%</b>
        <input aria-label="Debt APR" type="range" min={0} max={Math.max(40, aprPercent)} step={0.5}
          value={apr} onChange={(e) => setApr(Number(e.target.value))} />
      </label>
      <label className="viz-slider">
        What if I paid <b>{fmtUsd(whatIf)}</b>/month?
        <input
          type="range"
          aria-label="What-if monthly payment"
          min={1}
          max={maxPay}
          step={1}
          value={whatIf}
          onChange={(e) => setWhatIf(Number(e.target.value))}
        />
      </label>
      {!alt.coversInterest && <p role="status" className="viz-sub">This what-if payment does not exceed monthly interest. The debt will not be paid off at these settings.</p>}
      <p className="viz-sub">Assumes a constant APR, monthly interest, and no new charges or fees. Changing APR recalculates both payment plans. Slider changes stay local until you request an explanation.</p>
      <ExplainScenario scenario={{ type: 'debt_payoff', principal, aprPercent: apr,
        plan: { monthlyPayment, months: plan.paysOff ? plan.months : null, totalInterestInProjection: plan.totalInterest, projectionMonths: plan.months, paysOff: plan.paysOff, coversInterest: plan.coversInterest },
        whatIf: { monthlyPayment: whatIf, months: alt.paysOff ? alt.months : null, totalInterestInProjection: alt.totalInterest, projectionMonths: alt.months, paysOff: alt.paysOff, coversInterest: alt.coversInterest },
        assumptions: 'Constant APR divided by 12, monthly payments, no new charges or fees. Null months means no payoff within the projection, not a payoff date. Interest totals cover the projection only when payoff is not reached; projection capped at 600 months.' }} />
    </div>
  );
};
