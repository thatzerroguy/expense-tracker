import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ pattern: z.regexes.email })
    .nonoptional('Email is required'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
