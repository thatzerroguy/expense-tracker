import { z } from 'zod';

export const RecurIncomeSchema = z.object({
  source: z.string().nonoptional('Source is required'),
  amount: z.float64().min(0, 'Amount must be a positive number'),
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .default('MONTHLY'),
  interval: z.number().nonoptional('Interval is required'),
  startDate: z.date().nonoptional('Start Date is required'),
});

export type RecurIncomeDto = z.infer<typeof RecurIncomeSchema>;
