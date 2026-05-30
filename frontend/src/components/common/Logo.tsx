interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-3xl" },
}

export function Logo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="logo-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Basket body */}
        <path
          d="M8 20L12 38C12.5 40 14 41 16 41H32C34 41 35.5 40 36 38L40 20"
          stroke="url(#logo-grad-1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Basket handle */}
        <path
          d="M14 20C14 12 18 7 24 7C30 7 34 12 34 20"
          stroke="url(#logo-grad-2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Basket rim */}
        <line
          x1="6"
          y1="20"
          x2="42"
          y2="20"
          stroke="url(#logo-grad-1)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lightning bolt */}
        <path
          d="M26 16L22 25H27L23 34"
          stroke="url(#logo-grad-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logo-glow)"
        />
        {/* Orbit dots */}
        <circle cx="10" cy="15" r="1.5" fill="#8B5CF6" opacity="0.6" />
        <circle cx="38" cy="15" r="1.5" fill="#3B82F6" opacity="0.6" />
      </svg>
      {!iconOnly && (
        <span className={`font-display font-bold ${s.text} tracking-tight`}>
          <span className="gradient-text">Urban</span>
          <span className="text-surface-200">Basket</span>
        </span>
      )}
    </div>
  )
}
