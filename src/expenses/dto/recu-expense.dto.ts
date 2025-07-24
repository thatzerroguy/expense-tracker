import { z } from 'zod';

export const RecurExpenseSchema = z.object({
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
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .default('MONTHLY'),
  interval: z.number().nonoptional('Interval is required'),
  startDate: z.date().nonoptional('Start Date is required'),
});

export type RecurExpenseDto = z.infer<typeof RecurExpenseSchema>;
