import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PRIMARY_NAV, isNavItemActive, type NavItem } from './navigation';
import { LoadingPanel } from '@/components/ui/Feedback';

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white"
      >
        Q
      </span>
      <span className="text-lg font-semibold tracking-tight">Quizeasy</span>
    </span>
  );
}

function navItemClasses(active: boolean): string {
  return `nav-item ${active ? 'nav-item-active' : 'nav-item-idle'}`;
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {PRIMARY_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navItemClasses(isNavItemActive(pathname, item))}
          aria-current={isNavItemActive(pathname, item) ? 'page' : undefined}
        >
          <item.icon aria-hidden="true" className="size-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map((item: NavItem) => {
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium ${
                  active
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <item.icon aria-hidden="true" className="size-5" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg dark:focus:bg-slate-900"
      >
        Skip to content
      </a>

      <div className="lg:flex">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6 dark:border-slate-800 dark:bg-slate-900">
          <Wordmark />
          <DesktopNav pathname={pathname} />
          <p className="mt-auto text-xs text-slate-500 dark:text-slate-400">
            Your sets stay in this browser. No account, no server.
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            <Wordmark />
          </header>

          <main
            id="main-content"
            className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-10 lg:pt-8"
          >
            <Suspense fallback={<LoadingPanel label="Loading…" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      <MobileNav pathname={pathname} />
    </div>
  );
}
