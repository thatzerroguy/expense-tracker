import { z } from 'zod';

export const verifyOtpSchema = z.object({
  otp: z.string().nonoptional(),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
