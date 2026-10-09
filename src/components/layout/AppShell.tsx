import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PRIMARY_NAV, isNavItemActive, type NavItem } from './navigation';
import { useNavShortcuts } from './useNavShortcuts';
import { LoadingPanel } from '@/components/ui/Feedback';

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-btn text-btn-ink font-display text-caption flex size-6 items-center justify-center rounded-full font-semibold"
      >
        q
      </span>
      <span className="font-display text-card font-semibold tracking-tight">
        Quizeasy
      </span>
    </span>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {PRIMARY_NAV.map((item) => {
        const active = isNavItemActive(pathname, item);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`nav-item ${active ? 'nav-item-active' : 'nav-item-idle'}`}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon aria-hidden="true" className="size-4.5 shrink-0" />
            <span>{item.label}</span>
            {item.chord ? (
              <span
                aria-hidden="true"
                className="ml-auto flex items-center gap-1"
              >
                <kbd className="keycap">G</kbd>
                <kbd className="keycap">{item.chord}</kbd>
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="border-line bg-sidebar fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] nav:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map((item: NavItem) => {
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`nav-item-mobile ${
                  active ? 'nav-item-mobile-active' : 'nav-item-mobile-idle'
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
  useNavShortcuts();

  return (
    <div className="bg-canvas min-h-full">
      <a
        href="#main-content"
        className="bg-surface border-line rounded-control sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="nav:flex">
        <aside className="border-line bg-sidebar nav:sticky nav:top-0 nav:flex nav:h-screen nav:w-58 hidden shrink-0 border-r px-4 py-6 nav:flex-col nav:gap-8">
          <Wordmark />
          <DesktopNav pathname={pathname} />
          <p className="text-caption text-muted mt-auto">
            Your sets stay on this device. No account, no server.
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-line nav:hidden flex items-center border-b px-4 py-3">
            <Wordmark />
          </header>

          <main
            id="main-content"
            className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 pb-28 sm:px-6 nav:px-14 nav:py-12 nav:pb-12"
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
