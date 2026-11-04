import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { useToast } from '@/components/shared/Toast';
import { errorMessage } from '@/lib/api-client';
import { LIMITS } from '@/lib/forms';
import { AuthAlert, AuthLayout } from './AuthLayout';
import { newPasswordSchema, type NewPasswordValues } from './auth.schema';
import { useAuth } from './AuthProvider';

/** Shown after someone opens a password-reset link: choose a new password, then continue into Lumen. */
export function ResetPasswordPage() {
  const { completePasswordReset, signOut } = useAuth();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirm: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ password }) => {
    setMessage(null);
    try {
      await completePasswordReset(password);
      toast('Your password has been changed.');
    } catch (err) {
      setMessage(errorMessage(err));
    }
  });

  return (
    <AuthLayout title="Set a new password" intro="Choose a new password for your Lumen account. You'll use it from now on.">
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-7 space-y-4">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${LIMITS.passwordMin} characters`}
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        {message ? <AuthAlert>{message}</AuthAlert> : null}
        <Button type="submit" variant="dark" block loading={isSubmitting} className="!py-3.5 !text-[12px] !tracking-[1.4px]">
          Save new password
        </Button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void signOut()}
          className="block w-full cursor-pointer text-center text-[12px] font-medium text-pa-blue-dark underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel and go to sign in
        </button>
      </form>
    </AuthLayout>
  );
}
