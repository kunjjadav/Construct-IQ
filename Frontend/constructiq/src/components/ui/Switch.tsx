interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled,
  label,
}: SwitchProps) {
  return (
    <label
      className={`relative inline-flex items-center group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`w-11 h-6 rounded-full transition-all duration-300 ease-in-out border
          ${
            checked
              ? "bg-[var(--color-accent-emerald-dim)] border-[var(--color-accent-emerald)]"
              : "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]"
          }
          group-hover:border-[var(--color-accent-blue)]
        `}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-300 transform
            ${
              checked
                ? "translate-x-5 bg-[var(--color-accent-emerald)] shadow-[0_0_8px_var(--color-accent-emerald)]"
                : "translate-x-0 bg-[var(--color-text-muted)]"
            }
          `}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
