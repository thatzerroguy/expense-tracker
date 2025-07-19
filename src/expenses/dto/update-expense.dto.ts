import { createExpenseSchema } from './create-expense.dto';
import { z } from 'zod';

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
