
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FocusViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const PANEL_VARIANTS = {
  hidden: {
    x: "100%",
    opacity: 0.3,
    scale: 0.98,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 30,
      stiffness: 300,
      mass: 0.8,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    scale: 0.96,
    transition: {
      type: "spring" as const,
      damping: 35,
      stiffness: 400,
      mass: 0.6,
    },
  },
};

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

export default function FocusView({
  isOpen,
  onClose,
  title,
  children,
}: FocusViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusableElements =
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              variants={PANEL_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-screen max-w-2xl bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)] shadow-2xl flex flex-col h-full will-change-transform"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-surface)]">
                <h2 className="heading-lg text-[var(--color-text-primary)]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] rounded-[var(--radius-full)] transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className="w-5 h-5"
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

              <div className="flex-1 overflow-y-auto w-full p-6 text-[var(--color-text-secondary)]">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
