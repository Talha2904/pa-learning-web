import { z } from 'zod';
import { LIMITS, rules } from '@/lib/forms';

/** Sign in and Request access share one form; `mode` decides which rules apply. */
export const authSchema = z
  .object({
    mode: z.enum(['in', 'up']),
    fullName: z.string().trim().max(LIMITS.nameMax, `At most ${LIMITS.nameMax} characters`),
    email: rules.email,
    password: z.string().min(1, 'Enter your password').max(128),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== 'up') return;
    if (!v.fullName) ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'Enter your full name' });
    if (v.password.length < LIMITS.passwordMin) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: `Use at least ${LIMITS.passwordMin} characters` });
    }
  });

export type AuthValues = z.infer<typeof authSchema>;

/** "Forgot password?" - just the work email. */
export const forgotPasswordSchema = z.object({ email: rules.email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const newPassword = z
  .string()
  .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters`)
  .max(128, 'At most 128 characters');

/** New password chosen after a reset link: typed twice so a typo can't lock someone out. */
export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords do not match' });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

/** Change password while signed in: current password + new one twice. */
export const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Enter your current password'), password: newPassword, confirm: z.string() })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'The passwords do not match' });
    if (v.current && v.password === v.current) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Choose a password different from your current one' });
    }
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
