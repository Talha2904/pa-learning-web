import { Drawer } from '@mui/material';
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router';
import { PageSkeleton } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { Sidebar } from './Sidebar';

const COLLAPSE_KEY = 'pa-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Fixed sidebar on desktop (collapsible to an icon rail); top bar + slide-in drawer below 1024px. */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable - collapse still works for this session */
      }
      return next;
    });
  };

  return (
    <div className="pa-app-shell flex h-screen overflow-hidden">
      <aside
        className={cn(
          'pa-sidebar-rail sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block',
          collapsed ? 'w-[48px]' : 'w-[260px]',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 280, borderRadius: '0 20px 20px 0', background: '#0d1a33' } } }}
        sx={{ display: { lg: 'none' } }}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </Drawer>

      <div className="pa-workspace flex min-w-0 flex-1 flex-col min-h-0">
        <div className="pa-mobile-topbar flex items-center justify-between gap-3 px-4 py-3 text-white lg:hidden">
          <img src="/brand/lumen-horizontal-white.svg" alt="Lumen by Project Accountants" className="block h-auto w-[132px]" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex size-9 cursor-pointer flex-col items-center justify-center gap-[5px] border border-white/25"
          >
            <span className="block h-[1.5px] w-4 bg-white" />
            <span className="block h-[1.5px] w-4 bg-white" />
            <span className="block h-[1.5px] w-4 bg-white" />
          </button>
        </div>
        <div className="pa-content-scroll min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-7"><PageSkeleton /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
