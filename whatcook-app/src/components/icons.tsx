interface IconProps {
  color?: string;
  size?: number;
}

export function BackIcon({ color = 'var(--text-main)', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function SearchIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function CheckIcon({ color = '#fff', size = 10 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function MenuIcon({ color = 'var(--text-main)', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function FilterIcon({ color = 'var(--text-main)', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function PotIcon({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h16l-1.2 9.3A2 2 0 0116.8 20H7.2a2 2 0 01-2-1.7L4 9z" />
      <path d="M2 9h20M8 9V6m8 3V6M9 3l1 3m5-3l-1 3" />
    </svg>
  );
}

export function BookmarkIcon({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
    </svg>
  );
}

export function CommunityIcon({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0111 0" />
      <path d="M16 6.5a3 3 0 010 5.5M17 20a5.5 5.5 0 00-3.5-5.1" />
    </svg>
  );
}

export function UserIcon({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

export function ShieldIcon({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function LogoutIcon({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3H6a1 1 0 00-1 1v16a1 1 0 001 1h9" />
      <path d="M11 12h10M18 8l4 4-4 4" />
    </svg>
  );
}

export function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 14.1 6 6 14.1 6 24s8.1 18 18 18c9.9 0 18-8.1 18-18 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M8.3 14.7l6.6 4.8C16.7 15.1 20 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 16.5 6 10 10.3 8.3 14.7z" />
      <path fill="#4CAF50" d="M24 42c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 33.1 26.7 34 24 34c-5.2 0-9.6-3.3-11.3-8l-6.5 5C7.9 37.6 15.3 42 24 42z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.3C40.9 36.3 44 31 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function HeartIcon({ color = 'var(--text-main)', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

export function ClockIcon({ color = 'var(--primary)', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function DifficultyIcon({ color = 'var(--primary)', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 20l4-12 4 12M12 20l4-16 4 16" />
    </svg>
  );
}

export function CaloriesIcon({ color = 'var(--primary)', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
