import { describe, expect, it } from 'vitest';
import { authErrorMessage, readAuthRedirect } from './auth-client';

describe('readAuthRedirect', () => {
  it('spots a password-reset link (implicit flow, tokens in the hash)', () => {
    expect(
      readAuthRedirect('https://lumen.example/reset-password#access_token=abc&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery'),
    ).toEqual({ recovery: true, tokenHash: null, linkError: null });
  });

  it('reads the one-time token from our own reset email', () => {
    expect(readAuthRedirect('https://lumen.example/?token_hash=abc%2Bdef&type=recovery')).toEqual({
      recovery: true,
      tokenHash: 'abc+def',
      linkError: null,
    });
  });

  it('turns an expired link into a plain-English message', () => {
    const r = readAuthRedirect(
      'https://lumen.example/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    );
    expect(r.recovery).toBe(false);
    expect(r.linkError).toMatch(/invalid or has expired/);
  });

  it('ignores ordinary pages and sign-in links', () => {
    expect(readAuthRedirect('https://lumen.example/my/plan')).toEqual({ recovery: false, tokenHash: null, linkError: null });
    expect(readAuthRedirect('https://lumen.example/#access_token=abc&type=signup').recovery).toBe(false);
    expect(readAuthRedirect('not a url')).toEqual({ recovery: false, tokenHash: null, linkError: null });
  });
});

describe('authErrorMessage', () => {
  it('maps Supabase error codes to friendly text', () => {
    expect(authErrorMessage({ code: 'same_password', message: 'x' })).toMatch(/different from your current/);
    expect(authErrorMessage({ code: 'over_email_send_rate_limit', message: 'x' })).toMatch(/wait a minute/);
    expect(authErrorMessage({ status: 429, message: 'x' })).toMatch(/wait a minute/);
    expect(authErrorMessage({ name: 'AuthSessionMissingError', message: 'Auth session missing!' })).toMatch(/reset link has expired/);
    expect(authErrorMessage({ message: 'Invalid login credentials' })).toBe('Email or password is incorrect.');
    expect(authErrorMessage({ code: 'weak_password', message: 'Password should be at least 10 characters.' })).toBe(
      'Password should be at least 10 characters.',
    );
    expect(authErrorMessage({ message: '' })).toMatch(/Something went wrong/);
  });
});
