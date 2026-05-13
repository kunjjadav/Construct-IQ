
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center">
          <div className="w-16 h-16 bg-[var(--color-accent-red-dim)] rounded-full flex items-center justify-center">
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-8 h-8 text-[var(--color-accent-red)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md">
              An unexpected error occurred. This has been logged for review.
            </p>
            {this.state.error && (
              <code className="text-xs text-[var(--color-accent-red)] bg-[var(--color-bg-interactive)] p-2 rounded-[var(--radius-md)] mt-2 max-w-lg overflow-auto">
                {this.state.error.message}
              </code>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-[var(--color-accent-blue)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
