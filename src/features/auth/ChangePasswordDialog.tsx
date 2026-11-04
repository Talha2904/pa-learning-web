import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/shared/Toast';
import { errorMessage } from '@/lib/api-client';
import { LIMITS } from '@/lib/forms';
import { AuthAlert } from './AuthLayout';
import { changePasswordSchema, type ChangePasswordValues } from './auth.schema';
import { useAuth } from './AuthProvider';

/** Signed-in "Change password": current password, then the new one twice. Rendered only while open. */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: '', password: '', confirm: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ current, password }) => {
    setMessage(null);
    try {
      await changePassword(current, password);
      toast('Your password has been changed.');
      onClose();
    } catch (err) {
      const text = errorMessage(err);
      if (/current password is incorrect/i.test(text)) setError('current', { type: 'server', message: text });
      else setMessage(text);
    }
  });

  return (
    <Modal
      open
      compact
      onClose={onClose}
      busy={isSubmitting}
      title="Change password"
      subtitle="You'll use the new password the next time you sign in."
      footer={
        <>
          <Button size="lg" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="lg" variant="dark" loading={isSubmitting} onClick={() => void submit()}>
            Change password
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} noValidate className="space-y-3.5">
        <TextField label="Current password" type="password" autoComplete="current-password" error={errors.current?.message} {...register('current')} />
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
        {/* Lets Enter submit; the visible buttons are in the footer. */}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
