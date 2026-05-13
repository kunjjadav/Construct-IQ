interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // Usually a Button
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-bg-app)]">
      <div className="w-16 h-16 mb-6 rounded-full bg-[var(--color-bg-interactive)] flex items-center justify-center border border-[var(--color-border-strong)]">
        <svg
          aria-hidden="true"
          focusable="false"
          className="w-8 h-8 text-[var(--color-text-muted)] opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <h3 className="heading-sm text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="body-text text-[var(--color-text-muted)] max-w-sm mb-6">
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
