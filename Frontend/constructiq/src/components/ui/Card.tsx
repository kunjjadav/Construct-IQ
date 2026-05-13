type CardVariant = "surface" | "elevated" | "interactive" | "transparent";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  surface: `
    bg-[var(--color-bg-surface)] 
    border border-[var(--color-border-subtle)]
  `,
  elevated: `
    bg-[var(--color-bg-elevated)] 
    border border-[var(--color-border-strong)]
    shadow-lg
  `,
  interactive: `
    bg-[var(--color-bg-surface)] 
    border border-[var(--color-border-subtle)]
    hover:border-[var(--color-border-strong)]
    hover:bg-[var(--color-bg-interactive)]
    hover:-translate-y-0.5
    cursor-pointer
    transition-[border-color,background-color] duration-200 ease-out
  `,
  transparent: `
    bg-transparent border-transparent
  `,
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-5 sm:p-8",
};

export default function Card({
  variant = "surface",
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-xl)]
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
