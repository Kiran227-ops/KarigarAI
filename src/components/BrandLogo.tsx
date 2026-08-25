type BrandLogoProps = {
  showWordmark?: boolean;
  className?: string;
  iconClassName?: string;
};

export default function BrandLogo({
  showWordmark = true,
  className = '',
  iconClassName = '',
}: BrandLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox="0 0 220 150"
        className={`h-16 w-auto shrink-0 ${iconClassName}`}
        aria-label="KarigarAI logo"
        role="img"
      >
        <defs>
          <linearGradient id="karigarGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0fe39a" />
            <stop offset="40%" stopColor="#27d59d" />
            <stop offset="100%" stopColor="#11a56d" />
          </linearGradient>
          <linearGradient id="karigarLeaf" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#7af7c8" />
            <stop offset="100%" stopColor="#16b76b" />
          </linearGradient>
        </defs>

        <path
          d="M36 22V112M36 68L101 22M36 68L101 112"
          stroke="url(#karigarGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <circle cx="66" cy="38" r="10" fill="none" stroke="#0d1b17" strokeWidth="4" opacity="0.9" />
        <path
          d="M112 28C148 12 178 25 186 45C193 64 177 88 148 96C131 85 118 63 112 28Z"
          fill="url(#karigarLeaf)"
          opacity="0.95"
        />

        <path
          d="M122 20C160 18 178 32 184 52C169 49 152 53 138 65C127 60 120 49 122 20Z"
          fill="#c9ffe6"
          opacity="0.45"
        />
      </svg>

      {showWordmark && (
        <div className="ml-[-8px] select-none text-4xl font-bold tracking-[-0.08em] text-transparent bg-gradient-to-r from-[#1edca5] via-[#3fd7a4] to-[#0ea867] bg-clip-text drop-shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          KarigarAI
        </div>
      )}
    </div>
  );
}
