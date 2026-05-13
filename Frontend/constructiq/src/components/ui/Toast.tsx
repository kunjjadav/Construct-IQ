import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCount = 0;

// eslint-disable-next-line react-refresh/only-export-components
export const toast = (message: string, type: ToastType = "info") => {
  const id = ++toastIdCount;
  const event = new CustomEvent("constructiq-toast", {
    detail: { id, message, type },
  });
  window.dispatchEvent(event);
};

const styleMap: Record<ToastType, string> = {
  success:
    "border-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald-dim)] text-[var(--color-accent-emerald)]",
  error:
    "border-[var(--color-accent-red)] bg-[var(--color-accent-red-dim)] text-[var(--color-accent-red)]",
  warning:
    "border-[var(--color-accent-amber)] bg-[var(--color-accent-amber-dim)] text-[var(--color-accent-amber)]",
  info: "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-dim)] text-[var(--color-accent-blue)]",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

    const handleAdd = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      setToasts((prev) => [...prev, customEvent.detail]);

      const timerId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== customEvent.detail.id));
        timeoutIds.delete(timerId);
      }, 4000);
      timeoutIds.add(timerId);
    };

    window.addEventListener("constructiq-toast", handleAdd);
    return () => {
      window.removeEventListener("constructiq-toast", handleAdd);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 min-w-[300px] p-4
            rounded-[var(--radius-lg)] border backdrop-blur-md
            shadow-xl animate-slide-in
            ${styleMap[t.type]}
          `}
        >
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
