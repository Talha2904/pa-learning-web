import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { navFor, type NavItem } from '@/app/navigation';
import { Avatar } from '@/components/ui/bits';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth, useMe } from '@/features/auth/AuthProvider';
import { useItems } from '@/features/learning-items/api';
import { useMyPlan } from '@/features/my-learning/api';
import { cn } from '@/lib/cn';

function useBadges(manageItems: boolean): Record<NonNullable<NavItem['badge']>, number> {
  const plan = useMyPlan();
  const items = useItems({ enabled: manageItems });
  return {
    myPending: plan.data?.summary.outstanding ?? 0,
    templateCount: items.data?.length ?? 0,
  };
}

interface SidebarProps {
  /** Narrow icon-rail mode (desktop). */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

/** The prototype's black sidebar: brand, signed-in person, navigation, sign-out. */
export function Sidebar({ collapsed = false, onToggleCollapse, onNavigate }: SidebarProps) {
  const { profile, permissions } = useMe();
  const { signOut } = useAuth();
  const badges = useBadges(permissions.manageItems);
  const sections = navFor(permissions);
  const [tip, setTip] = useState<{ label: string; sub: string; top: number } | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const showTip = (label: string, sub: string) => (e: { currentTarget: HTMLAnchorElement }) => {
    if (!collapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, sub, top: r.top + r.height / 2 });
  };

  return (
    <div className="pa-sidebar flex h-full flex-col text-white">
      <div className={cn('pa-sidebar-brand flex items-center gap-3 border-b border-white/10', collapsed ? 'justify-center px-1.5 py-3' : 'px-5 py-[22px]')}>
        <img src="/brand-mark.png" alt="" className={cn('block h-auto shrink-0', collapsed ? 'w-[24px]' : 'w-[34px]')} />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold tracking-[1.3px]">PROJECT ACCOUNTANTS</div>
            <div className="text-[10px] tracking-[1.3px] text-white/40">LEARNING PLATFORM</div>
          </div>
        )}
      </div>

      <div className={cn('pa-sidebar-profile flex items-center gap-3 border-b border-white/10', collapsed ? 'justify-center px-1 py-2.5' : 'px-5 py-[18px]')}>
        <Avatar initials={profile.initials} color={profile.avatarColor} size={collapsed ? 28 : 38} />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{profile.fullName}</div>
            <div className="mt-0.5 truncate text-[10px] uppercase tracking-[1.2px] text-white/50">{profile.designation?.name ?? 'No designation'}</div>
          </div>
        )}
      </div>

      <nav aria-label="Main" className="pa-sidebar-nav flex-1 overflow-y-auto py-3.5">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className={cn(i > 0 && 'mt-3 border-t border-white/10 pt-3')}>
            {section.title && !collapsed ? (
              <div className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[1.3px] text-white/30">{section.title}</div>
            ) : null}
            {section.items.map((item) => {
              const badge = item.badge ? badges[item.badge] : 0;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  aria-label={item.label}
                  onMouseEnter={showTip(item.label, item.sub)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={showTip(item.label, item.sub)}
                  onBlur={() => setTip(null)}
                  className={({ isActive }) =>
                    cn(
                      'pa-nav-link flex items-center transition-colors hover:bg-white/5 hover:text-white',
                      collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-5 py-[11px]',
                      isActive ? 'bg-white/10 text-white' : 'text-white/70',
                    )
                  }
                >
                  <Icon size={collapsed ? 20 : 19} strokeWidth={1.8} className="shrink-0" aria-hidden />
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{item.label}</div>
                      <div className="mt-px text-[10px] text-white/35">{item.sub}</div>
                    </div>
                  )}
                  {!collapsed && badge > 0 ? (
                    <span className="bg-pa-blue px-[7px] py-0.5 text-[10px] font-semibold text-ink">{badge}</span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {onToggleCollapse && (
        <div className={cn('border-t border-white/10 py-3', collapsed ? 'px-1.5' : 'px-5')}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 border border-white/15 py-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-white/70 transition-colors hover:border-white/40 hover:text-white',
              collapsed ? 'justify-center px-0' : 'px-2.5',
            )}
          >
            {collapsed ? <ChevronsRight size={16} aria-hidden /> : (<><ChevronsLeft size={16} aria-hidden /> Collapse</>)}
          </button>
        </div>
      )}

      <div className={cn('pa-sidebar-footer border-t border-white/10 py-4', collapsed ? 'px-1.5' : 'px-5')}>
        {!collapsed && (
          <>
            <div className="mb-1 text-[10px] uppercase tracking-[1.2px] text-white/30">Signed in as</div>
            <div className="mb-3 break-all text-[10px] text-white/40">{profile.email}</div>
          </>
        )}
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'cursor-pointer border border-white/25 text-[10px] font-semibold uppercase tracking-[1.1px] text-white/80 transition-colors hover:border-white hover:text-white',
            collapsed ? 'flex w-full items-center justify-center px-0 py-[9px]' : 'w-full px-2.5 py-[9px]',
          )}
        >
          {collapsed ? <LogOut size={16} aria-hidden /> : 'Sign out'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        confirmLabel="Sign out"
        tone="primary"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          void signOut();
        }}
      >
        You will be signed out of the learning platform. You can sign back in any time.
      </ConfirmDialog>

      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[100] -translate-y-1/2 animate-fade-in whitespace-nowrap bg-ink px-3 py-2 text-white shadow-modal"
          style={{ left: 56, top: tip.top }}
        >
          <div className="text-[12px] font-medium leading-4">{tip.label}</div>
          <div className="mt-0.5 text-[10px] leading-4 text-white/55">{tip.sub}</div>
        </div>
      )}
    </div>
  );
}
