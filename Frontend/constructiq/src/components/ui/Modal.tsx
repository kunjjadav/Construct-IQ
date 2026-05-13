import React, { useEffect, useId } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const titleId = useId();
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // matches animate-slide-down duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const isClosing = !isOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`glass-panel relative z-10 w-full max-w-lg p-6 rounded-[var(--radius-2xl)] shadow-2xl ${
          isClosing ? "animate-slide-down" : "animate-slide-up"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id={titleId}
            className="heading-lg text-[var(--color-text-primary)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            aria-label="Close modal"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="text-[var(--color-text-secondary)]">{children}</div>
      </div>


    </div>
  );
}
