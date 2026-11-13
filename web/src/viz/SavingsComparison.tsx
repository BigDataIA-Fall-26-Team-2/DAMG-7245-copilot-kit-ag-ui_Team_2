import React, { useState } from 'react';
import { projectBalance, type SavingsComparisonArgs } from './savingsMath';
import { ExplainScenario } from './ExplainCurrentScenario';
import { LineChart } from './LineChart';
import { fmtUsd, fmtUsdCompact, SERIES } from './theme';

export const SavingsComparison: React.FC<SavingsComparisonArgs> = (props) => {
  const [values, setValues] = useState(props);
  const [mode, setMode] = useState(props.displayMode ?? (props.includeStocks === false ? 'hysa' : 'both'));
  const showStocks = mode !== 'hysa';
  const showHysa = mode !== 'stocks';
  const update = (key: Exclude<keyof SavingsComparisonArgs, 'includeStocks' | 'displayMode'>, value: number) => setValues((old) => ({ ...old, [key]: value }));
  const scenarios = [
    { label: 'HYSA', rate: values.hysaApyPercent, color: SERIES.blue },
    { label: 'Stocks: downside', rate: values.stockDownsidePercent, color: '#a43d48' },
    { label: 'Stocks: flat', rate: 0, color: '#6f6a5f' },
    { label: 'Stocks: upside', rate: values.stockUpsidePercent, color: SERIES.aqua },
  ].filter((s) => s.label === 'HYSA' ? showHysa : showStocks).map((s) => ({ ...s, ...projectBalance(values.initialAmount, values.monthlyContribution, s.rate, values.months) }));
  const slider = (key: Exclude<keyof SavingsComparisonArgs, 'includeStocks' | 'displayMode'>, label: string, min: number, max: number, step: number, money = false) => (
    <label className="viz-slider">
      {label}: <b>{money ? fmtUsd(values[key]) : `${values[key]}%`}</b>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={values[key]} onChange={(e) => update(key, Number(e.target.value))} />
    </label>
  );
  return (
    <section className="viz-card" aria-label={mode === 'both' ? 'Stocks versus HYSA scenario explorer' : mode === 'stocks' ? 'Stocks scenario explorer' : 'HYSA scenario explorer'}>
      <h4>{mode === 'both' ? 'Stocks vs. HYSA' : mode === 'stocks' ? 'Stock scenarios' : 'HYSA projection'} · {values.months} months</h4>
      <p className="viz-sub">Illustrative scenarios, not predictions. Total deposited: {fmtUsd(scenarios[0]!.contributed)}.</p>
      <label className="viz-slider">Time horizon{' '}
        <select aria-label="Time horizon" value={values.months} onChange={(e) => update('months', Number(e.target.value))}>
          <option value={6}>6 months</option><option value={12}>12 months</option>
        </select>
      </label>
      <label className="viz-slider">Display{' '}
        <select aria-label="Scenario display" value={mode} onChange={(e) => setMode(e.target.value as 'both' | 'hysa' | 'stocks')}>
          <option value="both">Both</option><option value="hysa">HYSA only</option><option value="stocks">Stocks only</option>
        </select>
      </label>
      <p className="viz-sub">This selector changes this chart only. Tell the assistant “remove stocks”, “remove HYSA”, or “show both” to set your preference for future replies in this chat.</p>
      <LineChart series={scenarios.map((s) => ({ label: s.label.replace('Stocks: ', ''), color: s.color, values: s.balances }))} fmtX={(m) => `${m}mo`} fmtY={fmtUsdCompact} />
      <div className="comparison-table-scroll">
        <table className="comparison-table">
          <caption>Balances after {values.months} months; rounded to whole dollars</caption>
          <thead><tr><th scope="col">Scenario</th><th scope="col">Annual assumption</th><th scope="col">Balance</th><th scope="col">Gain / loss</th></tr></thead>
          <tbody>{scenarios.map((s) => <tr key={s.label}><th scope="row">{s.label}</th><td>{s.rate}%{s.label === 'HYSA' ? ' APY' : ''}</td><td>{fmtUsd(s.balance)}</td><td>{s.gain >= 0 ? '+' : ''}{fmtUsd(s.gain)}</td></tr>)}</tbody>
        </table>
      </div>
      {slider('initialAmount', 'Starting amount', 0, Math.max(20000, props.initialAmount), 100, true)}
      {slider('monthlyContribution', 'Monthly contribution', 0, Math.max(2000, props.monthlyContribution), 25, true)}
      {showHysa && slider('hysaApyPercent', 'HYSA APY', 0, 20, 0.1)}
      {showStocks && slider('stockDownsidePercent', 'Stock downside annual return', -99, 0, 1)}
      {showStocks && slider('stockUpsidePercent', 'Stock upside annual return', 0, 100, 1)}
      <p className="viz-sub comparison-assumptions">Assumes month-end deposits. {showHysa && 'HYSA APY is assumed unchanged; actual rates can change. '} {showStocks && 'Stock paths assume smooth monthly growth/loss and are hypothetical, not likely outcomes or limits; actual losses may be larger. '} Excludes taxes, fees, inflation, and withdrawals. Slider changes stay local until you click Explain my current scenario.</p>
      <ExplainScenario scenario={{ type: 'savings_vs_investing', displayMode: mode, initialAmount: values.initialAmount, monthlyContribution: values.monthlyContribution, months: values.months, results: scenarios.map(({ label, rate, balance, contributed, gain }) => ({label, annualPercent:rate, balance, contributed, gain})), assumptions: 'Effective annual rates, unchanged HYSA APY where displayed, smooth hypothetical stock paths where displayed, month-end deposits; no taxes, fees, inflation or withdrawals.' }} />
    </section>
  );
};
