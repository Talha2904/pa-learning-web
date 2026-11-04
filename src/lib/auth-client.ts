import { GoTrueClient } from '@supabase/auth-js';
import { config } from './config';

/**
 * Password reset: the backend emails the link itself (POST /auth/password-reset) as
 * `<site>/?token_hash=…&type=recovery`; the app redeems it on whatever page it opens, so no
 * Supabase dashboard email or redirect settings are needed. This older path is still
 * recognised (and tidied from the address bar) in case a link uses it.
 */
export const RESET_PASSWORD_PATH = '/reset-password';

/** Auth state change seen by the app. `recovery` = the person arrived from a password-reset link. */
export interface AuthChange {
  signedIn: boolean;
  recovery: boolean;
}

/**
 * Sign-in provider seen by the app. Production uses Supabase Auth; local demo
 * mode (VITE_DEMO_MODE=true, dev only) uses a picker against the demo server.
 * The browser never talks to the database directly (ADR 0001).
 */
export interface AuthAdapter {
  isSignedIn(): Promise<boolean>;
  accessToken(): Promise<string | null>;
  subscribe(onChange: (change: AuthChange) => void): () => void;
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Sets a new password for the signed-in (or recovering) session. */
  updatePassword(password: string): Promise<void>;
  /** Checks the current password, then sets a new one. */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

/**
 * What the page URL said when the app loaded, read before the auth client
 * consumes and clears it: a password-reset link, or an expired/invalid link.
 */
export interface AuthRedirect {
  recovery: boolean;
  /** One-time token from our own reset email, redeemed with verifyOtp. */
  tokenHash: string | null;
  /** Plain-English problem with an email link, e.g. it expired. */
  linkError: string | null;
}

const NO_REDIRECT: AuthRedirect = { recovery: false, tokenHash: null, linkError: null };

export function readAuthRedirect(href: string): AuthRedirect {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return NO_REDIRECT;
  }
  const params = new URLSearchParams(url.hash.replace(/^#/, ''));
  url.searchParams.forEach((v, k) => {
    if (!params.has(k)) params.set(k, v);
  });
  const errorCode = params.get('error_code');
  const errorText = params.get('error_description') ?? params.get('error');
  let linkError: string | null = null;
  if (errorCode || errorText) {
    linkError =
      errorCode === 'otp_expired' || /expired|invalid/i.test(errorText ?? '')
        ? 'This link is invalid or has expired. Request a new password reset link below.'
        : (errorText ?? 'That link could not be used. Please try again.');
  }
  const recovery = !linkError && params.get('type') === 'recovery';
  const tokenHash = recovery ? params.get('token_hash') || null : null;
  return { recovery, tokenHash, linkError };
}

/** Captured once at start-up (the auth client strips these values from the URL). */
export const initialAuthRedirect: AuthRedirect =
  typeof window === 'undefined' ? NO_REDIRECT : readAuthRedirect(window.location.href);

/** Removes reset-link tokens / errors from the address bar once they have been handled. */
export function clearAuthRedirectFromUrl(): void {
  if (typeof window === 'undefined') return;
  const { pathname, hash, search } = window.location;
  if (pathname === RESET_PASSWORD_PATH || hash || /[?&](error|code|type|token_hash)=/.test(search)) {
    window.history.replaceState(null, '', '/');
  }
}

/** Turns Supabase auth errors into messages a non-technical person can act on. */
export function authErrorMessage(error: { message?: string; code?: string; status?: number; name?: string }): string {
  const code = error.code ?? '';
  if (code === 'same_password') return 'Choose a new password that is different from your current one.';
  if (code === 'weak_password') return error.message || 'That password is too weak. Choose a longer one.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) {
    return 'Too many requests. Please wait a minute and try again.';
  }
  if (code === 'reauthentication_needed') return 'For security, sign out, sign back in, then change your password.';
  if (code === 'session_not_found' || code === 'session_expired' || error.name === 'AuthSessionMissingError') {
    return 'Your reset link has expired. Request a new one from the sign-in page.';
  }
  if (error.message === 'Invalid login credentials') return 'Email or password is incorrect.';
  return error.message || 'Something went wrong. Please try again.';
}

class SupabaseAuth implements AuthAdapter {
  private readonly client = new GoTrueClient({
    url: `${config.supabaseUrl}/auth/v1`,
    headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` },
    storageKey: 'pa-learning-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Implicit flow (the default): reset links also work when opened on another device or browser.
    flowType: 'implicit',
  });

  /** Redeems a reset-email token (if the page was opened from one) before anything reads the session. */
  private readonly ready: Promise<void> = this.redeemResetToken(initialAuthRedirect.tokenHash);

  private async redeemResetToken(tokenHash: string | null): Promise<void> {
    if (!tokenHash) return;
    await this.client.initialize(); // let any stored session load first, so the new one isn't overwritten
    // On success this saves a recovery session and emits PASSWORD_RECOVERY.
    const { error } = await this.client
      .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      .catch((err: unknown) => ({ error: err }));
    // Expired or already used: drop any older session on this browser so the app shows
    // "link expired" instead of offering to change someone else's password.
    if (error) await this.client.signOut({ scope: 'local' }).catch(() => undefined);
  }

  async isSignedIn() {
    await this.ready;
    return !!(await this.client.getSession()).data.session;
  }

  async accessToken() {
    await this.ready;
    // auth-js refreshes the token when it is close to expiry.
    return (await this.client.getSession()).data.session?.access_token ?? null;
  }

  subscribe(onChange: (change: AuthChange) => void) {
    const { data } = this.client.onAuthStateChange((event, session) =>
      onChange({ signedIn: !!session, recovery: event === 'PASSWORD_RECOVERY' }),
    );
    return () => data.subscription.unsubscribe();
  }

  async signInWithPassword(email: string, password: string) {
    const { error } = await this.client.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(authErrorMessage(error));
  }

  async signOut() {
    await this.client.signOut();
  }

  async updatePassword(password: string) {
    await this.ready;
    const { error } = await this.client.updateUser({ password });
    if (error) throw new Error(authErrorMessage(error));
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await this.client.getSession();
    const email = data.session?.user.email;
    if (!email) throw new Error('Your session has ended. Sign in again, then change your password.');
    // Re-checking the current password stops anyone at an unlocked computer changing it,
    // and gives a fresh session so Supabase's "secure password change" rule is satisfied.
    const check = await this.client.signInWithPassword({ email, password: currentPassword });
    if (check.error) {
      throw new Error(check.error.message === 'Invalid login credentials' ? 'Your current password is incorrect.' : authErrorMessage(check.error));
    }
    await this.updatePassword(newPassword);
  }
}

const DEMO_UNAVAILABLE = 'Passwords are not used in demo mode.';

/** DEV ONLY: token = "demo:<authUserId>", accepted solely by backend/scripts/demo-server.ts. */
export class DemoAuth implements AuthAdapter {
  private static readonly KEY = 'pa-learning-demo-token';
  private listeners = new Set<(change: AuthChange) => void>();

  private read(): string | null {
    try {
      return localStorage.getItem(DemoAuth.KEY);
    } catch {
      return null;
    }
  }

  async isSignedIn() {
    return !!this.read();
  }

  async accessToken() {
    return this.read();
  }

  subscribe(onChange: (change: AuthChange) => void) {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  }

  async signInWithPassword() {
    throw new Error('Demo mode: pick an account below.');
  }

  signInAs(authUserId: string) {
    localStorage.setItem(DemoAuth.KEY, `demo:${authUserId}`);
    this.listeners.forEach((l) => l({ signedIn: true, recovery: false }));
  }

  async signOut() {
    localStorage.removeItem(DemoAuth.KEY);
    this.listeners.forEach((l) => l({ signedIn: false, recovery: false }));
  }

  async updatePassword() {
    throw new Error(DEMO_UNAVAILABLE);
  }

  async changePassword() {
    throw new Error(DEMO_UNAVAILABLE);
  }
}

let adapter: AuthAdapter | null = null;

export function authAdapter(): AuthAdapter {
  adapter ??= config.demoMode ? new DemoAuth() : new SupabaseAuth();
  return adapter;
}

export async function accessToken(): Promise<string | null> {
  return authAdapter().accessToken();
}
