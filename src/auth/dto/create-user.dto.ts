import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().nonoptional('Name is required'),
  email: z.email({ pattern: z.regexes.email }).nonoptional('Email is required'),
  password: z.string().nonoptional('Password is required'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
