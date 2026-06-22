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
    <span className={className}>
      <svg
        className="portfolio-logo-mark"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <path
          d="M24.8 18.9 24.8 18.9l-9.2 10.3 0 0c-1.4 1.5-3.4 2.5-5.7 2.5-4.3 0-7.8-3.5-7.8-7.8s3.5-7.8 7.8-7.8c2.4 0 4.1 1.3 6 2.8l0 0"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeMiterlimit="10"
        />
        <path
          d="M23.2 29.1 23.2 29.1l9.2-10.3 0 0c1.4-1.5 3.4-2.5 5.7-2.5 4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8c-2.4 0-4.1-1.3-6-2.8l0 0"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeMiterlimit="10"
        />
      </svg>

      {showWordmark ? (
        <span className="portfolio-logo-wordmark" aria-hidden="true">
          <span className="portfolio-logo-name">JESH SANCHEZ</span>
        </span>
      ) : null}
    </span>
  );
}

export default PortfolioLogo;
