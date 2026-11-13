import React from 'react';
import { CopilotChatView, type CopilotChatViewProps, useConfigureSuggestions } from '@copilotkit/react-core/v2';

/** Use the chat's own draft state; selecting an example never starts an agent run. */
function EditableSuggestionChatView(props: CopilotChatViewProps) {
  const container = React.useRef<HTMLDivElement>(null);
  return <div ref={container} style={{ display: 'contents' }}>
    <CopilotChatView {...props} onSelectSuggestion={(suggestion) => {
      props.onInputChange?.(suggestion.message);
      container.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
    }} />
  </div>;
}

export const EditableSuggestionChat = Object.assign(EditableSuggestionChatView, {
  ScrollView: CopilotChatView.ScrollView,
  ScrollToBottomButton: CopilotChatView.ScrollToBottomButton,
  Feather: CopilotChatView.Feather,
  WelcomeMessage: CopilotChatView.WelcomeMessage,
  WelcomeScreen: CopilotChatView.WelcomeScreen,
});

/** Fixed examples: no additional model call is needed to generate suggestions. */
export function StarterQuestions() {
  useConfigureSuggestions({
    consumerAgentId: 'financial-assistant',
    available: 'before-first-message',
    suggestions: [
      { title: 'Compare stocks and savings', message: 'Compare stocks versus a HYSA starting with $5,000 and adding $300 monthly for 6 months. Use an illustrative 4% HYSA APY and hypothetical annual stock returns of -20%, 0%, and 10%. Show the interactive comparison.' },
      { title: 'Plan a savings goal', message: 'I have $500 saved toward a $3,000 goal and can save $250 per month. Show the savings goal planner assuming no interest.' },
      { title: 'Explore debt payoff', message: 'I owe $5,000 at 20% APR and can pay $300 monthly. Show an interactive debt payoff timeline.' },
      { title: 'Break down my budget', message: 'Show a budget breakdown for $4,000 monthly income with rent $1,500, groceries $450, transportation $300, utilities $200, savings $700, and entertainment $300. Show what remains unallocated.' },
      { title: 'Compare savings scenarios', message: 'Show a scenario comparison in dollars: saving $200 monthly for 6 months gives $1,200, $300 monthly gives $1,800, and $400 monthly gives $2,400. Assume no interest.' },
      { title: 'Project investment growth', message: 'Starting with $0, show an interactive growth projection for $500 per month over 20 years at an assumed 7% annual return.' },
    ],
  }, []);
  return null;
}
