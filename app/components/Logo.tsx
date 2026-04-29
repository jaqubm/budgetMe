interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 28 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="32" height="32" rx="8" fill="var(--text)" />
      <rect x="4"  y="20"   width="6" height="9"    rx="2" fill="white" opacity="0.50" />
      <rect x="13" y="13.5" width="6" height="15.5" rx="2" fill="white" opacity="0.78" />
      <rect x="22" y="7"    width="6" height="22"   rx="2" fill="white" />
    </svg>
  );
}
