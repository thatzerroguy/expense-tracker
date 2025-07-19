import { createUserSchema } from '../../auth/dto/create-user.dto';
import { z } from 'zod';

export const updateUserSchema = createUserSchema.partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
