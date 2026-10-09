import {
  BookOpen,
  ClipboardPaste,
  Library,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Matching is prefix based so nested routes keep the item active. */
  match: string[];
  /**
   * Second key of the `G` chord that jumps here, shown as a keycap hint.
   * Declared next to the destination so the hint and the binding cannot drift.
   */
  chord?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Library', icon: Library, match: ['/sets'], chord: 'L' },
  {
    to: '/import',
    label: 'Import',
    icon: ClipboardPaste,
    match: [],
    chord: 'I',
  },
  {
    to: '/study',
    label: 'Study',
    icon: BookOpen,
    match: ['/study'],
    chord: 'S',
  },
  { to: '/guide', label: 'Guide', icon: Sparkles, match: [] },
  { to: '/settings', label: 'Settings', icon: Settings, match: [] },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/' || pathname.startsWith('/sets');
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
