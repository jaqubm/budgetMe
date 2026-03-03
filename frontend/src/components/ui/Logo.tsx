interface LogoMarkProps {
  size?: number
  className?: string
}

/** Geometric "bM" logotype — a square bracket with a descending stroke */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer bracket shape */}
      <rect x="1" y="1" width="30" height="30" rx="3" stroke="#a78bfa" strokeWidth="1.5" />
      {/* "b" stroke */}
      <path
        d="M9 8v16M9 16h7a3 3 0 0 1 0 6H9"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* "M" strokes */}
      <path
        d="M20 22V12l4 5 4-5v10"
        stroke="#f0f0f6"
        strokeWidth="1.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: { mark: 20, text: 'text-base' }, md: { mark: 28, text: 'text-xl' }, lg: { mark: 40, text: 'text-3xl' } }

export function LogoWordmark({ size = 'md', className }: LogoWordmarkProps) {
  const { mark, text } = sizeMap[size]
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={mark} />
      <span className={`${text} font-semibold tracking-tight`}>
        <span className="text-text">budget</span>
        <span className="text-accent">Me</span>
      </span>
    </div>
  )
}
