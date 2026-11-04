import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, configureApi } from '@/lib/api-client';
import { accessToken, authAdapter, clearAuthRedirectFromUrl, initialAuthRedirect } from '@/lib/auth-client';
import { config } from '@/lib/config';
import type { Me, Permissions, Person } from '@/types/api';

/** 'recovery' = arrived from a password-reset link and must choose a new password first. */
type Status = 'loading' | 'signed-out' | 'recovery' | 'ready' | 'blocked';

const EXPIRED_LINK = 'This link is invalid or has expired. Request a new password reset link below.';

interface AuthContextValue {
  status: Status;
  me: Me | undefined;
  /** Why a signed-in account cannot use the app (no profile / deactivated). */
  blockedReason: string | null;
  /** Problem with an email link (e.g. expired reset link), shown on the sign-in page. */
  linkError: string | null;
  dismissLinkError(): void;
  signIn(email: string, password: string): Promise<void>;
  register(fullName: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  /** Saves the new password chosen after a reset link, then continues into the app. */
  completePasswordReset(password: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_KEY = ['me'] as const;

/**
 * Owns the Supabase session and the backend profile (/me). The API client gets
 * its bearer token from here; a 401 from the API signs the user out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<boolean | undefined>(undefined);
  const [recovery, setRecovery] = useState(!config.demoMode && initialAuthRedirect.recovery);
  const [linkError, setLinkError] = useState<string | null>(config.demoMode ? null : initialAuthRedirect.linkError);

  const signOut = useCallback(async () => {
    try {
      await authAdapter().signOut();
    } catch {
      // Sign-out notifies listeners on success, which already clears the query
      // cache. Only clear here if sign-out itself failed (backstop) - clearing
      // twice can destroy a newly mounted query (e.g. the account picker) and
      // leave it stuck loading forever.
      queryClient.clear();
    }
    setRecovery(false);
    setSession(false);
  }, [queryClient]);

  useEffect(() => {
    configureApi(accessToken, () => void signOut());
    const auth = authAdapter();
    void auth.isSignedIn().then(setSession);
    return auth.subscribe(({ signedIn, recovery: fromResetLink }) => {
      if (!signedIn) queryClient.clear();
      if (fromResetLink) setRecovery(true);
      setSession(signedIn);
    });
  }, [signOut, queryClient]);

  // An error link (e.g. expired) has been read; tidy the address bar.
  useEffect(() => {
    if (linkError) clearAuthRedirectFromUrl();
  }, [linkError]);

  // A reset link whose token did not produce a session (expired / already used).
  useEffect(() => {
    if (recovery && session === false) {
      setRecovery(false);
      setLinkError(EXPIRED_LINK);
    }
  }, [recovery, session]);

  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<Me>('/me'),
    enabled: !!session && !recovery,
    staleTime: 5 * 60_000,
    retry: (count, err) => (err as { status?: number }).status !== 403 && count < 2,
  });

  const signIn = useCallback((email: string, password: string) => authAdapter().signInWithPassword(email, password), []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      await api.post<{ profile: Person }>('/auth/register', { fullName, email, password });
      await signIn(email, password);
    },
    [signIn],
  );

  // Our backend emails the reset link through the firm's SMTP (same answer whether or not the account exists).
  const requestPasswordReset = useCallback(async (email: string) => {
    await api.post<{ requested: boolean }>('/auth/password-reset', { email });
  }, []);

  const completePasswordReset = useCallback(async (password: string) => {
    await authAdapter().updatePassword(password);
    clearAuthRedirectFromUrl();
    setRecovery(false);
  }, []);

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) => authAdapter().changePassword(currentPassword, newPassword),
    [],
  );

  const dismissLinkError = useCallback(() => setLinkError(null), []);

  // 403 = account not allowed. Any other failure (server down, bad gateway) must also
  // surface here, otherwise the app sits on the loader forever.
  const blockedReason = meQuery.error
    ? (meQuery.error as { status?: number }).status === 403
      ? (meQuery.error as Error).message
      : `Could not load your profile: ${(meQuery.error as Error).message}`
    : null;
  const status: Status =
    session === undefined
      ? 'loading'
      : !session
        ? 'signed-out'
        : recovery
          ? 'recovery'
          : meQuery.isPending && !blockedReason
            ? 'loading'
            : blockedReason
              ? 'blocked'
              : meQuery.data
                ? 'ready'
                : 'loading';

  const value = useMemo(
    () => ({
      status,
      me: meQuery.data,
      blockedReason,
      linkError,
      dismissLinkError,
      signIn,
      register,
      signOut,
      requestPasswordReset,
      completePasswordReset,
      changePassword,
    }),
    [status, meQuery.data, blockedReason, linkError, dismissLinkError, signIn, register, signOut, requestPasswordReset, completePasswordReset, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The signed-in person (only valid inside the authenticated app shell). */
export function useMe(): Me {
  const { me } = useAuth();
  if (!me) throw new Error('useMe used outside an authenticated route');
  return me;
}

export function usePermissions(): Permissions {
  return useMe().permissions;
}
