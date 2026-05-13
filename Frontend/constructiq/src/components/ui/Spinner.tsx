interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`
          ${sizeMap[size]}
          rounded-full animate-spin
          border-solid border-[var(--color-border-strong)]
          border-t-[var(--color-accent-cyan)]
        `}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
