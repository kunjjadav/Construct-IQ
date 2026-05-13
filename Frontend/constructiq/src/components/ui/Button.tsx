
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-accent-cyan)] text-[var(--color-bg-app)]
    hover:opacity-90 active:opacity-80
    font-semibold
  `,
  secondary: `
    bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]
    border border-[var(--color-border-strong)]
    hover:bg-[var(--color-bg-interactive)] active:opacity-80
    font-medium
  `,
  ghost: `
    bg-transparent text-[var(--color-text-secondary)]
    hover:bg-[var(--color-bg-interactive)] hover:text-[var(--color-text-primary)]
    active:opacity-80
    font-medium
  `,
  destructive: `
    bg-[var(--color-accent-red-dim)] text-[var(--color-accent-red)]
    border border-[var(--color-accent-red)]
    hover:bg-[var(--color-accent-red)] hover:text-white
    active:opacity-80
    font-semibold
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8  px-3 text-xs  rounded-[var(--radius-md)]",
  md: "h-9  px-4 text-sm  rounded-[var(--radius-md)]",
  lg: "h-11 px-6 text-base rounded-[var(--radius-lg)]",
};

function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <svg
      className={`${dim} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}


const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      children,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          transition-opacity transition-colors duration-150 ease-out
          cursor-pointer select-none whitespace-nowrap
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...rest}
      >
        {isLoading && <Spinner size={size} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
