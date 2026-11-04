import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChange } from '@/lib/auth-client';
import { AuthProvider, useAuth } from './AuthProvider';

const h = vi.hoisted(() => ({
  redirect: { recovery: false, tokenHash: null as string | null, linkError: null as string | null },
  signedIn: true,
  listeners: new Set<(c: AuthChange) => void>(),
  updatePassword: vi.fn(),
  signOut: vi.fn(),
  getMe: vi.fn(),
  post: vi.fn(),
  clearUrl: vi.fn(),
}));

vi.mock('@/lib/config', () => ({ config: { demoMode: false, apiUrl: '/api/v1' } }));
vi.mock('@/lib/api-client', () => ({ api: { get: h.getMe, post: h.post }, configureApi: vi.fn() }));
vi.mock('@/lib/auth-client', () => ({
  get initialAuthRedirect() {
    return h.redirect;
  },
  clearAuthRedirectFromUrl: h.clearUrl,
  accessToken: vi.fn(),
  authAdapter: () => ({
    isSignedIn: async () => h.signedIn,
    subscribe: (l: (c: AuthChange) => void) => {
      h.listeners.add(l);
      return () => h.listeners.delete(l);
    },
    updatePassword: h.updatePassword,
    signOut: async () => {
      await h.signOut();
      h.listeners.forEach((l) => l({ signedIn: false, recovery: false }));
    },
  }),
}));

function Probe() {
  const { status, linkError, completePasswordReset, requestPasswordReset } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="link-error">{linkError ?? ''}</span>
      <button type="button" onClick={() => void completePasswordReset('a-brand-new-pass')}>
        save
      </button>
      <button type="button" onClick={() => void requestPasswordReset('glin@projectaccountants.co.uk')}>
        forgot
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );

const status = () => screen.getByTestId('status').textContent;

beforeEach(() => {
  h.redirect = { recovery: false, tokenHash: null, linkError: null };
  h.signedIn = true;
  h.listeners.clear();
  h.updatePassword.mockReset().mockResolvedValue(undefined);
  h.signOut.mockReset().mockResolvedValue(undefined);
  h.getMe.mockReset().mockResolvedValue({ profile: { id: 'p1' }, permissions: {}, currentCycle: null });
  h.clearUrl.mockReset();
  h.post.mockReset().mockResolvedValue({ requested: true });
});

describe('AuthProvider forgot password', () => {
  it('asks our backend (not Supabase) to email the reset link', async () => {
    h.signedIn = false;
    renderProvider();
    await waitFor(() => expect(status()).toBe('signed-out'));
    await act(async () => screen.getByRole('button', { name: 'forgot' }).click());
    expect(h.post).toHaveBeenCalledWith('/auth/password-reset', { email: 'glin@projectaccountants.co.uk' });
  });
});

describe('AuthProvider password recovery', () => {
  it('signs in normally when there is no reset link', async () => {
    renderProvider();
    await waitFor(() => expect(status()).toBe('ready'));
  });

  it('holds a reset-link session on "recovery" (no app access) until a new password is saved', async () => {
    h.redirect = { recovery: true, tokenHash: null, linkError: null };
    renderProvider();
    await waitFor(() => expect(status()).toBe('recovery'));
    expect(h.getMe).not.toHaveBeenCalled();

    await act(async () => screen.getByRole('button', { name: 'save' }).click());
    expect(h.updatePassword).toHaveBeenCalledWith('a-brand-new-pass');
    expect(h.clearUrl).toHaveBeenCalled();
    await waitFor(() => expect(status()).toBe('ready'));
  });

  it('enters recovery when the auth client reports PASSWORD_RECOVERY later', async () => {
    renderProvider();
    await waitFor(() => expect(status()).toBe('ready'));
    act(() => h.listeners.forEach((l) => l({ signedIn: true, recovery: true })));
    expect(status()).toBe('recovery');
  });

  it('turns a reset link without a valid session into an "expired" message', async () => {
    h.redirect = { recovery: true, tokenHash: null, linkError: null };
    h.signedIn = false;
    renderProvider();
    await waitFor(() => expect(status()).toBe('signed-out'));
    expect(screen.getByTestId('link-error').textContent).toMatch(/expired/);
  });

  it('keeps an error link message for the sign-in page and tidies the URL', async () => {
    h.redirect = { recovery: false, tokenHash: null, linkError: 'This link is invalid or has expired.' };
    h.signedIn = false;
    renderProvider();
    await waitFor(() => expect(status()).toBe('signed-out'));
    expect(screen.getByTestId('link-error').textContent).toMatch(/expired/);
    expect(h.clearUrl).toHaveBeenCalled();
  });
});
