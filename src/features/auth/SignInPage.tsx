import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Tabs } from '@/components/ui/Tabs';
import { errorMessage } from '@/lib/api-client';
import { config } from '@/lib/config';
import { applyServerErrors, LIMITS } from '@/lib/forms';
import { AuthAlert, AuthCard, AuthShell } from './AuthLayout';
import { authSchema, forgotPasswordSchema, type AuthValues, type ForgotPasswordValues } from './auth.schema';
import { useAuth } from './AuthProvider';
import { DemoAccountPicker } from './DemoAccountPicker';

type Mode = AuthValues['mode'];

/** Sign in / Request access, plus the "Forgot password?" view. */
export function SignInPage() {
  const { linkError } = useAuth();
  // An expired reset link sends people straight to "request a new link".
  const [view, setView] = useState<'main' | 'forgot'>(linkError && !config.demoMode ? 'forgot' : 'main');
  const [email, setEmail] = useState('');

  return (
    <AuthShell>
      {view === 'forgot' ? (
        <ForgotPassword initialEmail={email} onBack={() => setView('main')} />
      ) : (
        <SignInForm
          onForgot={(typed) => {
            setEmail(typed);
            setView('forgot');
          }}
        />
      )}
    </AuthShell>
  );
}

function SignInForm({ onForgot }: { onForgot: (email: string) => void }) {
  const { signIn, register } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    watch,
    getValues,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { mode: 'in', fullName: '', email: '', password: '' },
    mode: 'onTouched',
  });
  const mode = watch('mode');

  const submit = handleSubmit(async (v) => {
    setMessage(null);
    try {
      if (v.mode === 'in') await signIn(v.email, v.password);
      else await register(v.fullName, v.email, v.password);
    } catch (err) {
      applyServerErrors(err, setError, ['fullName', 'email', 'password']);
      setMessage(errorMessage(err));
    }
  });

  const switchMode = (m: Mode) => {
    setValue('mode', m);
    setMessage(null);
    clearErrors();
  };

  return (
    <AuthCard
      title={mode === 'in' ? 'Sign in' : 'Request access'}
      intro={
        mode === 'in'
          ? 'Use your Project Accountants work email and password.'
          : 'New accounts start as Team Member. The Learning Team sets your role and designation.'
      }
    >
      {config.demoMode ? (
        <div className="mt-7">
          <DemoAccountPicker />
        </div>
      ) : (
        <>
          {config.microsoftSso ? (
            <>
              <button
                type="button"
                disabled
                className="mt-7 flex w-full cursor-not-allowed items-center gap-3.5 bg-ink px-[18px] py-[15px] text-left text-white opacity-60"
              >
                <span className="grid shrink-0 grid-cols-[9px_9px] grid-rows-[9px_9px] gap-0.5">
                  <span className="bg-[#f25022]" />
                  <span className="bg-[#7fba00]" />
                  <span className="bg-[#00a4ef]" />
                  <span className="bg-[#ffb900]" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold tracking-[.8px]">SIGN IN WITH MICROSOFT</span>
                  <span className="mt-0.5 block text-[11px] text-white/55">Coming soon</span>
                </span>
              </button>
              <div className="my-6 flex items-center gap-3.5">
                <div className="h-px flex-1 bg-black/12" />
                <div className="text-[10px] tracking-[1.4px] text-subtle">OR</div>
                <div className="h-px flex-1 bg-black/12" />
              </div>
            </>
          ) : (
            <div className="mt-7" />
          )}

          <Tabs
            className="mb-[22px]"
            value={mode}
            onChange={switchMode}
            tabs={[
              { id: 'in', label: 'Sign in' },
              { id: 'up', label: 'Request access' },
            ]}
          />

          <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
            {mode === 'up' ? (
              <TextField label="Full name" placeholder="Ibraaheem Moolla" autoComplete="name" error={errors.fullName?.message} {...field('fullName')} />
            ) : null}
            <TextField
              label="Work email"
              type="email"
              placeholder="you@projectaccountants.co.uk"
              autoComplete="email"
              error={errors.email?.message}
              {...field('email')}
            />
            <div>
              <TextField
                label="Password"
                type="password"
                placeholder="••••••••••"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                error={errors.password?.message}
                hint={mode === 'up' ? `At least ${LIMITS.passwordMin} characters` : undefined}
                {...field('password')}
              />
              {mode === 'in' ? (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => onForgot(getValues('email').trim())}
                    className="cursor-pointer text-[12px] font-medium text-pa-blue-dark underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}
            </div>
            {message ? <AuthAlert>{message}</AuthAlert> : null}
            <Button type="submit" variant="dark" block loading={isSubmitting} className="!py-3.5 !text-[12px] !tracking-[1.4px]">
              {mode === 'in' ? 'Sign in' : 'Request access'}
            </Button>
          </form>
        </>
      )}

      <p className="mt-[22px] text-[12px] leading-5 text-faint">
        Access, roles and designations are managed by the Learning Team. Microsoft single sign-on will be enabled for @projectaccountants.co.uk accounts.
      </p>
    </AuthCard>
  );
}

function ForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { requestPasswordReset, linkError, dismissLinkError } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ email }) => {
    setMessage(null);
    dismissLinkError();
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (err) {
      setMessage(errorMessage(err));
    }
  });

  const back = () => {
    dismissLinkError();
    onBack();
  };

  if (sentTo) {
    return (
      <AuthCard title="Check your email" intro="Follow the link in the email to choose a new password.">
        <div role="status" className="mt-7 bg-panel px-4 py-3.5 text-[13px] leading-6 text-body">
          If there is a Lumen account for <b className="break-all">{sentTo}</b>, we have sent it a password reset link. The link can only be used once and
          expires after a short time, so use it soon. Check your junk folder if it hasn't arrived within a few minutes.
        </div>
        <Button variant="dark" block className="mt-5 !py-3.5 !text-[12px] !tracking-[1.4px]" onClick={back}>
          Back to sign in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" intro="Enter your work email and we'll send you a link to choose a new password.">
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-7 space-y-4">
        {linkError ? <AuthAlert>{linkError}</AuthAlert> : null}
        <TextField
          label="Work email"
          type="email"
          placeholder="you@projectaccountants.co.uk"
          autoComplete="email"
          error={errors.email?.message}
          {...field('email')}
        />
        {message ? <AuthAlert>{message}</AuthAlert> : null}
        <Button type="submit" variant="dark" block loading={isSubmitting} className="!py-3.5 !text-[12px] !tracking-[1.4px]">
          Send reset link
        </Button>
        <button
          type="button"
          onClick={back}
          className="block w-full cursor-pointer text-center text-[12px] font-medium text-pa-blue-dark underline-offset-2 hover:underline"
        >
          Back to sign in
        </button>
      </form>
    </AuthCard>
  );
}
