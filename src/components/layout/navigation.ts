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
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Library', icon: Library, match: ['/sets'] },
  { to: '/import', label: 'Import', icon: ClipboardPaste, match: [] },
  { to: '/study', label: 'Study', icon: BookOpen, match: ['/study'] },
  { to: '/guide', label: 'Guide', icon: Sparkles, match: [] },
  { to: '/settings', label: 'Settings', icon: Settings, match: [] },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/' || pathname.startsWith('/sets');
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
