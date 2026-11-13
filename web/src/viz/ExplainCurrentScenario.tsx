import React, { useEffect, useRef, useState } from 'react';
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2';
import { scenarioMessage } from './scenarioMessage';

/** Explicitly sends current card state as a new message in the active agent chat. */
export const ExplainScenario: React.FC<{ scenario: object }> = ({ scenario }) => {
  const { agent } = useAgent({ agentId: 'financial-assistant', updates: [] });
  const { copilotkit } = useCopilotKit();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const [agentBusy, setAgentBusy] = useState(agent.isRunning);
  useEffect(() => {
    setAgentBusy(agent.isRunning);
    // Lifecycle callbacks can fire before isRunning changes. Store the event's
    // status directly rather than relying on a render reading that mutable flag.
    const subscription = agent.subscribe({
      onRunInitialized: () => { setAgentBusy(true); },
      onRunFinalized: () => { setAgentBusy(false); },
      onRunFailed: () => { setAgentBusy(false); },
    });
    return () => subscription.unsubscribe();
  }, [agent]);
  useEffect(() => {
    if (!agentBusy) return;
    // A chart may mount midway through a run whose subscriber list was already
    // captured. Reconcile that run's mutable status until it becomes idle.
    const timer = setInterval(() => {
      if (!agent.isRunning) setAgentBusy(false);
    }, 250);
    return () => clearInterval(timer);
  }, [agent, agentBusy]);
  const explain = async () => {
    if (inFlight.current || agent.isRunning) return;
    inFlight.current = true;
    setSending(true); setError('');
    const showError = () => setError('The explanation could not complete. Your chart is still usable. Check the connection and try again.');
    // CopilotKit can resolve runAgent after reporting an error through events.
    const subscription = agent.subscribe({
      onRunFailed: showError,
      onRunErrorEvent: showError,
    });
    try {
      agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: scenarioMessage(scenario) });
      await copilotkit.runAgent({ agent });
    } catch {
      showError();
    } finally { subscription.unsubscribe(); inFlight.current = false; setSending(false); setAgentBusy(agent.isRunning); }
  };
  return <div className="explain-scenario">
    <button type="button" disabled={sending || agentBusy} onClick={explain}>{sending ? 'Explaining…' : 'Explain my current scenario'}</button>
    <p className="viz-sub">Sends this chart’s current inputs and calculated results to the assistant as a new message.</p>
    {error && <p role="alert">{error}</p>}
  </div>;
};
