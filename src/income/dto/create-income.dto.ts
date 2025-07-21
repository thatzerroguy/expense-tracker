import { z } from 'zod';

export const createIncomeSchema = z.object({
  source: z.string().nonoptional('Source of income is required'),
  amount: z.float64().nonoptional('Amount is needed for income'),
});

export type CreateIncomeDto = z.infer<typeof createIncomeSchema>;
