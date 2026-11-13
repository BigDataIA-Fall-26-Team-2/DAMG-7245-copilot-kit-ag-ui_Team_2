import { test } from 'node:test';
import assert from 'node:assert/strict';
import { savingsGoal } from '../shared/savingsGoal.ts';
import { scenarioMessage } from '../web/src/viz/scenarioMessage.ts';
test('goal uses rounded-up monthly deposits', () => {
  assert.equal(savingsGoal(3000,500,250).months,10);
  assert.equal(savingsGoal(3000,500,500).months,5);
  assert.equal(savingsGoal(3000,500,300).months,9);
});
test('reached goals and zero deposits are explicit', () => {
  assert.equal(savingsGoal(3000,3000,0).months,0);
  assert.equal(savingsGoal(3000,3500,0).remaining,0);
  assert.equal(savingsGoal(3000,500,0).months,null);
});
test('cent precision avoids floating-point extra months', () => assert.equal(savingsGoal(.3,.1,.1).months,2));
test('invalid goal inputs rejected', () => {
  for(const args of [[0,0,1],[-1,0,1],[1,-1,1],[1,0,-1],[Infinity,0,1],[1,NaN,1]]) assert.throws(()=>savingsGoal(...args as [number,number,number]));
});
test('explanation serializes the current inputs and results', () => {
  const original = {monthlyContribution:500, projectedValue:260463};
  const current = {...original, monthlyContribution:750, projectedValue:390695};
  const message = scenarioMessage(current);
  assert.match(message, /"monthlyContribution": 750/);
  assert.match(message, /390695/);
  assert.doesNotMatch(message, /260463/);
  assert.equal(original.monthlyContribution,500);
});
test('savings-goal backend returns exact result', async () => {
  const {vizTools} = await import('../server/src/vizTools.ts');
  const tool=vizTools.find(t=>t.name==='show_savings_goal')!;
  assert.equal(JSON.parse(await tool.handler({targetAmount:3000,currentSavings:500,monthlyContribution:250})).months,10);
  assert.match(await tool.handler({targetAmount:-1}),/Invalid/);
});
