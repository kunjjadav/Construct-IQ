import { useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import Button from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const variantColors = {
    danger: "text-[var(--color-accent-red)] bg-red-500/10 border-red-500/20",
    warning:
      "text-[var(--color-accent-amber)] bg-amber-500/10 border-amber-500/20",
    primary:
      "text-[var(--color-accent-blue)] bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border-subtle)] shadow-2xl shadow-black/50 overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${variantColors[variant]}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-base">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-subtle)]">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-6"
            ref={cancelRef}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "primary" : "secondary"}
            onClick={onConfirm}
            isLoading={isLoading}
            className={`rounded-xl px-8 shadow-lg ${variant === "danger" ? "bg-[var(--color-accent-red)] hover:bg-red-600 shadow-red-500/20 text-white border-none" : ""}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
