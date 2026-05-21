type RoomLogoProps = {
  className?: string;
  compact?: boolean;
};

export function RoomLogo({ className = "", compact = false }: RoomLogoProps) {
  return (
    <div
      className={`room-logo flex items-center justify-center rounded-full border border-ember/25 bg-card text-ink shadow-sm ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" role="img">
        <rect x="25" y="24" width="70" height="50" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M25 44h70M60 24v50" stroke="currentColor" strokeWidth="2" opacity="0.45" />
        <path d="M27 86h66" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M38 86v13M82 86v13" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 79h40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        <path d="M48 72c5-4 19-4 24 0" fill="none" stroke="var(--ember)" strokeWidth="3" strokeLinecap="round" />
        {!compact ? (
          <>
            <circle cx="88" cy="33" r="10" fill="var(--paper)" stroke="var(--ember)" strokeWidth="2" />
            <text
              x="88"
              y="37"
              textAnchor="middle"
              className="fill-ember font-mono text-[10px]"
            >
              Д
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
