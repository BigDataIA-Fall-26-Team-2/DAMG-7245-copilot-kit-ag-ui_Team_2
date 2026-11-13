import { useConfigureSuggestions } from '@copilotkit/react-core/v2';

/** Fixed examples: no additional model call is needed to generate suggestions. */
export function StarterQuestions() {
  useConfigureSuggestions({
    consumerAgentId: 'financial-assistant',
    available: 'before-first-message',
    suggestions: [
      { title: 'Compare stocks and savings', message: 'Compare stocks versus a HYSA starting with $5,000 and adding $300 monthly for 6 months. Use an illustrative 4% HYSA APY and hypothetical annual stock returns of -20%, 0%, and 10%. Show the interactive comparison.' },
      { title: 'Plan a savings goal', message: 'I have $500 saved toward a $3,000 goal and can save $250 per month. Show the savings goal planner assuming no interest.' },
      { title: 'Explore debt payoff', message: 'I owe $5,000 at 20% APR and can pay $300 monthly. Show an interactive debt payoff timeline.' },
      { title: 'Project investment growth', message: 'Starting with $0, show an interactive growth projection for $500 per month over 20 years at an assumed 7% annual return.' },
    ],
  }, []);
  return null;
}
