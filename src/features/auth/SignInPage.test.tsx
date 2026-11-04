import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { SignInPage } from './SignInPage';

const signIn = vi.fn();
const register = vi.fn();
const requestPasswordReset = vi.fn();
const dismissLinkError = vi.fn();
let linkError: string | null = null;
vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ signIn, register, requestPasswordReset, dismissLinkError, linkError }),
}));

beforeEach(() => {
  signIn.mockReset().mockResolvedValue(undefined);
  register.mockReset().mockResolvedValue(undefined);
  requestPasswordReset.mockReset().mockResolvedValue(undefined);
  dismissLinkError.mockReset();
  linkError = null;
});

describe('SignInPage form', () => {
  it('shows field errors and does not call sign-in when the form is invalid', async () => {
    render(<SignInPage />);
    await userEvent.type(screen.getByLabelText('Work email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with valid details', async () => {
    render(<SignInPage />);
    await userEvent.type(screen.getByLabelText('Work email'), '  apatel@projectaccountants.co.uk ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(signIn).toHaveBeenCalledWith('apatel@projectaccountants.co.uk', 'secret-pass');
  });

  it('applies the request-access rules and keeps the typed email when switching tabs', async () => {
    render(<SignInPage />);
    await userEvent.type(screen.getByLabelText('Work email'), 'glin@projectaccountants.co.uk');
    await userEvent.click(screen.getByRole('tab', { name: 'Request access' }));
    expect(screen.getByLabelText('Work email')).toHaveValue('glin@projectaccountants.co.uk');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Request access' }));
    expect(await screen.findByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Use at least 10 characters')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Full name'), 'Grace Lin');
    await userEvent.type(screen.getByLabelText('Password'), '-and-longer');
    await userEvent.click(screen.getByRole('button', { name: 'Request access' }));
    expect(register).toHaveBeenCalledWith('Grace Lin', 'glin@projectaccountants.co.uk', 'short-and-longer');
  });

  it('puts server field errors next to the field', async () => {
    register.mockRejectedValue(new ApiError('An account with this email already exists.', 409, 'EMAIL_TAKEN', [{ path: 'email', message: 'Already registered' }]));
    render(<SignInPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Request access' }));
    await userEvent.type(screen.getByLabelText('Full name'), 'Grace Lin');
    await userEvent.type(screen.getByLabelText('Work email'), 'glin@projectaccountants.co.uk');
    await userEvent.type(screen.getByLabelText('Password'), 'long-enough-1');
    await userEvent.click(screen.getByRole('button', { name: 'Request access' }));
    expect(await screen.findByText('Already registered')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('An account with this email already exists.');
  });
});

describe('Forgot password', () => {
  it('is offered on Sign in only, and carries over the typed email', async () => {
    render(<SignInPage />);
    await userEvent.type(screen.getByLabelText('Work email'), ' glin@projectaccountants.co.uk ');
    await userEvent.click(screen.getByRole('tab', { name: 'Request access' }));
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Sign in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveValue('glin@projectaccountants.co.uk');
  });

  it('sends the reset link and shows a neutral confirmation', async () => {
    render(<SignInPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Enter an email address')).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Work email'), 'glin@projectaccountants.co.uk');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(requestPasswordReset).toHaveBeenCalledWith('glin@projectaccountants.co.uk');
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('If there is a Lumen account for glin@projectaccountants.co.uk');

    await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows a rate-limit or network problem instead of the confirmation', async () => {
    requestPasswordReset.mockRejectedValue(new Error('Too many requests. Please wait a minute and try again.'));
    render(<SignInPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await userEvent.type(screen.getByLabelText('Work email'), 'glin@projectaccountants.co.uk');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument();
  });

  it('opens on "request a new link" when an expired reset link was used', () => {
    linkError = 'This link is invalid or has expired. Request a new password reset link below.';
    render(<SignInPage />);
    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('has expired');
  });
});
