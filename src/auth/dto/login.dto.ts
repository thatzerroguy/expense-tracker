import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ pattern: z.regexes.email }).nonoptional(),
  password: z.string().nonoptional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
