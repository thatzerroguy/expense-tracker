import { z } from 'zod';

export const expenseTypeSchema = z.object({
  expenseType: z
    .enum([
      'FOOD',
      'TRANSPORT',
      'ENTERTAINMENT',
      'UTILITIES',
      'HEALTHCARE',
      'OTHER',
    ])
    .default('OTHER'),
});

export type ExpenseTypeDto = z.infer<typeof expenseTypeSchema>;
