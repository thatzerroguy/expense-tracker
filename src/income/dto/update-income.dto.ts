import { createIncomeSchema } from './create-income.dto';
import { z } from 'zod';

export const updateIncomeSchema = createIncomeSchema.partial();

export type UpdateIncomeDto = z.infer<typeof updateIncomeSchema>;
