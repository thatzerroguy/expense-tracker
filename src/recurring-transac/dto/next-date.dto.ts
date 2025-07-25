import { z } from 'zod';

export const nextDateSchema = z.object({
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .default('MONTHLY'),
  interval: z.number().nonoptional('Interval is required'),
  currentDate: z.date().nonoptional('Current Date is required'),
});

export type NextDateDto = z.infer<typeof nextDateSchema>;
