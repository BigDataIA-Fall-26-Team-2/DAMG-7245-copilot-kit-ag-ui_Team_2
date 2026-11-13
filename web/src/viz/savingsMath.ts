import { z } from 'zod';

// Shared UI contract: rates are effective ANNUAL assumptions, not horizon returns.
export const savingsComparisonSchema = z.object({
  displayMode: z.enum(['both', 'hysa', 'stocks']).optional(),
  includeStocks: z.boolean().optional(),
  initialAmount: z.coerce.number().min(0).max(10000000),
  monthlyContribution: z.coerce.number().min(0).max(100000),
  months: z.coerce.number().refine((n) => n === 6 || n === 12, 'Choose 6 or 12 months'),
  hysaApyPercent: z.coerce.number().min(0).max(20),
  stockDownsidePercent: z.coerce.number().min(-99).max(0),
  stockUpsidePercent: z.coerce.number().min(0).max(100),
});
export type SavingsComparisonArgs = z.infer<typeof savingsComparisonSchema>;

export { projectBalance } from '../../../shared/savingsProjection';
