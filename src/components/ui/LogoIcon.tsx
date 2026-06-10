interface LogoIconProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  const id = `logo-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg
      width={size}
      height={Math.round(size * 1.167)}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id={`og-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.09  0 0 0 0 0.64  0 0 0 0 0.29  0 0 0 0.8 0"
            result="g"/>
          <feMerge>
            <feMergeNode in="g"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id={`bg-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`sf-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a4d2e"/>
          <stop offset="100%" stopColor="#0a2015"/>
        </linearGradient>
      </defs>

      {/* Halo ambiant */}
      <path
        d="M60 6 L14 23 L14 65 C14 94 34 116 60 128 C86 116 106 94 106 65 L106 23 Z"
        fill="#16a34a" fillOpacity="0.12"
        filter={`url(#og-${id})`}
      />

      {/* Corps bouclier */}
      <path
        d="M60 10 L18 26 L18 65 C18 92 37 113 60 124 C83 113 102 92 102 65 L102 26 Z"
        fill={`url(#sf-${id})`}
      />

      {/* Bordure avec glow */}
      <path
        d="M60 10 L18 26 L18 65 C18 92 37 113 60 124 C83 113 102 92 102 65 L102 26 Z"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
        filter={`url(#bg-${id})`}
      />

      {/* Lettre D */}
      <text
        x="60" y="86"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="62"
        fontWeight="900"
        textAnchor="middle"
        fill="white"
        letterSpacing="-2"
      >
        D
      </text>
    </svg>
  )
}
