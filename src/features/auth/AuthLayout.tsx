import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}

/** Split screen used by sign-in, forgot password and set-new-password: animated navy brand panel + form card. */
export function AuthLayout(props: AuthLayoutProps) {
  return (
    <AuthShell>
      <AuthCard {...props} />
    </AuthShell>
  );
}

/**
 * The page frame with the brand panel. Keep one shell mounted while switching between
 * forms (sign in ↔ forgot password) so its intro animation doesn't replay.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="pa-login-shell grid min-h-screen animate-fade-in bg-white lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <section className="pa-login-hero flex flex-col justify-between gap-10 overflow-hidden bg-ink px-6 py-10 sm:px-12 lg:min-h-screen lg:py-14">
        <div className="animate-soft-in">
          <img src="/brand/lumen-horizontal-white.svg" alt="Lumen by Project Accountants" className="block h-auto w-[210px]" />
        </div>
        <div>
          <div className="mb-[22px] animate-soft-in text-[13px] font-medium tracking-[1.3px] text-white/35 [animation-delay:.3s]">LEARNING &amp; CPD</div>
          <div className="-mb-2.5 overflow-hidden pb-2.5">
            <div className="animate-reveal text-[clamp(38px,4vw,54px)] font-semibold leading-[1.12] tracking-[-1.4px] text-white [animation-delay:.45s]">Learning</div>
          </div>
          <div className="-mb-3 overflow-hidden pb-3">
            <div className="animate-reveal text-[clamp(38px,4vw,54px)] font-semibold leading-[1.12] tracking-[-1.4px] text-white [animation-delay:.6s]">on Record</div>
          </div>
          <div className="my-[26px] h-0.5 w-[100px] origin-left animate-rule bg-white [animation-delay:1.05s]" />
          <p className="max-w-[360px] animate-soft-in text-[16px] leading-7 text-white/70 [animation-delay:1.25s]">All your learning and CPD in one place</p>
        </div>
        <div className="hidden animate-soft-in [animation-delay:1.55s] lg:block">
          <div className="h-0.5 overflow-hidden bg-white/15">
            <div className="h-full w-full origin-left animate-rule bg-pa-blue [animation-delay:1.6s] [animation-duration:1.8s]" />
          </div>
        </div>
      </section>

      <section className="pa-login-right flex items-center justify-center px-6 py-10 sm:p-12">{children}</section>
    </div>
  );
}

/** The white form card: heading, one-line intro, then the form. */
export function AuthCard({ title, intro, children }: AuthLayoutProps) {
  return (
    <div className="pa-login-box w-full max-w-[420px] p-6 sm:p-9 animate-fade-up [animation-delay:.12s]">
      <h1 className="text-[32px] font-semibold tracking-[-0.6px] text-ink">{title}</h1>
      <p className="mt-2 text-[14px] leading-6 text-[rgba(38,39,25,.6)]">{intro}</p>
      {children}
    </div>
  );
}

/** Red message box used under auth forms. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="bg-panel px-3.5 py-[11px] text-[13px] leading-5 text-pa-red">
      {children}
    </div>
  );
}
