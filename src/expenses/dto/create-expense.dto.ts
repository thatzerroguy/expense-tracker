import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.float64().min(0, 'Amount must be a positive number'),
  expenseType: z
    .enum([
      'FOOD',
      'TRANSPORT',
      'ENTERTAINMENT',
      'OTHER',
      'UTILITIES',
      'HEALTHCARE',
    ])
    .default('OTHER'),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
