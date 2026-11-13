import React, { useRef, useState } from 'react';
import { useAgent, useCopilotKit, UseAgentUpdate } from '@copilotkit/react-core/v2';
import { scenarioMessage } from './scenarioMessage';

/** Explicitly sends current card state as a new message in the active agent chat. */
export const ExplainScenario: React.FC<{ scenario: object }> = ({ scenario }) => {
  const { agent } = useAgent({ agentId: 'financial-assistant', updates: [UseAgentUpdate.OnRunStatusChanged] });
  const { copilotkit } = useCopilotKit();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const explain = async () => {
    if (inFlight.current || agent.isRunning) return;
    inFlight.current = true;
    setSending(true); setError('');
    try {
      agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: scenarioMessage(scenario) });
      await copilotkit.runAgent({ agent });
    } catch {
      setError('The explanation could not complete. Your chart is still usable. Check the connection and try again.');
    } finally { inFlight.current = false; setSending(false); }
  };
  return <div className="explain-scenario">
    <button type="button" disabled={sending || agent.isRunning} onClick={explain}>{sending ? 'Explaining…' : 'Explain my current scenario'}</button>
    <p className="viz-sub">Sends this chart’s current inputs and calculated results to the assistant as a new message.</p>
    {error && <p role="alert">{error}</p>}
  </div>;
};
