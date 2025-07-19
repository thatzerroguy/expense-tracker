import { z } from 'zod';

export const resetPasswordSchema = z.object({
  email: z.string().email({ pattern: z.regexes.email }).nonoptional(),
  newPassword: z.string().nonoptional(),
});

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
