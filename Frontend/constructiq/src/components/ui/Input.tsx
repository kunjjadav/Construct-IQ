import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, disabled, required, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`
              text-sm font-medium
              ${disabled ? "text-[var(--color-text-disabled)]" : "text-[var(--color-text-secondary)]"}
            `}
          >
            {label}
            {required && (
              <span className="text-[var(--color-accent-red)] ml-1">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={`
            h-10 px-3 rounded-[var(--radius-md)] text-base
            bg-[var(--color-bg-app)] text-[var(--color-text-primary)]
            border transition-colors duration-150 ease-out
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-50

            /* Conditional styling based on error state */
            ${
              error
                ? "border-[var(--color-accent-red)] focus:ring-[var(--color-accent-red)] focus:border-[var(--color-accent-red)]"
                : "border-[var(--color-border-strong)] focus:border-[var(--color-border-focus)] focus:ring-[var(--color-border-focus)]"
            }
          `}
          {...rest}
        />

        {error && (
          <span
            role="alert"
            aria-live="polite"
            className="text-xs font-medium text-[var(--color-accent-red)] mt-0.5 animate-pulse"
          >
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
