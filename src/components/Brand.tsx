type BrandProps = {
  light?: boolean;
  compact?: boolean;
  monogram?: boolean;
  className?: string;
};

export default function Brand({
  light = false,
  compact = false,
  monogram = false,
  className = "",
}: BrandProps) {
  if (monogram) {
    return (
      <span
        aria-label="CodeCanvas"
        className={`font-display text-2xl font-bold ${light ? "text-brand-foreground" : "text-foreground"} ${className}`}
      >
        C<span className={light ? "text-brand-accent" : "text-primary"}>C</span>
      </span>
    );
  }
  return (
    <span className={`min-w-0 inline-flex items-center gap-3 ${className} *:min-w-0 max-w-full`}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rotate-[-4deg] drop-shadow-[3px_3px_0_var(--color-outline)]"
        aria-hidden="true"
      >
        <path
          d="M7 3h34l4 5v32l-5 5H8l-5-5V8l4-5Z"
          fill="var(--color-secondary)"
          stroke="var(--color-foreground)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M10 8h28l2 3v26l-3 3H11l-3-3V11l2-3Z"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
        <path
          d="M17 24a7 7 0 1 1 14 0c0 3-2 4-3.5 6H20.5C19 28 17 27 17 24Z"
          fill="var(--color-panel)"
          stroke="var(--color-foreground)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M21 34h6M22 38h4"
          stroke="var(--color-foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 11v3M13 17l3 2M35 17l-3 2"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <div className="min-w-0 flex flex-col gap-0 *:min-w-0 max-w-full">
          <span
            className={`font-display text-base sm:text-xl font-bold ${light ? "text-brand-foreground" : "text-foreground"}`}
          >
            Code<span className={light ? "text-brand-accent" : "text-primary"}>Canvas</span>
          </span>
          <span
            className={`-mt-1 text-xs font-black ${light ? "text-brand-accent" : "text-primary"}`}
          >
            by SPECS
          </span>
        </div>
      )}
    </span>
  );
}
