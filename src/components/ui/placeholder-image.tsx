"use client";

type PlaceholderImageProps = {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
};

export function PlaceholderImage({
  width = 800,
  height = 600,
  text = "Placeholder",
  className = "",
}: PlaceholderImageProps) {
  return (
    <div
      className={`relative flex items-center justify-center bg-muted ${className}`}
      style={{ aspectRatio: width / height }}
    >
      <svg
        aria-label={text}
        className="absolute inset-0 h-full w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>{text}</title>
        {/* Background gradient */}
        <defs>
          <linearGradient id="bg-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </linearGradient>
        </defs>
        <rect fill="url(#bg-gradient)" height="100%" width="100%" />

        {/* Decorative elements */}
        <circle
          cx={width * 0.3}
          cy={height * 0.4}
          fill="none"
          r={Math.min(width, height) * 0.15}
          stroke="#2a2a2a"
          strokeWidth="1"
        />
        <circle
          cx={width * 0.7}
          cy={height * 0.6}
          fill="none"
          r={Math.min(width, height) * 0.1}
          stroke="#2a2a2a"
          strokeWidth="1"
        />

        {/* Text */}
        <text
          dominantBaseline="middle"
          fill="#404040"
          fontFamily="system-ui, sans-serif"
          fontSize={Math.min(width, height) * 0.04}
          letterSpacing="0.1em"
          textAnchor="middle"
          x="50%"
          y="50%"
        >
          {text.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
