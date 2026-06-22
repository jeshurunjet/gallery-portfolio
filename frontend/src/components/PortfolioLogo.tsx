type PortfolioLogoProps = {
  size?: number;
  className?: string;
  title?: string;
  showWordmark?: boolean;
};

function PortfolioLogo({
  size = 44,
  className,
  title = "JS Portfolio",
  showWordmark = false,
}: PortfolioLogoProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        color: "currentColor",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>

        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="16"
          stroke="currentColor"
          strokeWidth="3"
        />

        <path
          d="M20 18H44"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />

        <path
          d="M25 23V39C25 44.523 29.477 49 35 49C40.523 49 45 44.523 45 39V35"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M42 24C39.239 24 37 26.239 37 29C37 31.761 39.239 34 42 34H44C46.761 34 49 36.239 49 39C49 41.761 46.761 44 44 44"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark ? (
        <span
          style={{
            display: "inline-flex",
            flexDirection: "column",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              letterSpacing: "0.28em",
              fontWeight: 700,
            }}
          >
            JESH
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.22em",
              opacity: 0.7,
              marginTop: "0.32rem",
            }}
          >
            SANCHEZ
          </span>
        </span>
      ) : null}
    </span>
  );
}

export default PortfolioLogo;
