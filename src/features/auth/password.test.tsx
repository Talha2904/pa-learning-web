import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/shared/Toast';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ResetPasswordPage } from './ResetPasswordPage';

const completePasswordReset = vi.fn();
const changePassword = vi.fn();
const signOut = vi.fn();
vi.mock('./AuthProvider', () => ({ useAuth: () => ({ completePasswordReset, changePassword, signOut }) }));

const renderUi = (ui: ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

beforeEach(() => {
  completePasswordReset.mockReset().mockResolvedValue(undefined);
  changePassword.mockReset().mockResolvedValue(undefined);
  signOut.mockReset().mockResolvedValue(undefined);
});

describe('Set a new password (from a reset link)', () => {
  it('requires 10+ characters typed the same twice', async () => {
    renderUi(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('Use at least 10 characters')).toBeInTheDocument();
    expect(screen.getByText('The passwords do not match')).toBeInTheDocument();
    expect(completePasswordReset).not.toHaveBeenCalled();
  });

  it('saves the new password and confirms it', async () => {
    renderUi(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'a-brand-new-pass');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-brand-new-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(completePasswordReset).toHaveBeenCalledWith('a-brand-new-pass');
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument();
  });

  it('shows why saving failed (e.g. the link expired)', async () => {
    completePasswordReset.mockRejectedValue(new Error('Your reset link has expired. Request a new one from the sign-in page.'));
    renderUi(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'a-brand-new-pass');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-brand-new-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('has expired');
  });

  it('can be cancelled, which signs out', async () => {
    renderUi(<ResetPasswordPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel and go to sign in' }));
    expect(signOut).toHaveBeenCalled();
  });
});

describe('Change password (signed in)', () => {
  const fill = async (current: string, next: string, confirm = next) => {
    await userEvent.type(screen.getByLabelText('Current password'), current);
    await userEvent.type(screen.getByLabelText('New password'), next);
    await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
  };

  it('rejects reusing the current password and mismatched confirmation', async () => {
    renderUi(<ChangePasswordDialog onClose={vi.fn()} />);
    await fill('old-password-1', 'old-password-1', 'something-else');
    expect(await screen.findByText('Choose a password different from your current one')).toBeInTheDocument();
    expect(screen.getByText('The passwords do not match')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('puts a wrong current password next to that field', async () => {
    changePassword.mockRejectedValue(new Error('Your current password is incorrect.'));
    const onClose = vi.fn();
    renderUi(<ChangePasswordDialog onClose={onClose} />);
    await fill('wrong-password', 'a-brand-new-pass');
    expect(await screen.findByText('Your current password is incorrect.')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveAttribute('aria-invalid', 'true');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('changes the password and closes', async () => {
    const onClose = vi.fn();
    renderUi(<ChangePasswordDialog onClose={onClose} />);
    await fill('old-password-1', 'a-brand-new-pass');
    expect(changePassword).toHaveBeenCalledWith('old-password-1', 'a-brand-new-pass');
    expect(onClose).toHaveBeenCalled();
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument();
  });
});
